import * as fs from 'fs';
import { chess } from '../../game/game';
import { testUtil } from './testUtil';

const loadTestCase = (num: number): chess.gameState => {    
    const data: string = fs.readFileSync(`${process.cwd()}/test/data/case${num}.json`, 'utf8');  
    const sb: testUtil.simpleBoard = JSON.parse(data)
    return testUtil.createTestGame(sb);
}

export { loadTestCase }