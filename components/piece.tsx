import Image from "next/image";
import { FunctionComponent } from "react"
import { chess } from "../game/game";
import { field, team } from "../game/types/game-types";
import styles from '../styles/Home.module.css'

interface PieceProps {
    field: field;
    row: number;
    col: number;
    className?: string;
    onClick?: (field: field) => void;
    highlight?: boolean;
    turn?: team;
    selected?: boolean | undefined | null;
    debug?: boolean;
    debugUseNotation?: boolean;
    leftLabel?: string | null;
    bottomLabel?: string | null;
}

type labelPos = "BOTTOM" | "LEFT"

const Piece: FunctionComponent<PieceProps> = ({ field, row, col, className, onClick, highlight, turn, selected, debug, debugUseNotation, leftLabel, bottomLabel }) => {

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

    const theLabel = (label: string, labelPos: labelPos) => {
        if (labelPos === "LEFT") {
            return <p style={{ position: "absolute", marginTop: "calc((var(--field-size)/2 - 6px) * -1)", fontSize: "0.7rem", opacity: 0.5 }}>{label}</p>
        } else {
            return <p style={{ position: "absolute", marginLeft: "calc((var(--field-size)/2 + 14px))", fontSize: "0.7rem", marginTop: "18px", opacity: 0.5 }}>{label}</p>
        }
    }

    return (
        <div className={className + " " + (highlight ? (field.team !== null && turn !== field.team) ? (styles.threaten) : (styles.highlight) : "") + " " + (selected ? (styles.selected) : "")}
            onClick={() => {
                if (onClick) onClick({ ...field, pos: { row, col } })
            }}
            style={{
                backgroundColor: getColor(field.color !== "black"),
                color: getColor(field.color === "black"),
                cursor: cursor()
            }}>
            {leftLabel && theLabel(leftLabel, "LEFT")}
            {bottomLabel && theLabel(bottomLabel, "BOTTOM")}
            {debug && <div style={{ position: "absolute" }}>{debugUseNotation ? <span style={{fontSize: "0.6rem"}}>{chess.notation({row, col})}<p style={{fontSize: "0.5rem", lineHeight: "normal", marginTop: "-1.1rem"}}>{`${row}, ${col}`}</p></span> : `${row}, ${col}`}</div>}
            {<Image height="60%" width="60%" src={`/img/${field.team}-${field.piece}.svg`} />}

        </div>
    );
}

export default Piece