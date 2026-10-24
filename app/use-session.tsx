'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import type {Actor} from '../lib/access';
import {ACTIVE_STUDY_USER} from '../lib/study-storage';
import {reportNetworkAvailable,reportNetworkUnavailable} from './use-online';

type Session={actor:Actor|null;studyOwner:string|null;loading:boolean};
const SessionContext=createContext<{session:Session;seed:(actor:Actor)=>void}|null>(null);

// The root layout survives client navigation. Keep identity in memory only.
export function SessionProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session>({actor:null,studyOwner:null,loading:true});
 const seedSession=useCallback((actor:Actor)=>{
  try{localStorage.setItem(ACTIVE_STUDY_USER,actor.id)}catch{}
  setSession(current=>current.actor===actor&&!current.loading?current:{actor,studyOwner:actor.id,loading:false});
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  const load=()=>fetch('/api/session',{signal:typeof AbortSignal.any==='function'&&typeof AbortSignal.timeout==='function'?AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]):controller.signal,cache:'no-store'})
   .then(async response=>{
    reportNetworkAvailable();
    if(!response.ok)throw Error('Session unavailable');
    return response.json() as Promise<{actor:Actor|null}>;
   })
   .then(({actor})=>{
    try{if(actor)localStorage.setItem(ACTIVE_STUDY_USER,actor.id);else localStorage.removeItem(ACTIVE_STUDY_USER)}catch{}
    setSession({actor,studyOwner:actor?.id||null,loading:false});
   })
   .catch((error:unknown)=>{
    if(!controller.signal.aborted&&(error instanceof TypeError||error instanceof DOMException&&error.name==='TimeoutError'))reportNetworkUnavailable();
    if(!controller.signal.aborted){let studyOwner:string|null=null;try{studyOwner=localStorage.getItem(ACTIVE_STUDY_USER)}catch{}
     setSession(current=>({...current,studyOwner:current.actor?.id||studyOwner,loading:false}));
    }
   });
  void load();window.addEventListener('online',load);window.addEventListener('focus',load);
  const timer=setInterval(()=>{if(!document.hidden)void load()},30000);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('online',load);window.removeEventListener('focus',load)};
 },[]);
 return <SessionContext.Provider value={{session,seed:seedSession}}>{children}</SessionContext.Provider>;

}

export function useSession(initialActor?:Actor){
 const context=useContext(SessionContext);
 if(!context)throw Error('useSession requires SessionProvider');
 const {seed}=context;
 useEffect(()=>{if(initialActor)seed(initialActor)},[initialActor,seed]);
 return context.session;
}
