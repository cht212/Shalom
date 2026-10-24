export type Role='admin'|'disciple'|'cell_leader'|'sector_leader'|'pastor'|'pending';
export type Actor={id:string;email:string;name:string;role:Role;cell:string|null;sector:string|null;person:string|null};
export const roleNames:Record<Role,string>={admin:'Administrador principal',disciple:'Discípulo',cell_leader:'Líder de célula',sector_leader:'Líder de sector',pastor:'Pastor',pending:'Pendiente de asignación'};
export function canAccessPanel(role:Role){return ['admin','cell_leader','sector_leader','pastor'].includes(role)}
export type Sector={id:string;name:string};
export type Cell={id:string;name:string;sector:string;leader:string;day?:string;address?:string;timothy?:string;leaderPhone?:string;time?:string};
export type Person={id:string;name:string;phone:string;email?:string;age?:number;address?:string;maritalStatus?:string;cell:string;joined:string;consentedAt?:string;churchAttendance?:boolean;houseOfPeaceAttendance?:boolean;titheNumber?:string;basicDiscipleshipLevel?:string;encounter?:boolean;reencounter?:boolean};
export type Attendance={id:string;person:string;cell:string;date:string};
export type ReportSnapshot={cell:{id:string;name:string;leader:string;sector:string};month:string;sections:{title:string;headers:string[];rows:string[][]}[];missing:{name:string;fields:string[]}[];total:number};
export type Report={id:string;cell:string;month:string;notes:string;date:string;status?:string;snapshot?:ReportSnapshot;previewToken?:string;sentAt?:string|null;reviewedBy?:string;reviewedAt?:string};
export type ChurchData={sectors:Sector[];cells:Cell[];people:Person[];attendance:Attendance[];reports:Report[];devotions:Record<string,unknown>[]};
export const emptyChurch:ChurchData={sectors:[],cells:[],people:[],attendance:[],reports:[],devotions:[]};
export function visibleCells(actor:Actor,data:ChurchData):Set<string>{
 if(actor.role==='admin'||actor.role==='pastor')return new Set(data.cells.map(c=>c.id));
 if(actor.role==='sector_leader')return new Set(data.cells.filter(c=>c.sector===actor.sector).map(c=>c.id));
 if(actor.role==='cell_leader')return new Set(data.cells.filter(c=>c.id===actor.cell).map(c=>c.id));
 if(actor.role==='disciple'){const p=data.people.find(p=>p.id===actor.person);return new Set(p?[p.cell]:[])}
 return new Set();
}
export function scopedData(actor:Actor,data:ChurchData):ChurchData{
 if(actor.role==='pending')return emptyChurch;
 const ids=visibleCells(actor,data);const own=actor.role==='disciple';const cells=data.cells.filter(c=>ids.has(c.id));
 return {sectors:data.sectors.filter(s=>cells.some(c=>c.sector===s.id)),cells,people:data.people.filter(p=>own?p.id===actor.person:ids.has(p.cell)),attendance:data.attendance.filter(a=>own?a.person===actor.person:ids.has(a.cell)),reports:own?[]:data.reports.filter(r=>ids.has(r.cell)&&(actor.role!=='pastor'||r.status==='sent')),devotions:actor.role==='admin'?data.devotions:[]};
}
export function canReview(actor:Actor,cell:string,data:ChurchData){return ['admin','cell_leader','sector_leader','pastor'].includes(actor.role)&&visibleCells(actor,data).has(cell)}
export function canReadDevotion(actor:Actor,devotion:{author:string;cell:string},data:ChurchData){
 return actor.role!=='pending'&&(devotion.author===actor.id||actor.role==='admin'||actor.role==='pastor'||canReview(actor,devotion.cell,data));
}
