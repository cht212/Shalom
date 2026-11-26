import {requireShalomUser} from '../../auth';
import {actor} from '../../../lib/server';
import AppNavigation from '../../app-navigation';
import BookWorkspace from '../../book-workspace';
import {redirect} from 'next/navigation';
import {FORMATION_ENABLED} from '../../../lib/features';
export const dynamic='force-dynamic';
export default async function BookPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;await requireShalomUser('/formacion/'+encodeURIComponent(id));const a=await actor();if(!a)return null;
 if(!FORMATION_ENABLED)redirect('/perfil');
 return <div className="bibleapp"><AppNavigation actor={a}/><BookWorkspace id={id}/></div>;
}
