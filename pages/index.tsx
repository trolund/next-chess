import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { useEffect, useState } from 'react'
import { testUtil } from '../test/utils/testUtil'
import { action, field, gameState, piece, pos, team } from '../game/types/game-types'
import TestLoader from '../components/testLoader'
import { emptyBoard } from '../stores/emptyBoard'
import TransformationModal from '../components/transformationModal'

interface HomeProps {
  dataStore?: DataStore;
};

function Home(props: HomeProps): JSX.Element {

  const testing = true

  const startState = testUtil.createTestGame(emptyBoard)

  const [gameState, setGameState] = useState<gameState>(startState)
  const [selectedField, setSelectedField] = useState<field | null>(null)
  const [selectedTransformation, setTransformation] = useState<piece | null>(null)
  const [modal, setModal] = useState<boolean>(false)
  const [move, setMove] = useState<action | null>()

  const setState = (s: gameState) => {
    setGameState({
      board: [...s.board],
      piecesTaken: [...s.piecesTaken],
      turn: s.turn
    })
  }

  const flipTurn = (): void => {
    setState({...gameState, turn: gameState.turn === "white" ? "black" : "white"})
  }

  const doMove = (from: pos, to: pos, transformOption: piece = null) => {
        try {
          if(transformOption){
            setState(chess.move(from, to, gameState, true, transformOption))
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
        {testing && <TestLoader flipTurn={flipTurn} setGameState={setState} />}
        <div className={styles.grid}>
          {/* <div>
            {gameState.piecesTaken.filter(f => f.team === 'black').map((field, i) => <div key={i}><Image  height="30%" width="30%" src={`/img/${field.team}-${field.piece}.svg`} /></div>)}
          </div> */}
          <p>{modal}</p>
          <TransformationModal isOpen={modal} setIsOpen={setModal} setSelected={setTransformation} />
          <Board
            debug={testing}
            debugUseNotation={testing}
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