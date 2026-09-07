// CAMERA CONTROLLER - MOBILE OPTIMIZED
import * as THREE from 'three';

export class CameraController {
  constructor(app) {
    this.app = app;
    this.quality = app.quality;
    this.isMobile = app.isMobile;

    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 60 : 65,
      window.innerWidth / window.innerHeight,
      0.1,
      this.isMobile ? 80 : 150
    );

    this.camera.position.set(0, 3, 6);
    this.camera.lookAt(0, 1, -10);

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = new THREE.Vector3();

    // Smoothing
    this.targetOffset = new THREE.Vector3(0, 3, 6);
    this.smoothSpeed = 5;

    // FOV boost
    this.targetFov = this.camera.fov;
    this.baseFov = this.camera.fov;
  }

  reset() {
    this.camera.position.set(0, 3, 6);
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.targetFov = this.baseFov;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  shake(intensity, duration) {
    // Reduce shake on mobile
    if (this.isMobile) {
      intensity *= 0.7;
      duration *= 0.7;
    }
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;

    // FOV boost
    this.targetFov = this.baseFov + (this.isMobile ? 3 : 5);
  }

  update(delta) {
    const player = this.app.player;
    if (!player || !player.group) return;

    const playerPos = player.group.position;

    // Smooth camera follow
    const followX = playerPos.x * 0.5;
    const targetY = 3 + playerPos.y * 0.2;

    this.camera.position.x += (followX - this.camera.position.x) * this.smoothSpeed * delta;
    this.camera.position.y += (targetY - this.camera.position.y) * this.smoothSpeed * delta;
    this.camera.position.z = 6;

    // Look ahead
    const lookZ = -8 - (this.app.game?.currentSpeed || 20) * 0.3;
    this.camera.lookAt(playerPos.x * 0.3, 1, lookZ);

    // Shake update
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += delta;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * (1 - progress);

      // Simplified shake - fewer calculations on mobile
      if (this.isMobile) {
        this.shakeOffset.x = Math.sin(this.shakeTimer * 50) * currentIntensity * 0.5;
        this.shakeOffset.y = Math.cos(this.shakeTimer * 40) * currentIntensity * 0.3;
      } else {
        this.shakeOffset.x = Math.sin(this.shakeTimer * 50) * currentIntensity * 0.5;
        this.shakeOffset.y = Math.cos(this.shakeTimer * 40) * currentIntensity * 0.3;
      }

      this.camera.position.x += this.shakeOffset.x;
      this.camera.position.y += this.shakeOffset.y;
    } else {
      this.shakeIntensity = 0;
    }

    // Smooth FOV
    if (this.camera.fov !== this.targetFov) {
      const fovSpeed = this.isMobile ? 2 : 3;
      this.camera.fov += (this.targetFov - this.camera.fov) * fovSpeed * delta;
      this.camera.updateProjectionMatrix();

      if (Math.abs(this.camera.fov - this.targetFov) < 0.1) {
        this.targetFov = this.baseFov;
      }
    }

    // Speed-based FOV (subtle)
    const speedMultiplier = this.app.game?.speedMultiplier || 1;
    const speedBoost = this.app.game?.speedBoost || 1;
    const effectiveBoost = speedMultiplier * speedBoost;
    if (effectiveBoost > 1) {
      const boostFov = this.baseFov + (effectiveBoost - 1) * 3;
      this.targetFov = Math.min(boostFov, this.baseFov + 8);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
