import * as THREE from 'three';

export class Level {
    constructor(scene) {
        this.scene = scene;
        this.floors = [];
        this.stairs = [];
        this.barrels = [];
        this.barrelSpawnTimer = 0;
        this.barrelSpawnInterval = 2000; // 2 seconds between spawns
        this.laneWidth = 6;
        this.floorHeight = 16;
        this.numFloors = 4;
        this.floorLength = 200;
        this.boundaryWidth = 40;
        this.donkeyKong = null;
        this.donkeyKongPlatform = null;
        this.gameStarted = false;
        this.onGameStarted = null;
        this.gravity = 9.8; // Assuming a default gravity value
        this.donkeyKongAnimationTime = 0;

        // Define ladder positions as a class property
        this.ladderPositions = [
            { floor: 0, z: this.floorLength * 0.10 },
            { floor: 1, z: this.floorLength * 0.95 },
            { floor: 2, z: this.floorLength * 0.15 },
            { floor: 3, z: this.floorLength * 0.85 }
        ];

        this.init();
    }

    init() {
        this.createEnvironment();
        this.createFloors();
        this.createStairs();
        this.createBoundaries();
        this.createDonkeyKong();
    }

    createEnvironment() {
        // Cor de fundo totalmente preta como no arcade original
        this.scene.background = new THREE.Color(0x000000);
        
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(400, this.floorLength * 2);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000, // Fundo preto
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.position.z = this.floorLength / 2;
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
        // Cor do piso mais próxima do Donkey Kong original
        const floorPinkColor = 0xE80053; // Rosa/vermelho mais próximo do original
        
        for (let floor = 0; floor < this.numFloors; floor++) {
            // Criar plataforma principal mais alta
            const floorGeometry = new THREE.BoxGeometry(this.boundaryWidth, 2, this.floorLength);
            
            // Material para o piso com cor rosa/vermelho do Donkey Kong original
            const floorMaterial = new THREE.MeshPhongMaterial({ 
                color: floorPinkColor,
                metalness: 0.1,
                roughness: 0.8,
                shininess: 30
            });
            
            const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
            
            // Posição ajustada para evitar que o personagem flutue
            floorMesh.position.set(
                0,
                floor * this.floorHeight,
                this.floorLength / 2
            );
            
            this.floors.push(floorMesh);
            this.scene.add(floorMesh);

            // Alternância de direção para cada andar (como no jogo original)
            const isRightToLeft = floor % 2 === 1;
            
            // Adicionar linhas horizontais no estilo Donkey Kong original
            // (mais espaçadas para o visual "girder")
            const numBeams = Math.floor(this.floorLength / 7);
            for (let i = 0; i < numBeams; i++) {
                const beamGeometry = new THREE.BoxGeometry(this.boundaryWidth, 0.3, 0.7);
                const beamMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xBC0045, // Vermelho mais escuro para as linhas
                });
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                
                beam.position.set(
                    0,
                    floor * this.floorHeight + 1.1, // Acima do piso
                    i * 7 + 3.5 // Distribuição uniforme ao longo do comprimento
                );
                
                this.scene.add(beam);
            }
            
            // Adicionar detalhes laterais para cada piso
            const sideDetailGeometry = new THREE.BoxGeometry(this.boundaryWidth, 0.5, this.floorLength);
            const sideDetailMaterial = new THREE.MeshPhongMaterial({
                color: 0xBC0045, // Vermelho mais escuro
                metalness: 0.1,
                roughness: 0.8
            });
            
            // Detalhe inferior
            const lowerDetail = new THREE.Mesh(sideDetailGeometry, sideDetailMaterial);
            lowerDetail.position.set(
                0,
                floor * this.floorHeight - 0.7,
                this.floorLength / 2
            );
            this.scene.add(lowerDetail);
            
            // Adicionar setas direcionais no chão para indicar o fluxo (como no jogo original)
            this.addDirectionalMarkers(floor, isRightToLeft);
        }
        
        // Adicionar paredes laterais visíveis
        this.createWalls();
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
            
            // Criar as laterais da escada
            for (let side = -1; side <= 1; side += 2) {
                const sideGeometry = new THREE.BoxGeometry(0.15, ladderHeight, ladderDepth);
                const sideMaterial = new THREE.MeshPhongMaterial({ 
                    color: ladderSideColor,
                    emissive: 0x003366, // Brilho azul profundo
                    emissiveIntensity: 0.2
                });
                const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
                
                sideMesh.position.set(
                    side * (ladderWidth / 2),
                    floorY + ladderHeight / 2,
                    position.z
                );
                
                this.scene.add(sideMesh);
            }
            
            // Criar os degraus da escada
            const numRungs = Math.floor(ladderHeight / rungSpacing);
            for (let i = 0; i < numRungs; i++) {
                const rungGeometry = new THREE.BoxGeometry(ladderWidth, 0.15, ladderDepth);
                const rungMaterial = new THREE.MeshPhongMaterial({ 
                    color: ladderRungColor,
                    emissive: 0x003366, // Brilho azul profundo
                    emissiveIntensity: 0.2
                });
                const rungMesh = new THREE.Mesh(rungGeometry, rungMaterial);
                
                rungMesh.position.set(
                    0,
                    floorY + (i * rungSpacing) + (rungSpacing / 2),
                    position.z
                );
                
                this.scene.add(rungMesh);
            }
            
            // Adicionar hitbox para detecção de colisão
            const hitboxGeometry = new THREE.BoxGeometry(ladderWidth, ladderHeight, 1);
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.0
            });
            
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.position.set(
                0,
                floorY + ladderHeight / 2,
                position.z
            );
            
            hitbox.userData.isLadder = true;
            hitbox.userData.floorIndex = position.floor;
            
            this.stairs.push(hitbox);
            this.scene.add(hitbox);
        });
    }

    createDonkeyKong() {
        // Create elevated platform for Donkey Kong with collision
        const platformGeometry = new THREE.BoxGeometry(10, 1, 10);
        const platformMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            metalness: 0.2,
            roughness: 0.8
        });
        this.donkeyKongPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
        
        // Position platform above the top floor
        const topFloorY = (this.numFloors - 1) * this.floorHeight;
        this.donkeyKongPlatform.position.set(
            0,
            topFloorY + 1,
            this.floorLength * 0.85
        );
        
        // Add collision properties
        this.donkeyKongPlatform.userData.isBoundary = true;
        this.scene.add(this.donkeyKongPlatform);

        // Create a simple gorilla placeholder using primitives
        const body = new THREE.Group();

        // Torso
        const torsoGeometry = new THREE.BoxGeometry(3, 4, 2);
        const gorillaMaterial = new THREE.MeshPhongMaterial({ color: 0x4A3222 });
        const torso = new THREE.Mesh(torsoGeometry, gorillaMaterial);
        body.add(torso);

        // Head
        const headGeometry = new THREE.BoxGeometry(2, 2, 2);
        const head = new THREE.Mesh(headGeometry, gorillaMaterial);
        head.position.y = 3;
        body.add(head);

        // Arms
        const armGeometry = new THREE.BoxGeometry(1, 3, 1);
        const leftArm = new THREE.Mesh(armGeometry, gorillaMaterial);
        leftArm.position.set(-2, 0, 0);
        body.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, gorillaMaterial);
        rightArm.position.set(2, 0, 0);
        body.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(1, 2, 1);
        const leftLeg = new THREE.Mesh(legGeometry, gorillaMaterial);
        leftLeg.position.set(-1, -3, 0);
        body.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, gorillaMaterial);
        rightLeg.position.set(1, -3, 0);
        body.add(rightLeg);

        // Add face details
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.5, 3, 1);
        body.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.5, 3, 1);
        body.add(rightEye);

        // Position the entire body
        body.position.set(
            0,
            topFloorY + 3, // Above the platform
            this.floorLength * 0.85
        );

        this.donkeyKong = body;
        this.scene.add(this.donkeyKong);

        // Initialize throwing state
        this.isThrowingBarrel = false;
        this.throwAnimationTime = 0;
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
        this.scene.add(ladder);
        return ladder;
    }

    createBarrel() {
        // Create the barrel with a single cylinder with more segments for smoothness
        const segments = 32;
        const radiusTop = 1.4;
        const radiusBottom = 1.4;
        const height = 2.8;  // Altura reduzida para combinar melhor com o ambiente
        const heightSegments = 16;
        
        const geometry = new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            segments,
            heightSegments,
            false
        );

        // Bulge out the middle vertices with smoother transition
        const middleRadius = 1.8;  
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            const heightFactor = y / (height / 2);
            const smoothFactor = 1 - Math.pow(heightFactor, 4);
            const bulge = 1 + smoothFactor * (middleRadius/radiusTop - 1);
            positions[i] *= bulge;
            positions[i + 2] *= bulge;
        }
        geometry.computeVertexNormals();
        
        // Material mais metálico vermelho escuro
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xC00000,  // Vermelho mais escuro
            specular: 0x555555,
            shininess: 30
        });

        const barrel = new THREE.Mesh(geometry, material);

        // Position barrel at the stairs on the top floor
        const spawnY = this.floorHeight * (this.numFloors - 1) + 3;
        const spawnZ = this.floorLength * 0.15;
        const spawnX = (Math.random() - 0.5) * (this.boundaryWidth - 5);
        barrel.position.set(spawnX, spawnY, spawnZ);

        // Add properties for movement
        barrel.userData.floor = this.numFloors - 1;
        barrel.userData.speed = 70; // Velocidade aumentada para movimento mais rápido
        barrel.userData.rotationSpeed = 8;
        barrel.userData.movingToBack = true;
        barrel.userData.verticalSpeed = 0;
        
        // Ensure barrel renders in front of other objects
        barrel.renderOrder = 2;
        barrel.material.depthTest = true;
        barrel.material.transparent = false;

        // Initial rotation to lay barrel on its side
        barrel.rotation.z = Math.PI / 2;
        
        // Adicionar detalhes visuais ao barril
        this.addBarrelDetails(barrel);

        // Add to scene and tracking array
        this.scene.add(barrel);
        this.barrels.push(barrel);
    }

    // Novo método para adicionar detalhes visuais aos barris
    addBarrelDetails(barrel) {
        // Adicionar linhas verticais ao barril (como no jogo original)
        const numLines = 8;
        const lineWidth = 0.2;
        const lineHeight = barrel.geometry.parameters.height + 0.2;
        const lineRadius = barrel.geometry.parameters.radiusTop + 0.1;
        
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const lineGeometry = new THREE.BoxGeometry(lineWidth, lineHeight, lineWidth);
            const lineMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFFFFF, // Linhas brancas
                emissive: 0x222222,
                emissiveIntensity: 0.2
            });
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            
            // Posicionar a linha na superfície do barril
            const x = Math.cos(angle) * lineRadius;
            const z = Math.sin(angle) * lineRadius;
            
            line.position.set(x, 0, z);
            
            // Rotacionar a linha para apontar para o centro do barril
            line.lookAt(0, 0, 0);
            
            // Adicionar a linha como filho do barril
            barrel.add(line);
        }
        
        // Adicionar anéis nas extremidades do barril
        const ringRadius = barrel.geometry.parameters.radiusTop + 0.05;
        const ringThickness = 0.3;
        const ringDepth = 0.2;
        
        for (let end = -1; end <= 1; end += 2) {
            const ringGeometry = new THREE.TorusGeometry(ringRadius, ringThickness, 16, 32);
            const ringMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x888888, // Cinza metálico
                specular: 0xFFFFFF,
                shininess: 100
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            
            // Posicionar o anel na extremidade do barril
            ring.position.y = end * (barrel.geometry.parameters.height / 2 - 0.1);
            
            // Rotacionar o anel para alinhar com o barril
            ring.rotation.x = Math.PI / 2;
            
            // Adicionar o anel como filho do barril
            barrel.add(ring);
        }
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
        girder.castShadow = true;
        girder.receiveShadow = true;
        this.scene.add(girder);
        return girder;
    }

    spawnBarrel() {
        // Create the barrel with a single cylinder with more segments for smoothness
        const segments = 32;
        const radiusTop = 1.4;
        const radiusBottom = 1.4;
        const height = 2.8;  // Altura reduzida para combinar melhor com o ambiente
        const heightSegments = 16;
        
        const geometry = new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            segments,
            heightSegments,
            false
        );

        // Bulge out the middle vertices with smoother transition
        const middleRadius = 1.8;  
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            const heightFactor = y / (height / 2);
            const smoothFactor = 1 - Math.pow(heightFactor, 4);
            const bulge = 1 + smoothFactor * (middleRadius/radiusTop - 1);
            positions[i] *= bulge;
            positions[i + 2] *= bulge;
        }
        geometry.computeVertexNormals();
        
        // Material mais metálico vermelho escuro
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xC00000,  // Vermelho mais escuro
            specular: 0x555555,
            shininess: 30
        });

        const barrel = new THREE.Mesh(geometry, material);

        // Position barrel at the stairs on the top floor
        const spawnY = this.floorHeight * (this.numFloors - 1) + 3;
        const spawnZ = this.floorLength * 0.15;
        const spawnX = (Math.random() - 0.5) * (this.boundaryWidth - 5);
        barrel.position.set(spawnX, spawnY, spawnZ);

        // Add properties for movement
        barrel.userData.floor = this.numFloors - 1;
        barrel.userData.speed = 70; // Velocidade aumentada para movimento mais rápido
        barrel.userData.rotationSpeed = 8;
        barrel.userData.movingToBack = true;
        barrel.userData.verticalSpeed = 0;
        
        // Ensure barrel renders in front of other objects
        barrel.renderOrder = 2;
        barrel.material.depthTest = true;
        barrel.material.transparent = false;

        // Initial rotation to lay barrel on its side
        barrel.rotation.z = Math.PI / 2;
        
        // Adicionar detalhes visuais ao barril
        this.addBarrelDetails(barrel);

        // Add to scene and tracking array
        this.scene.add(barrel);
        this.barrels.push(barrel);
    }

    update(deltaTime) {
        if (!deltaTime) return;

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

                // Update rotation based on movement
                if (barrel.userData.movingToBack) {
                    barrel.rotation.x += barrel.userData.rotationSpeed * deltaTime;
                } else {
                    barrel.rotation.x -= barrel.userData.rotationSpeed * deltaTime;
                }

                // Apply gravity
                const gravity = 40;
                barrel.userData.verticalSpeed -= gravity * deltaTime;
                barrel.position.y += barrel.userData.verticalSpeed * deltaTime;

                // Calculate floor height and check for floor collision
                const currentFloorHeight = barrel.userData.floor * this.floorHeight;
                const minHeight = currentFloorHeight + 1.7;

                if (barrel.position.y < minHeight) {
                    barrel.position.y = minHeight;
                    barrel.userData.verticalSpeed = 0;
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
                    
                    // Set initial falling velocity and position
                    barrel.userData.verticalSpeed = -5;
                    barrel.position.y = (barrel.userData.floor * this.floorHeight) + 10; // Start higher for a more visible drop
                }
            }

            // Animate Donkey Kong
            if (this.donkeyKong) {
                if (this.isThrowingBarrel) {
                    // Throwing animation
                    this.throwAnimationTime += 0.1;
                    const throwProgress = Math.min(this.throwAnimationTime, 1);
                    
                    // Raise arms during throw
                    const leftArm = this.donkeyKong.children[2];
                    const rightArm = this.donkeyKong.children[3];
                    
                    leftArm.rotation.x = -Math.PI/2 * throwProgress;
                    rightArm.rotation.x = -Math.PI/2 * throwProgress;
                    
                    if (this.throwAnimationTime >= 1) {
                        this.isThrowingBarrel = false;
                        this.throwAnimationTime = 0;
                    }
                } else {
                    // Idle animation
                    this.donkeyKongAnimationTime += 0.05;
                    const yOffset = Math.sin(this.donkeyKongAnimationTime) * 0.3;
                    this.donkeyKong.position.y = (this.numFloors - 1) * this.floorHeight + 3 + yOffset;
                    
                    // Gentle arm swaying when not throwing
                    const leftArm = this.donkeyKong.children[2];
                    const rightArm = this.donkeyKong.children[3];
                    leftArm.rotation.x = Math.sin(this.donkeyKongAnimationTime) * 0.3;
                    rightArm.rotation.x = Math.sin(this.donkeyKongAnimationTime + Math.PI) * 0.3;
                }
            }
        }

        // Check if we should start the game
        if (!this.gameStarted && this.onGameStarted) {
            this.gameStarted = true;
            this.onGameStarted();
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
} 