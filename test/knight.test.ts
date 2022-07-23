import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";

let state: gameState

beforeEach(() => {
  state = loadTestCase(2)!
  expect(state).not.toBeNull()
});

it('knight move from bottom right corner ', () => {
  const H1 = testUtil.posArrayToNotationArray(chess.validMovesFrom("H1", state))   
  expect(H1).toStrictEqual(["G3", "F2"].sort())
})

it('knight move from bottom left corner', () => {
  const A1 = testUtil.posArrayToNotationArray(chess.validMovesFrom("A1", state))   
  expect(A1).toStrictEqual(["B3", "C2"].sort())
})

it('knight move from center', () => {
  const D5 = testUtil.posArrayToNotationArray(chess.validMovesFrom("D5", state))   
  expect(D5).toStrictEqual(["C7", "E7", "F6", "F4", "E3", "C3", "B4", "B6"].sort())
})

it('knight move from top left corner', () => {
  const A8 = testUtil.posArrayToNotationArray(chess.validMovesFrom("A8", state))   
  expect(A8).toStrictEqual(["C7", "B6"].sort())
})

it('knight move from top left corner', () => {
  const A8 = testUtil.posArrayToNotationArray(chess.validMovesFrom("A8", state))   
  expect(A8).toStrictEqual(["C7", "B6"].sort())
})

it('knight move from top left corner', () => {
  const F7 = testUtil.posArrayToNotationArray(chess.validMovesFrom("F7", state))   
  expect(F7).toStrictEqual(["D8", "H8", "D6", "E5", "G5"].sort())
})

export {}
