import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";

let state: gameState
let state2: gameState

beforeEach(() => {
  state = loadTestCase(5)!
  state2 = loadTestCase(6)!
  expect(state).not.toBeNull()
  expect(state2).not.toBeNull()
});

it('bishop can move on digonals', () => {
  const D3 = testUtil.posArrayToNotationArray(chess.allValidMoves("D3", state))   
  expect(D3).toStrictEqual(["B1", "C2", "E2", "F1", "C4", "B5", "A6", "E4", "F5", "G6", "H7"].sort())
})

it('bishop can´t jump over other pices', () => {
  const G3 = testUtil.posArrayToNotationArray(chess.allValidMoves("G3", state))   
  expect(G3).toStrictEqual(["E1", "F2", "H2", "H4"].sort())
})

it('bishop can´t jump over other pices', () => {
  const D6 = testUtil.posArrayToNotationArray(chess.allValidMoves("D6", state))   
  expect(D6).toStrictEqual(["E5", "C5", "B4", "A3", "E7", "F8", "C7", "B8"].sort())
})

it('bishop can attack', () => {
  const B3 = testUtil.posArrayToNotationArray(chess.allValidMoves("B3", state2))   
  expect(B3).toStrictEqual(["A2", "A4", "C2", "D1", "C4", "D5", "E6"].sort())
})

it('bishop can attack 2', () => {
  const D3 = testUtil.posArrayToNotationArray(chess.allValidMoves("D3", state2))   
  expect(D3).toStrictEqual(["B1", "C2", "F1", "E2", "C4", "B5", "E4", "F5"].sort())
})

it('bishop can attack 3', () => {
  const G3 = testUtil.posArrayToNotationArray(chess.allValidMoves("G3", state2))   
  expect(G3).toStrictEqual(["H4", "E1", "F2", "H2"].sort())
})

it('bishop can attack 4', () => {
  const D6 = testUtil.posArrayToNotationArray(chess.allValidMoves("D6", state))   
  expect(D6).toStrictEqual(["E5", "C5", "B4", "C7", "B8", "E7", "F8", "A3"].sort())
})

export {}
