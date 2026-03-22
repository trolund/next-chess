import { applyMatchToLeaderboard, parseLeaderboardImport } from "../lib/leaderboard"

it("applies match results to the leaderboard with accumulated stats", () => {
  const leaderboard = applyMatchToLeaderboard([], { kind: "Minimax", depth: 1 }, { kind: "Alpha-Beta", depth: 1 }, {
    winner: "white",
    whiteThinkMs: 120,
    blackThinkMs: 150,
    whiteMoves: 6,
    blackMoves: 6
  })

  expect(leaderboard).toHaveLength(2)
  expect(leaderboard[0].wins).toBe(1)
  expect(leaderboard[0].totalThinkMs).toBe(120)
  expect(leaderboard[1].losses).toBe(1)
  expect(leaderboard[1].totalMoves).toBe(6)
})

it("parses an evaluation report leaderboard payload", () => {
  const parsed = parseLeaderboardImport({
    version: 1,
    generatedAt: "2026-03-16T00:00:00.000Z",
    settings: {
      rounds: 1,
      maxPlies: 80,
      parallelism: 1,
      profiles: [{ kind: "Minimax", depth: 1 }, { kind: "Alpha-Beta", depth: 1 }]
    },
    leaderboard: [
      {
        id: "alpha-beta-d1",
        label: "Alpha-Beta D1",
        isAI: true,
        rating: 1210,
        games: 2,
        wins: 1,
        losses: 1,
        draws: 0,
        totalThinkMs: 80,
        totalMoves: 14
      }
    ],
    matches: []
  })

  expect(parsed).toHaveLength(1)
  expect(parsed?.[0].label).toBe("Alpha-Beta D1")
})
