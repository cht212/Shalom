'use client';
import {useEffect,useRef} from 'react';
import type {LucideIcon} from 'lucide-react';
export default function PanelSections({items,current,onSelect,label}:{items:{id:string;label:string;short?:string;icon:LucideIcon}[];current:string;onSelect:(id:string)=>void;label:string}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{const nav=ref.current,selected=nav?.querySelector<HTMLElement>('[aria-current]');if(nav&&selected)nav.scrollTo({left:selected.offsetLeft-nav.offsetLeft-nav.clientWidth/2+selected.offsetWidth/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})},[current]);
 return <nav ref={ref} className="panel-section-nav" aria-label={label}>{items.map(item=><button key={item.id} aria-current={current===item.id?'page':undefined} onClick={()=>onSelect(item.id)}><item.icon size={16}/>{item.short||item.label}</button>)}</nav>;
}
