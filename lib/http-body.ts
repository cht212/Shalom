export class BodyLimitError extends Error{}
export async function limitedBody(request:Request,limit:number):Promise<Uint8Array<ArrayBuffer>>{
 const length=request.headers.get('content-length');
 if(length&&Number(length)>limit)throw new BodyLimitError('El archivo es demasiado grande.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let size=0;
 try{
  while(true){const result=await reader.read();if(result.done)break;size+=result.value.length;
   if(size>limit){await reader.cancel();throw new BodyLimitError('El archivo es demasiado grande.')}
   chunks.push(result.value);
  }
 }finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let position=0;
 for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.length}
 return bytes;
}
export function sameOriginMutation(request:Request){
 const origin=request.headers.get('origin');
 return request.headers.get('sec-fetch-site')!=='cross-site'&&(!origin||origin===new URL(request.url).origin);
}
