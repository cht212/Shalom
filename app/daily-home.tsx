'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight,ArrowUpRight,Church,LayoutDashboard,Sunrise} from 'lucide-react';
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
 return <section className={'home-dashboard home-designed'+(!actor?' guest-home':'')} aria-labelledby="home-title">
  <header className="home-welcome">
   <div><span className="home-kicker">FE PARA CADA DÍA</span><h1 id="home-title">{actor?`Hola, ${firstName}.`:'Bienvenido a casa.'}</h1><p>Un momento con Dios. Una palabra para tu día.</p></div>
   {canReview&&<Link className="home-review-link" href="/panel"><LayoutDashboard size={17}/><span>Mi panel</span><ArrowRight size={16}/></Link>}
  </header>
  <div className="home-feature-grid">
  <button className="home-verse" onClick={()=>verse&&onRead(verse.book,verse.chapter)} disabled={!verse} aria-label={verse?`Leer ${reference}`:'Cargando versículo del día'}>
   <svg className="home-verse-art" viewBox="0 0 380 460" fill="none" aria-hidden="true"><path d="M40 460V184a150 150 0 0 1 300 0v276M62 460V184a128 128 0 0 1 256 0v276M84 460V184a106 106 0 0 1 212 0v276"/><circle cx="190" cy="184" r="54"/><path d="M0 340c85-70 150-70 220 0s130 70 180 0M0 368c85-70 150-70 220 0s130 70 180 0"/></svg>
   <span className="home-verse-label"><Sunrise size={17}/> Versículo del día <time dateTime={date}>{new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short'})}</time></span>
   {error?<span className="home-verse-error" role="alert">{error}</span>:verse?<><span className="home-verse-body"><span className="home-quote-mark" aria-hidden="true">“</span><q>{verse.text}</q></span><span className="home-verse-bottom"><span className="home-verse-reference">{reference}</span><span className="home-verse-open">Leer capítulo <ArrowRight size={16}/></span></span></>:<span className="home-verse-loading">Preparando la lectura de hoy…</span>}
  </button>
  <section className="home-community" aria-labelledby="home-community-title">
   <div className="home-community-heading"><span className="home-church-icon"><Church size={22}/></span><span className="home-kicker">SOMOS SHALOM</span></div>
   <div className="home-community-message"><h2 id="home-community-title">Una iglesia. <span>Una familia.</span></h2><p>Compartimos la fe y caminamos juntos.</p><span className="home-church-name">{churchInfo.name}</span></div>
   {churchInfo.socialLinks.length>0&&<div className="church-social-links">{churchInfo.socialLinks.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer"><Image src="/branding/facebook-primary.png" alt="" width={32} height={32}/><span><strong>Síguenos en {link.name}</strong><small>Conoce nuestra comunidad</small></span><ArrowUpRight size={18}/></a>)}</div>}
  </section>
  </div>
 </section>;
}
