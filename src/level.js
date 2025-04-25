import * as THREE from 'three';

export class Level {
    constructor(scene) {
        this.scene = scene;
        
        // Estas propriedades serão inicializadas pelo Game posteriormente
        this.game = null;
        this.player = null;
        
        // Inicializações de propriedades
        this.floors = [];
        this.platforms = []; // Para colisão dos barris
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
        const platformGeometry = new THREE.BoxGeometry(14, 1.5, 12);
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
            topFloorY + 0.75,
            this.floorLength * 0.85
        );
        
        // Add collision properties
        this.donkeyKongPlatform.userData.isBoundary = true;
        this.scene.add(this.donkeyKongPlatform);

        // Criar um Donkey Kong mais parecido com a referência
        const body = new THREE.Group();
        
        // Cores mais precisas baseadas na imagem de referência
        const dkBrownColor = 0x8B5A2B; // Marrom principal do corpo
        const dkLightBrownColor = 0xD2B48C; // Cor clara para o focinho
        const dkRedColor = 0xFF0000; // Vermelho da gravata
        const dkYellowColor = 0xFFD700; // Amarelo do logo "DK"
        
        // Torso com formato mais arredondado
        const torsoGeometry = new THREE.SphereGeometry(3, 24, 18);
        torsoGeometry.scale(1.3, 1, 0.9); // Mais largo e menos profundo
        const torsoMaterial = new THREE.MeshPhongMaterial({ 
            color: dkBrownColor,
            shininess: 5
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 0;
        torso.position.z = 0;
        torso.name = 'body';
        body.add(torso);
        
        // Cabeça grande
        const headGeometry = new THREE.SphereGeometry(2.8, 24, 20);
        headGeometry.scale(1.2, 0.9, 0.8); // Ajustando proporções
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: dkBrownColor,
            shininess: 5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 4.5;
        head.position.z = 0.5;
        head.name = 'head';
        body.add(head);
        
        // Focinho grande e mais protuberante
        const snoutGeometry = new THREE.SphereGeometry(2.5, 20, 16);
        snoutGeometry.scale(1, 0.7, 0.6);
        const snoutMaterial = new THREE.MeshPhongMaterial({ color: dkLightBrownColor });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0, 4, 2);
        body.add(snout);
        
        // Boca
        const mouthGeometry = new THREE.SphereGeometry(1.8, 20, 10);
        mouthGeometry.scale(1, 0.4, 0.1);
        const mouthMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            shininess: 10
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 3, 3);
        body.add(mouth);
        
        // Olhos grandes e mais expressivos
        for (let side = -1; side <= 1; side += 2) {
            if (side === 0) continue;
            
            // Branco do olho
            const eyeGeometry = new THREE.SphereGeometry(0.8, 20, 20);
            const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(side * 1.5, 5, 2);
            body.add(eye);
            
            // Pupila
            const pupilGeometry = new THREE.SphereGeometry(0.4, 12, 12);
            const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
            pupil.position.set(side * 1.5, 5, 2.5);
            body.add(pupil);
            
            // Sobrancelha
            const browGeometry = new THREE.BoxGeometry(1, 0.3, 0.2);
            const browMaterial = new THREE.MeshPhongMaterial({ color: dkBrownColor });
            const brow = new THREE.Mesh(browGeometry, browMaterial);
            brow.position.set(side * 1.5, 5.7, 2.2);
            brow.rotation.x = Math.PI * 0.1;
            body.add(brow);
            
            // Orelha
            const earGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            earGeometry.scale(0.5, 1, 0.3);
            const earMaterial = new THREE.MeshPhongMaterial({ color: dkBrownColor });
            const ear = new THREE.Mesh(earGeometry, earMaterial);
            ear.position.set(side * 2.2, 6, 0);
            body.add(ear);
        }
        
        // Gravata vermelha com logo DK
        const tieGeometry = new THREE.BoxGeometry(1.2, 3.5, 0.3);
        const tieMaterial = new THREE.MeshPhongMaterial({
            color: dkRedColor,
            shininess: 30
        });
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.set(0, 1.5, 2.9);
        tie.rotation.x = Math.PI * 0.15;
        body.add(tie);
        
        // Logo DK na gravata
        const logoGeometry = new THREE.BoxGeometry(0.9, 1, 0.35);
        const logoMaterial = new THREE.MeshPhongMaterial({
            color: dkYellowColor,
            shininess: 50
        });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(0, 0.5, 3.1);
        logo.rotation.x = Math.PI * 0.15;
        body.add(logo);
        
        // Braços mais pesados
        for (let side = -1; side <= 1; side += 2) {
            if (side === 0) continue;
            
            // Grupo para o braço inteiro para poder animar
            const armGroup = new THREE.Group();
            armGroup.name = side === -1 ? 'leftArm' : 'rightArm';
            
            // Ombro
            const shoulderGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const shoulderMaterial = new THREE.MeshPhongMaterial({ color: dkBrownColor });
            const shoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
            armGroup.add(shoulder);
            
            // Braço
            const armGeometry = new THREE.CylinderGeometry(1.2, 1.4, 4, 12);
            const armMaterial = new THREE.MeshPhongMaterial({ color: dkBrownColor });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.y = -2.5;
            arm.rotation.z = side * 0.2;
            armGroup.add(arm);
            
            // Mão grande
            const handGeometry = new THREE.SphereGeometry(1.8, 16, 16);
            handGeometry.scale(1.2, 0.8, 0.8);
            const handMaterial = new THREE.MeshPhongMaterial({ color: dkLightBrownColor });
            const hand = new THREE.Mesh(handGeometry, handMaterial);
            hand.position.set(side * 0.8, -5, 0);
            armGroup.add(hand);
            
            // Posicionar o grupo do braço
            armGroup.position.set(side * 3.5, 2, 0);
            body.add(armGroup);
        }
        
        // Pernas curtas e fortes
        for (let side = -1; side <= 1; side += 2) {
            if (side === 0) continue;
            
            // Grupo para a perna inteira
            const legGroup = new THREE.Group();
            legGroup.name = side === -1 ? 'leftLeg' : 'rightLeg';
            
            // Coxa
            const thighGeometry = new THREE.CylinderGeometry(1.2, 1.1, 2.5, 12);
            const thighMaterial = new THREE.MeshPhongMaterial({ color: dkBrownColor });
            const thigh = new THREE.Mesh(thighGeometry, thighMaterial);
            thigh.position.y = -1;
            legGroup.add(thigh);
            
            // Pé
            const footGeometry = new THREE.BoxGeometry(2, 1, 3);
            const footMaterial = new THREE.MeshPhongMaterial({ color: dkLightBrownColor });
            const foot = new THREE.Mesh(footGeometry, footMaterial);
            foot.position.set(0, -2.5, 0.8);
            legGroup.add(foot);
            
            // Posicionar o grupo da perna
            legGroup.position.set(side * 2, -2.5, 0);
            body.add(legGroup);
        }
        
        // Posicionar o Donkey Kong completo
        body.position.set(
            0,
            topFloorY + 4.5,
            this.floorLength * 0.85
        );
        
        // Virar para frente
        body.rotation.y = Math.PI;

        this.donkeyKong = body;
        this.scene.add(this.donkeyKong);

        // Initialize throwing state
        this.isThrowingBarrel = false;
        this.throwAnimationTime = 0;

        // Adicionar temporizador para arremessar barris
        this.barrelThrowInterval = 5; // segundos entre arremessos
        this.nextBarrelThrowTime = 0; // Inicializado com 0, será atualizado no primeiro update
        this.barrels = []; // array para armazenar os barris
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
            color: 0xA05010,  // Marrom mais terroso para o barril
            specular: 0x222222,
            shininess: 15
        });

        const barrel = new THREE.Mesh(geometry, material);

        // Position barrel at the stairs on the top floor
        const spawnY = this.floorHeight * (this.numFloors - 1) + 3;
        const spawnZ = this.floorLength * 0.15;
        const spawnX = (Math.random() - 0.5) * (this.boundaryWidth - 5);
        barrel.position.set(spawnX, spawnY, spawnZ);

        // Add properties for movement
        barrel.userData.floor = this.numFloors - 1;
        barrel.userData.speed = 70; // Velocidade mantida alta para gameplay
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
        // Adicionar detalhes visuais ao barril - aros metálicos mais nítidos
        const ringGeometry = new THREE.TorusGeometry(1.25, 0.1, 8, 24);
        const ringMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Criar aros metálicos em posições espaçadas uniformemente
        const positions = [-0.9, -0.3, 0.3, 0.9]; // Quatro aros ao longo do barril
        positions.forEach(pos => {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(0, pos, 0);
            ring.rotation.x = Math.PI / 2; // Alinhar com o barril
            barrel.add(ring);
        });
        
        return barrel;
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
        // Usar o mesmo método de criar barril
        this.createBarrel();
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
} 