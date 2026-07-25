// Pure functions that turn the leaderboard's stored match history into
// aggregate stats. No DOM, no localStorage access — easy to unit test.

/**
 * @param {Array<{winner: string, rounds?: Array<{p1Total:number, p2Total:number, winnerKey:string|null}>}>} leaderboard
 * @returns {{
 *   totalMatches: number,
 *   winCounts: Record<string, number>,
 *   avgRoll: number|null,
 *   longestStreak: number
 * }}
 */
export function computeStats(leaderboard) {
  if (!leaderboard || leaderboard.length === 0) {
    return { totalMatches: 0, winCounts: {}, avgRoll: null, longestStreak: 0 };
  }

  const winCounts = {};
  let rollSum = 0;
  let rollCount = 0;
  let longestStreak = 0;

  leaderboard.forEach((entry) => {
    winCounts[entry.winner] = (winCounts[entry.winner] || 0) + 1;

    let currentStreakP1 = 0;
    let currentStreakP2 = 0;

    (entry.rounds || []).forEach((round) => {
      rollSum += round.p1Total + round.p2Total;
      rollCount += 2;

      if (round.winnerKey === "player1") {
        currentStreakP1 += 1;
        currentStreakP2 = 0;
      } else if (round.winnerKey === "player2") {
        currentStreakP2 += 1;
        currentStreakP1 = 0;
      } else {
        currentStreakP1 = 0;
        currentStreakP2 = 0;
      }

      longestStreak = Math.max(longestStreak, currentStreakP1, currentStreakP2);
    });
  });

  return {
    totalMatches: leaderboard.length,
    winCounts,
    avgRoll: rollCount > 0 ? rollSum / rollCount : null,
    longestStreak,
  };
}

/**
 * Converts winCounts into a sorted array of { name, wins, winRate } for display.
 */
export function winRatesByName(stats) {
  const { winCounts, totalMatches } = stats;
  return Object.entries(winCounts)
    .map(([name, wins]) => ({
      name,
      wins,
      winRate: totalMatches > 0 ? wins / totalMatches : 0,
    }))
    .sort((a, b) => b.wins - a.wins);
}
