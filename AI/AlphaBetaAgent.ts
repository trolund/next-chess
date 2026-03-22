import { chess } from "../game/game"
import { action, gameState, moveOptions, piece, team } from "../game/types/game-types"
import { Agent } from "./agent"
import { createYieldController, evaluateState, orderActions, pointMapper, readCache, writeCache } from "./search-utils"

/// <summary>
/// An agent that uses minimax with alpha-beta pruning
/// </summary>
export class AlphaBetaAgent extends Agent {

    private depth: number = 3
    private team: team = "white"
    private defaultMoveTransform: moveOptions = { transformation: "queen" }
    private transpositionTable = new Map<string, { depth: number, score: number }>()

    constructor(depth: number = 3, team: team = "white") {
        super()
        this.depth = depth
        this.team = team
    }

    public FindMove(state: gameState): action {
        this.transpositionTable.clear()
        const actions = orderActions(this.getActions(state), state, state.turn === this.team)

        if (actions.length === 0) {
            throw new Error("No legal moves available for " + state.turn)
        }

        const maximizing = state.turn === this.team
        let bestAction = actions[0]
        let bestScore = maximizing ? -Infinity : Infinity
        let alpha = -Infinity
        let beta = Infinity

        for (const candidate of actions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            const score = this.search(nextState, this.depth - 1, alpha, beta)

            if (maximizing) {
                if (score > bestScore) {
                    bestScore = score
                    bestAction = candidate
                }
                alpha = Math.max(alpha, bestScore)
            } else {
                if (score < bestScore) {
                    bestScore = score
                    bestAction = candidate
                }
                beta = Math.min(beta, bestScore)
            }
        }

        return bestAction
    }

    public async FindMoveAsync(state: gameState): Promise<action> {
        this.transpositionTable.clear()
        const actions = orderActions(this.getActions(state), state, state.turn === this.team)

        if (actions.length === 0) {
            throw new Error("No legal moves available for " + state.turn)
        }

        const yieldController = createYieldController()
        const maximizing = state.turn === this.team
        let bestAction = actions[0]
        let bestScore = maximizing ? -Infinity : Infinity
        let alpha = -Infinity
        let beta = Infinity

        for (const candidate of actions) {
            await yieldController.maybeYield()
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            const score = await this.searchAsync(nextState, this.depth - 1, alpha, beta, yieldController)

            if (maximizing) {
                if (score > bestScore) {
                    bestScore = score
                    bestAction = candidate
                }
                alpha = Math.max(alpha, bestScore)
            } else {
                if (score < bestScore) {
                    bestScore = score
                    bestAction = candidate
                }
                beta = Math.min(beta, bestScore)
            }
        }

        return bestAction
    }

    evaluate(state: gameState): number {
        return evaluateState(state, this.team)
    }

    pointMapper(piece: piece): number {
        return pointMapper(piece)
    }

    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    private search(state: gameState, depth: number, alpha: number, beta: number): number {
        const cached = readCache(this.transpositionTable, state, depth, this.team)
        if (cached !== null) {
            return cached
        }

        if (depth <= 0 || this.terminalTest(state)) {
            const score = this.evaluate(state)
            writeCache(this.transpositionTable, state, depth, this.team, score)
            return score
        }

        const actions = orderActions(this.getActions(state), state, state.turn === this.team)
        if (actions.length === 0) {
            const score = this.evaluate(state)
            writeCache(this.transpositionTable, state, depth, this.team, score)
            return score
        }

        if (state.turn === this.team) {
            let best = -Infinity
            for (const candidate of actions) {
                const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
                best = Math.max(best, this.search(nextState, depth - 1, alpha, beta))
                alpha = Math.max(alpha, best)
                if (beta <= alpha) {
                    break
                }
            }
            writeCache(this.transpositionTable, state, depth, this.team, best)
            return best
        }

        let best = Infinity
        for (const candidate of actions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            best = Math.min(best, this.search(nextState, depth - 1, alpha, beta))
            beta = Math.min(beta, best)
            if (beta <= alpha) {
                break
            }
        }
        writeCache(this.transpositionTable, state, depth, this.team, best)
        return best
    }

    private async searchAsync(state: gameState, depth: number, alpha: number, beta: number, yieldController: { maybeYield: () => Promise<void> }): Promise<number> {
        await yieldController.maybeYield()

        const cached = readCache(this.transpositionTable, state, depth, this.team)
        if (cached !== null) {
            return cached
        }

        if (depth <= 0 || this.terminalTest(state)) {
            const score = this.evaluate(state)
            writeCache(this.transpositionTable, state, depth, this.team, score)
            return score
        }

        const actions = orderActions(this.getActions(state), state, state.turn === this.team)
        if (actions.length === 0) {
            const score = this.evaluate(state)
            writeCache(this.transpositionTable, state, depth, this.team, score)
            return score
        }

        if (state.turn === this.team) {
            let best = -Infinity
            for (const candidate of actions) {
                const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
                best = Math.max(best, await this.searchAsync(nextState, depth - 1, alpha, beta, yieldController))
                alpha = Math.max(alpha, best)
                if (beta <= alpha) {
                    break
                }
            }
            writeCache(this.transpositionTable, state, depth, this.team, best)
            return best
        }

        let best = Infinity
        for (const candidate of actions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            best = Math.min(best, await this.searchAsync(nextState, depth - 1, alpha, beta, yieldController))
            beta = Math.min(beta, best)
            if (beta <= alpha) {
                break
            }
        }
        writeCache(this.transpositionTable, state, depth, this.team, best)
        return best
    }

    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }
}
