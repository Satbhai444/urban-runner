// TRACK - ULTRA OPTIMIZED for Mobile
import * as THREE from 'three';

export class Track {
  constructor(app) {
    this.app = app;
    this.quality = app.quality;
    this.isMobile = app.isMobile;
    this.chunkLength = 40;
    // Fewer chunks on low quality
    this.numChunks = this.quality === 'low' ? 3 : this.isMobile ? 4 : 5;
    this.chunks = [];
    this.lanes = [-3, 0, 3];

    this.createChunks();
    this.createCity();
    this.createLights();
  }

  createChunks() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;  // Smaller texture
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Simple asphalt
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, 32, 128);

    // Lane lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(5, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.lineTo(27, 128);
    ctx.stroke();

    // Yellow center
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(16, 128);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);

    // Use Lambert for mobile (faster)
    const roadMat = this.quality === 'low'
      ? new THREE.MeshLambertMaterial({ map: texture })
      : new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 });

    const roadGeom = new THREE.PlaneGeometry(12, this.chunkLength);
    roadGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.numChunks; i++) {
      const mesh = new THREE.Mesh(roadGeom, roadMat);
      mesh.position.z = -i * this.chunkLength;
      if (this.quality === 'high') mesh.receiveShadow = true;
      this.app.scene.add(mesh);
      this.chunks.push({ mesh, z: -i * this.chunkLength });
    }

    // === EXTRA LANE MARKERS - Highly visible center line ===
    this.laneMarkers = [];
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Bright yellow center divider (center lane boundary)
    for (let i = 0; i < this.numChunks; i++) {
      const centerLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, this.chunkLength),
        yellowMat
      );
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.01, -i * this.chunkLength);
      this.app.scene.add(centerLine);
      this.laneMarkers.push(centerLine);
    }
  }

  createCity() {
    this.buildings = [];
    this.windows = [];

    // DRASTICALLY reduced counts for mobile
    const numBuildings = this.quality === 'low' ? 10 : this.isMobile ? 16 : 35;

    const buildingColors = [0x8b7355, 0x9e8b7d, 0x7a6b5a, 0xa89080, 0x6b5b4f];

    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < numBuildings; i++) {
        const height = 12 + Math.random() * 25;
        const width = 6 + Math.random() * 6;
        const depth = 6 + Math.random() * 6;
        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

        const material = this.quality === 'low'
          ? new THREE.MeshLambertMaterial({ color })
          : new THREE.MeshStandardMaterial({ color, roughness: 0.85 });

        const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        building.position.set(side * (12 + Math.random() * 6), height / 2, -i * 6 - Math.random() * 3);

        if (this.quality === 'high' && !this.isMobile) {
          building.castShadow = true;
          building.receiveShadow = true;
        }

        // Add windows only if not low quality
        if (this.quality !== 'low') {
          this.addSimpleWindows(building, width, height, depth);
        }

        this.app.scene.add(building);
        this.buildings.push(building);
      }
    }

    // Add trees only if not low quality
    if (this.quality !== 'low') {
      this.trees = [];
      const numTrees = this.isMobile ? 8 : 20;
      for (let i = 0; i < numTrees; i++) {
        const tree = this.createTree();
        const side = i % 2 === 0 ? -1 : 1;
        tree.position.set(side * 9, 0, -i * 10);
        this.app.scene.add(tree);
        this.trees.push(tree);
      }
    }
  }

  addSimpleWindows(building, width, height, depth) {
    // Much fewer windows
    const rows = Math.floor(height / 4);
    const cols = Math.floor(width / 3);
    const windowGeom = new THREE.PlaneGeometry(0.6, 0.8);
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0xfff8e7,
      transparent: true,
      opacity: 0.85
    });

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > 0.6) continue; // Skip some windows
        const win = new THREE.Mesh(windowGeom, windowMat);
        win.position.set(
          -width / 2 + (col + 0.5) * (width / cols),
          -height / 2 + (row + 0.5) * (height / rows) + 1.5,
          depth / 2 + 0.02
        );
        building.add(win);
      }
    }
  }

  createTree() {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 2, 6), trunkMat);
    trunk.position.y = 1;
    group.add(trunk);

    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), foliageMat);
    foliage.position.y = 3;
    group.add(foliage);

    return group;
  }

  createLights() {
    // No point lights on low quality (huge perf boost)
    if (this.quality === 'low') return;

    const numLamps = this.isMobile ? 5 : 10;
    this.lamps = [];

    for (let i = 0; i < numLamps; i++) {
      const lamp = new THREE.Group();
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), poleMat);
      pole.position.y = 2.5;
      lamp.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), poleMat);
      arm.position.set(0.75, 5, 0);
      lamp.add(arm);

      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffcc }));
      fixture.position.set(1.5, 4.85, 0);
      lamp.add(fixture);

      // Point light - shared across multiple lamps via light pooling
      // Only add point light for high quality
      if (this.quality === 'high') {
        const light = new THREE.PointLight(0xffffcc, 0.5, 10);
        light.position.set(1.5, 4.5, 0);
        lamp.add(light);
      }

      const side = i % 2 === 0 ? -1 : 1;
      lamp.position.set(side * 7.5, 0, -i * 20);
      this.app.scene.add(lamp);
      this.lamps.push(lamp);
    }
  }

  // Called by adaptive quality
  reduceQuality() {
    this.quality = 'low';
    // Hide windows
    this.buildings.forEach(b => {
      b.children.forEach(c => { if (c.material?.color?.getHex() === 0xfff8e7) c.visible = false; });
    });
    // Remove trees
    if (this.trees) this.trees.forEach(t => this.app.scene.remove(t));
    // Remove lamps
    if (this.lamps) this.lamps.forEach(l => this.app.scene.remove(l));
  }

  reset() {
    for (let i = 0; i < this.numChunks; i++) {
      this.chunks[i].mesh.position.z = -i * this.chunkLength;
      this.chunks[i].z = -i * this.chunkLength;
    }
    // Reset lane markers
    if (this.laneMarkers) {
      for (let i = 0; i < this.laneMarkers.length; i++) {
        this.laneMarkers[i].position.z = -i * this.chunkLength;
      }
    }
  }

  update(delta) {
    const speed = this.app.game.currentSpeed;

    // Move chunks
    for (const chunk of this.chunks) {
      chunk.mesh.position.z += speed * delta;
      chunk.z = chunk.mesh.position.z;
      if (chunk.z > 25) {
        let minZ = Infinity;
        for (const c of this.chunks) {
          if (c.z < minZ) minZ = c.z;
        }
        chunk.mesh.position.z = minZ - this.chunkLength;
        chunk.z = minZ - this.chunkLength;
      }
    }

    // Move lane markers
    if (this.laneMarkers) {
      for (const marker of this.laneMarkers) {
        marker.position.z += speed * delta;
        if (marker.position.z > 25) {
          let minZ = Infinity;
          for (const m of this.laneMarkers) {
            if (m.position.z < minZ) minZ = m.position.z;
          }
          marker.position.z = minZ - this.chunkLength;
        }
      }
    }

    // Move buildings
    for (const building of this.buildings) {
      building.position.z += speed * delta;
      if (building.position.z > 20) {
        building.position.z -= 120;
      }
    }

    // Move trees
    if (this.trees) {
      for (const tree of this.trees) {
        tree.position.z += speed * delta;
        if (tree.position.z > 15) tree.position.z -= 100;
      }
    }

    // Move lamps
    if (this.lamps) {
      for (const lamp of this.lamps) {
        lamp.position.z += speed * delta;
        if (lamp.position.z > 15) lamp.position.z -= 120;
      }
    }
  }
}
