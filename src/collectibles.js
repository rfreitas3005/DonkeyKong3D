import * as THREE from 'three';

export class Collectible {
    constructor(type, position, scene, effectsManager) {
        this.type = type;
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.collected = false;
        this.mesh = null;
        this.boundingBox = new THREE.Box3();
        this.baseY = position.y;
        this.createMesh(position);
    }

    createMesh(position) {
        let geometry, material;

        switch (this.type) {
            case 'coin':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
                material = new THREE.MeshPhongMaterial({
                    color: 0xFFD700,
                    shininess: 100,
                    emissive: 0xFFD700,
                    emissiveIntensity: 0.5
                });
                break;
            case 'powerup_speed':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshPhongMaterial({
                    color: 0xFF4500,
                    shininess: 80,
                    emissive: 0xFF4500,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                });
                break;
            case 'powerup_jump':
                geometry = new THREE.OctahedronGeometry(0.7);
                material = new THREE.MeshPhongMaterial({
                    color: 0x4169E1,
                    shininess: 80,
                    emissive: 0x4169E1,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                });
                break;
            case 'powerup_invincible':
                geometry = new THREE.SphereGeometry(0.7, 16, 16);
                material = new THREE.MeshPhongMaterial({
                    color: 0x00FF00,
                    shininess: 100,
                    emissive: 0x00FF00,
                    emissiveIntensity: 0.7,
                    transparent: true,
                    opacity: 0.8
                });
                break;
            default:
                geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.collectible = this;

        // Glow effect para powerups
        if (this.type.startsWith('powerup_')) {
            const glowGeometry = geometry.clone();
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: material.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.scale.multiplyScalar(1.3);
            this.mesh.add(glowMesh);
        }

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.collected || !this.mesh) return;

        this.mesh.rotation.y += deltaTime * 2;
        this.mesh.position.y = this.baseY + Math.sin(Date.now() * 0.003) * 0.2;
        if (this.mesh) {
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    collect(player) {
        if (this.collected) return;
        
        console.log('Collecting item:', this.type);
        this.collected = true;

        // Aplicar efeito baseado no tipo
        if (this.type === 'coin' && player && player.game) {
            console.log('Adding 100 points to score');
            player.game.updateScore(100);
            console.log('Current score:', player.game.score);
        } else if (player) {
            // Aplicar power-ups
            switch(this.type) {
                case 'powerup_speed':
                    player.applySpeedBoost(5000);
                    break;
                case 'powerup_jump':
                    player.applyJumpBoost(8000);
                    break;
            }
        }

        // Efeito visual de texto
        const text = document.createElement('div');
        text.textContent = this.type === 'coin' ? '+100' : this.type.replace('powerup_', '').toUpperCase();
        text.style.position = 'fixed';
        text.style.left = '50%';
        text.style.top = '40%';
        text.style.transform = 'translate(-50%, -50%)';
        text.style.fontSize = '48px';
        text.style.color = this.type === 'coin' ? '#FFD700' : '#ff69b4';
        text.style.fontFamily = "'Press Start 2P', monospace";
        text.style.textShadow = '2px 2px 8px #000';
        text.style.zIndex = '2000';
        text.style.opacity = '1';
        text.style.pointerEvents = 'none';
        document.body.appendChild(text);

        // Remover o texto após um tempo
        setTimeout(() => {
            text.style.transition = 'opacity 0.5s';
            text.style.opacity = '0';
            setTimeout(() => text.remove(), 500);
        }, 700);

        // Remover o collectible
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }

        this.dispose();
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            this.mesh = null;
        }
    }
}

export class CollectibleManager {
    constructor(scene, effectsManager) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.collectibles = [];
        this.spawnInterval = 1000;
        this.lastSpawnTime = 0;
        this.enabled = false;
        this.maxCollectibles = 15; // Reduzido de 30 para 15
        this.maxPowerups = 2; // Reduzido de 3 para 2
        this.minCoinDistance = 10; // Distância mínima entre coins
        this.currentPlayerY = 0; // Nova propriedade para rastrear a altura do jogador
    }

    start() {
        this.enabled = true;
        this.lastSpawnTime = Date.now();
        this.clearCollectibles(); // Chamar clearCollectibles ao invés de spawnar apenas um
    }

    spawnCollectible(type, position) {
        const collectible = new Collectible(type, position, this.scene, this.effectsManager);
        this.collectibles.push(collectible);
    }

    getRandomType() {
        const types = ['coin', 'powerup_speed', 'powerup_jump'];
        const weights = [0.9, 0.05, 0.05]; // 90% chance de coin, 5% cada power-up
        let random = Math.random(), sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) return types[i];
        }
        return 'coin';
    }

    update(deltaTime, currentTime, player) {
        if (!this.enabled || !player) return;

        // Atualizar a altura atual do jogador de forma mais precisa
        this.currentPlayerY = player.currentFloor * player.floorHeight;

        // Limpar collectibles coletados e ajustar posições
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (collectible.collected) {
                this.collectibles.splice(i, 1);
            } else {
                collectible.update(deltaTime);
                
                // Forçar a altura do coletável para estar sempre no nível atual
                const targetY = this.currentPlayerY + 2; // Aumentamos para 2 para garantir que fique acima do chão
                collectible.mesh.position.y = targetY;
                collectible.baseY = targetY;
            }
        }

        // Spawn de novos coletáveis sempre no nível correto
        const activeCoins = this.collectibles.filter(c => 
            c.type === 'coin' && !c.collected
        ).length;

        if (activeCoins < 8) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                this.currentPlayerY + 2, // Aumentamos para 2 para garantir que fique acima do chão
                20 + Math.random() * 160
            );

            // Verificar se a nova posição está longe o suficiente de outras coins
            const isFarEnough = this.collectibles.every(c => {
                if (c.type === 'coin' && !c.collected) {
                    const distance = position.distanceTo(c.mesh.position);
                    return distance > this.minCoinDistance;
                }
                return true;
            });

            if (isFarEnough) {
                this.spawnCollectible('coin', position);
            }
        }

        // Spawn de power-ups também no nível correto
        const activePowerups = this.collectibles.filter(c => 
            c.type !== 'coin' && !c.collected
        ).length;

        if (activePowerups < this.maxPowerups && Math.random() < 0.1) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                this.currentPlayerY + 2, // Aumentamos para 2 para garantir que fique acima do chão
                20 + Math.random() * 160
            );
            
            const powerupType = Math.random() < 0.5 ? 'powerup_speed' : 'powerup_jump';
            this.spawnCollectible(powerupType, position);
        }
    }

    checkCollisions(player) {
        if (!player || !player.mesh || !this.enabled) return;

        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        
        this.collectibles.forEach(collectible => {
            if (!collectible.collected && collectible.mesh) {
                const collectibleBox = new THREE.Box3().setFromObject(collectible.mesh);
                
                if (collectibleBox.intersectsBox(playerBox)) {
                    console.log('Collision detected with collectible'); // Debug log
                    collectible.collect(player);
                }
            }
        });
    }

    dispose() {
        this.enabled = false;
        this.clearCollectibles();
    }

    clearCollectibles() {
        // Remover todos os coletáveis existentes
        for (const collectible of this.collectibles) {
            collectible.dispose();
        }
        this.collectibles = [];
        
        // Reiniciar o sistema
        this.enabled = true;
        this.lastSpawnTime = Date.now();
        
        // Spawnar alguns coletáveis iniciais no nível atual
        if (this.currentPlayerY !== undefined) {
            for (let i = 0; i < 5; i++) {
                const position = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    this.currentPlayerY + 2, // Aumentamos para 2 para garantir que fique acima do chão
                    20 + Math.random() * 160
                );
                this.spawnCollectible(this.getRandomType(), position);
            }
        }
    }
}
