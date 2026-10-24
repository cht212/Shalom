'use client';

import {useEffect,useRef,useState} from 'react';
import {Headphones,Pause,Play,Square,X} from 'lucide-react';
import {readBibleBook} from '../lib/bible-client';
import books from '../public/bible/books.json';
import {deleteAudio,formatBytes,getAudio,saveAudio} from '../lib/offline-downloads';
import {useOnline} from './use-online';

type Verse={verse:string;text:string};
type Mode='loading'|'recorded'|'device'|'unavailable';

function spanishVoice(){
 const voices=window.speechSynthesis.getVoices();
 const spanish=voices.filter(voice=>voice.lang.toLowerCase().startsWith('es'));
 return spanish.find(voice=>/paulina|m[oó]nica|helena|female|mujer/i.test(voice.name))||spanish[0]||null;
}

export default function NarrationPlayer({book,chapter,onClose}:{book:string;chapter:number;onClose:()=>void}){
 const [mode,setMode]=useState<Mode>('loading');
 const [verses,setVerses]=useState<Verse[]>([]);
 const [speechState,setSpeechState]=useState<'idle'|'playing'|'paused'>('idle');
 const [rate,setRate]=useState(1);
 const online=useOnline(),audioKey=book+':'+chapter;
 const [source,setSource]=useState<string|null>(null),[downloadBytes,setDownloadBytes]=useState(0),[downloading,setDownloading]=useState(false),[downloadNotice,setDownloadNotice]=useState('');
 const downloadController=useRef<AbortController|null>(null);
 const indexRef=useRef(0);
 const rateRef=useRef(rate);
 const closedRef=useRef(false);
 const title=books.find(item=>item.id===book)?.name||book;
 const speechSupported=typeof window!=='undefined'&&'speechSynthesis'in window&&'SpeechSynthesisUtterance'in window;

 useEffect(()=>{
  let cancelled=false,objectUrl:string|undefined;
  const load=async()=>{
   try{
    const saved=await getAudio(audioKey);if(cancelled)return;
    if(saved){objectUrl=URL.createObjectURL(saved.blob);setSource(objectUrl);setDownloadBytes(saved.bytes)}
    else if(navigator.onLine){setSource('/api/narration?book='+book+'&chapter='+chapter+'&v=2');setDownloadBytes(0)}
    else{setSource(null);setMode(speechSupported?'device':'unavailable')}
   }catch{if(!cancelled){setSource(navigator.onLine?'/api/narration?book='+book+'&chapter='+chapter+'&v=2':null);if(!navigator.onLine)setMode(speechSupported?'device':'unavailable')}}
  };
  void load();
  return()=>{cancelled=true;downloadController.current?.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[audioKey,book,chapter,speechSupported]);

 async function downloadChapter(){
  setDownloading(true);setDownloadNotice('');const controller=new AbortController();downloadController.current=controller;
  try{
   const response=await fetch('/api/narration?book='+book+'&chapter='+chapter+'&download=1',{credentials:'omit',cache:'no-store',signal:controller.signal});
   if(response.status!==200||!response.headers.get('content-type')?.startsWith('audio/'))throw Error('El audio alojado no está disponible para descargar.');
   const blob=await response.blob();if(!blob.size)throw Error('El archivo de audio está vacío.');
   await saveAudio({key:audioKey,title:title+' '+chapter,bytes:blob.size,blob});
   setDownloadBytes(blob.size);setDownloadNotice('Capítulo disponible sin conexión.');window.dispatchEvent(new Event('shalom-audio-downloads'));
  }catch(error){if(!controller.signal.aborted)setDownloadNotice(error instanceof Error?error.message:'No se pudo guardar el audio. Revisa el espacio disponible.')}
  finally{setDownloading(false);downloadController.current=null}
 }
 async function removeChapter(){
  try{await deleteAudio(audioKey);setDownloadBytes(0);setDownloadNotice('Descarga eliminada.');window.dispatchEvent(new Event('shalom-audio-downloads'))}catch{setDownloadNotice('No se pudo eliminar la descarga.')}
 }

 useEffect(()=>{
  const controller=new AbortController();
  readBibleBook(book,controller.signal)
   .then(data=>{
    setVerses(data[String(chapter)]||[]);
   })
   .catch(error=>{if(error.name!=='AbortError')setVerses([])});
  return()=>controller.abort();
 },[book,chapter]);

 useEffect(()=>{
  closedRef.current=false;
  return()=>{
   closedRef.current=true;
   if(speechSupported)window.speechSynthesis.cancel();
  };
 },[speechSupported]);

 function speakFrom(index:number){
  if(!speechSupported||!verses[index]||closedRef.current){setSpeechState('idle');return}
  indexRef.current=index;
  const utterance=new SpeechSynthesisUtterance('Versículo '+verses[index].verse+'. '+verses[index].text);
  utterance.lang='es-ES';
  utterance.rate=rateRef.current;
  const voice=spanishVoice();
  if(voice)utterance.voice=voice;
  utterance.onend=()=>{if(!closedRef.current)speakFrom(index+1)};
  utterance.onerror=event=>{if(event.error!=='canceled'&&event.error!=='interrupted')setSpeechState('idle')};
  window.speechSynthesis.speak(utterance);
  setSpeechState('playing');
 }

 function playDeviceVoice(){
  if(!speechSupported||!verses.length)return;
  if(speechState==='paused'){
   window.speechSynthesis.resume();
   setSpeechState('playing');
   return;
  }
  window.speechSynthesis.cancel();
  speakFrom(speechState==='idle'&&indexRef.current<verses.length?indexRef.current:0);
 }

 function pauseDeviceVoice(){
  window.speechSynthesis.pause();
  setSpeechState('paused');
 }

 function stopDeviceVoice(){
  if(speechSupported)window.speechSynthesis.cancel();
  indexRef.current=0;
  setSpeechState('idle');
 }

 function close(){
  stopDeviceVoice();
  onClose();
 }

 return <section className="chapter-audio" aria-label="Reproductor del capítulo">
  <div className="chapter-audio-heading">
   <Headphones size={20}/>
   <div><b>{title} {chapter}</b><small>{mode==='recorded'?'Voz neuronal alojada':mode==='device'?'Voz disponible en este dispositivo':'Preparando narración'}</small></div>
   <button className="close-audio" aria-label="Cerrar audio" onClick={close}><X size={18}/></button>
  </div>
  {mode==='loading'&&<p role="status">Buscando el audio del capítulo…</p>}
  {source&&mode!=='device'&&mode!=='unavailable'&&<audio
   key={book+chapter}
   controls
   autoPlay
   preload="metadata"
   src={source}
   onLoadedMetadata={event=>{event.currentTarget.playbackRate=rate;setMode('recorded')}}
   onError={()=>setMode(speechSupported?'device':'unavailable')}
   aria-label={'Escuchar '+title+' '+chapter}
   onRateChange={event=>{setRate(event.currentTarget.playbackRate);rateRef.current=event.currentTarget.playbackRate}}
  />}
  {mode==='device'&&<>
   <p>{online?'El audio neuronal no está alojado en este servidor. Se usará la voz en español disponible en tu dispositivo.':'Este capítulo no tiene audio descargado. Puedes intentar la voz del dispositivo; su disponibilidad sin conexión depende del navegador.'}</p>
   {!verses.length?<p role="status">Preparando el texto del capítulo…</p>:<div className="device-speech-controls">
    {speechState==='playing'?<button className="primary" onClick={pauseDeviceVoice}><Pause size={16}/>Pausar</button>:<button className="primary" onClick={playDeviceVoice}><Play size={16}/>{speechState==='paused'?'Continuar':'Reproducir'}</button>}
    <button className="outline" onClick={stopDeviceVoice} disabled={speechState==='idle'}><Square size={15}/>Detener</button>
   </div>}
  </>}
  {mode==='unavailable'&&<div role="alert" className="notice error">Este navegador no ofrece voz del dispositivo y el audio neuronal no está configurado.</div>}
  <div className="audio-download">{downloadBytes?<><p>Descargado · {formatBytes(downloadBytes)}</p><button className="textbtn" onClick={removeChapter}>Eliminar descarga del capítulo</button></>:<><button className="outline" disabled={mode!=='recorded'||!online||downloading} onClick={downloadChapter}>{downloading?'Descargando…':'Descargar capítulo'}</button>{mode==='device'||mode==='unavailable'?<p>La descarga estará disponible cuando exista audio neuronal alojado.</p>:null}</>}{downloadNotice&&<p role="status">{downloadNotice}</p>}</div>
  <label className="audio-speed">Velocidad<select aria-label="Velocidad de narración" value={rate} onChange={event=>{
   const value=Number(event.target.value);
   setRate(value);
   rateRef.current=value;
   const player=event.currentTarget.closest('section')?.querySelector('audio');
   if(player)player.playbackRate=value;
  }}>{[.85,1,1.1,1.25].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>
 </section>;
}
