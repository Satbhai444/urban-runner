// COIN MANAGER - ENHANCED with glow, trails, magnetic attraction
import * as THREE from 'three';

export class CoinManager {
  constructor(app) {
    this.app = app;
    this.quality = app.quality;
    this.coins = [];
    this.spawnDistance = -80;
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;

    // Magnetic attraction
    this.magnetRange = 4;
    this.magnetStrength = 8;
    this.isAttracted = false;

    this.coinTypes = [
      { name: 'bronze', value: 1, color: 0xcd7f32, emissive: 0x8b4513 },
      { name: 'silver', value: 5, color: 0xd4d4d4, emissive: 0xa0a0a0 },
      { name: 'gold', value: 10, color: 0xffd700, emissive: 0xff8c00 },
      { name: 'diamond', value: 50, color: 0x00ffff, emissive: 0x00aaff }
    ];

    this.createPool();
    this.createGlowSprites();
  }

  createPool() {
    this.pool = {};
    const poolSize = this.quality === 'low' ? 40 : 60;

    this.coinTypes.forEach(type => {
      this.pool[type.name] = [];
      const isDiamond = type.name === 'diamond';

      // Main coin geometry
      const geometry = isDiamond
        ? new THREE.OctahedronGeometry(0.3)
        : new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);

      // Glow geometry (slightly larger)
      const glowGeom = isDiamond
        ? new THREE.OctahedronGeometry(0.45)
        : new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16);

      for (let i = 0; i < poolSize; i++) {
        // Main coin material with enhanced emissive
        const material = new THREE.MeshStandardMaterial({
          color: type.color,
          emissive: type.emissive,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2
        });

        const coin = new THREE.Mesh(geometry, material);
        coin.visible = false;
        this.app.scene.add(coin);

        // Glow layer (always visible, acts as halo)
        const glowMat = new THREE.MeshBasicMaterial({
          color: type.color,
          transparent: true,
          opacity: 0,
          side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeom.clone(), glowMat);
        coin.add(glow);
        coin.userData.glow = glow;

        this.pool[type.name].push(coin);
      }
    });

    // Enhanced particle system
    this.particles = [];
    const particleCount = this.quality === 'low' ? 30 : 60;
    for (let i = 0; i < particleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0
      });
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), mat);
      particle.visible = false;
      this.app.scene.add(particle);
      this.particles.push({
        mesh: particle,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5
      });
    }
    this.particleIndex = 0;

    // Sparkle pool for diamond coins
    this.sparkles = [];
    const sparkleCount = 20;
    for (let i = 0; i < sparkleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });
      const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), mat);
      sparkle.visible = false;
      this.app.scene.add(sparkle);
      this.sparkles.push({ mesh: sparkle, life: 0, maxLife: 0.3 });
    }
    this.sparkleIndex = 0;

    // Floating text for coin collection
    this.floatingTexts = [];
    this.createFloatingTextPool();
  }

  createGlowSprites() {
    // Pre-bake glow sprite for performance
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    this.glowTexture = new THREE.CanvasTexture(canvas);
  }

  createFloatingTextPool() {
    // Use simple DOM-based floating texts for "+10 🪙" popups
    this.floatingTextPool = [];
    const poolSize = this.quality === 'low' ? 5 : 10;
    for (let i = 0; i < poolSize; i++) {
      const el = document.createElement('div');
      el.className = 'coin-popup';
      el.style.cssText = `
        position: fixed;
        pointer-events: none;
        font-family: 'Russo One', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        color: #ffd700;
        text-shadow: 0 0 10px #ff8c00, 0 2px 4px rgba(0,0,0,0.5);
        z-index: 100;
        opacity: 0;
        transform: translateY(0);
        transition: none;
      `;
      el.textContent = '+10';
      document.body.appendChild(el);
      this.floatingTextPool.push({ el, active: false, life: 0, startY: 0 });
    }
  }

  showFloatingText(value, worldPos, color = '#ffd700') {
    const ft = this.floatingTextPool.find(f => !f.active);
    if (!ft) return;

    // Project 3D position to screen
    const vector = worldPos.clone();
    vector.project(this.app.camera.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    ft.el.style.left = `${x}px`;
    ft.el.style.top = `${y}px`;
    ft.el.style.color = color;
    ft.el.style.opacity = '1';
    ft.el.style.transform = 'translateY(0) translateX(-50%)';
    ft.startY = y;
    ft.life = 1.0;
    ft.active = true;
    ft.el.textContent = `+${value}`;
  }

  updateFloatingTexts(delta) {
    for (const ft of this.floatingTextPool) {
      if (!ft.active) continue;
      ft.life -= delta * 1.5;
      if (ft.life <= 0) {
        ft.active = false;
        ft.el.style.opacity = '0';
        continue;
      }
      const progress = 1 - ft.life;
      ft.el.style.opacity = `${ft.life}`;
      ft.el.style.transform = `translateY(${-40 * progress}px) translateX(-50%)`;
      ft.el.style.fontSize = `${1.2 + progress * 0.3}rem`;
    }
  }

  reset() {
    for (const type in this.pool) {
      for (const coin of this.pool[type]) {
        coin.visible = false;
        if (coin.userData.glow) coin.userData.glow.material.opacity = 0;
      }
    }
    this.coins = [];
    this.spawnTimer = 0;
    for (const p of this.particles) {
      p.mesh.visible = false;
      p.life = 0;
    }
    for (const s of this.sparkles) {
      s.mesh.visible = false;
      s.life = 0;
    }
    for (const ft of this.floatingTextPool) {
      ft.active = false;
      ft.el.style.opacity = '0';
    }
  }

  update(delta) {
    const speed = this.app.game.currentSpeed;
    const playerPos = this.app.player.group.position;
    const time = this.app.clock.getElapsedTime();

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnPattern();
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const pos = coin.mesh.position;

      // Check if player is close enough for magnetic attraction
      const dx = pos.x - playerPos.x;
      const dy = (pos.y + 0.5) - (playerPos.y + 0.9);
      const dz = pos.z - playerPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      // Magnetic attraction when player is close
      this.isAttracted = distSq < this.magnetRange * this.magnetRange;
      if (this.isAttracted) {
        const attractForce = this.magnetStrength * delta * (1 - dist / this.magnetRange);
        pos.x -= (dx / dist) * attractForce * 5;
        pos.y -= (dy / dist) * attractForce * 5;
        pos.z -= (dz / dist) * attractForce * 5;
      }

      // Standard movement when not attracted
      if (!this.isAttracted) {
        pos.z += speed * delta;
      }

      // Enhanced spin - faster and with slight tilt
      const spinSpeed = coin.type === 'diamond' ? 4 : 3;
      coin.mesh.rotation.y += delta * spinSpeed;
      if (coin.type === 'diamond') {
        coin.mesh.rotation.x += delta * 1.5;
      }

      // Floating bob animation
      pos.y = coin.baseY + Math.sin(time * 3 + coin.phase) * 0.15;

      // Glow pulse
      const glowIntensity = 0.3 + Math.sin(time * 4 + coin.phase) * 0.2;
      if (coin.mesh.userData.glow) {
        coin.mesh.userData.glow.material.opacity = this.isAttracted
          ? glowIntensity + 0.3
          : glowIntensity;
        // Scale pulse
        const glowScale = 1 + Math.sin(time * 4 + coin.phase) * 0.1;
        coin.mesh.userData.glow.scale.setScalar(this.isAttracted ? 1.3 : glowScale);
      }

      // Diamond sparkle effect
      if (coin.type === 'diamond') {
        this.updateDiamondSparkle(coin, time);
      }

      // Despawn check
      if (pos.z > 8) {
        coin.mesh.visible = false;
        if (coin.mesh.userData.glow) coin.mesh.userData.glow.material.opacity = 0;
        this.coins.splice(i, 1);
        continue;
      }

      // Collection radius grows when magnetized
      const collectRadius = coin.type === 'diamond' ? 2.2 : 1.6;
      const adjustedRadius = this.isAttracted ? collectRadius * 1.5 : collectRadius;
      if (distSq < adjustedRadius * adjustedRadius) {
        this.collect(coin);
        this.coins.splice(i, 1);
      }
    }

    // Update particles
    for (const p of this.particles) {
      if (p.life > 0) {
        p.life -= delta;
        if (p.life <= 0) {
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.x += p.velocity.x * delta;
        p.mesh.position.y += p.velocity.y * delta;
        p.velocity.y -= 12 * delta;
        const ratio = p.life / p.maxLife;
        p.mesh.material.opacity = ratio;
        p.mesh.scale.setScalar(ratio * 0.8 + 0.2);
      }
    }

    // Update sparkles
    for (const s of this.sparkles) {
      if (s.life > 0) {
        s.life -= delta;
        if (s.life <= 0) {
          s.mesh.visible = false;
          continue;
        }
        const ratio = s.life / s.maxLife;
        s.mesh.material.opacity = ratio;
        s.mesh.scale.setScalar(0.5 + ratio * 0.5);
      }
    }

    // Update floating texts
    this.updateFloatingTexts(delta);
  }

  updateDiamondSparkle(coin, time) {
    // Spawn sparkles around diamond
    if (Math.random() < 0.15) {
      const s = this.sparkles[this.sparkleIndex];
      this.sparkleIndex = (this.sparkleIndex + 1) % this.sparkles.length;

      const angle = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.2;
      s.mesh.position.set(
        coin.mesh.position.x + Math.cos(angle) * r,
        coin.mesh.position.y + Math.sin(angle) * r,
        coin.mesh.position.z + Math.sin(angle) * r * 0.5
      );
      s.mesh.material.color.setHex(coin.mesh.material.color.getHex());
      s.mesh.visible = true;
      s.life = s.maxLife;
    }
  }

  spawnPattern() {
    if (this.coins.length > 60) return;

    const pattern = Math.floor(Math.random() * 4);
    const lanes = [-3, 0, 3];
    const baseZ = this.spawnDistance - Math.random() * 20;

    const typeRoll = Math.random();
    let coinType;
    if (typeRoll < 0.5) coinType = 'bronze';
    else if (typeRoll < 0.8) coinType = 'silver';
    else if (typeRoll < 0.97) coinType = 'gold';
    else coinType = 'diamond';

    switch (pattern) {
      case 0: {
        const lane = lanes[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 5; i++) {
          this.spawnCoin(coinType, lane, 1.2, baseZ - i * 1.5);
        }
        break;
      }
      case 1: {
        const lane = lanes[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          this.spawnCoin(coinType, lane, 1.2 + Math.sin(t * Math.PI) * 1.2, baseZ - i * 1.5);
        }
        break;
      }
      case 2: {
        for (let i = 0; i < 5; i++) {
          this.spawnCoin(coinType, lanes[i % 3], 1.2, baseZ - i * 2);
        }
        break;
      }
      case 3: {
        const lane = lanes[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 4; i++) {
          this.spawnCoin('bronze', lane, 1.2, baseZ - i * 1.5);
        }
        this.spawnCoin('diamond', lane, 1.2, baseZ - 7);
        break;
      }
    }
  }

  spawnCoin(type, x, y, z) {
    const coin = this.pool[type].find(c => !c.visible);
    if (!coin) return;

    coin.position.set(x, y, z);
    coin.rotation.set(0, Math.random() * Math.PI * 2, 0);
    coin.scale.setScalar(1);
    coin.visible = true;
    if (coin.userData.glow) coin.userData.glow.material.opacity = 0.3;

    this.coins.push({
      mesh: coin,
      type,
      value: this.coinTypes.find(t => t.name === type).value,
      baseY: y,
      phase: Math.random() * Math.PI * 2
    });
  }

  collect(coin) {
    coin.mesh.visible = false;
    if (coin.mesh.userData.glow) coin.mesh.userData.glow.material.opacity = 0;

    // Show floating text
    const color = coin.type === 'diamond' ? '#00ffff'
      : coin.type === 'gold' ? '#ffd700'
      : coin.type === 'silver' ? '#d4d4d4' : '#cd7f32';
    this.showFloatingText(coin.value, coin.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), color);

    // Enhanced particles
    const count = this.quality === 'low' ? 6 : 10;
    for (let i = 0; i < count; i++) {
      this.spawnParticle(coin.mesh.position, coin.mesh.material.color.getHex());
    }

    // Camera shake for high-value coins
    if (coin.value >= 10) {
      this.app.camera.shake(coin.value >= 50 ? 0.2 : 0.1, 0.1);
    }

    this.app.game.addCoin(coin.value);

    // Play sound via audio manager
    if (this.app.audio) {
      this.app.audio.playCoin(coin.type);
      if (this.app.game.combo >= 3) {
        this.app.audio.playCombo(Math.floor(this.app.game.combo));
      }
    }
  }

  spawnParticle(position, color) {
    const p = this.particles[this.particleIndex];
    this.particleIndex = (this.particleIndex + 1) % this.particles.length;

    p.mesh.position.copy(position);
    p.mesh.material.color.setHex(color);
    p.mesh.visible = true;
    p.mesh.material.opacity = 1;
    p.mesh.scale.setScalar(1);

    p.velocity.set(
      (Math.random() - 0.5) * 5,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 5
    );
    p.maxLife = 0.5;
    p.life = p.maxLife;
  }
}
