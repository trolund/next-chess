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
}

const Board: FunctionComponent<BoardProps> = ({ board, highlight, pieceOnClick, turn, selected }) => {

    // console.log("board", highlight?.find(x => x.col === 0 && x.row === 0) !== undefined);


    return (
        <div className={styles.parent}>
            {board.map((theRow, row) =>
                theRow.map((f, col) =>
                    <Piece
                        highlight={highlight?.find(x => x.col === col && x.row === row) !== undefined}
                        selected={selected && selected?.pos && col === selected.pos.col && row === selected.pos.row}
                        turn={turn}
                        onClick={pieceOnClick}
                        key={"#" + row + "#" + col}
                        col={col}
                        row={row}
                        field={f}
                        debug={true}
                    />
                ))}
        </div>
    );
}

export default Board