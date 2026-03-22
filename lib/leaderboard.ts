import { gameResult, team } from "../game/types/game-types"

export type PlayerConfig = {
    kind: string
    depth: number
}

export type LeaderboardEntry = {
    id: string
    label: string
    isAI: boolean
    rating: number
    games: number
    wins: number
    losses: number
    draws: number
    totalThinkMs: number
    totalMoves: number
}

export type MatchSummary = {
    id: string
    white: PlayerConfig
    black: PlayerConfig
    winner: team
    result: gameResult | "max-plies"
    plies: number
    whiteThinkMs: number
    blackThinkMs: number
    whiteMoves: number
    blackMoves: number
    durationMs: number
}

export type EvaluationReport = {
    version: 1
    generatedAt: string
    settings: {
        rounds: number
        maxPlies: number
        parallelism: number
        profiles: PlayerConfig[]
    }
    leaderboard: LeaderboardEntry[]
    matches: MatchSummary[]
}

export const expectedScore = (ratingA: number, ratingB: number) =>
    1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))

export const profileId = (config: PlayerConfig, side: "White" | "Black") => {
    if (config.kind === "empty") {
        return `${side}-unconfigured`
    }

    if (config.kind === "Human player") {
        return "human-player"
    }

    return `${config.kind.toLowerCase().replace(/\s+/g, "-")}-d${config.depth}`
}

export const profileLabel = (config: PlayerConfig) => {
    if (config.kind === "empty") return "Not configured"
    if (config.kind === "Human player") return "Human player"
    return `${config.kind} D${config.depth}`
}

export const ensureEntry = (
    entries: LeaderboardEntry[],
    config: PlayerConfig,
    side: "White" | "Black"
): LeaderboardEntry => {
    const id = profileId(config, side)
    const existing = entries.find(entry => entry.id === id)
    if (existing) {
        return existing
    }

    const created: LeaderboardEntry = {
        id,
        label: profileLabel(config),
        isAI: config.kind !== "Human player" && config.kind !== "empty",
        rating: 1200,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalThinkMs: 0,
        totalMoves: 0
    }

    entries.push(created)
    return created
}

export const sortLeaderboard = (entries: LeaderboardEntry[]) =>
    [...entries].sort((left, right) =>
        right.rating - left.rating || right.wins - left.wins || left.losses - right.losses
    )

export const applyMatchToLeaderboard = (
    previous: LeaderboardEntry[],
    whiteConfig: PlayerConfig,
    blackConfig: PlayerConfig,
    result: {
        winner: team
        whiteThinkMs: number
        blackThinkMs: number
        whiteMoves: number
        blackMoves: number
    }
): LeaderboardEntry[] => {
    const next = previous.map(entry => ({ ...entry }))
    const whiteEntry = ensureEntry(next, whiteConfig, "White")
    const blackEntry = ensureEntry(next, blackConfig, "Black")

    const whiteIsWinner = result.winner === "white"
    const blackIsWinner = result.winner === "black"
    const isDraw = result.winner === null

    whiteEntry.games += 1
    blackEntry.games += 1

    if (isDraw) {
        whiteEntry.draws += 1
        blackEntry.draws += 1
    } else if (whiteIsWinner) {
        whiteEntry.wins += 1
        blackEntry.losses += 1
    } else if (blackIsWinner) {
        blackEntry.wins += 1
        whiteEntry.losses += 1
    }

    whiteEntry.totalThinkMs += result.whiteThinkMs
    blackEntry.totalThinkMs += result.blackThinkMs
    whiteEntry.totalMoves += result.whiteMoves
    blackEntry.totalMoves += result.blackMoves

    if (whiteEntry.id !== blackEntry.id) {
        const whiteExpected = expectedScore(whiteEntry.rating, blackEntry.rating)
        const blackExpected = expectedScore(blackEntry.rating, whiteEntry.rating)
        const whiteScore = isDraw ? 0.5 : whiteIsWinner ? 1 : 0
        const blackScore = isDraw ? 0.5 : blackIsWinner ? 1 : 0
        const kFactor = 24

        whiteEntry.rating = Math.round(whiteEntry.rating + kFactor * (whiteScore - whiteExpected))
        blackEntry.rating = Math.round(blackEntry.rating + kFactor * (blackScore - blackExpected))
    }

    return sortLeaderboard(next)
}

export const isLeaderboardEntry = (value: unknown): value is LeaderboardEntry => {
    const entry = value as LeaderboardEntry
    return typeof entry?.id === "string"
        && typeof entry?.label === "string"
        && typeof entry?.isAI === "boolean"
        && typeof entry?.rating === "number"
        && typeof entry?.games === "number"
        && typeof entry?.wins === "number"
        && typeof entry?.losses === "number"
        && typeof entry?.draws === "number"
        && typeof entry?.totalThinkMs === "number"
        && typeof entry?.totalMoves === "number"
}

export const parseLeaderboardImport = (payload: unknown): LeaderboardEntry[] | null => {
    if (Array.isArray(payload) && payload.every(isLeaderboardEntry)) {
        return sortLeaderboard(payload)
    }

    const report = payload as EvaluationReport
    if (report && Array.isArray(report.leaderboard) && report.leaderboard.every(isLeaderboardEntry)) {
        return sortLeaderboard(report.leaderboard)
    }

    return null
}
