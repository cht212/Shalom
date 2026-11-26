'use client';

import {useRouter} from 'next/navigation';
import type {Actor} from '../lib/access';
import ReaderHeader from './reader-header';
import {useSession} from './use-session';

export default function ProfileNavigation({actor}:{actor:Actor}){
 useSession(actor);
 const router=useRouter();
 return <ReaderHeader
  actor={actor}
  view="profile"
  onHome={()=>router.push('/')}
  onRead={()=>router.push('/?view=bible')}
  onSaved={()=>router.push('/?view=saved')}
  onDevotional={()=>router.push('/?view=devocional')}
 />;
}
