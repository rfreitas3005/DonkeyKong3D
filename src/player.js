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
        this.idleTimer = 0;
        this.idleDelay = 10; // 10 seconds delay before main idle animation
        this.isJumping = false;
        
        // Reduced movement speeds
        this.moveSpeed = 0.04;
        this.climbSpeed = 0.025;
        this.jumpForce = 0.15;
        this.gravity = 0.004;
        
        this.velocity = new THREE.Vector3();
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
        // Create a temporary simple box as placeholder while model loads
        const tempGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.3);
        const tempMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0
        });
        this.tempMesh = new THREE.Mesh(tempGeometry, tempMaterial);
        this.tempMesh.position.set(0, 1.25, this.floorLength * 0.95);
        this.scene.add(this.tempMesh);
        this.mesh = this.tempMesh;

        // Create collision box
        this.collider = new THREE.Box3();

        // Load the actual character model
        await this.loadCharacterModel();
    }

    async loadCharacterModel() {
        if (this.isLoaded) return; // Prevent multiple loads

        const loader = new FBXLoader();
        
        try {
            // Load the base character model first
            const model = await loader.loadAsync('./models/skin.fbx');
            
            // Configure the model
            model.scale.setScalar(0.013);
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

            // Create animation mixer
            this.mixer = new THREE.AnimationMixer(model);

            // Load all animations
            const animations = {
                'idle': './models/idle.fbx',
                'idle2': './models/idle2.fbx',
                'run': './models/run.fbx',
                'jump': './models/jump.fbx'
            };

            // Load each animation
            for (const [name, path] of Object.entries(animations)) {
                try {
                    const animFile = await loader.loadAsync(path);
                    
                    if (!animFile.animations || animFile.animations.length === 0) {
                        continue;
                    }

                    // Get the animation and retarget it to our model
                    const anim = animFile.animations[0];
                    const action = this.mixer.clipAction(anim);
                    this.animations[name] = action;
                    
                    // Remove any additional meshes that might have been loaded
                    animFile.traverse(child => {
                        if (child.isMesh) {
                            child.removeFromParent();
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(m => m.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error(`Error loading animation ${name}:`, error);
                }
            }

            // Start with idle animation
            if (this.animations['idle2']) {
                this.playAnimation('idle2');
            }

        } catch (error) {
            console.error('Error loading character model:', error);
            if (this.tempMesh) {
                this.tempMesh.material.opacity = 0;
                this.mesh = this.tempMesh;
            }
        }
    }

    playAnimation(name, force = false) {
        if (!this.mixer || !this.animations[name]) return;
        
        // If it's the same animation and we're not forcing it, don't restart
        if (this.currentAnimation === name && !force) return;
        
        if (this.currentAnimation) {
            const current = this.animations[this.currentAnimation];
            const next = this.animations[name];
            
            if (current !== next) {
                // Crossfade to the new animation
                current.fadeOut(0.2);
                next.reset().fadeIn(0.2).play();
                this.currentAnimation = name;
            }
        } else {
            this.animations[name].reset().play();
            this.currentAnimation = name;
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
        
        // Mouse movement handler
        const onMouseMove = (event) => {
            if (document.pointerLockElement === document.body) {
                this.camera.rotation.y -= event.movementX * this.mouseSensitivity;
                this.camera.rotation.x -= event.movementY * this.mouseSensitivity;
                
                // Limit vertical rotation to prevent over-rotation
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
            }
        };

        // Pointer lock change handler
        const onPointerLockChange = () => {
            if (document.pointerLockElement === document.body) {
                document.addEventListener('mousemove', onMouseMove, false);
            } else {
                document.removeEventListener('mousemove', onMouseMove, false);
            }
        };

        document.addEventListener('pointerlockchange', onPointerLockChange, false);
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
        // If mesh isn't loaded yet, don't try to update movement
        if (!this.mesh) return;

        // If jumping, don't process other movements
        if (this.isJumping) return;

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

            // Reset idle timer and play run animation only if not jumping
            this.idleTimer = 0;
            if (!this.isJumping && this.animations['run']) {
                this.playAnimation('run');
            }
        }
    }

    update(deltaTime) {
        // If mesh isn't loaded yet, don't try to update
        if (!this.mesh) return;

        // Update animation mixer
        if (this.mixer) {
            const animSpeed = this.isJumping ? 0.6 : 0.8;
            this.mixer.update(deltaTime * animSpeed);
        }

        // Update idle timer if player is not moving and not jumping and not on ladder
        if (!this.isMoving() && !this.onLadder) {
            this.idleTimer += deltaTime;
            
            // If we've been still for 10 seconds, play main idle animation
            if (this.idleTimer >= this.idleDelay) {
                if (this.animations['idle']) {
                    this.playAnimation('idle');
                }
            } else {
                // Use idle2 as default idle animation
                if (this.animations['idle2'] && this.currentAnimation !== 'idle2') {
                    this.playAnimation('idle2');
                }
            }
        } else {
            // Reset idle timer when moving
            this.idleTimer = 0;
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
            // Handle ladder movement
            this.handleLadderMovement(previousPosition);
        } else {
            // Normal movement when not on ladder
            this.updateMovement();

            // Apply gravity
            this.applyGravity();
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

    handleLadderMovement(previousPosition) {
        // Disable gravity while on ladder
        this.velocity.y = 0;
        this.isJumping = false;

        let moved = false;

        // Rotate player to face forward when on ladder
        const targetRotation = Math.PI; // Face forward
        this.mesh.rotation.y = targetRotation;

        // Adjust position relative to ladder
        const ladderOffset = 0.4; // Distance from ladder
        this.mesh.position.z = Math.round(this.mesh.position.z); // Snap to nearest integer Z position
        this.mesh.position.x = 0.4; // Slight offset to the right of ladder center

        // Stop any current animations when on ladder
        if (this.currentAnimation) {
            const current = this.animations[this.currentAnimation];
            current.stop();
            this.currentAnimation = null;
        }

        // Vertical movement on ladder with reduced speed
        if (this.keys.up) {
            this.mesh.position.y += this.climbSpeed;
            moved = true;
        } else if (this.keys.down) {
            this.mesh.position.y -= this.climbSpeed;
            moved = true;
        }

        // Check if we're still on the ladder
        const newLadderCheck = this.checkLadderCollision(this.mesh.position);
        if (!newLadderCheck.isOnLadder) {
            const floorY = Math.floor(this.mesh.position.y / this.floorHeight) * this.floorHeight + 1.25;
            if (Math.abs(this.mesh.position.y - floorY) > 0.5) {
                this.mesh.position.copy(previousPosition);
                this.onLadder = true;
            } else {
                this.onLadder = false;
                if (this.animations['idle']) {
                    this.playAnimation('idle');
                }
            }
        }

        // Handle jumping off ladder with reduced force
        if (this.keys.space) {
            this.onLadder = false;
            this.velocity.y = this.jumpForce * 0.6;
            this.isJumping = true;
            if (this.animations['jump']) {
                this.playAnimation('jump');
            }
        }

        // Handle horizontal movement with reduced step off
        if (this.keys.left || this.keys.right) {
            const stepOff = 0.4;
            const newPosition = this.mesh.position.clone();
            newPosition.x += (this.keys.left ? -stepOff : stepOff);
            
            const floorY = Math.floor(this.mesh.position.y / this.floorHeight) * this.floorHeight + 1.25;
            if (Math.abs(this.mesh.position.y - floorY) < 0.5) {
                this.mesh.position.copy(newPosition);
                this.onLadder = false;
                if (this.animations['idle']) {
                    this.playAnimation('idle');
                }
            }
        }
    }

    applyGravity() {
        if (this.isJumping) {
            // Slower gravity at the peak of the jump
            const peakHeight = 0.1;
            if (Math.abs(this.velocity.y) < peakHeight) {
                this.velocity.y -= this.gravity * 0.5;
            } else {
                this.velocity.y -= this.gravity;
            }
        } else {
            this.velocity.y -= this.gravity * 1.1;
        }
        
        this.mesh.position.y += this.velocity.y;

        // Ground collision
        const floorY = this.currentFloor * this.floorHeight + 1.25;
        if (this.mesh.position.y < floorY) {
            this.mesh.position.y = floorY;
            this.velocity.y = 0;
            this.isJumping = false;
            
            // When landing, check if moving to play run animation, otherwise use idle2
            if (this.isMoving() && this.animations['run']) {
                this.playAnimation('run');
            } else if (this.animations['idle2']) {
                this.playAnimation('idle2');
            }
        }
    }

    // Add new method to enable controls
    enableControls() {
        if (!document.pointerLockElement) {
            document.body.requestPointerLock();
        }
    }

    // Add new method to disable controls
    disableControls() {
        if (document.pointerLockElement === document.body) {
            document.exitPointerLock();
        }
    }
} 