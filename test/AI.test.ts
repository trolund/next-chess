import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";
import { colOptions } from "../game/col-options";
import { agent } from "../AI/agent";

let state: gameState

beforeEach(() => {
  state = loadTestCase(3)!
  expect(state).not.toBeNull()
});

it('ai', () => {
  const action = agent.miniMax(state, 2)
  console.log(action)
})

export {}