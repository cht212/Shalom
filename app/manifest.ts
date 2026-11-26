import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
 return {
  id:'/',name:'Misión Cristiana Shalom',short_name:'Shalom',lang:'es',
  description:'Tu Biblia y comunidad de Misión Cristiana Shalom.',start_url:'/',scope:'/',display:'standalone',
  background_color:'#f5f9ff',theme_color:'#0867d8',
  icons:[192,512].flatMap(size=>[
   {src:`/branding/shalom-2026-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any' as const},
   {src:`/branding/shalom-2026-maskable-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'maskable' as const},
  ]),
 };
}
