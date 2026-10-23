'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export default function ThemeToggle({variant='floating'}:{variant?:'floating'|'inline'|'nav'}){
 const [dark,setDark]=useState(false);
 useEffect(()=>{const update=()=>setDark(document.documentElement.dataset.theme==='dark');update();const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});const query=matchMedia('(prefers-color-scheme: dark)');const onSystem=()=>{try{if(localStorage.getItem('shalom-theme'))return}catch{}document.documentElement.dataset.theme=query.matches?'dark':'light';update()};query.addEventListener('change',onSystem);return()=>{observer.disconnect();query.removeEventListener('change',onSystem)}},[]);
 function toggle(){const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';try{localStorage.setItem('shalom-theme',next?'dark':'light')}catch{}}
 return <button className={variant==='floating'?'theme-toggle':variant==='nav'?'theme-nav':'outline theme-inline'} onClick={toggle} aria-label={dark?'Activar modo claro':'Activar modo oscuro'} title={dark?'Modo claro':'Modo oscuro'}>{dark?<Sun size={20}/>:<Moon size={20}/>}</button>
}
