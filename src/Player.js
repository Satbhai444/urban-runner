// PLAYER - MOBILE OPTIMIZED
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getCharacter, getBoard, loadProgress } from './Characters.js';

export class Player {
  constructor(app) {
    this.app = app;
    this.quality = app.quality;
    this.isMobile = app.isMobile;
    this.laneWidth = 3;
    this.lanes = [-this.laneWidth, 0, this.laneWidth];
    this.currentLane = 1;
    this.targetX = this.lanes[1]; // Explicitly set to center
    this.runTime = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.jumpVelocity = 0;
    this.y = 0;
    this.slideTime = 0;
    this.animState = 'running';

    this.maxHealth = 2;
    this.health = 2;
    this.invincible = false;
    this.invincibleTime = 0;

    this.hasSkateboard = false;
    this.skateboardTime = 0;
    this.skateboardDuration = 10;
    this.skateboardBroken = false;
    this.breakTime = 0;
    this.lastTapTime = 0;
    this.tapCount = 0;

    this.currentCharacter = null;
    this.body = null;
    this.collider = null;
    this.brokenPieces = [];

    this.glbScene = null;
    this.isGLBCharacter = false;
    this.glbMesh = null;

    this.createMesh();
    this.createPhysics();
    this.loadGLBModel();
  }

  loadGLBModel() {
    const loader = new GLTFLoader();
    loader.load('./models/michael.glb', (gltf) => {
      this.glbScene = gltf.scene;
      if (this.currentCharacter && this.currentCharacter.useGLB) {
        this.rebuildCharacter(this.currentCharacter);
      }
    }, undefined, (err) => {
      console.error('Failed to load GLB model:', err);
    });
  }

  setCharacter(character) {
    this.currentCharacter = character;
    this.rebuildCharacter(character);
  }

  rebuildCharacter(character) {
    const oldPos = this.group ? this.group.position.clone() : new THREE.Vector3();
    const oldY = this.y;
    const oldLane = this.currentLane;

    if (this.group) {
      this.app.scene.remove(this.group);
      this.group = null;
    }

    this.createMeshWithColors(character);
    this.group.position.copy(oldPos);
    this.y = oldY;
    this.currentLane = oldLane;
    this.targetX = this.lanes[this.currentLane];
  }

  createMesh() {
    const progress = loadProgress();
    const char = getCharacter(progress.selectedCharacter);
    this.currentCharacter = char;
    this.createMeshWithColors(char);
  }

  createMeshWithColors(character) {
    this.group = new THREE.Group();
    const useShadows = this.quality === 'high' && !this.isMobile;
    const c = character.colors || {};

    if (character.useGLB && this.glbScene) {
      this.isGLBCharacter = true;
      this.glbMesh = this.glbScene.clone();
      
      this.glbMesh.scale.set(1, 1, 1);
      this.glbMesh.position.y = 1; 
      
      if (useShadows) {
        this.glbMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
          }
        });
      }
      
      this.group.add(this.glbMesh);
    } else {
      this.isGLBCharacter = false;
      this.glbMesh = null;
      
      const Mat = this.quality === 'low'
        ? THREE.MeshLambertMaterial
        : THREE.MeshLambertMaterial;

      const skinMat = new Mat({ color: c.skin || 0xffe0bd });
      const shirtMat = new Mat({ color: c.shirt || 0xff0000 });
      const pantsMat = new Mat({ color: c.pants || 0x0000ff });
      const hairMat = new Mat({ color: c.hair || 0x000000 });

      const emissiveMat = new THREE.MeshBasicMaterial({ color: c.shirt || 0xff0000 });
      const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyeBlackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

      this.torso = new THREE.Group();
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.4), shirtMat);
      if (useShadows) torso.castShadow = true;
      this.torso.add(torso);
      this.group.add(this.torso);
      this.torso.position.y = 1.1;

      this.head = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), skinMat);
      if (useShadows) head.castShadow = true;
      this.head.add(head);

      if (this.quality !== 'low') {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.27, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2),
          hairMat
        );
        hair.position.y = 0.05;
        this.head.add(hair);
      }

      [-1, 1].forEach(side => {
        const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeWhiteMat);
        eyeWhite.position.set(side * 0.08, 0.05, 0.22);
        this.head.add(eyeWhite);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeBlackMat);
        eye.position.set(side * 0.08, 0.05, 0.27);
        this.head.add(eye);
      });

      if (this.quality !== 'low') {
        const headphone = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.04, 6, 12), emissiveMat);
        headphone.rotation.x = Math.PI / 2;
        this.head.add(headphone);

        [-1, 1].forEach(side => {
          const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 6), emissiveMat);
          ear.position.set(side * 0.27, 0, 0);
          ear.rotation.z = Math.PI / 2;
          this.head.add(ear);
        });
      }

      this.head.position.y = 1.7;
      this.group.add(this.head);

      this.leftArm = new THREE.Group();
      const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), shirtMat);
      if (useShadows) leftUpper.castShadow = true;
      leftUpper.position.y = -0.25;
      this.leftArm.add(leftUpper);
      this.leftForearm = new THREE.Group();
      this.leftForearm.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.45, 0.13), skinMat));
      this.leftForearm.children[0].position.y = -0.22;
      this.leftForearm.position.y = -0.5;
      this.leftArm.add(this.leftForearm);
      this.leftArm.position.set(-0.4, 1.4, 0);
      this.group.add(this.leftArm);

      this.rightArm = new THREE.Group();
      const rightUpper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), shirtMat);
      if (useShadows) rightUpper.castShadow = true;
      rightUpper.position.y = -0.25;
      this.rightArm.add(rightUpper);
      this.rightForearm = new THREE.Group();
      this.rightForearm.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.45, 0.13), skinMat));
      this.rightForearm.children[0].position.y = -0.22;
      this.rightForearm.position.y = -0.5;
      this.rightArm.add(this.rightForearm);
      this.rightArm.position.set(0.4, 1.4, 0);
      this.group.add(this.rightArm);

      this.leftLeg = new THREE.Group();
      const lUL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), pantsMat);
      if (useShadows) lUL.castShadow = true;
      lUL.position.y = -0.25;
      this.leftLeg.add(lUL);
      this.leftLowerLeg = new THREE.Group();
      this.leftLowerLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), pantsMat));
      this.leftLowerLeg.children[0].position.y = -0.25;
      this.leftLowerLeg.position.y = -0.5;
      this.leftLeg.add(this.leftLowerLeg);
      this.leftLeg.position.set(-0.15, 0.75, 0);
      this.group.add(this.leftLeg);

      this.rightLeg = new THREE.Group();
      const rUL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), pantsMat);
      if (useShadows) rUL.castShadow = true;
      rUL.position.y = -0.25;
      this.rightLeg.add(rUL);
      this.rightLowerLeg = new THREE.Group();
      this.rightLowerLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), pantsMat));
      this.rightLowerLeg.children[0].position.y = -0.25;
      this.rightLowerLeg.position.y = -0.5;
      this.rightLeg.add(this.rightLowerLeg);
      this.rightLeg.position.set(0.15, 0.75, 0);
      this.group.add(this.rightLeg);
    }

    this.trail = [];
    const trailCount = this.quality === 'low' ? 4 : 6;
    for (let i = 0; i < trailCount; i++) {
      const trailColor = (c && c.shirt) !== undefined ? c.shirt : 0xffffff;
      const trailMat = new THREE.MeshBasicMaterial({ color: trailColor, transparent: true, opacity: 0.3 });
      const trail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), trailMat);
      trail.visible = false;
      this.app.scene.add(trail);
      this.trail.push({ mesh: trail, life: 0, maxLife: 0.4 });
    }
    this.trailIndex = 0;
    this.trailTimer = 0;

    this.group.position.set(0, 0, 0);
    this.app.scene.add(this.group);
  }

  createPhysics() {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 1, 0)
      .lockRotations();
    this.body = this.app.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.8, 0.3)
      .setRestitution(0).setFriction(0);
    this.collider = this.app.world.createCollider(colliderDesc, this.body);
  }

  registerTap() {
    const now = performance.now();
    if (now - this.lastTapTime < 350) {
      this.onDoubleTap();
    }
    this.lastTapTime = now;
  }

  onDoubleTap() {
    if (!this.hasSkateboard && !this.skateboardBroken && this.health > 0) {
      this.activateSkateboard();
    }
  }

  activateSkateboard() {
    this.hasSkateboard = true;
    this.skateboardTime = this.skateboardDuration;
    this.animState = 'skating';
    this.app.audio?.playSkateboardActivate();

    const progress = loadProgress();
    const board = getBoard(progress.selectedBoard);
    this.skateboardDuration = board.duration;
    this.skateboardTime = board.duration;

    this.skateboardMesh = this.createSkateboardMesh(board);
    this.skateboardMesh.position.set(0, 0.15, 0);
    this.group.add(this.skateboardMesh);

    this.invincible = true;
    this.app.game.speedBoost = 1.3;
    this.app.ui.updateSkateBar(100);
  }

  createSkateboardMesh(board) {
    const group = new THREE.Group();
    const deckMat = new THREE.MeshLambertMaterial({ color: board.deckColor });
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const glowMat = new THREE.MeshBasicMaterial({ color: board.color });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.9), deckMat);
    group.add(deck);

    const wheelGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6);
    [-0.35, 0.35].forEach(z => {
      [-0.22, 0.22].forEach(x => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(x, -0.08, z);
        wheel.rotation.x = Math.PI / 2;
        group.add(wheel);
      });
    });

    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.95), glowMat);
    glow.position.y = -0.05;
    group.add(glow);

    return group;
  }

  breakSkateboard() {
    if (!this.hasSkateboard) return;
    this.hasSkateboard = false;
    this.skateboardBroken = true;
    this.breakTime = 0;
    this.invincible = false;
    this.app.game.speedBoost = 1.0;
    this.app.ui.updateSkateBar(0);

    if (this.skateboardMesh) {
      this.group.remove(this.skateboardMesh);
      this.skateboardMesh = null;
    }

    this.spawnBrokenBoardPieces();
  }

  spawnBrokenBoardPieces() {
    const progress = loadProgress();
    const board = getBoard(progress.selectedBoard);
    const deckMat = new THREE.MeshLambertMaterial({ color: board.deckColor });

    const pieceCount = this.quality === 'low' ? 2 : 4;
    for (let i = 0; i < pieceCount; i++) {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.35), deckMat);
      piece.position.copy(this.group.position);
      piece.position.y += 0.3;
      piece.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 5
      );
      piece.userData.angularVel = new THREE.Vector3(
        Math.random() * 5,
        Math.random() * 5,
        Math.random() * 5
      );
      piece.userData.life = 1.0;
      this.app.scene.add(piece);
      this.brokenPieces.push(piece);
    }
  }

  takeDamage() {
    if (this.invincible) return false;

    if (this.hasSkateboard) {
      this.breakSkateboard();
      this.app.ui.showSkateboardBroken();
      this.app.camera.shake(0.3, 0.3);
      return false;
    }

    this.health--;
    this.invincible = true;
    this.invincibleTime = 1.5;
    this.app.audio?.playHit();

    if (this.health <= 0) {
      this.animState = 'hit';
      return true;
    } else {
      this.animState = 'hit';
      this.app.ui.showWarning();
      this.app.camera.shake(0.4, 0.3);
      return false;
    }
  }

  reset() {
    this.currentLane = 1;
    this.targetX = this.lanes[1];
    this.isJumping = false;
    this.isSliding = false;
    this.jumpVelocity = 0;
    this.y = 0;
    this.runTime = 0;
    this.slideTime = 0;
    this.breakTime = 0;
    this.health = 2;
    this.invincible = false;
    this.invincibleTime = 0;
    this.hasSkateboard = false;
    this.skateboardTime = 0;
    this.skateboardBroken = false;
    this.lastTapTime = 0;
    this.tapCount = 0;
    this.laneCooldown = 0;
    this.animState = 'running';

    if (this.skateboardMesh) {
      this.group.remove(this.skateboardMesh);
      this.skateboardMesh = null;
    }

    for (const piece of this.brokenPieces) {
      this.app.scene.remove(piece);
    }
    this.brokenPieces = [];

    if (this.body) {
      this.body.setTranslation({ x: 0, y: 1, z: 0 }, true);
      this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    this.group.position.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    this.group.rotation.set(0, 0, 0);
    this.group.visible = true;
    this.resetAnimation();
    this.trail.forEach(t => { t.life = 0; t.mesh.visible = false; });

    this.app.game.speedBoost = 1.0;
    this.app.ui.updateHearts(2);
    this.app.ui.updateSkateBar(0);
  }

  resetAnimation() {
    if (!this.isGLBCharacter) {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftLowerLeg.rotation.x = 0;
      this.rightLowerLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftForearm.rotation.x = 0;
      this.rightForearm.rotation.x = 0;
      this.torso.rotation.x = 0;
      this.torso.rotation.z = 0;
      this.head.rotation.x = 0;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.set(0, 0, 0);
    }
  }

  update(delta) {
    const input = this.app.input;
    const speed = this.app.game.currentSpeed * (this.app.game.speedBoost || 1);

    this.laneCooldown = (this.laneCooldown || 0) - delta;

    if (this.laneCooldown <= 0) {
      const leftInput = input.consume('left') || input.consume('swipeLeft');
      const rightInput = input.consume('right') || input.consume('swipeRight');

      if (leftInput && rightInput) {
        // Ambiguous - skip this frame
      } else if (leftInput && this.currentLane > 0) {
        this.currentLane--;
        this.targetX = this.lanes[this.currentLane];
        this.laneCooldown = 0.2;
        this.app.audio?.playLaneSwitch();
      } else if (rightInput && this.currentLane < 2) {
        this.currentLane++;
        this.targetX = this.lanes[this.currentLane];
        this.laneCooldown = 0.2;
        this.app.audio?.playLaneSwitch();
      }
    }

    if ((input.consume('jump') || input.consume('swipeUp')) && !this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.animState = 'jumping';
      this.jumpVelocity = 12 * (this.currentCharacter?.stats.jump || 1);
      this.app.audio?.playJump();
    }

    if (input.consume('slide') || input.consume('swipeDown')) {
      if (!this.isSliding && !this.isJumping) {
        this.isSliding = true;
        this.animState = 'sliding';
        this.slideTime = 0;
        this.app.audio?.playSlide();
      }
    }

    if (this.isJumping) {
      this.y += this.jumpVelocity * delta;
      this.jumpVelocity -= 25 * delta;
      if (this.y <= 0) {
        this.y = 0;
        this.isJumping = false;
        if (!this.hasSkateboard) this.animState = 'running';
        this.jumpVelocity = 0;
      }
    }

    if (this.isSliding) {
      this.slideTime += delta;
      this.group.scale.y = 0.5;
      this.group.position.y = -0.3;
      if (this.slideTime > 0.8) {
        this.isSliding = false;
        this.group.scale.y = 1;
        this.group.position.y = 0;
        if (!this.hasSkateboard) this.animState = 'running';
      }
    } else {
      this.group.position.y = this.y;
    }

    if (this.skateboardBroken) {
      this.breakTime += delta;
      if (this.breakTime > 0.3) {
        this.skateboardBroken = false;
        this.animState = 'running';
      }
    }

    if (this.hasSkateboard) {
      this.skateboardTime -= delta;
      const percent = (this.skateboardTime / this.skateboardDuration) * 100;
      this.app.ui.updateSkateBar(Math.max(0, percent));
      if (this.skateboardTime <= 0) this.deactivateSkateboard();
    }

    if (this.invincible && !this.hasSkateboard) {
      this.invincibleTime -= delta;
      this.group.visible = Math.floor(this.invincibleTime * 10) % 2 === 0;
      if (this.invincibleTime <= 0) {
        this.invincible = false;
        this.group.visible = true;
      }
    } else {
      this.group.visible = true;
    }

    const laneSpeed = 12;
    const currentX = this.group.position.x;
    this.group.position.x += (this.targetX - currentX) * laneSpeed * delta;

    this.animateCharacter(delta, speed);

    const leanAmount = (this.targetX - currentX) * 0.3;
    if (!this.isGLBCharacter) {
      this.torso.rotation.z = -leanAmount * 0.1;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.z = -leanAmount * 0.1;
    }

    this.body.setTranslation({
      x: this.group.position.x,
      y: this.group.position.y + 1,
      z: this.group.position.z
    }, true);
    this.body.setLinvel({
      x: (this.targetX - currentX) * 5,
      y: this.isJumping ? this.jumpVelocity : 0,
      z: -speed
    }, true);

    this.updateTrail(delta);
    this.updateBrokenPieces(delta);
  }

  updateBrokenPieces(delta) {
    for (let i = this.brokenPieces.length - 1; i >= 0; i--) {
      const piece = this.brokenPieces[i];
      piece.position.x += piece.userData.velocity.x * delta;
      piece.position.y += piece.userData.velocity.y * delta;
      piece.position.z += piece.userData.velocity.z * delta;
      piece.userData.velocity.y -= 15 * delta;

      piece.rotation.x += piece.userData.angularVel.x * delta;
      piece.rotation.y += piece.userData.angularVel.y * delta;
      piece.rotation.z += piece.userData.angularVel.z * delta;

      piece.userData.life -= delta;
      if (piece.userData.life <= 0) {
        this.app.scene.remove(piece);
        this.brokenPieces.splice(i, 1);
      }
    }
  }

  deactivateSkateboard() {
    this.hasSkateboard = false;
    this.skateboardTime = 0;
    this.invincible = false;
    this.app.game.speedBoost = 1.0;
    this.app.ui.updateSkateBar(0);
    this.animState = 'running';
    if (this.skateboardMesh) {
      this.group.remove(this.skateboardMesh);
      this.skateboardMesh = null;
    }
  }

  animateCharacter(delta, speed) {
    this.runTime += delta * (speed / 10);

    if (this.animState === 'skating' && this.hasSkateboard) {
      this.animateSkating();
    } else if (this.isJumping) {
      this.animateJumping();
    } else if (this.isSliding) {
      this.animateSliding();
    } else if (this.animState === 'hit') {
      this.animateHit();
    } else {
      this.animateRunning();
    }
  }

  animateRunning() {
    const t = this.runTime;
    const stride = 1.4;
    
    if (!this.isGLBCharacter) {
      this.leftLeg.rotation.x = Math.sin(t * stride) * 0.7;
      this.rightLeg.rotation.x = -Math.sin(t * stride) * 0.7;
      this.leftLowerLeg.rotation.x = Math.max(0, -Math.sin(t * stride) - 0.3) * 0.7;
      this.rightLowerLeg.rotation.x = Math.max(0, Math.sin(t * stride) - 0.3) * 0.7;
      this.leftArm.rotation.x = -Math.sin(t * stride) * 0.9;
      this.rightArm.rotation.x = Math.sin(t * stride) * 0.9;
      this.leftForearm.rotation.x = -0.4 - Math.abs(Math.sin(t * stride)) * 0.3;
      this.rightForearm.rotation.x = -0.4 - Math.abs(Math.sin(t * stride)) * 0.3;
      this.torso.rotation.x = 0.2;
      this.head.rotation.x = -0.1;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.x = 0.1;
    }
    
    this.group.position.y = this.y + Math.abs(Math.sin(t * stride * 2)) * 0.06;
  }

  animateJumping() {
    if (!this.isGLBCharacter) {
      this.leftLeg.rotation.x = -1.0;
      this.rightLeg.rotation.x = -1.0;
      this.leftLowerLeg.rotation.x = -1.4;
      this.rightLowerLeg.rotation.x = -1.4;
      this.leftArm.rotation.x = -2.5;
      this.rightArm.rotation.x = -2.5;
      this.leftForearm.rotation.x = -0.6;
      this.rightForearm.rotation.x = -0.6;
      this.torso.rotation.x = 0.1;
      this.head.rotation.x = 0.2;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.x = 0;
    }
  }

  animateSliding() {
    if (!this.isGLBCharacter) {
      this.leftLeg.rotation.x = 0.6;
      this.rightLeg.rotation.x = 0.6;
      this.leftArm.rotation.x = -0.7;
      this.rightArm.rotation.x = -0.7;
      this.leftForearm.rotation.x = 0;
      this.rightForearm.rotation.x = 0;
      this.torso.rotation.x = 0.4;
      this.head.rotation.x = 0.3;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.x = 0.2;
    }
  }

  animateSkating() {
    const t = this.runTime;
    
    if (!this.isGLBCharacter) {
      this.leftLeg.rotation.x = 0.4;
      this.rightLeg.rotation.x = 0.4;
      this.leftLowerLeg.rotation.x = 0.4;
      this.rightLowerLeg.rotation.x = 0.4;
      this.leftArm.rotation.x = -0.9;
      this.rightArm.rotation.x = -0.9;
      this.leftForearm.rotation.x = -0.3;
      this.rightForearm.rotation.x = -0.3;
      this.torso.rotation.x = 0.1;
      this.head.rotation.x = -0.1;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.x = 0.1;
      this.glbMesh.rotation.z = Math.sin(t * 2) * 0.1;
    }
    
    this.group.position.y = this.y + Math.sin(t * 4) * 0.1;
  }

  animateHit() {
    if (!this.isGLBCharacter) {
      this.leftArm.rotation.x = -2.3;
      this.rightArm.rotation.x = -2.3;
      this.leftLeg.rotation.x = 0.4;
      this.rightLeg.rotation.x = 0.4;
      this.torso.rotation.x = -0.2;
      this.head.rotation.x = -0.3;
    } else if (this.glbMesh) {
      this.glbMesh.rotation.x = -0.2;
    }
  }

  updateTrail(delta) {
    const interval = this.quality === 'low' ? 0.08 : 0.05;
    this.trailTimer += delta;
    if (this.trailTimer >= interval) {
      this.trailTimer = 0;
      this.trailIndex = (this.trailIndex + 1) % this.trail.length;
      const trail = this.trail[this.trailIndex];
      trail.mesh.position.set(this.group.position.x, this.group.position.y + 0.3, this.group.position.z + 0.3);
      trail.mesh.visible = true;
      trail.life = trail.maxLife;
    }
    for (const t of this.trail) {
      if (t.life > 0) {
        t.life -= delta;
        const ratio = t.life / t.maxLife;
        t.mesh.material.opacity = ratio * 0.3;
        t.mesh.scale.setScalar(ratio);
        if (t.life <= 0) t.mesh.visible = false;
      }
    }
  }

  getPosition() { return this.group.position.clone(); }

  getBoundingBox() {
    const pos = this.group.position;
    return {
      minX: pos.x - 0.4, maxX: pos.x + 0.4,
      minY: pos.y - 0.3, maxY: pos.y + 2.0,
      minZ: pos.z - 0.4, maxZ: pos.z + 0.4
    };
  }

  hasSkateboardActive() { return this.hasSkateboard; }
}
