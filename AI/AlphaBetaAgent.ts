import { chess } from "../game/game"
import { action, gameState, moveOptions, piece, team } from "../game/types/game-types"
import { Agent } from "./agent"

/// <summary>
/// An agent that uses minimax with alpha-beta pruning
/// </summary>
export class AlphaBetaAgent extends Agent {

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

    evaluate(state: gameState): number {
        let score = 0

        for (const row of state.board) {
            for (const square of row) {
                if (!square.piece || !square.team) {
                    continue
                }

                const material = this.pointMapper(square.piece)
                score += square.team === this.team ? material : -material
            }
        }

        if (chess.checkmate(state)) {
            return state.turn === this.team ? -100000 : 100000
        }

        if (chess.stalemate(state)) {
            return 0
        }

        const mobility = chess.allValidMoves(state).length
        return score + (state.turn === this.team ? mobility : -mobility) * 0.05
    }

    pointMapper(piece: piece): number {
        switch (piece) {
            case "pawn":
                return 1
            case "rook":
                return 5
            case "knight":
                return 3
            case "bishop":
                return 3
            case "queen":
                return 9
            case "king":
                return 100
            default:
                return 0
        }
    }

    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    private search(state: gameState, depth: number, alpha: number, beta: number): number {
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
                best = Math.max(best, this.search(nextState, depth - 1, alpha, beta))
                alpha = Math.max(alpha, best)
                if (beta <= alpha) {
                    break
                }
            }
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
        return best
    }

    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }
}
