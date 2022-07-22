import { bishopCanMove, king, knight, pawn } from "./pice-moves"
import { board, diagonal, field, gameState, piece, pos, team } from "./types/game-types"

export module chess {

    // formatting debug 
    const formatPos = (pos: pos): string => `${notation(pos)} - (${pos.row}, ${pos.col})`

    // get color of board
    export const getBoardColor = (row: number, col: number): team => (row + col) % 2 == 0 ? "white" : "black"

    // operations
    const createNewBoard = (): board => {

        const backLineWhite: piece[] = ["rook", "knight", "bishop", "king", "queen", "bishop", "knight", "rook"]
        const backLineBlack: piece[] = [...backLineWhite].reverse()

        const getPiece = (row: number, col: number): field => {

            const pos: pos = {row: row, col: col};

            if (row === 0) {
                return { piece: backLineBlack[col], color: getBoardColor(row, col), team: "black", pos }
            }

            if (row === 7) {
                return { piece: backLineWhite[col], color: getBoardColor(row, col), team: "white", pos }
            }

            if (row === 1) {
                return { piece: "pawn", color: getBoardColor(row, col), team: "black", pos }
            }

            if (row === 6) {
                return { piece: "pawn", color: getBoardColor(row, col), team: "white", pos }
            }

            return { piece: null, color: getBoardColor(row, col), team: null, pos }
        }

        const board: field[][] = []

        for (var row: number = 0; row < 8; row++) {

            board[row] = []

            for (var col: number = 0; col < 8; col++) {
                board[row][col] = getPiece(row, col)
            }
        }

        return board
    }

    export const createGame = (): gameState => {
        return { board: createNewBoard(), piecesTaken: [], turn: "white" }
    }

    export const rotateBoard = (state: gameState): gameState => {
        return {
            ...state,
            board: state.board.map(row => row.reverse()).reverse(),
            //orientation: state.orientation === "white" ? "black" : "white"
        }
    }

    // not done
    export const move = (fromPos: pos, toPos: pos, prevState: gameState): gameState => {

        // throw error if the move is not valid
        if (!isValidMove(fromPos, toPos, prevState)) throw new Error("This is not a valid move!")

        const board = prevState.board;
        const teamsTurn = prevState.turn;

        const from = board[fromPos.row][fromPos.col];
        const to = board[toPos.row][toPos.col];

        // fail if no piece is present 
        if (from.piece === null) throw new Error("There is no piece to move on position " + formatPos(fromPos))

        // fail if player tries to move other players piece
        if (from.team !== teamsTurn) throw new Error("This price is not owned by player " + teamsTurn)

        // fail if your own piece is on the spot you will move to
        if (from.team === to.team) throw new Error("You can not take your own piece : " + to.team + " " + from.team)

        // do the actual move 
        const tempTeam = from.team;
        const tempPiece = from.piece;

        // add 
        if (prevState.board[toPos.row][toPos.col].piece != null) {
            prevState.piecesTaken.push(prevState.board[toPos.row][toPos.col])
        }

        prevState.board[fromPos.row][fromPos.col].team = null
        prevState.board[fromPos.row][fromPos.col].piece = null

        prevState.board[toPos.row][toPos.col].team = tempTeam
        prevState.board[toPos.row][toPos.col].piece = tempPiece

        prevState.turn = prevState.turn === "white" ? "black" : "white"

        return prevState;
    }

    export const allValidMoves = (fromPos: pos | string, state: gameState): pos[] => {

        let fromPosParsed: pos;

        if (!fromPos || !state) {
            return []
        }

        if(typeof fromPos === "string"){
            fromPosParsed = toPos(fromPos)            
        }else {
            fromPosParsed = fromPos;
        }

        const validMoves: pos[] = [];

        state.board.forEach((row, i) => {
            row.forEach((field, j) => {
                const pos: pos = { row: i, col: j };
                if (isValidMove(fromPosParsed, pos, state)) {
                    validMoves.push(pos)
                }
            })
        });

        return validMoves;
    }

    export const getFieldAtPos = (pos: pos, state: gameState): field => {
        return state.board[pos.row][pos.col]
    }

    export const isValidMove = (from: pos, to: pos, state: gameState): boolean => {
        let pieceField: field

        try{
            pieceField = state.board[from.row][from.col];
        }catch(e: any){
            return false
        }
        
        // const toField: field = state.board[to.row][to.col];

        const pieceType = pieceField.piece;

        if (pieceField.team !== state.turn) {
            return false;
        }

        if (pieceType === "pawn") {
            return pawn(from, to, state)
        } else if (pieceType === "bishop") {            
            return bishopCanMove(from, to, state) 
        } else if (pieceType == "knight") {
            return knight(from, to, state)
        } else if (pieceType == "king") {
            return king(from, to, state)
        } else if (pieceType == "rook") {
            return king(from, to, state)
        } else if (pieceType == "queen") {
            return king(from, to, state)
        } else {
            return false;
        }
    }

    export const notation = (pos: pos): string => {
        const col = ["A", "B", "C", "D", "E", "F", "G", "H"]
        return `${col[pos.col]}${8 - pos.row}`
    }

    export const notationComponents = (pos: pos): { number: number, char: string } => {
        const col = ["A", "B", "C", "D", "E", "F", "G", "H"]
        return { number: 8 - pos.row, char: col[pos.col] }
    }

    export const toPos = (notation: string): pos => {
        const colOptions = ["A", "B", "C", "D", "E", "F", "G", "H"]
        const row: number = Number.parseInt(notation[1])
        const col: string = notation[0]        

        if(notation.length !== 2 
            || row === NaN 
            || typeof col !== 'string'
            || !colOptions.includes(String(col)) 
            || colOptions.indexOf(col) === -1 
            || (8 - row) < 0) {
                throw "Input not correct notation : " + col + row
            }

        return { col: colOptions.indexOf(col), row: 8 - row } as pos
    }



}