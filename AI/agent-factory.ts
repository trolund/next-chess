import { team } from "../game/types/game-types"
import { Agent } from "./agent"
import { AlphaBetaAgent } from "./AlphaBetaAgent"
import { HeuristicAlphaBetaAgent } from "./HeuristicAlphaBetaAgent"
import { MCTSAgent } from "./MCTSAgent"
import { MinmaxAgent } from "./MinmaxAgent"
import { OrderedAlphaBetaAgent } from "./OrderedAlphaBetaAgent"
import { PlayerConfig } from "../lib/leaderboard"

export const playableAgentKinds = [
    "Minimax",
    "Alpha-Beta",
    "Ordered Alpha-Beta",
    "Heuristic Alpha-Beta",
    "MCTS"
] as const

export const playerTypes = [...playableAgentKinds, "Human player"]

export const createAgent = (config: PlayerConfig, side: team): Agent | null => {
    if (config.kind === "empty") return null
    if (config.kind === "Human player") return null
    if (config.kind === "Alpha-Beta") return new AlphaBetaAgent(config.depth, side)
    if (config.kind === "Ordered Alpha-Beta") return new OrderedAlphaBetaAgent(config.depth, side)
    if (config.kind === "Heuristic Alpha-Beta") return new HeuristicAlphaBetaAgent(config.depth, side)
    if (config.kind === "MCTS") return new MCTSAgent(config.depth, side)
    return new MinmaxAgent(config.depth, side)
}
