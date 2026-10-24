'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {blankStudy,preserveStudy,readStudy,writeStudy,type Study,type StudyCopy} from '../lib/study-storage';
import {useOnline} from './use-online';
import {useSession} from './use-session';

export function useStudy(){
 const {actor,studyOwner,loading}=useSession(),online=useOnline();
 const owner=actor?.id||studyOwner;
 const [study,setStudy]=useState<Study>(blankStudy),[ready,setReady]=useState(false),[saving,setSaving]=useState(false),[notice,setNotice]=useState(''),[conflict,setConflict]=useState(false);
 const [hasBackup,setHasBackup]=useState(false);
 const busy=useRef(false),activeOwner=useRef<string|null>(null);
 const sync=useCallback(async(user:string)=>{
  if(busy.current||!navigator.onLine||!actor||actor.id!==user)return;
  busy.current=true;setSaving(true);
  const stillActive=()=>activeOwner.current===user;
  try{
   const response=await fetch('/api/study',{cache:'no-store'});
   if(!response.ok)throw Error(response.status===401?'Inicia sesión para sincronizar. Tu copia local se conserva.':'No se pudieron sincronizar tus guardados. La copia local se conserva.');
   const cloud=await response.json() as {data:Study;revision:number};
   if(!stillActive())return;
   const copy=readStudy(user);
   if(copy?.dirty){
    if(JSON.stringify(copy.data)===JSON.stringify(cloud.data)){
     writeStudy(user,{data:cloud.data,revision:cloud.revision,dirty:false});setStudy(cloud.data);setConflict(false);setNotice('Guardados sincronizados.');return;
    }
    if(copy.conflict||copy.revision!==cloud.revision){
     writeStudy(user,{...copy,conflict:true});setStudy(copy.data);setConflict(true);setNotice('Tu lectura también cambió en otro dispositivo. Conservamos tu copia local; revisa el conflicto antes de sincronizar.');return;
    }
    const saved=await fetch('/api/study',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:copy.data,revision:copy.revision})});
    if(!stillActive())return;
    if(saved.status===409){writeStudy(user,{...copy,conflict:true});setConflict(true);setNotice('Hay cambios en otra ventana. Tu copia local se conserva; no se sobrescribió la nube.');return}
    if(!saved.ok)throw Error('No se pudo sincronizar. Tus cambios siguen guardados en este dispositivo.');
    const result=await saved.json() as {revision:number};
    // Another tab may have edited the local copy while this request was in flight.
    const latest=readStudy(user);
    if(latest&&JSON.stringify(latest.data)!==JSON.stringify(copy.data)){
     writeStudy(user,{...latest,conflict:true});setStudy(latest.data);setConflict(true);setNotice('Hubo otro cambio local durante la sincronización. Revisa ambas versiones.');return;
    }
    writeStudy(user,{data:copy.data,revision:result.revision,dirty:false});setStudy(copy.data);setConflict(false);setNotice('Guardados sincronizados.');
   }else{
    writeStudy(user,{data:cloud.data,revision:cloud.revision,dirty:false});setStudy(cloud.data);setConflict(false);
   }
  }catch(error){if(stillActive())setNotice(error instanceof Error?error.message:'No se pudo sincronizar. Tus cambios locales se conservan.')}
  finally{busy.current=false;setSaving(false)}
 },[actor]);
 useEffect(()=>{
  let cancelled=false;
  if(loading)return;
  activeOwner.current=owner;
  void Promise.resolve().then(async()=>{
   if(cancelled)return;setReady(false);setConflict(false);setNotice('');
   try{
    setHasBackup(!!owner&&!!localStorage.getItem('shalom-study-user:'+owner+':backup'));
    if(owner){
     const copy=readStudy(owner);setStudy(copy?.data||blankStudy);setConflict(!!copy?.conflict);
     if(copy?.dirty)setNotice(copy.conflict?'Hay un conflicto pendiente. Tu copia local se conserva.':'Tienes cambios locales pendientes de sincronizar.');
     if(actor&&online)await sync(owner);
    }else{setStudy(JSON.parse(localStorage.getItem('shalom-study-guest')||'null')||blankStudy)}
   }catch(error){setNotice(error instanceof Error?error.message:'No se pudo abrir la copia local.')}
   finally{if(!cancelled)setReady(true)}
  });
  return()=>{cancelled=true;activeOwner.current=null};
 },[loading,owner,actor,online,sync]);
 useEffect(()=>{
  const update=(event:StorageEvent)=>{
   if(owner&&event.key==='shalom-study-user:'+owner){try{const copy=readStudy(owner);if(copy){setStudy(copy.data);setConflict(!!copy.conflict)}}catch{setNotice('No se pudo leer el cambio de la otra ventana.')}}
  };
  window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);
 },[owner]);
 async function persist(next:Study){
  if(!ready||busy.current)return;
  try{
   if(owner){
    const previous=readStudy(owner);
    // Never guess a server revision when no synchronized baseline exists.
    const copy:StudyCopy={data:next,revision:previous?.revision??0,dirty:true,conflict:previous?.conflict||!previous};
    writeStudy(owner,copy);setStudy(next);setConflict(!!copy.conflict);
    setNotice(copy.conflict?'Tus cambios están guardados localmente. Revisa la versión de nube antes de sincronizar.':'Guardado en este dispositivo. Pendiente de sincronizar.');
    if(actor&&online)await sync(owner);
   }else{localStorage.setItem('shalom-study-guest',JSON.stringify(next));setStudy(next)}
  }catch{setNotice('No se pudo guardar en este dispositivo. Revisa el espacio disponible; el cambio no se aplicó.')}
 }
 function exportLocal(){
  const blob=new Blob([JSON.stringify(study,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='shalom-guardados-locales.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function exportBackup(){
  if(!owner)return;
  try{
   const raw=localStorage.getItem('shalom-study-user:'+owner+':backup');
   if(!raw){setNotice('Aún no existe un respaldo anterior en este dispositivo.');return}
   const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob);
   const link=document.createElement('a');link.href=url;link.download='shalom-guardados-respaldo.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{setNotice('No se pudo exportar el respaldo.')}
 }
 async function selectCloud(){
  if(!owner||!actor||!online||busy.current)return;
  busy.current=true;setSaving(true);
  try{
   const response=await fetch('/api/study',{cache:'no-store'});if(!response.ok)throw Error();
   const result=await response.json() as {data:Study;revision:number};
   const copy=readStudy(owner);if(copy){preserveStudy(owner,copy);setHasBackup(true)}
   writeStudy(owner,{data:result.data,revision:result.revision,dirty:false});setStudy(result.data);setConflict(false);setNotice('Se abrió la versión de nube. Tu versión anterior se conservó como respaldo local.');
  }catch{setNotice('No se pudo abrir la versión de nube. Tu copia local se conserva.')}
  finally{busy.current=false;setSaving(false)}
 }
 // Keep local edits, but only rebase them onto a freshly reviewed cloud revision after an explicit action.
 async function keepLocal(){
  if(!owner||!actor||!online||busy.current)return;
  busy.current=true;setSaving(true);
  try{
   const response=await fetch('/api/study',{cache:'no-store'});if(!response.ok)throw Error();
   const cloud=await response.json() as {data:Study;revision:number};
   const local=readStudy(owner);if(!local)throw Error();
   preserveStudy(owner,{data:cloud.data,revision:cloud.revision,dirty:false});
   setHasBackup(true);
   const saved=await fetch('/api/study',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:local.data,revision:cloud.revision})});
   if(!saved.ok)throw Error();const result=await saved.json() as {revision:number};
   const latest=readStudy(owner);
   if(latest&&JSON.stringify(latest.data)!==JSON.stringify(local.data)){
    writeStudy(owner,{...latest,conflict:true});setStudy(latest.data);setConflict(true);setNotice('Cambió la copia de otra ventana durante la sincronización. Revisa el conflicto.');return;
   }
   writeStudy(owner,{data:local.data,revision:result.revision,dirty:false});setConflict(false);setNotice('Se sincronizó tu versión local. La versión anterior de nube se conservó como respaldo local.');
  }catch{setNotice('La nube cambió o no está disponible. Tu copia local sigue pendiente; vuelve a revisar el conflicto.')}
  finally{busy.current=false;setSaving(false)}
 }
 return {study,ready,saving,persist,notice,setNotice,conflict,exportLocal,exportBackup,hasBackup,selectCloud,keepLocal,canSync:!!actor&&online};
}
