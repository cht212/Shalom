'use client';

import {useEffect,useState} from 'react';

export default function AppSplash(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const start=performance.now();
  const finish=()=>setTimeout(()=>setVisible(false),Math.max(0,650-(performance.now()-start)));
  if(document.readyState==='complete')finish();else window.addEventListener('load',finish,{once:true});
  const fallback=window.setTimeout(()=>setVisible(false),1800);
  return()=>{window.removeEventListener('load',finish);window.clearTimeout(fallback)};
 },[]);
 if(!visible)return null;
 return <div className="app-splash" role="status" aria-label="Cargando Shalom"><img src="/branding/shalom-icon.png" alt="Shalom"/><span>Preparando tu lectura</span><i/></div>;
}
