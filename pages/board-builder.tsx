import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { useState } from 'react'
import { field, gameState } from '../game/types/game-types'
import { useRouter } from 'next/router'


interface BuilderProps {
  dataStore?: DataStore;
};

function BoardBuilder(props: BuilderProps): JSX.Element {

  const router = useRouter()

  const startState = chess.createGame()
  const [gameState, setGameState] = useState<gameState>(startState)
  const [modal, setModal] = useState<boolean>(false)


  const handleOnPieceClick = (f: field) => {
        setModal(true)
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
          <Board
            selected={null}
            board={gameState.board}
            turn={gameState.turn}
            pieceOnClick={handleOnPieceClick}
          />
        </div>
      </main>
    </div>
  )
}

export default BoardBuilder