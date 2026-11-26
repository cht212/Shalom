'use client';
import {useId,useRef,useState} from 'react';
import {BookOpen,Search} from 'lucide-react';
import books from '../public/bible/books.json';
import {searchBibleReferences,type BibleReferenceMatch} from '../lib/bible-reference';

function label(match:BibleReferenceMatch){return match.book.name+(match.chapter?' '+match.chapter:'')+(match.verse?':'+match.verse:'')}
export default function HeaderSearch({onSearch}:{onSearch:(query:string)=>void}){
 const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(-1);
 const input=useRef<HTMLInputElement>(null),id=useId();
 const found=searchBibleReferences(query.trim().replace(/[:,]$/,''),books),matches=found.matches.slice(0,6),visible=open&&!!query.trim();
 function finish(value:string){if(!value.trim())return;setOpen(false);setActive(-1);setQuery('');input.current?.blur();onSearch(value.trim())}
 function choose(match:BibleReferenceMatch){if(!match.error){setQuery(label(match));finish(label(match))}}
 return <form className="header-bible-search" role="search" onSubmit={event=>{event.preventDefault();if(active>=0&&matches[active]&&!matches[active].error)choose(matches[active]);else finish(query)}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
  <input ref={input} type="search" role="combobox" aria-label="Buscar libro o referencia bíblica" aria-autocomplete="list" aria-expanded={visible} aria-controls={id} aria-activedescendant={visible&&active>=0?id+'-'+active:undefined} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={80} value={query} placeholder="" onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true);setActive(-1)}} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);setActive(-1)}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);setActive(index=>!matches.length?-1:event.key==='ArrowDown'?Math.min(index+1,matches.length-1):Math.max(index-1,0))}}}/>
  <button type="submit" aria-label="Buscar"><Search size={18}/></button>
  {visible&&<div className="header-search-results"><ul id={id} role="listbox" aria-label="Coincidencias de la Biblia">{matches.map((match,index)=><li role="presentation" key={match.book.id}><button id={id+'-'+index} type="button" role="option" aria-selected={active===index} disabled={!!match.error} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(match)}><BookOpen size={16}/><span>{label(match)}{match.error&&<small>{match.error}</small>}</span></button></li>)}</ul>{!matches.length&&<p role="status">{found.error||'No hay coincidencias. Prueba otro nombre o abreviatura.'}</p>}</div>}
 </form>;
}
