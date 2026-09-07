// GAME STATE
export class Game {
  constructor(app) {
    this.app = app;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speedMultiplier = 1.0;
    this.baseSpeed = 15;
    this.maxSpeed = 35;
    this.speedIncreaseRate = 0.5;
    this.speedBoost = 1.0;
    this.isPaused = false;
    this.combo = 0;
    this.maxCombo = 0;
    this.obstacleInterval = 2.0;
    this.minObstacleInterval = 0.8;
    this.lastObstacleTime = 0;
  }

  get currentSpeed() {
    return this.baseSpeed * this.speedMultiplier * this.speedBoost;
  }

  update(delta) {
    if (this.isPaused) return;

    this.distance += this.currentSpeed * delta;
    this.score = Math.floor(this.distance);

    if (this.speedMultiplier < this.maxSpeed / this.baseSpeed) {
      this.speedMultiplier += this.speedIncreaseRate * delta * 0.1;
    }

    if (this.obstacleInterval > this.minObstacleInterval) {
      this.obstacleInterval -= 0.01 * delta;
    }

    if (this.combo > 0) {
      this.combo -= delta * 0.5;
      if (this.combo < 0) this.combo = 0;
    }
  }

  addCoin(value = 1) {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.coins += value;
    if (this.combo >= 3) {
      this.app.ui.showCombo(this.combo);
    }
  }

  endGame() {
    const progress = {
      totalCoins: parseInt(localStorage.getItem('nr_totalCoins')) || 0,
      highScore: parseInt(localStorage.getItem('nr_highScore')) || 0,
      totalScore: parseInt(localStorage.getItem('nr_totalScore')) || 0,
      gamesPlayed: parseInt(localStorage.getItem('nr_gamesPlayed')) || 0
    };

    progress.totalCoins += this.coins;
    progress.totalScore += this.score;
    progress.gamesPlayed++;
    if (this.score > progress.highScore) {
      progress.highScore = this.score;
    }

    localStorage.setItem('nr_totalCoins', progress.totalCoins.toString());
    localStorage.setItem('nr_highScore', progress.highScore.toString());
    localStorage.setItem('nr_totalScore', progress.totalScore.toString());
    localStorage.setItem('nr_gamesPlayed', progress.gamesPlayed.toString());
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
}
