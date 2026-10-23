import {env} from 'cloudflare:workers';
import {getShalomUser} from '../app/auth';
import {type Actor,type ChurchData,emptyChurch} from './access';
export const db=()=>env.DB!;
export async function state(){const row=await db().prepare('SELECT data,revision FROM church WHERE id=?').bind('shalom').first<{data:string,revision:number}>();return {data:row?JSON.parse(row.data) as ChurchData:emptyChurch,revision:row?.revision??0}}
export async function actor():Promise<Actor|null>{
 const user=await getShalomUser();if(!user)return null;
 const base={id:user.userId,email:user.email.toLowerCase(),name:user.displayName,cell:null,sector:null,person:null};

 const row=await db().prepare('SELECT * FROM accounts WHERE id=? AND active=1').bind(base.id).first<any>();
 if(!row||row.user_id&&row.user_id!==user.userId)return {...base,role:'pending'};
 if(!row.user_id){const claim=await db().prepare('UPDATE accounts SET user_id=? WHERE id=? AND user_id IS NULL').bind(user.userId,row.id).run();if(!claim.meta.changes)return {...base,role:'pending'}}
 return {...base,name:row.name,role:row.role,cell:row.cell,sector:row.sector,person:row.person};
}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}})}
export const denied=()=>json({error:'No tienes permiso para esta acción.'},403);
export const unauth=()=>json({error:'Inicia sesión para continuar.'},401);
export function dateLima(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima'}).format(new Date())}
