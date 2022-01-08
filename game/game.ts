export module chess {

    // types
    export type team = "white" | "black" | null
    export type piece = "king" | "rook" | "bishop" | "queen" | "knight" | "pawn" | null

    export type field = {
        team: team
        piece: piece
        color: team
        pos?: pos;
    }

    export type board = field[][]

    export type pos = { row: number, col: number }

    export type gameState = {
        board: board;
        piecesTaken: field[];
        turn: team;
    }

    // formatting debug 
    const formatPos = (pos: pos): string => `{${pos.row}, ${pos.col}}`

    // operations
    const createNewBoard = (): board => {

        const backLineWhite: piece[] = ["rook", "knight", "bishop", "king", "queen", "bishop", "knight", "rook"]
        const backLineBlack: piece[] = [...backLineWhite].reverse()

        const getBoardColor = (row: number, col: number): team => (row + col) % 2 == 0 ? "white" : "black"

        const getPiece = (row: number, col: number): field => {

            if (row === 0) {
                return { piece: backLineBlack[col], color: getBoardColor(row, col), team: "black" }
            }

            if (row === 7) {
                return { piece: backLineWhite[col], color: getBoardColor(row, col), team: "white" }
            }

            if (row === 1) {
                return { piece: "pawn", color: getBoardColor(row, col), team: "black" }
            }

            if (row === 6) {
                return { piece: "pawn", color: getBoardColor(row, col), team: "white" }
            }

            return { piece: null, color: getBoardColor(row, col), team: null }
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
        if (from.team === to.team) throw new Error("You can not take your own piece")

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

        return prevState;
    }

    export const allValidMoves = (fromPos: pos, state: gameState): pos[] => {

        if (!fromPos || !state) {
            return []
        }

        const validMoves: chess.pos[] = [];
        state.board.forEach((row, i) => {
            row.forEach((field, j) => {
                const pos: chess.pos = { row: i, col: j };
                if (isValidMove(fromPos, pos, state)) {
                    validMoves.push(pos)
                }
            })
        });

        return validMoves;
    }

    // the way is not shadowed by an other piece
    // return true if is shadow
    const firstInCol = (col: field[]): number => {
        let index = -1

        col.forEach((f, i) => {
            if (f.piece) {
                index = i
            }
        })

        return 8 - index
    }

    const getCol = (rowIndex: number, state: gameState) => {
        return state.board.map(d => d[rowIndex]);
    }

    const pawnAttack = (from: pos, to: pos, state: gameState): boolean => {
        const right = (to.col - 1) === from.col && from.row === (to.row + 1)
        const left = (to.col + 1) === from.col && from.row === (to.row + 1)

        if (right) {
            const rightField = state.board[to.row][to.col]
            return rightField?.team !== state.turn && rightField.piece !== null
        } else if (left) {
            const leftField = state.board[to.row][to.col]
            return leftField?.team !== state.turn && leftField.piece !== null
        } else {
            return false
        }
    }

    export const rotateBoard = (state: gameState): gameState => {
        return { ...state, board: state.board.map(row => row.reverse()).reverse() }
    }

    export const isValidMove = (from: pos, to: pos, state: gameState): boolean => {
        const pieceField: field = state.board[from.row][from.col];
        const toField: field = state.board[to.row][to.col];

        const pieceType = pieceField.piece;

        if (pieceField.team !== state.turn) {
            return false;
        }

        if (pieceType === "pawn") {
            let maxWalkLength = 1;
            if (state.turn === "white" && from.row === 6) {
                maxWalkLength = 2;
            } else if (state.turn === "black" && from.row === 1) {
                maxWalkLength = 2;
            }

            return (to.col === from.col
                && to.row < from.row
                && to.row + maxWalkLength >= from.row
                && !(to.row <= firstInCol(getCol(to.col, state))))
                || pawnAttack(from, to, state)
        } else if (pieceType === "bishop") {
            return (to.row + to.col) % 2 === 1
        } else if (pieceType == "knight") {
            const reach = 2;

            return to.row + reach >= from.row
                && to.row - reach <= from.row
                && to.col + reach >= from.col
                && to.col - reach <= from.col
                // && (to.row + to.col) % 2 === 0
                && !(from.col === to.col || from.row === to.row)
                && (from.col + 1 != to.col && from.row + 1 != to.row)



        }

        return false;
    }



    export const notation = (pos: chess.pos): string => {
        const col = ["A", "B", "C", "D", "E", "F", "G", "H"]

        return `${8 - pos.row}${col[pos.col]}`
    }
}