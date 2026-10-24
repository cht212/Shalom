'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import DownloadManager from './download-manager';
import {isOnline,useOnline} from './use-online';
import {OfflineMessage} from './online-only';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export default function PwaRuntime({children}:{children:React.ReactNode}){
 const online=useOnline(),pathname=usePathname();
 const [install,setInstall]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(true),[ios,setIos]=useState(false),[iosHelp,setIosHelp]=useState(false);
 const [registration,setRegistration]=useState<ServiceWorkerRegistration|null>(null),[update,setUpdate]=useState(false),[notice,setNotice]=useState('');
 const [downloadsOpen,setDownloadsOpen]=useState(false);
 const applying=useRef(false),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const standalone=matchMedia('(display-mode: standalone)');
  const check=()=>setInstalled(standalone.matches||!!(navigator as Navigator&{standalone?:boolean}).standalone);
  void Promise.resolve().then(()=>{check();setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)});
  const prompt=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent)};
  const didInstall=()=>{setInstalled(true);setInstall(null);setIosHelp(false)};
  window.addEventListener('beforeinstallprompt',prompt);window.addEventListener('appinstalled',didInstall);standalone.addEventListener('change',check);
  return()=>{window.removeEventListener('beforeinstallprompt',prompt);window.removeEventListener('appinstalled',didInstall);standalone.removeEventListener('change',check)};
 },[]);
 useEffect(()=>{
  if(process.env.NODE_ENV!=='production'||!('serviceWorker'in navigator)||!window.isSecureContext)return;
  let disposed=false,current:ServiceWorkerRegistration|undefined,timer:ReturnType<typeof setTimeout>|undefined,idle:number|undefined;
  const watch=()=>{
   const worker=current?.installing;
   worker?.addEventListener('statechange',()=>{if(!disposed&&worker.state==='installed'&&navigator.serviceWorker.controller)setUpdate(true)});
  };
  const onController=()=>{if(applying.current)location.reload()};
  const check=()=>{if(navigator.onLine)void current?.update().catch(()=>{})};
  navigator.serviceWorker.addEventListener('controllerchange',onController);
  const register=()=>{if(disposed)return;void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(value=>{
   if(disposed)return;current=value;setRegistration(value);setUpdate(!!value.waiting);
   value.addEventListener('updatefound',watch);watch();
  }).catch(()=>{if(!disposed)setNotice('No se pudo preparar el modo sin conexión. Vuelve a abrir Shalom con internet.');});};
  // Let the first reading and fonts load before precaching the rest of the app.
  const schedule=()=>{timer=setTimeout(()=>{if('requestIdleCallback'in window)idle=window.requestIdleCallback(register,{timeout:3000});else register()},1000)};
  if(document.readyState==='complete')schedule();else window.addEventListener('load',schedule,{once:true});
  window.addEventListener('online',check);window.addEventListener('focus',check);
  return()=>{disposed=true;clearTimeout(timer);if(idle!==undefined)window.cancelIdleCallback(idle);window.removeEventListener('load',schedule);current?.removeEventListener('updatefound',watch);navigator.serviceWorker.removeEventListener('controllerchange',onController);window.removeEventListener('online',check);window.removeEventListener('focus',check)};
 },[]);
 useEffect(()=>{
  // Next's RSC responses stay network-only. Use document navigation while offline.
  const navigate=(event:MouseEvent)=>{
   if(isOnline()||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
   if(!link||link.target||link.hasAttribute('download'))return;
   const url=new URL(link.href,location.href);
   if(url.origin!==location.origin||url.hash&&url.pathname===location.pathname&&url.search===location.search)return;
   event.preventDefault();event.stopPropagation();location.assign(url.href);
  };
  document.addEventListener('click',navigate,true);return()=>document.removeEventListener('click',navigate,true);
 },[]);
 async function requestInstall(){
  if(ios){setIosHelp(value=>!value);return}
  if(!install)return;
  try{await install.prompt();await install.userChoice;setInstall(null)}catch{setNotice('Usa el menú de tu navegador para instalar Shalom.');}
 }
 const privateSection=pathname!=='/'&&pathname!=='/offline';
 return <>
  {!online&&<div className="pwa-banner" role="status">Sin conexión · Biblia y guardados disponibles en este dispositivo. Los formularios necesitan internet.</div>}
  {update&&<div className="pwa-banner" role="status">Hay una actualización disponible <button className="outline" onClick={()=>{if(registration?.waiting){applying.current=true;registration.waiting.postMessage({type:'APPLY_UPDATE'})}}}>Actualizar ahora</button><small>La aplicación se recargará. Termina tus formularios antes de actualizar.</small></div>}
  {!online&&privateSection?<main><OfflineMessage/></main>:children}
  <div className="pwa-tools">
   {!installed&&(ios||install)&&<button className="textbtn" onClick={requestInstall}>Instalar Shalom</button>}
   <button className="textbtn" onClick={()=>{setDownloadsOpen(true);dialog.current?.showModal()}}>Administrar descargas</button>
   {iosHelp&&<p role="status">En Safari: Compartir → Agregar a pantalla de inicio → Agregar.</p>}
   {notice&&<p role="status">{notice}</p>}
  </div>
  <dialog ref={dialog} className="pwa-dialog" aria-labelledby="pwa-download-title" onClose={()=>setDownloadsOpen(false)}><div className="pwa-dialog-header"><h2 id="pwa-download-title">Shalom sin conexión</h2><button className="outline" onClick={()=>dialog.current?.close()} aria-label="Cerrar descargas">Cerrar</button></div>{downloadsOpen&&<DownloadManager/>}</dialog>
 </>;
}
