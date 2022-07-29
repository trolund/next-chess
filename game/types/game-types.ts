    // types
    export type team = "white" | "black" | null
    export type piece = "king" | "rook" | "bishop" | "queen" | "knight" | "pawn" | null
    export type diagonal = "lowToHigh" | "highToLow"

    export type simplePiece = "k" | "K" | "q" | "Q" | "r" | "R" | "b" | "B" | "n" | "N" | "p" | "P" | "#"
    export type simpleBoard = simplePiece[][]  
    export type testCase = { name: string, comment?: string, board: simpleBoard, turn: team }

    export type field = {
        team: team
        piece: piece
        color: team
        pos: pos;
    }

    export type chessPos = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8" 
                         | "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "B7" | "B8"
                         | "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8"
                         | "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8"
                         | "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "E7" | "E8"
                         | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8"
                         | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8"
                         | "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "H7" | "H8"
    
    export type chessPosList = chessPos[]

    export type action = { from: chessPos | pos, to: chessPos | pos }

    export type board = field[][]

    export type pos = { row: number, col: number }

    export type gameState = {
        board: board;
        piecesTaken: field[];
        turn: team;
    }

    export type AIRes = {score: number, action: action}

    export type moveOptions = { 
        checkValidity?: boolean,
        transformation?: piece          
       } 