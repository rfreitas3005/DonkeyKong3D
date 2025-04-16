import * as THREE from 'three';
import { Game } from './game.js';

// Initialize the game
const game = new Game();
game.init();

// Handle window resize
window.addEventListener('resize', () => {
    game.onWindowResize();
}); 