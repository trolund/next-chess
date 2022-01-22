import { FunctionComponent } from "react"
import { chess } from "../game/game"
import styles from '../styles/Home.module.css'
import Piece from "./piece";

interface BoardProps {
    board: chess.board;
    highlight?: chess.pos[];
    pieceOnClick?: (field: chess.field) => void;
    turn?: chess.team;
    selected: chess.field | null;
    debug?: boolean;
}

const Board: FunctionComponent<BoardProps> = ({ board, highlight, pieceOnClick, turn, selected, debug }) => {

    const label = (row: number, col: number): { bottom: string | null, left: string | null } => {
        const { number, char } = chess.notationComponents({ col, row })

        if (col === 0 && row === 7) {
            return { bottom: char, left: String(number) } // both
        } else if (col === 0) {
            return { bottom: null, left: String(number) } // left
        } else if (row === 7) {
            return { bottom: char, left: null } // bottom
        } else {
            return { bottom: null, left: null } // none
        }
    }

    return (
        <div className={styles.parent}>
            {board.map((theRow, row) =>
                theRow.map((f, col) => {

                    const { bottom, left } = label(row, col)

                    return (<Piece
                        highlight={highlight?.find(x => x.col === col && x.row === row) !== undefined}
                        selected={selected && selected?.pos && col === selected.pos.col && row === selected.pos.row}
                        turn={turn}
                        onClick={pieceOnClick}
                        key={"#" + row + "#" + col}
                        col={col}
                        row={row}
                        field={f}
                        debug={debug}
                        bottomLabel={bottom}
                        leftLabel={left}
                    />)
                }))}
        </div>
    );
}

export default Board