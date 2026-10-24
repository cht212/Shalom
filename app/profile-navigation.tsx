'use client';

import {useRouter} from 'next/navigation';
import type {Actor} from '../lib/access';
import ReaderHeader from './reader-header';
import {useSession} from './use-session';
import {useReaderNavigation} from './use-reader-navigation';

export default function ProfileNavigation({actor}:{actor:Actor}){
 useSession(actor);
 const router=useRouter();
 const {collapsed,toggleNavigation}=useReaderNavigation();

 return <ReaderHeader
  actor={actor}
  view="profile"
  collapsed={collapsed}
  onToggle={toggleNavigation}
  onHome={()=>router.push('/')}
  onRead={()=>router.push('/?view=bible')}
  onSaved={()=>router.push('/?view=saved')}
  onDevotional={()=>router.push('/?view=devocional')}
 />;
}
