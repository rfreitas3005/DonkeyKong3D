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

        // Initialize menu first
        this.menu = new GameMenu(this);
        this.createCountdownElement();
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
            
            // Initialize debug menu if needed
            if (window.location.hash === '#debug') {
                this.debugMenu = new DebugMenu(this.scene);
            }

            // Enable player controls
            if (this.player) {
                console.log('Enabling player controls...');
                this.player.enabled = true;
                this.player.enableControls(); // Enable pointer lock
            }

            // Start the game loop and enable barrel spawning
            console.log('Starting game loop...');
            this.isRunning = true;
            
            if (this.level) {
                console.log('Starting barrel spawning...');
                this.level.gameStarted = true;
                this.level.startBarrels();
            }

            console.log('Game successfully started!');
        } catch (error) {
            console.error('Error starting gameplay:', error);
            throw error;
        }
    }

    start() {
        if (!this.scene) {
            this.init();
        }
        this.startCountdown();
    }

    pause() {
        this.isRunning = false;
        this.isPaused = true;
        if (this.player) {
            this.player.enabled = false;
            this.player.disableControls(); // Disable pointer lock
        }
        this.lastTimeStamp = this.clock.getElapsedTime();
        this.clock.stop();
    }

    resume() {
        this.isPaused = false;
        this.isRunning = true;
        if (this.player) {
            this.player.enabled = true;
            this.player.enableControls(); // Re-enable pointer lock
        }
        this.clock.start();
        this.clock.elapsedTime = this.lastTimeStamp;
        this.animate();
    }

    animate() {
        if (!this.renderer) return;

        requestAnimationFrame(() => this.animate());

        if (this.stats) this.stats.begin();

        const deltaTime = this.clock.getDelta();
        
        // Update game components
        if (this.player && this.player.enabled) {
            this.player.update(deltaTime);
        }
        if (this.level) {
            this.level.update(deltaTime);
        }
        if (this.debugMenu) this.debugMenu.update();

        // Render scene
        this.renderer.render(this.scene, this.camera);

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