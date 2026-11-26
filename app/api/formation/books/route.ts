import {z} from 'zod';
import {json,denied} from '../../../../lib/server';
import {catalog,canEditBooks} from '../../../../lib/formation';
import {formationContext,saveFormation} from '../../../../lib/formation-server';
import {limitedBody,sameOriginMutation} from '../../../../lib/http-body';
const lesson=z.object({id:z.string().min(1).max(80),title:z.string().trim().min(1).max(200),text:z.string().trim().max(20000),questions:z.array(z.object({id:z.string().min(1).max(80),text:z.string().trim().min(1).max(1000)})).max(30)});
const schema=z.object({id:z.string().max(80).optional(),title:z.string().trim().min(2).max(150),published:z.boolean(),lessons:z.array(lesson).max(80)});
export async function POST(request:Request){
 if(!sameOriginMutation(request))return denied();
 try{
  const c=await formationContext();if('response'in c)return c.response;if(!canEditBooks(c.a))return denied();
  const b=schema.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,600000))));
  const books=[...catalog(c.formation)],existing=books.find(x=>x.id===b.id);
  if(b.id&&!existing)return json({error:'Libro no encontrado.'},404);
  if(new Set(b.lessons.map(l=>l.id)).size!==b.lessons.length||b.lessons.some(l=>new Set(l.questions.map(q=>q.id)).size!==l.questions.length))return json({error:'Cada lección y pregunta debe tener una identificación diferente.'},400);
  if(b.published&&!b.lessons.length&&!existing?.pdfData)return json({error:'Agrega lecciones o un PDF antes de publicar.'},400);
  const assignments=c.formation.assignments.filter(a=>a.book===existing?.id);
  if(existing&&(c.formation.responses??[]).some(r=>assignments.some(a=>a.id===r.assignment))&&JSON.stringify(existing.lessons)!==JSON.stringify(b.lessons))return json({error:'Este libro ya tiene respuestas. Crea una nueva edición para cambiar sus lecciones.'},409);
  if(!existing&&books.length>=100)return json({error:'La biblioteca alcanzó su límite de libros.'},400);
  const book={...existing,...b,id:existing?.id??crypto.randomUUID(),cover:existing?.cover??null};
  return saveFormation({...c.formation,books:existing?books.map(x=>x.id===book.id?book:x):[...books,book]},c.revision);
 }catch{return json({error:'Revisa el título y las lecciones. No se guardaron cambios.'},400)}
}
