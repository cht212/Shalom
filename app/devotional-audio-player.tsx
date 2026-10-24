'use client';
import {useEffect,useRef,useState} from 'react';

export default function DevotionalAudioPlayer({id}:{id:string}){
 const [open,setOpen]=useState(false),[error,setError]=useState(''),[source,setSource]=useState('');
 const objectUrl=useRef<string|null>(null),active=useRef<AbortController|null>(null);
 useEffect(()=>()=>{active.current?.abort();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current)},[]);
 async function listen(){
  setOpen(true);setError('');const controller=new AbortController();active.current=controller;
  try{
   const response=await fetch('/api/devotions/'+encodeURIComponent(id)+'/audio',{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error('No se pudo abrir la grabación. Comprueba tu conexión y tus permisos.');
   if(!response.headers.get('content-type')?.startsWith('audio/'))throw Error('El archivo no es una grabación válida.');
   const url=URL.createObjectURL(await response.blob());if(controller.signal.aborted){URL.revokeObjectURL(url);return}
   objectUrl.current=url;setSource(url);
  }catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'No se pudo abrir el audio.')}
 }
 return <div className="devotional-attached-audio">{!open?<button type="button" className="outline" onClick={listen}>Escuchar audio adjunto</button>:<>{source&&<audio controls src={source} aria-label="Audio adjunto del devocional"/>}{!source&&!error&&<p role="status">Abriendo grabación…</p>}{error&&<p className="notice error" role="alert">{error}</p>}<button type="button" className="textbtn" onClick={()=>{active.current?.abort();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=null;setSource('');setOpen(false)}}>Cerrar audio adjunto</button></>}</div>;
}
