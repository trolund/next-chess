import fs from "fs"
import os from "os"
import path from "path"
import { Worker } from "worker_threads"
import { playableAgentKinds } from "../AI/agent-factory"
import {
    applyMatchToLeaderboard,
    EvaluationReport,
    MatchSummary,
    PlayerConfig
} from "../lib/leaderboard"

type CliOptions = {
    rounds: number
    depths: number[]
    agents: string[]
    parallelism: number
    maxPlies: number
    outFile: string
}

type MatchTask = {
    id: string
    white: PlayerConfig
    black: PlayerConfig
    maxPlies: number
}

const parseArgs = (): CliOptions => {
    const args = process.argv.slice(2)
    const valueFor = (flag: string) => {
        const index = args.indexOf(flag)
        return index >= 0 ? args[index + 1] : undefined
    }

    const rounds = Number(valueFor("--rounds") ?? "2")
    const depths = String(valueFor("--depths") ?? "1,2")
        .split(",")
        .map(value => Number(value.trim()))
        .filter(value => Number.isFinite(value) && value > 0)
    const agents = String(valueFor("--agents") ?? playableAgentKinds.join(","))
        .split(",")
        .map(value => value.trim())
        .filter(value => playableAgentKinds.includes(value as typeof playableAgentKinds[number]))
    const parallelism = Number(valueFor("--parallel") ?? String(Math.max(1, Math.min(os.cpus().length, 4))))
    const maxPlies = Number(valueFor("--max-plies") ?? "160")
    const outFile = path.resolve(process.cwd(), valueFor("--out") ?? "agent-evaluation-report.json")

    if (!Number.isFinite(rounds) || rounds < 1) {
        throw new Error("--rounds must be a positive number")
    }

    if (depths.length === 0) {
        throw new Error("--depths must include at least one depth")
    }

    if (agents.length === 0) {
        throw new Error("--agents must include at least one supported agent")
    }

    if (!Number.isFinite(parallelism) || parallelism < 1) {
        throw new Error("--parallel must be a positive number")
    }

    if (!Number.isFinite(maxPlies) || maxPlies < 1) {
        throw new Error("--max-plies must be a positive number")
    }

    return {
        rounds,
        depths,
        agents,
        parallelism,
        maxPlies,
        outFile
    }
}

const buildProfiles = (options: CliOptions): PlayerConfig[] => {
    const profiles: PlayerConfig[] = []
    for (const kind of options.agents) {
        for (const depth of options.depths) {
            profiles.push({ kind, depth })
        }
    }
    return profiles
}

const buildTasks = (profiles: PlayerConfig[], options: CliOptions): MatchTask[] => {
    const tasks: MatchTask[] = []

    for (let round = 0; round < options.rounds; round++) {
        for (let left = 0; left < profiles.length; left++) {
            for (let right = left + 1; right < profiles.length; right++) {
                tasks.push({
                    id: `r${round + 1}-${left}-${right}-w`,
                    white: profiles[left],
                    black: profiles[right],
                    maxPlies: options.maxPlies
                })
                tasks.push({
                    id: `r${round + 1}-${left}-${right}-b`,
                    white: profiles[right],
                    black: profiles[left],
                    maxPlies: options.maxPlies
                })
            }
        }
    }

    return tasks
}

const runWorkerTask = (task: MatchTask): Promise<MatchSummary> =>
    new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve(__dirname, "evaluate-agent-worker.ts"), {
            workerData: task,
            execArgv: ["-r", "ts-node/register/transpile-only"],
            env: {
                ...process.env,
                TS_NODE_COMPILER_OPTIONS: JSON.stringify({ module: "commonjs" })
            }
        })

        worker.once("message", message => {
            if (message?.ok) {
                resolve(message.result as MatchSummary)
                return
            }

            reject(new Error(message?.error ?? `Worker failed for task ${task.id}`))
        })

        worker.once("error", reject)
        worker.once("exit", code => {
            if (code !== 0) {
                reject(new Error(`Worker exited with code ${code} for task ${task.id}`))
            }
        })
    })

const runTasks = async (tasks: MatchTask[], parallelism: number): Promise<MatchSummary[]> => {
    const results: MatchSummary[] = new Array(tasks.length)
    let nextIndex = 0

    const runLoop = async () => {
        while (true) {
            const currentIndex = nextIndex
            nextIndex += 1

            if (currentIndex >= tasks.length) {
                return
            }

            results[currentIndex] = await runWorkerTask(tasks[currentIndex])
            const result = results[currentIndex]
            console.log(
                `[${currentIndex + 1}/${tasks.length}] ${result.white.kind} D${result.white.depth} vs ${result.black.kind} D${result.black.depth} ` +
                `=> ${result.winner ?? result.result} in ${result.plies} plies (${result.durationMs} ms)`
            )
        }
    }

    await Promise.all(Array.from({ length: Math.min(parallelism, tasks.length) }, () => runLoop()))
    return results
}

const main = async () => {
    const options = parseArgs()
    const profiles = buildProfiles(options)
    const tasks = buildTasks(profiles, options)

    if (tasks.length === 0) {
        throw new Error("Need at least two AI profiles to evaluate")
    }

    console.log(`Evaluating ${profiles.length} profiles across ${tasks.length} matches with parallelism ${options.parallelism}`)
    const matches = await runTasks(tasks, options.parallelism)

    let leaderboard = [] as EvaluationReport["leaderboard"]
    for (const match of matches) {
        leaderboard = applyMatchToLeaderboard(leaderboard, match.white, match.black, {
            winner: match.winner,
            whiteThinkMs: match.whiteThinkMs,
            blackThinkMs: match.blackThinkMs,
            whiteMoves: match.whiteMoves,
            blackMoves: match.blackMoves
        })
    }

    const report: EvaluationReport = {
        version: 1,
        generatedAt: new Date().toISOString(),
        settings: {
            rounds: options.rounds,
            maxPlies: options.maxPlies,
            parallelism: options.parallelism,
            profiles
        },
        leaderboard,
        matches
    }

    fs.writeFileSync(options.outFile, JSON.stringify(report, null, 2))
    console.log(`Saved report to ${options.outFile}`)
  }

main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
})
