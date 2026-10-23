import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dailyPosition,limaDate,dailySelections} from '../lib/daily-verse.ts';
assert.equal(limaDate(new Date('2026-10-23T04:59:59Z')),'2026-10-22');assert.equal(limaDate(new Date('2026-10-23T05:00:00Z')),'2026-10-23');
assert.deepEqual(dailyPosition('2026-10-22'),dailyPosition('2026-10-22'));assert.notDeepEqual(dailyPosition('2026-10-22'),dailyPosition('2026-10-23'));
for(const [id,chapter,verse] of dailySelections){const book=JSON.parse(fs.readFileSync(new URL('../public/bible/'+id+'.json',import.meta.url),'utf8'));assert.ok(book[chapter]?.some(v=>v.verse===verse&&v.text),`${id} ${chapter}:${verse} must exist in bundled Bible`)}
const selected=new Set();for(let i=0;i<dailySelections.length;i++){const day=new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10);selected.add(JSON.stringify(dailyPosition(day)))}assert.equal(selected.size,dailySelections.length);
console.log('PASS: all curated references exist, stable daily reading, Peru midnight and rotation without repeats.');
