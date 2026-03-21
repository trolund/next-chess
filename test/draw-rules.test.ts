import { chess } from "../game/game"
import { emptyBoard } from "../stores/emptyBoard"
import { testUtil } from "./utils/testUtil"

it('detects threefold repetition', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[0][4] = "K"
  board[7][6] = "n"
  board[0][6] = "N"

  let state = testUtil.createTestGame(board, "white")

  const cycle = () => {
    state = chess.move("G1", "F3", state)
    state = chess.move("G8", "F6", state)
    state = chess.move("F3", "G1", state)
    state = chess.move("F6", "G8", state)
  }

  cycle()
  cycle()

  expect(chess.threefoldRepetition(state)).toBe(true)
  expect(state.ended).toBe(true)
  expect(state.result).toBe("threefold-repetition")
})

it('detects the fifty-move rule', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[0][4] = "K"
  board[7][6] = "n"
  board[0][6] = "N"

  const state = testUtil.createTestGame(board, "white")
  state.halfMoveClock = 99

  const nextState = chess.move("G1", "F3", state)

  expect(chess.fiftyMoveRule(nextState)).toBe(true)
  expect(nextState.ended).toBe(true)
  expect(nextState.result).toBe("fifty-move-rule")
})

it('ignores irrelevant en-passant squares in the position key', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[0][4] = "K"
  board[6][0] = "p"

  const stateWithoutTarget = testUtil.createTestGame(board, "black")
  const stateWithIrrelevantTarget = {
    ...testUtil.createTestGame(board, "black"),
    enPassantTarget: chess.toPos("A3")
  }

  expect(chess.positionKey(stateWithoutTarget)).toBe(chess.positionKey(stateWithIrrelevantTarget))
})

it('detects insufficient material for king versus king', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[0][4] = "K"

  const state = testUtil.createTestGame(board, "white")

  expect(chess.insufficientMaterial(state)).toBe(true)
  expect(chess.gameEnded(state)).toBe(true)
})

it('detects insufficient material for king and bishop versus king', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[7][2] = "b"
  board[0][4] = "K"

  const state = testUtil.createTestGame(board, "white")

  expect(chess.insufficientMaterial(state)).toBe(true)
})

it('detects insufficient material for bishops on same color', () => {
  const board = emptyBoard.map(row => [...row])
  board[7][4] = "k"
  board[6][1] = "b"
  board[0][4] = "K"
  board[1][6] = "B"

  const state = testUtil.createTestGame(board, "white")

  expect(chess.insufficientMaterial(state)).toBe(true)
})
