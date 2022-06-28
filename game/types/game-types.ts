    // types
    export type team = "white" | "black" | null
    export type piece = "king" | "rook" | "bishop" | "queen" | "knight" | "pawn" | null
    export type diagonal = "lowToHigh" | "highToLow"

    export type simplePiece = "k" | "K" | "q" | "Q" | "r" | "R" | "b" | "B" | "n" | "N" | "p" | "P" | "#"
    export type simpleBoard = simplePiece[][]  
    export type testCase = { name: string, comment?: string, subCases: subCase[], board: simpleBoard }
    export type subCase = { expected: pos[], pieceToMove: string, name: string, comment?: string}

    export type field = {
        team: team
        piece: piece
        color: team
        pos: pos;
    }

    export type board = field[][]

    export type pos = { row: number, col: number }

    export type gameState = {
        board: board;
        piecesTaken: field[];
        turn: team;
    }