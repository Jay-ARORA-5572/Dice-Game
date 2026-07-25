// ---------------------------------------------------------------------------
// OPTIONAL: Online multiplayer via Firebase Realtime Database.
//
// This module is NOT active by default — Dicee works fully offline without it.
// The UI (js/multiplayer-ui.js, wired into index.html) is already built; to
// activate real online play between two devices:
//
//   1. Create a free Firebase project: https://console.firebase.google.com/
//   2. Enable "Realtime Database" (start in test mode for development).
//   3. Copy js/firebase-config.example.js to js/firebase-config.js and fill
//      in your own project's values.
//   4. Reload the page and click "Play Online" — Create/Join Room will now
//      work. Without a config file, that button shows a friendly setup
//      reminder instead of erroring.
//
// js/firebase-config.js is gitignored so your API keys are never committed.
//
// Room model: each room is a node at /rooms/{roomCode} containing the two
// players' names, whose turn it is, running score, and the current round's
// rolls. Both clients subscribe to the same room and stay in sync in real
// time.
// ---------------------------------------------------------------------------

import { getRoundWinnerKey } from "./game-logic.js";

let firebaseApp = null;
let db = null;

export async function initMultiplayer(firebaseConfig) {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js"
  );
  const { getDatabase, ref, onValue, set, update, push } = await import(
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js"
  );

  firebaseApp = initializeApp(firebaseConfig);
  db = getDatabase(firebaseApp);

  return { ref, onValue, set, update, push, db };
}

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/**
 * Creates a new room with an initial state. Call after initMultiplayer().
 */
export async function createRoom({ ref, set, db }, roomCode, hostName, matchTarget = 3) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await set(roomRef, {
    players: { player1: hostName, player2: null },
    turn: "player1",
    rolls: { player1: null, player2: null },
    score: { player1: 0, player2: 0 },
    matchTarget,
    matchWinner: null,
    lastRound: null,
    createdAt: Date.now(),
  });
}

/**
 * Joins an existing room as player2.
 */
export async function joinRoom({ ref, update, db }, roomCode, guestName) {
  const roomRef = ref(db, `rooms/${roomCode}/players`);
  await update(roomRef, { player2: guestName });
}

/**
 * Subscribes to live updates for a room. Calls `callback(state)` on every change.
 * Returns nothing here for brevity — see Firebase docs for unsubscribing via onValue's return.
 */
export function subscribeToRoom({ ref, onValue, db }, roomCode, callback) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
}

/**
 * Submits the current player's roll and hands the turn to the other player.
 */
export async function submitRoll({ ref, update, db }, roomCode, playerKey, rollValue) {
  const nextTurn = playerKey === "player1" ? "player2" : "player1";
  await update(ref(db, `rooms/${roomCode}`), {
    [`rolls/${playerKey}`]: rollValue,
    turn: nextTurn,
  });
}

/**
 * Once both players have rolled, resolves the round: updates score, clears
 * rolls for the next round, and sets matchWinner if the target is reached.
 * Only the room host's client should call this (see js/multiplayer-ui.js)
 * to avoid both clients writing the resolution at once.
 */
export async function resolveRound({ ref, update, db }, roomCode, state) {
  const { rolls, score, matchTarget } = state;
  const winnerKey = getRoundWinnerKey(rolls.player1, rolls.player2);

  const newScore = { ...score };
  if (winnerKey) newScore[winnerKey] += 1;

  const matchWinner =
    newScore.player1 >= matchTarget ? "player1" :
    newScore.player2 >= matchTarget ? "player2" :
    null;

  await update(ref(db, `rooms/${roomCode}`), {
    score: newScore,
    lastRound: { p1: rolls.player1, p2: rolls.player2, winnerKey },
    rolls: { player1: null, player2: null },
    turn: "player1",
    matchWinner,
  });
}
