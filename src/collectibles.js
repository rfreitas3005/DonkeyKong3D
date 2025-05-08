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
        this.collected = true;

        // Efeito textual simples ao coletar
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
        setTimeout(() => {
            text.style.transition = 'opacity 0.5s';
            text.style.opacity = '0';
            setTimeout(() => text.remove(), 500);
        }, 700);

        if (this.effectsManager && typeof this.effectsManager.createCollectEffect === 'function') {
            this.effectsManager.createCollectEffect(this.mesh.position, this.mesh.material.color);
        } else {
            console.log('[Collectible] No effectsManager or createCollectEffect not a function');
        }

        if (player?.game?.soundManager?.play) {
            player.game.soundManager.play('coin');
        } else {
            console.log('[Collectible] No soundManager or play method');
        }

        switch (this.type) {
            case 'coin':
                if (player?.addScore) player.addScore(100);
                else console.log('[Collectible] Player missing addScore');
                break;
            case 'powerup_speed':
                if (player?.applySpeedBoost) player.applySpeedBoost(4000);
                else console.log('[Collectible] Player missing applySpeedBoost');
                break;
            case 'powerup_jump':
                if (player?.applyJumpBoost) player.applyJumpBoost(5000);
                else console.log('[Collectible] Player missing applyJumpBoost');
                break;
            case 'powerup_invincible':
                if (player?.applyInvincibility) player.applyInvincibility(3000);
                else console.log('[Collectible] Player missing applyInvincibility');
                break;
        }

        if (this.mesh?.parent) {
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
        this.spawnInterval = 1000; // 1 segundo
        this.lastSpawnTime = 0;
        this.enabled = false;
        this.maxCollectibles = 20; // ou mais, se quiser
    }

    start() {
        this.enabled = true;
        this.lastSpawnTime = Date.now();
        this.spawnCollectible(this.getRandomType(), new THREE.Vector3(0, 2, 40));
    }

    spawnCollectible(type, position) {
        const collectible = new Collectible(type, position, this.scene, this.effectsManager);
        this.collectibles.push(collectible);
    }

    getRandomType() {
        const types = ['coin', 'powerup_speed', 'powerup_jump', 'powerup_invincible'];
        const weights = [0.7, 0.1, 0.1, 0.1];
        let random = Math.random(), sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) return types[i];
        }
        return 'coin';
    }

    update(deltaTime, currentTime) {
        if (!this.enabled) return;

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (collectible.collected) {
                this.collectibles.splice(i, 1);
            } else {
                collectible.update(deltaTime);
            }
        }

        // Garantir que sempre haja pelo menos uma coin
        const hasCoin = this.collectibles.some(c => c.type === 'coin' && !c.collected);
        if (!hasCoin) {
            const floor = Math.floor(Math.random() * 4);
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                floor * 16 + 2,
                20 + Math.random() * 160
            );
            this.spawnCollectible('coin', position);
        }

        // Garantir até 9 powerups ativos
        const activePowerups = this.collectibles.filter(c => c.type !== 'coin' && !c.collected).length;
        const maxPowerups = this.maxCollectibles - 1; // 1 coin + 9 powerups
        if (activePowerups < maxPowerups) {
            const toSpawn = maxPowerups - activePowerups;
            for (let i = 0; i < toSpawn; i++) {
                const floor = Math.floor(Math.random() * 4);
                const position = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    floor * 16 + 2,
                    20 + Math.random() * 160
                );
                const powerupTypes = ['powerup_speed', 'powerup_jump', 'powerup_invincible'];
                const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                this.spawnCollectible(type, position);
            }
        }
    }

    checkCollisions(player) {
        if (!player.mesh || !this.enabled) return;

        // Bounding sphere do player
        const playerPos = player.mesh.position.clone();
        const playerRadius = 1.0; // Ajuste conforme necessário

        for (const collectible of this.collectibles) {
            if (!collectible.collected && collectible.mesh) {
                const collectiblePos = collectible.mesh.position.clone();
                const collectibleRadius = 1.0; // Ajuste conforme necessário

                const distance = playerPos.distanceTo(collectiblePos);
                if (distance < playerRadius + collectibleRadius) {
                    collectible.collect(player);
                }
            }
        }
    }

    dispose() {
        this.enabled = false;
        this.clearCollectibles();
    }

    clearCollectibles() {
        while (this.collectibles.length > 0) {
            this.collectibles.pop()?.dispose();
        }
        this.lastSpawnTime = 0;
    }
}
