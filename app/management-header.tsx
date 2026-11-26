'use client';
import {useEffect,useRef} from 'react';
import Link from 'next/link';
import {House,UserRound} from 'lucide-react';
import Brand from './brand';
import ThemeToggle from './theme-toggle';
import {useSession} from './use-session';
import {roleNames,type Actor} from '../lib/access';

export default function ManagementHeader({actor}:{actor:Actor}){
 useSession(actor);
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{const header=ref.current;if(!header)return;const measure=()=>document.documentElement.style.setProperty('--app-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');const observer=new ResizeObserver(measure);measure();observer.observe(header);return()=>observer.disconnect()},[]);
 return <header ref={ref} className="management-header"><div className="management-identity"><Brand/><div><strong>{actor.role==='admin'?'Administración':actor.role==='cell_leader'?'Mi célula':actor.role==='sector_leader'?'Mi sector':'Mi iglesia'}</strong><small>{roleNames[actor.role]}</small></div></div><div className="management-header-actions"><Link href="/" aria-label="Volver a Shalom" title="Volver a Shalom"><House size={19}/></Link><ThemeToggle variant="inline"/><Link href="/perfil" aria-label="Mi perfil" title="Mi perfil"><UserRound size={19}/></Link></div></header>;
}
