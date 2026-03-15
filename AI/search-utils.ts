import { chess } from "../game/game"
import { action, gameState, piece, team } from "../game/types/game-types"

type CacheEntry = {
    depth: number
    score: number
}

type YieldController = {
    maybeYield: () => Promise<void>
}

const pointMapper = (piece: piece): number => {
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

const evaluateState = (state: gameState, team: team): number => {
    let score = 0

    for (const row of state.board) {
        for (const square of row) {
            if (!square.piece || !square.team) {
                continue
            }

            const material = pointMapper(square.piece)
            score += square.team === team ? material : -material
        }
    }

    if (chess.checkmate(state)) {
        return state.turn === team ? -100000 : 100000
    }

    if (chess.stalemate(state)) {
        return 0
    }

    const mobility = chess.allValidMoves(state).length
    return score + (state.turn === team ? mobility : -mobility) * 0.05
}

const cacheKey = (state: gameState, depth: number, team: team) => `${chess.positionKey(state)}|${depth}|${team}`

const readCache = (cache: Map<string, CacheEntry>, state: gameState, depth: number, team: team): number | null => {
    const entry = cache.get(cacheKey(state, depth, team))
    if (!entry || entry.depth < depth) {
        return null
    }

    return entry.score
}

const writeCache = (cache: Map<string, CacheEntry>, state: gameState, depth: number, team: team, score: number) => {
    cache.set(cacheKey(state, depth, team), { depth, score })
}

const actionHeuristic = (candidate: action, state: gameState): number => {
    const from = chess.toPosSafe(candidate.from)
    const to = chess.toPosSafe(candidate.to)
    const movingField = chess.getFieldAtPos(from, state)
    const targetField = chess.getFieldAtPos(to, state)

    let score = 0

    if (targetField.piece) {
        score += pointMapper(targetField.piece) * 10 - pointMapper(movingField.piece)
    }

    if (movingField.piece === "pawn" && (to.row === 0 || to.row === 7)) {
        score += 8
    }

    const centerDistance = Math.abs(3.5 - to.row) + Math.abs(3.5 - to.col)
    score += 4 - centerDistance

    return score
}

const orderActions = (actions: action[], state: gameState, maximizing: boolean): action[] => {
    return [...actions].sort((left, right) => {
        const leftScore = actionHeuristic(left, state)
        const rightScore = actionHeuristic(right, state)
        return maximizing ? rightScore - leftScore : leftScore - rightScore
    })
}

const createYieldController = (batchSize: number = 750): YieldController => {
    let nodes = 0

    return {
        maybeYield: async () => {
            nodes += 1
            if (nodes % batchSize === 0) {
                await new Promise<void>(resolve => setTimeout(resolve, 0))
            }
        }
    }
}

export { createYieldController, evaluateState, orderActions, pointMapper, readCache, writeCache }
