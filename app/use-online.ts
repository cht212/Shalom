'use client';
import {useSyncExternalStore} from 'react';
let reachable=true;
export function reportNetworkUnavailable(){reachable=false;window.dispatchEvent(new Event('shalom-connection'))}
export function reportNetworkAvailable(){reachable=true;window.dispatchEvent(new Event('shalom-connection'))}
function subscribe(callback:()=>void){
 const online=()=>{reachable=true;callback()};
 window.addEventListener('online',online);window.addEventListener('offline',callback);window.addEventListener('shalom-connection',callback);
 return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',callback);window.removeEventListener('shalom-connection',callback)};
}
export function isOnline(){return navigator.onLine&&reachable}
export function useOnline(){return useSyncExternalStore(subscribe,isOnline,()=>true)}
