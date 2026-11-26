'use client';
import {useRouter} from 'next/navigation';
import {useFormation} from './use-formation';
import BookReader from './book-reader';
export default function BookWorkspace({id}:{id:string}){
 const router=useRouter(),{data,loading,error,message,busy,save,load}=useFormation();
 const book=data.books.find(b=>b.id===id),assignment=data.own.find(a=>a.book===id);
 return <main className="book-workspace">{error&&<div className="notice error" role="alert">{error}<button onClick={()=>void load()}>Reintentar</button></div>}{message&&<div className="notice" role="status">{message}</div>}{loading?<p role="status">Abriendo tu libro…</p>:book&&assignment?<BookReader book={book} assignment={assignment} responses={data.responses} busy={busy} save={save} onBack={()=>router.push('/')}/>:<div className="empty panel"><h1>Libro no disponible</h1><p>Este libro no está asignado a tu cuenta.</p><button className="outline" onClick={()=>router.push('/')}>Volver al inicio</button></div>}</main>;
}
