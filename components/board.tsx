import { inject } from "mobx-react";
import { observer } from "mobx-react-lite";
import { FunctionComponent } from "react"
import { chess } from "../game/game"
import styles from '../styles/Home.module.css'
import Piece from "./piece";

interface BoardProps {
    board: chess.board;
    highlight?: chess.pos[];
    pieceOnClick?: (field: chess.field) => void;
    turn?: chess.team;
}

const Board: FunctionComponent<BoardProps> = ({ board, highlight, pieceOnClick, turn }) => {

    console.log("board", highlight?.find(x => x.col === 0 && x.row === 0) !== undefined);


    return (
        <div className={styles.parent}>
            {board.map((theRow, row) =>
                theRow.map((f, col) => <Piece
                    highlight={highlight?.find(x => x.col === col && x.row === row) !== undefined}
                    turn={turn}
                    onClick={pieceOnClick}
                    key={"#" + row + "#" + col}
                    col={col}
                    row={row}
                    field={f} />
                ))}
        </div>
    );
}

export default Board