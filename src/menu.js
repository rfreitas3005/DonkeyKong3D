// Importar as classes necessárias
import { Level } from './level.js';
import { Player } from './player.js';
import * as THREE from 'three';

export class GameMenu {
    constructor(game) {
        if (!game) {
            throw new Error('Game instance is required for menu initialization');
        }
        
        this.game = game;
        this.options = {
            sensitivity: 0.002,
            volume: 0.5,
            fullscreen: false
        };
        this.menuContainer = null;
        this.pauseMenu = null;
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
    }

    setupEventListeners() {
        document.removeEventListener('keydown', this._keydownHandler);
        document.addEventListener('keydown', this._keydownHandler);
        console.log('[MENU] Listeners de teclado adicionados');
    }

    navigateMenu(direction) {
        const items = this.menuItems;
        if (items.length === 0) return;
        
        // Deactivate current item
        this.setMenuItemInactive(items[this.currentSelection]);
        
        // Update selection
        this.currentSelection = (this.currentSelection + direction + items.length) % items.length;
        
        // Activate new item
        this.setMenuItemActive(items[this.currentSelection]);
    }

    selectCurrentItem() {
        const currentItem = this.menuItems[this.currentSelection];
        if (currentItem && currentItem.click) {
            currentItem.click();
        }
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

    init() {
        try {
            console.log('Initializing game menu...');
            // Só cria os elementos se ainda não existem
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
        this.menuContainer = document.createElement('div');
        this.setupMenuContainer(this.menuContainer);

        // Create sections
        const topSection = this.createTopSection();
        const middleSection = this.createMiddleSection();
        const bottomSection = this.createBottomSection();

        this.menuContainer.appendChild(topSection);
        this.menuContainer.appendChild(middleSection);
        this.menuContainer.appendChild(bottomSection);
        
        document.body.appendChild(this.menuContainer);
    }

    setupMenuContainer(container) {
        Object.assign(container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,0,40,0.95) 100%)',
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '40px 0',
            zIndex: '1000',
            fontFamily: "'Press Start 2P', monospace",
            backdropFilter: 'blur(5px)',
            boxSizing: 'border-box'
        });

        // Add resize handler
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    handleResize() {
        if (!this.menuContainer) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Adjust font sizes based on screen size
        const baseFontSize = Math.min(width, height) * 0.05; // 5% of the smaller dimension
        
        // Update title font size
        const titleElements = this.menuContainer.querySelectorAll('div[style*="font-size: 48px"]');
        titleElements.forEach(el => {
            el.style.fontSize = `${Math.min(baseFontSize, 48)}px`;
        });
        
        // Update menu items font size
        const menuItems = this.menuContainer.querySelectorAll('div[style*="font-size: 24px"]');
        menuItems.forEach(el => {
            el.style.fontSize = `${Math.min(baseFontSize * 0.5, 24)}px`;
        });
        
        // Update instructions font size
        const instructions = this.menuContainer.querySelector('div[style*="font-size: 16px"]');
        if (instructions) {
            instructions.style.fontSize = `${Math.min(baseFontSize * 0.33, 16)}px`;
        }
    }

    createTopSection() {
        const section = document.createElement('div');
        Object.assign(section.style, {
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 40px'
        });

        const highScoreDisplay = this.createScoreElement('HI-SCORE: 0');
        section.appendChild(highScoreDisplay);
        
        return section;
    }

    createScoreElement(text) {
        const element = document.createElement('div');
        Object.assign(element.style, {
            color: '#FFD700',
            fontSize: '24px'
        });
        element.textContent = text;
        return element;
    }

    createMiddleSection() {
        const section = document.createElement('div');
        section.style.textAlign = 'center';

        // Add title
        section.appendChild(this.createTitle());

        // Add menu items
        const menuItemsContainer = this.createMenuItems();
        section.appendChild(menuItemsContainer);

        return section;
    }

    createTitle() {
        const title = document.createElement('div');
        title.innerHTML = `
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="font-size: 48px; letter-spacing: 4px; margin-bottom: 10px; color: #ff69b4; text-shadow: 0 0 10px rgba(255,105,180,0.5); animation: glow 2s ease-in-out infinite alternate;">DONKEY</div>
                <div style="font-size: 48px; letter-spacing: 4px; color: #ff69b4; text-shadow: 0 0 10px rgba(255,105,180,0.5); animation: glow 2s ease-in-out infinite alternate 0.5s;">KONG</div>
                <div style="font-size: 48px; letter-spacing: 4px; color: #ff69b4; text-shadow: 0 0 10px rgba(255,105,180,0.5); animation: glow 2s ease-in-out infinite alternate 1s;">3D</div>
            </div>
            <style>
                @keyframes glow {
                    from {
                        text-shadow: 0 0 10px rgba(255,105,180,0.5);
                    }
                    to {
                        text-shadow: 0 0 20px rgba(255,105,180,0.8),
                                   0 0 30px rgba(255,105,180,0.6),
                                   0 0 40px rgba(255,105,180,0.4);
                    }
                }
            </style>
        `;
        return title;
    }

    createMenuItems() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            minWidth: '200px'
        });

        // Create menu items
        const items = [
            { text: 'PLAY', action: () => this.startGame() },
            { text: 'OPTIONS', action: () => this.showOptions() },
            { text: 'CREDITS', action: () => this.showCredits() }
        ];

        this.menuItems = [];
        items.forEach((item, index) => {
            const menuItem = this.createMenuItem(item.text, item.action);
            container.appendChild(menuItem);
            this.menuItems.push(menuItem);
            
            // Set first item as active by default
            if (index === 0) {
                this.setMenuItemActive(menuItem);
                this.currentSelection = 0;
            }
        });

        return container;
    }

    createMenuItem(text, onClick) {
        const item = document.createElement('div');
        Object.assign(item.style, {
            color: '#ffffff',
            fontSize: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textShadow: '2px 2px 0px rgba(0, 0, 0, 0.5)',
            padding: '10px 20px',
            margin: '5px 0',
            position: 'relative',
            overflow: 'hidden'
        });
        
        item.textContent = text;
        
        // Add hover events
        item.addEventListener('mouseover', () => {
            this.setMenuItemActive(item);
        });
        
        item.addEventListener('mouseout', () => {
            if (this.menuItems[this.currentSelection] !== item) {
                this.setMenuItemInactive(item);
            }
        });
        
        item.addEventListener('click', onClick);
        
        return item;
    }

    setMenuItemActive(item) {
        Object.assign(item.style, {
            color: '#ff69b4',
            transform: 'scale(1.1)',
            textShadow: '0 0 10px rgba(255,105,180,0.8)',
            letterSpacing: '2px'
        });
    }

    setMenuItemInactive(item) {
        Object.assign(item.style, {
            color: '#ffffff',
            transform: 'scale(1)',
            textShadow: '2px 2px 0px rgba(0, 0, 0, 0.5)',
            letterSpacing: '0px'
        });
    }

    createBottomSection() {
        const section = document.createElement('div');
        section.style.textAlign = 'center';
        
        const instructions = document.createElement('div');
        instructions.textContent = 'PRESS ENTER TO START';
        Object.assign(instructions.style, {
            color: '#ffffff',
            fontSize: '16px',
            opacity: '0.8'
        });
        
        section.appendChild(instructions);
        return section;
    }

    checkGameState() {
        if (!this.game) {
            console.error('[MENU] Game instance is not available');
            return false;
        }
        
        if (!this.game.isRunning && !this.isVisible) {
            console.warn('[MENU] Game is not running and menu is not visible');
            return false;
        }
        
        return true;
    }

    startGame() {
        console.log('Menu: Starting game...');
        if (!this.checkGameState()) {
            console.error('[MENU] Cannot start game: invalid game state');
            return;
        }
        
        // Esconder o menu primeiro
        this.hideMenu();
        
        // Garantir que o jogo está inicializado
        if (!this.game.scene) {
            console.log('Initializing game scene...');
            this.game.init().then(() => {
                console.log('Game scene initialized, starting game...');
                this.game.start();
            }).catch(error => {
                console.error('Error initializing game:', error);
                this.showMenu(); // Voltar ao menu em caso de erro
            });
        } else {
            console.log('Game scene already initialized, starting game...');
            this.game.start();
        }
    }

    showMenu() {
        console.log('Showing main menu');
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        window.focus();
        if (this.menuContainer) {
            this.menuContainer.style.display = 'flex';
            this.isVisible = true;
            this.isPauseVisible = false;
            if (this.pauseMenu) {
                this.pauseMenu.style.display = 'none';
            }
            if (this.menuItems && this.menuItems[0]) {
                this.menuItems.forEach(item => this.setMenuItemInactive(item));
                this.setMenuItemActive(this.menuItems[0]);
                this.currentSelection = 0;
            }
        }
        this.setupEventListeners();
    }

    hideMenu() {
        console.log('Hiding menu');
        if (this.menuContainer) {
            this.menuContainer.style.display = 'none';
            this.isVisible = false;
        }
        document.removeEventListener('keydown', this._keydownHandler);
        console.log('[MENU] Listeners de teclado removidos');
    }

    createPauseMenu() {
        this.pauseMenu = document.createElement('div');
        Object.assign(this.pauseMenu.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a0020 0%, #2a003a 100%)',
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
            fontFamily: "'Press Start 2P', monospace",
            backdropFilter: 'blur(5px)'
        });

        // Título PAUSED
        const pauseTitle = document.createElement('div');
        pauseTitle.textContent = 'PAUSED';
        Object.assign(pauseTitle.style, {
            color: '#ff69b4',
            fontSize: '56px',
            marginBottom: '60px',
            textShadow: '0 0 16px #ff69b4, 0 0 32px #000',
            letterSpacing: '2px',
            textAlign: 'center'
        });

        // Opções do menu de pausa
        const pauseOptions = document.createElement('div');
        Object.assign(pauseOptions.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            alignItems: 'center'
        });

        // Helper para criar cada opção
        const createPauseOption = (text, onClick) => {
            const option = document.createElement('div');
            option.textContent = text;
            Object.assign(option.style, {
                color: '#fff',
                fontSize: '32px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textShadow: '2px 2px 0 #000, 0 0 8px #ff69b4',
                padding: '8px 32px',
                borderRadius: '8px',
                userSelect: 'none'
            });
            option.addEventListener('mouseover', () => {
                option.style.color = '#ff69b4';
                option.style.transform = 'scale(1.08)';
                option.style.textShadow = '0 0 16px #ff69b4, 0 0 32px #fff';
            });
            option.addEventListener('mouseout', () => {
                option.style.color = '#fff';
                option.style.transform = 'scale(1)';
                option.style.textShadow = '2px 2px 0 #000, 0 0 8px #ff69b4';
            });
            option.addEventListener('click', onClick);
            return option;
        };

        // Opções
        const resumeOption = createPauseOption('RESUME', () => {
            this.hidePauseMenu();
            if (this.game) this.game.resume();
        });
        const menuOption = createPauseOption('MAIN MENU', () => {
            this.hidePauseMenu();
            if (this.game) this.game.returnToMainMenu();
        });
        const exitOption = createPauseOption('EXIT', () => {
            this.hidePauseMenu();
            if (this.game) this.game.exitGame();
        });

        pauseOptions.appendChild(resumeOption);
        pauseOptions.appendChild(menuOption);
        pauseOptions.appendChild(exitOption);

        this.pauseMenu.appendChild(pauseTitle);
        this.pauseMenu.appendChild(pauseOptions);

        document.body.appendChild(this.pauseMenu);
    }

    showPauseMenu() {
        if (!this.checkGameState()) {
            console.error('[MENU] Cannot show pause menu: invalid game state');
            return;
        }
        
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

    showOptions() {
        this.menuContainer.innerHTML = '';
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        window.focus();
        const optionsContent = document.createElement('div');
        optionsContent.style.display = 'flex';
        optionsContent.style.flexDirection = 'column';
        optionsContent.style.alignItems = 'center';
        optionsContent.style.gap = '40px';

        const title = document.createElement('div');
        title.textContent = 'OPTIONS';
        title.style.color = '#ff69b4';
        title.style.fontSize = '48px';
        title.style.marginBottom = '40px';

        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexDirection = 'column';
        optionsContainer.style.gap = '20px';

        // Mouse sensitivity option
        const sensitivityDiv = document.createElement('div');
        const sensitivityLabel = document.createElement('div');
        sensitivityLabel.textContent = `Mouse Sensitivity: ${Math.round(this.options.sensitivity * 5000)}`;
        sensitivityLabel.style.color = '#ffffff';
        sensitivityLabel.style.marginBottom = '10px';

        const sensitivitySlider = document.createElement('input');
        sensitivitySlider.type = 'range';
        sensitivitySlider.min = '1';
        sensitivitySlider.max = '20';
        sensitivitySlider.value = this.options.sensitivity * 5000;
        sensitivitySlider.style.width = '200px';

        sensitivityDiv.appendChild(sensitivityLabel);
        sensitivityDiv.appendChild(sensitivitySlider);

        // Volume option
        const volumeDiv = document.createElement('div');
        const volumeLabel = document.createElement('div');
        volumeLabel.textContent = `Volume: ${Math.round(this.options.volume * 100)}%`;
        volumeLabel.style.color = '#ffffff';
        volumeLabel.style.marginBottom = '10px';

        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.options.volume * 100;
        volumeSlider.style.width = '200px';

        volumeDiv.appendChild(volumeLabel);
        volumeDiv.appendChild(volumeSlider);

        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.style.marginTop = '40px';
        backButton.style.padding = '10px 20px';
        backButton.style.fontSize = '20px';
        backButton.style.cursor = 'pointer';
        backButton.style.backgroundColor = '#ff69b4';
        backButton.style.border = 'none';
        backButton.style.color = '#ffffff';
        backButton.style.borderRadius = '5px';
        backButton.addEventListener('click', () => {
            this.showMenu();
        });

        optionsContainer.appendChild(sensitivityDiv);
        optionsContainer.appendChild(volumeDiv);
        optionsContainer.appendChild(backButton);

        optionsContent.appendChild(title);
        optionsContent.appendChild(optionsContainer);

        this.menuContainer.appendChild(optionsContent);

        // Add event listeners
        sensitivitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            sensitivityLabel.textContent = `Mouse Sensitivity: ${value}`;
            this.options.sensitivity = value / 5000;
            if (this.game.player) {
                this.game.player.mouseSensitivity = this.options.sensitivity;
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            volumeLabel.textContent = `Volume: ${value}%`;
            this.options.volume = value / 100;
            if (this.game.soundManager) {
                this.game.soundManager.setVolume(this.options.volume);
            }
        });
    }

    showCredits() {
        this.menuContainer.innerHTML = '';
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        window.focus();
        const creditsContent = document.createElement('div');
        creditsContent.style.display = 'flex';
        creditsContent.style.flexDirection = 'column';
        creditsContent.style.alignItems = 'center';
        creditsContent.style.color = '#ffffff';
        creditsContent.style.gap = '20px';

        const title = document.createElement('div');
        title.textContent = 'CREDITS';
        title.style.color = '#ff69b4';
        title.style.fontSize = '48px';
        title.style.marginBottom = '40px';

        const credits = document.createElement('div');
        credits.style.textAlign = 'center';
        credits.style.fontSize = '20px';
        credits.style.lineHeight = '1.5';
        credits.innerHTML = `
            Game Design<br>
            <span style="color: #ff69b4;">Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas</span><br><br>
            Programming<br>
            <span style="color: #ff69b4;">Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas</span><br><br>
            Art & Animation<br>
            <span style="color: #ff69b4;">Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas</span><br><br>
            Music & Sound<br>
            <span style="color: #ff69b4;">Alexandre Ferreira, Rodrigo Venancio, Ricardo Freitas</span><br><br>
        `;

        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.style.marginTop = '40px';
        backButton.style.padding = '10px 20px';
        backButton.style.fontSize = '20px';
        backButton.style.cursor = 'pointer';
        backButton.style.backgroundColor = '#ff69b4';
        backButton.style.border = 'none';
        backButton.style.color = '#ffffff';
        backButton.style.borderRadius = '5px';
        backButton.addEventListener('click', () => {
            this.showMenu();
        });

        creditsContent.appendChild(title);
        creditsContent.appendChild(credits);
        creditsContent.appendChild(backButton);

        this.menuContainer.appendChild(creditsContent);
    }

    dispose() {
        // Remove keyboard listener
        document.removeEventListener('keydown', this._keydownHandler);
        
        // Remove all event listeners from menu items
        if (this.menuItems) {
            this.menuItems.forEach(item => {
                const clone = item.cloneNode(true);
                item.parentNode.replaceChild(clone, item);
            });
        }
        
        // Remove all event listeners from pause menu options
        if (this.pauseMenu) {
            const pauseOptions = this.pauseMenu.querySelectorAll('div[style*="cursor: pointer"]');
            pauseOptions.forEach(option => {
                const clone = option.cloneNode(true);
                option.parentNode.replaceChild(clone, option);
            });
        }
        
        // Remove elements from DOM
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
        }
        if (this.pauseMenu && this.pauseMenu.parentNode) {
            this.pauseMenu.parentNode.removeChild(this.pauseMenu);
        }
        
        // Reset all state
        this.menuContainer = null;
        this.pauseMenu = null;
        this.isVisible = false;
        this.isPauseVisible = false;
        this.menuItems = [];
        this.currentSelection = 0;
        
        console.log('[MENU] Menu disposed successfully');
    }
} 