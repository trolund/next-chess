import { inject, observer } from "mobx-react";
import Image from "next/image";
import { FunctionComponent } from "react"
import { chess } from "../game/game";
import { DataStore } from "../stores/dataStore";
import styles from '../styles/Home.module.css'

interface PieceProps {
    field: chess.field;
    row: number;
    col: number;
    className?: string;
    onClick?: (field: chess.field) => void;
    highlight?: boolean;
    turn?: chess.team;
}

const Piece: FunctionComponent<PieceProps> = ({ field, row, col, className, onClick, highlight, turn }) => {


    const getColor = (isBlack: boolean): string => isBlack ? "var(--white-color)" : "var(--black-color)"

    const cursor = () => {
        if (turn === field.team) {
            return "pointer"
        } else if (!field.piece) {
            return "default"
        } else {
            return "not-allowed"
        }
    }

    return (
        <div className={className + (highlight ? (" " + styles.highlight) : "")}
            onClick={() => {
                if (onClick) onClick({ ...field, pos: { row, col } })
            }}
            style={{
                backgroundColor: getColor(field.color !== "black"),
                color: getColor(field.color === "black"),
                cursor: cursor()
            }}>
            {<Image height="60%" width="60%" src={`/img/${field.team}-${field.piece}.svg`} />}
        </div>
    );
}

export default Piece