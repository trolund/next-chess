import { chess } from "../game/game"
import { action, gameState, moveOptions, piece, team } from "../game/types/game-types"
import { Agent } from "./agent"

/// <summary>
/// Alpha-beta agent with lightweight move ordering to improve pruning
/// </summary>
export class OrderedAlphaBetaAgent extends Agent {

    private depth: number = 3
    private team: team = "white"
    private defaultMoveTransform: moveOptions = { transformation: "queen" }

    constructor(depth: number = 3, team: team = "white") {
        super()
        this.depth = depth
        this.team = team
    }

    public FindMove(state: gameState): action {
        const actions = this.orderActions(this.getActions(state), state, state.turn === this.team)

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

        const maximizing = state.turn === this.team
        const actions = this.orderActions(this.getActions(state), state, maximizing)

        if (actions.length === 0) {
            return this.evaluate(state)
        }

        if (maximizing) {
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

    private orderActions(actions: action[], state: gameState, maximizing: boolean): action[] {
        return [...actions].sort((left, right) => {
            const leftScore = this.actionHeuristic(left, state)
            const rightScore = this.actionHeuristic(right, state)
            return maximizing ? rightScore - leftScore : leftScore - rightScore
        })
    }

    private actionHeuristic(candidate: action, state: gameState): number {
        const from = chess.toPosSafe(candidate.from)
        const to = chess.toPosSafe(candidate.to)
        const movingField = chess.getFieldAtPos(from, state)
        const targetField = chess.getFieldAtPos(to, state)

        let score = 0

        if (targetField.piece) {
            score += this.pointMapper(targetField.piece) * 10 - this.pointMapper(movingField.piece)
        }

        if (movingField.piece === "pawn" && (to.row === 0 || to.row === 7)) {
            score += 8
        }

        const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
        if (chess.checkmate(nextState)) {
            score += 100000
        } else if (chess.check(nextState)) {
            score += 4
        }

        return score
    }

    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }
}
