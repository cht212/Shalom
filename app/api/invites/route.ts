import {z} from 'zod';
import {actor,state,db,json,denied,unauth} from '../../../lib/server';
import {visibleCells} from '../../../lib/access';
import {randomToken,digest} from '../../../lib/passwords';
export async function POST(request:Request){const a=await actor();if(!a)return unauth();if(!['admin','pastor','sector_leader','cell_leader'].includes(a.role))return denied();try{const b=z.object({cell:z.string()}).parse(await request.json());const s=await state();if(!visibleCells(a,s.data).has(b.cell))return denied();const token=randomToken();await db().prepare('INSERT INTO invites (token,cell,created_by,expires,active) VALUES (?,?,?,?,1)').bind(await digest(token),b.cell,a.id,Date.now()+30*86400000).run();return json({url:new URL('/registro?invitacion='+token,request.url).toString(),expiresDays:30})}catch{return json({error:'No se pudo generar el QR.'},400)}}
