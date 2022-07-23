import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"

it('checkmate', () => {
  const state = loadTestCase(9)!
  expect(state).not.toBeNull()

  console.log(state.turn);
  
  expect(chess.checkmate(state)).toBe(true)
})

export {}
