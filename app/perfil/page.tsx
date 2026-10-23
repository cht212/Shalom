import ProfileWorkspace from '../profile-workspace';
import ProfileNavigation from '../profile-navigation';
import {UserRound,LayoutDashboard,PenLine,LogOut,ArrowRight,ShieldCheck,BookOpen} from 'lucide-react';
import {requireShalomUser} from '../auth';
import {actor,state} from '../../lib/server';
import {roleNames} from '../../lib/access';
export const dynamic='force-dynamic';
export default async function Profile(){
 await requireShalomUser('/perfil');const a=await actor();if(!a)return null;
 const {data}=await state();const person=data.people.find(p=>p.id===a.person);const cell=data.cells.find(c=>c.id===(a.cell||person?.cell));const sector=data.sectors.find(s=>s.id===(a.sector||cell?.sector));
 return <div className="profilepage"><ProfileNavigation actor={a}/><main className="profilemain"><span className="eyebrow">MI ESPACIO EN SHALOM</span><h1>Mi perfil</h1><section className="panel profileidentity"><span className="avatar"><UserRound size={30}/></span><h2>{a.name}</h2>{!a.email.endsWith('@shalom.local')&&<p>{a.email}</p>}<span className="pill"><ShieldCheck size={13}/>{roleNames[a.role]}</span>{cell&&<p><b>Célula:</b> {cell.name}</p>}{sector&&<p><b>Sector:</b> {sector.name}</p>}{a.role==='pending'&&<div className="notice neutral">El administrador debe asignarte un rol para activar tus devocionales y tu panel.</div>}</section><ProfileWorkspace/><div className="profilelinks"><a className="panel" href="/panel"><LayoutDashboard size={23}/><span><b>Mi panel</b><small>Accede a las opciones de tu rol.</small></span><ArrowRight size={19}/></a>{a.role!=='pending'&&<a className="panel" href="/?view=devocional"><PenLine size={23}/><span><b>{a.role==='disciple'?'Mis devocionales':'Mi devocional'}</b><small>{a.role==='disciple'?'Mis reflexiones y el acompañamiento de mi líder.':'Escribe tu reflexión y consulta las que enviaste.'}</small></span><ArrowRight size={19}/></a>}<a className="panel" href="/"><BookOpen size={23}/><span><b>Volver al inicio</b><small>El versículo de hoy y tu Biblia.</small></span><ArrowRight size={19}/></a></div><a className="outline" href="/api/auth/logout" target="_top"><LogOut size={17}/>Cerrar sesión</a></main></div>
}
