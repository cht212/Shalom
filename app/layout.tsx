import type { Metadata,Viewport } from 'next';
import './globals.css';
import './reader-responsive.css';
import './panel-responsive.css';
import ThemeToggle from './theme-toggle';
import {SessionProvider} from './use-session';
import PwaRuntime from './pwa-runtime';
import './pwa.css';
import './fonts.css';
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#10375c',viewportFit:'cover'};
export const metadata: Metadata = {title:'Shalom · Comunidad',appleWebApp:{capable:true,statusBarStyle:'default',title:'Shalom'},description:'Cuidamos a cada persona. Gestión de células de la iglesia Shalom.',icons:{icon:{url:'/branding/emblema-shalom.png',type:'image/png'},apple:'/branding/pwa-180.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('shalom-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch{}`}}/></head><body><SessionProvider><PwaRuntime>{children}</PwaRuntime><ThemeToggle/></SessionProvider></body></html>}
