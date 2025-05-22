export class OptionsMenu {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.selectedOption = 0;
        this.options = [
            { name: 'VOLUME', value: 100, min: 0, max: 100, step: 10 },
            { name: 'FULLSCREEN', value: false },
            { name: 'BACK', action: () => this.close() }
        ];
        this.setupMenu();
    }

    setupMenu() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.display = 'none';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = "'Press Start 2P', cursive";
        this.container.style.cursor = 'default';

        const title = document.createElement('div');
        title.textContent = 'OPTIONS';
        title.style.fontSize = '36px';
        title.style.marginBottom = '40px';
        title.style.color = '#ff69b4';

        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexDirection = 'column';
        optionsContainer.style.gap = '20px';

        this.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.style.display = 'flex';
            optionElement.style.justifyContent = 'space-between';
            optionElement.style.alignItems = 'center';
            optionElement.style.width = '300px';
            optionElement.style.cursor = 'pointer';
            
            const nameElement = document.createElement('span');
            nameElement.textContent = option.name;
            nameElement.style.fontSize = '20px';
            
            const valueElement = document.createElement('span');
            if (option.name === 'VOLUME') {
                valueElement.textContent = `${option.value}%`;
            } else if (option.name === 'FULLSCREEN') {
                valueElement.textContent = option.value ? 'ON' : 'OFF';
            }
            valueElement.style.fontSize = '20px';
            
            optionElement.appendChild(nameElement);
            if (option.name !== 'BACK') {
                optionElement.appendChild(valueElement);
            }
            
            optionElement.addEventListener('mouseover', () => this.updateSelectedOption(index));
            optionElement.addEventListener('click', () => this.handleOptionClick(index));
            
            optionsContainer.appendChild(optionElement);
        });

        this.container.appendChild(title);
        this.container.appendChild(optionsContainer);
        document.body.appendChild(this.container);
    }

    updateSelectedOption(index) {
        const optionElements = this.container.querySelectorAll('div > div');
        optionElements.forEach((element, i) => {
            if (i === index) {
                element.style.color = '#ff69b4';
                element.style.animation = 'blink 1s infinite';
            } else {
                element.style.color = '#fff';
                element.style.animation = '';
            }
        });
        this.selectedOption = index;
    }

    handleOptionClick(index) {
        const option = this.options[index];
        if (option.name === 'VOLUME') {
            option.value = (option.value + option.step) % (option.max + option.step);
            if (option.value > option.max) option.value = option.min;
            const valueElement = this.container.querySelectorAll('div > div')[index].querySelector('span:last-child');
            valueElement.textContent = `${option.value}%`;
            // Update game volume
            if (this.game.audio) {
                this.game.audio.setVolume(option.value / 100);
            }
        } else if (option.name === 'FULLSCREEN') {
            option.value = !option.value;
            const valueElement = this.container.querySelectorAll('div > div')[index].querySelector('span:last-child');
            valueElement.textContent = option.value ? 'ON' : 'OFF';
            this.toggleFullscreen();
        } else if (option.action) {
            option.action();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    show() {
        if (this.game.player) {
            this.game.player.disableControls();
        }
        this.container.style.display = 'flex';
        this.updateSelectedOption(this.selectedOption);
    }

    close() {
        this.container.style.display = 'none';
        if (this.game.menu) {
            this.game.menu.showMenu();
        }
    }
} 