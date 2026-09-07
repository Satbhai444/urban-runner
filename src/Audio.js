// AUDIO SYSTEM - Web Audio API based, no external files needed
// Generates all sounds procedurally using oscillators + envelopes

export class AudioManager {
  constructor(app) {
    this.app = app;
    this.enabled = true;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.musicVolume = 0.25;
    this.sfxVolume = 0.4;
    this.masterVolume = 0.8;

    // Music state
    this.musicPlaying = false;
    this.musicNodes = [];
    this.musicTimer = null;
    this.musicBeat = 0;

    // Load user preferences
    try {
      const prefs = JSON.parse(localStorage.getItem('nr_audio_prefs') || '{}');
      this.sfxEnabled = prefs.sfxEnabled !== false;
      this.musicEnabled = prefs.musicEnabled !== false;
    } catch (e) {}
  }

  // Initialize audio context (must be called after user interaction)
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Audio not supported:', e);
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  savePrefs() {
    try {
      localStorage.setItem('nr_audio_prefs', JSON.stringify({
        sfxEnabled: this.sfxEnabled,
        musicEnabled: this.musicEnabled
      }));
    } catch (e) {}
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    if (this.sfxGain) this.sfxGain.gain.value = enabled ? this.sfxVolume : 0;
    this.savePrefs();
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (enabled) this.startMusic();
    else this.stopMusic();
    this.savePrefs();
  }

  // === SOUND GENERATORS ===
  // Each sound is synthesized using oscillators with envelopes

  playJump() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playSlide() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // White noise burst (filtered)
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  playCoin(coinType = 'bronze') {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // Higher pitch for rarer coins
    const pitches = {
      bronze: 880,
      silver: 1100,
      gold: 1320,
      diamond: 1760
    };
    const baseFreq = pitches[coinType] || 880;

    // Two-tone bell
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, t);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 3, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  playCombo(level) {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // Rising arpeggio
    const notes = [523, 659, 784, 1047]; // C, E, G, C
    const startNote = Math.min(level - 3, notes.length - 1);
    const freq = notes[Math.max(0, startNote)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 2, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playHit() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // Low thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);

    // Add noise burst
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  playGameOver() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // Sad descending tones
    const notes = [392, 330, 262, 196]; // G, E, C, G
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.2);
      osc.stop(t + i * 0.2 + 0.4);
    });
  }

  playSkateboardActivate() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // Whoosh + power-up
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, t);
    osc1.frequency.exponentialRampToValueAtTime(800, t + 0.3);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(50, t);
    osc2.frequency.exponentialRampToValueAtTime(400, t + 0.3);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.4);
    osc2.stop(t + 0.4);
  }

  playSkateboardBreak() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;

    // Crash sound (filtered noise)
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playLaneSwitch() {
    if (!this.ctx || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // === MUSIC - Simple synthwave loop ===
  startMusic() {
    if (!this.ctx || !this.musicEnabled || this.musicPlaying) return;

    this.musicPlaying = true;
    this.musicBeat = 0;
    this.scheduleMusic();
  }

  scheduleMusic() {
    if (!this.musicPlaying || !this.ctx) return;

    const bpm = 120;
    const beatDuration = 60 / bpm; // 0.5s per beat
    const lookahead = 0.1; // Schedule ahead

    // Schedule next 4 beats
    for (let i = 0; i < 4; i++) {
      const time = this.ctx.currentTime + i * beatDuration;
      this.playMusicBeat(this.musicBeat + i, time);
    }

    this.musicBeat += 4;
    this.musicTimer = setTimeout(() => this.scheduleMusic(), 4 * beatDuration * 1000 - 100);
  }

  playMusicBeat(beat, time) {
    if (!this.ctx) return;

    // Bassline pattern (16-step)
    const bassNotes = [110, 0, 110, 0, 138, 0, 110, 0, 110, 0, 165, 0, 138, 0, 110, 0];
    const bassFreq = bassNotes[beat % 16];

    if (bassFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = bassFreq;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 5;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.4);
    }

    // Hi-hat on every beat
    const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const hatData = hatBuffer.getChannelData(0);
    for (let i = 0; i < hatData.length; i++) {
      hatData[i] = (Math.random() * 2 - 1) * (1 - i / hatData.length);
    }
    const hat = this.ctx.createBufferSource();
    hat.buffer = hatBuffer;
    const hatFilter = this.ctx.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.value = 7000;
    const hatGain = this.ctx.createGain();
    hatGain.gain.setValueAtTime(0.04, time);
    hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    hat.connect(hatFilter);
    hatFilter.connect(hatGain);
    hatGain.connect(this.musicGain);
    hat.start(time);

    // Kick on beats 0, 4, 8, 12
    if (beat % 4 === 0) {
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(120, time);
      kick.frequency.exponentialRampToValueAtTime(40, time + 0.1);
      kickGain.gain.setValueAtTime(0.4, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      kick.connect(kickGain);
      kickGain.connect(this.musicGain);
      kick.start(time);
      kick.stop(time + 0.15);
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    // Fade out existing music nodes
    if (this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
      }, 500);
    }
  }
}
