import { parentPort, workerData } from "worker_threads"
import { createAgent } from "../AI/agent-factory"
import { chess } from "../game/game"
import { gameResult, team } from "../game/types/game-types"
import { MatchSummary, PlayerConfig } from "../lib/leaderboard"

type WorkerTask = {
    id: string
    white: PlayerConfig
    black: PlayerConfig
    maxPlies: number
}

const data = workerData as WorkerTask

const runMatch = (): MatchSummary => {
    const whiteAgent = createAgent(data.white, "white")
    const blackAgent = createAgent(data.black, "black")

    if (!whiteAgent || !blackAgent) {
        throw new Error("Evaluation workers require AI player configurations for both sides")
    }

    let state = chess.createGame()
    let plies = 0
    let whiteThinkMs = 0
    let blackThinkMs = 0
    let whiteMoves = 0
    let blackMoves = 0
    const startedAt = Date.now()

    while (!state.ended && plies < data.maxPlies) {
        const side = state.turn as team
        const agent = side === "white" ? whiteAgent : blackAgent
        const moveStartedAt = Date.now()
        const action = agent.FindMove(state)
        const durationMs = Date.now() - moveStartedAt

        state = chess.move(action.from, action.to, state, { transformation: "queen" })
        plies += 1

        if (side === "white") {
            whiteThinkMs += durationMs
            whiteMoves += 1
        } else {
            blackThinkMs += durationMs
            blackMoves += 1
        }
    }

    return {
        id: data.id,
        white: data.white,
        black: data.black,
        winner: state.ended ? (state.winner ?? null) : null,
        result: state.ended ? (state.result ?? "checkmate") : "max-plies",
        plies,
        whiteThinkMs,
        blackThinkMs,
        whiteMoves,
        blackMoves,
        durationMs: Date.now() - startedAt
    }
}

try {
    const result = runMatch()
    parentPort?.postMessage({ ok: true, result })
} catch (error) {
    parentPort?.postMessage({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
    })
}
