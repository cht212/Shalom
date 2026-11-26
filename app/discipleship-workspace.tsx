'use client';
import {useState} from 'react';
import {BookOpen,Check,Users} from 'lucide-react';
import {useFormation} from './use-formation';
import BookEditor from './book-editor';
import FormationReviews from './formation-reviews';

const states={pending:'Por iniciar',in_progress:'En curso',completed:'Completado'};
export default function DiscipleshipWorkspace(){
 const {data,loading,error,message,busy,load,save}=useFormation();
 const [kind,setKind]=useState<'leader'|'member'>('member'),[selectedBook,setBook]=useState(''),[selected,setSelected]=useState<string[]>([]);
 const book=selectedBook||data.books[0]?.id||'';
 const targets=kind==='leader'?data.leaders:data.members;
 return <div className="discipleship-workspace">{error&&<div className="notice error" role="alert">{error}<button onClick={()=>{void load()}}>Reintentar</button></div>}{message&&<div className="notice" role="status"><Check size={16}/>{message}</div>}{loading?<p role="status">Cargando formación…</p>:<>
  {data.canEdit&&<BookEditor books={data.books} revision={data.revision} busy={busy} save={save}/>}
  <section className="panel formation-assignment"><div className="panelheading"><div><h2>Asignar libros</h2><p>{data.canGrant?'Habilita libros a líderes o asígnalos a miembros de tu alcance.':'Asigna a tu célula los libros que te habilitaron.'}</p></div><Users size={19}/></div>
   {data.books.length?<form onSubmit={e=>{e.preventDefault();void save({action:'assign',book,kind,targets:selected})}}>
    <div className="formcolumns"><label>Libro<select value={book} onChange={e=>{setBook(e.target.value);setSelected([])}}>{data.books.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}</select></label>{data.canGrant&&<label>Dirigido a<select value={kind} onChange={e=>{setKind(e.target.value as 'leader'|'member');setSelected([])}}><option value="member">Miembros</option><option value="leader">Líderes de célula</option></select></label>}</div>
    <fieldset className="formation-targets"><legend>{kind==='leader'?'Selecciona líderes':'Selecciona miembros'}</legend>{targets.length?targets.map(t=><label key={t.id}><input type="checkbox" checked={selected.includes(t.id)} onChange={e=>setSelected(e.target.checked?[...selected,t.id]:selected.filter(id=>id!==t.id))}/><span>{t.name}</span></label>):<p>No hay personas disponibles en tu alcance.</p>}</fieldset>
    <button className="primary" disabled={busy||!selected.length}>{busy?'Guardando…':`Asignar${selected.length?' ('+selected.length+')':''}`}</button>
   </form>:<div className="empty"><BookOpen size={24}/><p>Administración, el pastor o tu líder de sector deben habilitarte un libro para poder asignarlo.</p></div>}
  </section>
  <section className="panel"><div className="panelheading"><div><h2>Seguimiento de libros</h2><p>Registra también el avance realizado con el libro físico.</p></div></div><div className="formation-tracking">{data.assignments.length?data.assignments.map(x=><article key={x.id}><div><b>{x.name||'Persona sin vínculo vigente'}</b><small>{data.books.find(b=>b.id===x.book)?.title||x.book} · {x.kind==='leader'?'Líder de célula':'Miembro'}</small></div><label><span className="sr-only">Estado de {x.name}</span><select aria-label={'Estado de '+x.name} disabled={busy} value={x.status} onChange={e=>void save({action:'status',id:x.id,status:e.target.value})}>{Object.entries(states).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="textbtn" disabled={busy} onClick={()=>{if(window.confirm('¿Retirar esta asignación? Si es un líder, también se retirarán las asignaciones de este libro que hizo a sus miembros.'))void save({action:'revoke',id:x.id})}}>Retirar</button></article>):<p className="formation-empty">Todavía no hay libros asignados.</p>}</div></section>
 <FormationReviews data={data} busy={busy} save={save}/>
 </>}</div>;
}
