import * as THREE from 'three';

export class DebugMenu {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.showHitboxes = false;
        this.hitboxHelpers = new Map();
        this.debugInfo = null;
        this.setupDebugUI();
        this.setupKeyboardControls();
        this.createHelpText();
    }

    setupDebugUI() {
        // Criar container do menu de debug
        this.debugContainer = document.createElement('div');
        this.debugContainer.style.position = 'fixed';
        this.debugContainer.style.top = '10px';
        this.debugContainer.style.left = '10px';
        this.debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugContainer.style.color = '#00ff00';
        this.debugContainer.style.padding = '10px';
        this.debugContainer.style.fontFamily = "'Press Start 2P', monospace";
        this.debugContainer.style.fontSize = '12px';
        this.debugContainer.style.border = '2px solid #00ff00';
        this.debugContainer.style.display = 'none';
        this.debugContainer.style.zIndex = '1000';

        // Criar título
        const title = document.createElement('div');
        title.textContent = 'DEBUG MENU';
        title.style.marginBottom = '10px';
        title.style.color = '#ff0000';

        // Criar opções
        const options = document.createElement('div');
        options.style.display = 'flex';
        options.style.flexDirection = 'column';
        options.style.gap = '5px';

        // Opção de hitboxes
        const hitboxOption = document.createElement('div');
        hitboxOption.innerHTML = 'H - Toggle Hitboxes';
        hitboxOption.style.cursor = 'pointer';
        hitboxOption.addEventListener('click', () => this.toggleHitboxes());

        // Opção de FPS
        const fpsOption = document.createElement('div');
        fpsOption.innerHTML = 'F - Toggle FPS Counter';

        // Opção de coordenadas
        const coordsOption = document.createElement('div');
        coordsOption.innerHTML = 'C - Toggle Coordinates';

        // Adicionar elementos ao container
        options.appendChild(hitboxOption);
        options.appendChild(fpsOption);
        options.appendChild(coordsOption);
        this.debugContainer.appendChild(title);
        this.debugContainer.appendChild(options);

        // Adicionar ao documento
        document.body.appendChild(this.debugContainer);

        // Criar elemento para informações de debug
        this.debugInfo = document.createElement('div');
        this.debugInfo.style.position = 'fixed';
        this.debugInfo.style.top = '10px';
        this.debugInfo.style.right = '10px';
        this.debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugInfo.style.color = '#00ff00';
        this.debugInfo.style.padding = '10px';
        this.debugInfo.style.fontFamily = "'Press Start 2P', monospace";
        this.debugInfo.style.fontSize = '12px';
        this.debugInfo.style.border = '2px solid #00ff00';
        this.debugInfo.style.display = 'none';
        this.debugInfo.style.zIndex = '1000';
        document.body.appendChild(this.debugInfo);
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'h':
                    this.toggleHitboxes();
                    break;
                case 'f':
                    this.toggleFPS();
                    break;
                case 'c':
                    this.toggleCoordinates();
                    break;
                case '`': // Tecla do acento grave
                    this.toggleDebugMenu();
                    break;
            }
        });
    }

    toggleDebugMenu() {
        this.isVisible = !this.isVisible;
        this.debugContainer.style.display = this.isVisible ? 'block' : 'none';
        
        // Mostrar também as informações de debug quando o menu estiver visível
        if (this.debugInfo) {
            this.debugInfo.style.display = this.isVisible ? 'block' : 'none';
        }
        
        // Adicionar botão de teste de movimento ao debug menu
        if (this.isVisible && !document.getElementById('test-movement-btn')) {
            const testMovementBtn = document.createElement('button');
            testMovementBtn.id = 'test-movement-btn';
            testMovementBtn.textContent = 'Test Movement';
            testMovementBtn.style.margin = '10px';
            testMovementBtn.style.padding = '5px 10px';
            testMovementBtn.style.backgroundColor = '#ff0000';
            testMovementBtn.style.color = 'white';
            testMovementBtn.style.border = 'none';
            testMovementBtn.style.cursor = 'pointer';
            
            testMovementBtn.addEventListener('click', () => {
                console.log('Testing player movement...');
                this.testPlayerMovement();
            });
            
            this.debugContainer.appendChild(testMovementBtn);
        }
    }

    toggleHitboxes() {
        this.showHitboxes = !this.showHitboxes;
        console.log(`Hitboxes ${this.showHitboxes ? 'ativadas' : 'desativadas'}`);
        
        // Update all objects in the scene
        if (this.game && this.game.level) {
            this.updateHitboxes();
        }
        
        // Update help text
        this.updateHelpText();
    }

    updateHitboxes() {
        if (!this.game || !this.game.scene) return;

        // Limpar hitboxes antigas
        this.hitboxHelpers.forEach(helper => {
            this.game.scene.remove(helper);
        });
        this.hitboxHelpers.clear();

        if (this.showHitboxes) {
            // Adicionar hitboxes para o jogador
            if (this.game.player && this.game.player.model) {
                const box = new THREE.Box3().setFromObject(this.game.player.model);
                const helper = new THREE.Box3Helper(box, 0xff0000);
                this.game.scene.add(helper);
                this.hitboxHelpers.set(this.game.player.model, helper);
            }

            // Adicionar hitboxes para os barris
            if (this.game.level && this.game.level.barrels) {
                this.game.level.barrels.forEach(barrel => {
                    const box = new THREE.Box3().setFromObject(barrel);
                    const helper = new THREE.Box3Helper(box, 0x00ff00);
                    this.game.scene.add(helper);
                    this.hitboxHelpers.set(barrel, helper);
                });
            }
        }
    }

    toggleFPS() {
        // Implementar contador de FPS
    }

    toggleCoordinates() {
        // Implementar exibição de coordenadas
    }

    // Adicionar novo método para testar movimento
    testPlayerMovement() {
        if (!this.game || !this.game.player) {
            console.error('Cannot test movement: game or player not found');
            alert('Player not available for movement test');
            return;
        }
        
        console.log('Current player state:', {
            enabled: this.game.player.enabled,
            isPointerLocked: this.game.player.isPointerLocked,
            position: this.game.player.mesh ? {
                x: this.game.player.mesh.position.x,
                y: this.game.player.mesh.position.y,
                z: this.game.player.mesh.position.z
            } : 'No mesh',
            keys: this.game.player.keys
        });
        
        // Simular teclas de movimento
        const simulateMovement = () => {
            console.log('Simulating player movement...');
            
            // Forçar player como habilitado
            this.game.player.enabled = true;
            
            // Simular pressionamento da tecla W (para frente)
            console.log('Simulating UP key press');
            this.game.player.keys.up = true;
            
            // Mover por 1 segundo
            setTimeout(() => {
                console.log('Stopping simulated movement');
                this.game.player.keys.up = false;
                
                // Verificar se o jogador se moveu
                if (this.game.player.mesh) {
                    console.log('Final player position:', {
                        x: this.game.player.mesh.position.x,
                        y: this.game.player.mesh.position.y,
                        z: this.game.player.mesh.position.z
                    });
                }
            }, 1000);
        };
        
        // Executar o teste
        simulateMovement();
        
        // Adicionar alerta visual de que o teste está sendo executado
        const testAlert = document.createElement('div');
        testAlert.style.position = 'fixed';
        testAlert.style.top = '50%';
        testAlert.style.left = '50%';
        testAlert.style.transform = 'translate(-50%, -50%)';
        testAlert.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        testAlert.style.color = 'white';
        testAlert.style.padding = '20px';
        testAlert.style.fontFamily = "'Press Start 2P', monospace";
        testAlert.style.zIndex = '10000';
        testAlert.textContent = 'TESTE DE MOVIMENTO EM ANDAMENTO...';
        
        document.body.appendChild(testAlert);
        
        setTimeout(() => {
            testAlert.remove();
        }, 2000);
    }

    update() {
        if (this.showHitboxes) {
            this.updateHitboxes();
        }

        // Atualizar informações de debug
        if (this.debugInfo && this.game.player) {
            const position = this.game.player.mesh?.position || new THREE.Vector3();
            const movement = this.game.player.keys ? 
                `Moving: ${this.game.player.isMoving() ? 'Yes' : 'No'}, ` +
                `Keys: [UP:${this.game.player.keys.up}, DOWN:${this.game.player.keys.down}, LEFT:${this.game.player.keys.left}, RIGHT:${this.game.player.keys.right}]` : 'No keys';
            
            this.debugInfo.innerHTML = `
                Position: X:${position.x.toFixed(2)} Y:${position.y.toFixed(2)} Z:${position.z.toFixed(2)}<br>
                Floor: ${this.game.player.currentFloor}<br>
                On Ladder: ${this.game.player.onLadder}<br>
                Enabled: ${this.game.player.enabled}<br>
                Pointer Locked: ${this.game.player.isPointerLocked}<br>
                ${movement}
            `;
            
            // Mostrar informações de debug quando o menu estiver visível
            this.debugInfo.style.display = this.isVisible ? 'block' : 'none';
        }
    }

    // Método para criar a legenda de ajuda
    createHelpText() {
        const helpText = document.createElement('div');
        helpText.id = 'debug-help-text';
        helpText.textContent = 'Clique H para ver as hitboxes';
        helpText.style.position = 'fixed';
        helpText.style.top = '20px';
        helpText.style.right = '20px';
        helpText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        helpText.style.color = 'white';
        helpText.style.padding = '8px 12px';
        helpText.style.fontFamily = "'Press Start 2P', monospace";
        helpText.style.fontSize = '10px';
        helpText.style.border = '1px solid #444';
        helpText.style.borderRadius = '4px';
        helpText.style.zIndex = '9999';
        helpText.style.pointerEvents = 'all';
        helpText.style.cursor = 'pointer';
        
        // Add click event to toggle hitboxes
        helpText.addEventListener('click', () => {
            this.toggleHitboxes();
        });
        
        document.body.appendChild(helpText);
    }

    updateHelpText() {
        const helpText = document.getElementById('debug-help-text');
        if (helpText) {
            if (this.showHitboxes) {
                helpText.textContent = 'Hitboxes ATIVADAS - Clique H para esconder';
                helpText.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
            } else {
                helpText.textContent = 'Clique H para mostrar hitboxes';
                helpText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            }
        }
    }
} 