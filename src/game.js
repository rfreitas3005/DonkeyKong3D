import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { DebugMenu } from './debug.js';
import { GameMenu } from './menu.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GameOverScreen } from './gameOverScreen.js';
import { PauseMenu } from './pauseMenu.js';
import { CollectibleManager } from './collectibles.js';

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
        // Música de fundo
        this.backgroundMusic = new Audio('https://files.catbox.moe/5q4ifm.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.5;


        // Initialize menu first
        this.menu = new GameMenu(this);
        this.createCountdownElement();

        // Mod menu state
        this.modMenuVisible = false;
        this.mods = {
            invincible: false,
            speedBoost: false
        };
        this.selectedModIndex = 0; // Track which mod option is selected
        
        // Initialize mod menu
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

        // Add game over screen
        this.gameOverScreen = null;
        
        this.collectibleManager = null;
        
        // Inicializar score e high score
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('donkeyKong3D_highScore')) || 0;
        
        // Criar displays de score
        this.initializeScoreDisplay();
        
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
        this.countdownElement.style.color = '#ffffff';
        this.countdownElement.style.textShadow = '4px 4px 0 #000';
        this.countdownElement.style.zIndex = '1000';
        this.countdownElement.style.display = 'none';
        document.body.appendChild(this.countdownElement);
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
        if (!this.player || this.player.isInvincible) return;
        
        console.log('Player hit by:', source);
        console.log('Current score:', this.score); // Debug log
        console.log('Current high score:', this.highScore); // Debug log
        
        // Parar o jogo imediatamente
        this.isRunning = false;
        this.isPaused = true;
        
        // Desabilitar jogador
        this.player.enabled = false;
        this.player.disableControls();
        
        // Parar música
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
        
        // Parar barris
        if (this.level) {
            this.level.stopBarrels();
            this.level.clearBarrels();
        }
        
        // Salvar score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('donkeyKong3D_highScore', this.highScore.toString());
        }
        
        // Mostrar game over com os scores corretos
        if (this.gameOverScreen) {
            console.log('Showing game over screen with scores:', this.score, this.highScore); // Debug log
            this.gameOverScreen.show(this.score, this.highScore);
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
            
            // Ambient light com intensidade aumentada significativamente
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            this.scene.add(ambientLight);

            // Sol direcional mais próximo e mais intenso
            const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
            sunLight.position.set(-40, 40, 100); // Reposicionado para ser mais visível
            sunLight.target.position.set(0, 0, 100);
            sunLight.castShadow = true;
            
            // Configurações de sombra mais suaves
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            sunLight.shadow.camera.left = -50;
            sunLight.shadow.camera.right = 50;
            sunLight.shadow.camera.top = 50;
            sunLight.shadow.camera.bottom = -50;
            sunLight.shadow.bias = -0.0001;
            sunLight.shadow.radius = 2;
            
            this.scene.add(sunLight);
            this.scene.add(sunLight.target);

            // Luz de preenchimento mais forte
            const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
            fillLight.position.set(40, 40, 100);
            this.scene.add(fillLight);

            // Luz adicional para garantir visibilidade
            const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
            backLight.position.set(0, 40, -100);
            this.scene.add(backLight);

            // Configurações do renderer para mais brilho
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.shadowMap.enabled = true;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 2.0; // Aumentado significativamente
            this.renderer.physicallyCorrectLights = true;

            // Stats (if in debug mode)
            if (window.location.hash === '#debug') {
                this.stats = new Stats();
                document.body.appendChild(this.stats.dom);
            }

            // Event listeners
            window.addEventListener('resize', () => this.onWindowResize(), false);

            // Initialize level and player
            this.level = new Level(this.scene);
            this.player = new Player(this.scene, this.camera, this);

            // Garantir que o nível tenha a referência para o Game e Player
            this.level.game = this;
            this.level.player = this.player;

            // Inicializar CollectibleManager
            this.collectibleManager = new CollectibleManager(this.scene);

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

    async startCountdown() {
        console.log('Starting countdown...');
        
        // Criar elemento de contagem regressiva com estilo retro
        const countdownElement = document.createElement('div');
        countdownElement.style.position = 'fixed';
        countdownElement.style.top = '50%';
        countdownElement.style.left = '50%';
        countdownElement.style.transform = 'translate(-50%, -50%)';
        countdownElement.style.fontSize = '120px';
        countdownElement.style.fontFamily = 'Press Start 2P, monospace';
        countdownElement.style.color = '#ff69b4';
        countdownElement.style.textShadow = '0 0 10px #ff69b4, 0 0 20px #ff69b4, 0 0 30px #ff69b4';
        countdownElement.style.zIndex = '1002';
        countdownElement.style.opacity = '0';
        countdownElement.style.transition = 'opacity 0.2s ease-in-out';
        
        // Criar background animado retro melhorado
        const retroBg = document.createElement('div');
        retroBg.id = 'retro-bg-countdown';
        retroBg.style.position = 'fixed';
        retroBg.style.top = '0';
        retroBg.style.left = '0';
        retroBg.style.width = '100vw';
        retroBg.style.height = '100vh';
        retroBg.style.zIndex = '1000';
        retroBg.style.pointerEvents = 'none';
        retroBg.style.overflow = 'hidden';
        // Gradiente animado
        retroBg.style.background = 'linear-gradient(180deg, #2a003a 0%, #ff0066 100%)';
        retroBg.style.animation = 'bgPulse 2.5s ease-in-out infinite alternate';
        
        // Linhas horizontais brilhantes
        const lines = document.createElement('div');
        lines.style.position = 'absolute';
        lines.style.top = '0';
        lines.style.left = '0';
        lines.style.width = '100%';
        lines.style.height = '100%';
        lines.style.background = 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 2px, transparent 2px, transparent 18px)';
        lines.style.animation = 'moveLines 1.2s linear infinite';
        lines.style.pointerEvents = 'none';
        retroBg.appendChild(lines);
        
        // Scanlines mais marcantes
        const scanline = document.createElement('div');
        scanline.style.position = 'absolute';
        scanline.style.top = '0';
        scanline.style.left = '0';
        scanline.style.width = '100%';
        scanline.style.height = '100%';
        scanline.style.background = 'linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.22) 60%)';
        scanline.style.backgroundSize = '100% 4px';
        scanline.style.pointerEvents = 'none';
        scanline.style.zIndex = '1001';
        scanline.style.animation = 'scanline 0.09s linear infinite';
        retroBg.appendChild(scanline);
        
        // Efeito de vignette nas bordas
        const vignette = document.createElement('div');
        vignette.style.position = 'absolute';
        vignette.style.top = '0';
        vignette.style.left = '0';
        vignette.style.width = '100%';
        vignette.style.height = '100%';
        vignette.style.pointerEvents = 'none';
        vignette.style.zIndex = '1002';
        vignette.style.background = 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)';
        retroBg.appendChild(vignette);
        
        // Adicionar keyframes para animações
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scanline {
                0% { transform: translateY(0); }
                100% { transform: translateY(4px); }
            }
            @keyframes moveLines {
                0% { background-position-y: 0; }
                100% { background-position-y: 18px; }
            }
            @keyframes bgPulse {
                0% { filter: brightness(1) contrast(1); }
                100% { filter: brightness(1.15) contrast(1.2) saturate(1.2); }
            }
            @keyframes countdownPulse {
                0% { transform: scale(1); opacity: 0; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
            }
            @keyframes retroGlow {
                0% { text-shadow: 0 0 10px #ff69b4, 0 0 20px #ff69b4, 0 0 30px #ff69b4; }
                50% { text-shadow: 0 0 20px #ff69b4, 0 0 30px #ff69b4, 0 0 40px #ff69b4; }
                100% { text-shadow: 0 0 10px #ff69b4, 0 0 20px #ff69b4, 0 0 30px #ff69b4; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(retroBg);
        document.body.appendChild(countdownElement);
        
        // Sequência de contagem regressiva mais rápida
        const countdown = [3, 2, 1, 'GO!'];
        let index = 0;
        
        const showNumber = () => {
            if (index < countdown.length) {
                countdownElement.textContent = countdown[index];
                countdownElement.style.opacity = '1';
                countdownElement.style.animation = 'countdownPulse 0.5s ease-in-out, retroGlow 1s infinite';
                if (this.onCountdownSound) {
                    this.onCountdownSound(countdown[index]);
                }
                index++;
                setTimeout(showNumber, 500);
            } else {
                countdownElement.style.animation = 'fadeOut 0.5s ease-in-out';
                countdownElement.style.opacity = '0';
                retroBg.style.transition = 'opacity 0.5s ease-in-out';
                retroBg.style.opacity = '0';
                setTimeout(() => {
                    countdownElement.remove();
                    retroBg.remove();
                    style.remove();
                    this.startGameplay();
                }, 500);
            }
        };
        showNumber();
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

            // Iniciar spawn de collectibles
            if (this.collectibleManager) {
                this.collectibleManager.start();
            }

            // Mostrar o score container quando o jogo começa
            const scoreContainer = document.getElementById('score-container');
            if (scoreContainer) {
                scoreContainer.style.display = 'block';
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
            this.player = new Player(this.scene, this.camera, this);
            
            // Adicionar referência ao game no player
            this.player.game = this;
            
            // Ensure level has references to Game and Player
            this.level.game = this;
            this.level.player = this.player;
            
            // Reset game time
            this.time = 0;
            this.clock.start();
            
            // Reset camera
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            
            // Ensure proper lighting
            this.setupLights();
        }
        
        // Start the countdown sequence
        this.startCountdown();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Sun light
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.set(-40, 40, 100);
        sunLight.target.position.set(0, 0, 100);
        sunLight.castShadow = true;
        
        // Shadow settings
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.radius = 2;
        
        this.scene.add(sunLight);
        this.scene.add(sunLight.target);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(40, 40, 100);
        this.scene.add(fillLight);

        // Back light
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(0, 40, -100);
        this.scene.add(backLight);
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
            this.player = new Player(this.scene, this.camera, this);
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

        // Esconder o score container quando voltar ao menu
        const scoreContainer = document.getElementById('score-container');
        if (scoreContainer) {
            scoreContainer.style.display = 'none';
        }

        this.saveHighScore(); // Salvar high score ao voltar para o menu
    }

    exitGame() {
        window.close();
    }

    animate(currentTime) {
        if (!this.renderer) return;

        requestAnimationFrame(() => this.animate(currentTime));

        if (this.stats) this.stats.begin();

        // Only update game components if not paused
        if (!this.isPaused) {
            const deltaTime = this.clock.getDelta();
            
            // Atualizar o tempo do jogo
            this.time += deltaTime;
            
            // Update game components
            if (this.player && this.player.enabled) {
                this.player.update(deltaTime);
            }
            if (this.level) {
                this.level.update(deltaTime);
            }
            if (this.debugMenu) this.debugMenu.update();

            // Update collectibles
            if (this.collectibleManager) {
                this.collectibleManager.update(deltaTime, currentTime, this.player);
                this.collectibleManager.checkCollisions(this.player);
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
        this.saveHighScore(); // Salvar high score antes de resetar
        this.score = 0;
        this.updateScoreDisplay();
        // ... resto do código de reset ...
    }

    initializeScoreDisplay() {
        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.style.position = 'fixed';
        this.scoreDisplay.style.top = '20px';
        this.scoreDisplay.style.right = '20px';
        this.scoreDisplay.style.fontFamily = "'Press Start 2P', monospace";
        this.scoreDisplay.style.fontSize = '24px';
        this.scoreDisplay.style.color = '#FFD700';
        this.scoreDisplay.style.textShadow = '2px 2px 4px #000';
        this.scoreDisplay.style.zIndex = '1000';
        this.scoreDisplay.textContent = `SCORE: ${this.score}`;
        document.body.appendChild(this.scoreDisplay);

        // High score display
        this.highScoreDisplay = document.createElement('div');
        this.highScoreDisplay.style.position = 'fixed';
        this.highScoreDisplay.style.top = '60px';
        this.highScoreDisplay.style.right = '20px';
        this.highScoreDisplay.style.fontFamily = "'Press Start 2P', monospace";
        this.highScoreDisplay.style.fontSize = '24px';
        this.highScoreDisplay.style.color = '#FFD700';
        this.highScoreDisplay.style.textShadow = '2px 2px 4px #000';
        this.highScoreDisplay.style.zIndex = '1000';
        this.highScoreDisplay.textContent = `HI-SCORE: ${this.highScore}`;
        document.body.appendChild(this.highScoreDisplay);
    }

    updateScore(points) {
        console.log('Updating score with points:', points); // Debug log
        this.score = (this.score || 0) + points;
        
        // Atualizar high score se necessário
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('donkeyKong3D_highScore', this.highScore.toString());
        }
        
        // Atualizar displays
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `SCORE: ${this.score}`;
        }
        if (this.highScoreDisplay) {
            this.highScoreDisplay.textContent = `HI-SCORE: ${this.highScore}`;
        }
        
        console.log('Current score:', this.score); // Debug log
        console.log('Current high score:', this.highScore); // Debug log
    }

    updateScoreDisplay() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `SCORE: ${this.score}`;
        }
    }

    updateHighScoreDisplay() {
        const highScoreDisplay = document.getElementById('high-score-display');
        if (highScoreDisplay) {
            highScoreDisplay.textContent = `HI-SCORE: ${this.highScore}`;
        }
    }

    loadHighScore() {
        const saved = localStorage.getItem('donkeyKong3D_highScore');
        console.log('Loaded high score:', saved); // Debug log
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('donkeyKong3D_highScore', this.highScore.toString());
            console.log('Saved new high score:', this.highScore); // Debug log
        }
    }

    onPlayerDeath() {
        this.saveHighScore(); // Salvar high score quando o jogador morre
        // ... resto do código de morte ...
    }

    gameOver() {
        console.log('Game Over called - Current score:', this.score); // Debug log
        console.log('Current high score:', this.highScore); // Debug log
        
        // Atualizar high score uma última vez se necessário
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('donkeyKong3D_highScore', this.highScore.toString());
            console.log('New high score saved:', this.highScore); // Debug log
        }
        
        // Garantir que o gameOverScreen existe
        if (!this.gameOverScreen) {
            console.log('Creating new GameOverScreen'); // Debug log
            this.gameOverScreen = new GameOverScreen(this);
        }
        
        // Mostrar tela de game over com as pontuações
        console.log('Showing game over screen with scores:', this.score, this.highScore); // Debug log
        this.gameOverScreen.show(this.score, this.highScore);
    }

    restart() {
        this.score = 0; // Resetar score ao reiniciar
        // ... resto do código de restart ...
    }
}