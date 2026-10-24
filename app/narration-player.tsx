'use client';

import {useEffect,useRef,useState} from 'react';
import {Headphones,Pause,Play,Square,X} from 'lucide-react';
import books from '../public/bible/books.json';

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
 const indexRef=useRef(0);
 const rateRef=useRef(rate);
 const closedRef=useRef(false);
 const title=books.find(item=>item.id===book)?.name||book;
 const speechSupported=typeof window!=='undefined'&&'speechSynthesis'in window&&'SpeechSynthesisUtterance'in window;

 useEffect(()=>{
  const controller=new AbortController();
  fetch('/bible/'+book+'.json',{signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error();
    const data=await response.json() as Record<string,Verse[]>;
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
  window.speechSynthesis.cancel();
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
  {mode!=='device'&&mode!=='unavailable'&&<audio
   key={book+chapter}
   controls
   autoPlay
   preload="metadata"
   src={'/api/narration?book='+book+'&chapter='+chapter+'&v=2'}
   onLoadedMetadata={event=>{event.currentTarget.playbackRate=rate;setMode('recorded')}}
   onError={()=>setMode(speechSupported?'device':'unavailable')}
   aria-label={'Escuchar '+title+' '+chapter}
   onRateChange={event=>{setRate(event.currentTarget.playbackRate);rateRef.current=event.currentTarget.playbackRate}}
  />}
  {mode==='device'&&<>
   <p>El audio neuronal no está alojado en este servidor. Se usará la voz en español disponible en tu dispositivo.</p>
   {!verses.length?<p role="status">Preparando el texto del capítulo…</p>:<div className="device-speech-controls">
    {speechState==='playing'?<button className="primary" onClick={pauseDeviceVoice}><Pause size={16}/>Pausar</button>:<button className="primary" onClick={playDeviceVoice}><Play size={16}/>{speechState==='paused'?'Continuar':'Reproducir'}</button>}
    <button className="outline" onClick={stopDeviceVoice} disabled={speechState==='idle'}><Square size={15}/>Detener</button>
   </div>}
  </>}
  {mode==='unavailable'&&<div role="alert" className="notice error">Este navegador no ofrece voz del dispositivo y el audio neuronal no está configurado.</div>}
  <label className="audio-speed">Velocidad<select aria-label="Velocidad de narración" value={rate} onChange={event=>{
   const value=Number(event.target.value);
   setRate(value);
   rateRef.current=value;
   const player=event.currentTarget.closest('section')?.querySelector('audio');
   if(player)player.playbackRate=value;
  }}>{[.85,1,1.1,1.25].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>
 </section>;
}
