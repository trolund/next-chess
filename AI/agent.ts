import { action, AIRes, gameState, piece } from "../game/types/game-types";

export abstract class Agent {

    evaluate(state: gameState): number { return 0 }
    public abstract FindMove(state: gameState): action
    abstract getActions(state: gameState): action[]
    abstract terminalTest(state: gameState): boolean

}