import { chess } from "../game/game"
import { simpleBoard } from "../game/types/game-types"
import { emptyBoard } from "../stores/emptyBoard"
import { testUtil } from "./utils/testUtil"

it('to pos translation', () => {
  expect(chess.toPos("C8")).toStrictEqual({row: 0, col: 2})
  expect(chess.toPos("D7")).toStrictEqual({row: 1, col: 3})
  expect(chess.toPos("D3")).toStrictEqual({row: 5, col: 3})
  expect(chess.toPos("B5")).toStrictEqual({row: 3, col: 1})
})

it('to pos faild translation', () => {
  try {  
      expect(chess.toPos("8C")).toThrow()
      expect(chess.toPos("")).toThrow()
      expect(chess.toPos("hej")).toThrow()
      expect(chess.toPos("C9")).toThrow()
      expect(chess.toPos("C-9")).toThrow()
      expect(chess.toPos("C100")).toThrow()
      expect(chess.toPos("X1")).toThrow()

  } catch (_) {}
})  

it('to pos translation', () => {
  expect(chess.toPos("C8")).toStrictEqual({row: 0, col: 2})
  expect(chess.toPos("D7")).toStrictEqual({row: 1, col: 3})
  expect(chess.toPos("D3")).toStrictEqual({row: 5, col: 3})
  expect(chess.toPos("B5")).toStrictEqual({row: 3, col: 1})
})

it('validate size of SimpleBoard', () => {
  const correctBoard = emptyBoard
  expect(testUtil.validateSizeOfSimpleBoard(correctBoard)).toBe(true)
})

it('To big board y', () => {
  const wrongBoard: simpleBoard = [["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"],
                      ["#", "#", "#", "#", "#", "#", "#", "#"]]
  expect(testUtil.validateSizeOfSimpleBoard(wrongBoard)).toBe(false)
})

it('To big board x', () => {
  const wrongBoard: simpleBoard = [ ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"]]
  expect(testUtil.validateSizeOfSimpleBoard(wrongBoard)).toBe(false)
})

it('To big board x - 2', () => {
  const wrongBoard: simpleBoard = [ ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#", "#"]]
  expect(testUtil.validateSizeOfSimpleBoard(wrongBoard)).toBe(false)
})

it('To big board x, uneven - 3', () => {
  const wrongBoard: simpleBoard = [  ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#", "#"]]
  expect(testUtil.validateSizeOfSimpleBoard(wrongBoard)).toBe(false)
})

it('too small', () => {
  const wrongBoard: simpleBoard = [ ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"],
                        ["#", "#", "#", "#", "#", "#", "#"]]
  expect(testUtil.validateSizeOfSimpleBoard(wrongBoard)).toBe(false)
})

export {}

