import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";
import { colOptions } from "../game/col-options";

let state: gameState

beforeEach(() => {
  state = loadTestCase(3)!
  expect(state).not.toBeNull()
});

it('all pawns can move 2 steps', () => {
  colOptions.forEach(c => {
    const moves = testUtil.posArrayToNotationArray(chess.allValidMoves(`${c}2`, state))   
    expect(moves).toStrictEqual([`${c}3`, `${c}4`].sort())
  })

  state = testUtil.changeTurn(state) // allow black to move

  colOptions.forEach(c => {
    const moves = testUtil.posArrayToNotationArray(chess.allValidMoves(`${c}7`, state))   
    expect(moves).toStrictEqual([`${c}6`, `${c}5`].sort())
  })
})

it('rock can´t move', () => {
    const A1 = testUtil.posArrayToNotationArray(chess.allValidMoves("A1", state))   
    expect(A1).toStrictEqual([])

    state = testUtil.changeTurn(state) // allow black to move

    const H1 = testUtil.posArrayToNotationArray(chess.allValidMoves("H1", state))   
    expect(H1).toStrictEqual([])
})

it('knight start moves', () => {
  const B1 = testUtil.posArrayToNotationArray(chess.allValidMoves("B1", state))   
  expect(B1).toStrictEqual(["A3", "C3"].sort())

  const G1 = testUtil.posArrayToNotationArray(chess.allValidMoves("G1", state))   
  expect(G1).toStrictEqual(["F3", "H3"].sort())

  state = testUtil.changeTurn(state) // allow black to move

  const B8 = testUtil.posArrayToNotationArray(chess.allValidMoves("B8", state))   
  expect(B8).toStrictEqual(["A6", "C6"].sort())

  const G8 = testUtil.posArrayToNotationArray(chess.allValidMoves("G8", state))   
  expect(G8).toStrictEqual(["F6", "H6"].sort())
})

it('king can´t move', () => {
  const D1 = testUtil.posArrayToNotationArray(chess.allValidMoves("D1", state))   
  expect(D1).toStrictEqual([])

  state = testUtil.changeTurn(state) // allow black to move

  const D8 = testUtil.posArrayToNotationArray(chess.allValidMoves("D8", state))   
  expect(D8).toStrictEqual([])
})

it('queen can´t move', () => {
  const E1 = testUtil.posArrayToNotationArray(chess.allValidMoves("E1", state))   
  expect(E1).toStrictEqual([])

  state = testUtil.changeTurn(state) // allow black to move

  const E8 = testUtil.posArrayToNotationArray(chess.allValidMoves("E8", state))   
  expect(E8).toStrictEqual([])
})

export {}
