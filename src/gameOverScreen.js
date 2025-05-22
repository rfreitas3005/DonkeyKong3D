import * as THREE from 'three';
import './menu.css';

export class GameOverScreen {
    constructor(game) {
        this.game = game;
        this.container = document.createElement('div');
        this.container.className = 'menu-container';
        
        // Initialize menu items array first
        this.menuItems = [];
        this.currentSelection = 0;
        
        // Add Google Fonts link if not already present
        if (!document.querySelector('link[href*="Press+Start+2P"]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            document.head.appendChild(fontLink);
        }
        
        // Create menu content
        const menuContent = document.createElement('div');
        menuContent.className = 'menu-content';

        // Create hi-score display
        const hiScore = document.createElement('div');
        hiScore.className = 'hi-score';
        hiScore.id = 'high-score';
        hiScore.innerHTML = 'HI-SCORE: 0';

        // Create title
        const title = document.createElement('div');
        title.className = 'game-title game-over-title';
        title.innerHTML = '<span>GAME</span><span>OVER</span>';

        // Create sarcastic message
        const message = document.createElement('div');
        message.className = 'game-message';
        message.innerHTML = 'FOR GOD SAKE... THE GAME IS NOT THAT HARD';

        // Create score display
        const finalScore = document.createElement('div');
        finalScore.className = 'final-score';
        finalScore.id = 'final-score';
        finalScore.innerHTML = 'FINAL SCORE: 0';

        // Create menu items container
        const menuItemsContainer = document.createElement('div');
        menuItemsContainer.className = 'menu-items';
        menuItemsContainer.style.marginTop = '2rem';
        
        // Create menu items
        const menuItemsData = [
            { text: 'RESTART', action: () => {
                this.hide();
                this.game.reset();
                this.game.start();
            }},
            { text: 'RETURN TO MENU', action: () => {
                this.hide();
                this.game.returnToMainMenu();
            }}
        ];
        
        menuItemsData.forEach((item, index) => {
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

        // Add scanline effect
        const scanline = document.createElement('div');
        scanline.className = 'scanline';
        
        // Assemble menu
        menuContent.appendChild(title);
        menuContent.appendChild(message);
        menuContent.appendChild(finalScore);
        menuContent.appendChild(hiScore);
        menuContent.appendChild(menuItemsContainer);
        
        this.container.appendChild(menuContent);
        this.container.appendChild(scanline);
        
        // Add to body but keep hidden
        document.body.appendChild(this.container);
        this.container.style.display = 'none';
        
        // Setup keyboard controls
        this.setupControls();
    }

    setupControls() {
        this._keydownHandler = (e) => {
            if (this.container.style.display !== 'none') {
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
        };
        
        document.addEventListener('keydown', this._keydownHandler);
    }

    navigateMenu(direction) {
        const items = this.menuItems;
        if (items.length === 0) return;
        
        this.currentSelection = (this.currentSelection + direction + items.length) % items.length;
        this.updateSelection();
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

    selectCurrentItem() {
        const currentItem = this.menuItems[this.currentSelection];
        if (currentItem) {
            currentItem.click();
        }
    }

    show(finalScore = 0, highScore = 0) {
        // Update scores
        const finalScoreElement = document.getElementById('final-score');
        const highScoreElement = document.getElementById('high-score');
        
        if (finalScoreElement) {
            finalScoreElement.textContent = `FINAL SCORE: ${finalScore}`;
        }
        if (highScoreElement) {
            highScoreElement.textContent = `HI-SCORE: ${highScore}`;
        }
        
        // Show container with fade effect
        this.container.style.display = 'flex';
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
        
        // Set initial selection
        this.currentSelection = 0;
        this.updateSelection();
    }

    hide() {
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 500);
    }

    dispose() {
        document.removeEventListener('keydown', this._keydownHandler);
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 