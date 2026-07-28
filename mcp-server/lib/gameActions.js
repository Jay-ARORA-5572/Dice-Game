// Reuses the exact same pure logic the browser client uses (js/game-logic.js
// has zero DOM/browser dependencies), so "how a round is won" can never
// drift between the web app and this MCP server.
import { getRoundWinnerKey, sum } from "../../js/game-logic.js";
import { getDb } from "./firebaseAdmin.js";

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function createRoom({ hostName, diceCount = 1, matchTarget = 3 }) {
  const roomCode = generateRoomCode();
  const db = getDb();
  await db.ref(`rooms/${roomCode}`).set({
    players: { player1: hostName || "Player 1", player2: null },
    uids: { player1: "mcp:host", player2: null },
    turn: "player1",
    rolls: { player1: null, player2: null },
    score: { player1: 0, player2: 0 },
    matchTarget,
    diceCount,
    matchWinner: null,
    lastRound: null,
    createdAt: Date.now(),
  });
  return { roomCode, hostName: hostName || "Player 1", diceCount, matchTarget };
}

export async function joinRoom({ roomCode, guestName }) {
  const db = getDb();
  const roomRef = db.ref(`rooms/${roomCode}`);
  const snapshot = await roomRef.get();
  if (!snapshot.exists()) {
    throw new Error(`Room ${roomCode} does not exist.`);
  }
  const room = snapshot.val();
  if (room.players.player2) {
    throw new Error(`Room ${roomCode} already has two players.`);
  }
  await roomRef.update({
    "players/player2": guestName || "Player 2",
    "uids/player2": "mcp:guest",
  });
  return { roomCode, guestName: guestName || "Player 2" };
}

export async function getRoomState({ roomCode }) {
  const db = getDb();
  const snapshot = await db.ref(`rooms/${roomCode}`).get();
  if (!snapshot.exists()) {
    throw new Error(`Room ${roomCode} does not exist.`);
  }
  return { roomCode, ...snapshot.val() };
}

/**
 * Rolls dice for one player. If both players have now rolled, the round is
 * resolved immediately (score updated, rolls cleared, match-win checked) --
 * mirroring js/multiplayer-ui.js's client-side flow, just without needing
 * a second tool call.
 */
export async function rollDice({ roomCode, playerKey }) {
  if (playerKey !== "player1" && playerKey !== "player2") {
    throw new Error('playerKey must be "player1" or "player2".');
  }

  const db = getDb();
  const roomRef = db.ref(`rooms/${roomCode}`);
  const snapshot = await roomRef.get();
  if (!snapshot.exists()) {
    throw new Error(`Room ${roomCode} does not exist.`);
  }
  const room = snapshot.val();

  if (room.matchWinner) {
    throw new Error(`Match already over -- ${room.matchWinner} won. Call play_again to start a new match.`);
  }

  const diceCount = room.diceCount || 1;
  const rollValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  const otherKey = playerKey === "player1" ? "player2" : "player1";

  await roomRef.update({
    [`rolls/${playerKey}`]: rollValues,
    turn: otherKey,
  });

  const rolls = { ...(room.rolls || {}), [playerKey]: rollValues };
  const bothRolled = rolls.player1 && rolls.player2;

  if (!bothRolled) {
    return { roomCode, playerKey, rollValues, roundResolved: false };
  }

  const total1 = sum(rolls.player1);
  const total2 = sum(rolls.player2);
  const winnerKey = getRoundWinnerKey(total1, total2);

  const newScore = { ...room.score };
  if (winnerKey) newScore[winnerKey] += 1;

  const matchWinner =
    newScore.player1 >= room.matchTarget ? "player1" :
    newScore.player2 >= room.matchTarget ? "player2" :
    null;

  await roomRef.update({
    score: newScore,
    lastRound: { p1: rolls.player1, p2: rolls.player2, winnerKey },
    rolls: { player1: null, player2: null },
    turn: "player1",
    matchWinner,
  });

  if (matchWinner) {
    const winnerName = room.players[matchWinner];
    await recordLeaderboardEntry({
      winner: winnerName,
      score: `${newScore.player1}-${newScore.player2}`,
    });
  }

  return {
    roomCode,
    playerKey,
    rollValues,
    roundResolved: true,
    roundWinner: winnerKey,
    p1Total: total1,
    p2Total: total2,
    newScore,
    matchWinner,
  };
}

export async function playAgain({ roomCode }) {
  const db = getDb();
  const roomRef = db.ref(`rooms/${roomCode}`);
  const snapshot = await roomRef.get();
  if (!snapshot.exists()) {
    throw new Error(`Room ${roomCode} does not exist.`);
  }
  await roomRef.update({
    score: { player1: 0, player2: 0 },
    rolls: { player1: null, player2: null },
    turn: "player1",
    matchWinner: null,
    lastRound: null,
  });
  return { roomCode, reset: true };
}

/**
 * Appends a completed match to the shared /leaderboard node (visible to
 * every player and to get_leaderboard below) -- distinct from the
 * per-device localStorage leaderboard the web app also keeps.
 */
export async function recordLeaderboardEntry({ winner, score }) {
  const db = getDb();
  const entryRef = db.ref("leaderboard").push();
  await entryRef.set({
    winner,
    score,
    date: new Date().toISOString(),
  });
}

export async function getLeaderboard({ limit = 10 } = {}) {
  const db = getDb();
  const snapshot = await db.ref("leaderboard").limitToLast(limit).get();
  if (!snapshot.exists()) return [];
  const entries = [];
  snapshot.forEach((child) => {
    entries.push(child.val());
  });
  return entries.reverse(); // most recent first
}
