// Pure game-logic functions — no DOM access, so they're easy to unit test.

/**
 * Returns a human-readable winner message for a round given each player's total.
 * @param {number} total1 - Player 1's dice total
 * @param {number} total2 - Player 2's dice total
 * @param {{ player2Label?: string }} [options]
 */
export function getWinnerMessage(total1, total2, options = {}) {
  const p2Label = options.player2Label || "Player 2";
  if (total1 > total2) return "🚩 Player 1 Wins!";
  if (total2 > total1) return `${p2Label} Wins! 🚩`;
  return "Draw!";
}

/**
 * Returns "player1", "player2", or null (draw) for a round.
 */
export function getRoundWinnerKey(total1, total2) {
  if (total1 > total2) return "player1";
  if (total2 > total1) return "player2";
  return null;
}

/**
 * Rolls `count` six-sided dice and returns the array of face values.
 * Accepts an injectable RNG for deterministic testing.
 */
export function rollDiceSet(count, rng = Math.random) {
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(Math.floor(rng() * 6) + 1);
  }
  return values;
}

export function sum(values) {
  return values.reduce((total, v) => total + v, 0);
}

/**
 * Applies a scoring variant to a set of raw dice values and returns the effective total.
 * - "standard": sum of all dice
 * - "drop-lowest": sum of all dice except the lowest (only meaningful with 2+ dice)
 * - "double-sixes-bonus": sum of all dice, +2 bonus if two or more sixes were rolled
 */
export function applyVariant(values, variant = "standard") {
  if (variant === "drop-lowest" && values.length > 1) {
    const sorted = [...values].sort((a, b) => a - b);
    return sum(sorted.slice(1));
  }
  if (variant === "double-sixes-bonus") {
    const sixesCount = values.filter((v) => v === 6).length;
    const bonus = sixesCount >= 2 ? 2 : 0;
    return sum(values) + bonus;
  }
  return sum(values);
}

/**
 * Tracks a running streak of consecutive round wins for a single player key.
 * Returns the updated streak object.
 */
export function updateStreak(streak, winnerKey) {
  if (!winnerKey) {
    return { player1: 0, player2: 0 };
  }
  const next = { player1: 0, player2: 0, ...streak };
  next[winnerKey] = (streak[winnerKey] || 0) + 1;
  const other = winnerKey === "player1" ? "player2" : "player1";
  next[other] = 0;
  return next;
}
