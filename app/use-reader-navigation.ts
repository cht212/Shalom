'use client';
import {useSyncExternalStore} from 'react';

const collapsedKey='shalom-reader-nav-collapsed';
const navigationChange='shalom-reader-navigation-change';
function subscribe(callback:()=>void){
 window.addEventListener('storage',callback);
 window.addEventListener(navigationChange,callback);
 return()=>{
  window.removeEventListener('storage',callback);
  window.removeEventListener(navigationChange,callback);
 };
}
function getSnapshot(){
 try{return localStorage.getItem(collapsedKey)!=='false'}catch{return true}
}
function toggleNavigation(){
 try{localStorage.setItem(collapsedKey,String(!getSnapshot()))}catch{}
 window.dispatchEvent(new Event(navigationChange));
}
export function useReaderNavigation(){
 const collapsed=useSyncExternalStore(subscribe,getSnapshot,()=>true);
 return {collapsed,toggleNavigation};
}
