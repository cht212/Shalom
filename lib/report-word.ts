import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import template from './report-template.json';
import type {reportSnapshot} from './report-data';
export function reportWord(snapshot:ReturnType<typeof reportSnapshot>){
 const raw=Uint8Array.from(atob(template.base64),c=>c.charCodeAt(0));const archive=unzipSync(raw);const doc=new DOMParser().parseFromString(strFromU8(archive['word/document.xml']),'application/xml');const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const tables=Array.from(doc.getElementsByTagName('w:tbl'));
 tables.forEach((table,index)=>{const rows=Array.from(table.childNodes).filter(n=>n.nodeName==='w:tr');const model=rows[1];if(!model)return;const content=snapshot.sections[index]?.rows||[];while(rows.length<content.length+1){const clone=model.cloneNode(true);table.appendChild(clone);rows.push(clone)}
 rows.slice(1).forEach((row,i)=>{const cells=Array.from(row.childNodes).filter(n=>n.nodeName==='w:tc');cells.forEach((cell,j)=>{const nodes=Array.from((cell as unknown as Element).getElementsByTagName('w:t'));const value=content[i]?.[j]||'';if(nodes.length){nodes[0].textContent=value;for(const n of nodes.slice(1))n.textContent=''}else{const p=doc.createElementNS(ns,'w:p'),r=doc.createElementNS(ns,'w:r'),t=doc.createElementNS(ns,'w:t');t.textContent=value;r.appendChild(t);p.appendChild(r);cell.appendChild(p)}});for(const h of Array.from((row as unknown as Element).getElementsByTagName('w:trHeight')))h.setAttribute('w:hRule','atLeast')});
 });
 const body=doc.getElementsByTagName('w:body')[0];const p=doc.createElementNS(ns,'w:p'),r=doc.createElementNS(ns,'w:r'),t=doc.createElementNS(ns,'w:t');t.textContent='Iglesia Shalom · '+snapshot.cell.name+' · '+snapshot.cell.sector+' · '+snapshot.month;r.appendChild(t);p.appendChild(r);body.insertBefore(p,body.firstChild);
 archive['word/document.xml']=strToU8(new XMLSerializer().serializeToString(doc));return zipSync(archive);
}
