import {z} from 'zod';
import {json,denied,dateLima} from '../../../lib/server';
import {visibleCells} from '../../../lib/access';
import {catalog,publicBook,ownAssignments,canEditBooks,canGrantBooks,eligibleLeaders,canAssignMember,canManageAssignment} from '../../../lib/formation';
import {formationContext,saveFormation} from '../../../lib/formation-server';
import {limitedBody,sameOriginMutation} from '../../../lib/http-body';

export async function GET(){
 const c=await formationContext();if('response'in c)return c.response;
 const {a,data,formation,accounts}=c,own=ownAssignments(a,formation);
 const managed=formation.assignments.filter(x=>canManageAssignment(a,x,formation,data,accounts));
 const books=catalog(formation).filter(b=>canGrantBooks(a)||own.some(x=>x.book===b.id)).map(b=>publicBook(b.published||canEditBooks(a)?b:{...b,lessons:[],pdfData:undefined}));
 const cells=visibleCells(a,data),ids=new Set([...own,...managed].map(x=>x.id));
 return json({books,own,responses:(formation.responses??[]).filter(r=>ids.has(r.assignment)),assignments:managed.map(x=>({...x,name:x.kind==='leader'?accounts.find(t=>t.id===x.target)?.name:data.people.find(p=>p.id===x.target)?.name})),leaders:eligibleLeaders(a,accounts,data),members:a.role==='cell_leader'||canGrantBooks(a)?data.people.filter(p=>cells.has(p.cell)).map(p=>({id:p.id,name:p.name,cell:p.cell})):[],canGrant:canGrantBooks(a),canEdit:canEditBooks(a),revision:c.revision});
}
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('assign'),book:z.string(),kind:z.enum(['leader','member']),targets:z.array(z.string()).min(1).max(300)}),
 z.object({action:z.literal('status'),id:z.string(),status:z.enum(['pending','in_progress','completed'])}),
 z.object({action:z.literal('revoke'),id:z.string()})
]);
export async function POST(request:Request){
 if(!sameOriginMutation(request))return denied();
 try{
  const c=await formationContext();if('response'in c)return c.response;
  const b=input.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,40000))));
  const {a,data,formation,accounts,revision}=c;let assignments=[...formation.assignments];
  if(b.action==='assign'){
   if(!catalog(formation).some(x=>x.id===b.book))return json({error:'Libro no disponible.'},400);
   const targets=[...new Set(b.targets)];
   if(!targets.every(target=>b.kind==='leader'?eligibleLeaders(a,accounts,data).some(t=>t.id===target):canAssignMember(a,b.book,target,formation,data)))return denied();
   for(const target of targets)if(!assignments.some(x=>x.book===b.book&&x.kind===b.kind&&x.target===target))assignments.push({id:crypto.randomUUID(),book:b.book,kind:b.kind,target,assignedBy:a.id,date:dateLima(),status:'pending'});
  }else{
   const entry=assignments.find(x=>x.id===b.id);if(!entry||!canManageAssignment(a,entry,formation,data,accounts))return denied();
   if(b.action==='status')assignments=assignments.map(x=>x.id===b.id?{...x,status:b.status}:x);
   else assignments=assignments.filter(x=>x.id!==b.id&&!(entry.kind==='leader'&&x.kind==='member'&&x.book===entry.book&&x.assignedBy===entry.target));
  }
  const retained=new Set(assignments.map(x=>x.id));
  return saveFormation({...formation,assignments,responses:(formation.responses??[]).filter(r=>retained.has(r.assignment))},revision);
 }catch{return json({error:'No se pudo guardar la asignación. Revisa la conexión y los datos.'},400)}
}
