import { loadTestCase } from "./utils/fileLoader";
import { chess } from "../game/game";

it('case 1', () => {
  const state = loadTestCase(1)
  const validMoves = chess.allValidMoves("E3", state)
});

export {}