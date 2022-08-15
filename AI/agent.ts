import { chess } from "../game/game";
import { action, AIRes, gameState, piece } from "../game/types/game-types";

export abstract class Agent {

    evaluate(state: gameState): number { return 0 }
    public abstract FindMove(state: gameState): action
    abstract getActions(state: gameState): action[]
    abstract terminalTest(state: gameState): boolean

}

export class MinmaxAgent extends Agent {

    private depth: number = 3

    constructor(depth: number = 3) {
        super()
        this.depth = depth
    }

    public FindMove(state: gameState): action {
        return this.miniMax(state, this.depth)
    }

    evaluate(state: gameState): number {
        return state.board.reduce((acc, row) => {
            const rowAcc = row.reduce((rowAcc, f) => {
                if(f.team === state.turn && f.piece !== null){
                    return rowAcc + this.pointMapper(f.piece)
                }
                return rowAcc
            }, 0)
            return acc + rowAcc;
         }, 0);
    }

    pointMapper(piece: piece): number {
        switch(piece){
            case "king": 
                return 5
            case "bishop": 
                return 3
            case "knight": 
                return 4
            case "pawn": 
                return 2
            case "queen": 
                return 8
            case "rook": 
                return 3
            default:
                return 0
        }
    }

    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    miniMax(state: gameState, depth: number = 3): action {
        const utilities: AIRes[] = []

        for (const action of this.getActions(state)) {
            const newState = chess.move(action.from, action.to, state)

            if(newState.turn === "white") {
                utilities.push({ score: this.minValue(newState, depth), action})
            }else {
                utilities.push({ score: this.maxValue(newState, depth), action})
            }
        }

        let finalAction: AIRes;

        if (state.turn === "white"){
            const mapped = utilities.map(x => x.score)
            const max = Math.min(...mapped)
            const index = mapped.indexOf(max)
            finalAction = utilities[index]
        }else {
            const mapped = utilities.map(x => x.score)
            const max = Math.max(...mapped)
            const index = mapped.indexOf(max)
            finalAction = utilities[index]
        }
        
        return finalAction.action
    }

    maxValue(state: gameState, depth: number = 3) {

        if (this.terminalTest(state) || depth == 0) {
            return this.evaluate(state)
        }

        let v = -Infinity

        for (const a of this.getActions(state)) {
            const newState = chess.move(a.from, a.to, state)

            if (newState.turn === "white"){ // human turn
                v = Math.max(v, this.minValue(newState, depth - 1))
            }else {
                v = Math.max(v, this.maxValue(newState, depth - 1))
            }
            
        }
        return v        
    }

    minValue(state: gameState, depth: number = 3) {

        if (this.terminalTest(state) || depth == 0) {
            return this.evaluate(state)
        }

        let v = Infinity

        for (const a of this.getActions(state)) {
            const newState = chess.move(a.from, a.to, state)

            if (newState.turn === "white"){ // human turn
                v = Math.max(v, this.maxValue(newState, depth - 1))
            }else {
                v = Math.max(v, this.minValue(newState, depth - 1))
            }
            
        }
        return v        
    }

    terminalTest(state: gameState): boolean {
        return chess.checkmate(state)
    }

}