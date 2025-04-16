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
        // Create background
        const loader = new THREE.TextureLoader();
        const bgTexture = loader.load('/textures/arcade-background.jpg');
        const skyGeometry = new THREE.BoxGeometry(600, 200, 400);
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: bgTexture,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        sky.position.z = this.floorLength / 2;
        this.scene.add(sky);

        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(400, this.floorLength * 2);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
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
        for (let floor = 0; floor < this.numFloors; floor++) {
            // Create main floor platform
            const floorGeometry = new THREE.BoxGeometry(this.boundaryWidth, 1, this.floorLength);
            const floorMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x8B4513,
                metalness: 0.2,
                roughness: 0.8
            });
            const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
            
            // Position floor to align with boundaries
            floorMesh.position.set(
                0,
                floor * this.floorHeight,
                this.floorLength / 2
            );
            
            this.floors.push(floorMesh);
            this.scene.add(floorMesh);

            // Create lane dividers (visual only)
            for (let lane = -1; lane <= 1; lane++) {
                if (lane === 0) continue;
                const dividerGeometry = new THREE.PlaneGeometry(0.1, this.floorLength);
                const dividerMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xFFFFFF,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7
                });
                const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
                
                divider.rotation.x = -Math.PI / 2;
                divider.position.set(
                    lane * this.laneWidth,
                    floor * this.floorHeight + 0.01,
                    this.floorLength / 2
                );
                
                this.scene.add(divider);
            }

            // Add subtle lane coloring for better visibility
            for (let lane = -1; lane <= 2; lane++) {
                const laneGeometry = new THREE.PlaneGeometry(this.laneWidth * 0.9, this.floorLength);
                const laneMaterial = new THREE.MeshPhongMaterial({
                    color: lane % 2 === 0 ? 0x8B4513 : 0x9B5523,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.3
                });
                const laneMesh = new THREE.Mesh(laneGeometry, laneMaterial);
                
                laneMesh.rotation.x = -Math.PI / 2;
                laneMesh.position.set(
                    (lane - 0.5) * this.laneWidth,
                    floor * this.floorHeight + 0.02,
                    this.floorLength / 2
                );
                
                this.scene.add(laneMesh);
            }
        }
    }

    createStairs() {
        const ladderWidth = 1.2;
        const rungSpacing = 0.4;
        const ladderDepth = 0.2;

        // Define ladder positions for each floor with much wider spacing
        const ladderPositions = [
            { floor: 0, x: 0, z: this.floorLength * 0.10 },     // First floor ladder at 10%
            { floor: 1, x: 0, z: this.floorLength * 0.95 },     // Second floor ladder at 95%
            { floor: 2, x: 0, z: this.floorLength * 0.15 },     // Third floor ladder at 15%
            { floor: 3, x: 0, z: this.floorLength * 0.85 }      // Fourth floor ladder at 85%
        ];

        for (let ladderInfo of ladderPositions) {
            const floor = ladderInfo.floor;
            const startY = floor * this.floorHeight;
            const ladderHeight = this.floorHeight;
            const numRungs = Math.floor(ladderHeight / rungSpacing);

            // Create ladder sides (vertical poles)
            const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, ladderHeight, 8);
            const poleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x8B4513,
                metalness: 0.3,
                roughness: 0.7
            });

            // Left pole
            const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
            leftPole.position.set(
                ladderInfo.x - ladderWidth/2,
                startY + ladderHeight/2,
                ladderInfo.z
            );
            this.scene.add(leftPole);

            // Right pole
            const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
            rightPole.position.set(
                ladderInfo.x + ladderWidth/2,
                startY + ladderHeight/2,
                ladderInfo.z
            );
            this.scene.add(rightPole);

            // Create rungs
            for (let i = 0; i < numRungs; i++) {
                const rungGeometry = new THREE.CylinderGeometry(0.03, 0.03, ladderWidth + 0.1, 8);
                const rungMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x8B4513,
                    metalness: 0.3,
                    roughness: 0.7
                });
                const rung = new THREE.Mesh(rungGeometry, rungMaterial);
                
                rung.rotation.z = Math.PI / 2;
                rung.position.set(
                    ladderInfo.x,
                    startY + (i + 0.5) * rungSpacing,
                    ladderInfo.z
                );
                
                this.scene.add(rung);
            }

            // Create invisible ladder collision box
            const ladderColliderGeometry = new THREE.BoxGeometry(ladderWidth, ladderHeight, ladderDepth);
            const ladderColliderMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.0
            });
            const ladderCollider = new THREE.Mesh(ladderColliderGeometry, ladderColliderMaterial);
            
            ladderCollider.position.set(
                ladderInfo.x,
                startY + ladderHeight/2,
                ladderInfo.z
            );
            
            ladderCollider.userData.isLadder = true;
            ladderCollider.userData.floorIndex = floor;
            this.scene.add(ladderCollider);
        }
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
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.2
        });
        const barrel = new THREE.Mesh(geometry, material);
        
        // Posicionar o barril no topo do nível
        barrel.position.set(0, this.floorHeight * (this.numFloors - 1) + 1, 0);
        barrel.rotation.x = Math.PI / 2; // Deitar o barril de lado
        
        barrel.userData.isBarrel = true;
        barrel.userData.velocity = new THREE.Vector3();
        
        this.scene.add(barrel);
        this.barrels.push(barrel);
        
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
        // Create the barrel with a single cylinder with more segments for smoothness
        const segments = 32;
        const radiusTop = 1.4;
        const radiusBottom = 1.4;
        const height = 4.8;  // Increased from 2.4
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
        const middleRadius = 1.9;  // Increased from 1.7
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
        
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            metalness: 0.3,
            roughness: 0.8
        });

        const barrel = new THREE.Mesh(geometry, material);

        // Position barrel at the stairs on the top floor
        const spawnY = this.floorHeight * (this.numFloors - 1) + 2.8;  // Higher spawn to ensure no clipping
        const spawnZ = this.floorLength * 0.15;
        const spawnX = (Math.random() - 0.5) * (this.boundaryWidth - 5);
        barrel.position.set(spawnX, spawnY, spawnZ);

        // Add properties for movement
        barrel.userData.floor = this.numFloors - 1;
        barrel.userData.speed = 50;
        barrel.userData.rotationSpeed = 8;
        barrel.userData.movingToBack = true;
        barrel.userData.verticalSpeed = 0;
        
        // Ensure barrel renders in front of other objects
        barrel.renderOrder = 2;
        barrel.material.depthTest = true;
        barrel.material.transparent = false;

        // Initial rotation to lay barrel on its side
        barrel.rotation.z = Math.PI / 2;

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

    clearBarrels() {
        // Remove any existing barrels from the scene
        for (let barrel of this.barrels) {
            if (barrel && barrel.parent) {
                this.scene.remove(barrel);
            }
        }
        this.barrels = [];
    }

    startBarrels() {
        console.log('Starting barrels');
        this.clearBarrels(); // Limpa quaisquer barris existentes
        this.gameStarted = true;
        this.barrelSpawnTimer = 0;
    }
} 