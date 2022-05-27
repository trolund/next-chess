import { loadTestCase } from "./utils/fileLoader";
import { testUtil } from '../test/utils/testUtil'
import { chess } from "../game/game";

it('case 1', () => {
  const state = loadTestCase(1)
  const validMoves = chess.allValidMoves({row: 4, col: 2}, state)

  

  console.log(validMoves);  

});

export {}