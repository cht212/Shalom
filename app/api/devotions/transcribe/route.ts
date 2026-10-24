import {actor,db,json,denied,unauth} from '../../../../lib/server';
import {digest} from '../../../../lib/passwords';
import {AudioValidationError,MAX_DEVOTIONAL_AUDIO_BYTES,validateDevotionalAudio} from '../../../../lib/devotional-audio';
import {BodyLimitError,limitedBody,sameOriginMutation} from '../../../../lib/http-body';
import {TranscriptionServiceError,transcribeDevotional} from '../../../../lib/transcription';
import books from '../../../../public/bible/books.json';

export const runtime='nodejs';
export const maxDuration=90;
export async function GET(){
 const user=await actor();if(!user)return unauth();if(user.role==='pending')return denied();
 return json({available:!!process.env.OPENAI_API_KEY});
}
export async function POST(request:Request){
 if(!sameOriginMutation(request))return denied();
 const user=await actor();if(!user)return unauth();if(user.role==='pending')return denied();
 const key=process.env.OPENAI_API_KEY;
 if(!key)return json({error:'La conversión a texto aún no está habilitada. Puedes escribir tu reflexión y adjuntar la grabación.'},503);
 try{
  if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return json({error:'Envía una grabación válida.'},400);
  const body=await limitedBody(request,MAX_DEVOTIONAL_AUDIO_BYTES+16000);
  const form=await new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')!},body}).formData();
  const file=form.get('audio');if(!(file instanceof File))return json({error:'Graba primero tu devocional.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=validateDevotionalAudio(bytes,file.type);
  const book=books.find(item=>item.id===form.get('book')),chapter=Number(form.get('chapter'));
  if(!book||!Number.isInteger(chapter)||chapter<1||chapter>book.chapters)return json({error:'Selecciona el libro y capítulo que leíste.'},400);
  const bucket=await digest('devotional-transcription:'+user.id+':'+Math.floor(Date.now()/900000));
  const limit=await db().prepare('INSERT INTO attempts (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=attempts.count+1 RETURNING attempts.count').bind(bucket).first<{count:number}>();
  if((limit?.count||0)>6)return json({error:'Ya hiciste varias conversiones. Espera unos minutos o escribe tu reflexión.'},429);
  const text=await transcribeDevotional(bytes,mime,`${book.name} ${chapter}`,{key,model:process.env.DEVOTIONAL_TRANSCRIPTION_MODEL});
  return json({text});
 }catch(error){
  if(error instanceof BodyLimitError)return json({error:error.message},413);
  if(error instanceof AudioValidationError)return json({error:error.message},400);
  if(error instanceof TranscriptionServiceError)return json({error:error.message},502);
  return json({error:'No se pudo completar la conversión. Tu grabación sigue disponible para reintentar.'},503);
 }
}
