import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.orthographicCamera = null;
        this.currentCamera = 'perspective';
        this.mesh = null;
        this.tempMesh = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.idleTimer = 0;
        this.idleDelay = 10;
        this.isJumping = false;
        this.lastJumpTime = 0;
        this.jumpCooldown = 1.0;
        this.controlsEnabled = true;
        
        // Camera settings
        this.moveSpeed = 0.075;
        this.turnSpeed = 2.0;
        this.jumpForce = 0.35;
        this.gravity = 0.018;
        this.verticalSpeed = 0;
        this.climbSpeed = 0.04;
        
        this.velocity = new THREE.Vector3();
        this.currentFloor = 0;
        this.floorHeight = 50; // Aumentado de 16 para 50
        this.onLadder = false;
        this.movementDirection = new THREE.Vector3();
        this.isLoaded = false;
        this.floorLength = 200;
        this.laneWidth = 6;
        this.enabled = false;

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

    retargetAnimation(clip, targetSkeleton) {
        // Map of common bone names
        const boneMap = {
            'mixamorig:hips': 'Hips',
            'mixamorig:spine': 'Spine',
            'mixamorig:spine1': 'Spine1',
            'mixamorig:spine2': 'Spine2',
            'mixamorig:neck': 'Neck',
            'mixamorig:head': 'Head',
            'mixamorig:leftupperarm': 'LeftArm',
            'mixamorig:leftforearm': 'LeftForeArm',
            'mixamorig:lefthand': 'LeftHand',
            'mixamorig:rightupperarm': 'RightArm',
            'mixamorig:rightforearm': 'RightForeArm',
            'mixamorig:righthand': 'RightHand',
            'mixamorig:leftupperleg': 'LeftUpLeg',
            'mixamorig:leftleg': 'LeftLeg',
            'mixamorig:leftfoot': 'LeftFoot',
            'mixamorig:rightupperleg': 'RightUpLeg',
            'mixamorig:rightleg': 'RightLeg',
            'mixamorig:rightfoot': 'RightFoot'
        };

        const retargetedTracks = [];

        clip.tracks.forEach(track => {
            const trackSplit = track.name.split('.');
            const boneName = trackSplit[0].toLowerCase();
            const property = trackSplit[1];

            // Try to find matching bone name
            let targetBoneName = null;
            
            // First try direct match
            targetSkeleton.traverse(bone => {
                if (bone.isBone && bone.name.toLowerCase() === boneName) {
                    targetBoneName = bone.name;
                }
            });

            // If no direct match, try mapped name
            if (!targetBoneName) {
                for (const [source, target] of Object.entries(boneMap)) {
                    if (boneName.includes(source.toLowerCase())) {
                        targetSkeleton.traverse(bone => {
                            if (bone.isBone && bone.name.includes(target)) {
                                targetBoneName = bone.name;
                            }
                        });
                        break;
                    }
                }
            }

            if (targetBoneName) {
                // Clone the track and update the bone name
                const newTrack = track.clone();
                newTrack.name = `${targetBoneName}.${property}`;
                retargetedTracks.push(newTrack);
            }
        });

        // Create new animation clip with retargeted tracks
        return new THREE.AnimationClip(
            clip.name,
            clip.duration,
            retargetedTracks
        );
    }

    async loadCharacterModel() {
        if (this.isLoaded) return;

        const loader = new FBXLoader();
        
        try {
            console.log('Carregando modelo do jogador...');
            // Load the base character model first
            const model = await loader.loadAsync('./models/skin.fbx');
            
            // Configure the model
            model.scale.setScalar(0.013);
            model.position.copy(this.tempMesh.position);
            model.rotation.copy(this.tempMesh.rotation);
            
            // Garantir que o modelo é visível e configurar sombras
            model.visible = true;
            model.castShadow = true;
            model.receiveShadow = true;
            
            // Log skeleton structure
            console.log('Character skeleton structure:');
            model.traverse(bone => {
                if (bone.isBone) {
                    console.log(`Found bone: ${bone.name}`);
                }
                if (bone.isMesh) {
                    bone.castShadow = true;
                    bone.receiveShadow = true;
                    
                    // Melhorar materiais para sombras mais realistas
                    if (bone.material) {
                        if (Array.isArray(bone.material)) {
                            bone.material.forEach(m => {
                                m.shadowSide = THREE.FrontSide;
                                m.needsUpdate = true;
                            });
                        } else {
                            bone.material.shadowSide = THREE.FrontSide;
                            bone.material.needsUpdate = true;
                        }
                    }
                }
            });

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
            console.log('Modelo do jogador adicionado à cena');
            this.isLoaded = true;

            // Create animation mixer
            this.mixer = new THREE.AnimationMixer(model);

            // Load all animations
            const animations = {
                'idle': './models/idle.fbx',
                'idle2': './models/idle2.fbx',
                'run': './models/run.fbx',
                'jump': './models/jump.fbx',
                'death': './models/death.fbx'
            };

            // Load each animation
            for (const [name, path] of Object.entries(animations)) {
                try {
                    console.log(`Loading animation: ${name} from path: ${path}`);
                    const animFile = await loader.loadAsync(path);
                    
                    if (!animFile.animations || animFile.animations.length === 0) {
                        console.error(`No animations found in ${name} file at ${path}`);
                        continue;
                    }

                    // Get the original animation clip
                    const originalClip = animFile.animations[0];
                    
                    // Retarget the animation
                    const retargetedClip = this.retargetAnimation(originalClip, model);
                    
                    // Create the animation action
                    const action = this.mixer.clipAction(retargetedClip);
                    
                    // Configure death animation
                    if (name === 'death') {
                        console.log('Configuring death animation');
                        action.loop = THREE.LoopOnce;
                        action.clampWhenFinished = true;
                        action.repetitions = 1;
                        
                        // Log the retargeted bones
                        console.log('Death animation retargeted to bones:', 
                            retargetedClip.tracks.map(track => track.name));
                    }
                    
                    this.animations[name] = action;
                    console.log(`Animation ${name} successfully retargeted and ready`);
                    
                } catch (error) {
                    console.error(`Error loading animation ${name}:`, error);
                }
            }

            // Start with idle animation
            if (this.animations['idle2']) {
                this.playAnimation('idle2');
            }

            // Forçar uma atualização do render
            if (this.scene && this.scene.parent && this.scene.parent.renderer) {
                this.scene.parent.renderer.render(this.scene, this.camera);
            }

        } catch (error) {
            console.error('Error loading character model:', error);
            if (this.tempMesh) {
                this.tempMesh.material.opacity = 1.0;
                this.tempMesh.material.color.set(0xFF0000);
                this.mesh = this.tempMesh;
                this.isLoaded = true;
            }
        }
    }

    playAnimation(name, force = false) {
        console.log(`Attempting to play animation: ${name}, force: ${force}`);
        
        if (!this.mixer) {
            console.error('No animation mixer available');
            return;
        }
        
        if (!this.animations[name]) {
            console.error(`Animation ${name} not found in available animations:`, Object.keys(this.animations));
            return;
        }
        
        // If we're currently playing death animation, don't interrupt it unless forced
        if (this.currentAnimation === 'death' && !force) {
            console.log('Death animation in progress, not interrupting');
            return;
        }
        
        // If it's the same animation and we're not forcing it, don't restart
        if (this.currentAnimation === name && !force) {
            console.log(`Animation ${name} already playing`);
            return;
        }
        
        console.log(`Playing animation: ${name}`);
        
        // Special handling for death animation
        if (name === 'death') {
            console.log('Initializing death animation sequence');
            // Stop all current animations immediately
            this.mixer.stopAllAction();
            
            const deathAnim = this.animations[name];
            // Configure death animation
            deathAnim.setLoop(THREE.LoopOnce);
            deathAnim.clampWhenFinished = true;
            deathAnim.setEffectiveTimeScale(1.0);
            deathAnim.setEffectiveWeight(1.0);
            deathAnim.reset();
            deathAnim.play();
            
            // Add event listener for animation completion
            this.mixer.addEventListener('finished', (e) => {
                if (e.action === deathAnim) {
                    console.log('Death animation completed');
                }
            });
            
            this.currentAnimation = name;
            return;
        }
        
        // Normal animation handling
        if (this.currentAnimation) {
            const current = this.animations[this.currentAnimation];
            const next = this.animations[name];
            
            if (current !== next) {
                const fadeTime = name === 'jump' ? 0.1 : 0.2;
                current.fadeOut(fadeTime);
                next.reset().fadeIn(fadeTime).play();
                
                if (name === 'jump') {
                    next.setEffectiveTimeScale(1.0);
                }
            }
        } else {
            this.animations[name].reset().play();
            if (name === 'jump') {
                this.animations[name].setEffectiveTimeScale(1.0);
            }
        }
        
        this.currentAnimation = name;
    }

    setupControls() {
        console.log('Setting up player controls...');
        
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            switchCamera: false
        };

        // Remover handlers antigos se existirem
        if (this._keyDownHandler) {
            document.removeEventListener('keydown', this._keyDownHandler);
        }
        if (this._keyUpHandler) {
            document.removeEventListener('keyup', this._keyUpHandler);
        }

        // Criar novos handlers e armazenar as referências
        this._keyDownHandler = (e) => this.onKeyDown(e);
        this._keyUpHandler = (e) => this.onKeyUp(e);

        // Adicionar os novos handlers
        document.addEventListener('keydown', this._keyDownHandler);
        document.addEventListener('keyup', this._keyUpHandler);
        console.log('Keyboard handlers registered');
        
        // Mouse movement handler
        const onMouseMove = (event) => {
            if (document.pointerLockElement === document.body) {
                this.cameraRotation.y -= event.movementX * this.mouseSensitivity;
                this.cameraRotation.x -= event.movementY * this.mouseSensitivity;
                
                // Limit vertical rotation to prevent over-rotation
                this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));
            }
        };

        // Pointer lock change handler
        const onPointerLockChange = () => {
            if (document.pointerLockElement === document.body) {
                document.addEventListener('mousemove', onMouseMove, false);
                this.isPointerLocked = true;
                console.log('Pointer lock acquired');
            } else {
                document.removeEventListener('mousemove', onMouseMove, false);
                this.isPointerLocked = false;
                console.log('Pointer lock lost');
                
                // Se o jogo ainda estiver em execução e o jogador habilitado, 
                // exibir mensagem para reclique
                if (this.enabled) {
                    this.enableControls();
                }
            }
        };

        // Pointer lock error handler
        const onPointerLockError = (event) => {
            console.error('Pointer lock error:', event);
            alert('Seu navegador não permitiu o controle do mouse. Clique na tela novamente ou verifique as permissões do site.');
            
            // Exibir instrução novamente
            this.enableControls();
        };

        // Remover handlers antigos de pointer lock
        document.removeEventListener('pointerlockchange', this._pointerLockChangeHandler);
        document.removeEventListener('pointerlockerror', this._pointerLockErrorHandler);

        // Armazenar referências e adicionar novos handlers
        this._pointerLockChangeHandler = onPointerLockChange;
        this._pointerLockErrorHandler = onPointerLockError;
        
        document.addEventListener('pointerlockchange', this._pointerLockChangeHandler, false);
        document.addEventListener('pointerlockerror', this._pointerLockErrorHandler, false);
        
        console.log('Player controls setup complete');
    }

    onKeyDown(event) {
        if (!this.controlsEnabled) {
            return;
        }

        switch (event.code) {
            case 'KeyV':
                console.log('V key pressed - changing camera view');
                if (this.currentCamera === 'perspective') {
                    // Store current camera position and rotation
                    this.savedCameraState = {
                        position: this.camera.position.clone(),
                        rotation: this.camera.rotation.clone()
                    };
                    
                    // Switch to top-down view
                    this.currentCamera = '2d';
                    
                    // Position camera high above player
                    this.camera.position.set(
                        this.mesh.position.x,
                        200,
                        this.mesh.position.z
                    );
                    
                    // Point camera straight down
                    this.camera.rotation.x = -Math.PI / 2;
                    this.camera.rotation.y = 0;
                    this.camera.rotation.z = 0;
                    
                    console.log('Switched to top-down view');
                } else {
                    // Switch back to normal view
                    this.currentCamera = 'perspective';
                    
                    // Restore saved camera state
                    if (this.savedCameraState) {
                        this.camera.position.copy(this.savedCameraState.position);
                        this.camera.rotation.copy(this.savedCameraState.rotation);
                    }
                    
                    console.log('Switched back to normal view');
                }
                break;
                
            case 'KeyG':
                // Teletransportar para o último andar (onde está o DK)
                if (this.mesh) {
                    // Calcular a altura do último andar
                    const lastFloorY = (3) * this.floorHeight; // 3 é o índice do último andar (total de 4 andares, 0-3)
                    
                    // Posicionar o jogador
                    this.mesh.position.y = lastFloorY + 1; // +1 para ficar em cima do chão
                    this.mesh.position.z = this.floorLength * 0.85; // Mesma posição Z do DK
                    this.mesh.position.x = 0; // Centralizar na plataforma
                    
                    // Resetar física
                    this.velocity.y = 0;
                    this.isJumping = false;
                    this.currentFloor = 3; // Atualizar o andar atual
                    
                    console.log('Teleported to Donkey Kong floor');
                }
                break;
            case 'KeyA':
            case 'ArrowLeft':
                console.log('LEFT key pressed');
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                console.log('RIGHT key pressed');
                this.keys.right = true;
                break;
            case 'KeyW':
            case 'ArrowUp':
                console.log('UP key pressed');
                this.keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                console.log('DOWN key pressed');
                this.keys.down = true;
                break;
            case 'Space':
                console.log('JUMP key pressed');
                const currentTime = performance.now() / 1000; // Convert to seconds
                if (!this.isJumping && (currentTime - this.lastJumpTime) >= this.jumpCooldown) {
                    this.velocity.y = this.jumpForce;
                    this.isJumping = true;
                    this.lastJumpTime = currentTime;
                    if (this.animations['jump']) {
                        this.playAnimation('jump');
                    }
                }
                break;
            default:
                // Verificação alternativa para maior compatibilidade
                if (event.key === 'a' || event.key === 'A' || event.keyCode === 65 || event.keyCode === 37) { // A ou seta esquerda
                    console.log('LEFT key detected via alternative method');
                    this.keys.left = true;
                } else if (event.key === 'd' || event.key === 'D' || event.keyCode === 68 || event.keyCode === 39) { // D ou seta direita
                    console.log('RIGHT key detected via alternative method');
                    this.keys.right = true;
                } else if (event.key === 'w' || event.key === 'W' || event.keyCode === 87 || event.keyCode === 38) { // W ou seta para cima
                    console.log('UP key detected via alternative method');
                    this.keys.up = true;
                } else if (event.key === 's' || event.key === 'S' || event.keyCode === 83 || event.keyCode === 40) { // S ou seta para baixo
                    console.log('DOWN key detected via alternative method');
                    this.keys.down = true;
                } else if (event.key === ' ' || event.keyCode === 32) { // Espaço
                    console.log('JUMP key detected via alternative method');
                    const currentTime = performance.now() / 1000;
                    if (!this.isJumping && (currentTime - this.lastJumpTime) >= this.jumpCooldown) {
                        this.velocity.y = this.jumpForce;
                        this.isJumping = true;
                        this.lastJumpTime = currentTime;
                        if (this.animations['jump']) {
                            this.playAnimation('jump');
                        }
                    }
                }
                break;
        }
    }

    onKeyUp(event) {
        if (!this.controlsEnabled) {
            return;
        }

        switch (event.code) {
            case 'KeyA':
            case 'ArrowLeft':
                console.log('LEFT key released');
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                console.log('RIGHT key released');
                this.keys.right = false;
                break;
            case 'KeyW':
            case 'ArrowUp':
                console.log('UP key released');
                this.keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                console.log('DOWN key released');
                this.keys.down = false;
                break;
            default:
                // Verificação alternativa para maior compatibilidade
                if (event.key === 'a' || event.key === 'A' || event.keyCode === 65 || event.keyCode === 37) {
                    this.keys.left = false;
                } else if (event.key === 'd' || event.key === 'D' || event.keyCode === 68 || event.keyCode === 39) {
                    this.keys.right = false;
                } else if (event.key === 'w' || event.key === 'W' || event.keyCode === 87 || event.keyCode === 38) {
                    this.keys.up = false;
                } else if (event.key === 's' || event.key === 'S' || event.keyCode === 83 || event.keyCode === 40) {
                    this.keys.down = false;
                }
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
        if (!this.mesh) {
            console.log('Cannot update movement: mesh not loaded');
            return;
        }

        // Se estamos pulando, normalmente não processamos outros movimentos,
        // mas vamos permitir algum movimento lateral mesmo durante o pulo
        // para melhorar a jogabilidade
        let isJumping = this.isJumping;

        // Log estado das teclas para debug
        const anyKeyPressed = this.keys.up || this.keys.down || this.keys.left || this.keys.right;
        if (anyKeyPressed && Math.floor(Date.now() / 1000) % 2 === 0) {
            console.log('Movement keys state:', 
                `Up: ${this.keys.up}, Down: ${this.keys.down}, Left: ${this.keys.left}, Right: ${this.keys.right}`);
        }

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

        // Aplicar movimentos baseados no estado das teclas
        if (this.keys.up) this.movementDirection.add(cameraForward);
        if (this.keys.down) this.movementDirection.sub(cameraForward);
        if (this.keys.right) this.movementDirection.add(cameraRight);
        if (this.keys.left) this.movementDirection.sub(cameraRight);

        // Verificar se há alguma direção de movimento
        if (this.movementDirection.length() > 0) {
            console.log('Moving player in direction: ', 
                this.movementDirection.x.toFixed(2), 
                this.movementDirection.y.toFixed(2), 
                this.movementDirection.z.toFixed(2));
            
            this.movementDirection.normalize();
            
            // Store previous position
            const previousPosition = this.mesh.position.clone();

            // Calcular velocidade baseada no estado (pulando ou normal)
            const currentSpeed = isJumping ? this.moveSpeed * 0.7 : this.moveSpeed;
            
            // Apply movement
            this.mesh.position.x += this.movementDirection.x * currentSpeed;
            this.mesh.position.z += this.movementDirection.z * currentSpeed;

            // Log a posição para debug
            console.log('Player position: ', 
                this.mesh.position.x.toFixed(2), 
                this.mesh.position.y.toFixed(2), 
                this.mesh.position.z.toFixed(2));

            // Rotate player to face movement direction
            const targetRotation = Math.atan2(this.movementDirection.x, this.movementDirection.z);
            this.mesh.rotation.y = targetRotation;

            // Check for collisions
            if (this.checkCollisions()) {
                console.log('Collision detected, reverting to previous position');
                this.mesh.position.copy(previousPosition);
            }

            // Reset idle timer and play run animation only if not jumping
            this.idleTimer = 0;
            if (!isJumping && this.animations['run']) {
                this.playAnimation('run');
            }
        } else if (anyKeyPressed) {
            // Se teclas estão pressionadas mas não há movimento, isto é um erro
            console.warn('Keys are pressed but no movement is being calculated!');
        }
    }

    update(deltaTime) {
        // Check if controls are enabled before processing any updates
        if (!this.controlsEnabled) {
            // Even when controls are disabled, we should update the animation mixer
            if (this.mixer) {
                this.mixer.update(deltaTime);
            }
            return;
        }

        // If we're playing death animation, only update the mixer
        if (this.currentAnimation === 'death') {
            if (this.mixer) {
                this.mixer.update(deltaTime);
            }
            return;
        }

        // Verificação inicial - se o jogador não estiver habilitado, não atualize nada
        if (!this.enabled) {
            // Still update mixer for death animation
            if (this.mixer) {
                this.mixer.update(deltaTime);
            }
            return;
        }

        // If mesh isn't loaded yet, don't try to update
        if (!this.mesh) {
            console.log('Player mesh not found, cannot update');
            return;
        }

        // Log se o Pointer Lock não estiver ativo mas não bloquear o movimento
        if (!this.isPointerLocked && this.enabled) {
            // Apenas logar uma vez por segundo para não sobrecarregar o console
            if (Math.floor(Date.now() / 1000) % 3 === 0) {
                console.log('Moving without pointer lock - camera rotation will be limited');
            }
        }

        // Update animation mixer com velocidade ajustada para o pulo
        if (this.mixer) {
            const animSpeed = this.isJumping ? 1.0 : 1.0; // Removida aceleração da animação de pulo
            this.mixer.update(deltaTime * animSpeed);
        }

        // Update idle timer if player is not moving and not jumping and not on ladder
        if (!this.isMoving() && !this.isJumping && !this.onLadder) {
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

        // Update camera position
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        if (!this.mesh) {
            console.warn('updateCameraPosition: Player mesh not available.');
            return;
        }

        if (this.currentCamera === 'perspective') {
            // Original perspective camera behavior
            const rotation = new THREE.Euler(
                this.cameraRotation.x,
                this.cameraRotation.y,
                0,
                'YXZ'
            );

            const offset = new THREE.Vector3(
                0,
                this.cameraOffset.y,
                this.cameraOffset.z
            );
            offset.applyEuler(rotation);
            
            const targetPosition = this.mesh.position.clone().add(offset);
            this.camera.position.copy(targetPosition);
            this.camera.rotation.copy(rotation);
            this.camera.rotation.x -= 0.2;
        } else if (this.currentCamera === '2d') {
            // Update top-down camera position to follow player
            this.camera.position.x = this.mesh.position.x;
            this.camera.position.z = this.mesh.position.z;
            
            // Posicionar a câmera 49 unidades acima do piso atual
            const nextFloorY = (this.currentFloor + 1) * this.floorHeight;
            this.camera.position.y = nextFloorY - 1;
            
            // Keep camera pointed straight down
            this.camera.rotation.x = -Math.PI / 2;
            this.camera.rotation.y = 0;
            this.camera.rotation.z = 0;

            console.log('Camera Y position:', this.camera.position.y, 'Current floor:', this.currentFloor);
        }
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
        // Create a wider collision box for more permissive ladder detection
        const ladderCollider = new THREE.Box3();
        const playerSize = new THREE.Vector3(2.0, 2.0, 2.0); // Maior área de detecção
        ladderCollider.setFromCenterAndSize(position.clone().add(new THREE.Vector3(0, 1, 0)), playerSize);

        let isOnLadder = false;
        let floorIndex = -1;
        let ladderPosition = null;

        // Debug hitbox visualization
        this.scene.children.forEach(child => {
            if (child.userData.isLadder) {
                const ladderBox = new THREE.Box3().setFromObject(child);
                if (ladderCollider.intersectsBox(ladderBox)) {
                    isOnLadder = true;
                    floorIndex = child.userData.floorIndex;
                    ladderPosition = child.position.clone();
                    
                    // Log debug info
                    console.log(`Ladder detected! Floor: ${floorIndex}, Position: ${ladderPosition.x.toFixed(2)}, ${ladderPosition.y.toFixed(2)}, ${ladderPosition.z.toFixed(2)}`);
                }
            }
        });

        return { isOnLadder, floorIndex, ladderPosition };
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

        // Get updated ladder info
        const ladderInfo = this.checkLadderCollision(this.mesh.position);
        
        // If we've somehow lost track of the ladder, try to recover
        if (!ladderInfo.isOnLadder || !ladderInfo.ladderPosition) {
            console.log("Lost track of ladder, trying to recover...");
            this.onLadder = false;
            return;
        }
        
        // Log when starting to climb
        console.log("Climbing ladder...");

        // Rotate player to face forward when on ladder
        const targetRotation = Math.PI; // Face forward
        this.mesh.rotation.y = targetRotation;

        // Snap position to ladder center for better climbing
        this.mesh.position.x = 0;
        this.mesh.position.z = ladderInfo.ladderPosition.z;

        // Play climbing animation if we have one (or stop current animation)
        if (this.currentAnimation && this.currentAnimation !== 'climb') {
            const current = this.animations[this.currentAnimation];
            current.stop();
            this.currentAnimation = null;
        }

        // Vertical movement on ladder - increased speed for better responsiveness
        const climbSpeedAdjusted = this.climbSpeed * 2.0; // Double the climb speed
        
        if (this.keys.up) {
            console.log("Climbing up");
            this.mesh.position.y += climbSpeedAdjusted;
            
            // Debug info
            console.log(`New Y position: ${this.mesh.position.y.toFixed(2)}`);
        } else if (this.keys.down) {
            console.log("Climbing down");
            this.mesh.position.y -= climbSpeedAdjusted;
            
            // Debug info
            console.log(`New Y position: ${this.mesh.position.y.toFixed(2)}`);
        }

        // Check if we've reached the top or bottom of the ladder
        const floorY = ladderInfo.floorIndex * this.floorHeight;
        const nextFloorY = (ladderInfo.floorIndex + 1) * this.floorHeight;
        
        // If we've reached the next floor and trying to go up, get off the ladder
        if (this.mesh.position.y >= nextFloorY - 0.5 && this.keys.up) {
            console.log("Reached top of ladder");
            this.mesh.position.y = nextFloorY + 1.0; // Place slightly above floor
            this.currentFloor = ladderInfo.floorIndex + 1;
            this.onLadder = false;
            
            if (this.animations['idle2']) {
                this.playAnimation('idle2');
            }
            return;
        }
        
        // If we've reached the bottom of the ladder and trying to go down, get off ladder
        if (this.mesh.position.y <= floorY + 1.0 && this.keys.down) {
            console.log("Reached bottom of ladder");
            this.mesh.position.y = floorY + 1.0; // Place on floor
            this.currentFloor = ladderInfo.floorIndex;
            this.onLadder = false;
            
            if (this.animations['idle2']) {
                this.playAnimation('idle2');
            }
            return;
        }

        // Handle jumping off ladder (with reduced force)
        if (this.keys.space) {
            this.onLadder = false;
            this.velocity.y = this.jumpForce * 0.6;
            this.isJumping = true;
            
            // Make sure we're still on the right floor
            const currentFloorHeight = Math.floor(this.mesh.position.y / this.floorHeight);
            this.currentFloor = currentFloorHeight;
            
            if (this.animations['jump']) {
                this.playAnimation('jump');
            }
        }

        // Handle horizontal movement off the ladder
        if (this.keys.left || this.keys.right) {
            // Determine if we're close enough to a floor to step off
            const currentHeight = this.mesh.position.y;
            const nearestFloorY = Math.round(currentHeight / this.floorHeight) * this.floorHeight + 1.0;
            
            if (Math.abs(currentHeight - nearestFloorY) < 1.0) {
                console.log("Stepping off ladder to floor level:", Math.round(nearestFloorY / this.floorHeight));
                
                // Set the proper Y position for the floor
                this.mesh.position.y = nearestFloorY;
                
                // Step off in the direction pressed
                this.mesh.position.x = this.keys.left ? -2.0 : 2.0;
                
                // Update floor
                this.currentFloor = Math.round(nearestFloorY / this.floorHeight);
                
                // We're no longer on the ladder
                this.onLadder = false;
                
                if (this.animations['idle2']) {
                    this.playAnimation('idle2');
                }
            }
        }
    }

    applyGravity() {
        if (this.isJumping) {
            // Ajuste da gravidade durante o pulo
            const peakHeight = 0.1; // Reduzido de 0.12 para 0.1
            if (Math.abs(this.velocity.y) < peakHeight) {
                this.velocity.y -= this.gravity * 0.8; // Aumentado de 0.7 para 0.8
            } else if (this.velocity.y > 0) {
                this.velocity.y -= this.gravity * 1.0; // Aumentado de 0.9 para 1.0
            } else {
                this.velocity.y -= this.gravity * 1.2; // Aumentado de 1.1 para 1.2
            }
        } else {
            this.velocity.y -= this.gravity * 1.3; // Aumentado de 1.2 para 1.3
        }
        
        this.mesh.position.y += this.velocity.y;

        // Ground collision
        const floorY = this.currentFloor * this.floorHeight + 1.0;
        if (this.mesh.position.y <= floorY) {
            this.mesh.position.y = floorY;
            this.velocity.y = 0;
            this.isJumping = false;
            
            // When landing, check if moving to play run animation, otherwise use idle2
            if (this.isMoving() && this.animations['run']) {
                this.playAnimation('run', true);
            } else if (this.animations['idle2']) {
                this.playAnimation('idle2', true);
            }
        }
    }

    // Add new method to enable controls
    enableControls() {
        console.log('Enabling player controls forcefully...');
        
        try {
            // Remove any existing instructions
            const elementsToRemove = document.querySelectorAll('#pointer-lock-instruction, .game-instructions, .click-instruction');
            elementsToRemove.forEach(el => el.remove());
            
            // Request pointer lock directly without showing instructions
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        } catch (error) {
            console.error('Error enabling pointer lock:', error);
        }
    }

    // Add new method to disable controls
    disableControls() {
        this.enabled = false; // Definir como desabilitado
        console.log('Disabling player controls...');
        
        // Remover os event listeners de teclado
        if (this.handleKeyPress) {
            document.removeEventListener('keydown', this.handleKeyPress);
            document.removeEventListener('keyup', this.handleKeyPress);
            console.log('Keyboard event handlers removed');
        }
        
        if (document.pointerLockElement === document.body) {
            document.exitPointerLock();
            console.log('Pointer lock exited');
        }
        
        // Remover a instrução de clique, se existir
        const instruction = document.getElementById('pointer-lock-instruction');
        if (instruction) {
            instruction.remove();
            console.log('Instruction element removed');
        }
    }

    reset() {
        // Reset position
        if (this.mesh) {
            this.mesh.position.set(0, 0, 0);
            this.mesh.rotation.set(0, 0, 0);
        }
        
        // Reset movement state
        this.velocity.set(0, 0, 0);
        this.isJumping = false;
        this.isGrounded = false;
        this.isFalling = false;
        this.isClimbing = false;
        
        // Reset animation
        if (this.animations['idle']) {
            this.playAnimation('idle');
        }
        
        // Reset camera position
        if (this.camera) {
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
        }
    }

    toggle2DCamera() {
        console.log('Toggling bird\'s eye view');
        
        if (this.currentCamera === 'perspective') {
            console.log('Switching to bird\'s eye view');
            this.currentCamera = '2d';
            
            // Store current perspective camera state
            this.lastPerspectivePosition = {
                position: this.camera.position.clone(),
                rotation: this.camera.rotation.clone(),
                fov: this.camera.fov
            };

            // Position orthographic camera high above the player
            this.orthographicCamera.position.set(
                this.mesh.position.x,
                150,  // Altura bem alta para visão aérea
                this.mesh.position.z
            );
            
            // Apontar diretamente para baixo
            this.orthographicCamera.rotation.x = -Math.PI / 2;
            this.orthographicCamera.rotation.y = 0;
            this.orthographicCamera.rotation.z = 0;
            
            // Atualizar a matriz de projeção
            this.orthographicCamera.updateProjectionMatrix();
            
            // Trocar para a câmera ortográfica
            if (this.scene.parent) {
                this.scene.parent.camera = this.orthographicCamera;
                console.log('Switched to bird\'s eye camera');
            }
            
        } else {
            console.log('Switching back to perspective view');
            this.currentCamera = 'perspective';
            
            // Restaurar câmera perspectiva
            if (this.lastPerspectivePosition) {
                this.camera.position.copy(this.lastPerspectivePosition.position);
                this.camera.rotation.copy(this.lastPerspectivePosition.rotation);
                this.camera.fov = this.lastPerspectivePosition.fov;
                this.camera.updateProjectionMatrix();
            }
            
            // Trocar de volta para a câmera perspectiva
            if (this.scene.parent) {
                this.scene.parent.camera = this.camera;
                console.log('Switched back to perspective camera');
            }
        }
    }
} 