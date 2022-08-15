import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";
import { colOptions } from "../game/col-options";
import { Agent, MinmaxAgent } from "../AI/Agent";

let state: gameState

beforeEach(() => {
  state = loadTestCase(3)!
  expect(state).not.toBeNull()
});

it('ai minmax depth 2', () => {
  const agent = new MinmaxAgent(2)
  const action = agent.FindMove(state)
  console.log(action)
})

export {}