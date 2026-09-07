// INPUT MANAGER - MOBILE OPTIMIZED
export class InputManager {
  constructor() {
    this.actions = new Set();
    this.queued = new Set();
    this.pressedThisFrame = new Set();
    this.justPressed = new Set();
    this._lastInputTime = 0;

    this.keyMap = {
      'ArrowLeft': 'left',
      'a': 'left',
      'A': 'left',
      'ArrowRight': 'right',
      'd': 'right',
      'D': 'right',
      'ArrowUp': 'jump',
      'w': 'jump',
      'W': 'jump',
      ' ': 'jump',
      'ArrowDown': 'slide',
      's': 'slide',
      'S': 'slide',
      'Escape': 'pause',
      'p': 'pause',
      'P': 'pause'
    };

    this.setupKeyboard();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const action = this.keyMap[e.key];
      if (action) {
        // Only add if NOT already in actions (prevents key repeat)
        if (!this.actions.has(action)) {
          this.pressedThisFrame.add(action);
          this.actions.add(action);
          this._lastInputTime = performance.now();
        }
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = this.keyMap[e.key];
      if (action) {
        this.actions.delete(action);
        e.preventDefault();
      }
    });
  }

  consume(action) {
    if (this.pressedThisFrame.has(action)) {
      this.pressedThisFrame.delete(action);
      return true;
    }
    if (this.queued.has(action)) {
      this.queued.delete(action);
      return true;
    }
    return false;
  }

  isDown(action) {
    return this.actions.has(action);
  }

  onSwipeLeft() {
    // Only add if no other swipe input is currently queued (prevents double-fire)
    if (this.queued.size === 0 || !Array.from(this.queued).some(a => a.startsWith('swipe'))) {
      this.queued.add('swipeLeft');
      this._lastInputTime = performance.now();
    }
  }

  onSwipeRight() {
    if (this.queued.size === 0 || !Array.from(this.queued).some(a => a.startsWith('swipe'))) {
      this.queued.add('swipeRight');
      this._lastInputTime = performance.now();
    }
  }

  onSwipeUp() {
    if (this.queued.size === 0 || !Array.from(this.queued).some(a => a.startsWith('swipe'))) {
      this.queued.add('swipeUp');
      this._lastInputTime = performance.now();
    }
  }

  onSwipeDown() {
    if (this.queued.size === 0 || !Array.from(this.queued).some(a => a.startsWith('swipe'))) {
      this.queued.add('swipeDown');
      this._lastInputTime = performance.now();
    }
  }

  onButtonPress(action) {
    if (this.queued.size === 0 || !Array.from(this.queued).some(a => a.startsWith('swipe') || a.startsWith('button'))) {
      this.queued.add(action);
      this._lastInputTime = performance.now();
    }
  }

  endFrame() {
    this.pressedThisFrame.clear();
  }

  reset() {
    this.actions.clear();
    this.queued.clear();
    this.pressedThisFrame.clear();
    this.justPressed.clear();
  }
}
