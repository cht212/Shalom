import {z} from 'zod';
import {actor,state,db,json,denied,unauth} from '../../../lib/server';
const schema=z.object({email:z.string().email().max(200).transform(v=>v.toLowerCase()),name:z.string().trim().min(2).max(120),role:z.enum(['disciple','cell_leader','sector_leader','pastor']),cell:z.string().nullable().default(null),sector:z.string().nullable().default(null),person:z.string().nullable().default(null)});
export async function GET(){const a=await actor();if(!a)return unauth();if(a.role!=='admin')return denied();const rows=await db().prepare('SELECT a.id,a.email,a.name,a.role,a.cell,a.sector,a.person,a.active,c.username FROM accounts a LEFT JOIN credentials c ON c.account=a.id ORDER BY a.name').all();return json({accounts:rows.results})}
export async function POST(request:Request){const a=await actor();if(!a)return unauth();if(a.role!=='admin')return denied();try{
 const b=schema.parse(await request.json());const {data}=await state();
 if(b.email===a.email)return json({error:'La cuenta principal no puede modificarse desde aquí.'},400);
 const person=data.people.find(p=>p.id===b.person);const cell=data.cells.find(c=>c.id===b.cell);
 if(b.role==='disciple'&&(!person||person.cell!==b.cell))return json({error:'Vincula el discípulo a una persona de la célula seleccionada.'},400);
 if(b.role==='cell_leader'&&!cell)return json({error:'Selecciona una célula válida.'},400);
 if(b.role==='sector_leader'&&!data.sectors.some(s=>s.id===b.sector))return json({error:'Selecciona un sector válido.'},400);
 if(b.person&&!person||person&&b.cell&&person.cell!==b.cell)return json({error:'La persona no pertenece a esa célula.'},400);
 const clash=person?await db().prepare('SELECT email FROM accounts WHERE person=? AND email<>?').bind(person.id,b.email).first():null;
 if(clash)return json({error:'Esa persona ya está vinculada a otra cuenta.'},409);
 await db().prepare('INSERT INTO accounts (id,email,name,role,cell,sector,person,active) VALUES (?,?,?,?,?,?,?,1) ON CONFLICT(email) DO UPDATE SET name=excluded.name,role=excluded.role,cell=excluded.cell,sector=excluded.sector,person=excluded.person,active=1').bind(crypto.randomUUID(),b.email,b.name,b.role,b.role==='cell_leader'||b.role==='disciple'?b.cell:person?.cell||null,b.role==='sector_leader'?b.sector:null,b.person).run();
 return json({ok:true,account:(await db().prepare('SELECT id FROM accounts WHERE email=?').bind(b.email).first<{id:string}>())?.id});
 }catch{return json({error:'Revisa el correo y los campos de la cuenta.'},400)}}
export async function PATCH(request:Request){const a=await actor();if(!a)return unauth();if(a.role!=='admin')return denied();try{const b=z.object({id:z.string(),active:z.boolean()}).parse(await request.json());if(b.id===a.id)return json({error:'La cuenta principal no puede desactivarse desde aquí.'},400);const result=await db().prepare('UPDATE accounts SET active=? WHERE id=?').bind(b.active?1:0,b.id).run();if(!result.meta.changes)return json({error:'La cuenta no existe.'},404);return json({ok:true})}catch{return json({error:'No se pudo actualizar la cuenta.'},400)}}
