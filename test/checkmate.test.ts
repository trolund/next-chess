import { loadTestCase, loadTestCaseWithName } from "./utils/fileLoader"
import { chess } from "../game/game"

it('checkmate 1', () => {
  const state = loadTestCaseWithName("checkmate-1.json")!
  expect(state).not.toBeNull()
  expect(chess.checkmate(state)).toBe(true)
})

it('checkmate 4', () => {
  const state = loadTestCaseWithName("checkmate-2.json")!
  expect(state).not.toBeNull()
  expect(chess.checkmate(state)).toBe(true)
})

it('checkmate 5', () => {
  const state = loadTestCaseWithName("checkmate-3.json")!
  expect(state).not.toBeNull()
  expect(chess.checkmate(state)).toBe(true)
})

it('checkmate 2', () => {
  const state = loadTestCase(9)!
  expect(state).not.toBeNull()
  
  expect(chess.checkmate(state)).toBe(true)
})

it('checkmate 3', () => {
  const state = loadTestCase(13)!
  expect(state).not.toBeNull()
  
  expect(chess.checkmate(state)).toBe(true)
})

it('check - king is check', () => {
  const state = loadTestCase(9)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(true)
})

it('check - king is check', () => {
  const state = loadTestCase(12)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(true)
})

it('check - king is check, 2', () => {
  const state = loadTestCase(10)!
  expect(state).not.toBeNull()
  expect(chess.check(state)).toBe(true)
})

it('check - no King?', () => {
    const state = loadTestCase(2)!
    expect(state).not.toBeNull()
    expect(() => chess.check(state)).toThrow()
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
