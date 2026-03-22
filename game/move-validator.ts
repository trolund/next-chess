import { gameState, pos } from "./types/game-types";

const inBounds = ({ row, col }: pos) => row >= 0 && row < 8 && col >= 0 && col < 8

const pieceAt = (state: gameState, pos: pos) => inBounds(pos) ? state.board[pos.row][pos.col] : null

const direction = (team: "white" | "black" | null) => team === "white" ? -1 : 1

const isStraightPathClear = (from: pos, to: pos, state: gameState) => {
    if (from.row !== to.row && from.col !== to.col) {
        return false
    }

    const rowStep = Math.sign(to.row - from.row)
    const colStep = Math.sign(to.col - from.col)
    let row = from.row + rowStep
    let col = from.col + colStep

    while (row !== to.row || col !== to.col) {
        if (state.board[row][col].piece !== null) {
            return false
        }
        row += rowStep
        col += colStep
    }

    return true
}

const isDiagonalPathClear = (from: pos, to: pos, state: gameState) => {
    const rowDiff = Math.abs(to.row - from.row)
    const colDiff = Math.abs(to.col - from.col)

    if (rowDiff !== colDiff || rowDiff === 0) {
        return false
    }

    const rowStep = to.row > from.row ? 1 : -1
    const colStep = to.col > from.col ? 1 : -1

    for (let i = 1; i < rowDiff; i++) {
        if (state.board[from.row + rowStep * i][from.col + colStep * i].piece !== null) {
            return false
        }
    }

    return true
}

const pawnAttack = (from: pos, to: pos, state: gameState, attack: boolean = false): boolean => {
    const fromField = pieceAt(state, from)
    const toField = pieceAt(state, to)

    if (!fromField || !toField || fromField.team === null) {
        return false
    }

    const expectedRow = from.row + direction(fromField.team)
    const isDiagonal = expectedRow === to.row && Math.abs(to.col - from.col) === 1

    if (!isDiagonal) {
        return false
    }

    if (attack) {
        return true
    }

    const isCapture = toField.team !== null && toField.team !== fromField.team
    const isEnPassant = state.enPassantTarget?.row === to.row && state.enPassantTarget?.col === to.col

    return isCapture || isEnPassant
}

const pawn = (from: pos, to: pos, state: gameState): boolean => {
    const fromField = pieceAt(state, from)
    const toField = pieceAt(state, to)

    if (!fromField || !toField || fromField.team === null) {
        return false
    }

    const step = direction(fromField.team)
    const startRow = fromField.team === "white" ? 6 : 1
    const singleStep = to.col === from.col && to.row === from.row + step && toField.piece === null
    const doubleStep = to.col === from.col
        && from.row === startRow
        && to.row === from.row + step * 2
        && toField.piece === null
        && state.board[from.row + step][from.col].piece === null

    return singleStep || doubleStep || pawnAttack(from, to, state)
}

const knight = (from: pos, to: pos, state: gameState): boolean => {
    const fromField = pieceAt(state, from)
    const toField = pieceAt(state, to)
    if (!fromField || !toField || fromField.team === null) {
        return false
    }

    const rowDiff = Math.abs(to.row - from.row)
    const colDiff = Math.abs(to.col - from.col)

    return ((rowDiff === 1 && colDiff === 2) || (rowDiff === 2 && colDiff === 1))
        && toField.team !== fromField.team
}

const bishop = (from: pos, to: pos, state: gameState) => {
    const fromField = pieceAt(state, from)
    const toField = pieceAt(state, to)

    if (!fromField || !toField || fromField.team === null) {
        return false
    }

    return isDiagonalPathClear(from, to, state) && toField.team !== fromField.team
}

const rook = (from: pos, to: pos, state: gameState) => {
    const fromField = pieceAt(state, from)
    const toField = pieceAt(state, to)

    if (!fromField || !toField || fromField.team === null || (from.row === to.row && from.col === to.col)) {
        return false
    }

    return isStraightPathClear(from, to, state) && toField.team !== fromField.team
}

const queen = (from: pos, to: pos, state: gameState) => rook(from, to, state) || bishop(from, to, state)

const king = (from: pos, to: pos, state: gameState) => {
    const fromField = pieceAt(state, from)
    const toField = pieceAt(state, to)

    if (!fromField || !toField || fromField.team === null) {
        return false
    }

    const colLength = Math.abs(to.col - from.col)
    const rowLength = Math.abs(to.row - from.row)

    return rowLength <= 1 && colLength <= 1 && (rowLength !== 0 || colLength !== 0) && toField.team !== fromField.team
}

export { pawn, king, knight, bishop, queen, rook, pawnAttack }
