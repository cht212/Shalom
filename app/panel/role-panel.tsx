'use client';
import ManagementHeader from '../management-header';
import PanelSections from '../panel-sections';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {BookOpen,Home,Users,FileText,ShieldCheck,ArrowUpRight} from 'lucide-react';
import {type Actor,type ChurchData,emptyChurch,roleNames} from '../../lib/access';
import DevotionWorkspace from '../devotion-workspace';
import MemberRegistry from '../member-registry';
import ReportWorkspace from '../report-workspace';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima'}).format(new Date());
export default function RolePanel({actor,initialTab='inicio'}:{actor:Actor;initialTab?:string}){const [tab,setTab]=useState(initialTab),[data,setData]=useState<ChurchData>(emptyChurch),[loading,setLoading]=useState(actor.role!=='pending'),[error,setError]=useState(''),[month]=useState(today().slice(0,7));const leader=['cell_leader','sector_leader','pastor'].includes(actor.role);
 const load=useCallback(async()=>{if(actor.role==='pending')return;try{const r=await fetch('/api/data');const j=await r.json() as {data:ChurchData;error?:string};if(!r.ok)throw Error(j.error);setData(j.data)}catch(e){setError((e as Error).message)}finally{setLoading(false)}},[actor.role]);useEffect(()=>{void Promise.resolve().then(load)},[load]);
 const items=[{id:'inicio',label:'Resumen',icon:Home},{id:'devocionales',label:leader?'Devocionales':'Mis devocionales',icon:BookOpen},...(leader?[{id:'personas',label:'Personas',icon:Users},{id:'informes',label:'Informes',icon:FileText}]:[])];
 const received=data.reports.filter(r=>r.month===month).length;
 return <div className="bibleapp panel-shell"><ManagementHeader actor={actor}/><PanelSections items={items} current={tab} onSelect={setTab} label="Navegación de mi panel"/><div className="roleapp"><div className="rolelayout"><aside className="rolenav"><span className="eyebrow">{roleNames[actor.role]}</span>{items.map(n=><button key={n.id} className={tab===n.id?'chosen':''} onClick={()=>setTab(n.id)}><n.icon size={18}/>{n.label}</button>)}<div className="roleprofile"><span className="avatar">{actor.name[0]}</span><b>{actor.name}</b><small>{actor.email}</small></div></aside><main className="rolecontent"><div className="pageheading"><div><span className="eyebrow">{roleNames[actor.role]}</span><h1>{tab==='inicio'?'Bienvenido, '+actor.name.split(' ')[0]+'.':items.find(n=>n.id===tab)?.label}</h1><p className="subtitle">{actor.role==='disciple'?'Tu lectura, tus reflexiones y el acompañamiento de tu líder.':'Un espacio para cuidar y acompañar a tu comunidad.'}</p></div></div>{error&&<div className="notice error" role="alert">{error}</div>}
 {actor.role==='pending'?<section className="panel pendingaccess"><ShieldCheck size={38}/><h2>Tu cuenta está lista para leer.</h2><p>El administrador debe asignarte un rol y una célula para activar tu panel. Comunícale este correo:</p><b>{actor.email}</b><Link className="primary" href="/">Continuar leyendo la Biblia <ArrowUpRight size={16}/></Link></section>:loading?<div className="empty panel">Cargando tu panel…</div>:<>
 {tab==='inicio'&&<><div className="rolewelcome"><BookOpen size={32}/><span className="eyebrow">CRECEMOS EN LA PALABRA</span><h2>{leader?'Cada discípulo merece ser acompañado.':'Un capítulo puede iluminar tu día.'}</h2><p>{leader?'Revisa las reflexiones de tus discípulos y acompaña su crecimiento.':'Lee la Biblia, escribe lo que entendiste y compártelo con tu líder.'}</p><div className="headingactions"><button className="primary" onClick={()=>setTab('devocionales')}>{leader?'Revisar devocionales':'Mis devocionales'}<ArrowUpRight size={15}/></button></div></div><div className="reportstats">{leader?<><div><b>{data.cells.length}</b><span>Células en tu alcance</span></div><div><b>{data.people.length}</b><span>Personas</span></div><div><b>{received}/{data.cells.length}</b><span>Informes de este mes</span></div></>:<><div><b>{data.cells[0]?.name||'Por asignar'}</b><span>Mi célula</span></div><div><b>{data.cells[0]?.leader||'Tu líder'}</b><span>Mi líder de célula</span></div><div><b>{data.attendance.filter(a=>a.date.startsWith(month)).length}</b><span>Mis asistencias este mes</span></div></>}</div>{leader&&<div className="notice"><ShieldCheck size={19}/><span>Ves únicamente la información correspondiente a tu rol y asignación.</span></div>}</>}
 {tab==='devocionales'&&<DevotionWorkspace/>}
 {tab==='personas'&&leader&&<MemberRegistry/>}
 {tab==='informes'&&leader&&<ReportWorkspace/>}
 </>}</main></div></div></div>
}
