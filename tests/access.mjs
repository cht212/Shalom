import assert from 'node:assert/strict';
import {scopedData,visibleCells,canReview} from '../lib/access.ts';
const data={sectors:[{id:'s1'},{id:'s2'}],cells:[{id:'c1',sector:'s1'},{id:'c2',sector:'s2'}],people:[{id:'p1',cell:'c1'},{id:'p2',cell:'c1'},{id:'p3',cell:'c2'}],attendance:[{person:'p1',cell:'c1'},{person:'p3',cell:'c2'}],reports:[{cell:'c1'},{cell:'c2'}],devotions:[{person:'p3'}]};
const base={id:'u1',email:'a@test.invalid',name:'A',cell:'c1',sector:'s1',person:'p1'};
const disciple={...base,role:'disciple'};assert.equal(scopedData(disciple,data).people.length,1);assert.equal(scopedData(disciple,data).reports.length,0);assert.equal(canReview(disciple,'c1',data),false);
const leader={...base,role:'cell_leader'};assert.equal(scopedData(leader,data).people.length,2);assert.equal(canReview(leader,'c2',data),false);assert.equal(scopedData(leader,data).devotions.length,0);
assert.deepEqual([...visibleCells({...base,role:'sector_leader'},data)],['c1']);assert.equal(scopedData({...base,role:'pastor'},data).people.length,3);assert.equal(scopedData({...base,role:'pending'},data).people.length,0);
console.log('PASS: disciple, cell leader, sector leader, pastor and pending authorization scopes.');
