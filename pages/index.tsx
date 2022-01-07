import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { useState } from 'react'
import Image from 'next/image'

interface HomeProps {
  dataStore?: DataStore;
};

function Home(props: HomeProps): JSX.Element {

  const [gameState, setGameState] = useState<chess.gameState>(chess.createGame());
  const [selectedField, setSelectedField] = useState<chess.field | null>(null);
  // const [validMoves, setValidMoves] = useState<chess.pos[]>();

  const setState = (s: chess.gameState) => {
    setGameState({
      board: [...s.board],
      piecesTaken: [...s.piecesTaken],
      turn: s.turn
    })
  }

  const doMove = (from: chess.pos, to: chess.pos) => {
    try {
      setState(chess.move(from, to, gameState))
      console.log(chess.notation(from) + " to " + chess.notation(to))
    } catch (e) {
      console.log(e);
    }
  }


  const handleOnPieceClick = (f: chess.field) => {
    if (selectedField) {
      const to = f.pos!;
      const from = selectedField.pos!;
      doMove(from, to)
      setSelectedField(null)
    } else if (f.piece && f.team === gameState.turn) {
      setSelectedField(f)
    }
  }

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
        <div className={styles.grid}>
          <div>
            {gameState.piecesTaken.filter(f => f.team === 'black').map(field => <div><Image height="30%" width="30%" src={`/img/${field.team}-${field.piece}.svg`} /></div>)}
          </div>
          <Board
            selected={selectedField}
            board={gameState.board}
            turn={gameState.turn}
            highlight={chess.allValidMoves(selectedField?.pos!, gameState)}
            pieceOnClick={handleOnPieceClick}
          />
          <div>
            {gameState.piecesTaken.filter(f => f.team === 'white').map(field => <div><Image height="30%" width="30%" src={`/img/${field.team}-${field.piece}.svg`} /></div>)}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home