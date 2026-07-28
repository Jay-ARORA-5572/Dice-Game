import { test } from "node:test";
import assert from "node:assert";
import { getRoundWinnerKey, sum } from "../../js/game-logic.js";

// These exercise the exact same shared functions the web app's tests cover
// (tests/game-logic.test.js at the repo root) -- verifying the MCP server
// imports and uses them correctly, so round resolution can never silently
// drift between the browser client and this server.

test("player1 wins a single-die round with the higher roll", () => {
  assert.strictEqual(getRoundWinnerKey(sum([5]), sum([3])), "player1");
});

test("player2 wins a multi-die round with the higher total", () => {
  assert.strictEqual(getRoundWinnerKey(sum([2, 2]), sum([6, 1])), "player2");
});

test("equal totals are a draw (null)", () => {
  assert.strictEqual(getRoundWinnerKey(sum([3, 3]), sum([2, 4])), null);
});
