import { describe, it, expect } from "vitest";
import { computeStats, winRatesByName } from "../js/stats.js";

const sampleLeaderboard = [
  {
    winner: "Alice",
    score: "3-1",
    rounds: [
      { p1Total: 5, p2Total: 2, winnerKey: "player1" },
      { p1Total: 4, p2Total: 4, winnerKey: null },
      { p1Total: 6, p2Total: 3, winnerKey: "player1" },
      { p1Total: 2, p2Total: 5, winnerKey: "player2" },
      { p1Total: 6, p2Total: 1, winnerKey: "player1" },
    ],
  },
  {
    winner: "Bob",
    score: "1-3",
    rounds: [
      { p1Total: 2, p2Total: 6, winnerKey: "player2" },
      { p1Total: 3, p2Total: 6, winnerKey: "player2" },
      { p1Total: 5, p2Total: 1, winnerKey: "player1" },
      { p1Total: 1, p2Total: 6, winnerKey: "player2" },
    ],
  },
];

describe("computeStats", () => {
  it("returns zeroed stats for an empty leaderboard", () => {
    expect(computeStats([])).toEqual({
      totalMatches: 0,
      winCounts: {},
      avgRoll: null,
      longestStreak: 0,
    });
  });

  it("counts total matches", () => {
    expect(computeStats(sampleLeaderboard).totalMatches).toBe(2);
  });

  it("tallies wins per player name", () => {
    expect(computeStats(sampleLeaderboard).winCounts).toEqual({ Alice: 1, Bob: 1 });
  });

  it("computes the average roll across all rounds", () => {
    // Alice's match rolls: 5,2,4,4,6,3,2,5,6,1 = 38 -> Bob's: 2,6,3,6,5,1,1,6 = 30
    // total = 68 over 18 rolls
    const stats = computeStats(sampleLeaderboard);
    expect(stats.avgRoll).toBeCloseTo(68 / 18, 5);
  });

  it("finds the longest consecutive round-win streak across all matches", () => {
    // Alice's match: player1 wins rounds 1, then draw resets, then wins 3 & 4 -> longest streak 2
    // Bob's match: player2 wins rounds 1,2 (streak 2), then player1 wins (reset), then player2 wins (streak 1)
    expect(computeStats(sampleLeaderboard).longestStreak).toBe(2);
  });
});

describe("winRatesByName", () => {
  it("sorts players by win count descending and computes win rate", () => {
    const stats = computeStats(sampleLeaderboard);
    const rates = winRatesByName(stats);
    expect(rates).toHaveLength(2);
    rates.forEach((entry) => {
      expect(entry.winRate).toBeCloseTo(0.5, 5);
    });
  });

  it("returns an empty array for no matches", () => {
    expect(winRatesByName(computeStats([]))).toEqual([]);
  });
});
