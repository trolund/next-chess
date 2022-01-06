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
        piecesTaken: piece[];
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

        prevState.board[fromPos.row][fromPos.col].team = null
        prevState.board[fromPos.row][fromPos.col].piece = null

        prevState.board[toPos.row][toPos.col].team = tempTeam
        prevState.board[toPos.row][toPos.col].piece = tempPiece

        return prevState;
    }

    export const allValidMoves = (fromPos: pos, state: gameState): pos[] => {
        let moves = new Set<pos>();
        const from = state.board[fromPos.row][fromPos.col];

        return [{ col: 0, row: 0 }, { col: 4, row: 5 }];
    }

    export const notation = (pos: chess.pos): string => {
        const col = ["A", "B", "C", "D", "E", "F", "G", "H"]

        return `${8 - pos.row}${col[pos.col]}`
    }
}