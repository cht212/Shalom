'use client';
import {useState} from 'react';
import {ArrowLeft,CheckCircle2,Send} from 'lucide-react';
import type {Assignment,ClientBook,LessonResponse} from '../lib/formation';
type Save=(body:object|FormData,endpoint?:string)=>Promise<boolean>;
export default function BookReader({book,assignment,responses,busy,save,onBack}:{book:ClientBook;assignment:Assignment;responses:LessonResponse[];busy:boolean;save:Save;onBack:()=>void}){
 const [lessonId,setLessonId]=useState(book.lessons[0]?.id??'');
 const lesson=book.lessons.find(l=>l.id===lessonId);
 const response=responses.find(r=>r.assignment===assignment.id&&r.lesson===lessonId);
 const [drafts,setDrafts]=useState<Record<string,Record<string,string>>>({});
 const answers=drafts[lessonId]??response?.answers??{};
 const locked=!!response?.submitted||!!response?.reviewed;
 async function persist(submit:boolean){const ok=await save({action:'answer',assignment:assignment.id,lesson:lessonId,answers,submit},'/api/formation/responses');if(ok)setDrafts(current=>{const next={...current};delete next[lessonId];return next})}
 function back(){if(Object.keys(drafts).length&&!window.confirm('Tienes respuestas sin guardar. ¿Salir del libro?'))return;onBack()}
 return <section className="book-reader"><button className="textbtn" onClick={back}><ArrowLeft size={17}/>Mis libros</button><h2>{book.title}</h2>{!book.published?<p className="formation-empty">Este libro está en preparación. Tu líder te avisará cuando esté disponible.</p>:<>
 {book.hasPdf&&<a className="outline" href={'/api/formation/assets?book='+encodeURIComponent(book.id)+'&kind=pdf'}>Descargar libro en PDF</a>}
 {book.lessons.length?<><label>Lección<select value={lessonId} onChange={e=>setLessonId(e.target.value)}>{book.lessons.map((l,i)=><option key={l.id} value={l.id}>{i+1}. {l.title}</option>)}</select></label>
 {lesson&&<article className="lesson-reading"><h3>{lesson.title}</h3><p className="lesson-text">{lesson.text}</p><form onSubmit={e=>{e.preventDefault();void persist(true)}}>
 {lesson.questions.map((q,i)=><label key={q.id}>{i+1}. {q.text}<textarea required rows={3} maxLength={5000} readOnly={locked} value={answers[q.id]??''} onChange={e=>setDrafts({...drafts,[lessonId]:{...answers,[q.id]:e.target.value}})}/></label>)}
 {response?.feedback&&<div className="leaderfeedback"><span><b>Comentario de tu líder</b><p>{response.feedback}</p></span></div>}
 {locked?<p className="lesson-status" role="status"><CheckCircle2 size={17}/>{response?.reviewed?'Lección revisada':'Enviada · pendiente de revisión'}</p>:<div className="headingactions"><button type="button" className="outline" disabled={busy} onClick={()=>void persist(false)}>Guardar borrador</button><button className="primary" disabled={busy}><Send size={16}/>{busy?'Guardando…':'Enviar al líder'}</button></div>}
 </form></article>}</>:<p className="formation-empty">Tu avance en el libro físico lo registra tu líder.</p>}
 </>}</section>;
}
