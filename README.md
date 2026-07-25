# 🎲 Dicee

[![Tests](https://github.com/Jay-ARORA-5572/Dice-Game/actions/workflows/tests.yml/badge.svg)](https://github.com/Jay-ARORA-5572/Dice-Game/actions/workflows/tests.yml)

A two-player dice-rolling game built with vanilla HTML, CSS, and JavaScript — with best-of-N tournaments, scoring variants, sound and confetti, a persistent leaderboard, and an optional online-multiplayer mode.

![Dicee preview](assets/preview.png)

> The image above is a static mockup of the UI. Swap it for a real screen recording (e.g. via [ScreenToGif](https://www.screentogif.com/) or [Kap](https://getkap.co/)) for the most accurate preview.

## Features

- 🎯 **Roll Dice button** (or press <kbd>Space</kbd>) — no full-page refresh, rolls happen instantly with a shake animation
- 🏆 **Best-of-N matches** — choose first to 1, 3, or 5 wins; a reset button starts a new match
- 🔢 **Configurable dice count** — play with 1, 2, or 3 dice per player (totals are summed)
- 🎛️ **Scoring variants** — Standard (sum), Drop Lowest Die, or Double Sixes Bonus (+2 if you roll two or more 6s)
- 🤖 **vs Computer mode** — play solo against a randomized "Computer" opponent
- ✏️ **Custom player names** — saved locally and used throughout the UI and leaderboard
- 🔥 **Roll streak indicator** — highlights when a player wins 3+ rounds in a row
- 🎉 **Confetti burst + screen vibration** on match win (vibration on supported mobile browsers)
- 🔊 **Sound effects** — a shake sound on roll and a chime on match win (generated with the Web Audio API, no audio files needed)
- 📊 **Live score tracker** — shows each player's round wins throughout the match
- 📋 **Local leaderboard with match history** — tap any result to expand the round-by-round breakdown; results persist across sessions via `localStorage`
- 🌗 **Dark / light theme toggle** — preference is remembered on your next visit
- 📱 **Responsive layout** — dice stack vertically and text scales down on mobile
- 📲 **Installable PWA** — add it to your phone or desktop home screen and play offline (via `manifest.json` + a service worker)
- 🌐 **Optional online multiplayer** — turn-based play across two devices via Firebase (see setup below)
- ✅ **Unit tested** — core game logic is covered by Vitest, run automatically in CI on every push

## Project Structure

```
Dice-Game/
├── index.html                       # Main HTML page
├── styles.css                        # Styling, theme variables, animations, responsive layout
├── index.js                          # App logic: DOM, sound, confetti, leaderboard, theme (ES module)
├── js/
│   ├── game-logic.js                 # Pure, unit-tested game logic (rolling, scoring, winner detection)
│   ├── multiplayer.js                # Optional Firebase online-multiplayer module (disabled by default)
│   └── firebase-config.example.js    # Template for your own Firebase credentials (copy → firebase-config.js)
├── tests/
│   └── game-logic.test.js            # Vitest unit tests for js/game-logic.js
├── .github/workflows/tests.yml       # CI: runs the test suite on every push/PR
├── favicon.svg                       # Site favicon
├── manifest.json                     # Web App Manifest (PWA installability)
├── service-worker.js                 # Offline caching for core assets
├── icons/
│   ├── icon-192.png                  # PWA icon (192x192)
│   └── icon-512.png                  # PWA icon (512x512)
├── assets/
│   ├── og-image.png                  # Open Graph / social share preview image
│   └── preview.png                   # README preview screenshot
└── images/
    └── dice1.png … dice6.png         # Dice face images
```

## How It Works

1. Optionally enter player names, pick dice count, best-of-N target, and a scoring variant.
2. Click **Roll Dice** (or press Space) — both players' dice animate and land on a random result.
3. Whoever has the higher total wins the round; round wins and streaks are tracked live.
4. First to reach the target number of wins takes the match — confetti fires, and the result (with full round-by-round history) is saved to the leaderboard.
5. Click **Reset Match** to play again, or **Clear leaderboard** to wipe saved history.

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Jay-ARORA-5572/Dice-Game.git
   ```
2. Open `index.html` in your browser (no build step or server required).
3. Click **Roll Dice** or press Space to play.

## Running Tests

Core game logic (`js/game-logic.js`) is covered by [Vitest](https://vitest.dev):

```bash
npm install
npm test
```

Tests run automatically on every push via GitHub Actions (see the badge above).

## Installing as an App

Dicee is a Progressive Web App — no app store required:

- **On mobile (Chrome/Safari):** open the hosted site, then use "Add to Home Screen" from the browser menu.
- **On desktop (Chrome/Edge):** click the install icon in the address bar, or the browser menu's "Install Dicee" option.

Once installed, it works offline and launches in its own window like a native app.

## Optional: Online Multiplayer

Turn-based play across two devices is scaffolded in `js/multiplayer.js` using Firebase Realtime Database, but **disabled by default** — it needs your own free Firebase project:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/) and enable **Realtime Database**.
2. Copy `js/firebase-config.example.js` to `js/firebase-config.js` and fill in your project's config values. This file is gitignored, so your credentials are never committed.
3. In `index.html`, uncomment the `<script type="module" src="js/multiplayer.js">` line near the bottom.
4. Wire up room creation / joining using the exported functions (`createRoom`, `joinRoom`, `subscribeToRoom`, `submitRoll`) — see the comments in `js/multiplayer.js` for the room data model.

This is intentionally left as a scaffold rather than a fully wired feature, since it depends on credentials only you can provision.

## Tech Stack

- HTML5
- CSS3 (custom properties for theming, keyframe animations, media queries)
- Vanilla JavaScript (ES modules, Web Audio API for sound, Canvas for confetti, `localStorage` for persistence)
- [Vitest](https://vitest.dev) for unit tests, run in CI via GitHub Actions
- Optional: [Firebase Realtime Database](https://firebase.google.com/docs/database) for online multiplayer

## Credits

Fonts: [Indie Flower](https://fonts.google.com/specimen/Indie+Flower) & [Lobster](https://fonts.google.com/specimen/Lobster) via Google Fonts.
