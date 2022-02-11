import { chess } from '../../game/game'

export module testUtil {

    export type simplePiece = "k" | "K" | "q" | "Q" | "r" | "R" | "b" | "B" | "n" | "N" | "p" | "P" | "#"
    export type simpleBoard = simplePiece[][]

    const createNewBoardFromSimpleBoard = (sb: simpleBoard): chess.board => {

        const getField = (row: number, col: number): chess.field => {
            return fromSimpleToField(sb[row][col], row, col)
        }

        const getTeam = (char: string): chess.team => {
            if (!char || char === "#") {
                return null
            }

            if (char == char.toUpperCase()) {
                return "black"
            }

            return "white"
        }

        const getPiece = (input: simplePiece): chess.piece => {
            if (!input) {
                return null
            }

            const sp = input.toUpperCase()

            if (sp === "K") {
                return "king"
            } else if (sp === "B") {
                return "bishop"
            } else if (sp === "N") {
                return "knight"
            } else if (sp === "P") {
                return "pawn"
            } else if (sp === "Q") {
                return "queen"
            } else if (sp === "R") {
                return "rook"
            } else {
                return null
            }
        }

        const fromSimpleToField = (sp: simplePiece, row: number, col: number): chess.field => {
            return {
                color: chess.getBoardColor(row, col),
                team: getTeam(sp),
                piece: getPiece(sp),
                pos: { row, col }
            }
        }

        const board: chess.field[][] = []

        for (var row: number = 0; row < 8; row++) {

            board[row] = []

            for (var col: number = 0; col < 8; col++) {
                board[row][col] = getField(row, col)
            }
        }

        return board
    }

    // false if SimpleBoard is NOT valid
    const validateSizeOfSimpleBoard = (sb: simpleBoard): boolean => {
        const boardSize = 8;
        if (sb.length !== boardSize) {
            return false;
        } else {
            return sb.every(x => x.length === boardSize)
        }
    }

    export const createTestGame = (sb: simpleBoard, turn: chess.team = "white", piecesTaken: chess.field[] = []): chess.gameState => {

        if (!validateSizeOfSimpleBoard(sb)) {
            throw new Error("test board is not the correct size!")
        }

        return { board: createNewBoardFromSimpleBoard(sb), piecesTaken, turn }
    }

    export const printBoard = (sb: chess.board) => {
        for(let row = 0; row < 7; row++){
            console.log("\n")
            for(let col = 0; col < 7; col++){
                console.log(sb[row][col])
            }
        }
    }


}