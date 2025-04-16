import * as THREE from 'three';

export class DebugMenu {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.hitboxHelpers = new Map();
        this.init();
    }

    init() {
        // Create debug menu UI
        this.createDebugUI();
        
        // Initialize keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h') { // 'H' to toggle hitboxes
                this.toggleHitboxes();
            }
        });
    }

    createDebugUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.color = 'white';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.zIndex = '1000';

        const title = document.createElement('div');
        title.textContent = 'Debug Menu';
        title.style.marginBottom = '10px';
        title.style.fontWeight = 'bold';
        container.appendChild(title);

        const hitboxToggle = document.createElement('div');
        hitboxToggle.style.cursor = 'pointer';
        hitboxToggle.style.padding = '5px';
        hitboxToggle.innerHTML = '⬚ Show Hitboxes (H)';
        hitboxToggle.addEventListener('click', () => this.toggleHitboxes());
        container.appendChild(hitboxToggle);

        document.body.appendChild(container);
        this.menuContainer = container;
    }

    toggleHitboxes() {
        this.visible = !this.visible;
        
        // Clear existing hitbox helpers
        this.hitboxHelpers.forEach(helper => {
            this.scene.remove(helper);
        });
        this.hitboxHelpers.clear();

        if (this.visible) {
            // Create new hitbox helpers for all relevant objects
            this.scene.traverse((object) => {
                if (object.userData.isLadder || object.userData.isBoundary) {
                    const helper = new THREE.Box3Helper(
                        new THREE.Box3().setFromObject(object),
                        object.userData.isLadder ? 0x00ff00 : 0xff0000
                    );
                    this.hitboxHelpers.set(object.id, helper);
                    this.scene.add(helper);
                }
            });
        }

        // Update menu text
        const hitboxToggle = this.menuContainer.children[1];
        hitboxToggle.innerHTML = `${this.visible ? '☒' : '⬚'} Show Hitboxes (H)`;
    }

    update() {
        if (this.visible) {
            // Update hitbox positions
            this.hitboxHelpers.forEach((helper, objectId) => {
                const object = this.scene.getObjectById(objectId);
                if (object) {
                    helper.box.setFromObject(object);
                }
            });
        }
    }
} 