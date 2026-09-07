// OBSTACLE MANAGER - MOBILE OPTIMIZED
import * as THREE from 'three';

export class ObstacleManager {
  constructor(app) {
    this.app = app;
    this.quality = app.quality;
    this.obstacles = [];
    this.spawnDistance = -100;
    this.despawnDistance = 10;
    this.lastSpawnTime = 0;

    this.createObstaclePool();
  }

  createObstaclePool() {
    this.pool = [];
    const poolSize = this.quality === 'low' ? 10 : 15;

    for (let i = 0; i < poolSize; i++) {
      // === TRAIN ===
      const train = new THREE.Group();

      // Body - simplified
      const bodyMat = this.quality === 'low'
        ? new THREE.MeshLambertMaterial({ color: 0xcc3333 })
        : new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.5 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3, 10), bodyMat);
      train.add(body);

      // Windows only if not low quality
      if (this.quality !== 'low') {
        const winMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        for (let w = 0; w < 3; w++) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.6), winMat);
          win.position.set(0, 0.3, -3.5 + w * 3);
          win.position.z += 0.02;
          train.add(win);
        }
      }

      // Headlights
      for (let h = -1; h <= 1; h += 2) {
        const light = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        light.position.set(h * 0.8, -0.3, 5);
        train.add(light);
      }

      train.visible = false;
      this.app.scene.add(train);
      this.pool.push({ mesh: train, type: 'train', inUse: false });

      // === BARRIER ===
      const barrier = new THREE.Group();
      const barrierMat = this.quality === 'low'
        ? new THREE.MeshLambertMaterial({ color: 0xffcc00 })
        : new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 });

      const barBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.5), barrierMat);
      barrier.add(barBody);

      // Stripes
      if (this.quality !== 'low') {
        for (let s = 0; s < 5; s++) {
          const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 1.2, 0.55),
            new THREE.MeshLambertMaterial({ color: 0x000000 })
          );
          stripe.position.x = -1 + s * 0.5;
          barrier.add(stripe);
        }
      }

      barrier.visible = false;
      this.app.scene.add(barrier);
      this.pool.push({ mesh: barrier, type: 'barrier', inUse: false });

      // === OVERHEAD ===
      const overhead = new THREE.Group();
      const overheadMat = this.quality === 'low'
        ? new THREE.MeshLambertMaterial({ color: 0xff4444 })
        : new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5 });

      const overBar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.6), overheadMat);
      overhead.add(overBar);

      overhead.visible = false;
      this.app.scene.add(overhead);
      this.pool.push({ mesh: overhead, type: 'overhead', inUse: false });

      // === LOW ===
      const low = new THREE.Group();
      const lowMat = this.quality === 'low'
        ? new THREE.MeshLambertMaterial({ color: 0xff6600 })
        : new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });

      const lowBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.5), lowMat);
      lowBody.position.y = 0.4;
      low.add(lowBody);

      low.visible = false;
      this.app.scene.add(low);
      this.pool.push({ mesh: low, type: 'low', inUse: false });
    }
  }

  reset() {
    for (const item of this.pool) {
      item.mesh.visible = false;
      item.inUse = false;
    }
    this.obstacles = [];
    this.lastSpawnTime = 0;
  }

  update(delta) {
    const speed = this.app.game.currentSpeed;

    this.lastSpawnTime += delta;
    if (this.lastSpawnTime > this.app.game.obstacleInterval) {
      this.spawnObstacle();
      this.lastSpawnTime = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += speed * delta;

      if (obs.mesh.position.z > this.despawnDistance) {
        obs.mesh.visible = false;
        obs.poolItem.inUse = false;
        this.obstacles.splice(i, 1);
        continue;
      }

      if (this.checkCollision(obs)) {
        const gameOver = this.app.player.takeDamage();
        if (gameOver) {
          this.app.gameOver();
          return;
        }
        obs.mesh.visible = false;
        obs.poolItem.inUse = false;
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle() {
    const poolItem = this.pool.find(item => !item.inUse);
    if (!poolItem) return;
    poolItem.inUse = true;

    const typeRand = Math.random();
    let type, lanes, y;

    if (typeRand < 0.4) {
      type = 'train';
      lanes = [Math.floor(Math.random() * 3)];
      y = 1.5;
    } else if (typeRand < 0.65) {
      type = 'barrier';
      lanes = this.getRandomLanes(1 + Math.floor(Math.random() * 2));
      y = 0.6;
    } else if (typeRand < 0.85) {
      type = 'overhead';
      lanes = this.getRandomLanes(1 + Math.floor(Math.random() * 2));
      y = 1.8;
    } else {
      type = 'low';
      lanes = this.getRandomLanes(1 + Math.floor(Math.random() * 2));
      y = 0.4;
    }

    poolItem.mesh.position.set(this.app.player.lanes[lanes[0]], y, this.spawnDistance);
    poolItem.mesh.visible = true;

    this.obstacles.push({ mesh: poolItem.mesh, type, lanes, poolItem });
  }

  getRandomLanes(count) {
    const lanes = [0, 1, 2];
    const result = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * lanes.length);
      result.push(lanes.splice(idx, 1)[0]);
    }
    return result;
  }

  checkCollision(obs) {
    const player = this.app.player;
    if (player.hasSkateboardActive()) return false;
    if (!obs.lanes.includes(player.currentLane)) return false;

    const obsDepth = obs.type === 'train' ? 10 : 0.6;
    const obsZMin = obs.mesh.position.z - obsDepth / 2;
    const obsZMax = obs.mesh.position.z + obsDepth / 2;

    if (0 < obsZMin - 0.6 || 0 > obsZMax + 0.6) return false;

    switch (obs.type) {
      case 'barrier':
        if (player.y > 1.0) return false;
        if (player.isSliding) return false;
        return true;
      case 'overhead':
        if (player.isSliding && player.y < 0.3) return false;
        if (player.y > 1.3) return false;
        return true;
      case 'low':
        if (player.y > 1.0) return false;
        if (player.isSliding) return false;
        return true;
      case 'train':
        return true;
    }
    return false; // Should not reach here, but explicit fallback
  }
}
