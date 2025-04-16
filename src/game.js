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
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.isRunning = false;
        this.stats = null;

        // Initialize menu first
        this.menu = new GameMenu(this);
    }

    init() {
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

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 50, 0);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Stats (if in debug mode)
        if (window.location.hash === '#debug') {
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
        }

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    start() {
        if (!this.scene) {
            this.init();
        }

        // Initialize level and player
        this.level = new Level(this.scene);
        this.player = new Player(this.scene, this.camera);

        // Initialize debug menu
        if (window.location.hash === '#debug') {
            this.debugMenu = new DebugMenu(this.scene);
        }

        // Apply menu options
        if (this.menu.options.sensitivity) {
            this.player.mouseSensitivity = this.menu.options.sensitivity;
        }

        // Enable player controls
        this.player.enabled = true;

        // Start the game loop and enable barrel spawning
        this.isRunning = true;
        this.level.gameStarted = true;
        this.level.startBarrels();
        this.animate();
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        if (this.stats) this.stats.begin();

        const deltaTime = this.clock.getDelta();
        
        // Update game components
        this.player.update(deltaTime);
        this.level.update(deltaTime);
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

    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = `Score: ${this.score}`;
    }
}