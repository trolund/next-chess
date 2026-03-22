import { MinmaxAgent } from "../AI/MinmaxAgent"
import { chess } from "../game/game"
import { emptyBoard } from "../stores/emptyBoard"
import { testUtil } from "./utils/testUtil"

it('allows king side castling when path is clear and safe', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[7][7] = "r"
  board[0][4] = "K"

  const state = testUtil.createTestGame(board, "white", [], {
    white: { kingSide: true, queenSide: false },
    black: { kingSide: false, queenSide: false }
  })

  const moves = testUtil.posArrayToNotationArray(chess.validMovesFrom("E1", state))
  expect(moves).toContain("G1")

  const newState = chess.move("E1", "G1", state)
  expect(chess.getFieldAtPos("G1", newState).piece).toBe("king")
  expect(chess.getFieldAtPos("F1", newState).piece).toBe("rook")
})

it('allows queen side castling when path is clear and safe', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[7][0] = "r"
  board[0][4] = "K"

  const state = testUtil.createTestGame(board, "white", [], {
    white: { kingSide: false, queenSide: true },
    black: { kingSide: false, queenSide: false }
  })

  const moves = testUtil.posArrayToNotationArray(chess.validMovesFrom("E1", state))
  expect(moves).toContain("C1")

  const newState = chess.move("E1", "C1", state)
  expect(chess.getFieldAtPos("C1", newState).piece).toBe("king")
  expect(chess.getFieldAtPos("D1", newState).piece).toBe("rook")
})

it('disallows castling through check', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[7][7] = "r"
  board[0][4] = "K"
  board[0][5] = "R"

  const state = testUtil.createTestGame(board, "white", [], {
    white: { kingSide: true, queenSide: false },
    black: { kingSide: false, queenSide: false }
  })

  const moves = testUtil.posArrayToNotationArray(chess.validMovesFrom("E1", state))
  expect(moves).not.toContain("G1")
})

it('allows en passant on the immediate reply only', () => {
  const board = emptyBoard.map(row => [...row])
  board[3][4] = "p"
  board[1][3] = "P"
  board[7][4] = "k"
  board[0][4] = "K"

  const state = testUtil.createTestGame(board, "black")
  const afterBlackMove = chess.move("D7", "D5", state)

  const whiteMoves = testUtil.posArrayToNotationArray(chess.validMovesFrom("E5", afterBlackMove))
  expect(whiteMoves).toContain("D6")

  const afterCapture = chess.move("E5", "D6", afterBlackMove)
  expect(chess.getFieldAtPos("D6", afterCapture).piece).toBe("pawn")
  expect(chess.getFieldAtPos("D5", afterCapture).piece).toBeNull()
})

it('filters out moves that leave the king in check', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[6][4] = "r"
  board[0][4] = "R"
  board[0][0] = "K"

  const state = testUtil.createTestGame(board, "white")
  const moves = testUtil.posArrayToNotationArray(chess.validMovesFrom("E2", state))

  expect(moves).toStrictEqual(["E3", "E4", "E5", "E6", "E7", "E8"].sort())
})

it('two minimax agents can play several half-moves without throwing', () => {
  let state = chess.createGame()
  const white = new MinmaxAgent(1, "white")
  const black = new MinmaxAgent(1, "black")

  for (let i = 0; i < 4; i++) {
    const agent = state.turn === "white" ? white : black
    const action = agent.FindMove(state)
    state = chess.move(action.from, action.to, state, { transformation: "queen" })
  }

  expect(state.lastMove).not.toBeNull()
  expect(state.ended).toBe(false)
})
