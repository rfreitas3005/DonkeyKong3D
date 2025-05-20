import * as THREE from 'three';

export class GameOverScreen {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.visible = false;
        this.createScreen();
    }

    createScreen() {
        // Create container with fade-in animation
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.container.style.display = 'none';
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.5s ease-in-out';
        this.container.style.zIndex = '1000';

        // Create content container
        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = '50%';
        content.style.left = '50%';
        content.style.transform = 'translate(-50%, -50%)';
        content.style.textAlign = 'center';
        content.style.width = '100%';

        // Game Over text with retro style
        const title = document.createElement('h1');
        title.textContent = 'GAME OVER';
        title.style.fontSize = '96px';
        title.style.marginBottom = '40px';
        title.style.fontFamily = "'Press Start 2P', Arial, sans-serif";
        title.style.color = '#ff0055';
        title.style.textShadow = '4px 4px 0 #000';
        title.style.animation = 'pulse 2s infinite';
        title.style.letterSpacing = '-8px';
        title.style.wordSpacing = '-20px';
        content.appendChild(title);

        // Mensagem sarcástica
        const message = document.createElement('p');
        message.textContent = 'FOR GOD SAKE... THE GAME IS NOT THAT HARD';
        message.style.fontSize = '19px';
        message.style.marginBottom = '80px';
        message.style.fontFamily = "'Press Start 2P', Arial, sans-serif";
        message.style.color = 'white';
        message.style.textShadow = '2px 2px 0 #000';
        message.style.padding = '0 20px';
        message.style.lineHeight = '1.5';
        content.appendChild(message);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.gap = '20px';
        buttonContainer.style.marginTop = '0px';

        // Add buttons with menu style
        const buttons = [
            { text: 'RESTART', handler: () => this.handleRestart() },
            { text: 'RETURN TO MENU', handler: () => this.handleReturnToMenu() }
        ];

        buttons.forEach((btn, index) => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            this.styleButton(button);
            
            // Add hover and focus effects
            button.addEventListener('mouseover', () => this.onButtonHover(button));
            button.addEventListener('mouseout', () => this.onButtonOut(button));
            button.addEventListener('click', btn.handler);
            
            buttonContainer.appendChild(button);
        });

        content.appendChild(buttonContainer);
        this.container.appendChild(content);
        document.body.appendChild(this.container);

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes buttonPulse {
                0% { transform: scale(1); filter: brightness(1); }
                50% { transform: scale(1.1); filter: brightness(1.5); }
                100% { transform: scale(1); filter: brightness(1); }
            }
        `;
        document.head.appendChild(style);
    }

    styleButton(button) {
        Object.assign(button.style, {
            padding: '15px 30px',
            fontSize: '24px',
            fontFamily: "'Press Start 2P', Arial, sans-serif",
            color: 'white',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textShadow: '2px 2px 0 #000',
            letterSpacing: '-4px',
            wordSpacing: '-8px',
            outline: 'none',
            textTransform: 'uppercase'
        });
    }

    onButtonHover(button) {
        button.style.animation = 'buttonPulse 1s infinite';
        button.style.color = '#ff0055';
    }

    onButtonOut(button) {
        button.style.animation = 'none';
        button.style.color = 'white';
    }

    show() {
        this.visible = true;
        this.container.style.display = 'block';
        // Force a reflow before setting opacity for smooth transition
        this.container.offsetHeight;
        this.container.style.opacity = '1';
    }

    hide() {
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.visible = false;
            this.container.style.display = 'none';
        }, 500); // Match the transition duration
    }

    handleRestart() {
        this.hide();
        if (this.game) {
            // Reset game state
            this.game.reset();
            // Start countdown and game like when clicking play
            this.game.start();
        }
    }

    handleReturnToMenu() {
        this.hide();
        if (this.game) {
            // Return to main menu
            this.game.returnToMainMenu();
        }
    }
} 