'use client';
import {useCallback,useEffect,useState} from 'react';
import type {FormationPayload} from '../lib/formation';
const empty:FormationPayload={books:[],own:[],responses:[],assignments:[],leaders:[],members:[],canGrant:false,canEdit:false,revision:0};
export function useFormation(){
 const [data,setData]=useState(empty),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async(signal?:AbortSignal)=>{try{const r=await fetch('/api/formation',{cache:'no-store',signal});const j=await r.json();if(!r.ok)throw Error(j.error||'No se pudo cargar la formación.');if(!signal?.aborted){setData(j);setError('')}}catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'No se pudo cargar la formación.')}finally{if(!signal?.aborted)setLoading(false)}},[]);
 useEffect(()=>{const controller=new AbortController();void Promise.resolve().then(()=>load(controller.signal));const refresh=()=>void load(controller.signal);window.addEventListener('focus',refresh);return()=>{controller.abort();window.removeEventListener('focus',refresh)}},[load]);
 async function save(body:object|FormData,endpoint='/api/formation'){
  setBusy(true);setError('');setMessage('');try{const form=body instanceof FormData;const r=await fetch(endpoint,{method:'POST',headers:form?undefined:{'Content-Type':'application/json'},body:form?body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'No se pudieron guardar los cambios.');await load();setMessage('Cambios guardados.');return true}catch(e){setError(e instanceof Error?e.message:'No se pudieron guardar los cambios.');return false}finally{setBusy(false)}
 }
 return {data,loading,error,message,busy,load,save};
}
