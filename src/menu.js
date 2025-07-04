// Importar as classes necessárias
import { Level } from './level.js';
import { Player } from './player.js';
import * as THREE from 'three';
import { OptionsMenu } from './optionsMenu.js';
import './menu.css';

export class GameMenu {
    constructor(game) {
        this.starWarsAudio = null;
        if (!game) {
            throw new Error('Game instance is required for menu initialization');
        }
        
        this.game = game;
        
        // Carregar opções salvas do localStorage ou usar valores padrão
        const savedOptions = localStorage.getItem('gameOptions');
        this.options = savedOptions ? JSON.parse(savedOptions) : {
            sensitivity: 0.002,
            volume: 0.5,
            fullscreen: false
        };
        
        this.menuContainer = null;
        this.pauseMenu = null;
        this.optionsMenu = null;
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
        
        // Aplicar configurações carregadas
        if (this.game.player) {
            this.game.player.mouseSensitivity = this.options.sensitivity;
        }
        if (this.game.audio) {
            this.game.audio.setVolume(this.options.volume);
        }
    }

    init() {
        try {
            console.log('Initializing game menu...');
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
        // Create main container
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'menu-container';
        
        // Add Google Fonts link
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        document.head.appendChild(fontLink);
        
        // Create menu content
        const menuContent = document.createElement('div');
        menuContent.className = 'menu-content';

        // Create hi-score display
        const hiScore = document.createElement('div');
        hiScore.className = 'hi-score';
        const savedHiScore = localStorage.getItem('highScore') || 0;
        hiScore.innerHTML = `HI-SCORE: ${savedHiScore}`;

        const lastScore = localStorage.getItem('lastScore') || 0;
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'last-score';
        scoreDisplay.innerHTML = `SCORE: ${lastScore}`;

        // Create title
        const title = document.createElement('div');
        title.className = 'game-title';
        title.innerHTML = `
            <div>DONKEY</div>
            <div>KONG</div>
            <div>3D</div>
        `;

        // Create menu items container
        const menuItemsContainer = document.createElement('div');
        menuItemsContainer.style.marginTop = '2rem';
        
        // Create menu items
        const menuItems = [
            { text: 'PLAY', action: () => this.promptPlayerName() },
            { text: 'LEADERBOARD', action: () => this.showLeaderboard() },
            { text: 'CONTROLS', action: () => this.showControls() },
            { text: 'OPTIONS', action: () => this.showOptions() },
            { text: 'CREDITS', action: () => this.showCredits() }
        ];
        
        menuItems.forEach((item, index) => {
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

        // Create press enter text
        const pressEnter = document.createElement('div');
        pressEnter.className = 'press-enter';
        pressEnter.textContent = 'PRESS ENTER TO START';
        
        // Assemble menu
        menuContent.appendChild(title);
        menuContent.appendChild(menuItemsContainer);
        menuContent.appendChild(pressEnter);
        this.menuContainer.appendChild(hiScore);
        this.menuContainer.appendChild(scoreDisplay);
        this.menuContainer.appendChild(menuContent);
        document.body.appendChild(this.menuContainer);

        // Set initial selection
        this.currentSelection = 0;
        this.updateSelection();
    }

    createPauseMenu() {
        this.pauseMenu = document.createElement('div');
        this.pauseMenu.className = 'menu-container';
        this.pauseMenu.setAttribute('data-menu', 'pause');
        
        const pauseContent = document.createElement('div');
        pauseContent.className = 'menu-content';
        
        const title = document.createElement('div');
        title.className = 'game-title';
        title.textContent = 'PAUSED';
        
        const menuItemsContainer = document.createElement('div');
        
        const pauseItems = [
            { text: 'RESUME', action: () => this.resumeGame() },
            { text: 'MAIN MENU', action: () => this.returnToMainMenu() },
            { text: 'EXIT', action: () => this.exitGame() }
        ];
        
        pauseItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', item.action);
            menuItemsContainer.appendChild(menuItem);
        });
        
        pauseContent.appendChild(title);
        pauseContent.appendChild(menuItemsContainer);
        this.pauseMenu.appendChild(pauseContent);
        document.body.appendChild(this.pauseMenu);
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

    // ... rest of your existing methods ...
    setupEventListeners() {
        document.removeEventListener('keydown', this._keydownHandler);
        document.addEventListener('keydown', this._keydownHandler);
        console.log('[MENU] Listeners de teclado adicionados');
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

    navigateMenu(direction) {
        const items = this.menuItems;
        if (items.length === 0) return;
        
        // Update selection
        this.currentSelection = (this.currentSelection + direction + items.length) % items.length;
        
        // Update visual selection
        this.updateSelection();
    }

    selectCurrentItem() {
        const currentItem = this.menuItems[this.currentSelection];
        if (currentItem) {
            currentItem.click();
        }
    }

    showMenu() {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        if (this.menuContainer) {
            // Atualizar valores dinâmicos
            const hiScoreElement = this.menuContainer.querySelector('.hi-score');
            const lastScoreElement = this.menuContainer.querySelector('.last-score');
            
            if (hiScoreElement) {
                const savedHiScore = localStorage.getItem('highScore') || 0;
                hiScoreElement.innerHTML = `HI-SCORE: ${savedHiScore}`;
            }
            
            if (lastScoreElement) {
                const lastScore = localStorage.getItem('lastScore') || 0;
                lastScoreElement.innerHTML = `SCORE: ${lastScore}`;
            }
        
            this.menuContainer.style.display = 'flex';
            this.isVisible = true;
            this.isPauseVisible = false;
            
            if (this.pauseMenu) {
                this.pauseMenu.style.display = 'none';
            }
        }
        
        this.setupEventListeners();
    }

    hideMenu() {
        if (this.menuContainer) {
            this.menuContainer.style.display = 'none';
            this.isVisible = false;
        }
    }

    showPauseMenu() {
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

    startGame() {
        console.log('Starting game...');
        this.hideMenu();
        if (!this.game.scene) {
            console.log('Initializing game scene...');
            this.game.init().then(() => {
                console.log('Game scene initialized, starting game...');
                // Aplicar configurações salvas
                if (this.game.player) {
                    this.game.player.mouseSensitivity = this.options.sensitivity;
                }
                if (this.game.audio) {
                    this.game.audio.setVolume(this.options.volume);
                }
                this.game.start();
            }).catch(error => {
                console.error('Error initializing game:', error);
                this.showMenu();
            });
        } else {
            console.log('Game scene already initialized, starting game...');
            // Aplicar configurações salvas
            if (this.game.player) {
                this.game.player.mouseSensitivity = this.options.sensitivity;
            }
            if (this.game.audio) {
                this.game.audio.setVolume(this.options.volume);
            }
            this.game.start();
        }
    }

    resumeGame() {
        this.hidePauseMenu();
        if (this.game) {
            this.game.resume();
        }
    }

    returnToMainMenu() {
        window.location.reload();
    }

    exitGame() {
        if (this.game) {
        this.game.exitGame();
        }
    }

    showOptions() {
        if (!this.optionsMenu) {
            this.optionsMenu = new OptionsMenu(this.game);
        }
        this.hideMenu();
        this.optionsMenu.show();
    }

    showCredits() {
        if (this.menuContainer) {
            const menuContent = document.createElement('div');
            menuContent.className = 'credits-container';
    
            const creditsContent = document.createElement('div');
            creditsContent.className = 'credits-content';
    
            creditsContent.innerHTML = `
                <div class="credits-title">DONKEY KONG 3D</div>
                <div class="credits-text">
                    <h2>Desenvolvimento</h2>
                    <p>Programação</p>
                    <p>Ricardo Freitas</p>
                    <p>Alexandre Ferreira</p>
                    <p>Rodrigo Venâncio</p>
                    <br>
                    <p>Design de Níveis</p>
                    <p>Ricardo Freitas</p>
                    <p>Alexandre Ferreira</p>
                    <p>Rodrigo Venâncio</p>
                    <br>
                    <p>Game Design</p>
                    <p>Ricardo Freitas</p>
                    <p>Alexandre Ferreira</p>
                    <p>Rodrigo Venâncio</p>
                    <br><br>
                    <h2>Arte</h2>
                    <p>Modelagem 3D</p>
                    <p>Ricardo Freitas</p>
                    <p>Alexandre Ferreira</p>
                    <p>Rodrigo Venâncio</p>
                    <br>
                    <p>Texturas e Animações</p>
                    <p>Ricardo Freitas</p>
                    <p>Alexandre Ferreira</p>
                    <p>Rodrigo Venâncio</p>
                    <br><br>
                    <h2>Áudio</h2>
                    <p>Música de Fundo</p>
                    <p>Different Heaven & EH!DE – "My Heart"</p>
                    <p>(Drumstep | NCS)</p>
                    <p>Star Wars Main Theme (Full)</p>
                    <br>
                    <p>Efeitos Sonoros</p>
                    <p>Ricardo Freitas</p>
                    <p>Alexandre Ferreira</p>
                    <br><br>
                    <h2>Agradecimentos Especiais</h2>
                    <p>Professor Miguel Ângelo Correia de Melo</p>
                    <p>Professor Maximino Esteves Correia Bessa</p>
                    <p>Professor Bruno Miguel Eira Peixoto</p>
                    <br><br>
                    <h2>Comunidades</h2>
                    <p>YouTube</p>
                    <p>Reddit</p>
                    <p>Git Hub</p>
                    <br><br>
                    <h2>Inspiração</h2>
                    <p>Donkey Kong (1981), da Nintendo</p>
                    <br><br>
                    <h2>Inspiração Visual</h2>
                    <p>Estilo dos créditos inspirado em Star Wars (1977)</p>
                    <p>Criação original de George Lucas</p>
                    <br><br>
                    <h2>Ferramentas Utilizadas</h2>
                    <p>Engine: Three.js (JavaScript WebGL Framework)</p>
                    <p>IDE: Visual Studio Code</p>
                    <p>Assistente de Código: ChatGPT</p>
                    <p>Modelagem 3D: Blender, Mixamo</p>
                    <p>Hospedagem de Ficheiros: Catbox</p>
                    <br><br>
                    <h2>Direitos e Licenças</h2>
                    <p>Donkey Kong é uma marca registrada da Nintendo.</p>
                    <p>Este projeto é um fan game não comercial,</p>
                    <p>criado exclusivamente para fins educacionais</p>
                    <p>e de entretenimento pessoal.</p>
                </div>
            `;
    
            const backButton = document.createElement('button');
            backButton.className = 'credits-back-button';
            backButton.textContent = 'Voltar ao Menu';
            backButton.addEventListener('click', () => {
                if (this.starWarsAudio) {
                    this.starWarsAudio.pause();
                    this.starWarsAudio.currentTime = 0;
                }
                this.menuContainer.innerHTML = '';
                this.createMainMenu();
                this.showMenu();
            });
    
            menuContent.appendChild(creditsContent);
            menuContent.appendChild(backButton);
    
            this.menuContainer.innerHTML = '';
            this.menuContainer.appendChild(menuContent);
    
            // 🎵 Música Star Wars
            this.starWarsAudio = new Audio('https://files.catbox.moe/tt6015.mp3');
            this.starWarsAudio.volume = this.options.volume ?? 0.5;
            this.starWarsAudio.loop = true;
            this.starWarsAudio.play().catch(err => {
                console.warn('Autoplay bloqueado:', err);
            });
        }
    }
    
    showControls() {
        // Cria painel/modal de controles se não existir
        if (!this.controlsPanel) {
            this.controlsPanel = document.createElement('div');
            this.controlsPanel.className = 'menu-container';
            this.controlsPanel.style.zIndex = '10001';
            this.controlsPanel.style.display = 'flex';
            this.controlsPanel.style.flexDirection = 'column';
            this.controlsPanel.style.justifyContent = 'center';
            this.controlsPanel.style.alignItems = 'center';

            const content = document.createElement('div');
            content.className = 'menu-content';
            content.innerHTML = `
                <div class="game-title">CONTROLS</div>
                <div style="color: #FFD700; font-size: 20px; text-align: left; margin-bottom: 2rem; font-family: 'Press Start 2P', monospace; line-height: 2.2; letter-spacing: 1px;">
                    <b>W, A, S, D / Setas</b>: Mover<br>
                    <b>Espaço</b>: Saltar<br>
                    <b>J</b>: Alternar luz do sol<br>
                    <b>L</b>: Alternar todas as luzes<br>
                    <b>V</b>: Alternar câmara 2D/3D<br>
                    <b>Insert</b>: Mod Menu<br>
                    <b>P</b>: Pausa<br>
                    <b>R</b>: Reiniciar jogo<br>
                    <b>Rato</b>: Olhar à volta<br>
                    <b>ENTER</b>: Selecionar menu<br>
                </div>
            `;
            const backBtn = document.createElement('button');
            backBtn.textContent = 'Back';
            backBtn.className = 'menu-back-button';
            backBtn.onclick = () => {
                this.controlsPanel.style.display = 'none';
            };
            content.appendChild(backBtn);
            this.controlsPanel.appendChild(content);
            document.body.appendChild(this.controlsPanel);
        } else {
            this.controlsPanel.style.display = 'flex';
        }
    }

    promptPlayerName() {
        // Cria overlay para input de nome
        const overlay = document.createElement('div');
        overlay.className = 'name-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = 9999;

        const label = document.createElement('label');
        label.textContent = 'ENTER YOUR NAME:';
        label.style.color = '#FFD700';
        label.style.fontFamily = 'Press Start 2P, monospace';
        label.style.fontSize = '2rem';
        label.style.marginBottom = '1rem';

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 12;
        input.style.fontSize = '2rem';
        input.style.padding = '0.5rem';
        input.style.textAlign = 'center';
        input.style.fontFamily = 'Press Start 2P, monospace';
        input.style.marginBottom = '1rem';
        input.autofocus = true;

        const startBtn = document.createElement('button');
        startBtn.textContent = 'START!';
        startBtn.style.fontSize = '2rem';
        startBtn.style.padding = '0.5rem 2rem';
        startBtn.style.fontFamily = 'Press Start 2P, monospace';
        startBtn.style.background = '#FFD700';
        startBtn.style.color = '#000';
        startBtn.style.border = 'none';
        startBtn.style.cursor = 'pointer';
        startBtn.style.borderRadius = '8px';
        startBtn.style.transition = 'background 0.2s';
        startBtn.addEventListener('mouseover', () => startBtn.style.background = '#fff');
        startBtn.addEventListener('mouseout', () => startBtn.style.background = '#FFD700');

        startBtn.onclick = () => {
            const name = input.value.trim() || 'PLAYER';
            localStorage.setItem('playerName', name);
            overlay.remove();
            this.startGame();
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') startBtn.click();
        });

        overlay.appendChild(label);
        overlay.appendChild(input);
        overlay.appendChild(startBtn);
        document.body.appendChild(overlay);
        input.focus();
    }

    showLeaderboard() {
        // Cria overlay para leaderboard
        const overlay = document.createElement('div');
        overlay.className = 'leaderboard-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.95)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = 9999;

        const title = document.createElement('div');
        title.textContent = 'LEADERBOARD';
        title.style.color = '#FFD700';
        title.style.fontFamily = 'Press Start 2P, monospace';
        title.style.fontSize = '2.5rem';
        title.style.marginBottom = '2rem';

        // Tabela de scores
        const table = document.createElement('table');
        table.style.background = 'rgba(0,0,0,0.7)';
        table.style.borderRadius = '10px';
        table.style.padding = '2rem';
        table.style.color = '#FFD700';
        table.style.fontFamily = 'Press Start 2P, monospace';
        table.style.fontSize = '1.2rem';
        table.style.marginBottom = '2rem';
        table.style.borderCollapse = 'collapse';

        // Header
        const header = document.createElement('tr');
        header.innerHTML = '<th style="padding: 0.5rem 2rem;">NAME</th><th style="padding: 0.5rem 2rem;">SCORE</th>';
        table.appendChild(header);

        // Scores do localStorage
        let scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
        scores.forEach(({ name, score }) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td style="padding: 0.5rem 2rem; text-align:center;">${name}</td><td style="padding: 0.5rem 2rem; text-align:center;">${score}</td>`;
            table.appendChild(row);
        });
        if (scores.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="2" style="text-align:center; padding: 1rem;">No scores yet</td>';
            table.appendChild(row);
        }

        // Botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.fontSize = '1.5rem';
        closeBtn.style.padding = '0.5rem 2rem';
        closeBtn.style.fontFamily = 'Press Start 2P, monospace';
        closeBtn.style.background = '#FFD700';
        closeBtn.style.color = '#000';
        closeBtn.style.border = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.borderRadius = '8px';
        closeBtn.style.transition = 'background 0.2s';
        closeBtn.addEventListener('mouseover', () => closeBtn.style.background = '#fff');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.background = '#FFD700');
        closeBtn.onclick = () => overlay.remove();

        overlay.appendChild(title);
        overlay.appendChild(table);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);
    }

    dispose() {
        document.removeEventListener('keydown', this._keydownHandler);
        
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
        }
        if (this.pauseMenu && this.pauseMenu.parentNode) {
            this.pauseMenu.parentNode.removeChild(this.pauseMenu);
        }
        
        this.menuContainer = null;
        this.pauseMenu = null;
        this.optionsMenu = null;
        this.isVisible = false;
        this.isPauseVisible = false;
        this.menuItems = [];
        this.currentSelection = 0;
        
        console.log('[MENU] Menu disposed successfully');
    }
} 