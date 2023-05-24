import { chess } from "../game/game"
import { action, AIRes, gameState, moveOptions, piece, team } from "../game/types/game-types"
import { Agent } from "./agent"

/// <summary>
/// An agent that uses the minmax algorithm to find the best move
/// </summary>
export class MinmaxAgent extends Agent {

    private depth: number = 3
    private team: team = "white"

    constructor(depth: number = 3, team: team = "white") {
        super()
        this.depth = depth
        this.team = team
    }

    private defaultMoveTransform: moveOptions = {transformation: "queen"}

    public FindMove(state: gameState): action {
        return this.miniMax(state, this.depth)
    }
    /// <summary>
    /// Evaluates the state of the game
    /// </summary>    
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
    // function that maps the pieces to a point value
    pointMapper(piece: piece): number {
        switch (piece) {
            case "pawn":
                return 1
            case "rook":
                return 5
            case "knight":
                return 3
            case "bishop":
                return 3
            case "queen":
                return 9
            case "king":
                return 100
            default:
                return 0
        }
    }

    /// <summary>
    /// Gets all the possible actions for the agent
    /// </summary>
    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    /// <summary>
    /// Finds the best move for the agent
    /// </summary>
    miniMax(state: gameState, depth: number = 3): action {
        const utilities: AIRes[] = []

        // for each action in the state
        for (const action of this.getActions(state)) {
            try{
                // make a new state with the action
                const newState = chess.move(action.from, action.to, state, this.defaultMoveTransform)
                
                // if it's the other players turn, find the min value otherwise find the max value
                if(newState.turn !== this.team) {
                    utilities.push({ score: this.minValue(newState, depth), action})
                }else {
                    utilities.push({ score: this.maxValue(newState, depth), action})
                }
            }catch (e) {
                throw new Error("error in minmax: " + e)             
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

        if (finalAction === undefined) {
            debugger
            throw new Error("final action is undefined")
        }
        
        return finalAction.action
    }

    /// <summary>
    /// Finds the max value of the state
    /// </summary>
    maxValue(state: gameState, depth: number = 3) {

        if (this.terminalTest(state) || depth == 0) {
            return this.evaluate(state)
        }

        let v = -Infinity

        for (const a of this.getActions(state)) {
            const newState = chess.move(a.from, a.to, state, this.defaultMoveTransform)

            if (newState.turn !== this.team){ // human turn
                v = Math.max(v, this.minValue(newState, depth - 1))
            }else {
                v = Math.max(v, this.maxValue(newState, depth - 1))
            }
            
        }
        return v        
    }

    /// <summary>
    /// Finds the min value of the state
    /// </summary>
    minValue(state: gameState, depth: number = 3) {

        if (this.terminalTest(state) || depth == 0) {
            return this.evaluate(state)
        }

        let v = Infinity

        for (const a of this.getActions(state)) {
            const newState = chess.move(a.from, a.to, state, this.defaultMoveTransform)

            if (newState.turn === "white"){ // human turn
                v = Math.max(v, this.maxValue(newState, depth - 1))
            }else {
                v = Math.max(v, this.minValue(newState, depth - 1))
            }
            
        }
        return v        
    }

    /// <summary>
    /// Checks if the state is a terminal state
    /// </summary>
    terminalTest(state: gameState): boolean {
        return chess.checkmate(state)
    }

}