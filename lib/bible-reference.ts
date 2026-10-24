export type BibleBook={id:string;name:string;chapters:number};
export type BibleReferenceMatch={book:BibleBook;chapter?:number;verse?:string;error?:string};
const aliases:Record<string,string[]>={
 GEN:['gen','gn'],EXO:['exo','ex'],LEV:['lev','lv'],NUM:['num','nm'],DEU:['deut','dt'],JOS:['jos','js'],JDG:['jueces','jue'],RUT:['rut','rt'],
 '1SA':['1 sam','1 sm'],'2SA':['2 sam','2 sm'],'1KI':['1 re','1 r'],'2KI':['2 re','2 r'],'1CH':['1 cro','1 cr'],'2CH':['2 cro','2 cr'],
 EZR:['esd','esdras'],NEH:['neh'],EST:['est'],JOB:['job'],PSA:['sal','salmo','salmos','ps'],PRO:['prov','pr'],ECC:['ecl','ec'],SNG:['cantares','cantar','cnt'],
 ISA:['is','isa'],JER:['jer','jr'],LAM:['lam','lm'],EZK:['eze','ez'],DAN:['dan','dn'],HOS:['os','ose'],JOL:['jl','joel'],AMO:['am'],OBA:['abd','ab'],JON:['jon'],MIC:['mi','miq'],NAM:['nah','na'],HAB:['hab'],ZEP:['sof','so'],HAG:['hag','ag','hageo','ageo'],ZEC:['zac','za'],MAL:['mal'],
 MAT:['mateo','mt','mat'],MRK:['marcos','mc','mr'],LUK:['lucas','lc'],JHN:['juan','jn','jua'],ACT:['hechos','hch'],ROM:['rom','ro'],
 '1CO':['1 cor','1 co'],'2CO':['2 cor','2 co'],GAL:['gal','ga'],EPH:['ef','efe'],PHP:['fil','flp'],COL:['col'],
 '1TH':['1 tes','1 ts'],'2TH':['2 tes','2 ts'],'1TI':['1 tim','1 ti'],'2TI':['2 tim','2 ti'],TIT:['tit'],PHM:['flm','filemon'],HEB:['heb','he'],JAS:['santiago','stg','sant'],
 '1PE':['1 ped','1 pe','1 p'],'2PE':['2 ped','2 pe','2 p'],'1JN':['1 juan','1 jn'],'2JN':['2 juan','2 jn'],'3JN':['3 juan','3 jn'],JUD:['jud','judas'],REV:['ap','apoc','apocalipsis','revelacion'],
};
function normalize(value:string){
 return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.]/g,'')
  .replace(/^(?:primera|primero|primer)\b/,'1').replace(/^(?:segunda|segundo)\b/,'2').replace(/^(?:tercera|tercero|tercer)\b/,'3')
  .replace(/^iii\b/,'3').replace(/^ii\b/,'2').replace(/^i\b/,'1')
  .replace(/\b(?:de|del|los|libro|carta|evangelio|segun|san|capitulo|cap|versiculo|vers|verso)\b/g,' ').replace(/\s+/g,' ').trim();
}
function compact(value:string){return normalize(value).replace(/\s/g,'')}
function distance(a:string,b:string){
 const row=Array.from({length:b.length+1},(_,index)=>index);
 for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const before=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=before}}
 return row[b.length];
}
export function searchBibleReferences(query:string,books:readonly BibleBook[]):{matches:BibleReferenceMatch[];error?:string}{
 const normalized=normalize(query);
 if(!normalized)return {matches:[]};
 if(normalized.length>80)return {matches:[],error:'Escribe una referencia más corta, por ejemplo Juan 3:16.'};
 const parsed=/^([1-3]?\s*[a-z]+(?:\s+[a-z]+)*?)\s*(?:(\d+)(?:\s*[:,]\s*(\d+)|\s+(\d+))?)?$/.exec(normalized);
 if(!parsed)return {matches:[],error:'Busca por libro o referencia, por ejemplo Pedro, Salmos 23 o Juan 3:16.'};
 const term=compact(parsed[1]),chapter=parsed[2]===undefined?undefined:Number(parsed[2]),verseNumber=parsed[3]||parsed[4],verse=verseNumber===undefined?undefined:String(Number(verseNumber));
 if(chapter!==undefined&&(!Number.isSafeInteger(chapter)||chapter<1)||verse!==undefined&&(!Number.isSafeInteger(Number(verse))||Number(verse)<1))return {matches:[],error:'Los capítulos y versículos empiezan en 1.'};
 const numbered=/^[1-3]/.test(term);
 const ranked=books.flatMap((book,index)=>{
  if(numbered&&!compact(book.name).startsWith(term[0]))return [];
  const full=[book.name,book.id,...(aliases[book.id]||[])].map(compact);
  const names=numbered?full:[...full,...full.map(name=>name.replace(/^[1-3]/,''))];
  const exact=names.includes(term),prefix=names.some(name=>name.startsWith(term)),contains=names.some(name=>name.includes(term));
  const fuzzy=term.length>=4&&names.some(name=>Math.abs(name.length-term.length)<=1&&distance(name,term)<=1);
  if(!exact&&!prefix&&!contains&&!fuzzy)return [];
  return [{book,index,score:exact?0:prefix?1:contains?2:3,exactFull:full.includes(term)}];
 });
 // Unnumbered "Juan" means the Gospel. "Pedro" still offers both numbered books.
 const hasExactUnnumbered=!numbered&&ranked.some(item=>item.exactFull&&!/^[1-3]/.test(item.book.name));
 const candidates=(hasExactUnnumbered?ranked.filter(item=>item.exactFull&&!/^[1-3]/.test(item.book.name)):ranked).sort((a,b)=>a.score-b.score||a.index-b.index);
 return {matches:candidates.slice(0,12).map(({book})=>({book,chapter,verse,...(chapter!==undefined&&chapter>book.chapters?{error:`${book.name} tiene ${book.chapters} ${book.chapters===1?'capítulo':'capítulos'}.`}:{})}))};
}
