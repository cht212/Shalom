'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Brand({className='readerbrand'}:{className?:string}){
 return <Link className={className+' shalom-brand'} href="/" aria-label="Misión Cristiana Shalom · Inicio"><Image src="/branding/shalom-app-icon.png" alt="" aria-hidden="true" className="shalom-emblem" width={1024} height={1024} sizes="48px" priority/><span className="brand-wordmark"><small>MISIÓN CRISTIANA</small>SHALOM</span></Link>
}
