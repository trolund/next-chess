export module chess {


    // types
    export type team = "white" | "black" | null
    export type piece = "king" | "rook" | "bishop" | "queen" | "knight" | "pawn" | null

    // export type simplePiece = "k" | "K" | "q" | "Q" | "r" | "R" | "b" | "B" | "n" | "N" | "p" | "P" | "#"
    // export type simpleBoard = simplePiece[][]

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
    const formatPos = (pos: pos): string => `${notation(pos)} - (${pos.row}, ${pos.col})`

    // get color of board
    export const getBoardColor = (row: number, col: number): team => (row + col) % 2 == 0 ? "white" : "black"

    // operations
    const createNewBoard = (): board => {

        const backLineWhite: piece[] = ["rook", "knight", "bishop", "king", "queen", "bishop", "knight", "rook"]
        const backLineBlack: piece[] = [...backLineWhite].reverse()

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

    const isPieceBetweenCol = (from: pos, to: pos, state: gameState) => {

        if (from.col !== to.col) {
            return false;
        }

        const arrayToInvestigate: field[] = []

        state.board.forEach(row => {
            arrayToInvestigate.push(row[from.col])
        })

        for (let i = from.row; i > to.row; i--) {
            if (arrayToInvestigate[i].piece !== null && i !== from.row) {
                return false;
            }
        }

        for (let i = from.row; i < to.row; i++) {
            if (arrayToInvestigate[i].piece !== null && i !== from.row) {
                return false;
            }
        }

        return true;
    }

    const isPieceBetweenRow = (from: pos, to: pos, state: gameState) => {

        if (from.row !== to.row) {
            return false;
        }

        const arrayToInvestigate: field[] = state.board[from.row]

        for (let i = from.col; i > to.col; i--) {
            if (arrayToInvestigate[i].piece !== null && i !== from.col) {
                return false;
            }
        }

        for (let i = from.col; i < to.col; i++) {
            if (arrayToInvestigate[i].piece !== null && i !== from.col) {
                return false;
            }
        }

        return true;
    }

    const isNotMyPiece = (from: pos, to: pos, state: gameState) => {
        const fromField = state.board[from.row][from.col]
        const toField = state.board[to.row][to.col]
        return fromField.team !== toField.team
    }

    const pawnAttack = (from: chess.pos, to: chess.pos, state: chess.gameState): boolean => {
        const direction = state.turn === "white" ? 1 : -1

        const right = (to.col - 1) === from.col && from.row === (to.row + direction)
        const left = (to.col + 1) === from.col && from.row === (to.row + direction)

        const field = state.board[to.row][to.col]

        if (right) {
            return field?.team !== state.turn && field.piece !== null
        } else if (left) {
            return field?.team !== state.turn && field.piece !== null
        } else {
            return false
        }
    }

    const pawn = (from: pos, to: pos, state: gameState) => {
        let maxWalkLength = 1;
        if (state.turn === "white" && from.row === 6) {
            maxWalkLength = 2;
        } else if (state.turn === "black" && from.row === 1) {
            maxWalkLength = 2;
        }

        const center = to.col === from.col && from.row === to.row
        const field = state.board[to.row][to.col]

        if (state.turn === "white") {
            return (
                to.col === from.col
                && to.row < from.row
                && to.row + maxWalkLength >= from.row
                && ((center && field.piece !== null) || field.piece === null)
            )
                || pawnAttack(from, to, state)
        } else {
            return (
                to.col === from.col
                && to.row > from.row
                && to.row - maxWalkLength <= from.row
                && ((center && field.piece !== null) || field.piece === null)
            )
                || pawnAttack(from, to, state)
        }


    }

    const knight = (from: pos, to: pos, state: gameState) => {
        return (from.col + 2 == to.col && from.row + 1 == to.row
            || from.col - 2 == to.col && from.row - 1 == to.row
            || from.col + 2 == to.col && from.row - 1 == to.row
            || from.col - 2 == to.col && from.row + 1 == to.row
            || from.col - 1 == to.col && from.row + 2 == to.row
            || from.col + 1 == to.col && from.row + 2 == to.row
            || from.col + 1 == to.col && from.row - 2 == to.row
            || from.col - 1 == to.col && from.row - 2 == to.row)
            && state.board[to.row][to.col].team !== state.turn
    }

    const king = (from: pos, to: pos, state: gameState) => {
        return (to.col === from.col && isNotMyPiece(from, to, state) && isPieceBetweenCol(from, to, state)) || (to.row === from.row && isNotMyPiece(from, to, state) && isPieceBetweenRow(from, to, state))
    }

    const lowToHighEval = (from: pos, to: pos, state: field[]) => {
        // const rightTop = state.slice(0, from.row)
        // const leftBottom = state.slice(from.row + 1, state.length)
        // const index = getIndex(rightTop.reverse())
        // const index2 = getIndex(leftBottom)

        // console.log(index, index2);


        // return !(to.row <= (index + rightTop.length)) || !(to.row <= (index2 + leftBottom.length))

        for (let i = from.row; i > to.row; i--) {
            if (state[i].piece !== null && i !== from.row) {
                return false;
            }
        }

        for (let i = from.row; i < to.row; i++) {
            if (state[i].piece !== null && i !== from.row) {
                return false;
            }
        }

        return true;
    }

    const highToLowEval = (from: pos, to: pos, state: field[]) => {
        for (let i = from.row; i > to.row; i--) {
            if (state[i].piece !== null && i !== from.row) {
                return false;
            }
        }

        for (let i = from.row; i < to.row; i++) {
            if (state[i].piece !== null && i !== from.row) {
                return false;
            }
        }

        return true;
    }

    // const getIndex = (a: field[]) => {
    //     let index = 7;

    //     for (let i = 0; i < a.length; i++) {
    //         if (a[i].piece !== null) {
    //             index = i;
    //         }
    //     }

    //     return index;
    // }

    const isPieceBetweenDiagonal = (from: pos, to: pos, state: gameState) => {
        const lowToHigh: field[] = []
        const highToLow: field[] = []

        state.board.forEach(row =>
            row.forEach(col => {
                const to = col.pos
                // kan simplifiseres!!!!!
                if (to && (((from.col - to.col) + (from.row - to.row)) % 2 === 0
                    && (to.col - from.col) === (from.row - to.row) || (from.col - to.col) === (from.row - to.row)
                    && state.board[to.row][to.col].team !== state.turn
                    && (to.col - from.col) === (from.row + to.row) || (from.col - to.col) === (from.row + to.row))
                    && !(to && ((from.col - to.col) + (from.row - to.row)) % 2 === 0 && (from.col - to.col) === (from.row - to.row))
                ) {
                    lowToHigh.push(col)
                }
            }))

        state.board.forEach(row =>
            row.forEach(col => {
                const to = col.pos
                if (to && ((from.col - to.col) + (from.row - to.row)) % 2 === 0 && (from.col - to.col) === (from.row - to.row)) {
                    highToLow.push(col)
                }
            }))

        console.log(lowToHigh, highToLow);


        const x = lowToHigh.find(x => x.pos && x.pos.col === to.col && x.pos.row === to.row)
        const y = highToLow.find(f => f.pos && f.pos.col === to.col && f.pos.row === to.row)

        if (x) {
            return lowToHighEval(from, to, lowToHigh)
        } else if (y) {
            return highToLowEval(from, to, highToLow)
        } else {
            return true;
        }

        return true
    }

    const bishop = (from: pos, to: pos, state: gameState) => {
        return isPieceBetweenDiagonal(from, to, state)
            && ((from.col - to.col) + (from.row - to.row)) % 2 === 0
            && state.board[to.row][to.col].team !== state.turn
            && (to.col - from.col) === (from.row - to.row) || (from.col - to.col) === (from.row - to.row)
            && state.board[to.row][to.col].team !== state.turn

    }

    export const isValidMove = (from: pos, to: pos, state: gameState): boolean => {
        const pieceField: field = state.board[from.row][from.col];
        const toField: field = state.board[to.row][to.col];

        const pieceType = pieceField.piece;

        if (pieceField.team !== state.turn) {
            return false;
        }

        if (pieceType === "pawn") {
            return pawn(from, to, state)
        } else if (pieceType === "bishop") {
            return bishop(from, to, state)
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

    export const notation = (pos: chess.pos): string => {
        const col = ["A", "B", "C", "D", "E", "F", "G", "H"]
        return `${8 - pos.row}${col[pos.col]}`
    }

    export const notationComponents = (pos: chess.pos): { number: number, char: string } => {
        const col = ["A", "B", "C", "D", "E", "F", "G", "H"]
        return { number: 8 - pos.row, char: col[pos.col] }
    }
}