'use client';

import {useEffect,useRef} from 'react';
import type {Actor} from '../lib/access';
import Brand from './brand';
import ReaderNav from './reader-nav';
import ThemeToggle from './theme-toggle';
import HeaderSearch from './header-search';

type ReaderView='home'|'bible'|'saved'|'devotional'|'profile';

export default function ReaderHeader({actor,sessionLoading=false,view,onSearch,onHome,onRead,onSaved,onDevotional}:{actor:Actor|null;sessionLoading?:boolean;view:ReaderView;onSearch?:(query:string)=>void;onHome:()=>void;onRead:()=>void;onSaved:()=>void;onDevotional:()=>void}){
 const header=useRef<HTMLElement>(null);
 useEffect(()=>{const element=header.current;if(!element)return;const measure=()=>document.documentElement.style.setProperty('--app-header-height',Math.ceil(element.getBoundingClientRect().height)+'px');measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect()},[]);
 return <header ref={header} className="readerheader compactheader"><Brand/><ReaderNav actor={actor} sessionLoading={sessionLoading} view={view} onHome={onHome} onRead={onRead} onSaved={onSaved} onDevotional={onDevotional}/><div className="reader-header-actions">{onSearch&&<HeaderSearch onSearch={onSearch}/>}<ThemeToggle variant="inline"/></div></header>;
}
