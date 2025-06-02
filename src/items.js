import * as THREE from 'three';

export const ITEM_TYPES = {
    COIN: 'coin',
    LIGHTNING: 'lightning',
    STAR: 'star',
};

function createCoin() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 64);
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0xffcc00,
        emissiveIntensity: 1.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = ITEM_TYPES.COIN;
    return mesh;
}

function createLightning() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.2, 0.4);
    shape.lineTo(-0.1, 0.4);
    shape.lineTo(0.1, 0.8);
    shape.lineTo(-0.2, 0.5);
    shape.lineTo(0, 1);
    const extrudeSettings = { depth: 0.1, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        shininess: 100,
        emissive: 0xffff00,
        emissiveIntensity: 1.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(0.8, 0.8, 0.8);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = ITEM_TYPES.LIGHTNING;

    // Adiciona PointLight ao relâmpago
    const light = new THREE.PointLight(0xffff00, 5, 12, 2);
    light.position.set(0, 0.4, 0);
    light.name = 'itemLight';
    mesh.add(light);

    return mesh;
}


function createStar() {
    const shape = new THREE.Shape();
    const spikes = 5, outerRadius = 0.6, innerRadius = 0.25;
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const a = (i / (spikes * 2)) * Math.PI * 2;
        shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    const extrudeSettings = { depth: 0.15, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 120,
        emissive: 0xffffaa,
        emissiveIntensity: 1.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = ITEM_TYPES.STAR;

    // Adiciona PointLight à estrela
    const light = new THREE.PointLight(0xffffaa, 5, 12, 2);
    light.position.set(0, 0.4, 0);
    light.name = 'itemLight';
    mesh.add(light);

    return mesh;
}


export function createItem(type) {
    switch (type) {
        case ITEM_TYPES.COIN:
            return createCoin();
        case ITEM_TYPES.LIGHTNING:
            return createLightning();
        case ITEM_TYPES.STAR:
            return createStar();
        default:
            return null;
    }
}

export class ItemManager {
    constructor(scene, floors, floorHeight, floorLength, boundaryWidth, player) {
        this.scene = scene;
        this.floors = floors;
        this.floorHeight = floorHeight;
        this.floorLength = floorLength;
        this.boundaryWidth = boundaryWidth;
        this.player = player;
        this.items = [];

        // Luz única que segue o item mais próximo
        this.tempLight = new THREE.PointLight(0xffffaa, 5, 10, 2);
        this.tempLight.castShadow = false;
        this.tempLight.visible = false;
        this.scene.add(this.tempLight);
    }

    spawnItems() {
        this.items.forEach(item => this.scene.remove(item.mesh));
        this.items = [];
        for (let floor = 0; floor < this.floors.length; floor++) {
            const numCoins = 6 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numCoins; i++) {
                const mesh = createItem(ITEM_TYPES.COIN);
                mesh.position.set(
                    (Math.random() - 0.5) * (this.boundaryWidth - 4),
                    floor * this.floorHeight + 2.2,
                    Math.random() * (this.floorLength - 8) + 4
                );
                this.scene.add(mesh);
                this.items.push({ mesh, type: ITEM_TYPES.COIN, floor });
            }
            if (Math.random() < 0.5) {
                const mesh = createItem(ITEM_TYPES.LIGHTNING);
                mesh.position.set(
                    (Math.random() - 0.5) * (this.boundaryWidth - 6),
                    floor * this.floorHeight + 2.5,
                    Math.random() * (this.floorLength - 10) + 5
                );
                this.scene.add(mesh);
                this.items.push({ mesh, type: ITEM_TYPES.LIGHTNING, floor });
            }
            if (Math.random() < 0.4) {
                const mesh = createItem(ITEM_TYPES.STAR);
                mesh.position.set(
                    (Math.random() - 0.5) * (this.boundaryWidth - 6),
                    floor * this.floorHeight + 2.5,
                    Math.random() * (this.floorLength - 10) + 5
                );
                this.scene.add(mesh);
                this.items.push({ mesh, type: ITEM_TYPES.STAR, floor });
            }
        }
    }

    update(deltaTime) {
        const t = performance.now() * 0.001;

        let closestItem = null;
        let closestDist = Infinity;
        const playerPos = this.player?.mesh?.position;

        this.items.forEach(({ mesh, type, floor }) => {
            const floorY = floor * this.floorHeight;
            const baseY = type === ITEM_TYPES.COIN ? floorY + 2.2 : floorY + 2.5;
            mesh.position.y = baseY + Math.sin(t * 2 + mesh.position.x + mesh.position.z) * 0.1;
            if (type === ITEM_TYPES.COIN) {
                // Rotação arcade: gira em Y, flip em X, e balança em Z, com seed por moeda
                const seed = mesh.position.x * 0.7 + mesh.position.z * 0.3;
                mesh.rotation.y = t * 2 + seed;
                mesh.rotation.x = Math.sin(t * 3 + seed) * 0.5 + Math.PI / 2;
                mesh.rotation.z = Math.sin(t * 2.2 + seed) * 0.15;
            } else {
                mesh.rotation.y += 0.03;
                mesh.rotation.z = Math.sin(t * 2) * 0.2;
            }

            if (playerPos) {
                const dist = mesh.position.distanceTo(playerPos);
                if (dist < closestDist && dist < 8) {
                    closestDist = dist;
                    closestItem = mesh;
                }
            }
        });

        if (closestItem) {
            this.tempLight.position.copy(closestItem.position);
            this.tempLight.visible = true;
        } else {
            this.tempLight.visible = false;
        }
    }

    removeItem(mesh) {
        // Verifica e remove a luz associada ao item (se existir)
        const light = mesh.getObjectByName('itemLight');
        if (light) {
            // Remove a luz do mesh e da cena
            mesh.remove(light);
            this.scene.remove(light);
    
            // Tenta liberar a memória da luz
            if (light.dispose) light.dispose();
        }
    
        // Remove o mesh do item da cena
        this.scene.remove(mesh);
    
        // Remove o item da lista interna de items
        this.items = this.items.filter(item => item.mesh !== mesh);
    }
    
    

    getCollidingItem(playerBox) {
        for (const { mesh, type } of this.items) {
            const center = mesh.position.clone();
            const size = new THREE.Vector3();

            if (type === ITEM_TYPES.COIN) {
                size.set(0.8, 0.8, 0.8);
            } else if (type === ITEM_TYPES.LIGHTNING || type === ITEM_TYPES.STAR) {
                size.set(1.0, 1.2, 1.0);
            }

            const itemBox = new THREE.Box3().setFromCenterAndSize(center, size);

            if (playerBox.intersectsBox(itemBox)) {
                return { mesh, type };
            }
        }
        return null;
    }
}
