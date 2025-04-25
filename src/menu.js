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
                RICARDO FREITAS<br> Rodrigo Venâncio<br> Alexandre Ferreira<br> 
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
                console.log('Player selected PLAY option');
                
                // Garantir que o canvas do jogo está visível primeiro
                if (this.game && this.game.renderer) {
                    const canvas = this.game.renderer.domElement;
                    canvas.style.display = 'block';
                    canvas.style.zIndex = '0';
                    
                    // Renderizar um frame para verificar se está funcionando
                    if (this.game.scene && this.game.camera) {
                        console.log('Forçando renderização inicial');
                        this.game.renderer.render(this.game.scene, this.game.camera);
                    }
                }
                
                // Agora esconder o menu e iniciar o jogo
                this.hideMenu();
                this.initializeGame();
                break;
            case 1: // OPTIONS
                console.log('Player selected OPTIONS');
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
        optionsContent.style.display = 'flex';
        optionsContent.style.flexDirection = 'column';
        optionsContent.style.alignItems = 'center';
        optionsContent.style.gap = '20px';
        optionsContent.style.padding = '20px';

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'OPTIONS';
        title.style.fontSize = '32px';
        title.style.marginBottom = '40px';
        title.style.color = '#ff69b4';

        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexDirection = 'column';
        optionsContainer.style.gap = '20px';
        optionsContainer.style.width = '300px';

        // Create sensitivity option
        const sensitivityDiv = document.createElement('div');
        sensitivityDiv.style.display = 'flex';
        sensitivityDiv.style.flexDirection = 'column';
        sensitivityDiv.style.alignItems = 'center';
        sensitivityDiv.style.gap = '10px';

        const sensitivityLabel = document.createElement('label');
        sensitivityLabel.textContent = `Mouse Sensitivity: ${Math.round(this.options.sensitivity * 5000)}`;
        sensitivityLabel.style.fontSize = '16px';

        const sensitivitySlider = document.createElement('input');
        sensitivitySlider.type = 'range';
        sensitivitySlider.min = '1';
        sensitivitySlider.max = '10';
        sensitivitySlider.value = this.options.sensitivity * 5000;
        sensitivitySlider.style.width = '200px';
        sensitivitySlider.style.cursor = 'pointer';

        sensitivityDiv.appendChild(sensitivityLabel);
        sensitivityDiv.appendChild(sensitivitySlider);

        // Create volume option
        const volumeDiv = document.createElement('div');
        volumeDiv.style.display = 'flex';
        volumeDiv.style.flexDirection = 'column';
        volumeDiv.style.alignItems = 'center';
        volumeDiv.style.gap = '10px';

        const volumeLabel = document.createElement('label');
        volumeLabel.textContent = `Volume: ${Math.round(this.options.volume * 100)}%`;
        volumeLabel.style.fontSize = '16px';

        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.options.volume * 100;
        volumeSlider.style.width = '200px';
        volumeSlider.style.cursor = 'pointer';

        volumeDiv.appendChild(volumeLabel);
        volumeDiv.appendChild(volumeSlider);

        // Create fullscreen option
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.style.display = 'flex';
        fullscreenDiv.style.alignItems = 'center';
        fullscreenDiv.style.gap = '10px';
        fullscreenDiv.style.cursor = 'pointer';

        const fullscreenCheckbox = document.createElement('input');
        fullscreenCheckbox.type = 'checkbox';
        fullscreenCheckbox.checked = this.options.fullscreen;
        fullscreenCheckbox.style.cursor = 'pointer';

        const fullscreenLabel = document.createElement('label');
        fullscreenLabel.textContent = 'Fullscreen';
        fullscreenLabel.style.fontSize = '16px';
        fullscreenLabel.style.cursor = 'pointer';

        fullscreenDiv.appendChild(fullscreenCheckbox);
        fullscreenDiv.appendChild(fullscreenLabel);

        // Create back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Menu';
        backButton.style.marginTop = '20px';
        backButton.style.padding = '10px 20px';
        backButton.style.backgroundColor = '#4CAF50';
        backButton.style.border = 'none';
        backButton.style.color = 'white';
        backButton.style.cursor = 'pointer';
        backButton.style.fontSize = '16px';
        backButton.style.borderRadius = '5px';

        // Add all options to container
        optionsContainer.appendChild(sensitivityDiv);
        optionsContainer.appendChild(volumeDiv);
        optionsContainer.appendChild(fullscreenDiv);
        optionsContainer.appendChild(backButton);

        // Add all elements to options content
        optionsContent.appendChild(title);
        optionsContent.appendChild(optionsContainer);

        // Clear and add options content
        this.menuContainer.innerHTML = '';
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
            if (this.game.audio) {
                this.game.audio.setVolume(this.options.volume);
            }
        });

        fullscreenDiv.addEventListener('click', () => {
            fullscreenCheckbox.checked = !fullscreenCheckbox.checked;
            this.options.fullscreen = fullscreenCheckbox.checked;
            if (this.options.fullscreen) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        });

        backButton.addEventListener('click', () => {
            // Restore the main menu content
            this.menuContainer.innerHTML = mainContent;
            
            // Reattach event listeners to menu items
            this.menuItems = Array.from(this.menuContainer.querySelectorAll('div[style*="cursor: pointer"]'));
            this.setupKeyboardControls();
            
            // Reset and update selection
            this.currentSelection = 0;
            this.updateSelection();
            
            // Show the menu
            this.showMenu();
        });
    }

    async initializeGame() {
        try {
            console.log('Iniciando processo de inicialização do jogo...');
            
            // Inicializar o canvas do jogo
            const canvas = this.game.renderer ? this.game.renderer.domElement : null;
            
            // Initialize the game scene first
            if (!this.game.scene) {
                console.log('Inicializando cena do jogo...');
                await this.game.init();
                console.log('Cena inicializada com sucesso');
            }
            
            // Garantir que o canvas está visível
            if (this.game.renderer && this.game.renderer.domElement) {
                this.game.renderer.domElement.style.display = 'block';
                this.game.renderer.domElement.style.zIndex = '1';
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
                
                // Esperar o modelo do jogador carregar com timeout
                let loadingAttempts = 0;
                const maxAttempts = 30; // 3 segundos máximo
                
                await new Promise((resolve, reject) => {
                    const checkLoaded = () => {
                        if (this.game.player.isLoaded) {
                            console.log('Modelo do jogador carregado com sucesso');
                            resolve();
                        } else {
                            loadingAttempts++;
                            console.log(`Aguardando carregamento do modelo... (Tentativa ${loadingAttempts}/${maxAttempts})`);
                            
                            if (loadingAttempts >= maxAttempts) {
                                console.error('Tempo limite excedido para carregar o modelo do jogador');
                                reject(new Error('Tempo limite excedido para carregar o modelo do jogador'));
                            } else {
                                setTimeout(checkLoaded, 100);
                            }
                        }
                    };
                    checkLoaded();
                });
            }

            // Garantir que o jogo está visível
            if (this.game.scene) {
                this.game.scene.visible = true;
            }
            
            // Forçar uma renderização para garantir que algo seja mostrado
            if (this.game.renderer && this.game.scene && this.game.camera) {
                this.game.renderer.render(this.game.scene, this.game.camera);
            }

            // Set player to idle animation and initial position
            if (this.game.player && this.game.player.animations['idle']) {
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
        
        // Garantir que o canvas do jogo está visível
        if (this.game && this.game.renderer) {
            const canvas = this.game.renderer.domElement;
            canvas.style.display = 'block';
            canvas.style.zIndex = '0';
        }
    }

    showMenu() {
        console.log('Showing main menu...');
        if (this.menuContainer) {
            // Ensure menu is in the DOM
            if (!document.body.contains(this.menuContainer)) {
                document.body.appendChild(this.menuContainer);
            }
            
            // Reset menu state
            this.currentSelection = 0;
            
            // Show menu and update selection
            this.menuContainer.style.display = 'flex';
            this.updateSelection();
            
            // Ensure menu is on top
            this.menuContainer.style.zIndex = '9999';
            
            // Reset any game-specific elements
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.style.display = 'none';
            }
        } else {
            console.log('Creating new menu...');
            this.init();
        }
    }

    createPauseMenu() {
        // Remove existing pause menu if it exists
        if (this.pauseMenu) {
            document.body.removeChild(this.pauseMenu);
        }

        this.pauseMenu = document.createElement('div');
        this.pauseMenu.style.position = 'fixed';
        this.pauseMenu.style.top = '0';
        this.pauseMenu.style.left = '0';
        this.pauseMenu.style.width = '100%';
        this.pauseMenu.style.height = '100%';
        this.pauseMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        this.pauseMenu.style.display = 'none';
        this.pauseMenu.style.flexDirection = 'column';
        this.pauseMenu.style.alignItems = 'center';
        this.pauseMenu.style.justifyContent = 'center';
        this.pauseMenu.style.zIndex = '9999';
        this.pauseMenu.style.fontFamily = "'Press Start 2P', monospace";
        this.pauseMenu.style.pointerEvents = 'auto';

        // Create pause title
        const pauseTitle = document.createElement('div');
        pauseTitle.textContent = 'PAUSED';
        pauseTitle.style.color = '#ff69b4';
        pauseTitle.style.fontSize = '48px';
        pauseTitle.style.marginBottom = '60px';
        pauseTitle.style.textShadow = '4px 4px 0px rgba(0, 0, 0, 0.5)';

        // Create pause menu options container
        const pauseOptions = document.createElement('div');
        pauseOptions.style.display = 'flex';
        pauseOptions.style.flexDirection = 'column';
        pauseOptions.style.gap = '30px';
        pauseOptions.style.alignItems = 'center';

        // Create pause menu options
        const resumeOption = document.createElement('div');
        resumeOption.textContent = 'RESUME';
        resumeOption.style.color = '#ffffff';
        resumeOption.style.fontSize = '24px';
        resumeOption.style.cursor = 'pointer';
        resumeOption.style.textShadow = '2px 2px 0px rgba(0, 0, 0, 0.5)';
        resumeOption.addEventListener('click', () => this.resumeGame());

        const menuOption = document.createElement('div');
        menuOption.textContent = 'RETURN TO MENU';
        menuOption.style.color = '#ffffff';
        menuOption.style.fontSize = '24px';
        menuOption.style.cursor = 'pointer';
        menuOption.style.textShadow = '2px 2px 0px rgba(0, 0, 0, 0.5)';
        menuOption.addEventListener('click', () => this.returnToMainMenu());

        const exitOption = document.createElement('div');
        exitOption.textContent = 'EXIT';
        exitOption.style.color = '#ffffff';
        exitOption.style.fontSize = '24px';
        exitOption.style.cursor = 'pointer';
        exitOption.style.textShadow = '2px 2px 0px rgba(0, 0, 0, 0.5)';
        exitOption.addEventListener('click', () => this.exitGame());

        // Add hover and selection effects
        [resumeOption, menuOption, exitOption].forEach(option => {
            option.addEventListener('mouseover', () => {
                option.style.color = '#ff69b4';
                option.classList.add('selected');
            });
            option.addEventListener('mouseout', () => {
                if (!option.classList.contains('selected')) {
                    option.style.color = '#ffffff';
                }
            });
        });

        // Add options to container
        pauseOptions.appendChild(resumeOption);
        pauseOptions.appendChild(menuOption);
        pauseOptions.appendChild(exitOption);

        // Add elements to pause menu
        this.pauseMenu.appendChild(pauseTitle);
        this.pauseMenu.appendChild(pauseOptions);

        // Add pause menu to document
        document.body.appendChild(this.pauseMenu);

        // Add keyboard navigation for pause menu
        this.setupPauseMenuKeyboardControls([resumeOption, menuOption, exitOption]);
    }

    setupPauseMenuKeyboardControls(options) {
        const handleKeydown = (e) => {
            if (!this.pauseMenu || this.pauseMenu.style.display === 'none') return;

            let currentIndex = options.findIndex(opt => opt.classList.contains('selected'));
            if (currentIndex === -1) currentIndex = 0;

            switch (e.key) {
                case 'ArrowUp':
                    currentIndex = (currentIndex - 1 + options.length) % options.length;
                    break;
                case 'ArrowDown':
                    currentIndex = (currentIndex + 1) % options.length;
                    break;
                case 'Enter':
                    options[currentIndex].click();
                    break;
                case 'Escape':
                    this.resumeGame();
                    break;
            }

            options.forEach((opt, i) => {
                if (i === currentIndex) {
                    opt.style.color = '#ff69b4';
                    opt.classList.add('selected');
                } else {
                    opt.style.color = '#ffffff';
                    opt.classList.remove('selected');
                }
            });
        };

        // Remove existing listener if any
        if (this._pauseMenuKeyHandler) {
            document.removeEventListener('keydown', this._pauseMenuKeyHandler);
        }

        this._pauseMenuKeyHandler = handleKeydown;
        document.addEventListener('keydown', this._pauseMenuKeyHandler);
    }

    showPauseMenu() {
        console.log('Showing pause menu...');
        
        // Remover qualquer instrução de clique existente
        const instruction = document.getElementById('pointer-lock-instruction');
        if (instruction) {
            instruction.remove();
            console.log('Removing instruction before showing pause menu');
        }
        
        if (this.pauseMenu) {
            // Ensure the menu is in the DOM
            if (!document.body.contains(this.pauseMenu)) {
                document.body.appendChild(this.pauseMenu);
            }
            this.pauseMenu.style.display = 'flex';
            
            // Reset selection to first option
            const options = this.pauseMenu.querySelectorAll('div[style*="cursor: pointer"]');
            options.forEach((opt, i) => {
                if (i === 0) {
                    opt.style.color = '#ff69b4';
                    opt.classList.add('selected');
                } else {
                    opt.style.color = '#ffffff';
                    opt.classList.remove('selected');
                }
            });
        } else {
            console.log('Creating pause menu...');
            this.createPauseMenu();
            this.showPauseMenu();
        }
    }

    hidePauseMenu() {
        console.log('Hiding pause menu...');
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'none';
            // Remove from DOM to ensure it's completely hidden
            if (document.body.contains(this.pauseMenu)) {
                document.body.removeChild(this.pauseMenu);
            }
        }
    }

    resumeGame() {
        // Remover qualquer instrução de clique existente
        const instruction = document.getElementById('pointer-lock-instruction');
        if (instruction) {
            instruction.remove();
            console.log('Removing instruction before resuming game');
        }
        
        // Resumir o jogo
        this.game.resume();
    }

    returnToMainMenu() {
        console.log('Returning to landing page...');
        // Reload the page to return to the initial state
        window.location.reload();
    }

    exitGame() {
        this.game.exitGame();
    }
} 