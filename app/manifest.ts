import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
 return {
  id:'/',name:'Shalom Christian Church',short_name:'Shalom',lang:'es',
  description:'Tu Biblia y comunidad Shalom.',start_url:'/',scope:'/',display:'standalone',
  background_color:'#f8f7f4',theme_color:'#10375c',
  icons:[192,512].flatMap(size=>[
   {src:`/branding/pwa-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any' as const},
   {src:`/branding/pwa-maskable-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'maskable' as const},
  ]),
 };
}
