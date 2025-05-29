import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { DebugMenu } from './debug.js';
import { GameMenu } from './menu.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GameOverScreen } from './gameOverScreen.js';
import { VictoryScreen } from './victoryScreen.js';
import { PauseMenu } from './pauseMenu.js';
import { SoundManager } from './soundManager.js';
import { ITEM_TYPES } from './items.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.time = 0;
        this.player = null;
        this.level = null;
        this.isRunning = false;
        this.isPaused = false;
        this.stats = null;
        this.lastTimeStamp = 0;
        this.countdownElement = null;
        this.debugMenu = new DebugMenu(this);
        
        // Inicializar gerenciador de sons
        this.soundManager = new SoundManager();
        
        // Música de fundo
        this.backgroundMusic = new Audio('https://files.catbox.moe/5q4ifm.mp3');
        this.backgroundMusic.loop = true;
        
        // Initialize menu first
        this.menu = new GameMenu(this);
        
        // Carregar volume salvo
        const savedOptions = localStorage.getItem('gameOptions');
        const options = savedOptions ? JSON.parse(savedOptions) : { volume: 0.5 };
        this.setVolume(options.volume);
        
        this.createCountdownElement();

        // Mod menu state
        this.modMenuVisible = false;
        this.mods = {
            invincible: false,
            speedBoost: false
        };
        this.selectedModIndex = 0;
        
        this.initModMenu();

        // Bind keyboard events for mod menu
        document.addEventListener('keydown', (e) => {
            // Pausar com tecla P
            if (e.key.toLowerCase() === 'p' && this.isRunning) {
                if (this.isPaused) {
                    this.resume();
                } else {
                    this.pause();
                }
            }
            
            // Pausar com tecla ESC
            if (e.key === 'Escape' && this.isRunning) {
                if (!this.isPaused) {
                    console.log('ESC key pressed - pausing game');
                    this.pause();
                }
            }

            // Toggle mod menu
            if (e.key === 'Insert') {
                this.toggleModMenu();
            }

            // Mod menu navigation
            if (this.modMenuVisible) {
                switch (e.key) {
                    case 'ArrowUp':
                        this.selectedModIndex = Math.max(0, this.selectedModIndex - 1);
                        this.updateModMenuSelection();
                        break;
                    case 'ArrowDown':
                        this.selectedModIndex = Math.min(Object.keys(this.mods).length - 1, this.selectedModIndex + 1);
                        this.updateModMenuSelection();
                        break;
                    case 'Enter':
                        this.toggleSelectedMod();
                        break;
                }
            }
        });

        // Add game over and victory screens
        this.gameOverScreen = null;
        this.victoryScreen = new VictoryScreen(this);
        
        this.activePowerups = {
            speed: false,
            invincible: false,
        };
        this.powerupTimers = {
            speed: 0,
            invincible: 0,
        };

        this.init();
    }

    createCountdownElement() {
        this.countdownElement = document.createElement('div');
        this.countdownElement.style.position = 'fixed';
        this.countdownElement.style.top = '50%';
        this.countdownElement.style.left = '50%';
        this.countdownElement.style.transform = 'translate(-50%, -50%)';
        this.countdownElement.style.fontSize = '120px';
        this.countdownElement.style.fontFamily = "'Press Start 2P', monospace";
        this.countdownElement.style.color = '#ff69b4';
        this.countdownElement.style.textShadow = '0 0 20px #ff69b4';
        this.countdownElement.style.zIndex = '1000';
        this.countdownElement.style.display = 'none';
        this.countdownElement.style.animation = 'pulseNumber 0.5s ease-in-out';
        document.body.appendChild(this.countdownElement);

        // Adicionar estilo de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulseNumber {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    initModMenu() {
        // Create mod menu container
        const modMenu = document.createElement('div');
        modMenu.id = 'mod-menu';
        modMenu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ff0055;
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: 'Arial', sans-serif;
            display: none;
            z-index: 1000;
        `;

        // Create menu title
        const title = document.createElement('h2');
        title.textContent = 'Mod Menu';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #ff0055;
            text-align: center;
        `;
        modMenu.appendChild(title);

        // Create mod options
        const modOptions = [
            { name: 'invincible', label: 'Invincible', description: 'Toggle invincibility' },
            { name: 'speedBoost', label: 'Speed Boost', description: 'Toggle increased movement speed' }
        ];

        modOptions.forEach((mod, index) => {
            const modDiv = this.createModOption(mod.label, mod.name, mod.description);
            modDiv.dataset.index = index;
            modMenu.appendChild(modDiv);
        });

        document.body.appendChild(modMenu);
        this.modMenuElement = modMenu;
    }

    createModOption(label, property, description) {
        const container = document.createElement('div');
        container.className = 'mod-option';
        container.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
            transition: background-color 0.2s;
        `;

        const toggle = document.createElement('div');
        toggle.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = property;
        checkbox.style.marginRight = '10px';

        const labelElement = document.createElement('label');
        labelElement.htmlFor = property;
        labelElement.textContent = label;
        labelElement.style.cursor = 'pointer';

        const desc = document.createElement('div');
        desc.textContent = description;
        desc.style.cssText = `
            font-size: 12px;
            color: #888;
        `;

        toggle.appendChild(checkbox);
        toggle.appendChild(labelElement);
        container.appendChild(toggle);
        container.appendChild(desc);

        return container;
    }

    updateModMenuSelection() {
        // Remove highlight from all options
        const options = this.modMenuElement.querySelectorAll('.mod-option');
        options.forEach(option => {
            option.style.backgroundColor = 'transparent';
        });

        // Highlight selected option
        const selectedOption = options[this.selectedModIndex];
        if (selectedOption) {
            selectedOption.style.backgroundColor = 'rgba(255, 0, 85, 0.3)';
        }
    }

    toggleSelectedMod() {
        const modNames = Object.keys(this.mods);
        if (this.selectedModIndex >= 0 && this.selectedModIndex < modNames.length) {
            const modName = modNames[this.selectedModIndex];
            const checkbox = document.getElementById(modName);
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                this.mods[modName] = checkbox.checked;
                this.applyMods();
            }
        }
    }

    toggleModMenu() {
        this.modMenuVisible = !this.modMenuVisible;
        if (this.modMenuElement) {
            this.modMenuElement.style.display = this.modMenuVisible ? 'block' : 'none';
            
            if (this.modMenuVisible) {
                // Reset selection to first option when opening menu
                this.selectedModIndex = 0;
                this.updateModMenuSelection();
                
                // Temporarily disable player controls
                if (this.player) {
                    this.player.controlsEnabled = false;
                }

                // Remove any remaining instructions
                const elementsToRemove = document.querySelectorAll('.game-instructions, .click-instruction, #pointer-lock-instruction');
                elementsToRemove.forEach(el => el.remove());

                // Ensure mod menu is on top
                this.modMenuElement.style.zIndex = '10000';
            } else {
                // Re-enable player controls when closing menu
                if (this.player) {
                    this.player.controlsEnabled = true;
                    document.body.requestPointerLock();
                }
            }
        }
    }

    applyMods() {
        // Apply speed boost - 10x faster when enabled
        if (this.player) {
            // Base speed is 0.075, boost to 0.75 (10x faster)
            this.player.moveSpeed = this.mods.speedBoost ? 0.75 : 0.075;
            
            // Also increase jump force and climb speed when speed boost is active
            this.player.jumpForce = this.mods.speedBoost ? 0.7 : 0.35;
            this.player.climbSpeed = this.mods.speedBoost ? 0.4 : 0.04;
        }
        
        // Invincibility is checked in the collision detection logic
    }

    onPlayerHit(source) {
        if (source === 'barrel' && !this.activePowerups.invincible && !this.mods.invincible) {
            console.log('Player hit by barrel, triggering death sequence');
            
            // Disable player controls immediately
            if (this.player) {
                this.player.enabled = false;
                this.player.disableControls();
                
                // Play death animation if available
                if (this.player.animations && this.player.animations['death']) {
                    console.log('Found death animation, attempting to play');
                    // Force play the death animation
                    this.player.playAnimation('death', true);
                } else {
                    console.error('Death animation not found in player animations:', 
                        this.player.animations ? Object.keys(this.player.animations) : 'no animations available');
                }
            }
            
            // Stop barrel spawning
            if (this.level) {
                this.level.gameStarted = false;
                this.level.stopBarrels();
            }

            // Show game over screen after animation
            setTimeout(() => {
                console.log('Death animation finished, showing game over screen');
                if (!this.gameOverScreen) {
                    console.log('Creating new game over screen...');
                    this.gameOverScreen = new GameOverScreen(this);
                }
                const currentScore = this.level.score;
                const savedHighScore = parseInt(localStorage.getItem('highScore') || '0', 10);
                if (currentScore > savedHighScore) {
                    localStorage.setItem('highScore', currentScore);
                }
                localStorage.setItem('lastScore', currentScore);
                this.gameOverScreen.show(currentScore, Math.max(currentScore, savedHighScore));
                this.isRunning = false;
            }, 1300); // Wait for 1.3 seconds before showing game over
        }
    }

    async init() {
        try {
            console.log('Initializing game...');
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);

            // Camera setup
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);

            // Renderer setup with improved shadow settings
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.5;
            
            // Garantir que o canvas está visível
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '0';
            
            document.body.appendChild(this.renderer.domElement);

            // Enhanced lighting setup
            console.log('Setting up lights...');
            this.setupLights();

            // Initialize level and player
            this.level = new Level(this.scene);
            this.player = new Player(this.scene, this.camera);

            // Garantir que o nível tenha a referência para o Game e Player
            this.level.game = this;
            this.level.player = this.player;

            // Start rendering loop
            this.animate();
            
            // Garantir que o clock está inicializado corretamente
            this.clock.start();
            this.time = 0;

            // Forçar uma renderização inicial
            this.renderer.render(this.scene, this.camera);

            // Initialize game over screen
            this.gameOverScreen = new GameOverScreen(this);

            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }

    setupLights() {
        // Remove any existing lights
        this.scene.children.forEach(child => {
            if (child.isLight) {
                this.scene.remove(child);
            }
        });

        // Ambient light com intensidade aumentada
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        // Sol direcional mais próximo e mais intenso
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        sunLight.position.set(-40, 100, 40);
        sunLight.target.position.set(0, 0, 0);
        sunLight.castShadow = true;
        
        // Configurações de sombra mais suaves
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.radius = 2;
        
        this.scene.add(sunLight);
        this.scene.add(sunLight.target);

        // Luz de preenchimento mais forte
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
        fillLight.position.set(40, 40, 100);
        this.scene.add(fillLight);

        // Luz adicional para garantir visibilidade
        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(0, 40, -100);
        this.scene.add(backLight);

        console.log('Lights setup complete');
    }

    async startCountdown() {
        try {
            console.log('Starting countdown sequence...');
            
            // Criar background temporário com gradiente roxo
            const tempBackground = document.createElement('div');
            tempBackground.style.position = 'fixed';
            tempBackground.style.top = '0';
            tempBackground.style.left = '0';
            tempBackground.style.width = '100%';
            tempBackground.style.height = '100%';
            tempBackground.style.background = 'linear-gradient(135deg, rgba(20,0,40,0.95) 0%, rgba(10,0,20,0.95) 100%)';
            tempBackground.style.zIndex = '500';
            document.body.appendChild(tempBackground);
            
            if (!this.countdownElement) {
                console.log('Creating countdown element...');
                this.createCountdownElement();
            }

            this.countdownElement.style.display = 'block';
            
            // Make sure player is in idle animation
            if (this.player && this.player.animations['idle2']) {
                console.log('Setting player to idle2 animation...');
                this.player.playAnimation('idle2');
            }

            // Countdown sequence
            console.log('Starting countdown numbers...');
            for (let i = 3; i > 0; i--) {
                this.countdownElement.textContent = i;
                this.countdownElement.style.color = '#ff69b4';
                this.countdownElement.style.textShadow = '0 0 20px #ff69b4';
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.countdownElement.textContent = 'GO!';
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.countdownElement.style.display = 'none';
            
            // Remover o background temporário
            document.body.removeChild(tempBackground);

            console.log('Countdown complete, starting gameplay...');
            // Now start the actual game
            this.startGameplay();
        } catch (error) {
            console.error('Error during countdown sequence:', error);
            throw error;
        }
    }

    startGameplay() {
        try {
            if (this.backgroundMusic && this.backgroundMusic.paused) {
                this.backgroundMusic.play().catch(err => {
                    console.warn('Autoplay bloqueado. Clique necessário para iniciar som.', err);
                });
            }            
            console.log('Starting gameplay...');
            
            if (this.scene) {
                this.scene.visible = true;
                console.log('Scene visibility set to true');
            } else {
                console.error('startGameplay: Scene is not defined!');
                return;
            }

            // Enable player controls
            if (this.player) {
                console.log('Enabling player controls...');
                this.player.enabled = true;
                
                // Remove any existing instructions or overlays
                const elementsToRemove = document.querySelectorAll('.game-instructions, .click-instruction, #pointer-lock-instruction');
                elementsToRemove.forEach(el => el.remove());
                
                // Adicionar listener de clique simples
                const enableGameClick = () => {
                    console.log('Document clicked, enabling player controls...');
                    this.player.enableControls();
                    document.removeEventListener('click', enableGameClick);
                };
                
                document.addEventListener('click', enableGameClick);
                
                this.player.enableControls();
                this.player.updateCameraPosition();
            } else {
                console.error('startGameplay: Player is not defined!');
                return;
            }

            // Start the game loop and enable barrel spawning
            this.isRunning = true;
            this.isPaused = false;
            this.clock.start();
            
            if (this.level) {
                this.level.gameStarted = true;
                this.level.startBarrels();
            }
            
            if (this.renderer && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('Error starting gameplay:', error);
            if (error.stack) {
                console.error(error.stack);
            }
            throw error;
        }
    }

    start() {
        console.log('Starting game...');
        
        // Reset game state
        this.isRunning = false;
        this.isPaused = false;
        
        // Clear the scene and recreate everything
        if (!this.scene) {
            this.init();
        } else {
            // Clear existing objects
            while(this.scene.children.length > 0) { 
                this.scene.remove(this.scene.children[0]); 
            }
            
            // Reset and recreate level and player
            this.level = new Level(this.scene);
            this.player = new Player(this.scene, this.camera);
            
            // Ensure level has references to Game and Player
            this.level.game = this;
            this.level.player = this.player;
            
            // Reset game time
            this.time = 0;
            this.clock.start();
            
            // Reset camera
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            
            // Setup lights again
            this.setupLights();
            
            // Reinitialize game over screen
            if (!this.gameOverScreen) {
                this.gameOverScreen = new GameOverScreen(this);
            }
        }
        
        // Make sure scene is visible
        if (this.scene) {
            this.scene.visible = true;
        }
        
        // Make sure renderer is properly set
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Force a render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Start the countdown sequence
        this.startCountdown();
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        console.log('Pausing game...');
        
        // Show pause menu first before stopping the game
        this.menu.showPauseMenu();
        
        this.isRunning = false;
        this.isPaused = true;
        
        if (this.player) {
            this.player.enabled = false;
            this.player.disableControls();
            
            // Remover qualquer instrução de clique que possa estar visível
            const instruction = document.getElementById('pointer-lock-instruction');
            if (instruction) {
                instruction.remove();
                console.log('Removing instruction element during pause');
            }
        }
        
        if (this.level) {
            this.level.pauseBarrels();
        }
        if (this.backgroundMusic) this.backgroundMusic.pause();

        this.lastTimeStamp = this.clock.getElapsedTime();
        this.clock.stop();
    }

    resume() {
        if (!this.isPaused) return;
        
        // Hide pause menu first
        this.menu.hidePauseMenu();
        
        this.isRunning = true;
        this.isPaused = false;
        
        if (this.player) {
            this.player.enabled = true;
            this.player.enableControls();
        }
        
        if (this.level) {
            this.level.resumeBarrels();
        }
        
        this.clock.start();
        if (this.backgroundMusic && this.backgroundMusic.paused) {
            this.backgroundMusic.play();
        }
        
    }

    returnToMainMenu() {
        console.log('Returning to main menu...');
        
        // Reset game state
        this.isPaused = false;
        this.isRunning = false;
        
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        // Stop and reset the clock
        this.clock.stop();
        this.lastTimeStamp = 0;
        
        // Clear the scene except for essential elements
        if (this.scene) {
            // Store essential objects
            const essentialObjects = [];
            this.scene.traverse((object) => {
                if (object.userData.isEssential) {
                    essentialObjects.push(object);
                }
            });
            
            // Clear the scene
            while(this.scene.children.length > 0) { 
                this.scene.remove(this.scene.children[0]); 
            }
            
            // Re-add essential objects
            essentialObjects.forEach(obj => this.scene.add(obj));
        }
        
        // Reset and recreate level
        if (this.level) {
            this.level = new Level(this.scene);
            this.level.game = this;
        }
        
        // Reset and recreate player
        if (this.player) {
            this.player.enabled = false;
            this.player.disableControls();
            this.player = new Player(this.scene, this.camera);
        }
        
        // Reset camera
        if (this.camera) {
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
        }
        
        // Reset renderer if needed
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // Show the main menu
        console.log('Showing main menu...');
        if (this.menu) {
            this.menu.showMenu();
        }
        
        // Ensure the scene background is black
        if (this.scene) {
            this.scene.background = new THREE.Color(0x000000);
        }

        // Force a re-render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    exitGame() {
        window.close();
    }

    animate() {
        if (!this.renderer) return;

        requestAnimationFrame(() => this.animate());

        if (this.stats) this.stats.begin();

        // Only update game components if not paused
        if (!this.isPaused) {
            const deltaTime = this.clock.getDelta();
            
            // Atualizar o tempo do jogo
            this.time += deltaTime;
            
            // Update game components
            if (this.player) {
                this.player.update(deltaTime); // mesmo desativado, precisa de atualizar o mixer
            }            
            if (this.level) {
                this.level.update(deltaTime);
            }
            if (this.debugMenu) this.debugMenu.update();

            // --- ITENS: checar colisão e aplicar efeitos ---
            if (this.level && this.level.getItemManager && this.player && this.player.mesh) {
                const itemManager = this.level.getItemManager();
                if (itemManager) {
                    const playerBox = this.player.collider;
                    const hit = itemManager.getCollidingItem(playerBox);
                    if (hit) {
                        if (hit.type === ITEM_TYPES.COIN) {
                            this.level.score += 100;
                            this.level.updateScore();
                            localStorage.setItem('lastScore', this.level.score); 
                            this.showFloatingText('+100', hit.mesh.position);
                        } else if (hit.type === ITEM_TYPES.LIGHTNING) {
                            this.activePowerups.speed = true;
                            this.powerupTimers.speed = 5.0;
                            this.applyPowerups();
                            this.showPowerupMessage('SUPER BOOST!');
                        } else if (hit.type === ITEM_TYPES.STAR) {
                            this.activePowerups.invincible = true;
                            this.powerupTimers.invincible = 5.0;
                            this.applyPowerups();
                            this.showPowerupMessage('INVENCÍVEL!');
                        }
                        itemManager.removeItem(hit.mesh);
                    }
                }
            }
            // --- Atualizar timers dos poderes ---
            if (this.activePowerups.speed) {
                this.powerupTimers.speed -= deltaTime;
                if (this.powerupTimers.speed <= 0) {
                    this.activePowerups.speed = false;
                    this.applyPowerups();
                }
            }
            if (this.activePowerups.invincible) {
                this.powerupTimers.invincible -= deltaTime;
                if (this.powerupTimers.invincible <= 0) {
                    this.activePowerups.invincible = false;
                    this.applyPowerups();
                }
            }
        }
        
        // Sempre renderizar a cena, mesmo quando pausado
        if (this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        if (this.stats) this.stats.end();
    }

    onWindowResize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    // Add method to show main menu
    showMainMenu() {
        // Hide all game elements
        if (this.scene) {
            this.scene.visible = false;
        }
        
        // Reset game state
        this.reset();
        
        // Show main menu
        if (this.menu) {
            this.menu.show();
        }
    }

    // Enhance reset method
    reset() {
        // Reset game state
        this.isRunning = false;
        this.isPaused = false;
        
        // Reset level
        if (this.level) {
            this.level.reset();
        }
        
        // Reset player
        if (this.player) {
            this.player.reset();
        }
        
        // Reset camera
        if (this.camera) {
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
        }
        
        // Clear any existing UI elements
        const elementsToRemove = document.querySelectorAll('.game-instructions, .click-instruction, #pointer-lock-instruction');
        elementsToRemove.forEach(el => el.remove());
    }

    // Método para controlar o volume de todos os sons do jogo
    setVolume(volume) {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = volume;
        }
        if (this.soundManager) {
            this.soundManager.setVolume(volume);
        }
    }

    applyPowerups() {
        // Speed boost
        if (this.player) {
            this.player.moveSpeed = this.activePowerups.speed ? 0.225 : 0.075;
            this.player.jumpForce = this.activePowerups.speed ? 0.7 : 0.35;
            this.player.climbSpeed = this.activePowerups.speed ? 0.12 : 0.04;
        }
        // Invencibilidade é checada em onPlayerHit
    }
    showFloatingText(text, position) {
        const div = document.createElement('div');
        div.textContent = text;
        div.style.position = 'absolute';
        div.style.color = '#FFD700';
        div.style.fontSize = '20px';
        div.style.fontWeight = 'bold';
        div.style.pointerEvents = 'none';
        div.style.zIndex = 1000;
        div.style.textShadow = '0 0 5px black';
    
        document.body.appendChild(div);
    
        const coords = position.clone().project(this.camera);
        const x = (coords.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-coords.y * 0.5 + 0.5) * window.innerHeight;
    
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.opacity = '1';
        div.style.transition = 'all 0.7s ease-out';
    
        setTimeout(() => {
            div.style.transform = 'translateY(-40px)';
            div.style.opacity = '0';
        }, 50);
    
        setTimeout(() => {
            div.remove();
        }, 800);
    }
    showPowerupMessage(message) {
        const div = document.createElement('div');
        div.textContent = message;
        div.style.position = 'fixed';
        div.style.top = '20%';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.color = '#00ffff';
        div.style.fontSize = '28px';
        div.style.fontWeight = 'bold';
        div.style.textShadow = '0 0 10px #000';
        div.style.zIndex = '1000';
        div.style.opacity = '1';
        div.style.transition = 'all 0.7s ease-out';
    
        document.body.appendChild(div);
    
        setTimeout(() => {
            div.style.transform = 'translateX(-50%) translateY(-40px)';
            div.style.opacity = '0';
        }, 100);
    
        setTimeout(() => {
            div.remove();
        }, 1000);
    }
    
    onPlayerWin() {
        if (!this.isRunning) return;
        
        console.log('Player won the game!');
        
        // Disable player controls
        if (this.player) {
            this.player.enabled = false;
            this.player.disableControls();
        }
        
        // Stop barrel spawning
        if (this.level) {
            this.level.gameStarted = false;
            this.level.stopBarrels();
        }
        
        // Stop background music
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        // Play victory sound if available
        if (this.soundManager) {
            this.soundManager.playSound('victory');
        }
        
        // Show victory screen
        setTimeout(() => {
            const currentScore = this.level.score;
            const savedHighScore = parseInt(localStorage.getItem('highScore') || '0', 10);
            if (currentScore > savedHighScore) {
                localStorage.setItem('highScore', currentScore);
            }
            localStorage.setItem('lastScore', currentScore);
            this.victoryScreen.show(currentScore, Math.max(currentScore, savedHighScore));
            this.isRunning = false;
        }, 1000);
    }
}