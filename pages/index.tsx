import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { useState } from 'react'
import Image from 'next/image'
import { testUtil } from '../test/utils/testUtil'
import { field, gameState, pos, simpleBoard } from '../game/types/game-types'
import TestLoader from '../components/testLoader'
import { emptyBoard } from '../stores/emptyBoard'

interface HomeProps {
  dataStore?: DataStore;
};

function Home(props: HomeProps): JSX.Element {

  const testing = true

  //const startState = createGame()
  const startState = testUtil.createTestGame(emptyBoard)

  const [gameState, setGameState] = useState<gameState>(startState);
  const [selectedField, setSelectedField] = useState<field | null>(null);
  // const [validMoves, setValidMoves] = useState<pos[]>();

  const setState = (s: gameState) => {
    setGameState({
      board: [...s.board],
      piecesTaken: [...s.piecesTaken],
      turn: s.turn
    })
  }

  const doMove = (from: pos, to: pos) => {
    try {
      setState(chess.move(from, to, gameState))
      console.log(chess.notation(from) + " to " + chess.notation(to))
    } catch (e) {
      console.log((e as Error).message);
    }
  }


  const handleOnPieceClick = (f: field) => {
    logFieldClick(f)

    if (selectedField) {
      const to = f.pos!;
      const from = selectedField.pos!;
      doMove(from, to)
      setSelectedField(null)
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
        {testing && <TestLoader setGameState={setState} />}
        <div className={styles.grid}>
          {/* <div>
            {gameState.piecesTaken.filter(f => f.team === 'black').map((field, i) => <div key={i}><Image  height="30%" width="30%" src={`/img/${field.team}-${field.piece}.svg`} /></div>)}
          </div> */}
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