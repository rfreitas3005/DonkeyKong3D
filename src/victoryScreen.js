export class VictoryScreen {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.menuItems = [];
        this.currentSelection = 0;
        this.createScreen();
    }

    createScreen() {
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.container.style.display = 'none';
        this.container.style.zIndex = '1000';
        this.container.style.fontFamily = "'Press Start 2P', monospace";
        
        // Create menu content
        const menuContent = document.createElement('div');
        menuContent.style.position = 'absolute';
        menuContent.style.top = '50%';
        menuContent.style.left = '50%';
        menuContent.style.transform = 'translate(-50%, -50%)';
        menuContent.style.textAlign = 'center';
        menuContent.style.color = '#FFD700';
        menuContent.style.padding = '40px';
        menuContent.style.borderRadius = '20px';
        menuContent.style.border = '3px solid #FFD700';
        menuContent.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = 'VICTORY!';
        title.style.fontSize = '48px';
        title.style.marginBottom = '20px';
        title.style.textShadow = '3px 3px 0 #000';
        
        // Create congratulations message
        const message = document.createElement('div');
        message.style.fontSize = '24px';
        message.style.marginBottom = '30px';
        message.style.color = '#FFD700';
        message.textContent = 'You reached Donkey Kong!';
        
        // Create final score display
        const finalScore = document.createElement('div');
        finalScore.style.fontSize = '20px';
        finalScore.style.marginBottom = '20px';
        finalScore.style.color = '#FFD700';
        
        // Create high score display
        const hiScore = document.createElement('div');
        hiScore.style.fontSize = '20px';
        hiScore.style.marginBottom = '40px';
        hiScore.style.color = '#FFD700';
        
        // Create menu items container
        const menuItemsContainer = document.createElement('div');
        menuItemsContainer.style.display = 'flex';
        menuItemsContainer.style.flexDirection = 'column';
        menuItemsContainer.style.gap = '20px';
        menuItemsContainer.style.alignItems = 'center';
        
        // Create menu items
        const menuItemsData = [
            { text: 'PLAY AGAIN', action: () => {
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
            menuItem.style.cursor = 'pointer';
            menuItem.style.padding = '10px 20px';
            menuItem.style.fontSize = '20px';
            menuItem.style.transition = 'all 0.3s ease';
            menuItem.textContent = item.text;
            
            menuItem.addEventListener('mouseover', () => {
                this.currentSelection = index;
                this.updateSelection();
            });
            
            menuItem.addEventListener('click', item.action);
            menuItemsContainer.appendChild(menuItem);
            this.menuItems.push(menuItem);
        });
        
        // Add scanline effect
        const scanline = document.createElement('div');
        scanline.style.position = 'absolute';
        scanline.style.top = '0';
        scanline.style.left = '0';
        scanline.style.width = '100%';
        scanline.style.height = '100%';
        scanline.style.background = 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)';
        scanline.style.backgroundSize = '100% 4px';
        scanline.style.animation = 'scanline 0.1s linear infinite';
        scanline.style.pointerEvents = 'none';
        
        // Add styles for scanline animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scanline {
                0% { transform: translateY(0); }
                100% { transform: translateY(4px); }
            }
        `;
        document.head.appendChild(style);
        
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
        
        // Setup keyboard controls
        this.setupControls();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.container.style.display === 'none') return;
            
            switch(e.code) {
                case 'ArrowUp':
                    this.currentSelection = Math.max(0, this.currentSelection - 1);
                    this.updateSelection();
                    break;
                case 'ArrowDown':
                    this.currentSelection = Math.min(this.menuItems.length - 1, this.currentSelection + 1);
                    this.updateSelection();
                    break;
                case 'Enter':
                case 'Space':
                    this.menuItems[this.currentSelection].click();
                    break;
            }
        });
    }
    
    updateSelection() {
        this.menuItems.forEach((item, index) => {
            if (index === this.currentSelection) {
                item.style.color = '#FFD700';
                item.style.transform = 'scale(1.1)';
                item.style.textShadow = '0 0 10px #FFD700';
            } else {
                item.style.color = '#FFF';
                item.style.transform = 'scale(1)';
                item.style.textShadow = 'none';
            }
        });
    }
    
    show(score, highScore) {
        const finalScore = this.container.querySelector('div:nth-child(3)');
        const hiScore = this.container.querySelector('div:nth-child(4)');
        
        finalScore.textContent = `FINAL SCORE: ${score}`;
        hiScore.textContent = `HIGH SCORE: ${highScore}`;
        
        this.container.style.display = 'block';
        this.currentSelection = 0;
        this.updateSelection();
    }
    
    hide() {
        this.container.style.display = 'none';
    }
} 