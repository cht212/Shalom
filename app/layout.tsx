import type { Metadata,Viewport } from 'next';
import {installationIcon} from '../lib/branding';
import './globals.css';
import './reader-responsive.css';
import './panel-responsive.css';
import ThemeToggle from './theme-toggle';
import {SessionProvider} from './use-session';
import PwaRuntime from './pwa-runtime';
import './pwa.css';
import './fonts.css';
import './product-polish.css';
import './formation.css';
import './management.css';
import './reader-search.css';
import './home.css';

export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:[{media:'(prefers-color-scheme: light)',color:'#f6f5f2'},{media:'(prefers-color-scheme: dark)',color:'#171b1d'}],viewportFit:'cover'};
export const metadata:Metadata={title:'Misión Cristiana Shalom',appleWebApp:{capable:true,statusBarStyle:'default',title:'Misión Cristiana Shalom'},formatDetection:{telephone:false},description:'Biblia, comunidad y cuidado pastoral de Misión Cristiana Shalom.',icons:{icon:[{url:installationIcon('shalom-2026-icon.png'),type:'image/png'},{url:installationIcon('shalom-2026-192.png'),sizes:'192x192',type:'image/png'}],apple:{url:installationIcon('shalom-2026-180.png'),sizes:'180x180',type:'image/png'}}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('shalom-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';document.documentElement.dataset.appMode=matchMedia('(display-mode: standalone)').matches||navigator.standalone?'standalone':'web'}catch{}`}}/></head><body><SessionProvider><PwaRuntime>{children}</PwaRuntime><ThemeToggle/></SessionProvider></body></html>}
