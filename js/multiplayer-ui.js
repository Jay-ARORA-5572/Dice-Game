import {
  initMultiplayer,
  generateRoomCode,
  createRoom,
  joinRoom,
  subscribeToRoom,
  submitRoll,
  resolveRound,
  playAgainRoom,
} from "./multiplayer.js";
import { renderPlayerLabel } from "./avatar.js";

// ----- Elements -----
const playOnlineBtn = document.getElementById("play-online-btn");
const onlineControls = document.getElementById("online-controls");
const onlineSetup = document.getElementById("online-setup");
const nameInput = document.getElementById("online-name-input");
const onlineDiceCountSelect = document.getElementById("online-dice-count");
const onlineBestOfSelect = document.getElementById("online-best-of");
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
const playAgainBtn = document.getElementById("online-play-again-btn");
const onlineLeaderboardList = document.getElementById("online-leaderboard-list");
const clearOnlineLeaderboardBtn = document.getElementById("clear-online-leaderboard");

const ONLINE_LEADERBOARD_KEY = "diceeOnlineLeaderboard";

// ----- State -----
let handles = null; // { ref, onValue, set, update, push, db } once Firebase is initialized
let currentRoomCode = null;
let localPlayerKey = null; // "player1" (host) or "player2" (guest)
let currentDiceCount = 1;
let hasSavedThisMatch = false;

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
  const matchTarget = parseInt(onlineBestOfSelect.value, 10);
  const diceCount = parseInt(onlineDiceCountSelect.value, 10);

  await createRoom(h, roomCode, hostName, matchTarget, diceCount);
  currentRoomCode = roomCode;
  localPlayerKey = "player1";
  hasSavedThisMatch = false;

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
  hasSavedThisMatch = false;

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
  const rollValues = Array.from(
    { length: currentDiceCount },
    () => Math.floor(Math.random() * 6) + 1
  );
  onlineRollBtn.disabled = true;
  await submitRoll(handles, currentRoomCode, localPlayerKey, rollValues);
}

async function handlePlayAgain() {
  if (!handles || !currentRoomCode) return;
  hasSavedThisMatch = false;
  await playAgainRoom(handles, currentRoomCode);
}

// ----- Online leaderboard (localStorage, per device) -----
function getOnlineLeaderboard() {
  try {
    const raw = localStorage.getItem(ONLINE_LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveOnlineMatch(winnerName, score1, score2) {
  const board = getOnlineLeaderboard();
  board.unshift({
    winner: winnerName,
    score: `${score1}-${score2}`,
    date: new Date().toLocaleDateString(),
  });
  localStorage.setItem(ONLINE_LEADERBOARD_KEY, JSON.stringify(board.slice(0, 10)));
  renderOnlineLeaderboard();
}

function renderOnlineLeaderboard() {
  const board = getOnlineLeaderboard();
  onlineLeaderboardList.innerHTML = "";
  if (board.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No online matches played yet.";
    onlineLeaderboardList.appendChild(li);
    return;
  }
  board.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.winner} won ${entry.score} — ${entry.date}`;
    onlineLeaderboardList.appendChild(li);
  });
}

function clearOnlineLeaderboard() {
  localStorage.removeItem(ONLINE_LEADERBOARD_KEY);
  renderOnlineLeaderboard();
}

// ----- Room state rendering -----
let resolving = false;
async function renderRoomState(state) {
  if (!state) return;

  onlineSetup.hidden = true;
  roomInfo.hidden = false;
  roomCodeDisplay.textContent = currentRoomCode;
  currentDiceCount = state.diceCount || 1;

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
    playAgainBtn.hidden = false;

    if (!hasSavedThisMatch) {
      hasSavedThisMatch = true;
      saveOnlineMatch(winnerName, state.score.player1, state.score.player2);
    }
    return;
  }
  winnerDisplay.textContent = "";
  playAgainBtn.hidden = true;

  diceRow.innerHTML = "";
  const rolls = state.rolls || {};
  ["player1", "player2"].forEach((key) => {
    const values = rolls[key];
    if (values) {
      values.forEach((value) => {
        const img = document.createElement("img");
        img.src = `images/dice${value}.png`;
        img.alt = "Dice Image";
        diceRow.appendChild(img);
      });
    }
  });

  const isMyTurn = state.turn === localPlayerKey;
  const bothRolled = rolls.player1 && rolls.player2;

  if (bothRolled) {
    turnIndicator.textContent = "Resolving round…";
    onlineRollBtn.disabled = true;
    // Only the host resolves, to avoid both clients writing the same
    // resolution at once (harmless since they'd compute identical values,
    // but wasteful) — either seated player is technically allowed to per
    // the security rules.
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
renderOnlineLeaderboard();

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
playAgainBtn.addEventListener("click", handlePlayAgain);
clearOnlineLeaderboardBtn.addEventListener("click", clearOnlineLeaderboard);

// If the page was opened via an invite link (?room=ABCDE), open the panel
// and pre-fill the room code so joining is a single click.
const roomFromUrl = new URLSearchParams(window.location.search).get("room");
if (roomFromUrl) {
  onlineControls.removeAttribute("hidden");
  playOnlineBtn.textContent = "🌐 Hide Online Play";
  joinCodeInput.value = roomFromUrl.toUpperCase();
  setStatus(`Invite link detected for room ${roomFromUrl.toUpperCase()}. Enter your name and click Join Room.`);
}
