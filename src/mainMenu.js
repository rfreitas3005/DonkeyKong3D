export class MainMenu {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.visible = false;
        this.createMenu();
    }

    createMenu() {
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.textAlign = 'center';
        this.container.style.color = 'white';
        this.container.style.fontFamily = "'Press Start 2P', Arial, sans-serif";
        this.container.style.display = 'none';
        this.container.style.zIndex = '1000';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.container.style.padding = '40px';
        this.container.style.borderRadius = '20px';
        this.container.style.boxShadow = '0 0 20px rgba(255, 0, 85, 0.5)';
        this.container.style.border = '3px solid #ff0055';

        // Title
        const title = document.createElement('h1');
        title.textContent = 'DONKEY KONG 3D';
        title.style.fontSize = '48px';
        title.style.marginBottom = '40px';
        title.style.color = '#ff0055';
        title.style.textShadow = '3px 3px 0 #000';
        this.container.appendChild(title);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '20px';
        buttonContainer.style.alignItems = 'center';

        // Start Game button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        this.styleButton(startButton);
        startButton.addEventListener('click', () => this.handleStartGame());
        buttonContainer.appendChild(startButton);

        // Controls button
        const controlsButton = document.createElement('button');
        controlsButton.textContent = 'Controls';
        this.styleButton(controlsButton);
        controlsButton.addEventListener('click', () => this.showControls());
        buttonContainer.appendChild(controlsButton);

        // Exit button
        const exitButton = document.createElement('button');
        exitButton.textContent = 'Exit';
        this.styleButton(exitButton);
        exitButton.addEventListener('click', () => this.handleExit());
        buttonContainer.appendChild(exitButton);

        this.container.appendChild(buttonContainer);
        document.body.appendChild(this.container);
    }

    styleButton(button) {
        button.style.padding = '15px 30px';
        button.style.fontSize = '24px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.3s ease';
        button.style.width = '250px';
        button.style.fontFamily = "'Press Start 2P', Arial, sans-serif";
        button.style.textTransform = 'uppercase';

        // Hover effect
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#45a049';
            button.style.transform = 'scale(1.05)';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
            button.style.transform = 'scale(1)';
        });
    }

    show() {
        this.visible = true;
        this.container.style.display = 'block';
    }

    hide() {
        this.visible = false;
        this.container.style.display = 'none';
    }

    handleStartGame() {
        this.hide();
        if (this.game) {
            this.game.start();
        }
    }

    showControls() {
        // Create controls overlay
        const controlsOverlay = document.createElement('div');
        controlsOverlay.style.position = 'fixed';
        controlsOverlay.style.top = '50%';
        controlsOverlay.style.left = '50%';
        controlsOverlay.style.transform = 'translate(-50%, -50%)';
        controlsOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        controlsOverlay.style.padding = '40px';
        controlsOverlay.style.borderRadius = '20px';
        controlsOverlay.style.color = 'white';
        controlsOverlay.style.fontFamily = "'Press Start 2P', Arial, sans-serif";
        controlsOverlay.style.zIndex = '2000';
        controlsOverlay.style.border = '3px solid #ff0055';

        const controls = [
            { key: 'WASD / Arrow Keys', action: 'Move' },
            { key: 'Space', action: 'Jump' },
            { key: 'P / ESC', action: 'Pause' },
            { key: 'Mouse', action: 'Look Around' }
        ];

        const title = document.createElement('h2');
        title.textContent = 'Controls';
        title.style.marginBottom = '30px';
        title.style.color = '#ff0055';
        controlsOverlay.appendChild(title);

        controls.forEach(control => {
            const controlDiv = document.createElement('div');
            controlDiv.style.marginBottom = '20px';
            controlDiv.style.display = 'flex';
            controlDiv.style.justifyContent = 'space-between';
            controlDiv.style.gap = '40px';

            const keySpan = document.createElement('span');
            keySpan.textContent = control.key;
            keySpan.style.color = '#ff0055';

            const actionSpan = document.createElement('span');
            actionSpan.textContent = control.action;

            controlDiv.appendChild(keySpan);
            controlDiv.appendChild(actionSpan);
            controlsOverlay.appendChild(controlDiv);
        });

        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        this.styleButton(backButton);
        backButton.style.marginTop = '30px';
        backButton.addEventListener('click', () => {
            document.body.removeChild(controlsOverlay);
        });
        controlsOverlay.appendChild(backButton);

        document.body.appendChild(controlsOverlay);
    }

    handleExit() {
        if (this.game) {
            this.game.exitGame();
        }
    }
} 