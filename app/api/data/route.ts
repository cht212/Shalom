import {actor,state,db,json,denied,unauth} from '../../../lib/server';
import {scopedData} from '../../../lib/access';
export async function GET(){const a=await actor();if(!a)return unauth();if(a.role==='pending')return denied();const s=await state();return json({data:scopedData(a,s.data),revision:s.revision})}
export async function PUT(request:Request){
 const a=await actor();if(!a)return unauth();if(a.role!=='admin')return denied();
 try{const body=await request.json() as {data:Record<string,unknown>;revision:number};
 if(!body.data||!Number.isInteger(body.revision)||JSON.stringify(body.data).length>1000000||!['sectors','cells','people','attendance','reports','devotions'].every(k=>Array.isArray(body.data[k])))return json({error:'Datos inválidos o demasiado grandes.'},400);
 await db().prepare('INSERT OR IGNORE INTO church (id,data,revision) VALUES (?,?,0)').bind('shalom',JSON.stringify({sectors:[],cells:[],people:[],attendance:[],reports:[],devotions:[]})).run();
 const result=await db().prepare('UPDATE church SET data=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(body.data),'shalom',body.revision).run();
 if(!result.meta.changes)return json({error:'Los datos cambiaron en otra ventana. Recarga antes de continuar.'},409);
 return json({revision:body.revision+1});
 }catch{return json({error:'No se pudieron guardar los datos.'},400)}
}
