import { chess } from "../game/game"
import { action, gameState, moveOptions, piece, team } from "../game/types/game-types"
import { Agent } from "./agent"
import { createYieldController, evaluateState, pointMapper } from "./search-utils"

/// <summary>
/// An agent that uses the minmax algorithm to find the best move
/// </summary>
export class MinmaxAgent extends Agent {

    private depth: number = 3
    private team: team = "white"
    private defaultMoveTransform: moveOptions = { transformation: "queen" }

    constructor(depth: number = 3, team: team = "white") {
        super()
        this.depth = depth
        this.team = team
    }

    public FindMove(state: gameState): action {
        const actions = this.getActions(state)

        if (actions.length === 0) {
            throw new Error("No legal moves available for " + state.turn)
        }

        let bestAction = actions[0]
        let bestScore = state.turn === this.team ? -Infinity : Infinity

        for (const candidate of actions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            const score = this.search(nextState, this.depth - 1)

            if (state.turn === this.team) {
                if (score > bestScore) {
                    bestScore = score
                    bestAction = candidate
                }
            } else if (score < bestScore) {
                bestScore = score
                bestAction = candidate
            }
        }

        return bestAction
    }

    public async FindMoveAsync(state: gameState): Promise<action> {
        const actions = this.getActions(state)

        if (actions.length === 0) {
            throw new Error("No legal moves available for " + state.turn)
        }

        const yieldController = createYieldController()
        let bestAction = actions[0]
        let bestScore = state.turn === this.team ? -Infinity : Infinity

        for (const candidate of actions) {
            await yieldController.maybeYield()
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            const score = await this.searchAsync(nextState, this.depth - 1, yieldController)

            if (state.turn === this.team) {
                if (score > bestScore) {
                    bestScore = score
                    bestAction = candidate
                }
            } else if (score < bestScore) {
                bestScore = score
                bestAction = candidate
            }
        }

        return bestAction
    }

    /// <summary>
    /// Evaluates the state of the game
    /// </summary>
    evaluate(state: gameState): number {
        return evaluateState(state, this.team)
    }

    pointMapper(piece: piece): number {
        return pointMapper(piece)
    }

    /// <summary>
    /// Gets all the possible actions for the agent
    /// </summary>
    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    private search(state: gameState, depth: number): number {
        if (depth <= 0 || this.terminalTest(state)) {
            return this.evaluate(state)
        }

        const actions = this.getActions(state)
        if (actions.length === 0) {
            return this.evaluate(state)
        }

        if (state.turn === this.team) {
            let best = -Infinity
            for (const candidate of actions) {
                const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
                best = Math.max(best, this.search(nextState, depth - 1))
            }
            return best
        }

        let best = Infinity
        for (const candidate of actions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            best = Math.min(best, this.search(nextState, depth - 1))
        }
        return best
    }

    private async searchAsync(state: gameState, depth: number, yieldController: { maybeYield: () => Promise<void> }): Promise<number> {
        await yieldController.maybeYield()

        if (depth <= 0 || this.terminalTest(state)) {
            return this.evaluate(state)
        }

        const actions = this.getActions(state)
        if (actions.length === 0) {
            return this.evaluate(state)
        }

        if (state.turn === this.team) {
            let best = -Infinity
            for (const candidate of actions) {
                const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
                best = Math.max(best, await this.searchAsync(nextState, depth - 1, yieldController))
            }
            return best
        }

        let best = Infinity
        for (const candidate of actions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            best = Math.min(best, await this.searchAsync(nextState, depth - 1, yieldController))
        }
        return best
    }

    /// <summary>
    /// Checks if the state is a terminal state
    /// </summary>
    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }
}
