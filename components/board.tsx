import { FunctionComponent } from "react"
import { chess } from "../game/game"
import { board, field, pos, team } from "../game/types/game-types";
import styles from '../styles/Home.module.css'
import Piece from "./piece";

interface BoardProps {
    board: board;
    highlight?: pos[];
    pieceOnClick?: (field: field) => void;
    turn?: team;
    selected: field | null;
    debug?: boolean;
    debugUseNotation?: boolean;
    disableUserInput?: boolean;
}

const Board: FunctionComponent<BoardProps> = ({ board, highlight, pieceOnClick, turn, selected, debug, debugUseNotation, disableUserInput }) => {

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
                        onClick={disableUserInput ? () => { console.log("User input disabled") } : pieceOnClick}
                        key={"#" + row + "#" + col}
                        col={col}
                        row={row}
                        field={f}
                        debug={debug}
                        debugUseNotation={debugUseNotation}
                        bottomLabel={bottom}
                        leftLabel={left}
                    />)
                }))}
        </div>
    );
}

export default Board