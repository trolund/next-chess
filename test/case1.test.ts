import { loadTestCase } from "./utils/fileLoader";
import { chess } from "../game/game";

it('case 1', () => {
  const state = loadTestCase(1)  

  expect(state).not.toBeNull()

  if(state){
    const movesWhite = chess.allValidMoves("F1", state) // trying to move white pice
    expect(movesWhite).toStrictEqual([chess.toPos("F2")])
  
    expect(chess.allValidMoves("C8", state)).toHaveLength(0) // trying to move black. can't move black when it is whites turn
  
    const movesBlack = chess.allValidMoves("C8", {...state, turn: "black"})
    console.log(movesBlack);
  }
});

export {}