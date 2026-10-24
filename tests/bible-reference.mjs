import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {searchBibleReferences} from '../lib/bible-reference.ts';
const books=JSON.parse(readFileSync(new URL('../public/bible/books.json',import.meta.url),'utf8'));
test('Pedro and other numbered books remain explicit choices',()=>{
 assert.deepEqual(searchBibleReferences('Pedro',books).matches.map(match=>match.book.id),['1PE','2PE']);
 assert.deepEqual(searchBibleReferences('Samuel',books).matches.map(match=>match.book.id),['1SA','2SA']);
 assert.deepEqual(searchBibleReferences('Juan',books).matches.map(match=>match.book.id),['JHN']);
 assert.equal(searchBibleReferences('2 Juan',books).matches[0].book.id,'2JN');
});
test('reference search understands accents, compact input, aliases and ordinal names',()=>{
 const cases=[['Juan 3:16','JHN',3,'16'],['Jn3:16','JHN',3,'16'],['1 Co 13:4','1CO',13,'4'],['Primera de Pedro 2 9','1PE',2,'9'],['II Pedro 3:18','2PE',3,'18'],['Génesis 1:1','GEN',1,'1'],['genesis1,1','GEN',1,'1'],['San Mateo 5:3','MAT',5,'3'],['Salmo 23','PSA',23,undefined],['JHN 03:016','JHN',3,'16'],['Juan capítulo 3 versículo 16','JHN',3,'16']];
 for(const [query,id,chapter,verse] of cases){const result=searchBibleReferences(query,books).matches[0];assert.ok(result,query);assert.deepEqual([result.book.id,result.chapter,result.verse],[id,chapter,verse],query)}
});
test('all 66 canonical names resolve to their actual book and a valid opening verse',()=>{
 for(const book of books){
  const result=searchBibleReferences(book.name+' 1:1',books).matches;
  assert.equal(result.length,1,book.name);assert.equal(result[0].book.id,book.id);
  const content=JSON.parse(readFileSync(new URL('../public/bible/'+book.id+'.json',import.meta.url),'utf8'));
  assert.ok(content[1].some(verse=>verse.verse===result[0].verse),book.name);
 }
});
test('invalid references never turn into a fabricated chapter or verse',()=>{
 assert.ok(searchBibleReferences('Juan 99:1',books).matches[0].error);
 assert.ok(searchBibleReferences('Judas 2:1',books).matches[0].error);
 for(const query of ['Juan 0:1','Juan 3:0','Juan 3:-1','Juan 3:16-18','<script>alert(1)</script>','x'.repeat(100)])assert.ok(searchBibleReferences(query,books).error,query);
 assert.deepEqual(searchBibleReferences('Dios me cuida',books).matches,[]);
 assert.equal(searchBibleReferences('Gnesis 1:1',books).matches[0].book.id,'GEN');
});
