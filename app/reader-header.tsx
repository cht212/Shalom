'use client';

import {ChevronDown,Menu} from 'lucide-react';
import type {Actor} from '../lib/access';
import Brand from './brand';
import ReaderNav from './reader-nav';
import ThemeToggle from './theme-toggle';

type ReaderView='home'|'bible'|'saved'|'devotional'|'profile';

export default function ReaderHeader({actor,sessionLoading=false,view,collapsed,onToggle,onHome,onRead,onSaved,onDevotional}:{actor:Actor|null;sessionLoading?:boolean;view:ReaderView;collapsed:boolean;onToggle:()=>void;onHome:()=>void;onRead:()=>void;onSaved:()=>void;onDevotional:()=>void}){
 return <header className="readerheader compactheader"><Brand/><ReaderNav actor={actor} sessionLoading={sessionLoading} view={view} collapsed={collapsed} onHome={onHome} onRead={onRead} onSaved={onSaved} onDevotional={onDevotional}/><div className="reader-header-actions"><ThemeToggle variant="inline"/><button className="header-nav-toggle" aria-label={collapsed?'Desplegar navegación':'Comprimir navegación'} aria-expanded={!collapsed} aria-controls="reader-nav-items" onClick={onToggle}>{collapsed?<Menu size={21}/>:<ChevronDown size={21}/>}</button></div></header>;
}
