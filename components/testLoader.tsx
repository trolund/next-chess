import { Dispatch, FunctionComponent, SetStateAction, useEffect, useState } from "react"
import { gameState } from "../game/types/game-types"

interface TestLoader {
    setGameState: Dispatch<SetStateAction<gameState>>
}

const TestLoader: FunctionComponent<TestLoader> = ({ setGameState }) => {

    const [cases, setCases] = useState<string[]>([])
    const [selectedCase, setCase] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/test-cases')
        .then(data => data.json())
        .then(json => setCases(json))
    }, [])

    const caseSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(event.target.value);   
        fetch(`/api/load-case/${event.target.value}`)
        .then(data => data.json())
        .then(json => {
            setCase(event.target.value)
            setGameState(json)
        })
    }

    const reset = () => {
        if(selectedCase){
            console.log(selectedCase);
            fetch(`/api/load-case/${selectedCase}`)
            .then(data => data.json())
            .then(json => {
                setGameState(json)
                console.log("reset");
            })
        }
    }

    return (
        <div style={{position: "fixed", right: "1rem", top: "1rem", background: "#FFFFFF00"}}>
            <button onClick={reset}>Reset</button>
            <select name="cases" id="cases" onChange={caseSelect}>
                {cases.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
    );
}

export default TestLoader