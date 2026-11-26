'use client';
import {forwardRef,useEffect,useId,useImperativeHandle,useRef,useState} from 'react';
import {BookOpen,ChevronRight,Search,X} from 'lucide-react';
import books from '../public/bible/books.json';
import {readBibleBook,type Verse} from '../lib/bible-client';
import {searchBibleReferences,type BibleReferenceMatch} from '../lib/bible-reference';
import {isOnline} from './use-online';
import {BIBLE_VERSIONS,type BibleVersion} from '../lib/bible-versions';
import './bible-navigator.css';

type Step='books'|'chapters'|'verses';
export type BibleNavigatorHandle={openSearch:(query?:string)=>void};
const BibleNavigator=forwardRef<BibleNavigatorHandle,{book:string;chapter:number;verse:string;version:BibleVersion;disabled:boolean;chapterVerses?:Verse[];reading?:boolean;onNavigate:(book:string,chapter:number,verse?:string)=>void}>(function BibleNavigator({book,chapter,verse,version,disabled,chapterVerses=[],reading=false,onNavigate},ref){
 const [step,setStep]=useState<Step>('books'),[chosenBook,setChosenBook]=useState(book),[chosenChapter,setChosenChapter]=useState(chapter),[query,setQuery]=useState(''),[testament,setTestament]=useState<'all'|'old'|'new'>('all'),[availableVerses,setAvailableVerses]=useState<Verse[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),oldOverflow=useRef(''),scrollLocked=useRef(false);
 const titleId=useId(),resultsId=useId(),chosen=books.find(item=>item.id===chosenBook)!;
 const found=searchBibleReferences(query,books);
 useEffect(()=>()=>{controller.current?.abort();if(scrollLocked.current)document.documentElement.style.overflow=oldOverflow.current},[]);
 useEffect(()=>{
  const viewport=window.visualViewport;
  if(!viewport)return;
  const sync=()=>dialog.current?.style.setProperty('--finder-height',`${Math.max(280,viewport.height-8)}px`);
  sync();viewport.addEventListener('resize',sync);viewport.addEventListener('scroll',sync);
  return()=>{viewport.removeEventListener('resize',sync);viewport.removeEventListener('scroll',sync)};
 },[]);
 useEffect(()=>{
  if(query||step==='books'||!dialog.current?.open||loading)return;
  const frame=requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>('.bible-number-grid .chosen, .bible-number-grid button')?.focus());
  return()=>cancelAnimationFrame(frame);
 },[step,query,loading,availableVerses]);
 function close(){controller.current?.abort();setLoading(false);if(scrollLocked.current){document.documentElement.style.overflow=oldOverflow.current;scrollLocked.current=false}dialog.current?.close()}
 function open(next:Step,focusSearch=false,initialQuery=''){
  controller.current?.abort();setQuery(initialQuery);setError('');setTestament('all');setChosenBook(book);setChosenChapter(chapter);setStep(next);setAvailableVerses([]);
  oldOverflow.current=document.documentElement.style.overflow;scrollLocked.current=true;document.documentElement.style.overflow='hidden';dialog.current?.showModal();
  dialog.current?.querySelector('.bible-finder-content')?.scrollTo({top:0});
  if(focusSearch)input.current?.focus();
  if(next==='verses')void loadVerses(book,chapter);else setLoading(false);
 }
 useImperativeHandle(ref,()=>({openSearch:(initialQuery='')=>open('books',true,initialQuery)}));
 function chooseBook(id:string){controller.current?.abort();setChosenBook(id);setChosenChapter(id===book?chapter:1);setQuery('');setError('');setStep('chapters');setAvailableVerses([]);setLoading(false)}
 async function loadVerses(id:string,number:number){
  controller.current?.abort();const request=new AbortController();controller.current=request;
  setChosenBook(id);setChosenChapter(number);setStep('verses');setQuery('');setError('');setLoading(true);setAvailableVerses([]);
  try{const data=await readBibleBook(id,request.signal,version);if(request.signal.aborted)return;if(!data[number]?.length)throw Error('No se encontró ese capítulo.');setAvailableVerses(data[number]);}
  catch(error){if(!request.signal.aborted)setError(isOnline()&&error instanceof Error&&!(error instanceof TypeError)?error.message:'Este libro todavía no está descargado. Conéctate para abrirlo o descarga la Biblia completa.');}
  finally{if(!request.signal.aborted)setLoading(false)}
 }
 function go(id:string,number:number,selected?:string){if(disabled)return;close();onNavigate(id,number,selected)}
 async function chooseReference(match:BibleReferenceMatch){
  if(match.error||disabled||loading)return;
  if(match.chapter===undefined){chooseBook(match.book.id);return}
  if(match.verse===undefined){go(match.book.id,match.chapter);return}
  controller.current?.abort();const request=new AbortController();controller.current=request;setLoading(true);setError('');
  try{
   const data=await readBibleBook(match.book.id,request.signal,version);if(request.signal.aborted)return;
   const verses=data[match.chapter]||[];
   if(!verses.some(item=>item.verse===match.verse)){setError(`${match.book.name} ${match.chapter} tiene ${verses.length} versículos. Elige un versículo de ese capítulo.`);return}
   go(match.book.id,match.chapter,match.verse);
  }catch(error){if(!request.signal.aborted)setError(isOnline()&&error instanceof Error&&!(error instanceof TypeError)?error.message:'Este libro no está descargado. Conéctate para abrir esta referencia.');}
  finally{if(!request.signal.aborted)setLoading(false)}
 }
 function backTo(next:Step){controller.current?.abort();setQuery('');setError('');setLoading(false);setStep(next);if(next==='verses')void loadVerses(chosenBook,chosenChapter)}
 function resultLabel(match:BibleReferenceMatch){return match.book.name+(match.chapter?' '+match.chapter:'')+(match.verse?':'+match.verse:'')}
 const bookSections=[{id:'old',title:'Antiguo Testamento',entries:books.slice(0,39)},{id:'new',title:'Nuevo Testamento',entries:books.slice(39)}];
 return <div className="bible-navigation">
  <div className="bible-compact-selectors" role="group" aria-label="Elegir libro, capítulo y versículo"><label>Libro<select aria-label="Libro de la Biblia" value={book} disabled={disabled} onChange={event=>onNavigate(event.target.value,1)}>{books.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Capítulo<select aria-label="Capítulo de la Biblia" value={chapter} disabled={disabled} onChange={event=>onNavigate(book,Number(event.target.value))}>{Array.from({length:books.find(item=>item.id===book)!.chapters},(_,index)=>index+1).map(number=><option key={number} value={number}>{number}</option>)}</select></label><label>Versículo<select aria-label="Versículo de la Biblia" value={verse} disabled={disabled||reading||!chapterVerses.length} onChange={event=>onNavigate(book,chapter,event.target.value||undefined)}><option value="">Todos</option>{chapterVerses.map(item=><option key={item.verse} value={item.verse}>{item.verse}</option>)}</select></label></div>
  <dialog ref={dialog} className="bible-finder" aria-labelledby={titleId} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}}} onClick={event=>{if(event.target===dialog.current)close()}} onClose={()=>{if(!dialog.current?.open){controller.current?.abort();if(scrollLocked.current){document.documentElement.style.overflow=oldOverflow.current;scrollLocked.current=false}}}}>
   <div className="bible-finder-heading"><div><span className="eyebrow">{BIBLE_VERSIONS.find(item=>item.id===version)?.shortName}</span><h2 id={titleId}>Encuentra tu lectura</h2></div><button type="button" className="bible-finder-close" autoFocus onClick={close} aria-label="Cerrar buscador de Biblia"><X size={22}/></button></div>
   <form className="bible-reference-search" role="search" onSubmit={event=>{event.preventDefault();const options=found.matches.filter(match=>!match.error);if(options.length===1)void chooseReference(options[0]);else setError('Elige el libro o la referencia de la lista.');}}><Search size={20}/><input ref={input} type="search" autoComplete="off" spellCheck={false} maxLength={80} aria-label="Buscar libro, capítulo o versículo" aria-controls={resultsId} placeholder="Pedro, Salmos 23, Juan 3:16…" value={query} onFocus={()=>window.setTimeout(()=>input.current?.scrollIntoView({block:'center',behavior:'smooth'}),180)} onChange={event=>{controller.current?.abort();setLoading(false);setQuery(event.target.value);setStep('books');setError('')}} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();document.getElementById(resultsId)?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()}}}/></form>
   {!query&&<div className="bible-finder-steps" role="group" aria-label="Seleccionar pasaje"><button type="button" aria-current={step==='books'?'step':undefined} onClick={()=>backTo('books')}>1. Libro</button><ChevronRight size={15}/><button type="button" aria-current={step==='chapters'?'step':undefined} onClick={()=>backTo('chapters')}>2. Capítulo</button><ChevronRight size={15}/><button type="button" aria-current={step==='verses'?'step':undefined} onClick={()=>backTo('verses')}>3. Versículo</button></div>}
   {step==='books'&&!query&&<div className="bible-testament-tabs" role="group" aria-label="Filtrar libros"><button type="button" aria-pressed={testament==='all'} onClick={()=>setTestament('all')}>Todos</button><button type="button" aria-pressed={testament==='old'} onClick={()=>setTestament('old')}>Antiguo</button><button type="button" aria-pressed={testament==='new'} onClick={()=>setTestament('new')}>Nuevo</button></div>}
   <div className="bible-finder-content" id={resultsId} aria-busy={loading}>
    {(error||found.error)&&<p className="bible-finder-error" role="alert">{error||found.error}</p>}
    {loading&&<p className="bible-finder-status" role="status">Abriendo el capítulo…</p>}
    {query?<><p className="bible-finder-status" role="status">{found.matches.length?`${found.matches.length} ${found.matches.length===1?'coincidencia':'coincidencias'}`:found.error?'Revisa la referencia.':'No encontramos ese libro. Prueba con su nombre o abreviatura.'}</p><ul className="bible-book-list">{found.matches.map(match=><li key={match.book.id}><button type="button" disabled={disabled||loading||!!match.error} onClick={()=>void chooseReference(match)}><BookOpen size={20}/><span><b>{resultLabel(match)}</b><small>{match.error||(match.verse?'Ir al versículo':match.chapter?'Leer el capítulo':match.book.chapters+' capítulos')}</small></span><ChevronRight size={18}/></button></li>)}</ul></>:
     step==='books'?bookSections.filter(section=>testament==='all'||section.id===testament).map(section=><section key={section.id}><h3 className="bible-book-section">{section.title}</h3><ul className="bible-book-list">{section.entries.map(item=><li key={item.id}><button type="button" aria-current={item.id===chosenBook?'true':undefined} disabled={disabled} onClick={()=>chooseBook(item.id)}><span><b>{item.name}</b><small>{item.chapters} {item.chapters===1?'capítulo':'capítulos'}</small></span><ChevronRight size={18}/></button></li>)}</ul></section>):
     step==='chapters'?<><h3 className="bible-grid-heading">{chosen.name}</h3><p className="bible-finder-status">Elige el capítulo que quieres leer.</p><div className="bible-number-grid" role="group" aria-label={'Capítulos de '+chosen.name}>{Array.from({length:chosen.chapters},(_,index)=>index+1).map(number=><button type="button" key={number} className={number===chosenChapter?'chosen':''} aria-label={chosen.name+', capítulo '+number} disabled={disabled} onClick={()=>void loadVerses(chosenBook,number)}>{number}</button>)}</div></>:
     <><h3 className="bible-grid-heading">{chosen.name} {chosenChapter}</h3><p className="bible-finder-status">Toca un versículo para ir directamente a él.</p><div className="bible-number-grid" role="group" aria-label={'Versículos de '+chosen.name+' '+chosenChapter}>{availableVerses.map(item=><button type="button" key={item.verse} className={chosenBook===book&&chosenChapter===chapter&&item.verse===verse?'chosen':''} aria-label={chosen.name+' '+chosenChapter+':'+item.verse} disabled={disabled||loading} onClick={()=>go(chosenBook,chosenChapter,item.verse)}>{item.verse}</button>)}</div>{error&&!loading&&<button type="button" className="outline" onClick={()=>void loadVerses(chosenBook,chosenChapter)}>Volver a intentar</button>}</>}
   </div>
   {!query&&step!=='books'&&<div className="bible-finder-footer"><button type="button" className="primary" disabled={disabled||loading} onClick={()=>go(chosenBook,chosenChapter)}>Leer capítulo completo <ChevronRight size={18}/></button></div>}
  </dialog>
 </div>;
});
export default BibleNavigator;
