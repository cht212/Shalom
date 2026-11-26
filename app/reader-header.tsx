'use client';

import {Search} from 'lucide-react';
import type {Actor} from '../lib/access';
import Brand from './brand';
import ReaderNav from './reader-nav';
import ThemeToggle from './theme-toggle';

type ReaderView='home'|'bible'|'saved'|'devotional'|'profile';

export default function ReaderHeader({actor,sessionLoading=false,view,onSearch,onHome,onRead,onSaved,onDevotional}:{actor:Actor|null;sessionLoading?:boolean;view:ReaderView;onSearch?:()=>void;onHome:()=>void;onRead:()=>void;onSaved:()=>void;onDevotional:()=>void}){
 return <header className="readerheader compactheader"><Brand/><ReaderNav actor={actor} sessionLoading={sessionLoading} view={view} onHome={onHome} onRead={onRead} onSaved={onSaved} onDevotional={onDevotional}/><div className="reader-header-actions">{onSearch&&<button className="header-bible-search" onClick={onSearch} aria-label="Buscar libro o referencia bíblica"><Search size={18}/><span>Buscar en la Biblia</span></button>}<ThemeToggle variant="inline"/></div></header>;
}
