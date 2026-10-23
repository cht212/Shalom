import type { Metadata } from 'next';
import './globals.css';
import './reader-responsive.css';
import ThemeToggle from './theme-toggle';
export const metadata: Metadata = {title:'Shalom · Comunidad',description:'Cuidamos a cada persona. Gestión de células de la iglesia Shalom.',icons:{icon:{url:'/branding/emblema-shalom.png',type:'image/png'},apple:'/branding/emblema-shalom.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('shalom-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch{}`}}/></head><body>{children}<ThemeToggle/></body></html>}
