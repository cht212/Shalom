import books from '../../../public/bible/books.json';

export const maxDuration=120;

function narrationUrl(origin:string,book:string,chapter:number){
 const base=new URL(origin);
 if(!['http:','https:'].includes(base.protocol))throw Error('Invalid narration protocol');
 return new URL('audio/'+book+'/'+chapter+'.wav',base.href.endsWith('/')?base:base.href+'/');
}

export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const book=params.get('book');
 const chapter=Number(params.get('chapter'));
 if(!books.some(item=>item.id===book&&Number.isInteger(chapter)&&chapter>=1&&chapter<=item.chapters)){
  return Response.json({error:'Selecciona un libro y capítulo válidos.'},{status:400});
 }

 const origin=process.env.NARRATION_ORIGIN;
 if(!origin)return Response.json({error:'Audio alojado no configurado.',fallback:'device'},{status:503});

 try{
  const headers:Record<string,string>={};
  const range=request.headers.get('range');
  if(range)headers.Range=range;
  const upstream=await fetch(narrationUrl(origin,book!,chapter),{headers,signal:AbortSignal.timeout(110_000)});
  if(!upstream.ok)return Response.json({error:'No se pudo obtener la narración.',fallback:'device'},{status:502});

  const responseHeaders=new Headers({
   'Content-Type':upstream.headers.get('content-type')||'audio/wav',
   'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800',
   'X-Content-Type-Options':'nosniff',
   'Vary':'Range',
  });
  for(const key of ['content-length','content-range','accept-ranges']){
   const value=upstream.headers.get(key);
   if(value)responseHeaders.set(key,value);
  }
  return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
 }catch{
  return Response.json({error:'El audio alojado no está disponible.',fallback:'device'},{status:503});
 }
}
