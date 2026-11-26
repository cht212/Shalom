'use client';

import {useEffect,useRef} from 'react';
import Link from 'next/link';
import {BookOpen,Bookmark,LayoutDashboard,LogIn,PenLine,UserRound,Home} from 'lucide-react';
import {useSession} from './use-session';
import type {Actor} from '../lib/access';

export default function ReaderNav({actor,sessionLoading=false,view,onHome,onRead,onSaved,onDevotional}:{actor:Actor|null;sessionLoading?:boolean;view:'home'|'bible'|'saved'|'devotional'|'profile';onHome:()=>void;onRead:()=>void;onSaved:()=>void;onDevotional:()=>void}){
 const {studyOwner}=useSession();
 const shell=useRef<HTMLElement>(null);
 useEffect(()=>{let frame=0;let previous=-1;let closed=false;const measure=()=>{if(frame||closed)return;frame=requestAnimationFrame(()=>{frame=0;if(closed)return;const height=shell.current?Math.ceil(shell.current.getBoundingClientRect().height):0;if(height===previous)return;previous=height;document.documentElement.style.setProperty('--reader-nav-height',height+'px')})};measure();document.fonts?.ready.then(measure);window.addEventListener('resize',measure);return()=>{closed=true;cancelAnimationFrame(frame);window.removeEventListener('resize',measure)}},[actor?.role]);
 useEffect(()=>()=>{document.documentElement.style.removeProperty('--reader-nav-height')},[]);
 return <nav ref={shell} className="reader-nav-shell" aria-label="Navegación principal"><div id="reader-nav-items" className="reader-nav-items">
  <button className={'app-only-nav-item '+(view==='home'?'current':'')} aria-current={view==='home'?'page':undefined} onClick={onHome}><Home size={21}/><span>Inicio</span></button>
  <button className={'app-only-nav-item '+(view==='bible'?'current':'')} aria-current={view==='bible'?'page':undefined} onClick={onRead}><BookOpen size={21}/><span>Biblia</span></button>
  <button className={'app-only-nav-item '+(view==='saved'?'current':'')} aria-current={view==='saved'?'page':undefined} onClick={onSaved}><Bookmark size={21}/><span>Guardados</span></button>
  {sessionLoading&&!actor&&<span className="app-only-nav-item reader-nav-placeholder" aria-hidden="true"/>}
  {(actor?actor.role!=='pending':!!studyOwner)&&<button className={'app-only-nav-item '+(view==='devotional'?'current':'')} aria-current={view==='devotional'?'page':undefined} onClick={onDevotional}><PenLine size={21}/><span>Devocional</span></button>}
  {sessionLoading&&!actor?<span className="app-only-nav-item reader-nav-placeholder" role="status" aria-label="Cargando sesión"/>:actor||studyOwner?<Link className={'app-only-nav-item '+(view==='profile'?'current':'')} href="/perfil" aria-current={view==='profile'?'page':undefined}><UserRound size={21}/><span>Perfil</span></Link>:<Link className="app-only-nav-item" href="/ingresar?return_to=/"><LogIn size={21}/><span>Entrar</span></Link>}

  <button className={'web-only-nav-item '+(view==='home'?'current':'')} aria-current={view==='home'?'page':undefined} onClick={onHome}><Home size={19}/><span>Inicio</span></button>
  <button className={'web-only-nav-item '+(view==='saved'?'current':'')} aria-current={view==='saved'?'page':undefined} onClick={onSaved}><Bookmark size={19}/><span>Guardados</span></button>
  <button className={'web-only-nav-item '+(view==='bible'?'current':'')} aria-current={view==='bible'?'page':undefined} onClick={onRead}><BookOpen size={19}/><span>Biblia</span></button>
  {actor?<Link className="web-only-nav-item web-account-link" href="/panel"><LayoutDashboard size={19}/><span>Mi panel</span></Link>:<Link className="web-only-nav-item web-account-link" href="/ingresar?return_to=/panel"><LogIn size={19}/><span>Iniciar sesión</span></Link>}
 </div></nav>;
}
