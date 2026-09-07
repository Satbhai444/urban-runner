// NEON RUNNER - ULTRA OPTIMIZED for Mobile
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Game } from './Game.js';
import { Player } from './Player.js';
import { Track } from './Track.js';
import { ObstacleManager } from './Obstacle.js';
import { CoinManager } from './Coin.js';
import { InputManager } from './Input.js';
import { CameraController } from './Camera.js';
import { UI } from './ui.js';
import { AudioManager } from './Audio.js';

class NeonRunner {
  constructor() {
    this.container = document.getElementById('game-container');
    this.input = new InputManager();
    this.audio = new AudioManager(this);
    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.isPaused = false;

    // Performance detection
    this.deviceInfo = this.detectDevice();
    this.quality = this.deviceInfo.quality;

    this.isMobile = this.deviceInfo.isMobile;
    this.fixedDelta = 1 / 60;
    this.accumulator = 0;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.currentFps = 60;

    this.init();
  }

  detectDevice() {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      || window.innerWidth < 768;

    // Detect low-end devices
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4;
    const isLowEnd = cores < 4 || memory < 2 || isMobile;

    let quality = 'high';
    if (isLowEnd) quality = isMobile ? 'low' : 'medium';

    // Check FPS performance later for dynamic adjustment
    return {
      isMobile,
      isLowEnd,
      cores,
      memory,
      quality
    };
  }

  async init() {
    await RAPIER.init();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87ceeb, this.quality === 'low' ? 0.025 : 0.018);

    // Renderer settings based on quality
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality === 'high',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      alpha: false
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Pixel ratio capping
    if (this.quality === 'low') {
      this.renderer.setPixelRatio(1);
    } else if (this.quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.world = new RAPIER.World({ x: 0, y: -20, z: 0 });

    // Init audio after first user interaction
    const initAudio = () => {
      this.audio.init();
      this.audio.resume();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    this.game = new Game(this);
    this.player = new Player(this);
    this.track = new Track(this);
    this.obstacles = new ObstacleManager(this);
    this.coins = new CoinManager(this);
    this.camera = new CameraController(this);

    this.ui = new UI(this);
    this.setupEvents();

    this.renderer.render(this.scene, this.camera.camera);

    // Start adaptive quality monitoring
    if (this.quality !== 'high') this.startAdaptiveQuality();

    console.log(`🏃‍♂️ Urban Runner | Quality: ${this.quality} | Mobile: ${this.isMobile}`);
  }

  setupLighting() {
    const ambientIntensity = this.quality === 'low' ? 0.8 : 0.6;
    this.scene.add(new THREE.AmbientLight(0xffeedd, ambientIntensity));

    // Sun
    const sun = new THREE.DirectionalLight(0xffffff, this.quality === 'low' ? 1.4 : 1.2);
    sun.position.set(20, 30, 10);

    if (this.quality === 'high' && !this.isMobile) {
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
    }
    this.scene.add(sun);

    // Hemisphere (no extra cost)
    this.scene.add(new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4));

    // Fewer point lights on low quality
    if (this.quality !== 'low') {
      const numLights = this.quality === 'high' ? 4 : 2;
      for (let i = 0; i < numLights; i++) {
        const light = new THREE.PointLight(0xffffff, 0.6, 20);
        light.position.set(i % 2 === 0 ? -7 : 7, 4, -i * 12);
        this.scene.add(light);
      }
    }

    this.scene.background = new THREE.Color(0x87ceeb);
  }

  setupEvents() {
    // Throttled resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.onResize(), 100);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 200);
    });

    this.setupTouchControls();
    this.setupDoubleSpace();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning) this.pauseGame();
    });

    // Expose input for HTML touch buttons
    window.gameInput = this.input;
  }

  setupTouchControls() {
    const container = this.container;
    let touchStartX = 0, touchStartY = 0, isSwiping = false;

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;

      if (!isSwiping && (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30)) {
        isSwiping = true;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) this.input.onSwipeRight();
          else this.input.onSwipeLeft();
        } else {
          if (deltaY > 0) this.input.onSwipeDown();
          else this.input.onSwipeUp();
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => { isSwiping = false; }, { passive: true });

    // Double tap for skateboard
    let lastTapTime = 0;
    container.addEventListener('touchstart', (e) => {
      const now = performance.now();
      if (now - lastTapTime < 400 && e.touches.length === 1) {
        this.player?.onDoubleTap();
      }
      lastTapTime = now;
    }, { passive: true });
  }

  setupDoubleSpace() {
    let lastSpaceTime = 0;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const now = performance.now();
        if (now - lastSpaceTime < 350) {
          this.player?.onDoubleTap();
          lastSpaceTime = 0;
        } else {
          lastSpaceTime = now;
        }
      }
    });
  }

  onResize() {
    this.camera.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startAdaptiveQuality() {
    setInterval(() => {
      if (this.currentFps < 45 && this.quality === 'medium') {
        this.quality = 'low';
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        this.track?.reduceQuality?.();
        console.log('⚡ Quality: medium → low');
      }
    }, 3000);
  }

  startGame() {
    this.isRunning = true;
    this.isPaused = false;
    this.game.reset();
    this.player.reset();
    this.track.reset();
    this.obstacles.reset();
    this.coins.reset();
    this.clock.start();
    this.lastTime = performance.now();
    this.ui.showScreen('game');
    if (this.audio && this.audio.musicEnabled) this.audio.startMusic();
    this.animate();
  }

  pauseGame() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.audio?.stopMusic();
    this.ui.showScreen('pause');
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.ui.showScreen('game');
    this.lastTime = performance.now();
    if (this.audio?.musicEnabled) this.audio.startMusic();
    this.animate();
  }

  restartGame() {
    this.isRunning = false;
    this.isPaused = false;
    this.audio?.stopMusic();
    this.startGame();
  }

  goToMenu() {
    this.isRunning = false;
    this.isPaused = false;
    this.audio?.stopMusic();
    this.ui.showScreen('home');
  }

  gameOver() {
    this.isRunning = false;
    this.audio?.stopMusic();
    this.audio?.playGameOver();
    this.game.endGame();
    this.ui.showGameOver(this.game.score, this.game.coins);
    this.camera.shake(0.5, 0.5);
  }

  animate() {
    if (!this.isRunning || this.isPaused) return;
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > 0.1) frameTime = 0.1;

    // FPS tracking
    this.fpsTimer += frameTime;
    this.frameCount++;
    if (this.fpsTimer >= 1.0) {
      this.currentFps = this.frameCount / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Fixed timestep - max 2 updates per frame for performance
    this.accumulator += frameTime;
    let updates = 0;
    while (this.accumulator >= this.fixedDelta && updates < 2) {
      this.update(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
      updates++;
    }
    if (this.accumulator > this.fixedDelta * 2) this.accumulator = 0;

    this.renderer.render(this.scene, this.camera.camera);
  }

  update(delta) {
    this.game.update(delta);
    this.player.update(delta);
    this.track.update(delta);
    this.obstacles.update(delta);
    this.coins.update(delta);
    this.camera.update(delta);
    this.world.step();

    // Throttled UI updates
    if (!this._uiTimer || performance.now() - this._uiTimer > 100) {
      this.ui.update(this.game.score, this.game.coins, this.game.speedMultiplier);
      this._uiTimer = performance.now();
    }
  }
}

window.addEventListener('load', () => new NeonRunner());
