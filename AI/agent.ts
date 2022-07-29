import { chess } from "../game/game";
import { action, AIRes, gameState, piece, team } from "../game/types/game-types"

export module agent {

    function evaluate(state: gameState, playerTeam: team): number {
        return state.board.reduce((acc, row) => {
            const rowAcc = row.reduce((rowAcc, f) => {
                if(f.team === playerTeam && f.piece !== null){
                    return rowAcc + pointMapper(f.piece)
                }
                return rowAcc
            }, 0)
            return acc + rowAcc;
         }, 0);
    }

    function pointMapper(piece: piece): number {
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

    function getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    export function miniMax(state: gameState, depth: number = 3): action {
        const utilities: AIRes[] = []

        for (const action of getActions(state)) {
            const newState = chess.move(action.from, action.to, state)

            if(newState.turn === "white") {
                utilities.push({ score: minValue(newState, depth), action})
            }else {
                utilities.push({ score: maxValue(newState, depth), action})
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

    function maxValue(state: gameState, depth: number = 3) {

        if (terminalTest(state) || depth == 0) {
            return evaluate(state, state.turn)
        }

        let v = -Infinity

        for (const a of getActions(state)) {
            const newState = chess.move(a.from, a.to, state)

            if (newState.turn === "white"){ // human turn
                v = Math.max(v, minValue(newState, depth - 1))
            }else {
                v = Math.max(v, maxValue(newState, depth - 1))
            }
            
        }
        return v        
    }

    function minValue(state: gameState, depth: number = 3) {

        if (terminalTest(state) || depth == 0) {
            return evaluate(state, state.turn)
        }

        let v = Infinity

        for (const a of getActions(state)) {
            const newState = chess.move(a.from, a.to, state)

            if (newState.turn === "white"){ // human turn
                v = Math.max(v, maxValue(newState, depth - 1))
            }else {
                v = Math.max(v, minValue(newState, depth - 1))
            }
            
        }
        return v        
    }

}

function terminalTest(state: gameState): boolean {
    return chess.checkmate(state)
}
