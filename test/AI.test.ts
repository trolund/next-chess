import { loadTestCase } from "./utils/fileLoader"
import { chess } from "../game/game"
import { gameState } from "../game/types/game-types";
import { testUtil } from "./utils/testUtil";
import { colOptions } from "../game/col-options";
import { Agent } from "../AI/agent";
import { Timer } from "./timer";
import { MinmaxAgent } from "../AI/MinmaxAgent";
import { AlphaBetaAgent } from "../AI/AlphaBetaAgent";
import { OrderedAlphaBetaAgent } from "../AI/OrderedAlphaBetaAgent";
import { MCTSAgent } from "../AI/MCTSAgent";
import { HeuristicAlphaBetaAgent } from "../AI/HeuristicAlphaBetaAgent";
import { StockfishAgent } from "../AI/StockfishAgent";
import { emptyBoard } from "../stores/emptyBoard";

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

it('ai alpha-beta depth 2', () => {
  const timer = new Timer()
  const agent = new AlphaBetaAgent(2)

  timer.start()
  const action = agent.FindMove(state)
  timer.end()

  expect(action).toBeDefined()
  console.log(action, timer.getEndTimeAsDateString)
})

it('ai ordered alpha-beta depth 2', () => {
  const timer = new Timer()
  const agent = new OrderedAlphaBetaAgent(2)

  timer.start()
  const action = agent.FindMove(state)
  timer.end()

  expect(action).toBeDefined()
  console.log(action, timer.getEndTimeAsDateString)
})

it('ai mcts depth 2', () => {
  const timer = new Timer()
  const agent = new MCTSAgent(2)

  timer.start()
  const action = agent.FindMove(state)
  timer.end()

  expect(action).toBeDefined()
  console.log(action, timer.getEndTimeAsDateString)
})

it('ai heuristic alpha-beta depth 2', () => {
  const timer = new Timer()
  const agent = new HeuristicAlphaBetaAgent(2)

  timer.start()
  const action = agent.FindMove(state)
  timer.end()

  expect(action).toBeDefined()
  console.log(action, timer.getEndTimeAsDateString)
})

it('ai stockfish preset 1 returns a legal move', () => {
  const agent = new StockfishAgent(1)
  const action = agent.FindMove(state)

  expect(chess.isValidMove(chess.toPosSafe(action.from), chess.toPosSafe(action.to), state, false, { transformation: action.promotion ?? "queen" })).toBe(true)
})

it.each([
  ["minimax", new MinmaxAgent(2)],
  ["alpha-beta", new AlphaBetaAgent(2)],
  ["ordered alpha-beta", new OrderedAlphaBetaAgent(2)],
  ["heuristic alpha-beta", new HeuristicAlphaBetaAgent(2)],
  ["mcts", new MCTSAgent(2)],
])('agent %s supports async search', async (_name, agent) => {
  const action = await agent.FindMoveAsync(state)
  expect(action).toBeDefined()
})

it.each([
  ["minimax", new MinmaxAgent(2)],
  ["alpha-beta", new AlphaBetaAgent(2)],
  ["ordered alpha-beta", new OrderedAlphaBetaAgent(2)],
  ["heuristic alpha-beta", new HeuristicAlphaBetaAgent(2)],
  ["mcts", new MCTSAgent(2)],
])('agent %s can search a promotion position without failing', (_name, agent) => {
  const board = emptyBoard.map(row => [...row])
  board[1][0] = "p"
  board[7][4] = "k"
  board[0][4] = "K"

  const specialState = testUtil.createTestGame(board, "white")
  const action = agent.FindMove(specialState)

  expect(chess.isValidMove(chess.toPosSafe(action.from), chess.toPosSafe(action.to), specialState, false, { transformation: "queen" })).toBe(true)
})

it.each([
  ["minimax", new MinmaxAgent(2)],
  ["alpha-beta", new AlphaBetaAgent(2)],
  ["ordered alpha-beta", new OrderedAlphaBetaAgent(2)],
  ["heuristic alpha-beta", new HeuristicAlphaBetaAgent(2)],
  ["mcts", new MCTSAgent(2)],
])('agent %s returns a legal move in an en-passant position', (_name, agent) => {
  const board = emptyBoard.map(row => [...row])
  board[3][4] = "p"
  board[1][3] = "P"
  board[7][4] = "k"
  board[0][4] = "K"

  const initialState = testUtil.createTestGame(board, "black")
  const enPassantState = chess.move("D7", "D5", initialState)
  const action = agent.FindMove(enPassantState)

  expect(chess.isValidMove(chess.toPosSafe(action.from), chess.toPosSafe(action.to), enPassantState, false, { transformation: "queen" })).toBe(true)
})

// it('ai minmax depth 3', () => {
//   const timer = new Timer()
//   const agent = new MinmaxAgent(3)
  
//   timer.start()
//   const action = agent.FindMove(state)
//   timer.end()

//   console.log(action, timer.getEndTimeAsDateString)
// })


export {}
