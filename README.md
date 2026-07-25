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
│   ├── multiplayer.js                # Firebase room/round logic (inactive until you add your own config)
│   ├── multiplayer-ui.js             # Wires the "Play Online" panel in index.html to multiplayer.js
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

Dicee is a Progressive Web App — no app store required.

**▶ [Open & install Dicee](https://jay-arora-5572.github.io/Dice-Game/)** *(requires GitHub Pages to be enabled on this repo — see note below)*

- **On mobile (Chrome/Safari):** open the link above, then use "Add to Home Screen" from the browser menu.
- **On desktop (Chrome/Edge):** open the link above, then click the install icon in the address bar, or the browser menu's "Install Dicee" option.

Once installed, it works offline and launches in its own window like a native app.

> **Note:** the link above only works once GitHub Pages is turned on for this repo: go to **Settings → Pages → Source**, select the `main` branch, and save. It'll be live at that URL within a minute or two.

## Optional: Online Multiplayer

Turn-based play across two devices is fully wired up in the UI (click **🌐 Play Online (beta)**) using Firebase Realtime Database — but it's **inactive until you add your own free Firebase project**, since credentials can't be shipped in the repo:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/) and enable **Realtime Database**.
2. Copy `js/firebase-config.example.js` to `js/firebase-config.js` and fill in your project's config values. This file is gitignored, so your credentials are never committed.
3. Reload the page. Click **Play Online**, enter a name, and either **Create Room** (share the generated code with your opponent) or **Join Room** with a code someone shared with you.

Until step 2 is done, clicking Create/Join Room shows a friendly reminder instead of erroring out.

**Note for the Realtime Database security rules:** the "test mode" default Firebase offers is open read/write to anyone for 30 days — fine for trying this out, but tighten the rules before sharing the link widely.

## Tech Stack

- HTML5
- CSS3 (custom properties for theming, keyframe animations, media queries)
- Vanilla JavaScript (ES modules, Web Audio API for sound, Canvas for confetti, `localStorage` for persistence)
- [Vitest](https://vitest.dev) for unit tests, run in CI via GitHub Actions
- Optional: [Firebase Realtime Database](https://firebase.google.com/docs/database) for online multiplayer

## Credits

Fonts: [Indie Flower](https://fonts.google.com/specimen/Indie+Flower) & [Lobster](https://fonts.google.com/specimen/Lobster) via Google Fonts.
