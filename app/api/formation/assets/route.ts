import sharp from 'sharp';
import {json,denied} from '../../../../lib/server';
import {catalog,canEditBooks,canOpenBook} from '../../../../lib/formation';
import {formationContext,saveFormation} from '../../../../lib/formation-server';
import {BodyLimitError,limitedBody,sameOriginMutation} from '../../../../lib/http-body';

export async function GET(request:Request){
 const c=await formationContext();if('response'in c)return c.response;
 const params=new URL(request.url).searchParams,id=params.get('book')||'',kind=params.get('kind');
 const book=catalog(c.formation).find(x=>x.id===id);if(!book||!canOpenBook(c.a,id,c.formation))return denied();
 if(!book.published&&kind!=='cover'&&!canEditBooks(c.a))return json({error:'Este libro todavía está en preparación.'},403);
 const data=kind==='cover'?book.coverData:kind==='pdf'?book.pdfData:null;if(!data)return json({error:'Archivo no disponible.'},404);
 return new Response(Buffer.from(data,'base64'),{headers:{'Content-Type':kind==='cover'?'image/jpeg':'application/pdf','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...(kind==='pdf'?{'Content-Disposition':`attachment; filename="libro-${book.id.replace(/[^a-z0-9-]/gi,'')}.pdf"`}:{})}});
}
export async function POST(request:Request){
 if(!sameOriginMutation(request))return denied();
 try{
  const c=await formationContext();if('response'in c)return c.response;if(!canEditBooks(c.a))return denied();
  const bytes=await limitedBody(request,3300000),form=await new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body:bytes}).formData();
  const id=String(form.get('book')||''),kind=form.get('kind'),file=form.get('file');
  const books=catalog(c.formation),book=books.find(x=>x.id===id);if(!book)return json({error:'Guarda primero el libro.'},400);
  if(!(file instanceof File)||!file.size)return json({error:'Selecciona un archivo.'},400);
  const buffer=Buffer.from(await file.arrayBuffer());let next={...book};
  if(kind==='cover'){
   const image=sharp(buffer,{limitInputPixels:25000000});const metadata=await image.metadata();
   if(!['jpeg','png','webp'].includes(metadata.format||''))return json({error:'La portada debe ser JPG, PNG o WebP.'},400);
   const normalized=await image.rotate().resize(1000,625,{fit:'cover',withoutEnlargement:true}).jpeg({quality:80}).toBuffer();
   next={...book,coverData:normalized.toString('base64')};
  }else if(kind==='pdf'){
   if(buffer.length>3000000||buffer.subarray(0,5).toString()!=='%PDF-')return json({error:'Selecciona un PDF de hasta 3 MB.'},400);
   next={...book,pdfData:buffer.toString('base64'),pdfName:file.name.slice(0,150)};
  }else return json({error:'Tipo de archivo inválido.'},400);
  return saveFormation({...c.formation,books:books.map(x=>x.id===id?next:x)},c.revision);
 }catch(error){return json({error:error instanceof BodyLimitError?'El archivo supera el tamaño permitido.':'No se pudo cargar el archivo. Usa una imagen válida o un PDF de hasta 3 MB.'},400)}
}
