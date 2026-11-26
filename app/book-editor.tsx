'use client';
import {useState} from 'react';
import Image from 'next/image';
import {Plus,Trash2,Upload} from 'lucide-react';
import type {ClientBook,Lesson} from '../lib/formation';
type Save=(body:object|FormData,endpoint?:string)=>Promise<boolean>;
export default function BookEditor({books,busy,save,revision}:{books:ClientBook[];busy:boolean;save:Save;revision:number}){
 const [editing,setEditing]=useState<ClientBook|null>(books[0]??null),[title,setTitle]=useState(books[0]?.title??''),[published,setPublished]=useState(books[0]?.published??false),[lessons,setLessons]=useState<Lesson[]>(structuredClone(books[0]?.lessons??[]));
 const current=books.find(b=>b.id===editing?.id);
 function choose(id:string){const b=books.find(b=>b.id===id)??null;setEditing(b);setTitle(b?.title??'');setPublished(b?.published??false);setLessons(structuredClone(b?.lessons??[]))}
 function updateLesson(id:string,next:Partial<Lesson>){setLessons(lessons.map(l=>l.id===id?{...l,...next}:l))}
 async function upload(file:File|undefined,kind:string){if(!file||!editing)return;const form=new FormData();form.set('book',editing.id);form.set('kind',kind);form.set('file',file);await save(form,'/api/formation/assets')}
 return <details className="panel book-editor"><summary>Biblioteca · libros y contenido</summary><div className="book-editor-body"><label>Editar libro<select aria-label="Editar libro" value={editing?.id??''} onChange={e=>choose(e.target.value)}><option value="">Nuevo libro</option>{books.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
 <form onSubmit={e=>{e.preventDefault();void save({id:editing?.id,title,published,lessons},'/api/formation/books')}}>
  <label>Nombre del libro<input required maxLength={150} value={title} onChange={e=>setTitle(e.target.value)}/></label>
  <label className="inline-check"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/>Publicado para las personas asignadas</label>
  {lessons.map((lesson,index)=><fieldset className="lesson-editor" key={lesson.id}><legend>Lección {index+1}</legend><label>Título de la lección<input required value={lesson.title} maxLength={200} onChange={e=>updateLesson(lesson.id,{title:e.target.value})}/></label><label>Enseñanza<textarea rows={5} maxLength={20000} value={lesson.text} onChange={e=>updateLesson(lesson.id,{text:e.target.value})}/></label>
   {lesson.questions.map((q,i)=><div className="question-editor" key={q.id}><label>Pregunta {i+1}<input required maxLength={1000} value={q.text} onChange={e=>updateLesson(lesson.id,{questions:lesson.questions.map(item=>item.id===q.id?{...item,text:e.target.value}:item)})}/></label><button type="button" className="outline" aria-label={'Quitar pregunta '+(i+1)} onClick={()=>updateLesson(lesson.id,{questions:lesson.questions.filter(item=>item.id!==q.id)})}><Trash2 size={16}/></button></div>)}
   <div className="headingactions"><button type="button" className="textbtn" onClick={()=>updateLesson(lesson.id,{questions:[...lesson.questions,{id:crypto.randomUUID(),text:''}]})}><Plus size={16}/>Agregar pregunta</button><button type="button" className="textbtn" onClick={()=>setLessons(lessons.filter(l=>l.id!==lesson.id))}>Quitar lección</button></div>
  </fieldset>)}
  <button type="button" className="outline" onClick={()=>setLessons([...lessons,{id:crypto.randomUUID(),title:'',text:'',questions:[]}])}><Plus size={16}/>Agregar lección</button>
  <button className="primary" disabled={busy}>{busy?'Guardando…':'Guardar libro'}</button>
 </form>
 {editing&&<section className="book-assets"><h3>Portada y material</h3>{current?.cover&&<Image unoptimized src={current.cover+'&v='+revision} alt={'Portada de '+current.title} width={320} height={200}/>}<label><Upload size={16}/>Portada · JPG, PNG o WebP<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0],'cover');e.target.value=''}}/></label><label><Upload size={16}/>Libro físico · PDF hasta 3 MB<input type="file" accept="application/pdf" disabled={busy} onChange={e=>{void upload(e.target.files?.[0],'pdf');e.target.value=''}}/></label>{current?.hasPdf&&<a className="textbtn" href={'/api/formation/assets?book='+encodeURIComponent(current.id)+'&kind=pdf'}>Descargar {current.pdfName||'PDF'}</a>}</section>}
 </div></details>;
}
