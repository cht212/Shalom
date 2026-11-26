import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const input=process.argv[2];
if(!input)throw Error('Uso: node scripts/import-bes.mjs <spabes_vpl.txt>');
const books=JSON.parse(await readFile('public/bible/books.json','utf8'));
const allowed=new Set(books.map(book=>book.id));
const aliases={SOL:'SNG',EZE:'EZK',JOE:'JOL',NAH:'NAM',MAR:'MRK',JOH:'JHN',PHI:'PHP',JAM:'JAS','1JO':'1JN','2JO':'2JN','3JO':'3JN'};
const result=new Map();
for(const raw of (await readFile(input,'utf8')).split(/\r?\n/)){
 if(!raw.trim())continue;
 const match=/^([1-3A-Z][A-Z0-9]{2}) (\d+):(\d+) (.+)$/.exec(raw);
 if(!match)continue;
 const book=aliases[match[1]]||match[1];
 if(!allowed.has(book))continue;
 const chapter=match[2],verse=match[3],text=match[4];
 if(!result.has(book))result.set(book,{});
 const chapters=result.get(book);
 (chapters[chapter]??=[]).push({verse,text:text.trim()});
}
if(result.size!==66)throw Error(`Se esperaban 66 libros y se encontraron ${result.size}.`);
await mkdir('public/bible/bes',{recursive:true});
for(const book of books){
 const chapters=result.get(book.id);
 if(!chapters||Object.keys(chapters).length!==book.chapters)throw Error(`Capítulos incompletos en ${book.id}.`);
 await writeFile(path.join('public/bible/bes',`${book.id}.json`),JSON.stringify(chapters),'utf8');
}
console.log('Biblia en Español Sencillo importada: 66 libros.');
