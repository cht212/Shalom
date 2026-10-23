import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
export async function GET(){
 const user=await getChatGPTUser(); if(!user)return Response.json({error:'Inicia sesiÃ³n para continuar.'},{status:401});
 const row=await env.DB!.prepare('SELECT data, revision FROM church WHERE id=?').bind('shalom').first<{data:string,revision:number}>();
 return Response.json({data:row?JSON.parse(row.data):null,revision:row?.revision??0},{headers:{'Cache-Control':'no-store'}});
}
export async function PUT(request:Request){
 const user=await getChatGPTUser(); if(!user)return Response.json({error:'Inicia sesiÃ³n para continuar.'},{status:401});
 // The entire pilot is protected by the owner-only Sites access policy.
 try{
 const body=await request.json() as {data:Record<string,unknown>;revision:number};
 if(!body.data || !Number.isInteger(body.revision)||JSON.stringify(body.data).length>1000000 || !['sectors','cells','people','attendance','reports','devotions'].every(k=>Array.isArray(body.data[k])))return Response.json({error:'Datos invÃ¡lidos o demasiado grandes.'},{status:400});
 await env.DB!.prepare('INSERT OR IGNORE INTO church (id,data,revision) VALUES (?,?,0)').bind('shalom',JSON.stringify({sectors:[],cells:[],people:[],attendance:[],reports:[],devotions:[]})).run();
 const result=await env.DB!.prepare('UPDATE church SET data=?, revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(body.data),'shalom',body.revision).run();
 if(!result.meta.changes)return Response.json({error:'Los datos cambiaron en otra ventana. Recarga antes de continuar.'},{status:409});
 return Response.json({revision:body.revision+1});
 }catch{return Response.json({error:'No se pudieron guardar los datos.'},{status:400})}
}

