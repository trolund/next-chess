import type { NextApiRequest, NextApiResponse } from "next";

import { loadAllTestCasesList } from "../../test/utils/fileLoader"

export default (_: NextApiRequest, res: NextApiResponse<string[]>) => {
  let data = loadAllTestCasesList()
  data = data.filter(c => c !== "empty.json")
  data.unshift("empty.json") // alwayes first
  res.status(200).json(data)
}
