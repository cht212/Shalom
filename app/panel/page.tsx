import {requireShalomUser} from '../auth';
import {actor} from '../../lib/server';
import Dashboard from '../dashboard';
import RolePanel from './role-panel';
export const dynamic='force-dynamic';
export default async function Panel({searchParams}:{searchParams:Promise<{tab?:string}>}){await requireShalomUser('/panel');const a=await actor();if(!a)return null;const requested=(await searchParams).tab||'inicio';const allowed=a.role==='admin'?['inicio','celulas','personas','informes','devocionales','cuentas']:['cell_leader','sector_leader','pastor'].includes(a.role)?['inicio','devocionales','personas','informes']:['inicio','devocionales'];const initialTab=allowed.includes(requested)?requested:'inicio';return a.role==='admin'?<Dashboard initialPage={initialTab}/>:<RolePanel actor={a} initialTab={initialTab}/>}
