// Importar as classes necessárias
import { Level } from './level.js';
import { Player } from './player.js';
import * as THREE from 'three';
import { OptionsMenu } from './optionsMenu.js';
import './menu.css';

export class GameMenu {
    constructor(game) {
        if (!game) {
            throw new Error('Game instance is required for menu initialization');
        }
        
        this.game = game;
        
        // Carregar opções salvas do localStorage ou usar valores padrão
        const savedOptions = localStorage.getItem('gameOptions');
        this.options = savedOptions ? JSON.parse(savedOptions) : {
            sensitivity: 0.002,
            volume: 0.5,
            fullscreen: false
        };
        
        this.menuContainer = null;
        this.pauseMenu = null;
        this.optionsMenu = null;
        this.currentSelection = 0;
        this.menuItems = [];
        this.isVisible = false;
        this.isPauseVisible = false;
        
        // Initialize menu
        this.init();
        
        // Handler de teclado sempre igual
        this._keydownHandler = (e) => this.handleKeyPress(e);
        
        // Add event listeners
        this.setupEventListeners();
        
        // Aplicar configurações carregadas
        if (this.game.player) {
            this.game.player.mouseSensitivity = this.options.sensitivity;
        }
        if (this.game.audio) {
            this.game.audio.setVolume(this.options.volume);
        }
    }

    init() {
        try {
            console.log('Initializing game menu...');
            if (!this.menuContainer) {
                this.createMainMenu();
            }
            if (!this.pauseMenu) {
                this.createPauseMenu();
            }
            this.showMenu();
            console.log('Menu initialization complete');
        } catch (error) {
            console.error('Error initializing menu:', error);
            throw error;
        }
    }

    createMainMenu() {
        // Create main container
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'menu-container';
        
        // Add Google Fonts link
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        document.head.appendChild(fontLink);
        
        // Create menu content
        const menuContent = document.createElement('div');
        menuContent.className = 'menu-content';

        // Create hi-score display
        const hiScore = document.createElement('div');
        hiScore.className = 'hi-score';
        hiScore.innerHTML = 'HI-SCORE: 300';

        // Create title
        const title = document.createElement('div');
        title.className = 'game-title';
        title.innerHTML = `
            <div>DONKEY</div>
            <div>KONG</div>
            <div>3D</div>
        `;

        // Create menu items container
        const menuItemsContainer = document.createElement('div');
        menuItemsContainer.style.marginTop = '2rem';
        
        // Create menu items
        const menuItems = [
            { text: 'PLAY', action: () => this.startGame() },
            { text: 'OPTIONS', action: () => this.showOptions() },
            { text: 'CREDITS', action: () => this.showCredits() }
        ];
        
        menuItems.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', item.action);
            menuItem.addEventListener('mouseover', () => {
                this.currentSelection = index;
                this.updateSelection();
            });
            menuItemsContainer.appendChild(menuItem);
            this.menuItems.push(menuItem);
        });

        // Create press enter text
        const pressEnter = document.createElement('div');
        pressEnter.className = 'press-enter';
        pressEnter.textContent = 'PRESS ENTER TO START';
        
        // Assemble menu
        menuContent.appendChild(title);
        menuContent.appendChild(menuItemsContainer);
        menuContent.appendChild(pressEnter);
        this.menuContainer.appendChild(hiScore);
        this.menuContainer.appendChild(menuContent);
        document.body.appendChild(this.menuContainer);

        // Set initial selection
        this.currentSelection = 0;
        this.updateSelection();
    }

    createPauseMenu() {
        this.pauseMenu = document.createElement('div');
        this.pauseMenu.className = 'menu-container';
        this.pauseMenu.setAttribute('data-menu', 'pause');
        
        const pauseContent = document.createElement('div');
        pauseContent.className = 'menu-content';
        
        const title = document.createElement('div');
        title.className = 'game-title';
        title.textContent = 'PAUSED';
        
        const menuItemsContainer = document.createElement('div');
        
        const pauseItems = [
            { text: 'RESUME', action: () => this.resumeGame() },
            { text: 'MAIN MENU', action: () => this.returnToMainMenu() },
            { text: 'EXIT', action: () => this.exitGame() }
        ];
        
        pauseItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', item.action);
            menuItemsContainer.appendChild(menuItem);
        });
        
        pauseContent.appendChild(title);
        pauseContent.appendChild(menuItemsContainer);
        this.pauseMenu.appendChild(pauseContent);
        document.body.appendChild(this.pauseMenu);
    }

    updateSelection() {
        this.menuItems.forEach((item, index) => {
            if (index === this.currentSelection) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // ... rest of your existing methods ...
    setupEventListeners() {
        document.removeEventListener('keydown', this._keydownHandler);
        document.addEventListener('keydown', this._keydownHandler);
        console.log('[MENU] Listeners de teclado adicionados');
    }

    handleKeyPress(e) {
        console.log('[MENU] Tecla pressionada:', e.key);
        if (e.key === 'Escape') {
            if (this.game && this.game.isRunning && !this.game.isPaused) {
                this.showPauseMenu();
            } else if (this.isPauseVisible) {
                this.hidePauseMenu();
                if (this.game) {
                    this.game.resume();
                }
            }
        } else if (this.isVisible || this.isPauseVisible) {
            switch(e.key) {
                case 'ArrowUp':
                    this.navigateMenu(-1);
                    break;
                case 'ArrowDown':
                    this.navigateMenu(1);
                    break;
                case 'Enter':
                    this.selectCurrentItem();
                    break;
            }
        }
    }

    navigateMenu(direction) {
        const items = this.menuItems;
        if (items.length === 0) return;
        
        // Update selection
        this.currentSelection = (this.currentSelection + direction + items.length) % items.length;
        
        // Update visual selection
        this.updateSelection();
    }

    selectCurrentItem() {
        const currentItem = this.menuItems[this.currentSelection];
        if (currentItem) {
            currentItem.click();
        }
    }

    showMenu() {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        if (this.menuContainer) {
            this.menuContainer.style.display = 'flex';
            this.isVisible = true;
            this.isPauseVisible = false;
            if (this.pauseMenu) {
                this.pauseMenu.style.display = 'none';
            }
        }
        this.setupEventListeners();
    }

    hideMenu() {
        if (this.menuContainer) {
            this.menuContainer.style.display = 'none';
            this.isVisible = false;
        }
    }

    showPauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'flex';
            this.isPauseVisible = true;
            this.isVisible = false;
            if (this.menuContainer) {
                this.menuContainer.style.display = 'none';
            }
        }
    }

    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'none';
            this.isPauseVisible = false;
        }
    }

    startGame() {
        console.log('Starting game...');
        this.hideMenu();
        if (!this.game.scene) {
            console.log('Initializing game scene...');
            this.game.init().then(() => {
                console.log('Game scene initialized, starting game...');
                // Aplicar configurações salvas
                if (this.game.player) {
                    this.game.player.mouseSensitivity = this.options.sensitivity;
                }
                if (this.game.audio) {
                    this.game.audio.setVolume(this.options.volume);
                }
                this.game.start();
            }).catch(error => {
                console.error('Error initializing game:', error);
                this.showMenu();
            });
        } else {
            console.log('Game scene already initialized, starting game...');
            // Aplicar configurações salvas
            if (this.game.player) {
                this.game.player.mouseSensitivity = this.options.sensitivity;
            }
            if (this.game.audio) {
                this.game.audio.setVolume(this.options.volume);
            }
            this.game.start();
        }
    }

    resumeGame() {
        this.hidePauseMenu();
        if (this.game) {
            this.game.resume();
        }
    }

    returnToMainMenu() {
        window.location.reload();
    }

    exitGame() {
        if (this.game) {
        this.game.exitGame();
        }
    }

    showOptions() {
        if (!this.optionsMenu) {
            this.optionsMenu = new OptionsMenu(this.game);
        }
        this.hideMenu();
        this.optionsMenu.show();
    }

    showCredits() {
        if (this.menuContainer) {
            const menuContent = document.createElement('div');
            menuContent.className = 'menu-content';
            
            const title = document.createElement('div');
            title.className = 'game-title';
            title.textContent = 'CREDITS';
            
            const credits = document.createElement('div');
            credits.className = 'menu-item';
            credits.style.whiteSpace = 'pre-line';
            credits.innerHTML = `
                Game Design
                Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas

                Programming
                Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas

                Art & Animation
                Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas

                Music & Sound
                Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas

                © 2025
            `;
            
            const backButton = document.createElement('button');
            backButton.className = 'menu-back-button';
            backButton.textContent = 'Back to Menu';
            backButton.addEventListener('click', () => {
                this.menuContainer.innerHTML = '';
                this.createMainMenu();
                this.showMenu();
            });
            
            menuContent.appendChild(title);
            menuContent.appendChild(credits);
            menuContent.appendChild(backButton);
            
            this.menuContainer.innerHTML = '';
            this.menuContainer.appendChild(menuContent);
        }
    }

    dispose() {
        document.removeEventListener('keydown', this._keydownHandler);
        
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
        }
        if (this.pauseMenu && this.pauseMenu.parentNode) {
            this.pauseMenu.parentNode.removeChild(this.pauseMenu);
        }
        
        this.menuContainer = null;
        this.pauseMenu = null;
        this.optionsMenu = null;
        this.isVisible = false;
        this.isPauseVisible = false;
        this.menuItems = [];
        this.currentSelection = 0;
        
        console.log('[MENU] Menu disposed successfully');
    }
} 