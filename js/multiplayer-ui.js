import {
  initMultiplayer,
  generateRoomCode,
  createRoom,
  joinRoom,
  subscribeToRoom,
  submitRoll,
  resolveRound,
} from "./multiplayer.js";
import { renderPlayerLabel } from "./avatar.js";

// ----- Elements -----
const playOnlineBtn = document.getElementById("play-online-btn");
const onlineControls = document.getElementById("online-controls");
const onlineSetup = document.getElementById("online-setup");
const nameInput = document.getElementById("online-name-input");
const createRoomBtn = document.getElementById("create-room-btn");
const joinCodeInput = document.getElementById("join-code-input");
const joinRoomBtn = document.getElementById("join-room-btn");
const statusEl = document.getElementById("online-status");
const roomInfo = document.getElementById("online-room-info");
const roomCodeDisplay = document.getElementById("room-code-display");
const copyInviteBtn = document.getElementById("copy-invite-btn");
const onlinePlayersRow = document.getElementById("online-players-row");
const turnIndicator = document.getElementById("online-turn-indicator");
const diceRow = document.getElementById("online-dice-row");
const onlineRollBtn = document.getElementById("online-roll-btn");
const scoreDisplay = document.getElementById("online-score-display");
const winnerDisplay = document.getElementById("online-winner-display");

// ----- State -----
let handles = null; // { ref, onValue, set, update, push, db } once Firebase is initialized
let currentRoomCode = null;
let localPlayerKey = null; // "player1" (host) or "player2" (guest)

function setStatus(message) {
  statusEl.textContent = message;
}

async function ensureFirebaseReady() {
  if (handles) return handles;
  let firebaseConfig;
  try {
    ({ firebaseConfig } = await import("./firebase-config.js"));
  } catch (e) {
    console.error("Failed to load js/firebase-config.js:", e);
    setStatus(
      "Online play needs a Firebase project. See \"Optional: Online Multiplayer\" in README.md to set one up (takes ~5 minutes). (Check the browser console for the exact error.)"
    );
    return null;
  }
  try {
    handles = await initMultiplayer(firebaseConfig);
    return handles;
  } catch (e) {
    console.error("Failed to initialize Firebase:", e);
    setStatus(`Couldn't connect to Firebase: ${e.message || e}`);
    return null;
  }
}

async function handleCreateRoom() {
  const h = await ensureFirebaseReady();
  if (!h) return;

  const hostName = nameInput.value.trim() || "Player 1";
  const roomCode = generateRoomCode();

  await createRoom(h, roomCode, hostName, 3);
  currentRoomCode = roomCode;
  localPlayerKey = "player1";

  setStatus(`Room created! Share code ${roomCode} with your opponent.`);
  subscribeToRoom(h, roomCode, renderRoomState);
}

async function handleJoinRoom() {
  const h = await ensureFirebaseReady();
  if (!h) return;

  const roomCode = joinCodeInput.value.trim().toUpperCase();
  if (!roomCode) {
    setStatus("Enter a room code to join.");
    return;
  }

  const guestName = nameInput.value.trim() || "Player 2";
  await joinRoom(h, roomCode, guestName);
  currentRoomCode = roomCode;
  localPlayerKey = "player2";

  setStatus(`Joined room ${roomCode}.`);
  subscribeToRoom(h, roomCode, renderRoomState);
}

async function handleCopyInvite() {
  if (!currentRoomCode) return;
  const url = new URL(window.location.href);
  url.searchParams.set("room", currentRoomCode);
  try {
    await navigator.clipboard.writeText(url.toString());
    setStatus("Invite link copied! Send it to your opponent.");
  } catch (e) {
    setStatus(`Copy this link: ${url.toString()}`);
  }
}

async function handleOnlineRoll() {
  if (!handles || !currentRoomCode || !localPlayerKey) return;
  const rollValue = Math.floor(Math.random() * 6) + 1;
  onlineRollBtn.disabled = true;
  await submitRoll(handles, currentRoomCode, localPlayerKey, rollValue);
}

let resolving = false;
async function renderRoomState(state) {
  if (!state) return;

  onlineSetup.hidden = true;
  roomInfo.hidden = false;
  roomCodeDisplay.textContent = currentRoomCode;

  const p1Name = state.players.player1 || "Player 1";
  const p2Name = state.players.player2 || "Waiting for player 2…";

  onlinePlayersRow.innerHTML = "";
  const p1Span = document.createElement("span");
  renderPlayerLabel(p1Span, p1Name);
  const p2Span = document.createElement("span");
  renderPlayerLabel(p2Span, p2Name);
  onlinePlayersRow.appendChild(p1Span);
  onlinePlayersRow.appendChild(p2Span);

  scoreDisplay.textContent = `${p1Name}: ${state.score.player1}  |  ${p2Name}: ${state.score.player2}`;

  if (state.matchWinner) {
    const winnerName = state.matchWinner === "player1" ? p1Name : p2Name;
    winnerDisplay.textContent = `🏆 ${winnerName} wins the match!`;
    onlineRollBtn.disabled = true;
    return;
  }
  winnerDisplay.textContent = "";

  diceRow.innerHTML = "";
  const rolls = state.rolls || {};
  ["player1", "player2"].forEach((key) => {
    const value = rolls[key];
    if (value) {
      const img = document.createElement("img");
      img.src = `images/dice${value}.png`;
      img.alt = "Dice Image";
      diceRow.appendChild(img);
    }
  });

  const isMyTurn = state.turn === localPlayerKey;
  const bothRolled = rolls.player1 && rolls.player2;

  if (bothRolled) {
    turnIndicator.textContent = "Resolving round…";
    onlineRollBtn.disabled = true;
    // Only the host resolves, so both clients don't write at once.
    if (localPlayerKey === "player1" && !resolving) {
      resolving = true;
      await resolveRound(handles, currentRoomCode, state);
      resolving = false;
    }
    return;
  }

  turnIndicator.textContent = isMyTurn ? "Your turn to roll!" : "Waiting for the other player…";
  onlineRollBtn.disabled = !isMyTurn;
}

// ----- Init -----
playOnlineBtn.addEventListener("click", () => {
  const isHidden = onlineControls.hasAttribute("hidden");
  if (isHidden) {
    onlineControls.removeAttribute("hidden");
    playOnlineBtn.textContent = "🌐 Hide Online Play";
  } else {
    onlineControls.setAttribute("hidden", "");
    playOnlineBtn.textContent = "🌐 Play Online (beta)";
  }
});

createRoomBtn.addEventListener("click", handleCreateRoom);
joinRoomBtn.addEventListener("click", handleJoinRoom);
onlineRollBtn.addEventListener("click", handleOnlineRoll);
copyInviteBtn.addEventListener("click", handleCopyInvite);

// If the page was opened via an invite link (?room=ABCDE), open the panel
// and pre-fill the room code so joining is a single click.
const roomFromUrl = new URLSearchParams(window.location.search).get("room");
if (roomFromUrl) {
  onlineControls.removeAttribute("hidden");
  playOnlineBtn.textContent = "🌐 Hide Online Play";
  joinCodeInput.value = roomFromUrl.toUpperCase();
  setStatus(`Invite link detected for room ${roomFromUrl.toUpperCase()}. Enter your name and click Join Room.`);
}
