import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { action, field, gameState, piece, pos, team } from '../game/types/game-types'
import TestLoader from '../components/testLoader'
import TransformationModal from '../components/transformationModal'
import { useRouter } from 'next/router'
import { Agent } from '../AI/agent'
import { MinmaxAgent } from '../AI/MinmaxAgent'
import { AlphaBetaAgent } from '../AI/AlphaBetaAgent'
import { OrderedAlphaBetaAgent } from '../AI/OrderedAlphaBetaAgent'
import { MCTSAgent } from '../AI/MCTSAgent'
import { HeuristicAlphaBetaAgent } from '../AI/HeuristicAlphaBetaAgent'
import Image from 'next/image'


interface HomeProps {
  dataStore?: DataStore;
};

const playerTypes = ["Minimax", "Alpha-Beta", "Ordered Alpha-Beta", "Heuristic Alpha-Beta", "MCTS", "Human player"]
const depthOptions = [1, 2, 3, 4]
const playerSettingsStorageKey = "next-chess-player-settings"
const leaderboardStorageKey = "next-chess-leaderboard"

type LogEntry = {
  id: number
  team: "white" | "black"
  kind: 'search' | 'move'
  agent: string
  depth?: number
  from?: string
  to?: string
  durationMs?: number
  captureLabel?: string
  text: string
}

type PlayerConfig = {
  kind: string
  depth: number
}

type LeaderboardEntry = {
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

function Home(props: HomeProps): JSX.Element {

  const router = useRouter()
  const { debug } = router.query

  const inDebugMode = (String(debug).toLowerCase() === 'true' || debug === '1') ? true : false 

  if(inDebugMode){
    console.debug("🧰 In debug mode!")
  }

 // const startState = testUtil.createTestGame(emptyBoard)
  const startState = chess.createGame()

  const [gameState, setGameState] = useState<gameState>(startState)
  const [selectedField, setSelectedField] = useState<field | null>(null)
  const [selectedTransformation, setTransformation] = useState<piece | null>(null)
  const [modal, setModal] = useState<boolean>(false)
  const [move, setMove] = useState<action | null>()
  const [players, setPlayers] = useState<(Agent | null)[]>([])
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { kind: "empty", depth: 2 },
    { kind: "empty", depth: 2 }
  ])
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [moveAnimationId, setMoveAnimationId] = useState<number>(0)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false)
  const [aiLog, setAiLog] = useState<LogEntry[]>([])
  const [whiteThinkMs, setWhiteThinkMs] = useState<number>(0)
  const [blackThinkMs, setBlackThinkMs] = useState<number>(0)
  const [totalElapsedMs, setTotalElapsedMs] = useState<number>(0)
  const [whiteActiveMs, setWhiteActiveMs] = useState<number>(0)
  const [blackActiveMs, setBlackActiveMs] = useState<number>(0)
  const [whiteAIMoveCount, setWhiteAIMoveCount] = useState<number>(0)
  const [blackAIMoveCount, setBlackAIMoveCount] = useState<number>(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const [disableUserInput, setDisableUserInput] = useState<boolean>(false)
  const stopWatchStart = useRef<number | null>(null)
  const stopWatchEnd = useRef<number | null>(null)
  const whiteTurnStart = useRef<number | null>(null)
  const blackTurnStart = useRef<number | null>(null)
  const logIdRef = useRef<number>(0)
  const recordedMatchKey = useRef<string | null>(null)

  const getAgent = () => chess.isWhite(gameState) ? players[0] : players[1]

  const appendLog = (entry: Omit<LogEntry, 'id'>) => {
    logIdRef.current += 1
    setAiLog(prev => [{ id: logIdRef.current, ...entry }, ...prev].slice(0, 12))
  }

  const profileId = (config: PlayerConfig, teamLabel: "White" | "Black") => {
    if (config.kind === "empty") {
      return `${teamLabel}-unconfigured`
    }

    if (config.kind === "Human player") {
      return "human-player"
    }

    return `${config.kind.toLowerCase().replace(/\s+/g, "-")}-d${config.depth}`
  }

  const profileLabel = (config: PlayerConfig) => {
    if (config.kind === "empty") return "Not configured"
    if (config.kind === "Human player") return "Human player"
    return `${config.kind} D${config.depth}`
  }

  const ensureEntry = (entries: LeaderboardEntry[], config: PlayerConfig, side: "White" | "Black"): LeaderboardEntry => {
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

  const expectedScore = (ratingA: number, ratingB: number) => 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))

  const applyMatchToLeaderboard = () => {
    setLeaderboard(prev => {
      const next = prev.map(entry => ({ ...entry }))
      const whiteEntry = ensureEntry(next, playerConfigs[0], "White")
      const blackEntry = ensureEntry(next, playerConfigs[1], "Black")

      const whiteIsWinner = gameState.winner === "white"
      const blackIsWinner = gameState.winner === "black"
      const isDraw = gameState.winner === null

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

      whiteEntry.totalThinkMs += whiteThinkMs
      blackEntry.totalThinkMs += blackThinkMs
      whiteEntry.totalMoves += whiteAIMoveCount
      blackEntry.totalMoves += blackAIMoveCount

      if (whiteEntry.id !== blackEntry.id) {
        const whiteExpected = expectedScore(whiteEntry.rating, blackEntry.rating)
        const blackExpected = expectedScore(blackEntry.rating, whiteEntry.rating)
        const whiteScore = isDraw ? 0.5 : whiteIsWinner ? 1 : 0
        const blackScore = isDraw ? 0.5 : blackIsWinner ? 1 : 0
        const kFactor = 24

        whiteEntry.rating = Math.round(whiteEntry.rating + kFactor * (whiteScore - whiteExpected))
        blackEntry.rating = Math.round(blackEntry.rating + kFactor * (blackScore - blackExpected))
      }

      return next.sort((left, right) => right.rating - left.rating || right.wins - left.wins || left.losses - right.losses)
    })
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const rawSettings = window.localStorage.getItem(playerSettingsStorageKey)
      if (!rawSettings) {
        return
      }

      const parsed = JSON.parse(rawSettings) as PlayerConfig[]
      if (!Array.isArray(parsed) || parsed.length !== 2) {
        return
      }

      const validSettings = parsed.map(config => ({
        kind: typeof config?.kind === "string" ? config.kind : "empty",
        depth: depthOptions.includes(Number(config?.depth)) ? Number(config.depth) : 2
      }))

      setPlayerConfigs(validSettings)
      setPlayers([
        mapAgent(validSettings[0], "white"),
        mapAgent(validSettings[1], "black")
      ])

      const storedLeaderboard = window.localStorage.getItem(leaderboardStorageKey)
      if (storedLeaderboard) {
        const parsedBoard = JSON.parse(storedLeaderboard) as LeaderboardEntry[]
        if (Array.isArray(parsedBoard)) {
          setLeaderboard(parsedBoard)
        }
      }
    } catch (_error) {
      window.localStorage.removeItem(playerSettingsStorageKey)
      window.localStorage.removeItem(leaderboardStorageKey)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(playerSettingsStorageKey, JSON.stringify(playerConfigs))
  }, [playerConfigs])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(leaderboardStorageKey, JSON.stringify(leaderboard))
  }, [leaderboard])

  useEffect(() => {
    console.log("🎮 Game started: " + gameStarted);
    // doing the moves
    if(gameStarted && !gameState.ended){
      const agent = getAgent()
  
      // if agent is not null and therefore is a AI input must be looked for the user
      if(!agent){ // null user most do move
        setDisableUserInput(false)
      }else {
        console.log("🤖 AI MOVE");
        setDisableUserInput(true)
        const timer = setTimeout(() => {
          void AIMove(agent)
        }, 80)

        return () => clearTimeout(timer)
      }
    }

  }, [gameState, gameStarted])

  const AIMove = async (agent: Agent) => {
    const actingTeam = gameState.turn as "white" | "black"
    const actingIndex = actingTeam === "white" ? 0 : 1
    appendLog({
      team: actingTeam,
      kind: 'search',
      agent: playerConfigs[actingIndex].kind,
      depth: playerConfigs[actingIndex].depth,
      text: `${actingTeam} ${playerConfigs[actingIndex].kind} started search at depth ${playerConfigs[actingIndex].depth}`
    })
    const startedAt = Date.now()
    const move = await agent.FindMoveAsync(gameState)
    const duration = Date.now() - startedAt
    const fromPos = chess.toPosSafe(move.from)
    const toPos = chess.toPosSafe(move.to)
    const movingField = chess.getFieldAtPos(fromPos, gameState)
    const targetField = chess.getFieldAtPos(toPos, gameState)
    const captureField = targetField.piece
      ? targetField
      : movingField.piece === "pawn" && gameState.enPassantTarget && chess.comparePos(gameState.enPassantTarget, toPos)
        ? chess.getFieldAtPos({ row: fromPos.row, col: toPos.col }, gameState)
        : null
    const from = String(chess.notation(chess.toPosSafe(move.from)))
    const to = String(chess.notation(chess.toPosSafe(move.to)))
    appendLog({
      team: actingTeam,
      kind: 'move',
      agent: playerConfigs[actingIndex].kind,
      from,
      to,
      durationMs: duration,
      captureLabel: captureField?.piece ? `${captureField.team} ${captureField.piece}` : undefined,
      text: `${actingTeam} AI played ${from} to ${to} in ${duration} ms`
    })

    if (actingTeam === "white") {
      setWhiteThinkMs(prev => prev + duration)
      setWhiteAIMoveCount(prev => prev + 1)
    } else {
      setBlackThinkMs(prev => prev + duration)
      setBlackAIMoveCount(prev => prev + 1)
    }

    doMove(chess.toPosSafe(move.from), chess.toPosSafe(move.to), "queen") // TODO: just always choses queen for now 
  }

  const rebuildPlayers = (configs: PlayerConfig[]) => {
    setPlayers([
      mapAgent(configs[0], "white"),
      mapAgent(configs[1], "black")
    ])
  }

  const chosePlayer = (event: React.ChangeEvent<HTMLSelectElement>, playerNum: number) => {
    if(playerNum > 1 || playerNum < 0){
      throw "only 2 players are allowed"
    }
    const nextConfigs = [...playerConfigs]
    nextConfigs[playerNum] = { ...nextConfigs[playerNum], kind: event.target.value }
    setPlayerConfigs(nextConfigs)
    rebuildPlayers(nextConfigs)
  }

  const changePlayerDepth = (event: React.ChangeEvent<HTMLSelectElement>, playerNum: number) => {
    const nextConfigs = [...playerConfigs]
    nextConfigs[playerNum] = { ...nextConfigs[playerNum], depth: Number(event.target.value) }
    setPlayerConfigs(nextConfigs)
    rebuildPlayers(nextConfigs)
  }

  const mapAgent = (config: PlayerConfig, team: team) => {
      if(config.kind === "empty") return null
      if(config.kind === "Human player") return null
      if(config.kind === "Alpha-Beta") return new AlphaBetaAgent(config.depth, team)
      if(config.kind === "Ordered Alpha-Beta") return new OrderedAlphaBetaAgent(config.depth, team)
      if(config.kind === "Heuristic Alpha-Beta") return new HeuristicAlphaBetaAgent(config.depth, team)
      if(config.kind === "MCTS") return new MCTSAgent(config.depth, team)
      return new MinmaxAgent(config.depth, team)
  }

  const resetGame = () => {
    setSelectedField(null)
    setTransformation(null)
    setModal(false)
    setMove(null)
    setDisableUserInput(false)
    setGameStarted(false)
    setMoveAnimationId(0)
    setAiLog([])
    setWhiteThinkMs(0)
    setBlackThinkMs(0)
    setTotalElapsedMs(0)
    setWhiteActiveMs(0)
    setBlackActiveMs(0)
    setWhiteAIMoveCount(0)
    setBlackAIMoveCount(0)
    stopWatchStart.current = null
    stopWatchEnd.current = null
    whiteTurnStart.current = null
    blackTurnStart.current = null
    recordedMatchKey.current = null
    const resetConfigs = [
      { kind: "empty", depth: 2 },
      { kind: "empty", depth: 2 }
    ]
    setPlayerConfigs(resetConfigs)
    setPlayers([null, null])
    setGameState(chess.createGame())
  }

  const setState = (s: gameState) => {
    setGameState({
      board: [...s.board],
      piecesTaken: [...s.piecesTaken],
      turn: s.turn,
      ended: s.ended,
      castlingRights: s.castlingRights,
      enPassantTarget: s.enPassantTarget,
      lastMove: s.lastMove,
      winner: s.winner,
      halfMoveClock: s.halfMoveClock,
      positionHistory: s.positionHistory,
      result: s.result
    })

    if (s.lastMove) {
      setMoveAnimationId(prev => prev + 1)
    }
  }

  const flipTurn = (): void => {
    if(debug) setState({...gameState, turn: gameState.turn === "white" ? "black" : "white"})
  }

  const doMove = (from: pos, to: pos, transformOption: piece = null) => {
        try {
          if(!gameStarted) setGameStarted(true)

          if(transformOption){
            setState(chess.move(from, to, gameState, { transformation: transformOption }))
          }else {
            setState(chess.move(from, to, gameState))
          }
          console.log(chess.notation(from) + " to " + chess.notation(to))
        } catch (e) {
          console.log((e as Error).message)
        }
  }

  useEffect(() => {
    if(selectedTransformation && move){
      doMove(move.from as pos, move.to as pos, selectedTransformation)
      setSelectedField(null)
      setMove(null)
      setTransformation(null)
    }else if(move && !modal){
      doMove(move.from as pos, move.to as pos)
      setSelectedField(null)
      setMove(null)
    }
  }, [move, selectedTransformation])

  const canTransform = (fromField: field, to: pos) => (fromField.team === "black" && to.row === 7) || (fromField.team === "white" && to.row === 0)

  const handleOnPieceClick = (f: field) => {
    logFieldClick(f)
    if (selectedField) {
      const to = f.pos!
      const from = selectedField.pos!
    
      // special case: if transform should be done
      if(selectedField.piece === "pawn" && canTransform(selectedField, to)){
        setModal(true)
        setMove({to, from})
      }else { 
        setMove({to, from})
      }
    } else if (f.piece && f.team === gameState.turn) {
      setSelectedField(f)
    }
  }

  const logFieldClick = (f: field) => console.log(`Notation: ${chess.notation(f.pos!)}, (row:${f.pos?.row},col:${f.pos?.col}), ${f.piece + ", "} ${f.team ?? ""}`);

  useEffect(() => {
    if (!gameStarted) {
      return
    }

    if (stopWatchStart.current === null) {
      stopWatchStart.current = Date.now()
    }

    const updateTimers = () => {
      if (stopWatchStart.current !== null) {
        const endPoint = stopWatchEnd.current ?? Date.now()
        setTotalElapsedMs(endPoint - stopWatchStart.current)
      }

      if (whiteTurnStart.current !== null && players[0]) {
        setWhiteActiveMs(Date.now() - whiteTurnStart.current)
      } else {
        setWhiteActiveMs(0)
      }

      if (blackTurnStart.current !== null && players[1]) {
        setBlackActiveMs(Date.now() - blackTurnStart.current)
      } else {
        setBlackActiveMs(0)
      }
    }

    updateTimers()
    const interval = setInterval(updateTimers, 250)
    return () => clearInterval(interval)
  }, [gameStarted, players])

  useEffect(() => {
    if (gameStarted && gameState.ended && stopWatchStart.current !== null && stopWatchEnd.current === null) {
      stopWatchEnd.current = Date.now()
      setTotalElapsedMs(stopWatchEnd.current - stopWatchStart.current)
    }

    if (gameStarted && !gameState.ended && stopWatchEnd.current !== null) {
      stopWatchEnd.current = null
    }
  }, [gameStarted, gameState.ended])

  useEffect(() => {
    if (!gameStarted || !gameState.ended) {
      return
    }

    const matchKey = `${gameState.result}-${gameState.winner}-${gameState.lastMove ? JSON.stringify(gameState.lastMove) : "no-move"}`
    if (recordedMatchKey.current === matchKey) {
      return
    }

    recordedMatchKey.current = matchKey
    applyMatchToLeaderboard()
  }, [gameStarted, gameState.ended, gameState.result, gameState.winner, gameState.lastMove, whiteThinkMs, blackThinkMs, whiteAIMoveCount, blackAIMoveCount])

  useEffect(() => {
    if (!gameStarted || gameState.ended) {
      whiteTurnStart.current = null
      blackTurnStart.current = null
      return
    }

    if (gameState.turn === "white") {
      whiteTurnStart.current = Date.now()
      blackTurnStart.current = null
    } else {
      blackTurnStart.current = Date.now()
      whiteTurnStart.current = null
    }
  }, [gameStarted, gameState.turn, gameState.ended])

  const capturedWhite = useMemo(() => gameState.piecesTaken.filter(f => f.team === 'white'), [gameState.piecesTaken])
  const capturedBlack = useMemo(() => gameState.piecesTaken.filter(f => f.team === 'black'), [gameState.piecesTaken])
  const inCheck = useMemo(() => {
    try {
      return chess.check(gameState)
    } catch (_error) {
      return false
    }
  }, [gameState])
  const isStalemate = useMemo(() => {
    try {
      return chess.stalemate(gameState)
    } catch (_error) {
      return false
    }
  }, [gameState])

  const statusText = useMemo(() => {
    if (gameState.winner) return `Winner: ${gameState.winner}`
    if (gameState.ended && isStalemate) return 'Draw by stalemate'
    if (gameState.ended && gameState.result === 'threefold-repetition') return 'Draw by repetition'
    if (gameState.ended && gameState.result === 'fifty-move-rule') return 'Draw by fifty-move rule'
    if (gameState.ended && gameState.result === 'insufficient-material') return 'Draw by insufficient material'
    if (inCheck) return `${gameState.turn} is in check`
    if (!gameStarted) return 'Configure players and start the match'
    return `${gameState.turn} to move`
  }, [gameStarted, gameState, inCheck, isStalemate])

  const playerLabel = (index: number) => {
    if (playerConfigs[index].kind === "empty") return 'Not configured'
    if (!players[index]) return 'Human player'
    return `${playerConfigs[index].kind} agent`
  }

  const waitingOnLabel = useMemo(() => {
    if (!gameStarted) return 'Waiting to start'
    if (gameState.ended) return gameState.winner ? `Winner: ${gameState.winner}` : 'Game finished'

    const activePlayerIndex = gameState.turn === "white" ? 0 : 1
    const actor = players[activePlayerIndex] ? `${gameState.turn} AI` : `${gameState.turn} player`
    return `Waiting on ${actor}`
  }, [gameStarted, gameState, players])

  const gameOverText = useMemo(() => {
    if (!gameState.ended) return null
    if (gameState.winner) return `${gameState.winner} wins by checkmate`
    if (isStalemate) return 'Draw by stalemate'
    if (gameState.result === 'threefold-repetition') return 'Draw by threefold repetition'
    if (gameState.result === 'fifty-move-rule') return 'Draw by fifty-move rule'
    if (gameState.result === 'insufficient-material') return 'Draw by insufficient material'
    return 'Game over'
  }, [gameState, isStalemate])

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
  }

  const captureStrip = (pieces: field[]) => (
    <div className={styles.captureStrip}>
      {pieces.length === 0 && <span className={styles.captureEmpty}>No captures</span>}
      {pieces.map((taken, i) => (
        <div key={`${taken.team}-${taken.piece}-${i}`} className={styles.captureItem}>
          <Image height={24} width={24} src={`/img/${taken.team}-${taken.piece}.svg`} alt={`${taken.team} ${taken.piece}`} />
        </div>
      ))}
    </div>
  )

  const rankedLeaderboard = useMemo(() => leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 })), [leaderboard])
  const aiLeaderboard = useMemo(() => rankedLeaderboard.filter(entry => entry.isAI), [rankedLeaderboard])

  const formatAverageMoveMs = (entry: LeaderboardEntry) => entry.totalMoves > 0 ? `${Math.round(entry.totalThinkMs / entry.totalMoves)} ms/move` : "No AI moves"
  const formatWinRate = (entry: LeaderboardEntry) => entry.games > 0 ? `${Math.round((entry.wins / entry.games) * 100)}% win rate` : "No games"

  return (
    <div className={styles.container}>
      <Head>
        <title>Chess game</title>
        <meta name="description" content="Chess game" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png"></link>
        <meta name="theme-color" content="#fff" />
      </Head>

      <main className={styles.main}>
        {inDebugMode && <TestLoader flipTurn={flipTurn} setGameState={setState} />}
        <div className={styles.matchLayout}>
          <aside className={styles.sidePanel}>
            <section className={styles.panelCard}>
              <p className={styles.panelLabel}>White</p>
              <h3>Player One</h3>
              <select className={styles.select} name="white-player" id="white-player" onChange={(e) => chosePlayer(e, 0)} value={playerConfigs[0].kind}>
                <option key={"empty"} value={"empty"}> - Select piece type - </option>
                {playerTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={styles.select} name="white-depth" id="white-depth" onChange={(e) => changePlayerDepth(e, 0)} value={playerConfigs[0].depth}>
                {depthOptions.map(depth => <option key={`white-depth-${depth}`} value={depth}>Depth {depth}</option>)}
              </select>
              <p className={styles.panelMeta}>{playerLabel(0)}</p>
              <p className={styles.timerText}>AI think time: {formatDuration(whiteThinkMs + whiteActiveMs)}</p>
              <div className={styles.captureBlock}>
                <span>Captured white pieces</span>
                {captureStrip(capturedWhite)}
              </div>
            </section>

            <section className={styles.panelCard}>
              <p className={styles.panelLabel}>Match</p>
              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <span>Turn</span>
                  <strong>{gameState.turn}</strong>
                </div>
                <div className={styles.statCard}>
                  <span>State</span>
                  <strong>{gameState.ended ? 'Ended' : 'Live'}</strong>
                </div>
                <div className={styles.statCard}>
                  <span>Input</span>
                  <strong>{disableUserInput ? 'Locked' : 'Ready'}</strong>
                </div>
                <div className={styles.statCard}>
                  <span>Mode</span>
                  <strong>{players.filter(Boolean).length === 2 ? 'AI vs AI' : 'Mixed'}</strong>
                </div>
                <div className={styles.statCard}>
                  <span>Stopwatch</span>
                  <strong>{formatDuration(totalElapsedMs)}</strong>
                </div>
                <div className={styles.statCard}>
                  <span>Winner</span>
                  <strong>{gameState.winner ? gameState.winner : (gameState.ended ? 'Draw' : 'Pending')}</strong>
                </div>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.primaryButton} onClick={() => setGameStarted(true)}>Start match</button>
                <button className={styles.secondaryButton} onClick={resetGame}>Reset</button>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} onClick={() => setShowLeaderboardModal(true)}>Open rankings</button>
              </div>
            </section>
          </aside>

          <section className={styles.boardStage}>
            <TransformationModal isOpen={modal} setIsOpen={setModal} setSelected={setTransformation} />
            <div className={styles.boardShell}>
              {gameOverText && (
                <div className={styles.gameOverBanner}>
                  <span className={styles.gameOverLabel}>Match Result</span>
                  <strong>{gameOverText}</strong>
                </div>
              )}
              <div className={styles.boardHeader}>
                <div>
                  <p className={styles.panelLabel}>Current position</p>
                  <h2>Live board</h2>
                </div>
                <div className={styles.boardStatus}>
                  <div className={styles.waitingIndicator}>
                    <span className={styles.waitingDot + " " + (gameState.turn === "white" ? styles.waitingWhite : styles.waitingBlack)} />
                    <span className={styles.waitingText}>{waitingOnLabel}</span>
                  </div>
                  <div className={styles.turnBadge}>{gameState.turn}</div>
                </div>
              </div>
              <div className={styles.boardFrame}>
                <Board
                  debug={inDebugMode}
                  debugUseNotation={inDebugMode}
                  disableUserInput={disableUserInput}
                  selected={selectedField}
                  board={gameState.board}
                  turn={gameState.turn}
                  highlight={chess.validMovesFrom(selectedField?.pos!, gameState)}
                  pieceOnClick={handleOnPieceClick}
                  lastMove={gameState.lastMove}
                  animationId={moveAnimationId}
                />
                {gameOverText && (
                  <div className={styles.gameOverOverlay}>
                    <div className={styles.gameOverOverlayCard}>
                      <span className={styles.gameOverLabel}>Game Over</span>
                      <strong>{gameOverText}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className={styles.sidePanel}>
            <section className={styles.panelCard}>
              <p className={styles.panelLabel}>Black</p>
              <h3>Player Two</h3>
              <select className={styles.select} name="black-player" id="black-player" onChange={(e) => chosePlayer(e, 1)} value={playerConfigs[1].kind}>
                <option key={"empty"} value={"empty"}> - Select piece type - </option>
                {playerTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={styles.select} name="black-depth" id="black-depth" onChange={(e) => changePlayerDepth(e, 1)} value={playerConfigs[1].depth}>
                {depthOptions.map(depth => <option key={`black-depth-${depth}`} value={depth}>Depth {depth}</option>)}
              </select>
              <p className={styles.panelMeta}>{playerLabel(1)}</p>
              <p className={styles.timerText}>AI think time: {formatDuration(blackThinkMs + blackActiveMs)}</p>
              <div className={styles.captureBlock}>
                <span>Captured black pieces</span>
                {captureStrip(capturedBlack)}
              </div>
            </section>

            <section className={styles.panelCard}>
              <p className={styles.panelLabel}>AI log</p>
              <h3>Activity</h3>
              <div className={styles.logList}>
                {aiLog.length === 0 && <p className={styles.panelMeta}>No AI actions yet.</p>}
                {aiLog.map(entry => (
                  <div key={entry.id} className={styles.logEntry}>
                    <div className={styles.logEntryHeader}>
                      <span className={styles.logTeam + " " + (entry.team === 'white' ? styles.logWhite : styles.logBlack)}>{entry.team}</span>
                      <span className={styles.logAgent}>{entry.agent}</span>
                    </div>
                    {entry.kind === 'move' && entry.from && entry.to ? (
                      <>
                        <div className={styles.logMoveRow}>
                          <span className={styles.logSquare}>{entry.from}</span>
                          <span className={styles.logArrow} aria-hidden="true">→</span>
                          <span className={styles.logSquare}>{entry.to}</span>
                          <span className={styles.logTime}>{entry.durationMs} ms</span>
                        </div>
                        {entry.captureLabel && <p className={styles.logCapture}>Captured {entry.captureLabel}</p>}
                      </>
                    ) : (
                      <p className={styles.logText}>Searching at depth {entry.depth}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </aside>
        </div>
        {showLeaderboardModal && (
          <div className={styles.rankingsOverlay} onClick={() => setShowLeaderboardModal(false)}>
            <div className={styles.rankingsModal} onClick={(event) => event.stopPropagation()}>
              <div className={styles.rankingsHeader}>
                <div>
                  <p className={styles.panelLabel}>Leaderboard</p>
                  <h3>Ranked profiles</h3>
                </div>
                <button className={styles.secondaryButton + " " + styles.rankingsCloseButton} onClick={() => setShowLeaderboardModal(false)}>Close</button>
              </div>

              <div className={styles.rankingsGrid}>
                <section className={styles.panelCard}>
                  <p className={styles.panelLabel}>Overall</p>
                  <h3>All players</h3>
                  <div className={styles.leaderboardList}>
                    {rankedLeaderboard.length === 0 && <p className={styles.panelMeta}>No completed matches yet.</p>}
                    {rankedLeaderboard.map(entry => (
                      <div key={entry.id} className={styles.leaderboardEntry}>
                        <div>
                          <p className={styles.leaderboardTitle}>#{entry.rank} {entry.label}</p>
                          <p className={styles.leaderboardMeta}>{entry.games} games · {entry.wins}W {entry.draws}D {entry.losses}L</p>
                        </div>
                        <strong className={styles.leaderboardScore}>{entry.rating}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.panelCard}>
                  <p className={styles.panelLabel}>AI ranking</p>
                  <h3>Strength snapshot</h3>
                  <div className={styles.leaderboardList}>
                    {aiLeaderboard.length === 0 && <p className={styles.panelMeta}>No AI match data yet.</p>}
                    {aiLeaderboard.map(entry => (
                      <div key={`ai-${entry.id}`} className={styles.aiStatCard}>
                        <div className={styles.leaderboardEntry}>
                          <div>
                            <p className={styles.leaderboardTitle}>#{entry.rank} {entry.label}</p>
                            <p className={styles.leaderboardMeta}>{formatWinRate(entry)}</p>
                          </div>
                          <strong className={styles.leaderboardScore}>{entry.rating}</strong>
                        </div>
                        <div className={styles.aiStatGrid}>
                          <div className={styles.aiMiniStat}>
                            <span>Games</span>
                            <strong>{entry.games}</strong>
                          </div>
                          <div className={styles.aiMiniStat}>
                            <span>Avg speed</span>
                            <strong>{formatAverageMoveMs(entry)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
