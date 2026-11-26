'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ShieldCheck,Sunrise} from 'lucide-react';
import AssignedBooks from './assigned-books';
import {readBibleBook} from '../lib/bible-client';
import type {Actor} from '../lib/access';
import books from '../public/bible/books.json';
import {dailyPosition,limaDate} from '../lib/daily-verse';

export type DailyVerse={book:string;chapter:number;verse:string;text:string};

const reviewers=['admin','cell_leader','sector_leader','pastor'];

export default function DailyHome({onRead,actor}:{onRead:(book:string,chapter:number)=>void;actor:Actor|null;sessionLoading?:boolean}){
 const [date,setDate]=useState(limaDate),[verse,setVerse]=useState<DailyVerse|null>(null),[error,setError]=useState('');
 useEffect(()=>{const timer=setInterval(()=>setDate(limaDate()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{let cancelled=false;const chosen=dailyPosition(date);readBibleBook(chosen.book).then(text=>{const found=text[String(chosen.chapter)]?.find(v=>v.verse===chosen.verse);const result=found?{...found,book:chosen.book,chapter:chosen.chapter}:null;if(!result)throw Error('No se encontró el versículo del día.');if(!cancelled){setError('');setVerse(result)}}).catch(()=>{if(!cancelled)setError('No pudimos cargar el versículo de hoy.')});return()=>{cancelled=true}},[date]);
 const reference=verse?`${books.find(b=>b.id===verse.book)?.name} ${verse.chapter}:${verse.verse}`:'';
 const canReview=!!actor&&reviewers.includes(actor.role);
 const firstName=actor?.name.trim().split(/\s+/)[0];
 return <section className="home-dashboard" aria-labelledby="home-title">
  <header className="home-welcome">
   <div><span className="eyebrow">MISIÓN CRISTIANA SHALOM</span><h1 id="home-title">{firstName?`Hola, ${firstName}.`:'Crezcamos juntos.'}</h1><p>Una palabra para hoy y tu camino de formación en un solo lugar.</p></div>
   {canReview&&<Link className="home-review-link" href="/panel?tab=discipulado"><ShieldCheck size={17}/><span>Revisar formación</span><ArrowRight size={16}/></Link>}
  </header>

  <button className="home-verse" onClick={()=>verse&&onRead(verse.book,verse.chapter)} disabled={!verse} aria-label={verse?`Leer ${reference}`:'Cargando versículo del día'}>
   <span className="home-verse-label"><Sunrise size={17}/> Versículo del día <time dateTime={date}>{new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short'})}</time></span>
   {error?<span className="home-verse-error" role="alert">{error}</span>:verse?<><q>{verse.text}</q><span className="home-verse-reference">{reference}<ArrowRight size={16}/></span></>:<span className="home-verse-loading">Preparando la lectura de hoy…</span>}
  </button>

  {actor&&actor.role!=='pending'&&<AssignedBooks key={actor.id} actor={actor}/>}
 </section>;
}
