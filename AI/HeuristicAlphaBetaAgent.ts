import { chess } from "../game/game"
import { action, gameState, moveOptions, piece, pos, team } from "../game/types/game-types"
import { Agent } from "./agent"
import { createYieldController, orderActions, pointMapper, readCache, writeCache } from "./search-utils"

/// <summary>
/// Alpha-beta agent with a stronger evaluation and quiescence search
/// </summary>
export class HeuristicAlphaBetaAgent extends Agent {
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
        if (chess.checkmate(state)) {
            return state.turn === this.team ? -100000 : 100000
        }

        if (chess.gameEnded(state)) {
            return 0
        }

        let score = 0
        const centerSquares = ["D4", "E4", "D5", "E5"].map(square => chess.toPos(square))

        for (const row of state.board) {
            for (const square of row) {
                if (!square.piece || !square.team) {
                    continue
                }

                const sign = square.team === this.team ? 1 : -1
                score += pointMapper(square.piece) * sign

                const mobility = chess.validMovesFrom(square.pos, { ...state, turn: square.team }, false, false).length
                score += mobility * 0.04 * sign

                if (centerSquares.some(center => chess.comparePos(center, square.pos))) {
                    score += 0.25 * sign
                }

                if (square.piece === "pawn") {
                    score += this.pawnStructureScore(square.pos, square.team, state) * sign
                }

                if (square.piece === "king") {
                    score += this.kingSafetyScore(square.pos, square.team, state) * sign
                }
            }
        }

        return score
    }

    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }

    private search(state: gameState, depth: number, alpha: number, beta: number): number {
        const cached = readCache(this.transpositionTable, state, depth, this.team)
        if (cached !== null) {
            return cached
        }

        if (depth <= 0 || this.terminalTest(state)) {
            const score = this.quiescence(state, alpha, beta, 0)
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
            const score = this.quiescence(state, alpha, beta, 0)
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

    private quiescence(state: gameState, alpha: number, beta: number, depth: number): number {
        const standPat = this.evaluate(state)

        if (depth >= 4) {
            return standPat
        }

        if (state.turn === this.team) {
            if (standPat >= beta) {
                return beta
            }
            alpha = Math.max(alpha, standPat)
        } else {
            if (standPat <= alpha) {
                return alpha
            }
            beta = Math.min(beta, standPat)
        }

        const tacticalActions = orderActions(this.captureActions(state), state, state.turn === this.team)
        if (tacticalActions.length === 0) {
            return standPat
        }

        if (state.turn === this.team) {
            let best = standPat
            for (const candidate of tacticalActions) {
                const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
                best = Math.max(best, this.quiescence(nextState, alpha, beta, depth + 1))
                alpha = Math.max(alpha, best)
                if (beta <= alpha) {
                    break
                }
            }
            return best
        }

        let best = standPat
        for (const candidate of tacticalActions) {
            const nextState = chess.move(candidate.from, candidate.to, state, this.defaultMoveTransform)
            best = Math.min(best, this.quiescence(nextState, alpha, beta, depth + 1))
            beta = Math.min(beta, best)
            if (beta <= alpha) {
                break
            }
        }
        return best
    }

    private captureActions(state: gameState): action[] {
        return this.getActions(state).filter(candidate => {
            const from = chess.toPosSafe(candidate.from)
            const to = chess.toPosSafe(candidate.to)
            const targetField = chess.getFieldAtPos(to, state)
            const movingField = chess.getFieldAtPos(from, state)

            return targetField.piece !== null
                || (movingField.piece === "pawn" && state.enPassantTarget && chess.comparePos(state.enPassantTarget, to))
        })
    }

    private pawnStructureScore(position: pos, side: team, state: gameState): number {
        const sameFilePawns = state.board.flat().filter(square => square.team === side && square.piece === "pawn" && square.pos.col === position.col)
        const doubledPenalty = sameFilePawns.length > 1 ? -0.18 : 0

        const adjacentFiles = [position.col - 1, position.col + 1]
        const hasSupport = state.board.flat().some(square =>
            square.team === side && square.piece === "pawn" && adjacentFiles.includes(square.pos.col)
        )
        const isolatedPenalty = hasSupport ? 0 : -0.14

        return doubledPenalty + isolatedPenalty
    }

    private kingSafetyScore(position: pos, side: team, state: gameState): number {
        const adjacentOffsets = [-1, 0, 1]
        let shield = 0

        for (const rowOffset of adjacentOffsets) {
            for (const colOffset of adjacentOffsets) {
                if (rowOffset === 0 && colOffset === 0) {
                    continue
                }

                const target = { row: position.row + rowOffset, col: position.col + colOffset }
                if (!this.inBounds(target)) {
                    continue
                }

                const field = chess.getFieldAtPos(target, state)
                if (field.team === side) {
                    shield += field.piece === "pawn" ? 0.12 : 0.05
                }
            }
        }

        return shield
    }

    private inBounds(position: pos): boolean {
        return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8
    }
}
