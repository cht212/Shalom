import {actor,state,db,json,denied,unauth} from './server';
import {type FormationAccount,type FormationState} from './formation';
import {FORMATION_ENABLED} from './features';

export async function formationContext(){
 const a=await actor();if(!a)return {response:unauth()} as const;if(a.role==='pending')return {response:denied()} as const;
 if(!FORMATION_ENABLED)return {response:json({error:'Los libros de discipulado todavía no están habilitados.'},503)} as const;
 const {data}=await state();
 const row=await db().prepare('SELECT data,revision FROM church WHERE id=?').bind('formation').first<{data:string;revision:number}>();
 const formation:FormationState=row?JSON.parse(row.data):{assignments:[]};
 const accounts=(await db().prepare('SELECT id,name,role,cell,sector,person FROM accounts WHERE active=1').all<FormationAccount>()).results;
 return {a,data,formation,accounts,revision:row?.revision??0};
}
export async function saveFormation(formation:FormationState,revision:number){
 await db().prepare('INSERT OR IGNORE INTO church (id,data,revision) VALUES (?,?,0)').bind('formation',JSON.stringify({assignments:[]})).run();
 const result=await db().prepare('UPDATE church SET data=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(formation),'formation',revision).run();
 return result.meta.changes?json({ok:true}):json({error:'Otra persona actualizó la formación. Recarga y vuelve a intentarlo.'},409);
}
