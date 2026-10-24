import {requireShalomUser} from '../auth';
import {actor} from '../../lib/server';
import Dashboard from '../dashboard';
import RolePanel from './role-panel';
import {redirect} from 'next/navigation';
import {canAccessPanel} from '../../lib/access';
export const dynamic='force-dynamic';
export default async function Panel({searchParams}:{searchParams:Promise<{tab?:string}>}){
 await requireShalomUser('/panel');
 const a=await actor();if(!a)return null;
 if(!canAccessPanel(a.role))redirect(a.role==='disciple'?'/?view=devocional':'/perfil');
 const requested=(await searchParams).tab||'inicio';
 const allowed=a.role==='admin'?['inicio','celulas','personas','informes','devocionales','cuentas']:['inicio','devocionales','personas','informes'];
 const initialTab=allowed.includes(requested)?requested:'inicio';
 return a.role==='admin'?<Dashboard initialPage={initialTab}/>:<RolePanel actor={a} initialTab={initialTab}/>;
}
