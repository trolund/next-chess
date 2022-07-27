import { useEffect, useState } from "react"
import { piece, team } from "../game/types/game-types"

interface HomeProps {
    isOpen?: boolean,
    setSelected: (t: piece) => void
    setIsOpen: (b: boolean) => void 
}

const options = ["rook", "bishop", "queen", "knight"]
  
function TransformationModal({isOpen, setIsOpen, setSelected: set}: HomeProps): JSX.Element {

    const [selected, setSelected] = useState<piece | null>(null)
  
    const caseSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelected(event.target.value as piece)
    }

    const onClick = () => {
        set(selected)
        setIsOpen(false)
    }

    useEffect(() => {
      setSelected(null)
    }, [isOpen])
    
    return (
    <>
      {isOpen && <div>
        <h2>Options</h2>
        <select name="cases" id="cases" onChange={caseSelect} value={String(selected ?? "empty")}>
                <option key={"empty"} value={"empty"}> - Select piece type - </option>
                {options.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={onClick}>Accept</button>
      </div>}
    </>
    )
}
  
  export default TransformationModal