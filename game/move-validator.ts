import { format } from "path";
import { chess } from "./game";
import { board, diagonal, field, gameState, pos } from "./types/game-types";

    const pawn = (from: pos, to: pos, state: gameState): boolean => {
        const direction = state.turn === "black" ? 1 : -1
        const notOccupied = chess.getFieldAtPos(to, state).team === null

        return  (to.col === from.col 
                && to.row - from.row === direction // in the direction of the opponent
                && notOccupied) // empty in front of piece
                || pawnAttack(from, to, state) // pwan can attack
                || startPawn(from, to, state, notOccupied) // from starting position the pawn can move to steps forward
    }

    const pawnAttack = (from: pos, to: pos, state: gameState): boolean => {
        const direction = state.turn === "black" ? -1 : 1

        const right = (to.col - 1) === from.col && from.row === (to.row + direction)
        const left = (to.col + 1) === from.col && from.row === (to.row + direction)        

        const field = chess.getFieldAtPos(to, state)

        if (right || left) {
            return field?.team !== state.turn && field.piece !== null
        } 

        return false
    }

    const startPawn = (from: pos, to: pos, state: gameState, notOccupied: boolean): boolean => {
        if(state.turn === "white" && from.row === 6){
            const whiteInFront = chess.getFieldAtPos({row: from.row -1, col: from.col}, state).team === null // can not jump over other piece
            return to.col === from.col && to.row === 4 && notOccupied && whiteInFront
        }else if (state.turn === "black" && from.row === 1) {
            const blackInFront = chess.getFieldAtPos({row: from.row +1, col: from.col}, state).team === null // can not jump over other piece
            return to.col === from.col && to.row === 3 && notOccupied && blackInFront
        }
        return false
    }

    const knight = (from: pos, to: pos, state: gameState): boolean => {
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
        const colLength = Math.abs(to.col - from.col)
        const rowLength = Math.abs(to.row - from.row)

        if(colLength > 1 || rowLength > 1) return false

        return ((to.col === from.col 
            && isNotMyPiece(from, to, state) 
            && isPieceBetweenCol(from, to, state)) || (to.row === from.row 
            && isNotMyPiece(from, to, state) 
            && isPieceBetweenRow(from, to, state))
            || bishop(from, to, state))
    }

    const rook = (from: pos, to: pos, state: gameState) => {
        return (to.col === from.col 
            && isNotMyPiece(from, to, state) 
            && isPieceBetweenCol(from, to, state)) || (to.row === from.row 
            && isNotMyPiece(from, to, state) 
            && isPieceBetweenRow(from, to, state))
    }

    const queen = (from: pos, to: pos, state: gameState) => {
        return ((to.col === from.col 
            && isNotMyPiece(from, to, state) 
            && isPieceBetweenCol(from, to, state)) || (to.row === from.row 
            && isNotMyPiece(from, to, state) 
            && isPieceBetweenRow(from, to, state))
            || bishop(from, to, state))
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

    const bishop = (from: pos, to: pos, state: gameState) => {        

        if(from.col === to.col && from.row === to.row) return false // The piece there should be moved

        const pathLength = Math.abs(to.col - from.col); 
        if (pathLength != Math.abs(to.row - from.row)) return false // Not diagonal
       
        if(to.row > from.row && to.col > from.col){ // bottom right
            for (let i = 1; i < pathLength; i++) {
                
                let row = from.row + i
                let col = from.col + i
    
                if(IsEmpty({col, row}, state)) continue; // No obstacles here: keep going
                else return false; // Obstacle found before reaching target: the move is invalid
            }
        } else if(to.row < from.row && to.col > from.col){ // top right
            for (let i = 1; i < pathLength; i++) {
                
                let row = from.row - i
                let col = from.col + i

                if(IsEmpty({col, row}, state)) continue; // No obstacles here: keep going
                else return false; // Obstacle found before reaching target: the move is invalid
            }
        } else if(to.row < from.row && to.col < from.col){ // top left
            for (let i = 1; i < pathLength; i++) {
                
                let row = from.row - i
                let col = from.col - i
    
                if(IsEmpty({col, row}, state)) continue; // No obstacles here: keep going
                else return false; // Obstacle found before reaching target: the move is invalid
            }
        } else if(to.row > from.row && to.col < from.col){ // bottom left
            for (let i = 1; i < pathLength; i++) {
                
                let row = from.row + i
                let col = from.col - i
    
                if(IsEmpty({col, row}, state)) continue; // No obstacles here: keep going
                else return false; // Obstacle found before reaching target: the move is invalid
            }
        }

        // Check target cell
        if (IsEmpty({col: to.col, row: to.row}, state)) return true; // No piece: move is valid

        // There's a piece here: the move is valid only if we can capture
        const fromField = chess.getFieldAtPos(from, state)
        const toField = chess.getFieldAtPos(to, state)
        return toField.team !== fromField.team
    }

    const canCapture = (from: pos, to: pos, state: gameState) => chess.getFieldAtPos(to, state).piece !== chess.getFieldAtPos(from, state).piece // true if player can capture

    const isPieceBetweenDiagonal = (from: pos, to: pos, state: gameState) => {
        const [lowToHigh, highToLow] = diagonals(state.board, from)

        const x = lowToHigh.find(x => x.pos && x.pos.col === to.col && x.pos.row === to.row)
        const y = highToLow.find(f => f.pos && f.pos.col === to.col && f.pos.row === to.row)

        if (x) {
            return lowToHighEval(from, to, lowToHigh, false)
        }

        if (y) {
            return lowToHighEval(from, to, highToLow, true)
        }

        return true;
    }

    const IsEmpty = (pos: pos, state: gameState) => {
        return state.board[pos.row][pos.col]?.piece === null
    }

    const GetPieceTeam = (pos: pos, state: gameState) => {
        state.board[pos.row][pos.col].team
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

    const diagonals = (board: board, pos: pos) => {
        const cellX = pos.col
        const cellY = pos.row

        let forward: field[] = [] // diagonal according forward slash shape: / 
        let backward: field[] = [] // diagonal according backslash shape: \

        let n = board.length

        board.forEach((row, y) => {
            let x = cellX - (cellY - y);
            if (x >= 0 && x < n) backward.push(row[x])
            x = cellX + (cellY - y);
            if (x >= 0 && x < n) forward.push(row[x])
        })
        return [forward, backward]
    }

    export const inShadow = (from: pos, to: pos, state: gameState): boolean => {
        const [lowToHigh, highToLow] = diagonals(state.board, from)
        const isInLowToHigh = lowToHigh.some(f => f.pos.col === to.col && f.pos.row === to.row)
        return inBetween(from, to, isInLowToHigh ? lowToHigh : highToLow, isInLowToHigh ? "lowToHigh" : "highToLow")
    }

    const lowToHighEval = (from: pos, to: pos, state: field[], boolean: boolean) => {

        const b = boolean ? -3 : 0
        
        for (let i = from.col; i > to.col; i--) {   
            const index = i-b; 
            if ((index >= 0 && index < state.length && i !== from.col) && state[index].piece !== null) {
                return false;
            }
        }

        const b2 = boolean ? 0 : 3

        for (let i = from.col; i < to.col; i++) {
            const index = i-b2; 
            if ((index >= 0 && index < state.length && i !== from.col) && state[index].piece !== null) {
                return false;
            }
        }

        return true;
    }


    export const inBetween = (from: pos, to: pos, diagonalList: field[], diagonal: diagonal): boolean => {

        // const isRight = from.col > to.col 
         const isTop = from.row < to.row 
 
         if(diagonal === "lowToHigh"){
             if(isTop){
                 return fromLowToHigh(from, to, diagonalList)
             }else {
                 return fromHighToLow(from, to, diagonalList)
             }
         }else {
             if(isTop){
                 return fromLowToHigh(from, to, diagonalList)
             }else {
                 return fromHighToLow(from, to, diagonalList)
             }
         }
 
         
     }

         // use row numbers
    const fromLowToHigh = (from: pos, to: pos, diagonalList: field[]) => {
        for (let index = from.row; index > to.row; index--) {
            const element = diagonalList[index];
            return element.piece !== null && from.row !== to.row 
        }
        return false
    }


    // use row numbers
    const fromHighToLow = (from: pos, to: pos, diagonalList: field[]) => {
        for (let index = from.row; index < to.row; index++) {
            const element = diagonalList[index];
            return element.piece !== null && from.row !== to.row 
        }
        return false
    }




export {pawn, king, knight, bishop, queen, rook}