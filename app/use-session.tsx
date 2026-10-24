'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import type {Actor} from '../lib/access';

type Session={actor:Actor|null;loading:boolean};
const SessionContext=createContext<{session:Session;seed:(actor:Actor)=>void}|null>(null);

// The root layout survives client navigation. Keep identity in memory only.
export function SessionProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session>({actor:null,loading:true});
 const seedSession=useCallback((actor:Actor)=>{
  setSession(current=>current.actor===actor&&!current.loading?current:{actor,loading:false});
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/session',{signal:controller.signal,cache:'no-store'})
   .then(async response=>{
    if(!response.ok)throw Error('Session unavailable');
    return response.json() as Promise<{actor:Actor|null}>;
   })
   .then(({actor})=>setSession({actor,loading:false}))
   .catch(()=>{if(!controller.signal.aborted)setSession(current=>({...current,loading:false}))});
  return()=>controller.abort();
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
