import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { useEffect, useState } from 'react'
import { action, field, gameState, piece, pos, team } from '../game/types/game-types'
import TestLoader from '../components/testLoader'
import TransformationModal from '../components/transformationModal'
import { useRouter } from 'next/router'
import { Agent, MinmaxAgent } from '../AI/Agent'


interface HomeProps {
  dataStore?: DataStore;
};

const playerTypes = ["Minimax", "Human player"]

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
  const [gameStarted, setGameStarted] = useState<boolean>(false)

  const [disableUserInput, setDisableUserInput] = useState<boolean>(false)

  const getAgent = () => chess.isWhite(gameState) ? players[0] : players[1]

  useEffect(() => {
    // doing the moves
    if(gameStarted){
      const agent = getAgent()
  
      // if agent is not null and therefore is a AI input must be looked for the user
      if(!agent){ // null user most do move
        setDisableUserInput(false)
      }else {
        console.log("🤖 AI MOVE");
        setDisableUserInput(true)
        AIMove(agent)
      }
    }

  }, [gameState, gameStarted])

  const AIMove = (agent: Agent) => {
    const move = agent.FindMove(gameState)
    doMove(chess.toPosSafe(move.from), chess.toPosSafe(move.to), "queen") // TODO: just always choses queen for now 
  }

  const chosePlayer = (event: React.ChangeEvent<HTMLSelectElement>, playerNum: number) => {
    if(playerNum > 1 || playerNum < 0){
      throw "only 2 players are allowed"
    }
    const p = players
    p[playerNum] = mapAgent(event.target.value)
    setPlayers(p)
  }

  const mapAgent = (agentType: string) => {
      if(agentType === "Human player") return null
      else return new MinmaxAgent(5)
  }

  const setState = (s: gameState) => {
    setGameState({
      board: [...s.board],
      piecesTaken: [...s.piecesTaken],
      turn: s.turn
    })
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

  const logFieldClick = (f: field) => console.log(`Notation: ${chess.notation(f.pos!)}, (row:${f.pos?.row},col:${f.pos?.col}), ${f.piece + ", " ?? ""} ${f.team ?? ""}`);

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
        <div style={{position: "fixed", left: "1rem", top: "1rem"}}>Turn : {gameState.turn}</div>
        {inDebugMode && <TestLoader flipTurn={flipTurn} setGameState={setState} />}
        <div className={styles.grid}>
          {/* <div>
            {gameState.piecesTaken.filter(f => f.team === 'black').map((field, i) => <div key={i}><Image  height="30%" width="30%" src={`/img/${field.team}-${field.piece}.svg`} /></div>)}
          </div> */}
          {(!inDebugMode && players.length === 0)  && <div>
            <h2>Mode</h2>
            <h3>Player 1</h3>
            <select name="cases" id="cases" onChange={(e) => chosePlayer(e, 0)}>
                <option key={"empty"} value={"empty"}> - Select piece type - </option>
                {playerTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <h3>Player 2</h3>
            <select name="cases" id="cases" onChange={(e) => chosePlayer(e, 1)}>
                <option key={"empty"} value={"empty"}> - Select piece type - </option>
                {playerTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => { 
              setGameStarted(true) 
              }}>Start game</button>
          </div>}
          <TransformationModal isOpen={modal} setIsOpen={setModal} setSelected={setTransformation} />
          <Board
            debug={inDebugMode}
            debugUseNotation={inDebugMode}
            disableUserInput={disableUserInput}
            selected={selectedField}
            board={gameState.board}
            turn={gameState.turn}
            highlight={chess.validMovesFrom(selectedField?.pos!, gameState)}
            pieceOnClick={handleOnPieceClick}
          />
          {/* <div>
            {gameState.piecesTaken.filter((f) => f.team === 'white').map((field, i) => <div key={i}><Image height="30%" width="30%" src={`/img/${field.team}-${field.piece}.svg`} /></div>)}
          </div> */}
        </div>
      </main>
    </div>
  )
}

export default Home