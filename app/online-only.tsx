'use client';
import {useOnline} from './use-online';
import Link from 'next/link';
export function OfflineMessage(){return <section className="panel offline-message"><h2>Esta sección necesita conexión</h2><p>Conéctate para acceder a tu perfil, devocionales y registros. Puedes seguir leyendo tu Biblia y consultar tus guardados descargados.</p><Link className="outline" href="/?view=bible">Abrir la Biblia</Link></section>}
export default function OnlineOnly({children}:{children:React.ReactNode}){
 const online=useOnline();
 // Keep an already-open draft in memory during a temporary disconnection.
 return <>{!online&&<OfflineMessage/>}<div hidden={!online} className="online-only-content">{children}</div></>;
}
