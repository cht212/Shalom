import {actor,state,db,json,denied,unauth} from '../../../../../lib/server';
import {canReadDevotion} from '../../../../../lib/access';
import {audioExtension,normalizeAudioType} from '../../../../../lib/devotional-audio';

export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await actor();if(!user)return unauth();if(user.role==='pending')return denied();
 const {id}=await params;
 const devotional=await db().prepare('SELECT author,cell FROM devotions WHERE id=?').bind(id).first<{author:string;cell:string}>();
 if(!devotional)return json({error:'No se encontró la grabación.'},404);
 const {data}=await state();if(!canReadDevotion(user,devotional,data))return denied();
 let saved:{mime:string;data:string}|null;
 try{saved=await db().prepare('SELECT mime,data FROM devotion_audio WHERE devotion_id=?').bind(id).first<{mime:string;data:string}>()}
 catch{return json({error:'El audio no está disponible.'},503)}
 if(!saved)return json({error:'Este devocional no tiene audio adjunto.'},404);
 const mime=normalizeAudioType(saved.mime);if(!mime)return json({error:'El audio no está disponible.'},404);
 const bytes=Buffer.from(saved.data,'base64'),headers=new Headers({'Content-Type':mime,'Cache-Control':'no-store, private','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Content-Disposition':`inline; filename="devocional.${audioExtension(mime)}"`});
 const range=request.headers.get('range');
 if(range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  let start=match?.[1]?Number(match[1]):0,end=match?.[2]?Number(match[2]):bytes.length-1;
  if(match&&!match[1]&&match[2]){start=Math.max(0,bytes.length-Number(match[2]));end=bytes.length-1}
  if(!match||!match[1]&&!match[2]||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||start>=bytes.length){headers.set('Content-Range',`bytes */${bytes.length}`);return new Response(null,{status:416,headers})}
  end=Math.min(end,bytes.length-1);headers.set('Content-Range',`bytes ${start}-${end}/${bytes.length}`);headers.set('Content-Length',String(end-start+1));
  return new Response(bytes.subarray(start,end+1),{status:206,headers});
 }
 headers.set('Content-Length',String(bytes.length));return new Response(bytes,{headers});
}
