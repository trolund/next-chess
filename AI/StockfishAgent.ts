import { chess } from "../game/game"
import { action, gameState, team } from "../game/types/game-types"
import { Agent } from "./agent"
import { orderActions } from "./search-utils"

const STOCKFISH_BROWSER_PATH = "/vendor/stockfish/stockfish-18-lite-single.js"
const STOCKFISH_NODE_WRAPPER_PATH = "scripts/stockfish-node-search.js"
const STOCKFISH_HASH_MB = 64
const STOCKFISH_INIT_TIMEOUT_MS = 15000
const STOCKFISH_SEARCH_GRACE_MS = 2500
const STOCKFISH_STOP_GRACE_MS = 2500

type PendingRequest = {
    lines: string[]
    resolve: (lines: string[]) => void
    reject: (error: Error) => void
    terminalLine: (line: string) => boolean
}

export const stockfishPresetToMs = (preset: number): number => {
    switch (preset) {
        case 1:
            return 1000
        case 2:
            return 5000
        case 3:
            return 15000
        case 4:
            return 60000
        default:
            return 5000
    }
}

const parseBestMove = (line: string): action => {
    const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i)
    const bestMove = match?.[1]

    if (!bestMove) {
        throw new Error(`Unable to parse Stockfish move from "${line}"`)
    }

    const promotionToken = bestMove[4]?.toLowerCase?.()
    const promotion = promotionToken === "q"
        ? "queen"
        : promotionToken === "r"
            ? "rook"
            : promotionToken === "b"
                ? "bishop"
                : promotionToken === "n"
                    ? "knight"
                    : undefined

    return {
        from: bestMove.slice(0, 2).toUpperCase() as action["from"],
        to: bestMove.slice(2, 4).toUpperCase() as action["to"],
        promotion
    }
}

const nodeRequire = () => eval("require") as NodeRequire

export class StockfishAgent extends Agent {
    private readonly team: team
    private readonly moveTimeMs: number
    private worker: Worker | null = null
    private initPromise: Promise<void> | null = null
    private pending: PendingRequest | null = null
    private startedGame = false

    constructor(preset: number = 2, team: team = "white") {
        super()
        this.team = team
        this.moveTimeMs = stockfishPresetToMs(preset)
    }

    public FindMove(state: gameState): action {
        if (typeof window !== "undefined") {
            throw new Error("StockfishAgent.FindMove is not available in the browser. Use FindMoveAsync instead.")
        }

        try {
            return this.findMoveInNode(state)
        } catch (error) {
            return this.fallbackMove(state, error)
        }
    }

    public async FindMoveAsync(state: gameState): Promise<action> {
        if (typeof window === "undefined") {
            return this.FindMove(state)
        }

        try {
            await this.ensureBrowserReady(state)
            this.postMessage(this.positionCommand(state))

            const response = await this.runTimedSearch()
            const bestMoveLine = response.find(line => line.startsWith("bestmove "))

            if (!bestMoveLine) {
                throw new Error("Stockfish search finished without returning a best move.")
            }

            return parseBestMove(bestMoveLine)
        } catch (error) {
            this.resetWorker(error instanceof Error ? error : new Error(String(error)))
            return this.fallbackMove(state, error)
        }
    }

    public dispose(): void {
        this.resetWorker(new Error("Stockfish engine was disposed before the request completed."))
    }

    evaluate(_state: gameState): number {
        return 0
    }

    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }

    private async ensureBrowserReady(state: gameState): Promise<void> {
        if (typeof Worker !== "function") {
            throw new Error("This browser does not support Web Workers, so Stockfish cannot run here.")
        }

        if (!this.worker) {
            this.worker = new Worker(STOCKFISH_BROWSER_PATH)
            this.worker.onmessage = (event: MessageEvent<string>) => {
                this.handleMessage(typeof event.data === "string" ? event.data : String(event.data))
            }
            this.worker.onerror = () => {
                this.resetWorker(new Error("Stockfish worker failed while searching."))
            }
        }

        if (!this.initPromise) {
            this.initPromise = (async () => {
                await this.sendCommand("uci", line => line === "uciok", STOCKFISH_INIT_TIMEOUT_MS)
                this.postMessage(`setoption name Hash value ${STOCKFISH_HASH_MB}`)
                await this.sendCommand("isready", line => line === "readyok", STOCKFISH_INIT_TIMEOUT_MS)
            })()
        }

        await this.initPromise

        if (!this.startedGame || this.isNewGame(state)) {
            this.postMessage("ucinewgame")
            await this.sendCommand("isready", line => line === "readyok", STOCKFISH_INIT_TIMEOUT_MS)
            this.startedGame = true
        }
    }

    private handleMessage(payload: string) {
        const lines = payload
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)

        for (const line of lines) {
            if (!this.pending) {
                continue
            }

            this.pending.lines.push(line)

            if (this.pending.terminalLine(line)) {
                const current = this.pending
                this.pending = null
                current.resolve(current.lines)
            }
        }
    }

    private sendCommand(command: string, terminalLine: (line: string) => boolean, timeoutMs: number = 0): Promise<string[]> {
        if (!this.worker) {
            throw new Error("Stockfish worker is not initialized.")
        }

        if (this.pending) {
            throw new Error(`Stockfish cannot process "${command}" while another command is still pending.`)
        }

        return new Promise<string[]>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | null = null

            this.pending = {
                lines: [],
                resolve: lines => {
                    if (timer) {
                        clearTimeout(timer)
                    }
                    resolve(lines)
                },
                reject: error => {
                    if (timer) {
                        clearTimeout(timer)
                    }
                    reject(error)
                },
                terminalLine
            }

            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    if (!this.pending) {
                        return
                    }

                    this.pending = null
                    reject(new Error(`Stockfish command "${command}" timed out after ${timeoutMs} ms.`))
                }, timeoutMs)
            }

            this.postMessage(command)
        })
    }

    private postMessage(command: string) {
        if (!this.worker) {
            throw new Error("Stockfish worker is not initialized.")
        }

        this.worker.postMessage(command)
    }

    private isNewGame(state: gameState): boolean {
        return (state.positionHistory?.length ?? 0) <= 1
    }

    private positionCommand(state: gameState): string {
        return `position fen ${chess.toFen(state)}`
    }

    private async runTimedSearch(): Promise<string[]> {
        let softTimer: ReturnType<typeof setTimeout> | null = null
        let hardTimer: ReturnType<typeof setTimeout> | null = null

        try {
            const searchPromise = this.sendCommand(`go movetime ${this.moveTimeMs}`, line => line.startsWith("bestmove "))
            const watchdogPromise = new Promise<string[]>((_resolve, reject) => {
                softTimer = setTimeout(() => {
                    try {
                        this.postMessage("stop")
                    } catch (_error) {}

                    hardTimer = setTimeout(() => {
                        const error = new Error(`Stockfish exceeded its ${this.moveTimeMs} ms move budget.`)
                        this.resetWorker(error)
                        reject(error)
                    }, STOCKFISH_STOP_GRACE_MS)
                }, this.moveTimeMs + STOCKFISH_SEARCH_GRACE_MS)
            })

            return await Promise.race([searchPromise, watchdogPromise])
        } finally {
            if (softTimer) {
                clearTimeout(softTimer)
            }
            if (hardTimer) {
                clearTimeout(hardTimer)
            }
        }
    }

    private findMoveInNode(state: gameState): action {
        const require = nodeRequire()
        const childProcess = require("child_process") as typeof import("child_process")
        const path = require("path") as typeof import("path")
        const wrapperPath = path.resolve(process.cwd(), STOCKFISH_NODE_WRAPPER_PATH)

        const result = childProcess.spawnSync(process.execPath, [wrapperPath, this.positionCommand(state), String(this.moveTimeMs), String(STOCKFISH_HASH_MB)], {
            cwd: process.cwd(),
            encoding: "utf8",
            maxBuffer: 16 * 1024 * 1024,
            timeout: this.moveTimeMs + STOCKFISH_SEARCH_GRACE_MS + STOCKFISH_STOP_GRACE_MS + 2000
        })

        if (result.error) {
            throw result.error
        }

        const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
        const bestMoveLine = output.split(/\r?\n/).find(line => line.startsWith("bestmove "))

        if (!bestMoveLine) {
            throw new Error(`Stockfish did not return a move.\n${output}`)
        }

        return parseBestMove(bestMoveLine)
    }

    private resetWorker(error?: Error) {
        if (this.pending) {
            this.pending.reject(error ?? new Error("Stockfish request was reset."))
            this.pending = null
        }

        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }

        this.initPromise = null
        this.startedGame = false
    }

    private fallbackMove(state: gameState, error: unknown): action {
        console.warn("Stockfish fallback move used.", error)
        const actions = orderActions(this.getActions(state), state, state.turn === this.team)
        const fallback = actions[0]

        if (!fallback) {
            throw new Error("No legal moves available for Stockfish fallback.")
        }

        return fallback
    }
}
