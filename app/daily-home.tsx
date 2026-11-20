'use client';

import {useEffect,useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight,BookOpen,Compass,HeartHandshake,LayoutDashboard,LogIn,Sparkles,Sunrise,UsersRound} from 'lucide-react';
import {readBibleBook} from '../lib/bible-client';
import type {Actor} from '../lib/access';
import books from '../public/bible/books.json';
import {dailyPosition,limaDate} from '../lib/daily-verse';

export type DailyVerse={book:string;chapter:number;verse:string;text:string};

export default function DailyHome({onRead,actor,sessionLoading=false}:{onRead:(book:string,chapter:number)=>void;actor:Actor|null;sessionLoading?:boolean}){
 const [date,setDate]=useState(limaDate),[verse,setVerse]=useState<DailyVerse|null>(null),[error,setError]=useState('');
 useEffect(()=>{const timer=setInterval(()=>setDate(limaDate()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{let cancelled=false;const chosen=dailyPosition(date);readBibleBook(chosen.book).then(text=>{const found=text[String(chosen.chapter)]?.find(v=>v.verse===chosen.verse);const result=found?{...found,book:chosen.book,chapter:chosen.chapter}:null;if(!result)throw Error('No se encontró el versículo del día.');if(!cancelled){setError('');setVerse(result)}}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[date]);
 const reference=verse?`${books.find(b=>b.id===verse.book)?.name} ${verse.chapter}:${verse.verse}`:'';
 const accountHref=actor?'/panel':'/ingresar?return_to=/panel';
 return <>
  <section className="installed-app-home dailyhome" aria-label="Inicio de la aplicación">
   <div className="dailywelcome"><span className="eyebrow">BIENVENIDO A SHALOM</span><h1><span>Un nuevo día.</span><span>Una palabra para tu vida.</span></h1><p>Haz una pausa, escucha y deja que Dios guíe tu día.</p></div>
   <article className="dailyversecard"><div className="dailycardheading"><span><Sunrise size={19}/>VERSÍCULO DEL DÍA</span><time dateTime={date}>{new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long'})}</time></div>{error?<p role="alert">{error}</p>:verse?<><blockquote>“{verse.text}”</blockquote><p className="dailyreference">{reference}</p></>:<p className="dailyloading">Preparando la lectura de hoy…</p>}<div className="dailycontrols">{verse&&<button className="textbtn" onClick={()=>onRead(verse.book,verse.chapter)}>Leer el capítulo <ArrowRight size={16}/></button>}</div></article>
   <button className="dailybiblelink" onClick={()=>onRead(verse?.book||'PSA',verse?.chapter||23)}><span className="iconbox"><BookOpen size={25}/></span><span><b>Abre tu Biblia</b><small>Encuentra un capítulo para seguir leyendo.</small></span><ArrowRight size={20}/></button><p className="dailyfootnote">Una iglesia, una familia. Crecemos juntos en la Palabra.</p>
  </section>

  <div className="church-web-home">
   <section className="church-hero" aria-labelledby="church-home-title">
    <div className="church-hero-copy"><span className="church-kicker"><Sparkles size={15}/> MISIÓN CRISTIANA SHALOM</span><h1 id="church-home-title">Una iglesia para crecer en <em>fe, comunidad y propósito.</em></h1><p>Queremos acompañarte a conocer a Jesús, vivir su Palabra y encontrar una familia con quien caminar.</p><div className="church-hero-actions"><a className="primary" href="#comunidad">Conoce Shalom <ArrowRight size={17}/></a><button className="outline" onClick={()=>onRead('PSA',23)}><BookOpen size={17}/>Abrir la Biblia</button></div><div className="church-hero-note"><span>Una iglesia</span><i/><span>Una familia</span><i/><span>Una fe que se vive</span></div></div>
    <div className="church-hero-art" aria-label="Comunidad de Misión Cristiana Shalom"><div className="church-blue-field church-photo-field"><Image src="/church/community-hero.webp" alt="Personas compartiendo en la comunidad Shalom" fill sizes="(max-width: 900px) 90vw, 48vw" className="church-hero-photo" priority/><div className="church-photo-shade"/><div className="church-art-message"><small>NUESTRA MISIÓN</small><strong>Amar a Dios.<br/>Cuidar personas.</strong></div></div><div className="church-floating-card"><HeartHandshake size={23}/><span><b>Aquí hay un lugar para ti</b><small>Crezcamos juntos.</small></span></div></div>
   </section>

   <section className="church-intro" id="comunidad"><span className="church-section-label">VIVE SHALOM</span><div><h2>La iglesia sucede cuando caminamos juntos.</h2><p>Shalom es un espacio para fortalecer tu fe, formar relaciones sinceras y servir con los dones que Dios puso en ti.</p></div></section>

   <section className="church-paths" aria-label="Cómo vivir Shalom">
    <article><span className="church-path-number">01</span><span className="church-path-icon blue"><UsersRound size={24}/></span><h3>Encuentra comunidad</h3><p>Conecta con personas, comparte la vida y recibe acompañamiento en cada etapa.</p><a href="#tu-espacio">Quiero conectar <ArrowRight size={15}/></a></article>
    <article><span className="church-path-number">02</span><span className="church-path-icon sand"><BookOpen size={24}/></span><h3>Crece en la Palabra</h3><p>Lee la Biblia, guarda tus pasajes y convierte cada lectura en una práctica diaria.</p><button onClick={()=>onRead(verse?.book||'PSA',verse?.chapter||23)}>Comenzar a leer <ArrowRight size={15}/></button></article>
    <article><span className="church-path-number">03</span><span className="church-path-icon sage"><Compass size={24}/></span><h3>Vive con propósito</h3><p>Descubre cómo servir, compartir tu fe y aportar a una comunidad que cuida personas.</p><a href="#tu-espacio">Dar el siguiente paso <ArrowRight size={15}/></a></article>
   </section>

   <section className="church-word-section">
    <div className="church-word-heading"><span className="church-section-label">UNA PALABRA PARA HOY</span><h2>Haz una pausa.<br/>Deja que Dios te hable.</h2><p>La Biblia también es parte de este hogar digital. Puedes leerla aquí o llevarla instalada contigo.</p>{verse&&<button className="outline" onClick={()=>onRead(verse.book,verse.chapter)}>Leer el capítulo <ArrowRight size={16}/></button>}</div>
    <div className="church-word-visual"><Image src="/church/bible-together.webp" alt="Dos personas leyendo la Biblia juntas" width={1400} height={788} sizes="(max-width: 900px) 100vw, 55vw"/><article className="church-daily-card"><div><Sunrise size={20}/><span>VERSÍCULO DEL DÍA</span><time dateTime={date}>{new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long'})}</time></div>{error?<p role="alert">{error}</p>:verse?<><blockquote>“{verse.text}”</blockquote><p>{reference}</p></>:<p className="dailyloading">Preparando la lectura de hoy…</p>}</article></div>
   </section>

   <section className="church-account" id="tu-espacio"><div className="church-account-icon">{actor?<LayoutDashboard size={28}/>:<LogIn size={28}/>}</div><div><span className="church-section-label">TU ESPACIO EN SHALOM</span><h2>{actor?'Continúa acompañando a tu comunidad.':'La comunidad continúa después del domingo.'}</h2><p>{actor?'Entra al panel para revisar tu espacio, tus células y las tareas de acompañamiento.':'Inicia sesión para guardar lecturas, escribir devocionales y acceder al espacio que te corresponde en la iglesia.'}</p></div><Link className="primary" href={accountHref}>{sessionLoading?'Comprobando…':actor?'Ir a mi panel':'Iniciar sesión'} <ArrowRight size={17}/></Link></section>
  </div>
 </>;
}
