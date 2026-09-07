# 🏃‍♂️ URBAN RUNNER

> A fast-paced **3D endless runner** game built with Three.js and Rapier Physics. Dodge trains, collect coins, unlock characters, and compete for the highest score!

![Urban Runner Banner](https://raw.githubusercontent.com/satbhai444/satbhai444/main/assets/urban-runner-banner.png)

---

## 🎮 GAMEPLAY

**Urban Runner** puts you in the shoes of a street runner dashing through an endless city. Dodge incoming trains, leap over barriers, slide under overhead obstacles, and collect coins to unlock new characters and skateboards.

### Controls

| Input | Action |
|-------|--------|
| `←` `→` or `A` `D` | Switch lanes |
| `↑` or `W` or `SPACE` | Jump |
| `↓` or `S` | Slide |
| **Double-tap** SPACE / Swipe | Activate skateboard shield |
| `ESC` or `P` | Pause |

### Mobile Controls
- **Swipe Left/Right** — Change lanes
- **Swipe Up** — Jump
- **Swipe Down** — Slide
- **Double-tap** — Activate skateboard

---

## ✨ FEATURES

### Core Gameplay
- 🏃 **3-Lane Running** — Smooth lane switching with physics-based movement
- 🚂 **4 Obstacle Types** — Trains, barriers, overheads, and low obstacles
- 🪙 **4 Coin Types** — Bronze, Silver, Gold, and Diamond (each with unique values and sounds)
- ❤️ **2-Health System** — Get hit twice before game over
- 🛹 **Skateboard Shield** — Double-tap to activate temporary invincibility
- 📈 **Progressive Difficulty** — Speed and obstacle frequency increase over time
- 🔥 **Combo System** — Collect coins rapidly for combo multipliers

### Progression & Unlocks
- 🧑 **5 Characters** — Each with unique stats (Speed, Jump, Luck)
- 🛹 **5 Skateboards** — Different shield durations and visual styles
- 💰 **Persistent Economy** — Coins, high scores, and unlocks saved in localStorage

### Polish & Effects
- 🎵 **Procedural Audio** — Web Audio API sounds for every action (jump, slide, coin, hit, game over)
- 🎶 **Synthwave Music Loop** — Dynamic background music that plays during gameplay
- ✨ **Particle Effects** — Burst particles on coin collection
- 💎 **Diamond Sparkles** — Special visual effects for rare diamond coins
- 🧲 **Magnetic Coins** — Coins are magnetically attracted when you're close
- 📱 **Mobile Optimized** — Touch controls, adaptive quality, performance-aware rendering
- 🌆 **Dynamic City** — Endless scrolling cityscape with buildings and street lamps

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|-----------|
| **3D Graphics** | [Three.js](https://threejs.org/) |
| **Physics** | [Rapier (wasm)](https://rapier.rs/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Audio** | Web Audio API (procedural, no external files) |
| **Deployment** | Vercel |

---

## 🚀 GETTING STARTED

### Prerequisites
- Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/satbhai444/urban-runner.git
cd urban-runner

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📂 PROJECT STRUCTURE

```
urban-runner/
├── index.html          # Entry HTML with inline CSS
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.js         # App entry, init, game loop
│   ├── Game.js         # Game state & scoring
│   ├── Player.js       # Player character, physics, animations
│   ├── Track.js        # Endless scrolling track & city
│   ├── Obstacle.js     # Obstacle spawning & collision
│   ├── Coin.js         # Coin system, patterns, collection
│   ├── Camera.js       # Follow camera & shake effects
│   ├── Characters.js   # Character & skateboard data
│   ├── Input.js        # Keyboard + swipe input manager
│   ├── ui.js           # All UI screens (menu, HUD, settings)
│   └── Audio.js        # Web Audio API sound system
└── dist/               # Production build output
```

---

## 🎨 CHARACTERS

| Character | Cost | Speed | Jump | Luck |
|-----------|------|-------|------|------|
| Neon 🌟 | Free | 1.0x | 1.0x | 1.0x |
| Blaze 🔥 | 500 🪙 | 1.2x | 1.0x | 1.0x |
| Shadow 🌑 | 1,200 🪙 | 1.0x | 1.3x | 1.0x |
| Jade 💚 | 2,000 🪙 | 1.0x | 1.0x | 1.5x |
| Gold 👑 | 5,000 🪙 | 1.1x | 1.1x | 2.0x |

---

## 🌍 DEPLOYMENT

### Vercel (Recommended)

One-click deploy with Vercel — the game is configured and ready:

```bash
npm install -g vercel
vercel
```

Or click the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/satbhai444/urban-runner)

### Manual Build

```bash
npm run build
# Upload the dist/ folder to any static hosting (Netlify, GitHub Pages, etc.)
```

---

## 📜 LICENSE

This project is open source and available under the **MIT License**.

---

## 👤 AUTHOR

**satbhai444**  
🐙 GitHub: [@satbhai444](https://github.com/satbhai444)

Built with ❤️ and lots of ☕

---

> 💡 **Tip:** Open the game in your browser, press any key or tap to enable audio. The synthwave music and sound effects are generated procedurally — no audio files needed!
