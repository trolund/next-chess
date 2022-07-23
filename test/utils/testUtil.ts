import { chess } from '../../game/game'
import { board, field, gameState, piece, simpleBoard, simplePiece, team, pos, chessPosList, action, chessPos } from '../../game/types/game-types'

export module testUtil {

    const createNewBoardFromSimpleBoard = (sb: simpleBoard): board => {

        const getField = (row: number, col: number): field => {
            return fromSimpleToField(sb[row][col], row, col)
        }

        const getTeam = (char: string): team => {
            if (!char || char === "#") {
                return null
            }

            if (char == char.toUpperCase()) {
                return "black"
            }

            return "white"
        }

        const getPiece = (input: simplePiece): piece => {
           // if (!input) return null

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

        const fromSimpleToField = (sp: simplePiece, row: number, col: number): field => {
            return {
                color: chess.getBoardColor(row, col),
                team: getTeam(sp),
                piece: getPiece(sp),
                pos: { row, col }
            }
        }

        const board: field[][] = []

        for (var row: number = 0; row < 8; row++) {

            board[row] = []

            for (var col: number = 0; col < 8; col++) {
                board[row][col] = getField(row, col)
            }
        }

        return board
    }

    // false if SimpleBoard is NOT valid
    export const validateSizeOfSimpleBoard = (sb: simpleBoard): boolean => {
        const boardSize = 8;
        if (sb.length !== boardSize) {
            return false;
        } else {
            return sb.every(x => x.length === boardSize)
        }
    }

    export const createTestGame = (sb: simpleBoard, turn: team = "white", piecesTaken: field[] = []): gameState => {

        if (!sb || !validateSizeOfSimpleBoard(sb)) {
            throw "test board is not the correct size!"
        }

        return { board: createNewBoardFromSimpleBoard(sb), piecesTaken, turn }
    }

    export const printBoard = (sb: board) => {
        for(let row = 0; row < 7; row++){
            console.log("\n")
            for(let col = 0; col < 7; col++){
                console.log(sb[row][col])
            }
        }
    }

    export const printActions = (actions: action[]) => {
        let s = ""
        actions.forEach(a => {
            s = s + printAction(a)
        })
        console.log(s);
    }

    const printAction = (action: action) => {
        const from: chessPos | string = typeof action.from === "string" ? action.from : chess.notation(action.from)
        const to: chessPos | string = typeof action.to === "string" ? action.to : chess.notation(action.to)
        return `${from} --> ${to}\n`
    }

    export const posArrayToNotationArray = (a: pos[]): chessPosList => {
        return a.map(p => chess.notation(p)).sort() as chessPosList
    }

    export const notationArrayToPosArray = (a: string[]): pos[] => {
        return a.map(n => chess.toPos(n)).sort()
    }

    export const changeTurn = (state: gameState): gameState => {
        state.turn = state.turn === "white" ? "black" : "white"
        return state
    }

}