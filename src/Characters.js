// CHARACTERS DATA - 5 Unique Characters
export const CHARACTERS = [
  {
    id: 'neon',
    name: 'Neon',
    cost: 0,
    unlocked: true,
    stats: { speed: 1.0, jump: 1.0, luck: 1.0 },
    colors: {
      shirt: 0x00ffff,
      pants: 0x1a1a3a,
      hair: 0x1a0a05,
      shoes: 0xff00ff,
      skin: 0xffb380
    }
  },
  {
    id: 'blaze',
    name: 'Blaze',
    cost: 500,
    unlocked: false,
    stats: { speed: 1.2, jump: 1.0, luck: 1.0 },
    colors: {
      shirt: 0xff4400,
      pants: 0x2a1a1a,
      hair: 0xffaa00,
      shoes: 0xffff00,
      skin: 0xff9966
    }
  },
  {
    id: 'shadow',
    name: 'Shadow',
    cost: 1200,
    unlocked: false,
    stats: { speed: 1.0, jump: 1.3, luck: 1.0 },
    colors: {
      shirt: 0x4444aa,
      pants: 0x000033,
      hair: 0x000000,
      shoes: 0x8888ff,
      skin: 0xddbbaa
    }
  },
  {
    id: 'jade',
    name: 'Jade',
    cost: 2000,
    unlocked: false,
    stats: { speed: 1.0, jump: 1.0, luck: 1.5 },
    colors: {
      shirt: 0x00ff88,
      pants: 0x004422,
      hair: 0x226644,
      shoes: 0x88ffaa,
      skin: 0xffccaa
    }
  },
  {
    id: 'gold',
    name: 'Gold',
    cost: 5000,
    unlocked: false,
    stats: { speed: 1.1, jump: 1.1, luck: 2.0 },
    colors: {
      shirt: 0xffd700,
      pants: 0x4a3a00,
      hair: 0xffeeaa,
      shoes: 0xffaa00,
      skin: 0xffe0b0
    }
  }
];

// SKATEBOARDS DATA
export const SKATEBOARDS = [
  {
    id: 'starter',
    name: 'Classic',
    cost: 0,
    unlocked: true,
    duration: 10, // seconds of invincibility
    color: 0x888888,
    deckColor: 0x444444
  },
  {
    id: 'neon_board',
    name: 'Neon Board',
    cost: 800,
    unlocked: false,
    duration: 12,
    color: 0x00ffff,
    deckColor: 0x004444
  },
  {
    id: 'fire',
    name: 'Fire Wing',
    cost: 1500,
    unlocked: false,
    duration: 15,
    color: 0xff4400,
    deckColor: 0x441100
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    cost: 3000,
    unlocked: false,
    duration: 20,
    color: 0xffaa00,
    deckColor: 0x442200
  },
  {
    id: 'shadow',
    name: 'Shadow',
    cost: 5000,
    unlocked: false,
    duration: 25,
    color: 0x6600ff,
    deckColor: 0x220044
  }
];

// Load player progress from localStorage
export function loadProgress() {
  return {
    totalCoins: parseInt(localStorage.getItem('nr_totalCoins')) || 0,
    selectedCharacter: localStorage.getItem('nr_selectedChar') || 'neon',
    selectedBoard: localStorage.getItem('nr_selectedBoard') || 'starter',
    unlockedCharacters: JSON.parse(localStorage.getItem('nr_unlockedChars') || '["neon"]'),
    unlockedBoards: JSON.parse(localStorage.getItem('nr_unlockedBoards') || '["starter"]'),
    highScore: parseInt(localStorage.getItem('nr_highScore')) || 0,
    totalScore: parseInt(localStorage.getItem('nr_totalScore')) || 0,
    gamesPlayed: parseInt(localStorage.getItem('nr_gamesPlayed')) || 0
  };
}

export function saveProgress(progress) {
  localStorage.setItem('nr_totalCoins', progress.totalCoins.toString());
  localStorage.setItem('nr_selectedChar', progress.selectedCharacter);
  localStorage.setItem('nr_selectedBoard', progress.selectedBoard);
  localStorage.setItem('nr_unlockedChars', JSON.stringify(progress.unlockedCharacters));
  localStorage.setItem('nr_unlockedBoards', JSON.stringify(progress.unlockedBoards));
  localStorage.setItem('nr_highScore', progress.highScore.toString());
  localStorage.setItem('nr_totalScore', progress.totalScore.toString());
  localStorage.setItem('nr_gamesPlayed', progress.gamesPlayed.toString());
}

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}

export function getBoard(id) {
  return SKATEBOARDS.find(b => b.id === id) || SKATEBOARDS[0];
}

export function isUnlocked(progress, id, type) {
  if (type === 'character') return progress.unlockedCharacters.includes(id);
  if (type === 'board') return progress.unlockedBoards.includes(id);
  return false;
}
