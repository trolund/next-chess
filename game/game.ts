import { colOptions } from "./col-options"
import { bishop, king, knight, pawn, pawnAttack, queen, rook } from "./move-validator"
import { action, board, castlingRights, chessPos, field, gameResult, gameState, moveOptions, piece, pos, team } from './types/game-types';
import _ from "lodash"

export module chess {

    const defaultCastlingRights = (): castlingRights => ({
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
    })

    const clonePos = (input: pos | null | undefined): pos | null => input ? { row: input.row, col: input.col } : null

    const samePos = (a?: pos | null, b?: pos | null): boolean => !!a && !!b && a.row === b.row && a.col === b.col

    const inBounds = (position: pos) => position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8

    const opponent = (turn: team): team => turn === "white" ? "black" : "white"

    const backLineWhite: piece[] = ["rook", "knight", "bishop", "king", "queen", "bishop", "knight", "rook"]
    const backLineBlack: piece[] = [...backLineWhite].reverse()

    // formatting debug
    const formatPos = (pos: pos): string => `${notation(pos)} - (${pos.row}, ${pos.col})`

    // get color of board
    export const getBoardColor = (row: number, col: number): team => (row + col) % 2 == 0 ? "white" : "black"

    const createNewBoard = (): board => {
        const getPiece = (row: number, col: number): field => {
            const pos: pos = { row, col };

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

        for (let row = 0; row < 8; row++) {
            board[row] = []

            for (let col = 0; col < 8; col++) {
                board[row][col] = getPiece(row, col)
            }
        }

        return board
    }

    const getKing = (state: gameState, targetTeam: team): field | undefined =>
        state.board.flat().find(f => f.piece === "king" && f.team === targetTeam)

    const hasRelevantEnPassantTarget = (state: gameState): boolean => {
        const target = state.enPassantTarget

        if (!target) {
            return false
        }

        const pawnRow = state.turn === "white" ? target.row + 1 : target.row - 1
        if (!inBounds({ row: pawnRow, col: target.col })) {
            return false
        }

        const pawnField = state.board[pawnRow][target.col]
        if (pawnField.piece !== "pawn" || pawnField.team !== opponent(state.turn)) {
            return false
        }

        return [-1, 1].some(offset => {
            const candidate: pos = { row: target.row, col: target.col + offset }
            if (!inBounds(candidate)) {
                return false
            }

            const adjacent = state.board[candidate.row][candidate.col]
            return adjacent.piece === "pawn" && adjacent.team === state.turn
        })
    }

    const serializePosition = (state: gameState): string => {
        const boardState = state.board
            .map(row => row.map(field => {
                if (!field.piece || !field.team) {
                    return "#"
                }

                const token = field.piece[0]
                const normalized = field.piece === "knight" ? "n" : token
                return field.team === "white" ? normalized.toLowerCase() : normalized.toUpperCase()
            }).join(""))
            .join("/")

        const rights = state.castlingRights ?? defaultCastlingRights()
        const castling = `${rights.white.kingSide ? "K" : ""}${rights.white.queenSide ? "Q" : ""}${rights.black.kingSide ? "k" : ""}${rights.black.queenSide ? "q" : ""}` || "-"
        const enPassant = hasRelevantEnPassantTarget(state) && state.enPassantTarget ? notation(state.enPassantTarget) : "-"
        return `${boardState}|${state.turn}|${castling}|${enPassant}`
    }

    const countOccurrences = (history: string[], target: string): number => history.filter(entry => entry === target).length

    const getDrawReason = (state: gameState): gameResult => {
        if (stalemate(state)) {
            return "stalemate"
        }

        if (insufficientMaterial(state)) {
            return "insufficient-material"
        }

        if ((state.halfMoveClock ?? 0) >= 100) {
            return "fifty-move-rule"
        }

        const currentPosition = serializePosition(state)
        if (countOccurrences(state.positionHistory ?? [], currentPosition) >= 3) {
            return "threefold-repetition"
        }

        return null
    }

    const isMinorPiece = (piece: piece) => piece === "bishop" || piece === "knight"

    const canTransform = (fromField: field, to: pos) =>
        fromField.piece === "pawn" && ((fromField.team === "black" && to.row === 7) || (fromField.team === "white" && to.row === 0))

    const isCastleMove = (from: pos, to: pos, state: gameState): boolean => {
        const fromField = getFieldAtPos(from, state)
        return fromField.piece === "king" && from.row === to.row && Math.abs(to.col - from.col) === 2
    }

    const getCastleRookMove = (from: pos, to: pos) => {
        if (to.col > from.col) {
            return {
                rookFrom: { row: from.row, col: 7 },
                rookTo: { row: from.row, col: 5 }
            }
        }

        return {
            rookFrom: { row: from.row, col: 0 },
            rookTo: { row: from.row, col: 3 }
        }
    }

    const updateCastlingRights = (state: gameState, from: pos, to: pos, moved: field, captured: field | null) => {
        if (!state.castlingRights || moved.team === null) {
            return
        }

        if (moved.piece === "king") {
            state.castlingRights[moved.team].kingSide = false
            state.castlingRights[moved.team].queenSide = false
        }

        if (moved.piece === "rook") {
            if (moved.team === "white" && from.row === 7 && from.col === 7) state.castlingRights.white.kingSide = false
            if (moved.team === "white" && from.row === 7 && from.col === 0) state.castlingRights.white.queenSide = false
            if (moved.team === "black" && from.row === 0 && from.col === 7) state.castlingRights.black.kingSide = false
            if (moved.team === "black" && from.row === 0 && from.col === 0) state.castlingRights.black.queenSide = false
        }

        if (captured?.piece === "rook" && captured.team !== null) {
            if (captured.team === "white" && to.row === 7 && to.col === 7) state.castlingRights.white.kingSide = false
            if (captured.team === "white" && to.row === 7 && to.col === 0) state.castlingRights.white.queenSide = false
            if (captured.team === "black" && to.row === 0 && to.col === 7) state.castlingRights.black.kingSide = false
            if (captured.team === "black" && to.row === 0 && to.col === 0) state.castlingRights.black.queenSide = false
        }
    }

    const pseudoMove = (from: pos, to: pos, state: gameState, attack: boolean = false): boolean => {
        if (!inBounds(from) || !inBounds(to) || samePos(from, to)) {
            return false
        }

        const pieceField = state.board[from.row]?.[from.col]
        const pieceType = pieceField?.piece

        if (!pieceField || pieceField.team !== state.turn) {
            return false
        }

        if (pieceType === "pawn") {
            return attack ? pawnAttack(from, to, state, true) : pawn(from, to, state)
        }

        if (pieceType === "bishop") {
            return bishop(from, to, state)
        }

        if (pieceType === "knight") {
            return knight(from, to, state)
        }

        if (pieceType === "rook") {
            return rook(from, to, state)
        }

        if (pieceType === "queen") {
            return queen(from, to, state)
        }

        if (pieceType === "king") {
            if (king(from, to, state)) {
                return true
            }

            return !attack && canCastle(state, from, to)
        }

        return false
    }

    const isSquareUnderAttackByTeam = (state: gameState, target: pos, attackingTeam: team): boolean => {
        if (attackingTeam === null) {
            return false
        }

        const attackState = { ...state, turn: attackingTeam }

        return attackState.board.some(row => row.some(f =>
            f.team === attackingTeam && pseudoMove(f.pos, target, attackState, true)
        ))
    }

    const canCastle = (state: gameState, from: pos, to: pos): boolean => {
        const kingField = getFieldAtPos(from, state)

        if (kingField.piece !== "king" || kingField.team === null || from.row !== to.row || Math.abs(to.col - from.col) !== 2) {
            return false
        }

        const rights = state.castlingRights ?? defaultCastlingRights()
        const side = to.col > from.col ? "kingSide" : "queenSide"
        if (!rights[kingField.team][side]) {
            return false
        }

        const { rookFrom } = getCastleRookMove(from, to)
        const rookField = getFieldAtPos(rookFrom, state)
        if (rookField.piece !== "rook" || rookField.team !== kingField.team) {
            return false
        }

        const step = to.col > from.col ? 1 : -1
        for (let col = from.col + step; col !== rookFrom.col; col += step) {
            if (state.board[from.row][col].piece !== null) {
                return false
            }
        }

        const enemyTeam = opponent(kingField.team)
        const pathSquares = [
            from,
            { row: from.row, col: from.col + step },
            to
        ]

        return pathSquares.every(square => !isSquareUnderAttackByTeam(state, square, enemyTeam))
    }

    const moveWithoutValidation = (prevState: gameState, fromPos: pos, toPos: pos, moveOptions?: moveOptions, finalizeMove: boolean = true): gameState => {
        const newState = _.cloneDeep(prevState)
        newState.castlingRights = _.cloneDeep(prevState.castlingRights ?? defaultCastlingRights())
        newState.enPassantTarget = null
        newState.lastMove = { from: fromPos, to: toPos }
        newState.winner = null
        newState.result = null
        newState.positionHistory = [...(prevState.positionHistory ?? [])]
        newState.halfMoveClock = prevState.halfMoveClock ?? 0

        const from = newState.board[fromPos.row][fromPos.col]
        const to = newState.board[toPos.row][toPos.col]

        if (from.piece === null || from.team === null) throw new Error("There is no piece to move on position " + formatPos(fromPos))

        const capturedField = to.piece !== null ? _.cloneDeep(to) : null
        let enPassantCapture: field | null = null

        if (from.piece === "pawn" && prevState.enPassantTarget && samePos(prevState.enPassantTarget, toPos) && to.piece === null) {
            const capturePos = { row: fromPos.row, col: toPos.col }
            const capturedPawn = newState.board[capturePos.row][capturePos.col]
            if (capturedPawn.piece === "pawn" && capturedPawn.team === opponent(from.team)) {
                enPassantCapture = _.cloneDeep(capturedPawn)
                newState.board[capturePos.row][capturePos.col].piece = null
                newState.board[capturePos.row][capturePos.col].team = null
            }
        }

        updateCastlingRights(newState, fromPos, toPos, _.cloneDeep(from), capturedField ?? enPassantCapture)

        if (capturedField) {
            newState.piecesTaken.push(capturedField)
        }

        if (enPassantCapture) {
            newState.piecesTaken.push(enPassantCapture)
        }

        const movedTeam = from.team
        const movedPiece = from.piece

        newState.board[fromPos.row][fromPos.col].team = null
        newState.board[fromPos.row][fromPos.col].piece = null

        newState.board[toPos.row][toPos.col].team = movedTeam
        newState.board[toPos.row][toPos.col].piece = movedPiece

        if (movedPiece === "king" && isCastleMove(fromPos, toPos, prevState)) {
            const { rookFrom, rookTo } = getCastleRookMove(fromPos, toPos)
            const rookField = _.cloneDeep(newState.board[rookFrom.row][rookFrom.col])
            newState.board[rookFrom.row][rookFrom.col].team = null
            newState.board[rookFrom.row][rookFrom.col].piece = null
            newState.board[rookTo.row][rookTo.col].team = rookField.team
            newState.board[rookTo.row][rookTo.col].piece = rookField.piece
        }

        if (canTransform(newState.board[toPos.row][toPos.col], toPos)) {
            if (!moveOptions?.transformation) {
                throw new Error("The move most include what type of pice the should transform into")
            }

            if (moveOptions.transformation === "king" || moveOptions.transformation === "pawn" || moveOptions.transformation === null) {
                throw new Error("Player cannot transform a pawn into " + moveOptions.transformation)
            }

            newState.board[toPos.row][toPos.col].piece = moveOptions.transformation
        }

        if (movedPiece === "pawn" && Math.abs(toPos.row - fromPos.row) === 2) {
            newState.enPassantTarget = { row: (toPos.row + fromPos.row) / 2, col: fromPos.col }
        }

        newState.halfMoveClock = (movedPiece === "pawn" || capturedField !== null || enPassantCapture !== null)
            ? 0
            : (prevState.halfMoveClock ?? 0) + 1

        newState.turn = opponent(prevState.turn)
        newState.positionHistory.push(serializePosition(newState))

        if (finalizeMove) {
            const whiteKing = getKing(newState, "white")
            const blackKing = getKing(newState, "black")

            if (whiteKing && blackKing) {
                newState.ended = gameEnded(newState)
                newState.winner = checkmate(newState) ? opponent(newState.turn) : null
                newState.result = newState.winner ? "checkmate" : getDrawReason(newState)
            } else {
                newState.ended = false
                newState.winner = null
                newState.result = null
            }
        } else {
            newState.ended = false
            newState.winner = null
            newState.result = null
        }

        return newState
    }

    const leavesOwnKingInCheck = (state: gameState, from: pos, to: pos, moveOptions?: moveOptions): boolean => {
        const currentKing = getKing(state, state.turn)
        if (!currentKing) {
            return false
        }

        try {
            const simulated = moveWithoutValidation(state, from, to, moveOptions, false)
            const simulatedKing = getKing(simulated, state.turn)
            if (!simulatedKing) {
                return true
            }

            return isSquareUnderAttackByTeam(simulated, simulatedKing.pos, opponent(state.turn))
        } catch (_error) {
            return true
        }
    }

    export const createGame = (): gameState => {
        const state: gameState = {
            board: createNewBoard(),
            piecesTaken: [],
            turn: "white",
            ended: false,
            castlingRights: defaultCastlingRights(),
            enPassantTarget: null,
            lastMove: null,
            winner: null,
            halfMoveClock: 0,
            positionHistory: [],
            result: null
        }

        state.positionHistory = [serializePosition(state)]
        return state
    }

    export const rotateBoard = (state: gameState): gameState => {
        return {
            ...state,
            board: state.board.map(row => row.reverse()).reverse(),
        }
    }

    export const move = (fpos: pos | chessPos, tpos: pos | chessPos, prevState: gameState, moveOptions?: moveOptions): gameState => {
        const fromPos: pos = chess.toPosSafe(fpos)
        const toPos: pos = chess.toPosSafe(tpos)

        if (!isValidMove(fromPos, toPos, prevState, false, moveOptions)) {
            throw new Error("Invalid move")
        }

        return moveWithoutValidation(prevState, fromPos, toPos, moveOptions)
    }

    export function allValidMovesAsPos(state: gameState, attack: boolean = false, checkValidity: boolean = true) {
        return onlyToPos(actionsCleanUp(allValidMoves(state, attack, checkValidity)))
    }

    export const allValidMoves = (state: gameState, attack: boolean = false, checkValidity: boolean = true): action[] => {
        const validMoves: action[] = []

        for (const row of state.board) {
            for (const field of row) {
                if (field.team === state.turn) {
                    const movesFromField = validMovesFrom(field.pos, state, attack, checkValidity)
                    movesFromField.forEach(m => validMoves.push({ from: field.pos, to: m }))
                }
            }
        }

        return validMoves
    }

    export const validMovesFrom = (fromPos: pos | string, state: gameState, attack: boolean = false, checkValidity: boolean = true): pos[] => {
        if (!fromPos || !state) {
            return []
        }

        const parsed = typeof fromPos === "string" ? toPos(fromPos) : fromPos
        const validMoves: pos[] = []

        state.board.forEach((row, rowIndex) => {
            row.forEach((_field, colIndex) => {
                const target: pos = { row: rowIndex, col: colIndex }
                if (isValidMove(parsed, target, state, attack, { checkValidity })) {
                    validMoves.push(target)
                }
            })
        })

        return validMoves
    }

    export const allReachableMoves = (state: gameState): action[] => {
        const validMoves: action[] = []

        for (const row of state.board) {
            for (const field of row) {
                if (field.team === state.turn) {
                    reachableFrom(field.pos, state).forEach(m => validMoves.push({ from: field.pos, to: m }))
                }
            }
        }

        return validMoves
    }

    export const reachableFrom = (from: pos | string, state: gameState): pos[] => {
        if (!from || !state) {
            return []
        }

        const parsed = typeof from === "string" ? toPos(from) : from
        const validMoves: pos[] = []

        state.board.forEach((row, rowIndex) => {
            row.forEach((_field, colIndex) => {
                const target: pos = { row: rowIndex, col: colIndex }
                if (pseudoMove(parsed, target, state, true)) {
                    validMoves.push(target)
                }
            })
        })

        return validMoves
    }

    export const getFieldAtPos = (pos: pos | chessPos, state: gameState): field => {
        if (typeof pos === "string") {
            pos = toPos(pos)
        }

        return state.board[pos.row][pos.col]
    }

    export const isValidMove = (from: pos, to: pos, state: gameState, attack: boolean = false, moveOptions?: moveOptions): boolean => {
        if (!pseudoMove(from, to, state, attack)) {
            return false
        }

        if (attack || moveOptions?.checkValidity === false) {
            return true
        }

        return !leavesOwnKingInCheck(state, from, to, moveOptions)
    }

    export const notation = (pos: pos): string | chessPos => `${colOptions[pos.col]}${8 - pos.row}`

    export const positionKey = (state: gameState): string => serializePosition(state)

    export const actionsCleanUp = (actions: action[]): action[] =>
        actions.map(a => ({ from: typeof a.from !== "string" ? notation(a.from) : a.from, to: typeof a.to !== "string" ? notation(a.to) : a.to } as action))

    export const onlyToPos = (actions: action[]): (pos | chessPos)[] => actions.map(a => a.to)

    export const notationComponents = (pos: pos): { number: number, char: string } => {
        return { number: 8 - pos.row, char: colOptions[pos.col] }
    }

    export const toPosSafe = (input: string | chessPos | pos) => typeof input === "string" ? toPos(input) : input

    export const toPos = (input: string): pos => {
        const normalized = input?.toUpperCase?.() ?? ""
        const row: number = Number.parseInt(normalized[1])
        const col: string = normalized[0]

        if (normalized.length !== 2
            || Number.isNaN(row)
            || typeof col !== 'string'
            || !colOptions.includes(String(col))
            || colOptions.indexOf(col) === -1
            || row < 1
            || row > 8) {
            throw "Input not correct notation : " + col + row
        }

        return { col: colOptions.indexOf(col), row: 8 - row } as pos
    }

    const changeTeam = (turn: team): team => turn === "white" ? "black" : "white"

    export function gameEnded(state: gameState): boolean {
        return checkmate(state) || getDrawReason(state) !== null
    }

    export function stalemate(state: gameState): boolean {
        return !check(state) && allValidMoves(state).length === 0
    }

    export function checkmate(state: gameState): boolean {
        return check(state) && allValidMoves(state).length === 0
    }

    export function insufficientMaterial(state: gameState): boolean {
        const activePieces = state.board.flat().filter(field => field.piece !== null)
        const nonKingPieces = activePieces.filter(field => field.piece !== "king")

        if (nonKingPieces.length === 0) {
            return true
        }

        if (nonKingPieces.length === 1) {
            return isMinorPiece(nonKingPieces[0].piece)
        }

        if (nonKingPieces.length === 2 && nonKingPieces.every(field => field.piece === "bishop")) {
            return nonKingPieces[0].color === nonKingPieces[1].color
        }

        return false
    }

    export function threefoldRepetition(state: gameState): boolean {
        const currentPosition = serializePosition(state)
        return countOccurrences(state.positionHistory ?? [], currentPosition) >= 3
    }

    export function fiftyMoveRule(state: gameState): boolean {
        return (state.halfMoveClock ?? 0) >= 100
    }

    export function isUnderAttack(state: gameState, position: pos): boolean {
        return isSquareUnderAttackByTeam(state, position, opponent(state.turn))
    }

    export function comparePos(a: pos | chessPos, b: pos | chessPos): boolean {
        const left = toPosSafe(a)
        const right = toPosSafe(b)
        return left.row === right.row && left.col === right.col
    }

    export function check(state: gameState): boolean {
        const kingField = getKing(state, state.turn)

        if (!kingField) {
            throw new Error("No king found")
        }

        return isSquareUnderAttackByTeam(state, kingField.pos, opponent(state.turn))
    }

    export function isWhite(state: gameState): boolean {
        return state.turn === "white"
    }
}
