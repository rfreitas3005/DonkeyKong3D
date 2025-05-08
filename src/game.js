import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { DebugMenu } from './debug.js';
import { GameMenu } from './menu.js';
import Stats from 'three/examples/jsm/libs/stats.module';
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
        this.collectibleManager = null;

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

            // Garantir que o nível tenha a referência para o Game e Player
            this.level.game = this;
            this.level.player = this.player;

            // --- INTEGRAÇÃO DO COLLECTIBLE MANAGER ---
            if (this.collectibleManager) {
                this.collectibleManager.dispose();
            }
            this.collectibleManager = new CollectibleManager(this.scene, this.effectsManager);
            this.collectibleManager.start();

            // Após criar o player, posicione a câmera corretamente
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(this.player.mesh.position);

            // Start rendering loop
            this.animate();
            
            // Garantir que o clock está inicializado corretamente
            this.clock.start();
            this.time = 0;

            // Forçar uma renderização inicial
            this.renderer.render(this.scene, this.camera);

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
                
                // Adicionar listener de clique para ativar pointer lock no início do jogo
                const requestPointerLock = () => {
                    if (!document.pointerLockElement) {
                        document.body.requestPointerLock();
                    }
                    document.removeEventListener('click', requestPointerLock);
                };
                document.body.addEventListener('click', requestPointerLock);
                
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

            // Remover player antigo se existir
            if (this.player && this.player.mesh && this.scene) {
                this.scene.remove(this.player.mesh);
            }
            this.player = new Player(this.scene, this.camera);
            
            // Garantir que o nível tenha a referência para o Game e Player
            this.level.game = this;
            this.level.player = this.player;
            
            // Resetar o tempo do jogo
            this.time = 0;
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
            
            // Atualizar o tempo do jogo
            this.time += deltaTime;
            
            // Update game components
            if (this.player && this.player.enabled) {
                this.player.update(deltaTime);
            }
            if (this.level) {
                this.level.update(deltaTime);
            }
            if (this.collectibleManager) {
                this.collectibleManager.update(deltaTime, this.time);
                this.collectibleManager.checkCollisions(this.player);
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