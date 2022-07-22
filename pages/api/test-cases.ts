import type { NextApiRequest, NextApiResponse } from "next";

import { loadAllTestCasesList } from "../../test/utils/fileLoader"

export default (req: NextApiRequest, res: NextApiResponse<string[]>) => {
  res.status(200).json(loadAllTestCasesList())
}
