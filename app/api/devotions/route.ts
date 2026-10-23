import {z} from 'zod';
import {actor,state,db,json,denied,unauth,dateLima} from '../../../lib/server';
import {canReview,visibleCells} from '../../../lib/access';
import books from '../../../public/bible/books.json';
const schema=z.object({book:z.string(),chapter:z.number().int().positive(),reflection:z.string().trim().min(10).max(10000),application:z.string().trim().max(5000).default('')});
export async function GET(){const a=await actor();if(!a)return unauth();if(a.role==='pending')return denied();const {data}=await state();const ids=visibleCells(a,data);const rows=await db().prepare('SELECT * FROM devotions ORDER BY date DESC,id DESC LIMIT 5000').all<any>();
 const own=a.role==='disciple';const entries=rows.results.filter(v=>v.author===a.id||!own&&ids.has(v.cell)).map(v=>({...v,authorName:data.people.find(p=>p.id===v.person)?.name||'Integrante',cellName:data.cells.find(c=>c.id===v.cell)?.name||'Célula'}));return json({devotions:entries})}
export async function POST(request:Request){const a=await actor();if(!a)return unauth();if(a.role==='pending'||!a.person)return denied();try{
 const b=schema.parse(await request.json());if(!books.some(book=>book.id===b.book&&b.chapter<=book.chapters))return json({error:'Selecciona un libro y capítulo válidos.'},400);
 const {data}=await state();const p=data.people.find(p=>p.id===a.person);if(!p||!data.cells.some(c=>c.id===p.cell))return denied();
 await db().prepare('INSERT INTO devotions (id,author,person,cell,book,chapter,reflection,application,date,feedback) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),a.id,p.id,p.cell,b.book,b.chapter,b.reflection,b.application,dateLima(),'').run();return json({ok:true},201)
 }catch{return json({error:'Escribe al menos 10 caracteres en tu reflexión y revisa el capítulo.'},400)}}
export async function PATCH(request:Request){const a=await actor();if(!a)return unauth();try{const b=z.object({id:z.string(),feedback:z.string().trim().max(5000).default('')}).parse(await request.json());const v=await db().prepare('SELECT * FROM devotions WHERE id=?').bind(b.id).first<any>();const {data}=await state();if(!v||v.author===a.id||!canReview(a,v.cell,data))return denied();await db().prepare('UPDATE devotions SET reviewed_by=?,reviewed_at=?,feedback=? WHERE id=?').bind(a.id,dateLima(),b.feedback,b.id).run();return json({ok:true})}catch{return json({error:'No se pudo guardar la revisión.'},400)}}
