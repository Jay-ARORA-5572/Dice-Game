// ---------------------------------------------------------------------------
// OPTIONAL: Online multiplayer via Firebase Realtime Database.
//
// This module is NOT active by default — Dicee works fully offline without it.
// To enable turn-based online play between two devices:
//
//   1. Create a free Firebase project: https://console.firebase.google.com/
//   2. Enable "Realtime Database" (start in test mode for development).
//   3. Copy your project's config object into js/firebase-config.js
//      (a template is provided at js/firebase-config.example.js — copy it,
//      rename to firebase-config.js, and fill in your own values).
//   4. In index.html, uncomment the two <script type="module"> lines that
//      import firebase-config.js and multiplayer.js.
//
// firebase-config.js is gitignored so your API keys are never committed.
//
// Room model: each room is a node at /rooms/{roomCode} containing the two
// players' names, whose turn it is, and the current round state. Both
// clients subscribe to the same room and stay in sync in real time.
// ---------------------------------------------------------------------------

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
export async function createRoom({ ref, set, db }, roomCode, hostName) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  await set(roomRef, {
    players: { player1: hostName, player2: null },
    turn: "player1",
    rolls: { player1: null, player2: null },
    score: { player1: 0, player2: 0 },
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
