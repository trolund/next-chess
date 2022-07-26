import { emptyBoard } from "../stores/emptyBoard"
import { testUtil } from "../test/utils/testUtil"
import { colOptions } from "./col-options"
import { bishop, king, knight, pawn, pawnAttack, queen, rook } from "./move-validator"
import { action, board, chessPos, field, gameState, piece, pos, team } from "./types/game-types"
import _ from "lodash"

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
    export const move = (fromPos: pos, toPos: pos, prevState: gameState, checkValidity: boolean = true): gameState => {

        // throw error if the move is not valid
        if (checkValidity && !isValidMove(fromPos, toPos, prevState)) throw new Error("This is not a valid move!")

        const newState = _.cloneDeep(prevState);
        const board = newState.board;
        const teamsTurn = newState.turn;

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
        if (newState.board[toPos.row][toPos.col].piece != null) {
            newState.piecesTaken.push(prevState.board[toPos.row][toPos.col])
        }

        newState.board[fromPos.row][fromPos.col].team = null
        newState.board[fromPos.row][fromPos.col].piece = null

        newState.board[toPos.row][toPos.col].team = tempTeam
        newState.board[toPos.row][toPos.col].piece = tempPiece

        newState.turn = newState.turn === "white" ? "black" : "white"

        return newState;
    }

    export const allValidMoves = (state: gameState, attack: boolean = false): action[] => {
        const turn = state.turn
        const board = state.board
        const validMoves: action[] = []

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const field = board[i][j]
                if(field.team === turn){
                    const movesFromField = validMovesFrom(field.pos, state, attack)
                    movesFromField.forEach(m => {
                        validMoves.push({ from: field.pos, to: m })
                    })
                }
            }
        }

        return validMoves
    }

    export const validMovesFrom = (fromPos: pos | string, state: gameState, attack: boolean = false): pos[] => {

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
                if (isValidMove(fromPosParsed, pos, state, attack)) {
                    validMoves.push(pos)
                }
            })
        });

        return validMoves;
    }

    export const allReachableMoves = (state: gameState): action[] => {
        const turn = state.turn
        const board = state.board
        const validMoves: action[] = []

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const field = board[i][j]
                if(field.team === turn){
                    const movesFromField = reachableFrom(field.pos, state)
                    movesFromField.forEach(m => {
                        validMoves.push({ from: field.pos, to: m } as action)
                    })
                }
            }
        }

        return validMoves
    }

    export const reachableFrom = (from: pos | string, state: gameState): pos[] => {

        const piece = getFieldAtPos(typeof from === "string" ? toPos(from): from, state)
        const cleanState = testUtil.createTestGame(emptyBoard, state.turn)

        cleanState.board[piece.pos.row][piece.pos.col] = piece

        let fromPosParsed: pos;

        if (!from || !state) {
            return []
        }

        if(typeof from === "string"){
            fromPosParsed = toPos(from)            
        }else {
            fromPosParsed = from;
        }

        const validMoves: pos[] = [];

        cleanState.board.forEach((row, i) => {
            row.forEach((field, j) => {
                const pos: pos = { row: i, col: j };
                if (isValidMove(fromPosParsed, pos, cleanState, true)) {
                    validMoves.push(pos)
                }
            })
        });

        return validMoves;
    }

    export const getFieldAtPos = (pos: pos, state: gameState): field => {
        return state.board[pos.row][pos.col]
    }

    export const isValidMove = (from: pos, to: pos, state: gameState, attack: boolean = false): boolean => {
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
            return attack ? pawnAttack(from, to, state, attack) : pawn(from, to, state)
        } else if (pieceType === "bishop") {            
            return bishop(from, to, state) 
        } else if (pieceType == "knight") {
            return knight(from, to, state)
        } else if (pieceType == "king") {
            return king(from, to, state)
        } else if (pieceType == "rook") {
            return rook(from, to, state)
        } else if (pieceType == "queen") {
            return queen(from, to, state)
        } else {
            return false;
        }
    }

    export const notation = (pos: pos): string | chessPos => {
        return `${colOptions[pos.col]}${8 - pos.row}`
    }

    export const actionsCleanUp = (actions: action[]): action[] => {
        return actions.map(a => ({from: typeof a.from !== "string" ? notation(a.from) : a.from, to: typeof a.to !== "string" ? notation(a.to) : a.to } as action))
    }

    export const onlyToPos = (actions: action[]): (pos | chessPos)[] => {
        return actions.map(a => a.to)
    }


    export const notationComponents = (pos: pos): { number: number, char: string } => {
        return { number: 8 - pos.row, char: colOptions[pos.col] }
    }

    export const toPos = (notation: string): pos => {
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

    const changeTeam = (turn: team): team => turn === "white" ? "black" : "white"

    // https://simple.wikipedia.org/wiki/Check_and_checkmate
    // filter pawns moves right in front if it out. (den kan ikke tage en modtander ved at gå frem)
    // led brikkerne tage deres egne med-spillere
    // TODO
    export function checkmate(state: gameState): boolean {
        const board: board = state.board
        const team: team = changeTeam(state.turn)
        const king: field = board.flat().filter(f => f.piece === "king")[0]        

        const kingsMoves = onlyToPos(actionsCleanUp(validMovesFrom(king.pos, {...state, turn: king.team}).map(to => ({from: king.pos, to } as action), true)))
        const validMoves = onlyToPos(actionsCleanUp(allValidMoves({...state, turn: team}, true)))

        // console.log("king: ", king);
        
        console.log("kings moves: ", kingsMoves);
        console.log("valid moves: ", validMoves); // F7 is missing

        return !kingsMoves.some(km => !validMoves.includes(km))
    }

    export function check(state: gameState): boolean {
        const board: board = state.board
        const team: team = changeTeam(state.turn)
        const king: field = board.flat().filter(f => f.piece === "king" && f.team === state.turn)[0]   
        const kingPos = notation(king.pos)     

        const validMoves = onlyToPos(actionsCleanUp(allValidMoves({...state, turn: team}, true)))
        return validMoves.some(m => m === kingPos)
    }

}