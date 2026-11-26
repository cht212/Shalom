'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';

type Phase='idle'|'checking'|'downloading'|'ready'|'current'|'repaired'|'error';
type Props={open:boolean;onClose:()=>void;registration:ServiceWorkerRegistration|null;onRegistration:(value:ServiceWorkerRegistration)=>void;onApply:(value:ServiceWorkerRegistration)=>void};

async function waitForDownload(registration:ServiceWorkerRegistration){
 const worker=registration.installing;
 if(!worker)return;
 await new Promise<void>((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error('La descarga está tardando. Revisa tu conexión y vuelve a buscar.'))},60000);
  const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',check)};
  const check=()=>{if(worker.state==='installed'||worker.state==='activated'){cleanup();resolve()}else if(worker.state==='redundant'){cleanup();reject(Error('No se pudo descargar la versión nueva. La versión actual sigue disponible.'))}};
  worker.addEventListener('statechange',check);check();
 });
}

export default function AppUpdater({open,onClose,registration,onRegistration,onApply}:Props){
 const dialog=useRef<HTMLDialogElement>(null);
 const [phase,setPhase]=useState<Phase>('idle'),[message,setMessage]=useState(''),[copied,setCopied]=useState(false),[progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const busy=phase==='checking'||phase==='downloading';
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open&&dialog.current?.open)dialog.current.close()},[open]);
 async function currentRegistration(){
  if(!navigator.onLine)throw Error('Necesitas internet para actualizar. Tus descargas siguen disponibles.');
  if(!('serviceWorker'in navigator))throw Error('Abre Shalom en Chrome, Edge o Safari para actualizar la aplicación.');
  const value=registration||await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
  onRegistration(value);return value;
 }
 async function check(){
  setPhase('checking');setMessage('Buscando la versión publicada…');setProgress(null);
  try{
   const current=await currentRegistration();
   const response=await fetch('/manifest.webmanifest',{cache:'no-store'});
   if(!response.ok)throw Error('No se pudo comprobar la información de instalación. Inténtalo de nuevo.');
   const manifest=await response.json() as {icons?:{src:string}[]};
   await Promise.all((manifest.icons||[]).map(async icon=>{const url=new URL(icon.src,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/branding/'))return;const result=await fetch(url,{cache:'reload'});if(!result.ok)throw Error('No se pudieron descargar los iconos actuales.');await result.arrayBuffer()}));
   await current.update();
   if(current.installing){setPhase('downloading');setMessage('Descargando la nueva versión…');await waitForDownload(current)}
   if(current.waiting){setPhase('ready');setMessage('La nueva versión está descargada y lista para abrir.')}else{setPhase('current');setMessage('Los archivos de Shalom están al día. Los iconos publicados también se comprobaron.')}
  }catch(cause){setPhase('error');setMessage((cause as Error).message||'No se pudo actualizar. Inténtalo de nuevo.')}
 }
 async function redownload(){
  setPhase('downloading');setMessage('Volviendo a descargar los archivos de la aplicación…');setProgress(null);
  try{
   const current=await currentRegistration();
   if(current.waiting){setPhase('ready');setMessage('Primero abre la nueva versión descargada.');return}
   if(!current.active)throw Error('Primero busca actualizaciones y espera a que termine la instalación.');
   await new Promise<void>((resolve,reject)=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();reject(Error('No se pudo completar la descarga. Busca actualizaciones y vuelve a intentarlo.'))},90000);
    channel.port1.onmessage=event=>{const data=event.data;if(data.type==='PROGRESS')setProgress({done:data.done,total:data.total});if(data.type==='COMPLETE'||data.type==='ERROR'){clearTimeout(timer);channel.port1.close();if(data.type==='COMPLETE')resolve();else reject(Error('No se pudo completar la descarga. Se conservan tus archivos anteriores.'))}};
    current.active!.postMessage({type:'REFRESH_SHELL'},[channel.port2]);
   });
   setPhase('repaired');setMessage('Archivos descargados de nuevo. Tus guardados, sesión y descargas de la Biblia se conservaron.');
  }catch(cause){setPhase('error');setMessage((cause as Error).message)}
 }
 return <dialog ref={dialog} className="pwa-dialog app-updater" aria-labelledby="app-update-title" onClose={onClose}>
  <div className="pwa-dialog-header"><h2 id="app-update-title">Actualizar Shalom</h2><button className="outline" onClick={onClose}>Cerrar</button></div>
  <div className="app-update-brand"><Image src="/branding/shalom-2026-192.png" alt="Logo actual de Shalom" width={56} height={56} unoptimized/><div><strong>Shalom</strong><p>Aplicación, diseño e imágenes</p></div></div>
  <p>Busca la última versión o vuelve a descargar los archivos de la aplicación sin borrar tus datos.</p>
  <div className="app-update-status" role="status" aria-live="polite">{message||'Listo para buscar actualizaciones.'}{busy&&<progress aria-label="Descarga de la aplicación" value={progress?.done} max={progress?.total||1}/>} {progress&&busy&&<small>{progress.done} de {progress.total} archivos</small>}</div>
  <div className="pwa-actions"><button className="primary" disabled={busy} onClick={check}>{busy?'Actualizando…':'Buscar actualizaciones'}</button>{phase==='ready'&&registration?.waiting&&<button className="primary" onClick={()=>onApply(registration)}>Abrir nueva versión</button>}{phase==='current'&&<button className="outline" onClick={redownload}>Volver a descargar archivos</button>}{phase==='repaired'&&<button className="primary" onClick={()=>location.reload()}>Volver a abrir Shalom</button>}</div>
  {(phase==='ready'||phase==='repaired')&&<p className="pwa-install-note">Termina tus formularios antes de volver a abrir la aplicación.</p>}
  <details className="app-update-icon-help" open><summary>¿Sigue el icono o la carga antigua?</summary><p>El logo azul de arriba es el actual. Android conserva el icono y la primera pantalla de arranque en la instalación del navegador. Esta descarga no confirma que Android ya los haya reemplazado.</p><ol><li>Abre el menú de Chrome o de la app y acepta <b>Revisar actualización de la app</b>, si aparece.</li><li>Si no aparece, abre <b>chrome://webapks</b> en Chrome para Android y busca Shalom. Pulsa <b>Update</b> si está disponible.</li><li>Para esa actualización manual, conecta el celular a Wi-Fi y al cargador; cierra y fuerza la detención de Shalom desde Ajustes de Android. Después vuelve a abrirla y cerrarla para permitir que Chrome aplique el cambio.</li></ol><button className="outline" onClick={async()=>{try{await navigator.clipboard.writeText('chrome://webapks');setCopied(true)}catch{setCopied(false)}}}>{copied?'Dirección copiada':'Copiar dirección de Chrome'}</button><p>Si Shalom no aparece, puede estar instalada desde otro navegador o desde una dirección de despliegue antigua. En iPhone, cambiar el icono puede requerir agregar de nuevo la app a la pantalla de inicio.</p><a href="https://developer.chrome.com/blog/improvements-to-web-app-updates" target="_blank" rel="noreferrer">Cómo actualiza Chrome los iconos</a></details>
 </dialog>;
}
