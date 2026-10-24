'use client';
import Link from 'next/link';
import Image from 'next/image';
export default function Brand({className='readerbrand'}:{className?:string}){
 return <Link className={className+' shalom-brand'} href="/" aria-label="Shalom Christian Church · Inicio"><Image src="/branding/logo-shalom-transparent.png" alt="Shalom Christian Church" className="shalom-logo-transparent" width={1448} height={1086} priority/></Link>
}
