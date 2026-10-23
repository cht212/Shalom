'use client';

import {useSyncExternalStore} from 'react';
import {useRouter} from 'next/navigation';
import type {Actor} from '../lib/access';
import ReaderHeader from './reader-header';

const collapsedKey='shalom-reader-nav-collapsed';
const navigationChange='shalom-reader-navigation-change';

function subscribeNavigation(callback:()=>void){
 window.addEventListener('storage',callback);
 window.addEventListener(navigationChange,callback);
 return ()=>{
  window.removeEventListener('storage',callback);
  window.removeEventListener(navigationChange,callback);
 };
}

function navigationIsCollapsed(){
 try{return localStorage.getItem(collapsedKey)!=='false'}catch{return true}
}

export default function ProfileNavigation({actor}:{actor:Actor}){
 const router=useRouter();
 const collapsed=useSyncExternalStore(subscribeNavigation,navigationIsCollapsed,()=>true);

 function toggleNavigation(){
  const next=!navigationIsCollapsed();
  try{localStorage.setItem(collapsedKey,String(next))}catch{}
  window.dispatchEvent(new Event(navigationChange));
 }

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
