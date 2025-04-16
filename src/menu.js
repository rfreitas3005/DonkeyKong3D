export class GameMenu {
    constructor(game) {
        this.game = game;
        this.options = {
            sensitivity: 0.002,
            volume: 0.5,
            fullscreen: false
        };
        this.menuContainer = null;
        this.pauseMenu = null;
        this.currentSelection = 0; // 0 = PLAY, 1 = OPTIONS
        this.menuItems = [];
        this.init();
    }

    init() {
        // Create main menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.style.position = 'fixed';
        this.menuContainer.style.top = '0';
        this.menuContainer.style.left = '0';
        this.menuContainer.style.width = '100%';
        this.menuContainer.style.height = '100%';
        this.menuContainer.style.backgroundColor = 'black';
        this.menuContainer.style.display = 'flex';
        this.menuContainer.style.flexDirection = 'column';
        this.menuContainer.style.alignItems = 'center';
        this.menuContainer.style.justifyContent = 'space-between';
        this.menuContainer.style.padding = '100px 0';
        this.menuContainer.style.zIndex = '1000';
        this.menuContainer.style.fontFamily = "'Press Start 2P', monospace";

        // Create top section for scores
        const topSection = document.createElement('div');
        topSection.style.width = '100%';
        topSection.style.display = 'flex';
        topSection.style.justifyContent = 'space-between';
        topSection.style.padding = '0 20px';

        // Create score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.style.color = 'white';
        scoreDisplay.style.fontSize = '16px';
        scoreDisplay.innerHTML = `
            <div>SCORE</div>
            <div>000000</div>
        `;

        // Create high score display
        const highScoreDisplay = document.createElement('div');
        highScoreDisplay.style.color = 'white';
        highScoreDisplay.style.fontSize = '16px';
        highScoreDisplay.style.textAlign = 'right';
        highScoreDisplay.innerHTML = `
            <div>HIGH SCORE</div>
            <div>000000</div>
        `;

        topSection.appendChild(scoreDisplay);
        topSection.appendChild(highScoreDisplay);

        // Create middle section for title and menu items
        const middleSection = document.createElement('div');
        middleSection.style.textAlign = 'center';

        // Create title
        const title = document.createElement('div');
        title.innerHTML = `
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="font-size: 48px; letter-spacing: 4px; margin-bottom: 10px; color: #ff69b4;">DONKEY</div>
                <div style="font-size: 48px; letter-spacing: 4px; color: #ff69b4;">KONG</div>
                <div style="font-size: 48px; letter-spacing: 4px; color: #ff69b4; margin-top: 10px;">3D</div>
            </div>
        `;

        // Create menu items container
        const menuItemsContainer = document.createElement('div');
        menuItemsContainer.style.display = 'flex';
        menuItemsContainer.style.flexDirection = 'column';
        menuItemsContainer.style.alignItems = 'center';
        menuItemsContainer.style.gap = '20px';
        menuItemsContainer.style.marginTop = '40px';

        // Create PLAY option
        const playOption = document.createElement('div');
        playOption.textContent = 'PLAY';
        playOption.style.color = '#cccccc';
        playOption.style.fontSize = '24px';
        playOption.style.cursor = 'pointer';
        this.menuItems.push(playOption);

        // Create OPTIONS option
        const optionsButton = document.createElement('div');
        optionsButton.textContent = 'OPTIONS';
        optionsButton.style.color = '#cccccc';
        optionsButton.style.fontSize = '24px';
        optionsButton.style.cursor = 'pointer';
        this.menuItems.push(optionsButton);

        menuItemsContainer.appendChild(playOption);
        menuItemsContainer.appendChild(optionsButton);

        // Add blink animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 1; }
            }
            .selected {
                animation: blink 1s infinite;
                color: white !important;
            }
        `;
        document.head.appendChild(style);

        middleSection.appendChild(title);
        middleSection.appendChild(menuItemsContainer);

        // Create bottom section for credits
        const credits = document.createElement('div');
        credits.innerHTML = `
            <div style="text-align: center; color: #00bfff; font-size: 14px;">
                RICARDO FREITAS<br>
                © 2025
            </div>
        `;

        // Add all sections to menu
        this.menuContainer.appendChild(topSection);
        this.menuContainer.appendChild(middleSection);
        this.menuContainer.appendChild(credits);

        // Add menu to document
        document.body.appendChild(this.menuContainer);

        // Create pause menu (hidden initially)
        this.createPauseMenu();

        // Add keyboard controls
        this.setupKeyboardControls();

        // Initialize selection
        this.updateSelection();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.menuContainer || this.menuContainer.style.display === 'none') return;

            switch (e.key) {
                case 'ArrowUp':
                    this.currentSelection = Math.max(0, this.currentSelection - 1);
                    this.updateSelection();
                    break;
                case 'ArrowDown':
                    this.currentSelection = Math.min(this.menuItems.length - 1, this.currentSelection + 1);
                    this.updateSelection();
                    break;
                case 'Enter':
                    this.selectCurrentOption();
                    break;
            }
        });

        // Add click handlers
        this.menuItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.currentSelection = index;
                this.updateSelection();
                this.selectCurrentOption();
            });

            // Add hover effect
            item.addEventListener('mouseover', () => {
                this.currentSelection = index;
                this.updateSelection();
            });
        });
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

    selectCurrentOption() {
        switch (this.currentSelection) {
            case 0: // PLAY
                this.hideMenu();
                this.initializeGame();
                break;
            case 1: // OPTIONS
                this.showOptionsMenu();
                break;
        }
    }

    showOptionsMenu() {
        // Save current menu content
        const mainContent = this.menuContainer.innerHTML;

        // Create options menu content
        const optionsContent = document.createElement('div');
        optionsContent.style.color = 'white';
        optionsContent.style.textAlign = 'center';
        optionsContent.innerHTML = `
            <h2 style="font-size: 32px; margin-bottom: 40px;">OPTIONS</h2>
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label>Mouse Sensitivity: ${Math.round(this.options.sensitivity * 5000)}</label>
                    <input type="range" min="1" max="10" value="${this.options.sensitivity * 5000}" 
                           style="width: 200px; margin-top: 10px;"
                           onInput="this.previousElementSibling.textContent = 'Mouse Sensitivity: ' + this.value">
                        </div>
                <div>
                    <label>Volume: ${Math.round(this.options.volume * 100)}%</label>
                    <input type="range" min="0" max="100" value="${this.options.volume * 100}"
                           style="width: 200px; margin-top: 10px;"
                           onInput="this.previousElementSibling.textContent = 'Volume: ' + this.value + '%'">
                    </div>
                <div>
                    <label>
                        <input type="checkbox" ${this.options.fullscreen ? 'checked' : ''}>
                            Fullscreen
                        </label>
                </div>
                <button style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; border: none; color: white; cursor: pointer;">
                    Back to Menu
                </button>
            </div>
        `;

        // Clear and add options content
        this.menuContainer.innerHTML = '';
        this.menuContainer.appendChild(optionsContent);

        // Add event listeners for options
        const sensitivitySlider = optionsContent.querySelector('input[type="range"]:first-of-type');
        sensitivitySlider.addEventListener('change', (e) => {
            this.options.sensitivity = e.target.value / 5000;
            if (this.game.player) {
                this.game.player.mouseSensitivity = this.options.sensitivity;
            }
        });

        const volumeSlider = optionsContent.querySelector('input[type="range"]:nth-of-type(2)');
        volumeSlider.addEventListener('change', (e) => {
            this.options.volume = e.target.value / 100;
            // Implement volume control when audio is added
        });

        const fullscreenCheckbox = optionsContent.querySelector('input[type="checkbox"]');
        fullscreenCheckbox.addEventListener('change', (e) => {
            this.options.fullscreen = e.target.checked;
            if (this.options.fullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        });

        // Add back button functionality
        const backButton = optionsContent.querySelector('button');
        backButton.addEventListener('click', () => {
            this.menuContainer.innerHTML = mainContent;
            this.setupKeyboardControls();
            this.updateSelection();
        });
    }

    async initializeGame() {
        try {
            console.log('Iniciando processo de inicialização do jogo...');
            
            // Initialize the game scene first
            if (!this.game.scene) {
                console.log('Inicializando cena do jogo...');
                await this.game.init();
                console.log('Cena inicializada com sucesso');
            }

            console.log('Inicializando nível e jogador...');
            
            // Initialize level and player but don't start movement yet
            if (!this.game.level) {
                console.log('Criando nível...');
                this.game.level = new Level(this.game.scene);
            }
            
            if (!this.game.player) {
                console.log('Criando jogador...');
                this.game.player = new Player(this.game.scene, this.game.camera);
                console.log('Jogador criado, aguardando carregamento do modelo...');
                
                // Esperar o modelo do jogador carregar
                await new Promise((resolve) => {
                    const checkLoaded = () => {
                        if (this.game.player.isLoaded) {
                            console.log('Modelo do jogador carregado com sucesso');
                            resolve();
                        } else {
                            console.log('Aguardando carregamento do modelo...');
                            setTimeout(checkLoaded, 100);
                        }
                    };
                    checkLoaded();
                });
            }

            // Set player to idle animation and initial position
            if (this.game.player.animations['idle']) {
                console.log('Iniciando animação idle...');
                this.game.player.playAnimation('idle');
            }

            console.log('Iniciando contagem regressiva...');
            // Start the countdown sequence after everything is loaded
            await this.game.startCountdown();
            
        } catch (error) {
            console.error('Erro durante a inicialização do jogo:', error);
            // Mostrar mensagem de erro para o usuário
            const errorMessage = document.createElement('div');
            errorMessage.style.position = 'fixed';
            errorMessage.style.top = '50%';
            errorMessage.style.left = '50%';
            errorMessage.style.transform = 'translate(-50%, -50%)';
            errorMessage.style.color = 'red';
            errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            errorMessage.style.padding = '20px';
            errorMessage.style.fontFamily = "'Press Start 2P', monospace";
            errorMessage.style.fontSize = '16px';
            errorMessage.style.textAlign = 'center';
            errorMessage.style.zIndex = '2000';
            errorMessage.innerHTML = `ERRO AO INICIAR JOGO<br>Por favor, recarregue a página`;
            document.body.appendChild(errorMessage);
            
            // Mostrar o menu novamente após 3 segundos
            setTimeout(() => {
                this.showMenu();
                errorMessage.remove();
            }, 3000);
        }
    }

    hideMenu() {
        if (this.menuContainer) {
            this.menuContainer.style.display = 'none';
        }
    }

    showMenu() {
        if (this.menuContainer) {
            this.menuContainer.style.display = 'flex';
        }
    }

    createPauseMenu() {
        this.pauseMenu = document.createElement('div');
        this.pauseMenu.style.position = 'fixed';
        this.pauseMenu.style.top = '50%';
        this.pauseMenu.style.left = '50%';
        this.pauseMenu.style.transform = 'translate(-50%, -50%)';
        this.pauseMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.pauseMenu.style.padding = '20px';
        this.pauseMenu.style.borderRadius = '10px';
        this.pauseMenu.style.display = 'none';
        this.pauseMenu.style.zIndex = '1000';
        this.pauseMenu.style.fontFamily = "'Press Start 2P', monospace";
        this.pauseMenu.style.color = 'white';
        this.pauseMenu.style.textAlign = 'center';

        const title = document.createElement('h2');
        title.textContent = 'PAUSED';
        title.style.marginBottom = '20px';

        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Resume';
        resumeButton.style.marginBottom = '10px';
        resumeButton.style.padding = '10px 20px';
        resumeButton.style.backgroundColor = '#4CAF50';
        resumeButton.style.border = 'none';
        resumeButton.style.color = 'white';
        resumeButton.style.cursor = 'pointer';
        resumeButton.style.fontFamily = "'Press Start 2P', monospace";
        resumeButton.style.fontSize = '16px';
        resumeButton.addEventListener('click', () => this.resumeGame());

        const mainMenuButton = document.createElement('button');
        mainMenuButton.textContent = 'Main Menu';
        mainMenuButton.style.padding = '10px 20px';
        mainMenuButton.style.backgroundColor = '#f44336';
        mainMenuButton.style.border = 'none';
        mainMenuButton.style.color = 'white';
        mainMenuButton.style.cursor = 'pointer';
        mainMenuButton.style.fontFamily = "'Press Start 2P', monospace";
        mainMenuButton.style.fontSize = '16px';
        mainMenuButton.addEventListener('click', () => {
            this.hidePauseMenu();
            this.showMenu();
            // Reset game state if needed
        });

        this.pauseMenu.appendChild(title);
        this.pauseMenu.appendChild(resumeButton);
        this.pauseMenu.appendChild(document.createElement('br'));
        this.pauseMenu.appendChild(document.createElement('br'));
        this.pauseMenu.appendChild(mainMenuButton);

        document.body.appendChild(this.pauseMenu);
    }

    showPauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'block';
        }
    }

    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'none';
        }
    }

    resumeGame() {
        this.hidePauseMenu();
        this.game.resume();
    }
} 