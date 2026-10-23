import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Shalom · Comunidad',description:'Cuidamos a cada persona. Gestión de células de la iglesia Shalom.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
