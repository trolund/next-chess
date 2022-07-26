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

it('move piece', () => {
    const newState = chess.move(chess.toPos("D2"), chess.toPos("D4"), state)
    expect(state).not.toEqual(newState)
    expect(chess.getFieldAtPos(chess.toPos("D4"), newState).piece).toEqual("pawn")
    expect(chess.getFieldAtPos(chess.toPos("D4"), state).piece).toBeNull()
})

export {}