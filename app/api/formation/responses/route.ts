import {z} from 'zod';
import {json,denied,dateLima} from '../../../../lib/server';
import {catalog,ownAssignments,canManageAssignment} from '../../../../lib/formation';
import {formationContext,saveFormation} from '../../../../lib/formation-server';
import {limitedBody,sameOriginMutation} from '../../../../lib/http-body';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('answer'),assignment:z.string(),lesson:z.string(),answers:z.record(z.string(),z.string().trim().max(5000)),submit:z.boolean()}),
 z.object({action:z.literal('review'),assignment:z.string(),lesson:z.string(),approved:z.boolean(),feedback:z.string().trim().max(3000)})
]);
export async function POST(request:Request){
 if(!sameOriginMutation(request))return denied();
 try{
  const c=await formationContext();if('response'in c)return c.response;
  const b=schema.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,200000))));
  const assignment=c.formation.assignments.find(x=>x.id===b.assignment),book=catalog(c.formation).find(x=>x.id===assignment?.book),lesson=book?.lessons.find(l=>l.id===b.lesson);
  if(!assignment||!book||!lesson)return json({error:'La asignación o lección ya no está disponible.'},404);
  const own=ownAssignments(c.a,c.formation).some(x=>x.id===assignment.id);
  const responses=[...(c.formation.responses??[])],index=responses.findIndex(r=>r.assignment===b.assignment&&r.lesson===b.lesson),previous=responses[index];
  if(b.action==='answer'){
   if(!own||!book.published)return denied();
   if(previous?.submitted||previous?.reviewed)return json({error:'La lección ya se envió. Tu líder debe devolverla para modificarla.'},409);
   if(Object.keys(b.answers).some(id=>!lesson.questions.some(q=>q.id===id)))return json({error:'La pregunta no pertenece a esta lección.'},400);
   if(b.submit&&lesson.questions.some(q=>!(b.answers[q.id]||'').trim()))return json({error:'Responde todas las preguntas antes de enviar.'},400);
   const response={assignment:b.assignment,lesson:b.lesson,answers:b.answers,submitted:b.submit,reviewed:false,feedback:previous?.feedback??'',updated:dateLima()};
   if(index<0)responses.push(response);else responses[index]=response;
  }else{
   if(own||!canManageAssignment(c.a,assignment,c.formation,c.data,c.accounts))return denied();
   if(!previous?.submitted)return json({error:'Esta lección todavía no se ha enviado.'},400);
   responses[index]={...previous,reviewed:b.approved,submitted:b.approved,feedback:b.feedback,updated:dateLima()};
  }
  const completed=book.lessons.length>0&&book.lessons.every(l=>responses.some(r=>r.assignment===assignment.id&&r.lesson===l.id&&r.reviewed));
  const assignments=c.formation.assignments.map(x=>x.id===assignment.id?{...x,status:completed?'completed' as const:'in_progress' as const}:x);
  return saveFormation({...c.formation,assignments,responses},c.revision);
 }catch{return json({error:'No se pudieron guardar las respuestas. Revisa la conexión y vuelve a intentarlo.'},400)}
}
