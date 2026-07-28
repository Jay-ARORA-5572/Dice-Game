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
- 🌐 **Online multiplayer** — turn-based play across two devices via Firebase, with configurable dice count and match length per room, a one-click "Copy invite link," a "Play Again" button to start a new match without re-creating the room, and its own leaderboard of online match results (see setup below)
- 🔒 **Real database security rules** — writes are restricted to the two authenticated players seated in a room (see `database.rules.json`)
- 🧑‍🤝‍🧑 **Player avatars** — a deterministic colored initial badge per name, shown locally and in online rooms
- 📈 **Stats panel** — win rate per name, average roll, and longest-ever win streak, computed from your stored match history
- ✅ **Unit tested** — core game, stats, and avatar logic are covered by Vitest, run automatically in CI on every push

## Project Structure

```
Dice-Game/
├── index.html                       # Main HTML page
├── styles.css                        # Styling, theme variables, animations, responsive layout
├── index.js                          # App logic: DOM, sound, confetti, leaderboard, stats, theme (ES module)
├── database.rules.json               # Firebase Realtime Database security rules (paste into your project)
├── js/
│   ├── game-logic.js                 # Pure, unit-tested game logic (rolling, scoring, winner detection)
│   ├── stats.js                      # Pure, unit-tested stats aggregation from leaderboard history
│   ├── avatar.js                     # Pure, unit-tested avatar color/initial helper
│   ├── multiplayer.js                # Firebase room/round logic + anonymous auth (inactive until configured)
│   ├── multiplayer-ui.js             # Wires the "Play Online" panel in index.html to multiplayer.js
│   └── firebase-config.example.js    # Template for your own Firebase credentials (copy → firebase-config.js, safe to commit)
├── tests/
│   ├── game-logic.test.js            # Vitest unit tests for js/game-logic.js
│   ├── stats.test.js                 # Vitest unit tests for js/stats.js
│   └── avatar.test.js                # Vitest unit tests for js/avatar.js
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

Core game, stats, and avatar logic (`js/game-logic.js`, `js/stats.js`, `js/avatar.js`) are covered by [Vitest](https://vitest.dev):

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
2. Enable **Authentication → Sign-in method → Anonymous**. Each client signs in anonymously to get a stable ID, which the security rules use to confirm who's allowed to write to a given room.
3. Copy `js/firebase-config.example.js` to `js/firebase-config.js` and fill in your project's config values. (These web config values aren't secret credentials — Firebase apps are designed to ship them client-side — so it's fine to commit this file. Actual access control comes from the rules in step 4.)
4. In the Realtime Database → **Rules** tab, replace the default rules with the contents of `database.rules.json` from this repo, then click **Publish**.
5. Reload the page. Click **Play Online**, enter a name, and either **Create Room** (share the generated code, or use **🔗 Copy invite link** to copy a one-click join URL) or **Join Room** with a code someone shared with you.

Until step 3 is done, clicking Create/Join Room shows a friendly reminder instead of erroring out.

**About the security rules:** `database.rules.json` puts a single `.write` rule on each room (rather than one per field) — a write is allowed if the room doesn't exist yet (creation), if the second player seat is still open (joining), or if you're one of the two anonymous-auth UIDs already seated in that room. It's a real improvement over Firebase's wide-open 30-day "test mode" default, and it's deliberately simple: earlier drafts tried per-field rules that turned out to depend on subtle Firebase timing behavior I couldn't verify without a live connection, so this version trades a little precision (e.g. either player can technically write any field, not just their "own" ones, once both are seated) for something unambiguous and easy to reason about. It's not bulletproof against a determined attacker (no real account system, so someone who sees/guesses a room code before the second player joins could take that seat), but it's a solid baseline for a project at this scale. If you want stronger guarantees later, the natural next step is real user accounts (Firebase Auth with email or a provider like Google) instead of anonymous sign-in, plus finer per-field rules once you can test them against a live project.

**Invite links:** the copied link includes `?room=CODE` — opening it auto-expands the online panel and pre-fills the room code, so joining a friend's game is a single click plus entering a name.

> **Already had online multiplayer working?** `database.rules.json` now also includes a `/leaderboard` node (for the shared leaderboard used by both the web app and the MCP server below) — re-paste the updated file into Firebase's Rules tab and **Publish** again, or matches will complete fine but shared-leaderboard writes will be silently denied.

## Optional: MCP Server (Play Dicee from Claude Desktop / Claude Code)

`mcp-server/` is a [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes Dicee's online multiplayer game as tools — so Claude Desktop or Claude Code can create rooms, roll dice, check state, and read the leaderboard directly. It connects to the **same Firebase project** as the web app's online multiplayer, using the Firebase Admin SDK (a trusted server-side connection, not subject to the browser security rules above).

**Tools exposed:**
- `create_room` — start a new match, choosing dice count and match length
- `join_room` — seat a second player in an existing room
- `roll_dice` — roll for a player; automatically resolves the round once both have rolled
- `get_room_state` — check players, score, whose turn it is, match winner
- `play_again` — reset score for a new match in the same room
- `get_leaderboard` — read recent completed matches (shared across web + MCP)

**Setup:**

1. In your Firebase project: **Project settings (gear icon) → Service accounts → Generate new private key**. This downloads a JSON file — **treat it like a password**; it grants full admin access to your database, bypassing all security rules. Never commit it (already covered by `mcp-server/.gitignore`).
2. Save that file somewhere on your machine, e.g. `mcp-server/serviceAccountKey.json`.
3. Install dependencies:
   ```bash
   cd mcp-server
   npm install
   ```
4. Copy `.env.example` to `.env` and fill in `FIREBASE_SERVICE_ACCOUNT_PATH` (pointing at the file from step 2) and `FIREBASE_DATABASE_URL` (same value as in `js/firebase-config.js`).
5. Test it runs: `npm start` should print `Dicee MCP server running on stdio.` (Ctrl+C to stop.)
6. Add it to Claude Desktop's config (`claude_desktop_config.json` — Claude Desktop → Settings → Developer → Edit Config):
   ```json
   {
     "mcpServers": {
       "dicee": {
         "command": "node",
         "args": ["/absolute/path/to/Dice-Game/mcp-server/index.js"],
         "env": {
           "FIREBASE_SERVICE_ACCOUNT_PATH": "/absolute/path/to/serviceAccountKey.json",
           "FIREBASE_DATABASE_URL": "https://your-project-default-rtdb.region.firebasedatabase.app"
         }
       }
     }
   }
   ```
   (Claude Code: use `claude mcp add` with the same command/args/env — see Claude Code's MCP docs.)
7. Restart Claude Desktop/Code. Ask it something like *"Create a Dicee room called TestRoom for a player named Ada, then roll for player1"* — it should call the tools directly.

**Testing:** `mcp-server` has its own test suite (Node's built-in test runner, separate from the web app's Vitest suite) covering tool registration and shared game logic:
```bash
cd mcp-server
npm test
```

**A fun side effect:** because this uses the *same* shared `/leaderboard` and `/rooms` data as the web app, a human playing in the browser and Claude playing via MCP can join the same room and actually play against each other.

## Tech Stack

- HTML5
- CSS3 (custom properties for theming, keyframe animations, media queries)
- Vanilla JavaScript (ES modules, Web Audio API for sound, Canvas for confetti, `localStorage` for persistence)
- [Vitest](https://vitest.dev) for unit tests, run in CI via GitHub Actions
- Optional: [Firebase Realtime Database](https://firebase.google.com/docs/database) for online multiplayer

## Credits

Fonts: [Indie Flower](https://fonts.google.com/specimen/Indie+Flower) & [Lobster](https://fonts.google.com/specimen/Lobster) via Google Fonts.
