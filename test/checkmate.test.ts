import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"

// it('checkmate', () => {
//   const state = loadTestCase(9)!
//   expect(state).not.toBeNull()
  
//   expect(chess.checkmate(state)).toBe(true)
// })

it('check - king is check', () => {
  const state = loadTestCase(9)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(true)
})

it('check - king is check, 2', () => {
  const state = loadTestCase(10)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(true)
})

it('check - no King?', () => {
  try{
    const state = loadTestCase(2)!
    expect(state).not.toBeNull()
    expect(chess.check(state)).toThrow()
  }catch (e) {

  }
})

it('check - king is NOT check', () => {
  const state = loadTestCase(3)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(false)
})

it('check - king is NOT check', () => {
  const state = loadTestCase(11)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(false)
})

export {}
