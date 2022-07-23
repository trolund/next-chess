import { gameState, piece, team } from "../game/types/game-types"

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

    // function max_value(state: gameState, depth=3) {
    //     if (terminal_test(state) || depth == 0) {
    //         return self.eval_max_dif(state)
    //     }
    //     let v = -Infinity
    //     for action in self.actions(state):
    //         newState = self.result(state, action)
    //         if newState.human_turn:  # spiller 1
    //             v = max(v, self.min_value(newState, depth - 1))
    //         else:
    //             v = max(v, self.max_value(newState, depth - 1))
    //     return v
    // }

    // function min_value(self, state: State, depth=3):
    // if self.terminal_test(state) or depth == 0:
    //     return self.eval_max_dif(state)
    // let v = Infinity
    // for action in self.actions(state):
    //     newState = self.result(state, action)
    //     if state.human_turn:
    //         v = min(v, self.max_value(newState, depth - 1))
    //     else:
    //         v = min(v, self.min_value(newState, depth - 1))
    // return v

}

function terminal_test(state: gameState): boolean {
    return false
}
