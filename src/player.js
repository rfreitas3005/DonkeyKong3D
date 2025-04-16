import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.tempMesh = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.moveSpeed = 0.08;
        this.climbSpeed = 0.06;
        this.jumpForce = 0.35;
        this.gravity = 0.008;
        this.velocity = new THREE.Vector3();
        this.isJumping = false;
        this.currentFloor = 0;
        this.floorHeight = 16;
        this.onLadder = false;
        this.movementDirection = new THREE.Vector3();
        this.isLoaded = false;
        this.floorLength = 200;
        this.laneWidth = 6;

        // Camera control variables
        this.cameraOffset = new THREE.Vector3(0, 3, 6);
        this.cameraRotation = new THREE.Euler(0, 0, 0);
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;

        this.setupControls();
        this.init();
    }

    async init() {
        // Only create temporary mesh if we haven't loaded the model yet
        if (!this.isLoaded) {
            const geometry = new THREE.BoxGeometry(0.6, 1.5, 0.4); // Match collision size
            const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            this.tempMesh = new THREE.Mesh(geometry, material);
            
            // Start at the beginning of the path
            this.tempMesh.position.set(0, 1.25, this.floorLength * 0.95);
            this.scene.add(this.tempMesh);
            this.mesh = this.tempMesh;

            // Create collision box
            this.collider = new THREE.Box3();

            // Load character model
            await this.loadCharacterModel();
        }
    }

    async loadCharacterModel() {
        if (this.isLoaded) return; // Prevent multiple loads

        const loader = new FBXLoader();
        
        try {
            const model = await loader.loadAsync('/models/character.fbx');
            
            // Configure the model
            model.scale.setScalar(0.01);
            model.position.copy(this.tempMesh.position);
            model.rotation.copy(this.tempMesh.rotation);
            
            // Clean up temporary mesh
            if (this.tempMesh && this.tempMesh.parent) {
                this.scene.remove(this.tempMesh);
                this.tempMesh.geometry.dispose();
                this.tempMesh.material.dispose();
                this.tempMesh = null;
            }

            // Set up the new model
            this.mesh = model;
            this.scene.add(this.mesh);
            this.isLoaded = true;

            // Setup animations
            if (model.animations && model.animations.length) {
                this.mixer = new THREE.AnimationMixer(model);
                model.animations.forEach(clip => {
                    const action = this.mixer.clipAction(clip);
                    this.animations[clip.name] = action;
                });
                
                if (this.animations['idle']) {
                    this.playAnimation('idle');
                }
            }
        } catch (error) {
            console.error('Error loading character model:', error);
        }
    }

    playAnimation(name) {
        if (this.currentAnimation) {
            this.currentAnimation.fadeOut(0.5);
        }
        
        const newAnimation = this.animations[name];
        if (newAnimation) {
            newAnimation.reset().fadeIn(0.5).play();
            this.currentAnimation = newAnimation;
        }
    }

    setupControls() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false
        };

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse controls
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.cameraRotation.y -= e.movementX * this.mouseSensitivity;
                this.cameraRotation.x -= e.movementY * this.mouseSensitivity;
                
                // Clamp vertical rotation to prevent over-rotation
                this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));
            }
        });
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'a':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'd':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'w':
            case 'ArrowUp':
                this.keys.up = true;
                break;
            case 's':
            case 'ArrowDown':
                this.keys.down = true;
                break;
            case ' ':
                if (!this.isJumping) {
                    this.velocity.y = this.jumpForce;
                    this.isJumping = true;
                    if (this.animations['jump']) {
                        this.playAnimation('jump');
                    }
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'a':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'd':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'w':
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 's':
            case 'ArrowDown':
                this.keys.down = false;
                break;
        }

        if (!this.isJumping && !this.isMoving() && this.animations['idle']) {
            this.playAnimation('idle');
        }
    }

    isMoving() {
        return this.keys.up || this.keys.down || this.keys.left || this.keys.right;
    }

    updateMovement() {
        this.movementDirection.set(0, 0, 0);

        // Get camera's forward direction (ignoring vertical rotation)
        const cameraForward = new THREE.Vector3(0, 0, -1);
        cameraForward.applyQuaternion(this.camera.quaternion);
        cameraForward.y = 0;
        cameraForward.normalize();

        // Get camera's right direction
        const cameraRight = new THREE.Vector3(1, 0, 0);
        cameraRight.applyQuaternion(this.camera.quaternion);
        cameraRight.y = 0;
        cameraRight.normalize();

        if (this.keys.up) this.movementDirection.add(cameraForward);
        if (this.keys.down) this.movementDirection.sub(cameraForward);
        if (this.keys.right) this.movementDirection.add(cameraRight);
        if (this.keys.left) this.movementDirection.sub(cameraRight);

        if (this.movementDirection.length() > 0) {
            this.movementDirection.normalize();
            
            // Store previous position
            const previousPosition = this.mesh.position.clone();

            // Apply movement
            this.mesh.position.x += this.movementDirection.x * this.moveSpeed;
            this.mesh.position.z += this.movementDirection.z * this.moveSpeed;

            // Rotate player to face movement direction
            const targetRotation = Math.atan2(this.movementDirection.x, this.movementDirection.z);
            this.mesh.rotation.y = targetRotation;

            // Check for collisions
            if (this.checkCollisions()) {
                this.mesh.position.copy(previousPosition);
            }

            if (!this.isJumping && this.animations['run']) {
                this.playAnimation('run');
            }
        } else if (!this.isJumping && this.animations['idle']) {
            this.playAnimation('idle');
        }
    }

    update(deltaTime) {
        // Update animation mixer with even slower animations during jumps
        if (this.mixer) {
            const animSpeed = this.isJumping ? 0.6 : 0.8;
            this.mixer.update(deltaTime * animSpeed);
        }

        // Store previous position for collision detection
        const previousPosition = this.mesh.position.clone();

        // Check if we're on a ladder
        const ladderCheck = this.checkLadderCollision(this.mesh.position);
        const wasOnLadder = this.onLadder;
        
        if (ladderCheck.isOnLadder && !this.onLadder && 
            (this.keys.up || this.keys.down)) {
            this.onLadder = true;
            this.velocity.y = 0;
            this.isJumping = false;
        } else {
            this.onLadder = ladderCheck.isOnLadder;
        }

        if (this.onLadder) {
            // Disable gravity while on ladder
            this.velocity.y = 0;
            this.isJumping = false;

            let moved = false;

            // Vertical movement on ladder with improved speed control
            if (this.keys.up) {
                this.mesh.position.y += this.climbSpeed * 1.2;
                moved = true;
                if (this.animations['climb']) {
                    this.playAnimation('climb');
                }
            } else if (this.keys.down) {
                this.mesh.position.y -= this.climbSpeed * 1.2;
                moved = true;
                if (this.animations['climb']) {
                    this.playAnimation('climb');
                }
            }

            // Check if we're still on the ladder after moving
            const newLadderCheck = this.checkLadderCollision(this.mesh.position);
            if (!newLadderCheck.isOnLadder) {
                // Allow a small grace period at the top of the ladder
                const floorY = Math.floor(this.mesh.position.y / this.floorHeight) * this.floorHeight + 1.25;
                if (Math.abs(this.mesh.position.y - floorY) > 0.5) {
                    this.mesh.position.copy(previousPosition);
                    this.onLadder = true;
                } else {
                    this.onLadder = false;
                }
            }

            // Allow jumping off the ladder
            if (this.keys.space) {
                this.onLadder = false;
                this.velocity.y = this.jumpForce * 0.8;
                this.isJumping = true;
                if (this.animations['jump']) {
                    this.playAnimation('jump');
                }
            }

            // Restrict horizontal movement while on ladder
            if (this.keys.left || this.keys.right) {
                // Allow getting off the ladder by moving horizontally
                const stepOff = 0.8;
                const newPosition = this.mesh.position.clone();
                newPosition.x += (this.keys.left ? -stepOff : stepOff);
                
                // Check if we can step off safely
                const floorY = Math.floor(this.mesh.position.y / this.floorHeight) * this.floorHeight + 1.25;
                if (Math.abs(this.mesh.position.y - floorY) < 0.5) {
                    this.mesh.position.copy(newPosition);
                    this.onLadder = false;
                }
            }

            if (!moved && this.animations['climbIdle']) {
                this.playAnimation('climbIdle');
            }
        } else {
            // Normal movement when not on ladder
            this.updateMovement();

            // Apply gravity with even smoother acceleration
            if (this.isJumping) {
                // Slower gravity at the peak of the jump
                const peakHeight = 0.2; // Velocity near the peak
                if (Math.abs(this.velocity.y) < peakHeight) {
                    this.velocity.y -= this.gravity * 0.7;
                } else {
                    this.velocity.y -= this.gravity;
                }
            } else {
                this.velocity.y -= this.gravity * 1.3; // Slightly faster fall when not jumping
            }
            
            this.mesh.position.y += this.velocity.y;

            // Ground collision
            const floorY = this.currentFloor * this.floorHeight + 1.25;
            if (this.mesh.position.y < floorY) {
                this.mesh.position.y = floorY;
                this.velocity.y = 0;
                this.isJumping = false;
                
                // Only switch to idle/run animation when actually landing
                if (this.isMoving() && this.animations['run']) {
                    this.playAnimation('run');
                } else if (this.animations['idle']) {
                    this.playAnimation('idle');
                }
            }
        }

        // Update current floor based on height
        this.currentFloor = Math.floor(this.mesh.position.y / this.floorHeight);

        // Update camera
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        // Calculate camera rotation based on mouse input
        const rotation = new THREE.Euler(
            this.cameraRotation.x,
            this.cameraRotation.y,
            0,
            'YXZ'
        );

        // Calculate camera position with adjusted offset
        const offset = new THREE.Vector3(
            0,
            this.cameraOffset.y,
            this.cameraOffset.z
        );
        offset.applyEuler(rotation);
        
        // Set camera position and rotation
        this.camera.position.copy(this.mesh.position).add(offset);
        this.camera.rotation.copy(rotation);

        // Add a slightly stronger tilt to the camera to see the path ahead better
        this.camera.rotation.x -= 0.2;
    }

    checkCollisions() {
        // Create a more precise collision box for general collisions
        const collisionSize = new THREE.Vector3(0.6, 1.5, 0.4);
        const collisionCenter = this.mesh.position.clone();
        collisionCenter.y += collisionSize.y / 2;
        
        this.collider = new THREE.Box3();
        this.collider.setFromCenterAndSize(collisionCenter, collisionSize);

        // Check for boundary collisions
        const collisions = [];
        this.scene.children.forEach(child => {
            if (child.userData.isBoundary) {
                const boundaryBox = new THREE.Box3().setFromObject(child);
                if (this.collider.intersectsBox(boundaryBox)) {
                    collisions.push(child);
                }
            }
        });

        return collisions.length > 0;
    }

    checkLadderCollision(position) {
        // Create a narrower collision box for more precise ladder detection
        const ladderCollider = new THREE.Box3();
        const playerSize = new THREE.Vector3(0.6, 2, 0.4); // Narrower and thinner hitbox
        ladderCollider.setFromCenterAndSize(position, playerSize);

        let isOnLadder = false;
        let floorIndex = -1;

        this.scene.children.forEach(child => {
            if (child.userData.isLadder) {
                const ladderBox = new THREE.Box3().setFromObject(child);
                if (ladderCollider.intersectsBox(ladderBox)) {
                    isOnLadder = true;
                    floorIndex = child.userData.floorIndex;
                }
            }
        });

        return { isOnLadder, floorIndex };
    }

    onDeath() {
        // Reset player position
        this.mesh.position.set(this.startX, this.startY, 0);
        
        // Reset movement state
        this.velocity.set(0, 0, 0);
        this.isJumping = false;
        this.isClimbing = false;
        
        // Trigger game over or life loss
        if (this.onPlayerDeath) {
            this.onPlayerDeath();
        }
    }
} 