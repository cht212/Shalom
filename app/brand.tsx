'use client';
import {useState} from 'react';
export default function Brand({className='readerbrand'}:{className?:string}){
 const [missing,setMissing]=useState(false);
 return <a className={className+' shalom-brand'} href="/" aria-label="Shalom Christian Church · Inicio">{!missing&&<><img src="/branding/logo-shalom.png" alt="Shalom Christian Church" className="shalom-logo" onError={()=>setMissing(true)}/><img src="/branding/emblema-shalom.png" alt="" aria-hidden="true" className="shalom-emblem"/></>}<span className={'brand-wordmark'+(missing?' brand-fallback':'')}>SHALOM<small>CHRISTIAN CHURCH</small></span></a>
}
