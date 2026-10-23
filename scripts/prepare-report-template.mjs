import fs from 'node:fs';
import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
const archive=unzipSync(fs.readFileSync('../FORMATOScd.docx'));
const doc=new DOMParser().parseFromString(strFromU8(archive['word/document.xml']),'application/xml');
const tables=Array.from(doc.getElementsByTagName('w:tbl'));
for(const table of tables){const rows=Array.from(table.childNodes).filter(n=>n.nodeName==='w:tr');for(const row of rows.slice(1))for(const node of Array.from(row.getElementsByTagName('w:t')))node.textContent='';}
archive['word/document.xml']=strToU8(new XMLSerializer().serializeToString(doc));
if(archive['docProps/core.xml']){const meta=new DOMParser().parseFromString(strFromU8(archive['docProps/core.xml']),'application/xml');for(const tag of ['dc:creator','cp:lastModifiedBy','dc:title','dc:subject','dc:description'])for(const n of Array.from(meta.getElementsByTagName(tag)))n.textContent=tag==='dc:creator'?'Iglesia Shalom':'';archive['docProps/core.xml']=strToU8(new XMLSerializer().serializeToString(meta));}
fs.writeFileSync('lib/report-template.json',JSON.stringify({base64:Buffer.from(zipSync(archive)).toString('base64'),source:'FORMATOScd.docx',tables:tables.length}));
console.log('Prepared private sanitized template: '+tables.length+' tables, example data removed.');
