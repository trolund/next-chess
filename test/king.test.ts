import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";

let state: gameState

beforeEach(() => {
  state = loadTestCase(7)!
  expect(state).not.toBeNull()
});

it('king move from bottom of board', () => {
  const D1 = testUtil.posArrayToNotationArray(chess.validMovesFrom("D1", state))   
  expect(D1).toStrictEqual(["C2", "C1", "E2", "E1"].sort())
})

it('king surrounded', () => {
  const B4 = testUtil.posArrayToNotationArray(chess.validMovesFrom("B4", state))   
  expect(B4).toStrictEqual(["A5", "C5", "B5", "C4", "C3", "A3"].sort())
})

it('king free', () => {
  const F5 = testUtil.posArrayToNotationArray(chess.validMovesFrom("F5", state))   
  expect(F5).toStrictEqual(["F6", "G6", "G5", "G4", "F4", "E4", "E5", "E6"].sort())
})

export {}
