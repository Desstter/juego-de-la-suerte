# Juego de Selección de Candidatos

A browser-based candidate selection simulator that combines deterministic scoring with a luck factor. Built with vanilla JavaScript and designed to handle millions of candidates efficiently.

## Overview

The app generates `N` candidates, assigns each a score based on the formula **95% hard work + 5% luck**, and displays the top and bottom `K` results. It supports optional seeded randomness for reproducibility and automatically switches to a memory-efficient streaming mode for very large datasets.

## Features

- **Configurable N** — generate from 1 to millions of candidates
- **Top / Bottom K** — display the best and worst performers side by side
- **Seeded randomness** — enter a seed to reproduce the exact same run
- **Three execution modes**
  - `Auto` — chooses the best mode based on N
  - `Exact` — full in-memory sort for maximum precision
  - `Streaming` — constant-memory reservoir sampling for N > 200,000
- **Responsive UI** — works on desktop and mobile browsers

## Tech Stack

- HTML5 / CSS3
- Vanilla JavaScript (ES6+)
- No dependencies, no build step

## Getting Started

Just open `index.html` in any modern browser — no server or installation required.

```bash
# Clone the repo
git clone https://github.com/Desstter/juego-de-la-suerte.git
cd juego-de-la-suerte

# Open directly
open index.html
```

## How It Works

Each candidate receives two components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Effort score | 95% | Deterministic score derived from candidate index and seed |
| Luck score | 5% | Random factor added on top |

The final score is normalized to a 0–100 range. For N > 200,000 the app uses reservoir sampling so memory usage stays constant regardless of input size.

## File Structure

```
├── index.html          # Entry point and UI layout
├── style.css           # Styling
├── game.js             # Core scoring and candidate generation
├── advanced-game-engine.js  # Streaming and large-N logic
└── advanced-ui.js      # UI rendering and interaction
```

## License

MIT
