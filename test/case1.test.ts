import { loadTestCase, loadAllTestCases } from "./utils/fileLoader";
import { testUtil } from '../test/utils/testUtil'
import { chess } from "../game/game";
import { testCase } from "../game/types/game-types";

it('All file cases', () => {
  const cases = loadAllTestCases()
  console.log("***" + cases.length);
  console.log("***" + cases[0]);

  cases.forEach(c => {
    console.log(c);
    

    console.log("----------------------------------");
    console.log("Test case: " + c?.name);
    if(c?.comment) console.log("comment: " + c.comment)
    
    const state = testUtil.createTestGame(c?.board)

    c.subCases.forEach(sc => {
      console.log("name: " + sc.name)
      if(sc.comment) console.log("comment: " + sc.comment)
      const validMoves = chess.allValidMoves({row: 0, col: 2}, state) 
      expect(sc.expected.sort()).toEqual(validMoves.sort())
    })
    console.log("----------------------------------");
  })
});

it('case 1', () => {
  const state = loadTestCase(1)
  const validMoves = chess.allValidMoves("E3", state)
});

export {}