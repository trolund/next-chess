import { loadTestCase } from "./utils/fileLoader";
import { testUtil } from '../test/utils/testUtil'

it('renders correctly', () => {
  const state = loadTestCase(1)

  console.log(testUtil.printBoard(state.board));

});

export {}