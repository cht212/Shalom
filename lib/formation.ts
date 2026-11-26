import {type Actor,type ChurchData,visibleCells} from './access.ts';

export type Lesson={id:string;title:string;text:string;questions:{id:string;text:string}[]};
export type FormationBook={id:string;title:string;cover:string|null;published:boolean;lessons:Lesson[];coverData?:string;pdfData?:string;pdfName?:string};
export const formationBooks:FormationBook[]=[{id:'discipulado-1',title:'Discipulado 1',cover:null,published:false,lessons:[]}];
export type FormationAccount=Pick<Actor,'id'|'name'|'role'|'cell'|'sector'|'person'>;
export type Assignment={id:string;book:string;target:string;kind:'leader'|'member';assignedBy:string;date:string;status:'pending'|'in_progress'|'completed'};
export type LessonResponse={assignment:string;lesson:string;answers:Record<string,string>;submitted:boolean;reviewed:boolean;feedback:string;updated:string};
export type FormationState={assignments:Assignment[];books?:FormationBook[];responses?:LessonResponse[]};
export function catalog(s:FormationState){return s.books??formationBooks}
export function publicBook(b:FormationBook){return {id:b.id,title:b.title,published:b.published,cover:b.coverData?'/api/formation/assets?book='+encodeURIComponent(b.id)+'&kind=cover':null,hasPdf:!!b.pdfData,pdfName:b.pdfName,lessons:b.lessons}}
export type ClientBook=ReturnType<typeof publicBook>;
export type FormationPayload={books:ClientBook[];own:Assignment[];responses:LessonResponse[];assignments:(Assignment&{name?:string})[];leaders:{id:string;name:string}[];members:{id:string;name:string;cell:string}[];canGrant:boolean;canEdit:boolean;revision:number};
export function canEditBooks(a:Actor){return a.role==='admin'||a.role==='pastor'}
export function canOpenBook(a:Actor,id:string,s:FormationState){return canGrantBooks(a)||ownAssignments(a,s).some(x=>x.book===id)}
export function canGrantBooks(a:Actor){return ['admin','pastor','sector_leader'].includes(a.role)}
export function eligibleLeaders(a:Actor,accounts:FormationAccount[],data:ChurchData){
 const cells=visibleCells(a,data);
 return canGrantBooks(a)?accounts.filter(t=>t.role==='cell_leader'&&!!t.cell&&cells.has(t.cell)):[];
}
export function ownAssignments(a:Actor,s:FormationState){return s.assignments.filter(x=>x.kind==='leader'?x.target===a.id:!!a.person&&x.target===a.person)}
export function canAssignMember(a:Actor,book:string,person:string,s:FormationState,data:ChurchData){
 const p=data.people.find(p=>p.id===person);if(!p)return false;
 if(canGrantBooks(a))return visibleCells(a,data).has(p.cell);
 return a.role==='cell_leader'&&p.cell===a.cell&&s.assignments.some(x=>x.kind==='leader'&&x.target===a.id&&x.book===book);
}
export function canManageAssignment(a:Actor,x:Assignment,s:FormationState,data:ChurchData,accounts:FormationAccount[]){
 return x.kind==='leader'?eligibleLeaders(a,accounts,data).some(t=>t.id===x.target):canAssignMember(a,x.book,x.target,s,data);
}
