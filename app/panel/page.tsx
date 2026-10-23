import {requireShalomUser} from '../auth';
import {actor} from '../../lib/server';
import Dashboard from '../dashboard';
import RolePanel from './role-panel';
export const dynamic='force-dynamic';
export default async function Panel(){await requireShalomUser('/panel');const a=await actor();if(!a)return null;return a.role==='admin'?<Dashboard/>:<RolePanel actor={a}/>}
