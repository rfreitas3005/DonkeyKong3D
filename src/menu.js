export class GameMenu {
    constructor(game) {
        this.game = game;
        this.currentMenu = 'main'; // 'main' or 'options'
        this.selectedIndex = 0;
        this.options = {
            sensitivity: 0.002,
            volume: 0.5,
            fullscreen: false
        };
        
        this.createMenuElements();
        this.setupEventListeners();
    }

    createMenuElements() {
        // Create menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'menu-container';

        // Add scanline effect
        const scanline = document.createElement('div');
        scanline.className = 'scanline';
        document.body.appendChild(scanline);

        this.showMainMenu();
    }

    showMainMenu() {
        this.currentMenu = 'main';
        this.menuContainer.innerHTML = `
            <div class="menu-content">
                <h1 class="game-title">DONKEY KONG 3D</h1>
                <div class="menu-item" data-action="play">PLAY</div>
                <div class="menu-item" data-action="options">OPTIONS</div>
                <div class="menu-item" data-action="exit">EXIT</div>
            </div>
        `;
        document.body.appendChild(this.menuContainer);
        this.updateSelectedItem();
    }

    showOptionsMenu() {
        this.currentMenu = 'options';
        this.menuContainer.innerHTML = `
            <div class="menu-content">
                <h1 class="game-title">OPTIONS</h1>
                <div class="options-container">
                    <div class="option-item">
                        <label class="option-label">Camera Sensitivity</label>
                        <div class="slider-container">
                            <input type="range" 
                                   min="1" 
                                   max="10" 
                                   value="${this.options.sensitivity * 5000}"
                                   class="sensitivity-slider">
                            <span class="value-display">${Math.round(this.options.sensitivity * 5000)}</span>
                        </div>
                    </div>
                    <div class="option-item">
                        <label class="option-label">Volume</label>
                        <div class="slider-container">
                            <input type="range" 
                                   min="0" 
                                   max="100" 
                                   value="${this.options.volume * 100}"
                                   class="volume-slider">
                            <span class="value-display">${Math.round(this.options.volume * 100)}</span>
                        </div>
                    </div>
                    <div class="option-item">
                        <label class="option-label">
                            <input type="checkbox" 
                                   ${this.options.fullscreen ? 'checked' : ''}
                                   class="fullscreen-toggle">
                            Fullscreen
                        </label>
                    </div>
                </div>
                <button class="menu-back-button">BACK</button>
            </div>
        `;

        // Setup options event listeners
        this.setupOptionsListeners();
    }

    setupOptionsListeners() {
        const sensitivitySlider = this.menuContainer.querySelector('.sensitivity-slider');
        const volumeSlider = this.menuContainer.querySelector('.volume-slider');
        const fullscreenToggle = this.menuContainer.querySelector('.fullscreen-toggle');
        const backButton = this.menuContainer.querySelector('.menu-back-button');

        sensitivitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.options.sensitivity = value / 5000;
            e.target.nextElementSibling.textContent = value;
            if (this.game.player) {
                this.game.player.mouseSensitivity = this.options.sensitivity;
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.options.volume = value / 100;
            e.target.nextElementSibling.textContent = value;
            // Implement volume control when audio is added
        });

        fullscreenToggle.addEventListener('change', (e) => {
            this.options.fullscreen = e.target.checked;
            if (this.options.fullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        });

        backButton.addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.currentMenu === 'main') {
                switch (e.key) {
                    case 'ArrowUp':
                        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                        this.updateSelectedItem();
                        break;
                    case 'ArrowDown':
                        this.selectedIndex = Math.min(2, this.selectedIndex + 1);
                        this.updateSelectedItem();
                        break;
                    case 'Enter':
                        this.handleMenuAction();
                        break;
                }
            }
        });

        this.menuContainer.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                this.handleAction(action);
            }
        });
    }

    updateSelectedItem() {
        const items = this.menuContainer.querySelectorAll('.menu-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }

    handleMenuAction() {
        const items = this.menuContainer.querySelectorAll('.menu-item');
        const action = items[this.selectedIndex].dataset.action;
        this.handleAction(action);
    }

    handleAction(action) {
        switch (action) {
            case 'play':
                this.startGame();
                break;
            case 'options':
                this.showOptionsMenu();
                break;
            case 'exit':
                window.close();
                // For web-based version, you might want to show a confirmation dialog
                break;
        }
    }

    startGame() {
        this.menuContainer.classList.add('fade-out');
        setTimeout(() => {
            this.menuContainer.remove();
            this.game.start();
        }, 500);
    }
} 