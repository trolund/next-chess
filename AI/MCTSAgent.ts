import { chess } from "../game/game"
import { action, gameState, moveOptions, team } from "../game/types/game-types"
import { Agent } from "./agent"
import { createYieldController } from "./search-utils"

type Node = {
    action: action | null
    state: gameState
    parent: Node | null
    children: Node[]
    untriedActions: action[]
    visits: number
    value: number
}

/// <summary>
/// A lightweight Monte-Carlo Tree Search agent for browser play
/// </summary>
export class MCTSAgent extends Agent {
    private depth: number = 2
    private team: team = "white"
    private defaultMoveTransform: moveOptions = { transformation: "queen" }

    constructor(depth: number = 2, team: team = "white") {
        super()
        this.depth = depth
        this.team = team
    }

    public FindMove(state: gameState): action {
        const root = this.createNode(state, null, null)
        const simulations = this.simulationBudget()

        if (root.untriedActions.length === 0) {
            throw new Error("No legal moves available for " + state.turn)
        }

        for (let i = 0; i < simulations; i++) {
            let node = this.select(root)
            if (!this.terminalTest(node.state) && node.untriedActions.length > 0) {
                node = this.expand(node)
            }
            const result = this.simulate(node.state)
            this.backpropagate(node, result)
        }

        const bestChild = [...root.children].sort((left, right) => right.visits - left.visits)[0]
        if (!bestChild?.action) {
            return root.untriedActions[0]
        }

        return bestChild.action
    }

    public async FindMoveAsync(state: gameState): Promise<action> {
        const root = this.createNode(state, null, null)
        const simulations = this.simulationBudget()
        const yieldController = createYieldController(50)

        if (root.untriedActions.length === 0) {
            throw new Error("No legal moves available for " + state.turn)
        }

        for (let i = 0; i < simulations; i++) {
            await yieldController.maybeYield()
            let node = this.select(root)
            if (!this.terminalTest(node.state) && node.untriedActions.length > 0) {
                node = this.expand(node)
            }
            const result = this.simulate(node.state)
            this.backpropagate(node, result)
        }

        const bestChild = [...root.children].sort((left, right) => right.visits - left.visits)[0]
        if (!bestChild?.action) {
            return root.untriedActions[0]
        }

        return bestChild.action
    }

    evaluate(state: gameState): number {
        if (state.winner === this.team) {
            return 1
        }
        if (state.winner && state.winner !== this.team) {
            return 0
        }
        if (state.ended) {
            return 0.5
        }
        return 0.5
    }

    getActions(state: gameState): action[] {
        return chess.allValidMoves(state)
    }

    terminalTest(state: gameState): boolean {
        return chess.gameEnded(state) || state.ended
    }

    private createNode(state: gameState, action: action | null, parent: Node | null): Node {
        return {
            action,
            state,
            parent,
            children: [],
            untriedActions: this.getActions(state),
            visits: 0,
            value: 0
        }
    }

    private select(node: Node): Node {
        let current = node
        while (current.untriedActions.length === 0 && current.children.length > 0 && !this.terminalTest(current.state)) {
            current = this.bestUCTChild(current)
        }
        return current
    }

    private expand(node: Node): Node {
        const action = node.untriedActions.pop()
        if (!action) {
            return node
        }

        const nextState = chess.move(action.from, action.to, node.state, this.defaultMoveTransform)
        const child = this.createNode(nextState, action, node)
        node.children.push(child)
        return child
    }

    private simulate(initialState: gameState): number {
        let state = initialState
        let steps = 0
        const maxSteps = 12

        while (!this.terminalTest(state) && steps < maxSteps) {
            const actions = this.getActions(state)
            if (actions.length === 0) {
                break
            }

            const action = this.pickPlayoutAction(actions, state)
            state = chess.move(action.from, action.to, state, this.defaultMoveTransform)
            steps += 1
        }

        if (!this.terminalTest(state)) {
            return 0.5
        }

        return this.evaluate(state)
    }

    private backpropagate(node: Node, result: number) {
        let current: Node | null = node
        while (current) {
            current.visits += 1
            current.value += result
            current = current.parent
        }
    }

    private bestUCTChild(node: Node): Node {
        const exploration = Math.SQRT2
        return [...node.children].sort((left, right) =>
            this.uctScore(right, node.visits, exploration) - this.uctScore(left, node.visits, exploration)
        )[0]
    }

    private uctScore(node: Node, parentVisits: number, exploration: number): number {
        if (node.visits === 0) {
            return Infinity
        }

        return (node.value / node.visits) + exploration * Math.sqrt(Math.log(parentVisits) / node.visits)
    }

    private pickPlayoutAction(actions: action[], state: gameState): action {
        const tactical = actions.find(candidate => {
            const to = chess.toPosSafe(candidate.to)
            return chess.getFieldAtPos(to, state).piece !== null
        })

        if (tactical) {
            return tactical
        }

        return actions[Math.floor(Math.random() * actions.length)]
    }

    private simulationBudget(): number {
        return this.depth * 16
    }
}
