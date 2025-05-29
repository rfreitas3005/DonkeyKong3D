export class OptionsMenu {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.options = game.menu.options;
        // Guardar valores originais para caso cancele
        this.originalOptions = { ...this.options };
        this.tempOptions = { ...this.options };
    }

    show() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'menu-container';
        
        // Create content
        const content = document.createElement('div');
        content.className = 'menu-content options-container';
        
        // Create title
        const title = document.createElement('div');
        title.className = 'game-title';
        title.textContent = 'OPTIONS';
        
        // Create options
        const optionsContainer = document.createElement('div');
        
        // Sensitivity option
        const sensitivityOption = this.createOption(
            'Mouse Sensitivity',
            this.tempOptions.sensitivity * 5000,
            1,
            10,
            (value) => {
                this.tempOptions.sensitivity = value / 5000;
                if (this.game.player) {
                    this.game.player.mouseSensitivity = this.tempOptions.sensitivity;
                }
            }
        );
        
        // Volume option
        const volumeOption = this.createOption(
            'Volume',
            this.tempOptions.volume * 100,
            0,
            100,
            (value) => {
                this.tempOptions.volume = value / 100;
                if (this.game) {
                    this.game.setVolume(this.tempOptions.volume);
                }
            }
        );
        
        // Fullscreen option
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'option-item';
        
        const fullscreenLabel = document.createElement('label');
        fullscreenLabel.className = 'option-label';
        fullscreenLabel.textContent = 'Fullscreen';
        
        const fullscreenCheckbox = document.createElement('input');
        fullscreenCheckbox.type = 'checkbox';
        fullscreenCheckbox.checked = this.tempOptions.fullscreen;
        fullscreenCheckbox.addEventListener('change', () => {
            this.tempOptions.fullscreen = fullscreenCheckbox.checked;
            if (this.tempOptions.fullscreen) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
        
        fullscreenDiv.appendChild(fullscreenLabel);
        fullscreenDiv.appendChild(fullscreenCheckbox);
        
        // Add options to container
        optionsContainer.appendChild(sensitivityOption);
        optionsContainer.appendChild(volumeOption);
        optionsContainer.appendChild(fullscreenDiv);
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'options-buttons';
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.className = 'menu-button save-button';
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => this.saveOptions());
        
        // Create back button
        const backButton = document.createElement('button');
        backButton.className = 'menu-button back-button';
        backButton.textContent = 'Back to Menu';
        backButton.addEventListener('click', () => this.cancelOptions());
        
        // Add buttons to container
        buttonsContainer.appendChild(saveButton);
        buttonsContainer.appendChild(backButton);
        
        // Assemble menu
        content.appendChild(title);
        content.appendChild(optionsContainer);
        content.appendChild(buttonsContainer);
        
        // Add scanline effect
        const scanline = document.createElement('div');
        scanline.className = 'scanline';
        
        this.container.appendChild(content);
        this.container.appendChild(scanline);
        document.body.appendChild(this.container);
    }

    saveOptions() {
        // Salvar as alterações
        Object.assign(this.options, this.tempOptions);
        // Salvar no localStorage para persistir entre sessões
        localStorage.setItem('gameOptions', JSON.stringify(this.options));
        this.hide();
    }

    cancelOptions() {
        // Restaurar valores originais
        Object.assign(this.tempOptions, this.originalOptions);
        if (this.game.player) {
            this.game.player.mouseSensitivity = this.originalOptions.sensitivity;
        }
        if (this.game.audio) {
            this.game.audio.setVolume(this.originalOptions.volume);
        }
        this.hide();
    }

    createOption(label, initialValue, min, max, onChange) {
        const container = document.createElement('div');
        container.className = 'option-item';
        
        const labelElement = document.createElement('label');
        labelElement.className = 'option-label';
        labelElement.textContent = label;
        
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = initialValue;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = initialValue;
        
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            valueDisplay.textContent = value;
            onChange(Number(value));
        });
        
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        container.appendChild(labelElement);
        container.appendChild(sliderContainer);
        
        return container;
    }

    hide() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        if (this.game && this.game.menu) {
            this.game.menu.showMenu();
        }
    }

    dispose() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
} 