import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";

let state: gameState

beforeEach(() => {
  state = loadTestCase(1)!
  expect(state).not.toBeNull()
});

it('black can´t move when it is whites turn - case 1', () => {
  expect(chess.validMovesFrom("C7", state)).toHaveLength(0) // trying to move black. can't move black when it is whites turn
})

it('pwan move rules, can move to steps from start - case 1', () => {
    const F2 = chess.validMovesFrom("F2", state).sort() // trying to move white pice    
    expect(F2).toStrictEqual([chess.toPos("F4"), chess.toPos("F3"), chess.toPos("G3")].sort())

    state = testUtil.changeTurn(state) // allow black to move
  
    const D7 = chess.validMovesFrom("D7", {...state, turn: "black"}).sort()
    expect(D7).toStrictEqual([chess.toPos("D6"), chess.toPos("D5")].sort())
})

it('pwan move rules, can´t move to steps from start if there is a piece in the way - case 1', () => {
    const G2 = chess.validMovesFrom("G2", state).sort()     
    expect(G2).toHaveLength(0)
    
    state = testUtil.changeTurn(state)

    const B7 = chess.validMovesFrom("B7", state).sort()    
    expect(B7).toHaveLength(0)
})

it('pwan move rules, can move one step from start if pice 2 steps out - case 1', () => {
  const E2 = chess.validMovesFrom("E2", state).sort()    
  expect(E2).toStrictEqual([chess.toPos("E3")])
  
  state = testUtil.changeTurn(state)

  const C7 = chess.validMovesFrom("C7", state).sort()      
  expect(C7).toStrictEqual([chess.toPos("B6"), chess.toPos("C6")].sort())
})

it('pwan move rules, pwan atack - case 1', () => {
  const F2 = chess.validMovesFrom("F2", state).sort()      
  expect(F2).toStrictEqual([chess.toPos("F4"), chess.toPos("F3"), chess.toPos("G3")].sort())
})


export {}
