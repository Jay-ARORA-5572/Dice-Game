import { describe, it, expect } from "vitest";
import {
  getWinnerMessage,
  getRoundWinnerKey,
  rollDiceSet,
  sum,
  applyVariant,
  updateStreak,
} from "../js/game-logic.js";

describe("getWinnerMessage", () => {
  it("declares player 1 the winner when their total is higher", () => {
    expect(getWinnerMessage(10, 6)).toBe("🚩 Player 1 Wins!");
  });

  it("declares player 2 the winner when their total is higher", () => {
    expect(getWinnerMessage(4, 9)).toBe("Player 2 Wins! 🚩");
  });

  it("uses a custom player 2 label when provided", () => {
    expect(getWinnerMessage(4, 9, { player2Label: "Computer" })).toBe("Computer Wins! 🚩");
  });

  it("declares a draw when totals are equal", () => {
    expect(getWinnerMessage(7, 7)).toBe("Draw!");
  });
});

describe("getRoundWinnerKey", () => {
  it("returns 'player1' when player 1 has the higher total", () => {
    expect(getRoundWinnerKey(8, 3)).toBe("player1");
  });

  it("returns 'player2' when player 2 has the higher total", () => {
    expect(getRoundWinnerKey(3, 8)).toBe("player2");
  });

  it("returns null on a draw", () => {
    expect(getRoundWinnerKey(5, 5)).toBeNull();
  });
});

describe("rollDiceSet", () => {
  it("returns the requested number of dice", () => {
    expect(rollDiceSet(3).length).toBe(3);
  });

  it("only returns values between 1 and 6", () => {
    const values = rollDiceSet(50);
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    });
  });

  it("is deterministic when given a fixed RNG", () => {
    const fixedRng = () => 0.999; // always rolls the top face
    expect(rollDiceSet(4, fixedRng)).toEqual([6, 6, 6, 6]);
  });
});

describe("sum", () => {
  it("adds up an array of numbers", () => {
    expect(sum([1, 2, 3])).toBe(6);
  });

  it("returns 0 for an empty array", () => {
    expect(sum([])).toBe(0);
  });
});

describe("applyVariant", () => {
  it("standard variant sums all dice", () => {
    expect(applyVariant([2, 5, 3], "standard")).toBe(10);
  });

  it("drop-lowest removes the smallest die before summing", () => {
    expect(applyVariant([2, 5, 3], "drop-lowest")).toBe(8);
  });

  it("drop-lowest is a no-op with a single die", () => {
    expect(applyVariant([4], "drop-lowest")).toBe(4);
  });

  it("double-sixes-bonus adds +2 when two or more sixes are rolled", () => {
    expect(applyVariant([6, 6, 1], "double-sixes-bonus")).toBe(15);
  });

  it("double-sixes-bonus adds nothing with fewer than two sixes", () => {
    expect(applyVariant([6, 2, 1], "double-sixes-bonus")).toBe(9);
  });
});

describe("updateStreak", () => {
  it("increments the winner's streak and resets the other player's", () => {
    const streak = { player1: 2, player2: 0 };
    expect(updateStreak(streak, "player1")).toEqual({ player1: 3, player2: 0 });
  });

  it("resets both streaks on a draw (null winner)", () => {
    expect(updateStreak({ player1: 2, player2: 1 }, null)).toEqual({ player1: 0, player2: 0 });
  });

  it("switches the streak to the new winner", () => {
    const streak = { player1: 2, player2: 0 };
    expect(updateStreak(streak, "player2")).toEqual({ player1: 0, player2: 1 });
  });
});
