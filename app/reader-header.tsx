'use client';

import {useEffect,useRef,useState} from 'react';
import {Search} from 'lucide-react';
import type {Actor} from '../lib/access';
import Brand from './brand';
import ReaderNav from './reader-nav';
import ThemeToggle from './theme-toggle';

type ReaderView='home'|'bible'|'saved'|'devotional'|'profile';

export default function ReaderHeader({actor,sessionLoading=false,view,onSearch,onHome,onRead,onSaved,onDevotional}:{actor:Actor|null;sessionLoading?:boolean;view:ReaderView;onSearch?:(query:string)=>void;onHome:()=>void;onRead:()=>void;onSaved:()=>void;onDevotional:()=>void}){
 const [query,setQuery]=useState('');
 const header=useRef<HTMLElement>(null);
 useEffect(()=>{const element=header.current;if(!element)return;const measure=()=>document.documentElement.style.setProperty('--app-header-height',Math.ceil(element.getBoundingClientRect().height)+'px');measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect()},[]);
 return <header ref={header} className="readerheader compactheader"><Brand/><ReaderNav actor={actor} sessionLoading={sessionLoading} view={view} onHome={onHome} onRead={onRead} onSaved={onSaved} onDevotional={onDevotional}/><div className="reader-header-actions">{onSearch&&<form className="header-bible-search" role="search" onSubmit={event=>{event.preventDefault();if(query.trim())onSearch(query.trim())}}><Search size={18}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Libro o referencia" aria-label="Buscar libro o referencia bíblica"/><button type="submit" aria-label="Buscar">Ir</button></form>}<ThemeToggle variant="inline"/></div></header>;
}
