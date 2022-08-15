import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";
import { colOptions } from "../game/col-options";
import { Agent, MinmaxAgent } from "../AI/Agent";
import { Timer } from "./timer";

let state: gameState

beforeEach(() => {
  state = loadTestCase(3)!
  expect(state).not.toBeNull()
});

it('ai minmax depth 2', () => {
  const timer = new Timer()
  const agent = new MinmaxAgent(2)

  timer.start()
  const action = agent.FindMove(state)
  timer.end()

  console.log(action, timer.getEndTimeAsDateString)
})

it('ai minmax depth 3', () => {
  const timer = new Timer()
  const agent = new MinmaxAgent(3)
  
  timer.start()
  const action = agent.FindMove(state)
  timer.end()

  console.log(action, timer.getEndTimeAsDateString)
})


export {}