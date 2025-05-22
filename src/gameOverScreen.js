import * as THREE from 'three';

export class GameOverScreen {
    constructor(game) {
        this.game = game;
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.container.style.display = 'none';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '1000';
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.5s ease-in-out';
        
        // Game Over título
        const title = document.createElement('div');
        title.textContent = 'GAME OVER';
        title.style.color = '#ff69b4';
        title.style.fontSize = '72px';
        title.style.fontFamily = "'Press Start 2P', cursive";
        title.style.marginBottom = '20px';
        title.style.textShadow = '0 0 20px #ff69b4';
        
        // Mensagem sarcástica
        const message = document.createElement('div');
        message.textContent = 'FOR GOD SAKE... THE GAME IS NOT THAT HARD';
        message.style.color = '#ff69b4';
        message.style.fontSize = '24px';
        message.style.fontFamily = "'Press Start 2P', cursive";
        message.style.marginBottom = '40px';
        message.style.textShadow = '0 0 10px #ff69b4';
        
        // Final Score
        const finalScore = document.createElement('div');
        finalScore.id = 'final-score';
        finalScore.style.marginBottom = '20px';
        
        // High Score
        const highScore = document.createElement('div');
        highScore.id = 'high-score';
        highScore.style.marginBottom = '40px';
        
        // Botões
        const restartButton = document.createElement('button');
        restartButton.textContent = 'RESTART';
        this.styleButton(restartButton);
        restartButton.onclick = () => this.game.restart();
        
        const menuButton = document.createElement('button');
        menuButton.textContent = 'RETURN TO MENU';
        this.styleButton(menuButton);
        menuButton.onclick = () => this.game.returnToMenu();
        
        // Adicionar elementos ao container
        this.container.appendChild(title);
        this.container.appendChild(message);
        this.container.appendChild(finalScore);
        this.container.appendChild(highScore);
        this.container.appendChild(restartButton);
        this.container.appendChild(menuButton);
        
        document.body.appendChild(this.container);
    }

    styleButton(button) {
        button.style.backgroundColor = 'transparent';
        button.style.border = '2px solid #ff69b4';
        button.style.color = '#ff69b4';
        button.style.padding = '15px 30px';
        button.style.margin = '10px';
        button.style.fontSize = '24px';
        button.style.fontFamily = "'Press Start 2P', cursive";
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.3s ease';
        button.style.textShadow = '0 0 10px #ff69b4';
        button.style.boxShadow = '0 0 10px #ff69b4';
        
        button.onmouseover = () => {
            button.style.backgroundColor = '#ff69b4';
            button.style.color = 'black';
        };
        
        button.onmouseout = () => {
            button.style.backgroundColor = 'transparent';
            button.style.color = '#ff69b4';
        };
    }

    show(finalScore, highScore) {
        console.log('GameOverScreen.show called with:', finalScore, highScore); // Debug log
        
        if (!this.container) {
            console.error('Container not found!');
            return;
        }
        
        // Garantir que os valores não sejam undefined
        const displayFinalScore = typeof finalScore === 'number' ? finalScore : 0;
        const displayHighScore = typeof highScore === 'number' ? highScore : 0;
        
        console.log('Display values:', displayFinalScore, displayHighScore); // Debug log
        
        // Limpar o container existente
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        
        // Game Over título
        const title = document.createElement('div');
        title.textContent = 'GAME OVER';
        title.style.color = '#ff69b4';
        title.style.fontSize = '72px';
        title.style.fontFamily = "'Press Start 2P', cursive";
        title.style.marginBottom = '20px';
        title.style.textShadow = '0 0 20px #ff69b4';
        
        // Mensagem sarcástica
        const message = document.createElement('div');
        message.textContent = 'FOR GOD SAKE... THE GAME IS NOT THAT HARD';
        message.style.color = '#ff69b4';
        message.style.fontSize = '24px';
        message.style.fontFamily = "'Press Start 2P', cursive";
        message.style.marginBottom = '40px';
        message.style.textShadow = '0 0 10px #ff69b4';
        
        // Final Score com estilo retro
        const finalScoreText = document.createElement('div');
        finalScoreText.textContent = `FINAL SCORE: ${displayFinalScore}`;
        finalScoreText.style.color = '#FFD700';
        finalScoreText.style.fontSize = '36px';
        finalScoreText.style.fontFamily = "'Press Start 2P', cursive";
        finalScoreText.style.marginBottom = '20px';
        finalScoreText.style.textShadow = '0 0 10px #FFD700';
        
        // High Score com estilo retro
        const highScoreText = document.createElement('div');
        highScoreText.textContent = `HI-SCORE: ${displayHighScore}`;
        highScoreText.style.color = '#FFD700';
        highScoreText.style.fontSize = '36px';
        highScoreText.style.fontFamily = "'Press Start 2P', cursive";
        highScoreText.style.marginBottom = '40px';
        highScoreText.style.textShadow = '0 0 10px #FFD700';
        
        // Botões
        const restartButton = document.createElement('button');
        restartButton.textContent = 'RESTART';
        this.styleButton(restartButton);
        restartButton.onclick = () => this.game.restart();
        
        const menuButton = document.createElement('button');
        menuButton.textContent = 'RETURN TO MENU';
        this.styleButton(menuButton);
        menuButton.onclick = () => this.game.returnToMenu();
        
        // Adicionar todos os elementos ao container
        this.container.appendChild(title);
        this.container.appendChild(message);
        this.container.appendChild(finalScoreText);
        this.container.appendChild(highScoreText);
        this.container.appendChild(restartButton);
        this.container.appendChild(menuButton);
        
        // Mostrar o container com fade in
        this.container.style.display = 'flex';
        setTimeout(() => {
            this.container.style.opacity = '1';
        }, 100);
    }

    hide() {
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 500); // Match the transition duration
    }
} 