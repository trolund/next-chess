import type { NextApiRequest, NextApiResponse } from "next";
import { gameState, testCase } from "../../../game/types/game-types";

import { loadTestCase, loadTestCaseWithName } from "../../../test/utils/fileLoader"

export default (req: NextApiRequest, res: NextApiResponse<gameState>) => {
  if(req.method === "GET"){
    const { num } = req.query
    try{
      let data;
      if(Number.isInteger(Number.parseInt(String(num)))){
        data = loadTestCase(Number(num))
      }else {
        if(num.includes(".json")){ 
          data = loadTestCaseWithName(`${num}`)
        }else{
          data = loadTestCaseWithName(`${num}.json`)
        }
      }      

      if(!data){
        res.status(404)
      } else {
        res.status(200).json(data)
      }
    }catch(_){
      res.status(500)
    }
  }
  res.status(405)
}

