'use client';
import {useEffect,useRef,useState} from 'react';
import books from '../public/bible/books.json';
import {BIBLE_CACHE,deleteAudio,formatBytes,listAudio,type AudioDownload} from '../lib/offline-downloads';
import {useOnline} from './use-online';

export default function DownloadManager(){
 const online=useOnline();
 const [downloaded,setDownloaded]=useState<string[]>([]),[bytes,setBytes]=useState(0),[audio,setAudio]=useState<Omit<AudioDownload,'blob'>[]>([]);
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[notice,setNotice]=useState('');
 const controller=useRef<AbortController|null>(null);
 async function refresh(){
  if(!('caches'in window))throw Error('Este navegador no permite descargas sin conexión.');
  const cache=await caches.open(BIBLE_CACHE),keys=await cache.keys();
  const ids=keys.map(key=>new URL(key.url).pathname.split('/').pop()!.replace('.json','')).filter(id=>books.some(book=>book.id===id));
  const sizes=await Promise.all(keys.map(async key=>(await (await cache.match(key))!.blob()).size));
  setDownloaded(ids);setBytes(sizes.reduce((sum,size)=>sum+size,0));
  setAudio((await listAudio()).map(({key,title,bytes})=>({key,title,bytes})));
 }
 useEffect(()=>{void Promise.resolve().then(refresh).catch(error=>setNotice(error.message));return()=>controller.current?.abort()},[]);
 async function downloadBible(){
  setBusy(true);setNotice('');setProgress(0);
  const downloadController=new AbortController();controller.current=downloadController;
  try{
   const cache=await caches.open(BIBLE_CACHE);
   const paths=['/bible/books.json',...books.map(book=>'/bible/'+book.id+'.json')];
   for(let index=0;index<paths.length;index++){
    if(downloadController.signal.aborted)throw new DOMException('Cancelado','AbortError');
    if(!await cache.match(paths[index])){
     const response=await fetch(paths[index],{signal:downloadController.signal,credentials:'omit'});
     if(!response.ok||!response.headers.get('content-type')?.includes('json'))throw Error('No se pudo completar la descarga. Puedes reanudarla.');
     // Parse before storing so an error document never counts as a downloaded book.
     await response.clone().json();await cache.put(paths[index],response);
    }
    setProgress(index+1);
   }
   setNotice('Biblia completa disponible sin conexión.');
   void navigator.storage?.persist?.().catch(()=>{});
  }catch(error){setNotice(error instanceof DOMException&&error.name==='AbortError'?'Descarga pausada. Los libros completados se conservaron.':error instanceof Error?error.message:'No se pudo descargar. Revisa el espacio disponible.');}
  finally{setBusy(false);controller.current=null;await refresh().catch(()=>{});}
 }
 async function removeBible(){
  setNotice('');try{await caches.delete(BIBLE_CACHE);await refresh();setNotice('Biblia descargada eliminada. Tus marcadores se conservaron.')}catch{setNotice('No se pudieron eliminar las descargas.')}
 }
 async function removeAudio(key:string){try{await deleteAudio(key);await refresh();window.dispatchEvent(new Event('shalom-audio-downloads'))}catch{setNotice('No se pudo eliminar el audio.')}}
 return <section className="pwa-downloads" aria-label="Administrar descargas">
  <h2>Administrar descargas</h2><p>Los libros que lees se guardan automáticamente en este dispositivo.</p>
  <p><b>{downloaded.length} de {books.length} libros</b> · {formatBytes(bytes)}</p>
  <div className="pwa-actions"><button className="primary" disabled={busy||!online||downloaded.length===books.length} onClick={downloadBible}>Descargar Biblia completa</button><button className="outline" disabled={busy||!downloaded.length} onClick={removeBible}>Eliminar Biblia descargada</button></div>
  {busy&&<div role="status"><progress value={progress} max={books.length+1}/><span> {progress} / {books.length+1}</span><button className="textbtn" onClick={()=>controller.current?.abort()}>Pausar descarga</button></div>}
  {!!downloaded.length&&<details><summary>Ver libros descargados</summary><p>{books.filter(book=>downloaded.includes(book.id)).map(book=>book.name).join(' · ')}</p></details>}
  <h3>Audio por capítulo</h3><p>Descarga cada capítulo desde su reproductor cuando haya voz neuronal alojada.</p>
  {audio.length?<><p>{audio.length} capítulos · {formatBytes(audio.reduce((sum,item)=>sum+item.bytes,0))}</p><ul>{audio.map(item=><li key={item.key}><span>{item.title} · {formatBytes(item.bytes)}</span><button className="textbtn" aria-label={'Eliminar audio de '+item.title} onClick={()=>removeAudio(item.key)}>Eliminar</button></li>)}</ul></>:<p>Aún no hay capítulos descargados.</p>}
  <p className="subtle">Las descargas y los guardados locales pertenecen a este navegador. El dispositivo puede liberar espacio; revisa las descargas antes de salir sin conexión.</p>
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
