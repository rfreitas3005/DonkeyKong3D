import * as THREE from 'three';
import { Game } from './game.js';
import './items.js'; // Garante que o sistema de items é carregado

// Initialize the game
const game = new Game();
game.init();

// Handle window resize
window.addEventListener('resize', () => {
    game.onWindowResize();
}); 