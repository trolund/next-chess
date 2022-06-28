import * as fs from 'fs';;
import { gameState, simpleBoard, testCase } from '../../game/types/game-types';
import { testUtil } from './testUtil';

const testFolder = `${process.cwd()}/test/data/`;

const loadTestCase = (num: number): gameState => {    
    const data: string = fs.readFileSync(`${process.cwd()}/test/data/case${num}.json`, 'utf8');
    const c: testCase = JSON.parse(data) 
    return testUtil.createTestGame(c.board)
}

const loadAllTestCases = (): testCase[] => {
    const StringData = fs.readdirSync(testFolder)
    const data: testCase[] = StringData.map<testCase>(file => {
        try {
            const fileData: string = fs.readFileSync(`${process.cwd()}/test/data/${file}`, 'utf8');
            const result = JSON.parse(fileData)
            return result
          } catch (err: any) {
            console.log('Error: ', err.message)
          }
        })
    return data
}

export { loadTestCase, loadAllTestCases }