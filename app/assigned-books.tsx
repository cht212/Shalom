'use client';
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {BookOpen} from 'lucide-react';
import type {Actor} from '../lib/access';
import {useFormation} from './use-formation';
export default function AssignedBooks({actor}:{actor:Actor}){
 const {data,loading,error,load}=useFormation(),[filter,setFilter]=useState('all');
 const own=data.own.filter(a=>a.kind==='leader'?a.target===actor.id:true);
 const books=data.books.filter(b=>own.some(a=>a.book===b.id&&(filter==='all'||(filter==='completed'?a.status==='completed':a.status!=='completed'))));
 return <section className="formation-section" aria-labelledby="formation-title"><div className="formation-heading"><h2 id="formation-title">Mis libros de estudio</h2></div>{loading?<p className="formation-empty" role="status">Cargando tus libros…</p>:error?<p className="formation-empty" role="alert">{error}<button className="textbtn" onClick={()=>void load()}>Reintentar</button></p>:<>{own.length>0&&<div className="library-tabs" role="group" aria-label="Mis libros"><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>Todos</button><button aria-pressed={filter==='progress'} onClick={()=>setFilter('progress')}>Por completar</button><button aria-pressed={filter==='completed'} onClick={()=>setFilter('completed')}>Completados</button></div>}{books.length?<div className="formation-books">{books.map(book=><article className="formation-book" key={book.id}><Link href={'/formacion/'+encodeURIComponent(book.id)}><div className="book-cover">{book.cover?<Image unoptimized src={book.cover+'&v='+data.revision} alt={'Portada de '+book.title} fill sizes="270px"/>:<BookOpen size={30} aria-label={'Portada pendiente de '+book.title}/>}</div><h3>{book.title}</h3></Link></article>)}</div>:<p className="formation-empty">{own.length?'No tienes libros en esta sección.':'Tus libros aparecerán aquí cuando tu líder te los asigne.'}</p>}</>}</section>;
}
