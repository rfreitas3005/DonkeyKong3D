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
        emissive: 0xffcc00,
        emissiveIntensity: 1.5,
        metalness: 0.7,
        roughness: 0.3
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
    const material = new THREE.MeshPhongMaterial({ color: 0xFFFF00, shininess: 100 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(0.8, 0.8, 0.8);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = ITEM_TYPES.LIGHTNING;

    // Luz tipo aura
    const light = new THREE.PointLight(0xffff33, 2, 6);
    light.userData.pulsate = true;
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
        color: 0xFFD700,
        shininess: 120,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = ITEM_TYPES.STAR;

    // Luz tipo aura
    const light = new THREE.PointLight(0xffffff, 2.5, 7);
    light.userData.pulsate = true;
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
    constructor(scene, floors, floorHeight, floorLength, boundaryWidth) {
        this.scene = scene;
        this.floors = floors;
        this.floorHeight = floorHeight;
        this.floorLength = floorLength;
        this.boundaryWidth = boundaryWidth;
        this.items = [];
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

        this.items.forEach(({ mesh, type, floor }) => {
            const floorY = floor * this.floorHeight;
            const baseY = type === ITEM_TYPES.COIN ? floorY + 2.2 : floorY + 2.5;
            mesh.position.y = baseY + Math.sin(t * 2 + mesh.position.x + mesh.position.z) * 0.1;

            if (type === ITEM_TYPES.COIN) {
                mesh.rotation.y += 0.05;
            } else {
                mesh.rotation.z = Math.sin(t * 2) * 0.2;
            }

            // Anima a luz se existir
            mesh.children.forEach(child => {
                if (child.isPointLight && child.userData.pulsate) {
                    child.intensity = 1.5 + 0.5 * Math.sin(t * 4);
                }
            });
        });
    }

    removeItem(mesh) {
        this.scene.remove(mesh);
        this.items = this.items.filter(item => item.mesh !== mesh);
    }

    getCollidingItem(playerBox) {
        for (const { mesh, type } of this.items) {
            const center = mesh.position.clone();
            const size = new THREE.Vector3();

            if (type === ITEM_TYPES.COIN) {
                size.set(0.8, 0.8, 0.8);
            } else {
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
