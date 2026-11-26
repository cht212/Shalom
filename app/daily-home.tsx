'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,Church,LayoutDashboard,Sunrise} from 'lucide-react';
import {readBibleBook} from '../lib/bible-client';
import type {Actor} from '../lib/access';
import books from '../public/bible/books.json';
import {dailyPosition,limaDate} from '../lib/daily-verse';
import {churchInfo} from '../lib/church-info';

export type DailyVerse={book:string;chapter:number;verse:string;text:string};

const reviewers=['admin','cell_leader','sector_leader','pastor'];

export default function DailyHome({onRead,actor}:{onRead:(book:string,chapter:number)=>void;actor:Actor|null;sessionLoading?:boolean}){
 const [date,setDate]=useState(limaDate),[verse,setVerse]=useState<DailyVerse|null>(null),[error,setError]=useState('');
 useEffect(()=>{const timer=setInterval(()=>setDate(limaDate()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{let cancelled=false;const chosen=dailyPosition(date);readBibleBook(chosen.book).then(text=>{const found=text[String(chosen.chapter)]?.find(v=>v.verse===chosen.verse);const result=found?{...found,book:chosen.book,chapter:chosen.chapter}:null;if(!result)throw Error('No se encontró el versículo del día.');if(!cancelled){setError('');setVerse(result)}}).catch(()=>{if(!cancelled)setError('No pudimos cargar el versículo de hoy.')});return()=>{cancelled=true}},[date]);
 const reference=verse?`${books.find(b=>b.id===verse.book)?.name} ${verse.chapter}:${verse.verse}`:'';
 const canReview=!!actor&&reviewers.includes(actor.role);
 const firstName=actor?.name.trim().split(/\s+/)[0];
 return <section className={'home-dashboard'+(!actor?' guest-home':'')} aria-labelledby="home-title">
  {actor?<header className="home-welcome">
   <div><h1 id="home-title">Hola, {firstName}.</h1></div>
   {canReview&&<Link className="home-review-link" href="/panel"><LayoutDashboard size={17}/><span>Mi panel</span><ArrowRight size={16}/></Link>}
  </header>:<h1 id="home-title" className="sr-only">Versículo del día</h1>}

  <button className="home-verse" onClick={()=>verse&&onRead(verse.book,verse.chapter)} disabled={!verse} aria-label={verse?`Leer ${reference}`:'Cargando versículo del día'}>
   <span className="home-verse-label"><Sunrise size={17}/> Versículo del día <time dateTime={date}>{new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short'})}</time></span>
   {error?<span className="home-verse-error" role="alert">{error}</span>:verse?<><q>{verse.text}</q><span className="home-verse-reference">{reference}<ArrowRight size={16}/></span></>:<span className="home-verse-loading">Preparando la lectura de hoy…</span>}
  </button>
  <section className="home-community" aria-label="Nuestra iglesia"><Church size={20}/><div><h2>{churchInfo.name}</h2><p>{churchInfo.motto}</p>{churchInfo.socialLinks.length>0&&<div className="church-social-links">{churchInfo.socialLinks.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.name}</a>)}</div>}</div></section>

 </section>;
}
