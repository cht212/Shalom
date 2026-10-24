'use client';
import {useEffect,useId,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import {Mic,PenLine,Square,Volume2} from 'lucide-react';
import {MAX_DEVOTIONAL_AUDIO_BYTES,MAX_DEVOTIONAL_AUDIO_SECONDS,normalizeAudioType} from '../lib/devotional-audio';
import {isOnline} from './use-online';

export type VoiceDraft={audio:{blob:Blob;seconds:number}|null;attach:boolean;working:boolean;fromVoice:boolean;reviewed:boolean};
export const emptyVoiceDraft:VoiceDraft={audio:null,attach:false,working:false,fromVoice:false,reviewed:false};

export default function DevotionalVoiceInput({value,onChange,draft,setDraft,book,chapter,disabled}:{value:string;onChange:(text:string)=>void;draft:VoiceDraft;setDraft:Dispatch<SetStateAction<VoiceDraft>>;book:string;chapter:number;disabled:boolean}){
 const reflectionId=useId();
 const [mode,setMode]=useState<'write'|'voice'>('write'),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[preview,setPreview]=useState(''),[notice,setNotice]=useState(''),[available,setAvailable]=useState<boolean|null>(null);
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),closed=useRef(false),request=useRef<AbortController|null>(null);
 useEffect(()=>{
  closed.current=false;
  const stopIfUnavailable=()=>{if(document.hidden||!isOnline())stop()};
  document.addEventListener('visibilitychange',stopIfUnavailable);window.addEventListener('offline',stopIfUnavailable);window.addEventListener('shalom-connection',stopIfUnavailable);
  const controller=new AbortController();
  fetch('/api/devotions/transcribe',{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json() as Promise<{available:boolean}>}).then(result=>{if(!closed.current)setAvailable(result.available)}).catch(()=>{if(!closed.current)setAvailable(false)});
  return()=>{
   closed.current=true;controller.abort();request.current?.abort();if(timer.current)clearInterval(timer.current);
   document.removeEventListener('visibilitychange',stopIfUnavailable);window.removeEventListener('offline',stopIfUnavailable);window.removeEventListener('shalom-connection',stopIfUnavailable);
   if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop());
   window.speechSynthesis?.cancel();
  };
 },[]);
 useEffect(()=>{
  let cancelled=false;
  const url=draft.audio?URL.createObjectURL(draft.audio.blob):'';
  void Promise.resolve().then(()=>{if(!cancelled)setPreview(url)});
  return()=>{cancelled=true;if(url)URL.revokeObjectURL(url)};
 },[draft.audio]);
 function stop(){if(recorder.current?.state==='recording')recorder.current.stop()}
 async function start(){
  setNotice('');
  if(!navigator.mediaDevices?.getUserMedia||!('MediaRecorder'in window)){setNotice('Este navegador no permite grabar aquí. Puedes usar el micrófono del teclado para escribir con tu voz.');return}
  setDraft(current=>({...current,working:true}));
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   if(closed.current){media.getTracks().forEach(track=>track.stop());return}
   stream.current=media;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>MediaRecorder.isTypeSupported(type));
   const recordingSession=new MediaRecorder(media,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:32000});
   recorder.current=recordingSession;
   const chunks:BlobPart[]=[];let size=0,failed=false;
   const started=Date.now();setSeconds(0);
   recordingSession.ondataavailable=event=>{if(!event.data.size)return;chunks.push(event.data);size+=event.data.size;if(size>MAX_DEVOTIONAL_AUDIO_BYTES)stop()};
   recordingSession.onerror=()=>{failed=true;setNotice('No se pudo terminar la grabación. Puedes volver a intentarlo.');stop()};
   recordingSession.onstop=()=>{
    if(timer.current){clearInterval(timer.current);timer.current=null}
    media.getTracks().forEach(track=>track.stop());recorder.current=null;stream.current=null;
    if(closed.current)return;
    setRecording(false);
    const type=normalizeAudioType(recordingSession.mimeType||mime||'audio/webm');
    if(failed||!type||!size||size>MAX_DEVOTIONAL_AUDIO_BYTES){setDraft(current=>({...current,working:false}));if(!failed)setNotice('La grabación no se pudo guardar. Graba una reflexión más corta.');return}
    const clip={blob:new Blob(chunks,{type}),seconds:Math.min(MAX_DEVOTIONAL_AUDIO_SECONDS,Math.max(1,Math.ceil((Date.now()-started)/1000)))};
    setDraft({audio:clip,attach:false,working:false,fromVoice:true,reviewed:false});
    setNotice('Grabación lista. Escúchala y pulsa Convertir a texto.');
   };
   recordingSession.start(1000);setRecording(true);
   timer.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000);setSeconds(elapsed);if(elapsed>=MAX_DEVOTIONAL_AUDIO_SECONDS)stop()},250);
  }catch(error){
   stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
   setDraft(current=>({...current,working:false}));
   setNotice(error instanceof DOMException&&error.name==='NotAllowedError'?'Permite el acceso al micrófono para grabar. También puedes escribir tu devocional.':'No se pudo abrir el micrófono. Revisa que esté disponible y vuelve a intentarlo.');
  }
 }
 async function convert(){
  if(!draft.audio)return;
  if(value.trim()&&!window.confirm('La transcripción reemplazará el texto de tu reflexión. ¿Quieres continuar?'))return;
  const controller=new AbortController();request.current=controller;
  setDraft(current=>({...current,working:true}));setNotice('Convirtiendo tu voz a texto…');
  try{
   const form=new FormData();form.set('audio',draft.audio.blob,'devocional.'+(normalizeAudioType(draft.audio.blob.type)==='audio/mp4'?'m4a':'webm'));form.set('book',book);form.set('chapter',String(chapter));
   const response=await fetch('/api/devotions/transcribe',{method:'POST',body:form,signal:controller.signal});
   const result=await response.json() as {text?:string;error?:string};if(!response.ok||!result.text)throw Error(result.error||'No se pudo convertir la grabación.');
   if(closed.current)return;
   onChange(result.text);setDraft(current=>({...current,fromVoice:true,reviewed:false}));setNotice('Texto listo. Puedes corregirlo o escucharlo antes de enviarlo.');
  }catch(error){if(!closed.current)setNotice(error instanceof Error&&error.name!=='AbortError'?error.message:'Se canceló la conversión. Tu grabación se conserva.')}
  finally{if(!closed.current)setDraft(current=>({...current,working:false}));request.current=null}
 }
 function readText(){
  if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){setNotice('Este navegador no puede leer el texto en voz alta. Puedes escuchar tu grabación.');return}
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(value);utterance.lang='es-PE';window.speechSynthesis.speak(utterance);
 }
 const locked=disabled||draft.working;
 return <div className="devotional-voice">
  <div className="devotional-input-method" role="group" aria-label="Cómo hacer mi devocional"><button type="button" className={mode==='write'?'primary':'outline'} disabled={locked} aria-pressed={mode==='write'} onClick={()=>setMode('write')}><PenLine size={20}/>Escribir mi devocional</button><button type="button" className={mode==='voice'?'primary':'outline'} disabled={locked} aria-pressed={mode==='voice'} onClick={()=>setMode('voice')}><Mic size={20}/>Hablar mi devocional</button></div>
  {mode==='voice'&&<section className="devotional-recording" aria-label="Grabar mi reflexión"><h3>Cuéntalo con tus propias palabras</h3><p>Puedes hablar hasta tres minutos. Luego revisa el texto antes de enviarlo.</p>{recording?<button type="button" className="primary record-button" onClick={stop}><Square size={22}/>Detener grabación · {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</button>:<button type="button" className="primary record-button" disabled={locked} onClick={start}><Mic size={22}/>{draft.audio?'Volver a grabar':'Empezar a grabar'}</button>}
   {available===false&&<p className="notice neutral">La conversión a texto aún no está disponible. Puedes escribir tu reflexión y enviar también tu grabación.</p>}
  </section>}
  {draft.audio&&<div className="devotional-recording-preview"><audio controls src={preview||undefined} preload="metadata" aria-label="Escuchar mi grabación"/><div className="pwa-actions"><button type="button" className="outline" disabled={locked||available!==true} onClick={convert}>Convertir a texto</button><button type="button" className="textbtn" disabled={locked} onClick={()=>{if(window.confirm('¿Eliminar esta grabación? El texto se conservará.')){setDraft(emptyVoiceDraft);setNotice('Grabación eliminada.')}}}>Eliminar grabación</button></div><p className="subtle">Al pulsar Convertir a texto, tu grabación se enviará a OpenAI para transcribirla. Revisa el resultado: puede contener errores.</p><label className="devotional-audio-option"><input type="checkbox" checked={draft.attach} disabled={locked} onChange={event=>setDraft(current=>({...current,attach:event.target.checked}))}/><span>Enviar también mi audio <small>Lo podrán escuchar tu líder y los responsables autorizados.</small></span></label></div>}
  <div className="devotional-reflection-field"><label htmlFor={reflectionId}>Lo que entendí</label><textarea id={reflectionId} name="reflection" value={value} onChange={event=>{onChange(event.target.value);if(draft.fromVoice)setDraft(current=>({...current,reviewed:false}))}} disabled={locked} required minLength={10} maxLength={10000} rows={6} placeholder="¿Qué me dice este capítulo? ¿Qué aprendí de Dios o de mi vida?"/></div>
  {draft.fromVoice&&<div className="devotional-text-review"><button type="button" className="outline" disabled={!value.trim()||locked} onClick={readText}><Volume2 size={18}/>Escuchar el texto</button><label className="devotional-audio-option"><input type="checkbox" checked={draft.reviewed} disabled={locked} onChange={event=>setDraft(current=>({...current,reviewed:event.target.checked}))}/><span>Revisé el texto y expresa lo que quiero compartir.</span></label></div>}
  {notice&&<p className="notice neutral" role="status">{notice}</p>}
 </div>;
}
