'use client';
import {useEffect,useRef,useState} from 'react';
import {Bookmark,ChevronLeft,ChevronRight,Highlighter,PenLine,Square,Volume2,X} from 'lucide-react';
import books from '../public/bible/books.json';
import {useSession} from './use-session';
import ReaderHeader from './reader-header';
import DailyHome from './daily-home';
import NarrationPlayer from './narration-player';
import BibleNavigator from './bible-navigator';
import DevotionWorkspace from './devotion-workspace';
import {useStudy} from './use-study';
import OnlineOnly from './online-only';
import {readBibleBook} from '../lib/bible-client';
import type {Mark} from '../lib/study-storage';
import {useReaderNavigation} from './use-reader-navigation';
type Verse={verse:string;text:string};
export default function Bible({initialView,initialBook,initialChapter,initialVerse}:{initialView?:string;initialBook?:string;initialChapter?:number;initialVerse?:string}){
 const requestedBook=books.find(b=>b.id===initialBook&&Number.isInteger(initialChapter)&&initialChapter!>0&&initialChapter!<=b.chapters);
 const userNavigated=useRef(false);
 const {collapsed:navCollapsed,toggleNavigation}=useReaderNavigation();
 const {actor,loading:sessionLoading}=useSession();const [book,setBook]=useState(requestedBook?.id||'PSA'),[chapter,setChapter]=useState(requestedBook?initialChapter!:23),[verses,setVerses]=useState<Verse[]>([]),[reading,setReading]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(''),[savedView,setSavedView]=useState(initialView==='saved'),[font,setFont]=useState(20);const [audioRequest,setAudioRequest]=useState<{book:string;chapter:number}|null>(null);const [homeView,setHomeView]=useState(!requestedBook&&initialView!=='bible'&&initialView!=='saved');
 const [devotionalView,setDevotionalView]=useState(initialView==='devocional');
 const [loaded,setLoaded]=useState<{book:string;chapter:number}|null>(null);
 const [verseTarget,setVerseTarget]=useState<{book:string;chapter:number;verse:string}|null>(()=>requestedBook&&initialVerse&&/^\d{1,3}$/.test(initialVerse)&&Number(initialVerse)>0?{book:requestedBook.id,chapter:initialChapter!,verse:String(Number(initialVerse))}:null);
 const current=books.find(b=>b.id===book)!;const reference=current.name+' '+chapter;
 const {study,ready,saving,persist,notice,setNotice,conflict,exportLocal,exportBackup,hasBackup,selectCloud,keepLocal,canSync}=useStudy();
 useEffect(()=>{if(ready&&!userNavigated.current&&!new URLSearchParams(location.search).has('book')&&study.last&&books.some(b=>b.id===study.last?.book&&study.last.chapter>0&&study.last.chapter<=b.chapters)){const last=study.last;void Promise.resolve().then(()=>{setBook(last.book);setChapter(last.chapter)})}},[ready,study.last]);
 // Cached public shells still respect chapter and verse deep links.
 useEffect(()=>{const q=new URLSearchParams(location.search),id=q.get('book'),number=Number(q.get('chapter')),verse=q.get('verse');if(books.some(b=>b.id===id&&Number.isInteger(number)&&number>0&&number<=b.chapters)){void Promise.resolve().then(()=>{setBook(id!);setChapter(number);setHomeView(false);setSavedView(false);setDevotionalView(false);if(verse&&/^\d{1,3}$/.test(verse)&&Number(verse)>0)setVerseTarget({book:id!,chapter:number,verse:String(Number(verse))})})}},[]);
 useEffect(()=>{const controller=new AbortController();(async()=>{await Promise.resolve();if(controller.signal.aborted)return;setReading(true);setLoaded(null);setError('');setSelected('');setAudioRequest(null);try{const j=await readBibleBook(book,controller.signal);if(!j[chapter])throw Error('No se encontró el capítulo.');setVerses(j[chapter]);setLoaded({book,chapter})}catch(e){if(e instanceof Error&&e.name!=='AbortError')setError(navigator.onLine&&!(e instanceof TypeError)?e.message:'Este libro no está descargado. Conéctate para abrirlo o descarga la Biblia completa.')}finally{if(!controller.signal.aborted)setReading(false)}})();return()=>controller.abort()},[book,chapter]);
 useEffect(()=>{
  if(!verseTarget||reading||homeView||savedView||devotionalView||loaded?.book!==verseTarget.book||loaded.chapter!==verseTarget.chapter||book!==verseTarget.book||chapter!==verseTarget.chapter)return;
  const frame=requestAnimationFrame(()=>{
   if(verses.some(item=>item.verse===verseTarget.verse)){
    setSelected(verseTarget.verse);
    const element=document.getElementById('bible-verse-'+verseTarget.verse);
    element?.focus({preventScroll:true});element?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   }else setNotice('No se encontró ese versículo en el capítulo. Puedes elegirlo con el selector de versículos.');
   setVerseTarget(null);
  });return()=>cancelAnimationFrame(frame);
 },[verseTarget,reading,homeView,savedView,devotionalView,loaded,book,chapter,verses,setNotice]);
 function navigate(b:string,c:number,verse?:string){
  if(saving)return;userNavigated.current=true;setDevotionalView(false);setHomeView(false);setSavedView(false);setBook(b);setChapter(c);setSelected('');
  setVerseTarget(verse?{book:b,chapter:c,verse}:null);
  if(study.last?.book!==b||study.last.chapter!==c)void persist({...study,last:{book:b,chapter:c}});
 }
 function step(delta:number){const i=books.findIndex(b=>b.id===book);if(chapter+delta>current.chapters){if(i<65)navigate(books[i+1].id,1)}else if(chapter+delta<1){if(i>0)navigate(books[i-1].id,books[i-1].chapters)}else navigate(book,chapter+delta)}
 function marked(list:Mark[],v:string){return list.some(m=>m.book===book&&m.chapter===chapter&&m.verse===v)}
 function mark(kind:'highlights'|'bookmarks'){if(!selected)return;const list=study[kind];persist({...study,[kind]:marked(list,selected)?list.filter(m=>!(m.book===book&&m.chapter===chapter&&m.verse===selected)):[...list,{book,chapter,verse:selected}]})}
 function speak(){setAudioRequest({book,chapter})}
 return <div className="bibleapp"><ReaderHeader actor={actor} sessionLoading={sessionLoading} collapsed={navCollapsed} view={devotionalView?'devotional':homeView?'home':savedView?'saved':'bible'} onToggle={toggleNavigation} onDevotional={()=>{setAudioRequest(null);setDevotionalView(true);window.scrollTo({top:0,behavior:'smooth'})}} onHome={()=>{setDevotionalView(false);setAudioRequest(null);setHomeView(true);window.scrollTo({top:0,behavior:'smooth'})}} onRead={()=>{setDevotionalView(false);setAudioRequest(null);setHomeView(false);setSavedView(false);window.scrollTo({top:0,behavior:'smooth'})}} onSaved={()=>{setDevotionalView(false);setAudioRequest(null);setHomeView(false);setSavedView(true)}}/>
 <main className="bible-main">{(notice||conflict)&&<div role="status" className={'notice pwa-study-notice'+(conflict?' has-conflict':'')}>{notice||'Tienes un conflicto pendiente en tus guardados.'}{conflict&&<div className="pwa-actions"><button className="outline" onClick={exportLocal}>Descargar copia local</button><button className="outline" disabled={!canSync||saving} onClick={()=>{if(window.confirm('Se abrirá la versión de nube. Tu versión local quedará como respaldo.'))void selectCloud()}}>Usar versión de nube</button><button className="outline" disabled={!canSync||saving} onClick={()=>{if(window.confirm('Reemplazar los guardados de nube con tu copia local. La versión anterior quedará como respaldo en este dispositivo.'))void keepLocal()}}>Reemplazar nube con copia local</button></div>}{hasBackup&&<button className="textbtn" onClick={exportBackup}>Descargar respaldo anterior</button>}{!conflict&&<button aria-label="Cerrar aviso de guardados" onClick={()=>setNotice('')}><X size={16}/></button>}</div>}
 {devotionalView?<div className="personal-devotional-page"><OnlineOnly>{sessionLoading?<div className="empty panel">Cargando tu cuenta…</div>:actor?<DevotionWorkspace mode="personal" initialBook={book} initialChapter={chapter}/>:<div className="empty panel"><PenLine size={30}/><h2>Mi devocional</h2><p>Inicia sesión para escribir y enviar tu reflexión.</p><a className="primary" href="/ingresar?return_to=/%3Fview%3Ddevocional">Iniciar sesión</a></div>}</OnlineOnly></div>:homeView?<DailyHome onRead={navigate}/>:<><div className="readerlayout compactreader">
 <section className="readerpaper"><BibleNavigator book={book} chapter={chapter} verse={selected} disabled={saving} onNavigate={navigate}/>

 {savedView?<div className="savedpassages"><span className="eyebrow">PARA VOLVER A LEER</span><h2>Mis marcadores</h2>{study.bookmarks.length?study.bookmarks.map(m=><button key={m.book+m.chapter+m.verse} className="savedverse" onClick={()=>navigate(m.book,m.chapter,m.verse)}><Bookmark size={18}/>{books.find(b=>b.id===m.book)?.name} {m.chapter}:{m.verse}<ChevronRight size={16}/></button>):<div className="readerempty"><Bookmark size={28}/><p>Aún no tienes marcadores. Selecciona un versículo y pulsa Guardar.</p></div>}</div>:<><div className="chapterheading"><span className="eyebrow">REINA-VALERA 1909</span><h2>{reference}</h2><div className="readingcontrols"><button className={audioRequest?'audio playing':'audio'} onClick={()=>audioRequest?setAudioRequest(null):speak()} disabled={reading||!!error}>{audioRequest?<Square size={16}/>:<Volume2 size={17}/>}<span>{audioRequest?'Cerrar audio':'Escuchar'}</span></button><div className="fontcontrols"><button aria-label="Reducir tamaño de letra" disabled={font<=17} onClick={()=>setFont(font-1)}>A−</button><button aria-label="Aumentar tamaño de letra" disabled={font>=28} onClick={()=>setFont(font+1)}>A+</button></div></div></div>
 {audioRequest&&<NarrationPlayer key={audioRequest.book+audioRequest.chapter} book={audioRequest.book} chapter={audioRequest.chapter} onClose={()=>setAudioRequest(null)}/>}
 {reading?<div className="readerempty">Abriendo tu lectura…</div>:error?<div className="notice error">{error}</div>:<div className="verses" style={{fontSize:font}}>{verses.map(v=><button id={'bible-verse-'+v.verse} key={v.verse} onClick={()=>setSelected(v.verse===selected?'':v.verse)} className={'verse '+(marked(study.highlights,v.verse)?'highlighted ':'')+(selected===v.verse?'versechosen':'')} aria-pressed={selected===v.verse}><sup>{v.verse}</sup><span>{v.text}</span>{marked(study.bookmarks,v.verse)&&<Bookmark size={13} className="versebookmark"/>}</button>)}</div>}
 {selected&&!reading&&<div className="verseactions"><b>{reference}:{selected}</b><button disabled={!ready||saving} onClick={()=>mark('highlights')}><Highlighter size={17}/>{marked(study.highlights,selected)?'Quitar resaltado':'Resaltar'}</button><button disabled={!ready||saving} onClick={()=>mark('bookmarks')}><Bookmark size={17}/>{marked(study.bookmarks,selected)?'Quitar marcador':'Guardar'}</button><button aria-label="Cerrar selección" onClick={()=>setSelected('')}><X size={16}/></button></div>}
 <div className="chapterpager"><button className="outline" disabled={saving||book===books[0].id&&chapter===1} onClick={()=>step(-1)}><ChevronLeft size={16}/>Anterior</button><span>{chapter} / {current.chapters}</span><button className="outline" disabled={saving||book===books[65].id&&chapter===current.chapters} onClick={()=>step(1)}>Siguiente<ChevronRight size={16}/></button></div></>}
 <div className="biblecredit">Reina-Valera 1909 · Dominio público · <a href="https://github.com/BibleAquifer/ReinaValera1909" target="_blank" rel="noreferrer">Texto de BibleAquifer</a><span>Audio: voz neuronal femenina por capítulos.</span></div></section>
</div></>}</main><footer className="readerfooter"><span>SHALOM <i>Christian Church</i></span><span>Una iglesia, una familia.</span></footer></div>
}
