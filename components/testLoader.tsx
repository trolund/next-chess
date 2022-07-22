import { Dispatch, FunctionComponent, SetStateAction, useEffect, useState } from "react"
import { gameState } from "../game/types/game-types";
import { emptyBoard } from "../stores/emptyBoard";
import { testUtil } from "../test/utils/testUtil";

interface TestLoader {
    setGameState: Dispatch<SetStateAction<gameState>>
}

const TestLoader: FunctionComponent<TestLoader> = ({ setGameState }) => {

    const [cases, setCases] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/test-cases')
        .then(data => data.json())
        .then(json => setCases(json))
    }, [])

    const caseSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(event.target.value);   
        fetch(`/api/load-case/${event.target.value}`)
        .then(data => data.json())
        .then(json => setGameState(json))
    }

    return (
        <div style={{position: "fixed", right: "1rem", top: "1rem", background: "#FFFFFF00"}}>
          <select name="cases" id="cases" onChange={caseSelect}>
            {cases.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
    );
}

export default TestLoader