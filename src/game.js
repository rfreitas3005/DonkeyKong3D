import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { DebugMenu } from './debug.js';
import { GameMenu } from './menu.js';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.player = null;
        this.level = null;
        this.isRunning = false;
        this.isPaused = false;
        this.stats = null;
        this.lastTimeStamp = 0;
        this.countdownElement = null;
        this.debugMenu = new DebugMenu(this);

        // Initialize menu first
        this.menu = new GameMenu(this);
        this.createCountdownElement();

        // Add pause key listener
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
        });
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

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Garantir que o canvas está visível
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '0';
            
            document.body.appendChild(this.renderer.domElement);

            // Lighting setup
            console.log('Setting up lights...');
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(50, 200, 100);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            this.scene.add(directionalLight);

            const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
            pointLight1.position.set(0, 50, 0);
            this.scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0xffffff, 0.3);
            pointLight2.position.set(0, 50, 200);
            this.scene.add(pointLight2);

            // Stats (if in debug mode)
            if (window.location.hash === '#debug') {
                this.stats = new Stats();
                document.body.appendChild(this.stats.dom);
            }

            // Event listeners
            window.addEventListener('resize', () => this.onWindowResize(), false);

            // Initialize level and player
            this.level = new Level(this.scene);
            this.player = new Player(this.scene, this.camera);

            // Start rendering loop
            this.animate();
            
            // Forçar uma renderização inicial
            this.renderer.render(this.scene, this.camera);

            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }

    async startCountdown() {
        try {
            console.log('Starting countdown sequence...');
            
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
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.countdownElement.textContent = 'GO!';
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.countdownElement.style.display = 'none';

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
            console.log('Starting gameplay...');
            
            // Certificar que a cena está visível
            if (this.scene) {
                this.scene.visible = true;
                console.log('Scene visibility set to true');
            } else {
                console.error('startGameplay: Scene is not defined!');
                return; // Não continuar se a cena não existe
            }

            // Enable player controls
            if (this.player) {
                console.log('Enabling player controls...');
                this.player.enabled = true;
                
                // Adicionar listener de clique para todo o documento para ajudar com PointerLock
                const enableGameClick = () => {
                    console.log('Document clicked, enabling player controls...');
                    this.player.enableControls();
                    document.removeEventListener('click', enableGameClick);
                };
                
                document.addEventListener('click', enableGameClick);
                
                // Tentar habilitar os controles, mas o usuário precisará clicar em breve
                this.player.enableControls(); 
                
                // Forçar atualização da câmera imediatamente
                console.log('Forcing initial camera update...');
                this.player.updateCameraPosition(); 
            } else {
                console.error('startGameplay: Player is not defined!');
                return; // Não continuar se o jogador não existe
            }

            // Start the game loop and enable barrel spawning
            console.log('Starting game loop...');
            this.isRunning = true;
            this.isPaused = false; // Garantir que não está pausado
            this.clock.start(); // Garantir que o clock está rodando
            
            if (this.level) {
                console.log('Starting barrel spawning...');
                this.level.gameStarted = true;
                this.level.startBarrels();
            } else {
                console.warn('startGameplay: Level is not defined, barrels will not spawn.');
            }
            
            // Forçar uma renderização inicial para garantir visibilidade
            if (this.renderer && this.camera) {
                console.log('Forcing initial render after starting gameplay...');
                this.renderer.render(this.scene, this.camera);
            } else {
                console.error('startGameplay: Renderer or Camera is not defined for initial render!');
            }

            console.log('Game successfully started!');
        } catch (error) {
            console.error('Error starting gameplay:', error);
            // Adicionar mais detalhes ao erro se possível
            if (error.stack) {
                console.error(error.stack);
            }
            throw error;
        }
    }

    start() {
        console.log('Starting game...');
        if (!this.scene) {
            this.init();
        } else {
            // Reset and recreate level and player
            this.level = new Level(this.scene);
            this.player = new Player(this.scene, this.camera);
        }
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
    }

    returnToMainMenu() {
        console.log('Returning to main menu...');
        
        // First hide the pause menu
        this.menu.hidePauseMenu();
        
        // Reset game state
        this.isPaused = false;
        this.isRunning = false;
        
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
        this.menu.showMenu();
        
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
            
            // Update game components
            if (this.player && this.player.enabled) {
                this.player.update(deltaTime);
            }
            if (this.level) {
                this.level.update(deltaTime);
            }
            if (this.debugMenu) this.debugMenu.update();
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
}