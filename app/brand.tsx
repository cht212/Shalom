'use client';
import Link from 'next/link';
import Image from 'next/image';
export default function Brand({className='readerbrand'}:{className?:string}){
 return <Link className={className+' shalom-brand'} href="/" aria-label="Shalom Christian Church · Inicio"><Image src="/branding/emblema-shalom.png" alt="" aria-hidden="true" className="shalom-emblem" width={1248} height={1248} priority/><span className="brand-wordmark">SHALOM<small>CHRISTIAN CHURCH</small></span></Link>
}
