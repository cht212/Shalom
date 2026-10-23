const env = process.env;
import books from '../../../public/bible/books.json';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const book=params.get('book');const chapter=Number(params.get('chapter'));
 if(!books.some(b=>b.id===book&&Number.isInteger(chapter)&&chapter>=1&&chapter<=b.chapters))return Response.json({error:'Selecciona un libro y capítulo válidos.'},{status:400});
 if(!env.NARRATION_ORIGIN)return Response.json({error:'La voz neuronal aún no está configurada en este servidor.'},{status:503});
 try{const headers:Record<string,string>={};const range=request.headers.get('range');if(range)headers.Range=range;
 const r=await fetch(env.NARRATION_ORIGIN+'/audio/'+book+'/'+chapter+'.wav',{headers,signal:AbortSignal.timeout(240000)});
 if(!r.ok)return Response.json({error:'No se pudo preparar la narración de este capítulo.'},{status:502});
 const responseHeaders=new Headers({'Content-Type':'audio/wav','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});
 for(const key of ['content-length','content-range','accept-ranges']){const v=r.headers.get(key);if(v)responseHeaders.set(key,v)}
 return new Response(r.body,{status:r.status,headers:responseHeaders});
 }catch{return Response.json({error:'El servicio de voz no está disponible. Inicia el proyecto con npm run dev para activar la voz local.'},{status:503})}
}
