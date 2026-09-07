// UI MANAGER - All Screens (Home, Settings, Characters, Shop, Game, Pause, GameOver)
import * as THREE from 'three';
import { CHARACTERS, SKATEBOARDS, loadProgress, saveProgress, getCharacter, getBoard, isUnlocked } from './Characters.js';

export class UI {
  constructor(app) {
    this.app = app;
    this.progress = loadProgress();
    this.currentScreen = 'home';
    this.selectedIndex = 0;
    this.charIndex = 0;
    this.boardIndex = 0;
    this.selectedTab = 'characters';

    this.createAllScreens();
    this.showScreen('home');
  }

  createAllScreens() {
    const container = document.body;

    // === HOME SCREEN ===
    this.homeScreen = document.createElement('div');
    this.homeScreen.id = 'screen-home';
    this.homeScreen.className = 'menu-screen';
    this.homeScreen.innerHTML = `
      <div class="menu-bg"></div>
      <div class="menu-content">
        <div class="menu-logo">
          <div class="game-title">URBAN</div>
          <div class="game-title-sub">RUNNER</div>
        </div>
        <div class="menu-buttons">
          <button class="menu-btn play-btn" id="btn-play">
            <span class="btn-icon">▶</span>
            <span class="btn-text">PLAY</span>
          </button>
          <button class="menu-btn char-btn" id="btn-chars">
            <span class="btn-icon">👤</span>
            <span class="btn-text">CHARACTERS</span>
          </button>
          <button class="menu-btn shop-btn" id="btn-shop">
            <span class="btn-icon">🛒</span>
            <span class="btn-text">SHOP</span>
          </button>
          <button class="menu-btn settings-btn" id="btn-settings">
            <span class="btn-icon">⚙</span>
            <span class="btn-text">SETTINGS</span>
          </button>
        </div>
        <div class="menu-stats">
          <div class="stat-item">
            <span class="stat-icon">🪙</span>
            <span class="stat-value" id="home-coins">${this.progress.totalCoins.toLocaleString()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🏆</span>
            <span class="stat-value" id="home-high">${this.progress.highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(this.homeScreen);

    // === CHARACTER SELECT SCREEN ===
    this.charScreen = document.createElement('div');
    this.charScreen.id = 'screen-chars';
    this.charScreen.className = 'menu-screen';
    this.charScreen.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="chars-back">← BACK</button>
        <div class="screen-title">CHARACTERS</div>
        <div class="coins-display"><span>🪙</span> <span id="chars-coins">${this.progress.totalCoins.toLocaleString()}</span></div>
      </div>
      <div class="char-preview">
        <div class="char-model" id="char-preview-model"></div>
        <div class="char-info">
          <div class="char-name" id="char-name">NEON</div>
          <div class="char-stats">
            <div class="stat-bar"><span>⚡ Speed</span><div class="bar"><div class="bar-fill" id="stat-speed"></div></div></div>
            <div class="stat-bar"><span>⬆ Jump</span><div class="bar"><div class="bar-fill" id="stat-jump"></div></div></div>
            <div class="stat-bar"><span>🍀 Luck</span><div class="bar"><div class="bar-fill" id="stat-luck"></div></div></div>
          </div>
          <div class="char-cost" id="char-cost">UNLOCKED</div>
        </div>
      </div>
      <div class="char-carousel" id="char-carousel"></div>
      <div class="char-actions">
        <button class="action-btn unlock-btn" id="char-unlock">UNLOCK</button>
        <button class="action-btn select-btn" id="char-select">SELECT</button>
      </div>
    `;
    container.appendChild(this.charScreen);

    // === SHOP SCREEN ===
    this.shopScreen = document.createElement('div');
    this.shopScreen.id = 'screen-shop';
    this.shopScreen.className = 'menu-screen';
    this.shopScreen.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="shop-back">← BACK</button>
        <div class="screen-title">SHOP</div>
        <div class="coins-display"><span>🪙</span> <span id="shop-coins">${this.progress.totalCoins.toLocaleString()}</span></div>
      </div>
      <div class="shop-tabs">
        <button class="tab-btn active" data-tab="boards">SKATEBOARDS</button>
        <button class="tab-btn" data-tab="characters">CHARACTERS</button>
      </div>
      <div class="shop-content" id="shop-content"></div>
    `;
    container.appendChild(this.shopScreen);

    // === SETTINGS SCREEN ===
    this.settingsScreen = document.createElement('div');
    this.settingsScreen.id = 'screen-settings';
    this.settingsScreen.className = 'menu-screen';
    this.settingsScreen.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" id="settings-back">← BACK</button>
        <div class="screen-title">SETTINGS</div>
        <div class="coins-display"></div>
      </div>
      <div class="settings-content">
        <div class="settings-group">
          <div class="settings-title">AUDIO</div>
          <div class="setting-item">
            <span>Music</span>
            <label class="toggle"><input type="checkbox" id="setting-music" checked><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-item">
            <span>Sound Effects</span>
            <label class="toggle"><input type="checkbox" id="setting-sfx" checked><span class="toggle-slider"></span></label>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-title">GRAPHICS</div>
          <div class="setting-item">
            <span>Quality</span>
            <select id="setting-quality">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="setting-item">
            <span>Particles</span>
            <label class="toggle"><input type="checkbox" id="setting-particles" checked><span class="toggle-slider"></span></label>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-title">DEVELOPERS</div>
          <div style="font-size: 14px; line-height: 1.4; color: #ccc;">
            <p style="margin: 5px 0;"><strong>Darshan Satbhai</strong></p>
            <p style="margin: 5px 0;">Creator & Lead Developer of Urban Runner</p>
            <a href="https://www.daarshannexaa.in/" target="_blank" style="color: #ffcc00; text-decoration: none; display: inline-block; margin-top: 5px;">Visit Portfolio</a>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-title">CONTROLS</div>
          <div class="control-hint">
            <span>← →</span> Move Lanes
          </div>
          <div class="control-hint">
            <span>SPACE</span> Jump
          </div>
          <div class="control-hint">
            <span>↓</span> Slide
          </div>
          <div class="control-hint">
            <span>DOUBLE TAP</span> Skateboard
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-title">RESET</div>
          <button class="reset-btn" id="btn-reset">RESET ALL PROGRESS</button>
        </div>
      </div>
    `;
    container.appendChild(this.settingsScreen);

    // === GAME HUD ===
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'game-hud';
    this.hudElement.className = 'game-hud';
    this.hudElement.innerHTML = `
      <div class="hud-top">
        <div class="hud-left">
          <button class="pause-btn" id="pause-btn">⏸</button>
          <div class="score-box">
            <div class="score-value" id="hud-score">0</div>
            <div class="score-label">SCORE</div>
          </div>
        </div>
        <div class="hud-right">
          <div class="coins-box">
            <span>🪙</span>
            <span id="hud-coins">0</span>
          </div>
          <div class="multiplier" id="hud-multi">x1</div>
        </div>
      </div>
      <div class="hud-bottom">
        <div class="hearts" id="hearts">
          <span class="heart">❤️</span>
          <span class="heart">❤️</span>
        </div>
        <div class="skateboard-bar" id="skate-bar">
          <div class="skate-icon">🛹</div>
          <div class="skate-fill"><div id="skate-progress"></div></div>
          <div class="skate-time" id="skate-time">0s</div>
        </div>
      </div>
      <div class="combo-popup" id="combo-popup"></div>
    `;
    container.appendChild(this.hudElement);

    // === PAUSE SCREEN ===
    this.pauseScreen = document.createElement('div');
    this.pauseScreen.id = 'screen-pause';
    this.pauseScreen.className = 'overlay-screen';
    this.pauseScreen.innerHTML = `
      <div class="pause-content">
        <div class="pause-title">PAUSED</div>
        <button class="pause-btn-item" id="pause-resume">▶ RESUME</button>
        <button class="pause-btn-item" id="pause-restart">🔄 RESTART</button>
        <button class="pause-btn-item" id="pause-menu">🏠 MENU</button>
      </div>
    `;
    container.appendChild(this.pauseScreen);

    // === GAME OVER SCREEN ===
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.id = 'screen-gameover';
    this.gameOverScreen.className = 'overlay-screen';
    this.gameOverScreen.innerHTML = `
      <div class="gameover-content">
        <div class="gameover-title">GAME OVER</div>
        <div class="gameover-score" id="go-score">0</div>
        <div class="gameover-coins" id="go-coins">+0 🪙</div>
        <div class="gameover-stats">
          <div class="go-stat"><span class="go-label">BEST</span><span class="go-value" id="go-high">0</span></div>
          <div class="go-stat"><span class="go-label">TOTAL</span><span class="go-value" id="go-total">0</span></div>
        </div>
        <div class="gameover-buttons">
          <button class="go-btn" id="go-home">🏠 MENU</button>
          <button class="go-btn primary" id="go-restart">▶ PLAY AGAIN</button>
        </div>
      </div>
    `;
    container.appendChild(this.gameOverScreen);

    // === REVIEW POPUP ===
    this.reviewPopup = document.createElement('div');
    this.reviewPopup.id = 'popup-review';
    this.reviewPopup.className = 'overlay-screen';
    this.reviewPopup.style.display = 'none';
    this.reviewPopup.style.zIndex = '200';
    this.reviewPopup.innerHTML = `
      <div class="gameover-content" style="text-align: center;">
        <div class="gameover-title" style="font-size: 24px; color: #ffcc00;">Enjoying the Game?</div>
        <div style="margin: 20px 0; font-size: 16px; color: #fff;">
          If you like this endless runner, please give us a ⭐ on GitHub!
        </div>
        <div class="gameover-buttons" style="flex-direction: column; gap: 15px;">
          <a href="https://github.com/Satbhai444/urban-runner" target="_blank" class="go-btn primary" id="btn-star-github" style="text-decoration: none; width: 100%; box-sizing: border-box;">⭐ STAR ON GITHUB</a>
          <a href="https://www.daarshannexaa.in/" target="_blank" class="go-btn" id="btn-portfolio" style="text-decoration: none; width: 100%; box-sizing: border-box;">👨‍💻 DEVELOPER PORTFOLIO</a>
          <button class="go-btn" id="btn-review-close" style="background: transparent; color: #aaa; border: none; font-size: 14px;">Maybe Later</button>
        </div>
      </div>
    `;
    container.appendChild(this.reviewPopup);

    this.bindEvents();
    this.updateCharCarousel();
    this.updateShop();
  }

  bindEvents() {
    // Home buttons
    document.getElementById('btn-play')?.addEventListener('click', () => this.startGame());
    document.getElementById('btn-chars')?.addEventListener('click', () => this.showScreen('characters'));
    document.getElementById('btn-shop')?.addEventListener('click', () => this.showScreen('shop'));
    document.getElementById('btn-settings')?.addEventListener('click', () => this.showScreen('settings'));

    // Character screen
    document.getElementById('chars-back')?.addEventListener('click', () => this.showScreen('home'));
    document.getElementById('char-unlock')?.addEventListener('click', () => this.unlockCharacter());
    document.getElementById('char-select')?.addEventListener('click', () => this.selectCharacter());

    // Shop
    document.getElementById('shop-back')?.addEventListener('click', () => this.showScreen('home'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedTab = e.target.dataset.tab;
        this.updateShop();
      });
    });

    // Settings
    document.getElementById('settings-back')?.addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-reset')?.addEventListener('click', () => this.resetProgress());

    // Audio settings
    const musicToggle = document.getElementById('setting-music');
    const sfxToggle = document.getElementById('setting-sfx');
    if (musicToggle) {
      musicToggle.checked = this.app.audio?.musicEnabled !== false;
      musicToggle.addEventListener('change', (e) => this.app.audio?.setMusicEnabled(e.target.checked));
    }
    if (sfxToggle) {
      sfxToggle.checked = this.app.audio?.sfxEnabled !== false;
      sfxToggle.addEventListener('change', (e) => this.app.audio?.setSfxEnabled(e.target.checked));
    }

    // Pause
    document.getElementById('pause-btn')?.addEventListener('click', () => this.app.pauseGame());
    document.getElementById('pause-resume')?.addEventListener('click', () => this.app.resumeGame());
    document.getElementById('pause-restart')?.addEventListener('click', () => this.app.restartGame());
    document.getElementById('pause-menu')?.addEventListener('click', () => this.goToMenu());

    // Game Over
    document.getElementById('go-home')?.addEventListener('click', () => this.goToMenu());
    document.getElementById('go-restart')?.addEventListener('click', () => this.app.restartGame());

    // Review Popup
    document.getElementById('btn-review-close')?.addEventListener('click', () => {
      document.getElementById('popup-review').style.display = 'none';
      document.getElementById('screen-gameover').style.display = 'flex'; // Bring back Game Over screen
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  handleKeyboard(e) {
    if (this.currentScreen === 'characters') {
      if (e.code === 'ArrowLeft') this.prevChar();
      if (e.code === 'ArrowRight') this.nextChar();
      if (e.code === 'Enter') this.selectCharacter();
    }
  }

  showScreen(screen) {
    // Hide all screens
    document.querySelectorAll('.menu-screen, .overlay-screen').forEach(s => s.style.display = 'none');
    this.hudElement.style.display = 'none';

    this.currentScreen = screen;

    switch (screen) {
      case 'home':
        this.homeScreen.style.display = 'flex';
        this.progress = loadProgress();
        document.getElementById('home-coins').textContent = this.progress.totalCoins.toLocaleString();
        document.getElementById('home-high').textContent = this.progress.highScore.toLocaleString();
        
        // Restore the actually selected character in case they previewed another
        if (this.app.player) {
          const selectedChar = getCharacter(this.progress.selectedCharacter);
          if (this.app.player.currentCharacter?.id !== selectedChar.id) {
            this.app.player.setCharacter(selectedChar);
          }
        }
        break;

      case 'characters':
        this.charScreen.style.display = 'flex';
        this.updateCharCarousel();
        this.previewChar(this.charIndex);
        break;

      case 'shop':
        this.shopScreen.style.display = 'flex';
        this.progress = loadProgress();
        document.getElementById('shop-coins').textContent = this.progress.totalCoins.toLocaleString();
        break;

      case 'settings':
        this.settingsScreen.style.display = 'flex';
        break;

      case 'game':
        this.hudElement.style.display = 'flex';
        this.updateHearts(2);
        this.updateSkateBar(0);
        break;

      case 'pause':
        this.pauseScreen.style.display = 'flex';
        break;

      case 'gameover':
        this.gameOverScreen.style.display = 'flex';
        break;
    }
  }

  // CHARACTER FUNCTIONS
  updateCharCarousel() {
    const carousel = document.getElementById('char-carousel');
    if (!carousel) return;

    carousel.innerHTML = CHARACTERS.map((char, i) => {
      const unlocked = this.progress.unlockedCharacters.includes(char.id);
      const selected = this.progress.selectedCharacter === char.id;
      return `
        <div class="char-thumb ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}" data-index="${i}">
          <div class="char-icon" style="background: linear-gradient(${char.colors.shirt}, ${char.colors.pants})">
            ${unlocked ? char.name[0] : '🔒'}
          </div>
        </div>
      `;
    }).join('');

    carousel.querySelectorAll('.char-thumb').forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        this.charIndex = i;
        this.previewChar(i);
        this.updateCharCarousel();
      });
    });
  }

  previewChar(index) {
    this.charIndex = index;
    const char = CHARACTERS[index];
    const unlocked = this.progress.unlockedCharacters.includes(char.id);

    document.getElementById('char-name').textContent = char.name.toUpperCase();
    document.getElementById('stat-speed').style.width = `${char.stats.speed * 33}%`;
    document.getElementById('stat-jump').style.width = `${char.stats.jump * 33}%`;
    document.getElementById('stat-luck').style.width = `${char.stats.luck * 33}%`;

    const costEl = document.getElementById('char-cost');
    const unlockBtn = document.getElementById('char-unlock');
    const selectBtn = document.getElementById('char-select');

    if (unlocked) {
      costEl.textContent = 'UNLOCKED';
      costEl.style.color = '#0f0';
      unlockBtn.style.display = 'none';
      selectBtn.style.display = this.progress.selectedCharacter === char.id ? 'none' : 'block';
    } else {
      costEl.textContent = `🔒 ${char.cost.toLocaleString()} 🪙`;
      costEl.style.color = '#ffd700';
      unlockBtn.style.display = 'block';
      unlockBtn.textContent = `UNLOCK (${char.cost.toLocaleString()} 🪙)`;
      unlockBtn.disabled = this.progress.totalCoins < char.cost;
      selectBtn.style.display = 'none';
    }

    // Update player preview in scene
    if (this.app.player) {
      this.app.player.setCharacter(char);
    }
  }

  prevChar() {
    this.charIndex = (this.charIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
    this.updateCharCarousel();
    this.previewChar(this.charIndex);
  }

  nextChar() {
    this.charIndex = (this.charIndex + 1) % CHARACTERS.length;
    this.updateCharCarousel();
    this.previewChar(this.charIndex);
  }

  unlockCharacter() {
    const char = CHARACTERS[this.charIndex];
    if (this.progress.totalCoins >= char.cost) {
      this.progress.totalCoins -= char.cost;
      this.progress.unlockedCharacters.push(char.id);
      saveProgress(this.progress);
      document.getElementById('chars-coins').textContent = this.progress.totalCoins.toLocaleString();
      document.getElementById('home-coins').textContent = this.progress.totalCoins.toLocaleString();
      this.previewChar(this.charIndex);
    }
  }

  selectCharacter() {
    const char = CHARACTERS[this.charIndex];
    if (this.progress.unlockedCharacters.includes(char.id)) {
      this.progress.selectedCharacter = char.id;
      saveProgress(this.progress);
      document.getElementById('char-select').style.display = 'none';
      this.showScreen('home');
    }
  }

  // SHOP FUNCTIONS
  updateShop() {
    const content = document.getElementById('shop-content');
    if (!content) return;

    if (this.selectedTab === 'boards') {
      content.innerHTML = SKATEBOARDS.map((board, i) => {
        const unlocked = this.progress.unlockedBoards.includes(board.id);
        const selected = this.progress.selectedBoard === board.id;
        return `
          <div class="shop-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}">
            <div class="shop-icon" style="background: ${board.color}">${unlocked ? '🛹' : '🔒'}</div>
            <div class="shop-info">
              <div class="shop-name">${board.name}</div>
              <div class="shop-desc">${board.duration}s Shield</div>
            </div>
            <div class="shop-action">
              ${unlocked
                ? `<button class="shop-btn ${selected ? 'selected' : ''}" data-action="select-board" data-index="${i}">${selected ? 'SELECTED' : 'SELECT'}</button>`
                : `<button class="shop-btn buy" data-action="buy-board" data-index="${i}">${board.cost.toLocaleString()} 🪙</button>`
              }
            </div>
          </div>
        `;
      }).join('');
    } else {
      content.innerHTML = CHARACTERS.map((char, i) => {
        const unlocked = this.progress.unlockedCharacters.includes(char.id);
        const selected = this.progress.selectedCharacter === char.id;
        return `
          <div class="shop-item ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}">
            <div class="shop-icon" style="background: linear-gradient(${char.colors.shirt}, ${char.colors.pants})">${unlocked ? char.name[0] : '🔒'}</div>
            <div class="shop-info">
              <div class="shop-name">${char.name}</div>
              <div class="shop-desc">${char.stats.speed > 1 ? '⚡' : ''}${char.stats.jump > 1 ? '⬆' : ''}${char.stats.luck > 1 ? '🍀' : ''} Stats</div>
            </div>
            <div class="shop-action">
              ${unlocked
                ? `<button class="shop-btn ${selected ? 'selected' : ''}" data-action="select-char" data-index="${i}">${selected ? 'SELECTED' : 'SELECT'}</button>`
                : `<button class="shop-btn buy" data-action="buy-char" data-index="${i}">${char.cost.toLocaleString()} 🪙</button>`
              }
            </div>
          </div>
        `;
      }).join('');
    }

    // Bind shop actions
    content.querySelectorAll('.shop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const index = parseInt(e.target.dataset.index);
        if (action === 'buy-board') this.buyBoard(index);
        if (action === 'buy-char') this.buyChar(index);
        if (action === 'select-board') this.selectBoard(index);
        if (action === 'select-char') this.selectChar(index);
      });
    });
  }

  buyBoard(index) {
    const board = SKATEBOARDS[index];
    if (this.progress.totalCoins >= board.cost) {
      this.progress.totalCoins -= board.cost;
      this.progress.unlockedBoards.push(board.id);
      saveProgress(this.progress);
      document.getElementById('shop-coins').textContent = this.progress.totalCoins.toLocaleString();
      document.getElementById('home-coins').textContent = this.progress.totalCoins.toLocaleString();
      this.updateShop();
    }
  }

  buyChar(index) {
    const char = CHARACTERS[index];
    if (this.progress.totalCoins >= char.cost) {
      this.progress.totalCoins -= char.cost;
      this.progress.unlockedCharacters.push(char.id);
      saveProgress(this.progress);
      document.getElementById('shop-coins').textContent = this.progress.totalCoins.toLocaleString();
      document.getElementById('home-coins').textContent = this.progress.totalCoins.toLocaleString();
      this.updateShop();
    }
  }

  selectBoard(index) {
    const board = SKATEBOARDS[index];
    if (this.progress.unlockedBoards.includes(board.id)) {
      this.progress.selectedBoard = board.id;
      saveProgress(this.progress);
      this.updateShop();
    }
  }

  selectChar(index) {
    const char = CHARACTERS[index];
    if (this.progress.unlockedCharacters.includes(char.id)) {
      this.progress.selectedCharacter = char.id;
      saveProgress(this.progress);
      this.updateShop();
    }
  }

  resetProgress() {
    if (confirm('Reset all progress? This cannot be undone!')) {
      localStorage.clear();
      this.progress = loadProgress();
      location.reload();
    }
  }

  // GAME HUD FUNCTIONS
  update(score, coins, speed) {
    document.getElementById('hud-score').textContent = score.toLocaleString();
    document.getElementById('hud-coins').textContent = coins;
    document.getElementById('hud-multi').textContent = `x${speed.toFixed(1)}`;
  }

  updateHearts(health) {
    const heartsEl = document.getElementById('hearts');
    if (heartsEl) {
      heartsEl.innerHTML = health >= 1 ? '❤️❤️' : health >= 0.5 ? '❤️🖤' : '🖤🖤';
    }
  }

  showDamage() {
    const heartsEl = document.getElementById('hearts');
    if (heartsEl) {
      heartsEl.style.animation = 'none';
      void heartsEl.offsetWidth;
      heartsEl.style.animation = 'shake 0.3s ease-in-out';
    }
  }

  updateSkateBar(percent) {
    const fill = document.getElementById('skate-progress');
    const bar = document.getElementById('skate-bar');
    const timeEl = document.getElementById('skate-time');

    if (fill) {
      fill.style.width = `${percent}%`;
      if (percent > 50) {
        fill.style.background = 'linear-gradient(90deg, #ff6b35, #ffab35)';
      } else if (percent > 25) {
        fill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
      } else {
        fill.style.background = 'linear-gradient(90deg, #ff4444, #ff6644)';
      }
    }
    if (bar) bar.style.opacity = percent > 0 ? '1' : '0.3';
    if (timeEl && this.app?.player) {
      const time = Math.ceil(this.app.player.skateboardTime);
      timeEl.textContent = `${time}s`;
    }
  }

  showCombo(count) {
    const popup = document.getElementById('combo-popup');
    if (popup) {
      popup.textContent = count >= 10 ? `🔥 COMBO x${Math.floor(count)}` : `COMBO x${Math.floor(count)}`;
      popup.classList.remove('show');
      void popup.offsetWidth;
      popup.classList.add('show');
    }
  }

  showWarning() {
    // Red flash
    const flash = document.createElement('div');
    flash.className = 'warning-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    // Warning text
    const text = document.createElement('div');
    text.className = 'warning-text';
    text.textContent = '⚠️ WARNING!';
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 800);

    // Update hearts
    this.updateHearts(this.app.player.health);
    this.showDamage();
  }

  showSkateboardBroken() {
    // Blue flash for skateboard break
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:200;box-shadow:inset 0 0 100px 50px rgba(0,200,255,0.5);animation:warnFlash 0.5s ease-out forwards;';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    // Text
    const text = document.createElement('div');
    text.style.cssText = 'position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);font-family:Russo One,sans-serif;font-size:2.5rem;font-weight:900;color:#00ffff;text-shadow:0 0 20px #00ffff;pointer-events:none;z-index:210;animation:warnText 0.8s ease-out forwards;';
    text.textContent = '💥 SKATEBOARD BROKEN!';
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 800);
  }

  // GAME FLOW
  startGame() {
    this.app.startGame();
  }

  goToMenu() {
    this.showScreen('home');
    this.app.goToMenu();
  }

  showGameOver(score, coins) {
    this.progress = loadProgress();

    // Check high score
    let isNewHigh = false;
    if (score > this.progress.highScore) {
      this.progress.highScore = score;
      isNewHigh = true;
    }

    // Update totals
    this.progress.totalCoins += coins;
    this.progress.totalScore += score;
    this.progress.gamesPlayed++;
    saveProgress(this.progress);

    // Update UI
    document.getElementById('go-score').textContent = score.toLocaleString();
    document.getElementById('go-coins').textContent = `+${coins} 🪙`;
    document.getElementById('go-high').textContent = this.progress.highScore.toLocaleString();
    document.getElementById('go-total').textContent = this.progress.totalScore.toLocaleString();

    if (isNewHigh) {
      document.getElementById('go-score').classList.add('new-high');
      document.getElementById('go-score').textContent = `${score.toLocaleString()} 🏆`;
    }

    this.showScreen('gameover');

    // Show Review Popup once
    if (!localStorage.getItem('nr_hasSeenReview_2') && this.progress.gamesPlayed >= 1) {
      setTimeout(() => {
        const popup = document.getElementById('popup-review');
        const goScreen = document.getElementById('screen-gameover');
        if (popup) {
          if (goScreen) goScreen.style.display = 'none'; // Hide Game Over screen behind it
          popup.style.display = 'flex';
          localStorage.setItem('nr_hasSeenReview_2', 'true');
        }
      }, 500); // Small delay before popup
    }
  }
}
