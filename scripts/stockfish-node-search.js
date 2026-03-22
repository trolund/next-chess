const path = require("path")
const { spawn } = require("child_process")

const positionCommand = process.argv[2]
const moveTimeMs = Number(process.argv[3] ?? "1000")
const hashMb = Number(process.argv[4] ?? "64")
const searchGraceMs = 2500
const killGraceMs = 2500

if (!positionCommand) {
    console.error("Missing Stockfish position command.")
    process.exit(1)
}

const enginePath = path.resolve(__dirname, "..", "node_modules", "stockfish", "bin", "stockfish-18-lite-single.js")
const engine = spawn(process.execPath, [enginePath], { stdio: "pipe" })

let buffer = ""
let phase = "uci"
let bestMove = ""
let finished = false
let softTimeout = null
let hardTimeout = null

const fail = error => {
    if (finished) {
        return
    }

    finished = true
    if (softTimeout) {
        clearTimeout(softTimeout)
    }
    if (hardTimeout) {
        clearTimeout(hardTimeout)
    }
    console.error(error instanceof Error ? error.message : String(error))
    try {
        engine.kill()
    } catch (_error) {}
    process.exit(1)
}

const send = command => {
    engine.stdin.write(`${command}\n`)
}

const handleLine = line => {
    if (!line || finished) {
        return
    }

    if (phase === "uci" && line === "uciok") {
        phase = "ready"
        send(`setoption name Hash value ${hashMb}`)
        send("isready")
        return
    }

    if (phase === "ready" && line === "readyok") {
        phase = "search"
        send("ucinewgame")
        send(positionCommand)
        send(`go movetime ${moveTimeMs}`)
        softTimeout = setTimeout(() => {
            if (finished) {
                return
            }

            send("stop")
            hardTimeout = setTimeout(() => {
                fail(new Error(`Stockfish search exceeded its ${moveTimeMs} ms move budget.`))
            }, killGraceMs)
        }, moveTimeMs + searchGraceMs)
        return
    }

    if (line.startsWith("bestmove ")) {
        bestMove = line
        finished = true
        if (softTimeout) {
            clearTimeout(softTimeout)
        }
        if (hardTimeout) {
            clearTimeout(hardTimeout)
        }
        console.log(line)
        send("quit")
    }
}

const handleChunk = chunk => {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    lines.forEach(line => handleLine(line.trim()))
}

engine.stdout.on("data", handleChunk)
engine.stderr.on("data", handleChunk)
engine.on("error", fail)
engine.on("exit", code => {
    if (finished && bestMove) {
        process.exit(0)
    }

    fail(new Error(`Stockfish exited before returning a move (code ${code ?? "unknown"}).`))
})

send("uci")
