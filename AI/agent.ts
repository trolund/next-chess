import { action, AIRes, gameState, piece } from "../game/types/game-types";

/// <summary>
/// An abstract class for an agent that can play a game
/// </summary>
export abstract class Agent {
    /// <summary>
    /// Evaluates the state of the game
    /// </summary>
    evaluate(state: gameState): number { return 0 }
    /// <summary>
    /// Finds the best move for the agent
    /// </summary>
    public abstract FindMove(state: gameState): action
    /// <summary>
    /// Gets all the possible actions for the agent
    /// </summary>
    abstract getActions(state: gameState): action[]
    /// <summary>
    /// Checks if the state is a terminal state
    /// </summary>
    abstract terminalTest(state: gameState): boolean

}