import {z} from 'zod';
import {db,json} from '../../../../lib/server';
import {digest,passwordHash,equalHash,randomToken} from '../../../../lib/passwords';
export async function POST(request:Request){try{
 const b=z.object({username:z.string().trim().min(1).max(80).transform(v=>v.toLowerCase()),password:z.string().min(1).max(200)}).parse(await request.json());
 const ip=request.headers.get('cf-connecting-ip')||'local';const key=await digest('login:'+ip+':'+Math.floor(Date.now()/900000));const attempts=await db().prepare('INSERT INTO attempts (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key).first<{count:number}>();if((attempts?.count||0)>30)return json({error:'Demasiados intentos. Espera unos minutos.'},429);
 const row=await db().prepare('SELECT c.*,a.active FROM credentials c JOIN accounts a ON a.id=c.account WHERE c.username=?').bind(b.username).first<any>();const actual=await passwordHash(b.password,row?.salt||'dummy-salt-for-timing');if(!row||!row.active||!equalHash(actual,row.hash))return json({error:'Usuario o contraseña incorrectos.'},401);
 const token=randomToken();await db().prepare('INSERT INTO sessions (token,account,expires) VALUES (?,?,?)').bind(await digest(token),row.account,Date.now()+7*86400000).run();return Response.json({ok:true,mustChange:!!row.must_change},{headers:{'Set-Cookie':'shalom_session='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800'+(new URL(request.url).protocol==='https:'?'; Secure':''),'Cache-Control':'no-store'}})
 }catch{return json({error:'Revisa el usuario y la contraseña.'},400)}}
