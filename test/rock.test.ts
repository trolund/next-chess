import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";

let state: gameState

beforeEach(() => {
  state = loadTestCase(4)!
  expect(state).not.toBeNull()
});

it('rock move from bottom right corner', () => {
  const H1 = testUtil.posArrayToNotationArray(chess.validMovesFrom("H1", state))   
  expect(H1).toStrictEqual(["H2", "H3", "H4", "H5", "H6", "H7", "H8", "A1", "B1", "C1", "D1", "E1", "F1", "G1"].sort())
})

it('rock move from C2', () => {
  const C2 = testUtil.posArrayToNotationArray(chess.validMovesFrom("C2", state))   
  expect(C2).toStrictEqual(["E2", "D2", "C1", "B2", "A2", "C3", "C4", "C5", "C6", "C7", "C8"].sort())
})

it('rock move from F5', () => {
  const F5 = testUtil.posArrayToNotationArray(chess.validMovesFrom("F5", state))   
  expect(F5).toStrictEqual(["F3", "F4", "F6", "F7", "F8", "G5", "H5"].sort())
})

export {}
