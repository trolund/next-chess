import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { chess } from '../game/game'
import Board from '../components/board'
import { DataStore } from '../stores/dataStore'
import { inject, observer } from 'mobx-react'
import { useEffect, useState } from 'react'

interface HomeProps {
  dataStore?: DataStore;
};

function Home(props: HomeProps): JSX.Element {

  const [gameState, setGameState] = useState<chess.gameState>(chess.createGame());
  // const [selectedField, setSelectedField] = useState<chess.field | null>(null);
  // const [validMoves, setValidMoves] = useState<chess.pos[]>();

  const f = () => {
    console.log("hej");

    try {
      // setGameState(chess.move({ row: 7, col: 0 }, { row: 4, col: 4 }, gameState))
      // setGameState(chess.move({ row: 7, col: 2 }, { row: 4, col: 5 }, gameState))
      // setGameState(chess.move({ row: 7, col: 1 }, { row: 3, col: 5 }, gameState))
      // setGameState(chess.move({ row: 7, col: 3 }, { row: 4, col: 6 }, gameState))
    } catch (e) {
      console.log(e);
    }

  }

  useEffect(() => {
    console.log(gameState);
  }, [gameState])

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
        <button onClick={f}>click</button>
        <Board board={gameState.board} turn={gameState.turn} highlight={chess.allValidMoves({ col: 0, row: 0 }, gameState)} />
      </main>

      {/* <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer> */}
    </div>
  )
}

export default Home