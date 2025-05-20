import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class Level {
    constructor(scene) {
        this.scene = scene;
        
        // Estas propriedades serão inicializadas pelo Game posteriormente
        this.game = null;
        this.player = null;
        this.donkeyKongModel = null;
        this.modelLoader = new GLTFLoader();
        
        // Inicializações de propriedades
        this.floors = [];
        this.platforms = []; // Para colisão dos barris
        this.stairs = [];
        this.barrels = [];
        this.barrelSpawnTimer = 0;
        this.barrelSpawnInterval = 1000; // Reduzido para 1 segundo (era 2000)
        this.minSpawnInterval = 800; // Intervalo mínimo entre barris
        this.maxSpawnInterval = 1500; // Intervalo máximo entre barris
        this.laneWidth = 6;
        this.floorHeight = 50; // Aumentado de 16 para 50
        this.numFloors = 4;
        this.floorLength = 200;
        this.boundaryWidth = 40;
        this.donkeyKong = null;
        this.donkeyKongPlatform = null;
        this.gameStarted = false;
        this.onGameStarted = null;
        this.gravity = 9.8; // Assuming a default gravity value
        this.donkeyKongAnimationTime = 0;
        this.animTime = 0;
        this.nextSpecialIdleTime = 0;
        this.chestBeatTime = 0;
        this.isBeatingChest = false;
        this.score = 0;

        // Define ladder positions as a class property - removida a escada do andar do DK (3)
        this.ladderPositions = [
            { floor: 0, z: this.floorLength * 0.10 },
            { floor: 1, z: this.floorLength * 0.95 },
            { floor: 2, z: this.floorLength * 0.15 }
        ];

        try {
            this.init();
        } catch (error) {
            console.error("Erro na inicialização do nível:", error);
        }
    }

    init() {
        this.createEnvironment();
        this.createFloors();
        this.createStairs();
        this.createBoundaries();
        this.createDonkeyKong();
        this.createSun();
    }

    createEnvironment() {
        // Cor de fundo totalmente preta como no arcade original
        this.scene.background = new THREE.Color(0x000000);
        
        // Create ground with shadows
        const groundGeometry = new THREE.PlaneGeometry(400, this.floorLength * 2);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000, // Fundo preto
            side: THREE.DoubleSide,
            shadowSide: THREE.FrontSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.position.z = this.floorLength / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createBoundaries() {
        const wallMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true,
            opacity: 0.0
        });

        // Create boundaries for each floor
        for (let floor = 0; floor < this.numFloors; floor++) {
            const floorY = floor * this.floorHeight;
            
            // Create boundary geometry based on floor dimensions
            const boundaryGeometry = new THREE.BoxGeometry(0.1, this.floorHeight, this.floorLength);
            
            // Left boundary
            const leftWall = new THREE.Mesh(boundaryGeometry, wallMaterial.clone());
            leftWall.position.set(
                -this.boundaryWidth/2,
                floorY + this.floorHeight/2,
                this.floorLength / 2  // Align with floor position
            );
            leftWall.userData.isBoundary = true;
            this.scene.add(leftWall);

            // Right boundary
            const rightWall = new THREE.Mesh(boundaryGeometry, wallMaterial.clone());
            rightWall.position.set(
                this.boundaryWidth/2,
                floorY + this.floorHeight/2,
                this.floorLength / 2  // Align with floor position
            );
            rightWall.userData.isBoundary = true;
            this.scene.add(rightWall);

            // Front and back boundaries
            const frontBackGeometry = new THREE.BoxGeometry(this.boundaryWidth, this.floorHeight, 0.1);
            
            // Front boundary
            const frontWall = new THREE.Mesh(frontBackGeometry, wallMaterial.clone());
            frontWall.position.set(
                0,
                floorY + this.floorHeight/2,
                0  // Front boundary at z=0
            );
            frontWall.userData.isBoundary = true;
            this.scene.add(frontWall);

            // Back boundary
            const backWall = new THREE.Mesh(frontBackGeometry, wallMaterial.clone());
            backWall.position.set(
                0,
                floorY + this.floorHeight/2,
                this.floorLength  // Back boundary at z=floorLength
            );
            backWall.userData.isBoundary = true;
            this.scene.add(backWall);
        }
    }

    createFloors() {
        // Materiais reutilizáveis
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xBC0045,
            metalness: 0.2,
            roughness: 0.8,
            shadowSide: THREE.FrontSide
        });

        const beamMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xBC0045,
            shadowSide: THREE.FrontSide
        });

        const sideDetailMaterial = new THREE.MeshPhongMaterial({
            color: 0xBC0045,
            metalness: 0.1,
            roughness: 0.8
        });

        // Geometrias reutilizáveis
        const floorGeometry = new THREE.BoxGeometry(this.boundaryWidth, 2, this.floorLength);
        const beamGeometry = new THREE.BoxGeometry(this.boundaryWidth, 0.3, 0.7);
        const sideDetailGeometry = new THREE.BoxGeometry(this.boundaryWidth, 0.5, this.floorLength);

        for (let floor = 0; floor < this.numFloors; floor++) {
            // Criar objeto pai para cada andar
            const floorParent = new THREE.Object3D();
            floorParent.position.set(0, floor * this.floorHeight, this.floorLength / 2);
            
            // Criar a plataforma principal como filho
            const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
            floorMesh.castShadow = true;
            floorMesh.receiveShadow = true;
            floorParent.add(floorMesh);
            this.floors.push(floorMesh);

            // Adicionar vigas como filhos
            const numBeams = Math.floor(this.floorLength / 7);
            for (let i = 0; i < numBeams; i++) {
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                beam.position.set(0, 1.1, -this.floorLength/2 + i * 7 + 3.5);
                beam.castShadow = true;
                beam.receiveShadow = true;
                floorParent.add(beam);
            }
            
            // Adicionar detalhes laterais como filhos
            const sideDetail = new THREE.Mesh(sideDetailGeometry, sideDetailMaterial);
            sideDetail.position.set(0, -0.75, 0);
            sideDetail.castShadow = true;
            sideDetail.receiveShadow = true;
            floorParent.add(sideDetail);

            // Configurar sombras para toda a estrutura
            floorParent.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Adicionar o objeto pai completo à cena
            this.scene.add(floorParent);
        }
    }

    // Novo método para adicionar indicadores de direção no chão
    addDirectionalMarkers(floor, isRightToLeft) {
        const y = floor * this.floorHeight + 1.05;
        const markerSize = 3;
        const spacing = 30;
        
        // Número de marcadores a serem colocados
        const numMarkers = Math.floor(this.floorLength / spacing) - 1;
        
        for (let i = 1; i <= numMarkers; i++) {
            const z = i * spacing;
            
            // Criar geometria para a seta direcional
            const arrowGeometry = new THREE.PlaneGeometry(markerSize, markerSize);
            const arrowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            // Posicionar e rotacionar a seta de acordo com a direção do andar
            arrow.rotation.x = -Math.PI / 2; // Apontar para cima
            
            if (isRightToLeft) {
                // Seta apontando para esquerda
                arrow.position.set(markerSize, y, z);
            } else {
                // Seta apontando para direita
                arrow.position.set(-markerSize, y, z);
            }
            
            this.scene.add(arrow);
        }
    }

    createWalls() {
        // Cor das paredes laterais (preto para combinar com o fundo)
        const wallColor = 0x000000;
        
        // Altura total de todas as plataformas
        const totalHeight = this.numFloors * this.floorHeight;
        
        // Paredes laterais (esquerda e direita)
        const sideWallGeometry = new THREE.BoxGeometry(2, totalHeight, this.floorLength);
        const sideWallMaterial = new THREE.MeshPhongMaterial({ 
            color: wallColor,
            transparent: true,
            opacity: 0.7
        });
        
        // Parede esquerda
        const leftWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
        leftWall.position.set(
            -this.boundaryWidth/2 - 1, // Fora da área jogável
            totalHeight/2,             // Centro vertical
            this.floorLength/2         // Centro do comprimento
        );
        this.scene.add(leftWall);
        
        // Parede direita
        const rightWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
        rightWall.position.set(
            this.boundaryWidth/2 + 1,  // Fora da área jogável
            totalHeight/2,             // Centro vertical
            this.floorLength/2         // Centro do comprimento
        );
        this.scene.add(rightWall);
        
        // Paredes de fundo e frente
        const endWallGeometry = new THREE.BoxGeometry(this.boundaryWidth + 4, totalHeight, 2);
        const endWallMaterial = new THREE.MeshPhongMaterial({ 
            color: wallColor,
            transparent: true,
            opacity: 0.7
        });
        
        // Parede do fundo
        const backWall = new THREE.Mesh(endWallGeometry, endWallMaterial);
        backWall.position.set(
            0,                     // Centro horizontal
            totalHeight/2,         // Centro vertical
            this.floorLength + 1   // Além do fim da plataforma
        );
        this.scene.add(backWall);
        
        // Parede da frente
        const frontWall = new THREE.Mesh(endWallGeometry, endWallMaterial);
        frontWall.position.set(
            0,                     // Centro horizontal
            totalHeight/2,         // Centro vertical
            -1                     // Antes do início da plataforma
        );
        this.scene.add(frontWall);
    }

    createStairs() {
        const ladderWidth = 1.5;
        const ladderDepth = 0.2;
        const rungSpacing = 1.5;
        
        // Cores das escadas no estilo Donkey Kong original
        const ladderSideColor = 0x29ADFF; // Azul claro/médio para as laterais
        const ladderRungColor = 0x29ADFF; // Mesma cor para os degraus

        // Use as posições de escada definidas no construtor
        this.ladderPositions.forEach(position => {
            const floorY = position.floor * this.floorHeight;
            const ladderHeight = this.floorHeight;
            
            // Criar o objeto pai da escada
            const ladderParent = new THREE.Object3D();
            ladderParent.position.set(0, floorY, position.z);
            
            // Criar as laterais da escada como filhos do objeto pai
            for (let side = -1; side <= 1; side += 2) {
                const sideGeometry = new THREE.BoxGeometry(0.15, ladderHeight, ladderDepth);
                const sideMaterial = new THREE.MeshPhongMaterial({ 
                    color: ladderSideColor,
                    emissive: 0x003366,
                    emissiveIntensity: 0.2
                });
                const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
                sideMesh.position.set(side * (ladderWidth / 2), ladderHeight / 2, 0);
                ladderParent.add(sideMesh);
            }
            
            // Criar os degraus como filhos do objeto pai
            const numRungs = Math.floor(ladderHeight / rungSpacing);
            for (let i = 0; i < numRungs; i++) {
                const rungGeometry = new THREE.BoxGeometry(ladderWidth, 0.15, ladderDepth);
                const rungMaterial = new THREE.MeshPhongMaterial({ 
                    color: ladderRungColor,
                    emissive: 0x003366,
                    emissiveIntensity: 0.2
                });
                const rungMesh = new THREE.Mesh(rungGeometry, rungMaterial);
                rungMesh.position.set(0, (i * rungSpacing) + (rungSpacing / 2), 0);
                ladderParent.add(rungMesh);
            }
            
            // Criar hitbox para detecção de colisão
            const hitboxGeometry = new THREE.BoxGeometry(ladderWidth, ladderHeight, 2); // Aumentei a profundidade para 2
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.0
            });
            
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.position.set(0, ladderHeight / 2, 0);
            
            // Configurar propriedades importantes para a hitbox
            hitbox.userData = {
                isLadder: true,
                floorIndex: position.floor,
                type: 'ladder',
                ladderParent: ladderParent
            };
            
            // Adicionar a hitbox ao objeto pai
            ladderParent.add(hitbox);
            
            // Importante: Adicionar a hitbox à lista de escadas E à cena
            this.stairs.push(hitbox);
            this.scene.add(hitbox); // Adicionar hitbox diretamente à cena
            
            // Ajustar posição global da hitbox
            hitbox.position.copy(ladderParent.position);
            hitbox.position.y += ladderHeight / 2;
            
            // Configurar sombras para toda a estrutura
            ladderParent.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Adicionar o objeto pai completo à cena
            this.scene.add(ladderParent);
        });
    }

    async loadDonkeyKongModel() {
        try {
            console.log('Carregando modelo do Donkey Kong...');
            const gltf = await this.modelLoader.loadAsync('./models/donkeykong.glb');
            
            this.donkeyKongModel = gltf.scene;
            
            // Making DK much larger now
            this.donkeyKongModel.scale.set(1.2, 1.2, 1.2);
            
            // Configurar sombras e materiais para todos os meshes do modelo
            this.donkeyKongModel.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        child.material.needsUpdate = true;
                        child.material.shadowSide = THREE.FrontSide;
                    }
                }
                // Guardar referências aos ossos importantes se existirem
                if (child.isBone) {
                    console.log('Found bone:', child.name);
                }
            });

            // Posicionar o DK no topo do nível
            const topFloorY = (this.numFloors - 1) * this.floorHeight;
            this.donkeyKongModel.position.set(
                0,                           // Centro X
                topFloorY + 4.8,              // Altura ajustada - moved much higher
                this.floorLength * 0.85     // Posição Z mantida
            );
            
            // Rotação básica
            this.donkeyKongModel.rotation.set(0, Math.PI, 0);

            // Criar o mixer de animação
            this.dkMixer = new THREE.AnimationMixer(this.donkeyKongModel);

            // Adicionar direto à cena sem tentar carregar a animação
            this.scene.add(this.donkeyKongModel);
            console.log('Modelo do Donkey Kong carregado com sucesso');

            // Atualizar a referência principal do DK
            this.donkeyKong = this.donkeyKongModel;

        } catch (error) {
            console.error('Erro ao carregar o modelo do Donkey Kong:', error);
            this.createPlaceholderDK();
        }
    }

    createPlaceholderDK() {
        // Criar um placeholder simples caso o modelo falhe ao carregar
        const geometry = new THREE.BoxGeometry(2, 3, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const placeholder = new THREE.Mesh(geometry, material);
        
        const topFloorY = (this.numFloors - 1) * this.floorHeight;
        placeholder.position.set(
            0,
            topFloorY + 4.5,
            this.floorLength * 0.85
        );
        
        this.donkeyKongModel = placeholder;
        this.scene.add(placeholder);
    }

    async createDonkeyKong() {
        // Remove platform creation code and just load DK
        await this.loadDonkeyKongModel();
    }

    createPlatform(x, y, z, width, height, depth, color = 0x808080) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1
        });
        const platform = new THREE.Mesh(geometry, material);
        platform.position.set(x, y, z);
        platform.castShadow = true;
        platform.receiveShadow = true;
        platform.userData.isPlatform = true;
        this.scene.add(platform);
        return platform;
    }

    createBoundary(x, y, z, width, height, depth) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.0,
            roughness: 0.8,
            metalness: 0.2
        });
        const boundary = new THREE.Mesh(geometry, material);
        boundary.position.set(x, y, z);
        boundary.userData.isBoundary = true;
        this.scene.add(boundary);
        return boundary;
    }

    createLadder(x, y, z, width, height, depth, floorIndex) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const ladder = new THREE.Mesh(geometry, material);
        ladder.position.set(x, y, z);
        ladder.userData.isLadder = true;
        ladder.userData.floorIndex = floorIndex;
        
        // Configurar sombras para as escadas
        ladder.castShadow = true;
        ladder.receiveShadow = true;
        
        this.scene.add(ladder);
        return ladder;
    }

    createBarrel() {
        // Criar o objeto pai do barril
        const barrelParent = new THREE.Object3D();
        
        // Barril mais parecido com o jogo original - cilindro redondo com aros
        const segments = 24;
        const radiusTop = 1.2;
        const radiusBottom = 1.2;
        const height = 2.4;
        const heightSegments = 8;
        
        const geometry = new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            segments,
            heightSegments,
            false
        );

        // Não deformar tanto o barril - manter mais cilíndrico
        const middleRadius = 1.4;  
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            const heightFactor = y / (height / 2);
            const smoothFactor = 1 - Math.pow(heightFactor, 4);
            const bulge = 1 + smoothFactor * (middleRadius/radiusTop - 1) * 0.7;
            positions[i] *= bulge;
            positions[i + 2] *= bulge;
        }
        geometry.computeVertexNormals();
        
        // Material de madeira
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xA05010,
            specular: 0x222222,
            shininess: 15
        });

        const barrelMesh = new THREE.Mesh(geometry, material);
        barrelMesh.rotation.z = Math.PI / 2;
        barrelParent.add(barrelMesh);

        // Adicionar aros metálicos ao barril
        const ringGeometry = new THREE.TorusGeometry(1.25, 0.1, 8, 24);
        const ringMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Criar aros metálicos em posições espaçadas uniformemente
        const ringPositions = [-0.9, -0.3, 0.3, 0.9];
        ringPositions.forEach(pos => {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(0, pos, 0);
            ring.rotation.x = Math.PI / 2;
            barrelMesh.add(ring);
        });

        // Position barrel at the stairs on the top floor with posição X mais aleatória
        const spawnY = this.floorHeight * (this.numFloors - 1) + 3;
        const spawnZ = this.floorLength * 0.15;
        // Usar toda a largura da plataforma para spawn, deixando margem nas bordas
        const spawnX = (Math.random() - 0.5) * (this.boundaryWidth - 8);
        barrelParent.position.set(spawnX, spawnY, spawnZ);

        // Add properties for movement with velocidade mais variada
        barrelParent.userData.floor = this.numFloors - 1;
        barrelParent.userData.speed = 50 + Math.random() * 40; // Velocidade base entre 50 e 90
        barrelParent.userData.rotationSpeed = 6 + Math.random() * 4; // Rotação entre 6 e 10
        barrelParent.userData.movingToBack = true;
        barrelParent.userData.verticalSpeed = 0;
        barrelParent.userData.lateralSpeed = (Math.random() - 0.5) * 10; // Movimento lateral
        
        // Ensure barrel renders in front of other objects
        barrelParent.renderOrder = 2;
        barrelMesh.material.depthTest = true;
        barrelMesh.material.transparent = false;

        // Configurar sombras para toda a estrutura
        barrelParent.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Add to scene and tracking array
        this.scene.add(barrelParent);
        this.barrels.push(barrelParent);

        // Definir próximo intervalo de spawn aleatoriamente
        this.barrelSpawnInterval = this.minSpawnInterval + Math.random() * (this.maxSpawnInterval - this.minSpawnInterval);
    }

    createGirder(x, y, z, width, height, depth, color = 0x4a4a4a) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.75,
            metalness: 0.25
        });
        const girder = new THREE.Mesh(geometry, material);
        girder.position.set(x, y, z);
        
        // Configurar sombras para as vigas
        girder.castShadow = true;
        girder.receiveShadow = true;
        
        this.scene.add(girder);
        return girder;
    }

    spawnBarrel() {
        // Usar o mesmo método de criar barril
        this.createBarrel();
    }

    update(deltaTime) {
        if (!deltaTime) return;

        // Atualizar o mixer de animações do DK
        if (this.dkMixer) {
            this.dkMixer.update(deltaTime);
        }

        // Only spawn and update barrels if game has started
        if (this.gameStarted) {
            this.barrelSpawnTimer += deltaTime;
            if (this.barrelSpawnTimer >= this.barrelSpawnInterval / 1000) {
                this.spawnBarrel();
                this.barrelSpawnTimer = 0;
            }

            // Update existing barrels
            for (let i = this.barrels.length - 1; i >= 0; i--) {
                const barrel = this.barrels[i];
                if (!barrel || !barrel.parent) {
                    this.barrels.splice(i, 1);
                    continue;
                }
                
                // Move barrel based on current floor
                if (barrel.userData.movingToBack) {
                    barrel.position.z += barrel.userData.speed * deltaTime;
                } else {
                    barrel.position.z -= barrel.userData.speed * deltaTime;
                }

                // Movimento lateral mais suave
                barrel.position.x += barrel.userData.lateralSpeed * deltaTime;

                // Verificar colisão com as paredes laterais de forma mais suave
                const halfWidth = this.boundaryWidth / 2 - 2;
                if (Math.abs(barrel.position.x) > halfWidth) {
                    barrel.userData.lateralSpeed *= -0.8; // Reduzir velocidade ao bater
                    barrel.position.x = Math.sign(barrel.position.x) * halfWidth;
                }

                // Update rotation based on movement
                if (barrel.userData.movingToBack) {
                    barrel.rotation.x += barrel.userData.rotationSpeed * deltaTime;
                } else {
                    barrel.rotation.x -= barrel.userData.rotationSpeed * deltaTime;
                }

                // Apply gravity mais forte para cair mais rápido
                const gravity = 50;
                barrel.userData.verticalSpeed -= gravity * deltaTime;
                barrel.position.y += barrel.userData.verticalSpeed * deltaTime;

                // Calculate floor height and check for floor collision
                const currentFloorHeight = barrel.userData.floor * this.floorHeight;
                const minHeight = currentFloorHeight + 1.7;

                if (barrel.position.y < minHeight) {
                    barrel.position.y = minHeight;
                    barrel.userData.verticalSpeed = 0;
                }

                // Check for player collision
                if (this.player && this.player.mesh) {
                    // Create collision boxes
                    const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
                    const barrelBox = new THREE.Box3().setFromObject(barrel);
                    
                    // Adjust player hitbox to be more forgiving
                    playerBox.min.y += 0.5; // Reduce bottom of hitbox
                    playerBox.max.y -= 0.3; // Reduce top of hitbox
                    playerBox.min.x += 0.2; // Reduce sides of hitbox
                    playerBox.max.x -= 0.2;
                    playerBox.min.z += 0.2;
                    playerBox.max.z -= 0.2;
                    
                    // Check for collision
                    if (barrelBox.intersectsBox(playerBox)) {
                        console.log('Player hit by barrel!');
                        if (this.game && this.game.onPlayerHit) {
                            this.game.onPlayerHit('barrel');
                        }
                    }
                }

                // Check if barrel has reached the boundary walls
                if (barrel.userData.movingToBack && barrel.position.z >= this.floorLength ||
                    !barrel.userData.movingToBack && barrel.position.z <= 0) {
                    
                    // If on the bottom floor (floor 0), remove the barrel
                    if (barrel.userData.floor === 0) {
                        this.scene.remove(barrel);
                        this.barrels.splice(i, 1);
                        continue;
                    }
                    
                    // Move to next floor down
                    barrel.userData.floor--;
                    
                    // Set position for next floor
                    const isEvenFloor = barrel.userData.floor % 2 === 0;
                    barrel.position.z = isEvenFloor ? 0 : this.floorLength;
                    barrel.userData.movingToBack = isEvenFloor;
                    
                    // Velocidade mais consistente ao mudar de andar
                    barrel.userData.speed = 60 + Math.random() * 20; // Menos variação
                    barrel.userData.lateralSpeed = (Math.random() - 0.5) * 5; // Movimento lateral mais suave
                    
                    // Pequeno salto apenas ao mudar de andar
                    barrel.userData.verticalSpeed = 3;
                    barrel.position.y = (barrel.userData.floor * this.floorHeight) + 5; // Altura inicial menor
                }
            }

            // Animate Donkey Kong
            if (this.donkeyKong) {
                this.animateDonkeyKong(deltaTime);
            }
        }

        // Check if we should start the game
        if (!this.gameStarted && this.onGameStarted) {
            this.gameStarted = true;
            this.onGameStarted();
        }

        // Inicializar o próximo tempo de arremesso se ainda não foi inicializado
        if (this.nextBarrelThrowTime === 0 && this.game && typeof this.game.time === 'number') {
            this.nextBarrelThrowTime = this.game.time + 3;
        }

        // Verificar se é hora de arremessar um barril
        if (this.game && typeof this.game.time === 'number' && 
            this.game.time > this.nextBarrelThrowTime && 
            this.donkeyKong && this.player && this.game.isRunning) {
            this.throwBarrel();
            this.nextBarrelThrowTime = this.game.time + this.barrelThrowInterval;
        }
    }

    animateDonkeyKong(deltaTime) {
        if (!this.donkeyKong) return;
        
        // Atualizar o contador de tempo de animação
        this.animTime += deltaTime;
        
        // Animação de arremesso de barril
        if (this.isThrowingBarrel) {
            this.throwAnimationTime += deltaTime;
            const throwDuration = 1.2; // duração total da animação de arremesso
            
            // Fase 1: Levantar o braço direito com o barril (0-0.5s)
            if (this.throwAnimationTime < 0.5) {
                const phase = this.throwAnimationTime / 0.5; // 0 a 1
                // Braço direito levantando
                if (this.donkeyKong.getObjectByName) {
                    const rightArm = this.donkeyKong.getObjectByName('rightArm');
                    if (rightArm) {
                        rightArm.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 2, phase);
                        rightArm.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 4, phase);
                    }
                }
            }
            // Fase 2: Abaixar o braço para arremessar (0.5-1.2s)
            else if (this.throwAnimationTime < throwDuration) {
                const phase = (this.throwAnimationTime - 0.5) / 0.7; // 0 a 1
                // Braço direito abaixando rapidamente
                if (this.donkeyKong.getObjectByName) {
                    const rightArm = this.donkeyKong.getObjectByName('rightArm');
                    if (rightArm) {
                        rightArm.rotation.z = THREE.MathUtils.lerp(-Math.PI / 2, Math.PI / 4, phase);
                        rightArm.rotation.x = THREE.MathUtils.lerp(Math.PI / 4, -Math.PI / 6, phase);
                    }
                }
            } 
            // Finalizar animação
            else {
                this.isThrowingBarrel = false;
                this.throwAnimationTime = 0;
                
                // Resetar posição do braço
                if (this.donkeyKong.getObjectByName) {
                    const rightArm = this.donkeyKong.getObjectByName('rightArm');
                    if (rightArm) {
                        rightArm.rotation.z = 0;
                        rightArm.rotation.x = 0;
                    }
                }
            }
        }
        // Animação de espera (idle)
        else {
            // Se nextSpecialIdleTime ainda não foi definido ou já passou
            if (this.nextSpecialIdleTime <= 0 || this.animTime > this.nextSpecialIdleTime) {
                // Iniciar sequência de bater no peito
                this.chestBeatTime = 0;
                this.isBeatingChest = true;
                this.nextSpecialIdleTime = this.animTime + 4 + Math.random() * 2; // próxima vez
                
                // Rugido do Donkey Kong (se disponível)
                if (this.game && this.game.soundManager) {
                    this.game.soundManager.playSound('dkroar');
                }
            }
            
            // Animação de respiração suave
            if (this.donkeyKong && this.donkeyKong.getObjectByName) {
                const body = this.donkeyKong.getObjectByName('body');
                if (body) {
                    // Movimento suave de respiração
                    body.scale.y = 1 + Math.sin(this.animTime * 2) * 0.02;
                    body.scale.z = 1 + Math.sin(this.animTime * 2) * 0.01;
                }
                
                // Movimento sutil da cabeça
                const head = this.donkeyKong.getObjectByName('head');
                if (head) {
                    head.rotation.y = Math.sin(this.animTime * 0.8) * 0.1;
                }
            }
            
            // Executar animação de bater no peito
            if (this.isBeatingChest && this.donkeyKong) {
                if (!this.chestBeatTime) this.chestBeatTime = 0;
                this.chestBeatTime += deltaTime;
                
                const beatDuration = 1.5; // duração total da animação
                const beatCount = 3; // número de batidas no peito
                const beatInterval = beatDuration / beatCount;
                
                if (this.chestBeatTime < beatDuration && this.donkeyKong.getObjectByName) {
                    // Determinar a fase da batida atual
                    const beatPhase = (this.chestBeatTime % beatInterval) / beatInterval;
                    const currentBeat = Math.floor(this.chestBeatTime / beatInterval);
                    
                    // Alternar entre braços
                    const isLeftArm = currentBeat % 2 === 0;
                    const armName = isLeftArm ? 'leftArm' : 'rightArm';
                    const arm = this.donkeyKong.getObjectByName(armName);
                    
                    if (arm) {
                        // Movimento para dentro (0-0.3)
                        if (beatPhase < 0.3) {
                            const phase = beatPhase / 0.3;
                            arm.rotation.z = isLeftArm ? 
                                THREE.MathUtils.lerp(0, Math.PI / 3, phase) : 
                                THREE.MathUtils.lerp(0, -Math.PI / 3, phase);
                        } 
                        // Movimento para fora (0.3-0.5)
                        else if (beatPhase < 0.5) {
                            const phase = (beatPhase - 0.3) / 0.2;
                            arm.rotation.z = isLeftArm ? 
                                THREE.MathUtils.lerp(Math.PI / 3, 0, phase) : 
                                THREE.MathUtils.lerp(-Math.PI / 3, 0, phase);
                        }
                        // Aguardar próxima batida (0.5-1.0)
                        else {
                            arm.rotation.z = 0;
                        }
                    }
                } else {
                    // Finalizar animação de bater no peito
                    this.isBeatingChest = false;
                    
                    // Resetar posição dos braços
                    if (this.donkeyKong.getObjectByName) {
                        const leftArm = this.donkeyKong.getObjectByName('leftArm');
                        const rightArm = this.donkeyKong.getObjectByName('rightArm');
                        
                        if (leftArm) leftArm.rotation.z = 0;
                        if (rightArm) rightArm.rotation.z = 0;
                    }
                }
            }
        }
    }

    startBarrels() {
        console.log('Starting barrels');
        this.clearBarrels(); // Clear any existing barrels
        this.gameStarted = true;
        this.barrelSpawnTimer = 0;
    }

    pauseBarrels() {
        console.log('Pausing barrels');
        this.gameStarted = false;
        // Store current state of barrels
        this.barrels.forEach(barrel => {
            barrel.userData.wasMoving = barrel.userData.movingToBack;
        });
    }

    resumeBarrels() {
        console.log('Resuming barrels');
        this.gameStarted = true;
        // Restore barrel movement state
        this.barrels.forEach(barrel => {
            barrel.userData.movingToBack = barrel.userData.wasMoving;
        });
    }

    stopBarrels() {
        console.log('Stopping barrels');
        this.gameStarted = false;
        this.clearBarrels();
    }

    clearBarrels() {
        // Remove any existing barrels from the scene
        for (let barrel of this.barrels) {
            if (barrel && barrel.parent) {
                this.scene.remove(barrel);
            }
        }
        this.barrels = [];
    }

    reset() {
        console.log('Resetting level');
        // Stop barrel spawning
        this.gameStarted = false;
        
        // Clear all barrels
        this.clearBarrels();
        
        // Reset any other level-specific state
        this.score = 0;
        this.updateScore();
        
        // Reset Donkey Kong animation
        if (this.donkeyKong) {
            this.donkeyKong.children.forEach(part => {
                if (part.rotation) {
                    part.rotation.set(0, 0, 0);
                }
            });
            this.donkeyKongAnimationTime = 0;
            this.isThrowingBarrel = false;
            this.throwAnimationTime = 0;
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `SCORE: ${this.score.toString().padStart(6, '0')}`;
        }
    }

    throwBarrel() {
        // Verificar se todas as referências necessárias existem
        if (!this.game || !this.player || !this.donkeyKong) {
            console.error("Não é possível arremessar barril: referências faltando");
            return;
        }

        this.throwAnimationTime = 0;
        
        // Iniciar a animação de arremesso
        this.isThrowingBarrel = true;
        
        // Adicionar som de barril, se o gerenciador de sons estiver disponível
        if (this.game && this.game.soundManager) {
            this.game.soundManager.playSound('barrel_throw');
        }
        
        // Atrasar o lançamento físico do barril para coincidir com a animação
        setTimeout(() => {
            try {
                // Verificar novamente se as referências são válidas
                if (!this.game || !this.player || !this.donkeyKong) {
                    console.error("Arremesso cancelado: referências inválidas");
                    return;
                }
                
                // Criar geometria do barril - um cilindro deitado
                const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
                const barrelMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,  // Marrom para o barril
                    roughness: 0.7
                });
                
                const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
                
                // Posicionar o barril nas mãos do Donkey Kong
                barrel.position.copy(this.donkeyKong.position);
                barrel.position.y += 2; // Ajustar altura
                barrel.position.x += 0.5; // Ligeiramente à frente do DK
                
                // Rotacionar o barril para ficar na horizontal
                barrel.rotation.z = Math.PI / 2;
                
                // Adicionar detalhes visuais ao barril
                this.addBarrelDetails(barrel);
                
                // Calcular direção para o jogador com variação
                const playerPos = this.player.object ? this.player.object.position : 
                               (this.player.mesh ? this.player.mesh.position : new THREE.Vector3());
                
                const direction = new THREE.Vector3();
                direction.subVectors(playerPos, barrel.position).normalize();
                
                // Adicionar alguma aleatoriedade à direção
                direction.x += (Math.random() - 0.5) * 0.2;
                
                // Força do arremesso - variável
                const throwPower = 0.15 + Math.random() * 0.05;
                
                // Aplicar velocidade
                barrel.velocity = new THREE.Vector3(
                    direction.x * throwPower,
                    0.1,  // Impulso para cima
                    direction.z * throwPower
                );
                
                // Propriedades para rolagem do barril
                barrel.rollingSpeed = 0.1 + Math.random() * 0.05;
                barrel.rotationAxis = new THREE.Vector3(0, 0, 1);
                
                // Adicionar hitbox para colisão
                barrel.hitbox = new THREE.Box3().setFromObject(barrel);
                
                // Guardar referência ao objeto original para atualização da hitbox
                barrel.baseObject = barrel;
                
                // Adicionar o barril à cena e ao array de barris
                this.scene.add(barrel);
                this.barrels.push(barrel);
                
                console.log('Barrel thrown at:', barrel.position);
            } catch (error) {
                console.error("Erro ao lançar barril:", error);
            }
        }, 750); // Atraso de 750ms para coincidir com a animação
    }

    updateBarrels(deltaTime) {
        // Atualizar todos os barris
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const barrel = this.barrels[i];
            const mesh = barrel.mesh;
            
            // Aplicar gravidade se não estiver no chão
            if (!barrel.onGround) {
                barrel.velocity.y -= 9.8 * deltaTime; // Gravidade
            }
            
            // Atualizar posição
            mesh.position.x += barrel.velocity.x * deltaTime;
            mesh.position.y += barrel.velocity.y * deltaTime;
            
            // Rotacionar o barril
            mesh.rotation.y += barrel.angularVelocity.y * deltaTime;
            mesh.rotation.x += barrel.angularVelocity.x * deltaTime;
            
            // Verificar colisão com plataformas
            const checkPlatformCollision = () => {
                for (let j = 0; j < this.platforms.length; j++) {
                    const platform = this.platforms[j];
                    
                    // Ignorar plataformas já ultrapassadas
                    if (j < barrel.lastPlatformIndex - 1) continue;
                    
                    // Calcular limites da plataforma
                    const platformMinX = platform.position.x - platform.scale.x/2;
                    const platformMaxX = platform.position.x + platform.scale.x/2;
                    const platformY = platform.position.y + platform.scale.y/2;
                    
                    // Verificar se o barril está acima da plataforma e caindo
                    if (mesh.position.x >= platformMinX && mesh.position.x <= platformMaxX &&
                        mesh.position.y - 0.5 <= platformY && mesh.position.y - 0.4 >= platformY &&
                        barrel.velocity.y < 0) {
                        
                        // Posicionar em cima da plataforma
                        mesh.position.y = platformY + 0.5;
                        
                        // Inverter velocidade X se chegou na ponta da plataforma
                        if (mesh.position.x <= platformMinX + 1 || mesh.position.x >= platformMaxX - 1) {
                            barrel.velocity.x = -barrel.velocity.x;
                        }
                        
                        // Reduzir velocidade vertical (amortecimento)
                        barrel.velocity.y = 0;
                        barrel.onGround = true;
                        barrel.lastPlatformIndex = j;
                        
                        // Mudar velocidade com base no índice da plataforma (alternar direção em plataformas alternadas)
                        barrel.velocity.x = (j % 2 === 0) ? -5 : 5;
                        
                        return true;
                    }
                }
                
                // Se chegou aqui, não está tocando nenhuma plataforma
                barrel.onGround = false;
                return false;
            };
            
            checkPlatformCollision();
            
            // Verificar colisão com o jogador
            if (this.player && this.player.mesh) {
                const playerBox = new THREE.Box3().setFromObject(this.player.mesh);
                const barrelBox = new THREE.Box3().setFromObject(mesh);
                
                if (barrelBox.intersectsBox(playerBox)) {
                    // Colisão com o jogador
                    if (this.game.onPlayerHit) {
                        this.game.onPlayerHit('barrel');
                    }
                }
            }
            
            // Remover barris que saíram da área do jogo
            if (mesh.position.y < -10 || mesh.position.x < -20 || mesh.position.x > 20) {
                this.scene.remove(mesh);
                this.barrels.splice(i, 1);
            }
        }
    }

    createSun() {
        // Criar o objeto pai do sol
        const sunParent = new THREE.Object3D();
        sunParent.position.set(-100, 150, -50);

        // Criar o disco principal do sol (mais vibrante)
        const sunGeometry = new THREE.CircleGeometry(15, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700, // Dourado mais vibrante
            side: THREE.DoubleSide
        });
        const sunCore = new THREE.Mesh(sunGeometry, sunMaterial);
        sunParent.add(sunCore);

        // Adicionar brilho mais intenso ao redor do disco
        const glowGeometry = new THREE.CircleGeometry(20, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFA500, // Laranja para contraste
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.2;
        sunParent.add(glow);

        // Criar raios principais mais longos e contrastantes
        const numMainRays = 12; // Menos raios para mais destaque
        const rayGeometry = new THREE.BufferGeometry();
        const rayVertices = [];
        
        for (let i = 0; i < numMainRays; i++) {
            const angle = (i / numMainRays) * Math.PI * 2;
            const innerRadius = 15;
            // Raios mais longos para maior visibilidade
            const outerRadius = i % 2 === 0 ? 35 : 25;
            
            rayVertices.push(
                Math.cos(angle) * innerRadius,
                Math.sin(angle) * innerRadius,
                0,
                Math.cos(angle) * outerRadius,
                Math.sin(angle) * outerRadius,
                0
            );
        }
        
        rayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rayVertices, 3));
        const rayMaterial = new THREE.LineBasicMaterial({
            color: 0xFFD700,
            linewidth: 3 // Linha mais grossa
        });
        const rays = new THREE.LineSegments(rayGeometry, rayMaterial);
        sunParent.add(rays);

        // Adicionar raios secundários mais visíveis
        const numSecondaryRays = 12;
        const secondaryRayGeometry = new THREE.BufferGeometry();
        const secondaryRayVertices = [];
        
        for (let i = 0; i < numSecondaryRays; i++) {
            const angle = ((i / numSecondaryRays) * Math.PI * 2) + (Math.PI / numSecondaryRays);
            const innerRadius = 15;
            const outerRadius = 30;
            
            secondaryRayVertices.push(
                Math.cos(angle) * innerRadius,
                Math.sin(angle) * innerRadius,
                0,
                Math.cos(angle) * outerRadius,
                Math.sin(angle) * outerRadius,
                0
            );
        }
        
        secondaryRayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(secondaryRayVertices, 3));
        const secondaryRayMaterial = new THREE.LineBasicMaterial({
            color: 0xFFA500, // Laranja para contraste
            transparent: true,
            opacity: 0.7,
            linewidth: 2
        });
        const secondaryRays = new THREE.LineSegments(secondaryRayGeometry, secondaryRayMaterial);
        sunParent.add(secondaryRays);

        // Adicionar luz do sol mais intensa
        const sunLight = new THREE.PointLight(0xffffcc, 2, 500);
        sunLight.position.set(0, 0, 0);
        sunParent.add(sunLight);

        // Animação mais rápida e notável
        let time = 0;
        const animate = () => {
            time += 0.016; // Aproximadamente 60 FPS

            // Rotação mais rápida dos raios em direções opostas
            rays.rotation.z += 0.001;
            secondaryRays.rotation.z -= 0.0015;
            
            // Pulsar mais pronunciado do brilho
            const glowScale = 1 + Math.sin(time * 2) * 0.2; // Aumentado amplitude
            glow.scale.set(glowScale, glowScale, 1);
            
            // Pulsar suave do núcleo
            const coreScale = 1 + Math.sin(time * 3) * 0.1;
            sunCore.scale.set(coreScale, coreScale, 1);
            
            // Variar a opacidade do brilho
            glowMaterial.opacity = 0.4 + Math.sin(time * 1.5) * 0.2;
            
            requestAnimationFrame(animate);
        };
        animate();

        // Adicionar o sol à cena
        this.scene.add(sunParent);
        this.sun = sunParent;
    }
} 