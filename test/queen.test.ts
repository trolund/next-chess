import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";

let state: gameState

beforeEach(() => {
  state = loadTestCase(8)!
  expect(state).not.toBeNull()
});

it('queen move', () => {
  const B4 = testUtil.posArrayToNotationArray(chess.validMovesFrom("B4", state))   
  expect(B4).toStrictEqual(["B1", "B2", "B3", "B5", "B6", "B7", "B8",
  "A4", "C4", "D4", "E4", "F4", "G4", "H4",
  "A5", "C3", "D2", "E1",
  "A3", "C5", "D6", "E7", "F8"].sort())
})

it('queen move 2', () => {
  const D3 = testUtil.posArrayToNotationArray(chess.validMovesFrom("D3", state))   
  expect(D3).toStrictEqual(["A3", "B3", "C3", "E3", "F3", "G3", "H3",
  "D4", "D2", "D1", 
  "A6", "B5", "C4", "E2", "F1",
  "B1", "C2", "E4", "F5", "G6"].sort())
})

export {}
