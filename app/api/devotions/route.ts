import {z} from 'zod';
import {actor,state,db,json,denied,unauth,dateLima} from '../../../lib/server';
import {canReadDevotion,canReview} from '../../../lib/access';
import {AudioValidationError,MAX_DEVOTIONAL_AUDIO_BYTES,MAX_DEVOTIONAL_AUDIO_SECONDS,validateDevotionalAudio} from '../../../lib/devotional-audio';
import {BodyLimitError,limitedBody,sameOriginMutation} from '../../../lib/http-body';
import {digest} from '../../../lib/passwords';
import books from '../../../public/bible/books.json';
const schema=z.object({book:z.string(),chapter:z.number().int().positive(),reflection:z.string().trim().min(10).max(10000),application:z.string().trim().max(5000).default('')});
type DevotionRow={id:string;author:string;person:string;cell:string;book:string;chapter:number;reflection:string;application:string;date:string;feedback:string;account_name:string|null;has_audio?:boolean};
function missingAudioTable(error:unknown){return !!error&&typeof error==='object'&&'code'in error&&error.code==='42P01'}

export async function GET(request:Request){
 const a=await actor();if(!a)return unauth();if(a.role==='pending')return denied();
 const {data}=await state(),mine=new URL(request.url).searchParams.get('mine')==='1';
 const query='SELECT d.*, a.name AS account_name, %AUDIO% AS has_audio FROM devotions d LEFT JOIN accounts a ON a.user_id=d.author '+(mine?'WHERE d.author=? ':'')+'ORDER BY d.date DESC,d.id DESC LIMIT 5000';
 const read=async(audio:string)=>{const statement=db().prepare(query.replace('%AUDIO%',audio));return (mine?statement.bind(a.id):statement).all<DevotionRow>()};
 let rows;
 try{rows=await read('EXISTS (SELECT 1 FROM devotion_audio audio WHERE audio.devotion_id=d.id)')}
 catch(error){if(!missingAudioTable(error))throw error;rows=await read('false')}
 const entries=rows.results.filter(v=>canReadDevotion(a,v,data)).map(v=>({...v,authorName:data.people.find(p=>p.id===v.person)?.name||v.account_name||(v.author===a.id?a.name:'Integrante'),cellName:data.cells.find(c=>c.id===v.cell)?.name||'Célula'}));
 return json({devotions:entries});
}
export async function POST(request:Request){
 if(!sameOriginMutation(request))return denied();
 const a=await actor();if(!a)return unauth();if(a.role==='pending')return denied();
 try{
  const multipart=request.headers.get('content-type')?.startsWith('multipart/form-data');
  const body=await limitedBody(request,multipart?MAX_DEVOTIONAL_AUDIO_BYTES+100000:100000);
  let content:unknown,audio:{data:string;bytes:number;mime:string;seconds:number}|null=null;
  if(multipart){
   const form=await new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')!},body}).formData();
   content={book:form.get('book'),chapter:Number(form.get('chapter')),reflection:form.get('reflection'),application:form.get('application')||''};
   const file=form.get('audio');
   if(file instanceof File){
    if(form.get('attachAudio')!=='true'||form.getAll('audio').length!==1)return json({error:'Confirma si quieres adjuntar tu grabación.'},400);
    const seconds=Number(form.get('audioSeconds'));
    if(!Number.isInteger(seconds)||seconds<1||seconds>MAX_DEVOTIONAL_AUDIO_SECONDS)return json({error:'La grabación debe durar como máximo tres minutos.'},400);
    const bytes=new Uint8Array(await file.arrayBuffer()),mime=validateDevotionalAudio(bytes,file.type);
    audio={data:Buffer.from(bytes).toString('base64'),bytes:bytes.length,mime,seconds};
   }else if(form.get('attachAudio')==='true')return json({error:'Falta la grabación que quieres adjuntar.'},400);
  }else{content=JSON.parse(new TextDecoder().decode(body))}
  const b=schema.parse(content);
  if(!books.some(book=>book.id===b.book&&b.chapter<=book.chapters))return json({error:'Selecciona un libro y capítulo válidos.'},400);
  const {data}=await state(),p=data.people.find(p=>p.id===a.person);
  if(a.person&&!p)return denied();const cell=p?.cell||a.cell||'';
  if(cell&&!data.cells.some(c=>c.id===cell)||a.role==='disciple'&&!p)return denied();
  const id=crypto.randomUUID();
  const command={sql:'INSERT INTO devotions (id,author,person,cell,book,chapter,reflection,application,date,feedback) VALUES (?,?,?,?,?,?,?,?,?,?)',values:[id,a.id,p?.id||a.id,cell,b.book,b.chapter,b.reflection,b.application,dateLima(),'']};
  if(audio){
   const key=await digest('devotional-audio:'+a.id+':'+dateLima());
   const limit=await db().prepare('INSERT INTO attempts (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=attempts.count+1 RETURNING attempts.count').bind(key).first<{count:number}>();
   if((limit?.count||0)>20)return json({error:'Has adjuntado varias grabaciones hoy. Puedes enviar tu devocional solo como texto.'},429);
   try{await db().transaction([command,{sql:'INSERT INTO devotion_audio (devotion_id,mime,bytes,seconds,data,created_at) VALUES (?,?,?,?,?,?)',values:[id,audio.mime,audio.bytes,audio.seconds,audio.data,Date.now()]}])}
   catch(error){if(missingAudioTable(error))return json({error:'El envío de audio aún no está habilitado. Tu borrador se conserva; puedes enviarlo solo como texto.'},503);throw error}
  }else{await db().prepare(command.sql).bind(...command.values).run()}
  return json({ok:true,id},201);
 }catch(error){
  if(error instanceof BodyLimitError)return json({error:error.message},413);
  if(error instanceof AudioValidationError)return json({error:error.message},400);
  if(error instanceof z.ZodError||error instanceof SyntaxError)return json({error:'Escribe al menos 10 caracteres en tu reflexión y revisa el capítulo.'},400);
  return json({error:'No se pudo enviar el devocional. Tu borrador se conserva para volver a intentarlo.'},400);
 }
}
export async function PATCH(request:Request){
 if(!sameOriginMutation(request))return denied();
 const a=await actor();if(!a)return unauth();
 try{
  const b=z.object({id:z.string(),feedback:z.string().trim().max(5000).default('')}).parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,40000))));
  const v=await db().prepare('SELECT * FROM devotions WHERE id=?').bind(b.id).first<DevotionRow>(),{data}=await state();
  if(!v||v.author===a.id||!canReview(a,v.cell,data))return denied();
  await db().prepare('UPDATE devotions SET reviewed_by=?,reviewed_at=?,feedback=? WHERE id=?').bind(a.id,dateLima(),b.feedback,b.id).run();return json({ok:true});
 }catch{return json({error:'No se pudo guardar la revisión.'},400)}
}
