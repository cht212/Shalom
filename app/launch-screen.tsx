'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';

export default function LaunchScreen(){
 const [phase,setPhase]=useState<'loading'|'leaving'|'done'>('loading');
 useEffect(()=>{
  if(!matchMedia('(display-mode: standalone)').matches&&!(navigator as Navigator&{standalone?:boolean}).standalone)return;
  const started=performance.now();let finishTimer:ReturnType<typeof setTimeout>,removeTimer:ReturnType<typeof setTimeout>,finished=false;
  const finish=()=>{if(finished)return;finished=true;finishTimer=setTimeout(()=>{setPhase('leaving');removeTimer=setTimeout(()=>setPhase('done'),180)},Math.max(0,450-(performance.now()-started)))};
  const fallback=setTimeout(finish,2500);
  if(document.readyState==='complete')finish();else window.addEventListener('load',finish,{once:true});
  return()=>{clearTimeout(fallback);clearTimeout(finishTimer);clearTimeout(removeTimer);window.removeEventListener('load',finish)};
 },[]);
 if(phase==='done')return null;
 return <div className="app-launch-screen" data-phase={phase} aria-hidden="true"><div className="app-launch-identity"><Image src="/branding/shalom-2026-icon.png" alt="" width={136} height={136} priority unoptimized/><strong>SHALOM</strong><span>MISIÓN CRISTIANA</span></div><span className="app-launch-progress"><i/><i/><i/></span></div>;
}
