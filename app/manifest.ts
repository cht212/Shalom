import type {MetadataRoute} from 'next';
import {installationIcon} from '../lib/branding';

// Installed browsers must recheck current branding rather than a cached manifest.
export const dynamic='force-dynamic';

export default function manifest():MetadataRoute.Manifest{
 return {
  id:'/',name:'Misión Cristiana Shalom',short_name:'Shalom',lang:'es',
  description:'Tu Biblia y comunidad de Misión Cristiana Shalom.',start_url:'/',scope:'/',display:'standalone',
  background_color:'#075bd8',theme_color:'#075bd8',
  icons:[192,512].flatMap(size=>[
   {src:installationIcon(`shalom-2026-${size}.png`),sizes:`${size}x${size}`,type:'image/png',purpose:'any' as const},
   {src:installationIcon(`shalom-2026-maskable-${size}.png`),sizes:`${size}x${size}`,type:'image/png',purpose:'maskable' as const},
  ]),
 };
}
