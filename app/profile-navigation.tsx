'use client';

import {useSyncExternalStore} from 'react';
import {BookOpen,Bookmark,ChevronDown,Church,LogOut,Menu,PenLine,UserRound} from 'lucide-react';
import Link from 'next/link';
import type {Role} from '../lib/access';
import Brand from './brand';
import ThemeToggle from './theme-toggle';

const collapsedKey='shalom-profile-nav-collapsed';
const navigationChange='shalom-profile-navigation-change';
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

export default function ProfileNavigation({role}:{role:Role}){
 const collapsed=useSyncExternalStore(subscribeNavigation,navigationIsCollapsed,()=>false);

 function toggleNavigation(){
  const next=!navigationIsCollapsed();
  try{localStorage.setItem(collapsedKey,String(next))}catch{}
  window.dispatchEvent(new Event(navigationChange));
 }

 const links=<>
  <Link href="/"><Church/><span>Inicio</span></Link>
  <Link href="/?view=bible"><BookOpen/><span>Biblia</span></Link>
  <Link href="/?view=saved"><Bookmark/><span>Guardados</span></Link>
  {role!=='pending'&&<Link href="/?view=devocional"><PenLine/><span>Devocional</span></Link>}
  <Link href="/perfil" aria-current="page"><UserRound/><span>Perfil</span></Link>
 </>;

 return <>
  <header className="readerheader compactheader profileheader">
   <Brand/>
   <nav className="profile-nav" aria-label="Navegación principal">{links}</nav>
   <div className="profile-header-actions">
    <button className="profile-menu-toggle" aria-label={collapsed?'Desplegar navegación':'Comprimir navegación'} aria-expanded={!collapsed} aria-controls="profile-mobile-nav" onClick={toggleNavigation}>
     {collapsed?<Menu size={21}/>:<ChevronDown size={21}/>}
    </button>
    <ThemeToggle variant="inline"/>
    <a className="profile-signout" aria-label="Cerrar sesión" title="Cerrar sesión" href="/api/auth/logout" target="_top"><LogOut/></a>
   </div>
  </header>
  <nav id="profile-mobile-nav" className="profile-mobile-nav" hidden={collapsed} aria-label="Navegación principal">{links}</nav>
 </>;
}
