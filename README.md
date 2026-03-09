# 🎯 HexSapper

A hexagonal minesweeper PWA (Progressive Web App) game built with vanilla JavaScript.

## 🎮 How to Play

1. **Open hexagons** using the 🪖 Shovel tool to reveal numbers
2. **Numbers** indicate how many mines are in the 6 adjacent hexagons
3. **Mark mines** with 🚩 Flag when you find them
4. **Mark doubts** with ❓ Question mark when unsure
5. **Use 🐕 Dog** (after 10 opens) to find nearest mine direction
6. **Use 📡 Radar** (after 50 opens) to reveal mines in radius 2

## 🚀 Features

- **Hexagonal grid** (10x10 with 6 neighbors per cell)
- **3D visual effects** with CSS transforms
- **Progressive Web App** - works offline
- **Mobile-first** responsive design
- **Dark/Light theme** support
- **Smooth animations** throughout

## 📱 Installation

### Play Online
Visit: https://jebance.github.io/hexsapper

### Install as PWA
1. Open the game in Chrome/Safari
2. Tap "Add to Home Screen" or "Install"
3. Play offline anytime!

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/JeBance/hexsapper.git
cd hexsapper

# Start a local server (any method works)
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📁 Project Structure

```
hexsapper/
├── index.html          # Main HTML file
├── styles.css          # All styles with 3D effects
├── app.js              # Game logic
├── sw.js               # Service Worker for offline
├── manifest.json       # PWA manifest
├── offline.html        # Offline fallback page
├── generate-icons.html # Icon generator tool
├── icons/
│   ├── icon.svg        # SVG master icon
│   └── README.md       # Icon generation instructions
└── README.md           # This file
```

## 🎯 Game Rules

### Winning
- Open all non-mine hexagons to win

### Losing
- Click on a mine with the Shovel tool

### Tools

| Tool | Icon | Unlock | Description |
|------|------|--------|-------------|
| Shovel | 🪖 | Start | Open a hexagon |
| Flag | 🚩 | Start | Mark a mine |
| Doubt | ❓ | Start | Mark uncertainty |
| Dog | 🐕 | 10 opens | Find nearest mine |
| Radar | 📡 | 50 opens | Show mines in radius 2 |

## 🔧 Configuration

Edit `app.js` to change game settings:

```javascript
this.rows = 10;           // Grid rows
this.cols = 10;           // Grid columns
this.minePercentage = 0.18; // 18% mines
this.dogUnlock = 10;      // Opens to unlock Dog
this.radarUnlock = 50;    // Opens to unlock Radar
```

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by classic Minesweeper
- Built with vanilla JavaScript, CSS, and HTML
- No frameworks or external dependencies
