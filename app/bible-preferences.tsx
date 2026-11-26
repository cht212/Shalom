'use client';

import {BIBLE_VERSIONS,type BibleVersion} from '../lib/bible-versions';
import {saveBibleVersion,useBibleVersion} from './use-bible-version';
export default function BiblePreferences(){
 const version=useBibleVersion();
 function change(next:string){saveBibleVersion(next as BibleVersion)}
 return <section className="panel profileedit bible-preferences">
  <div><span className="eyebrow">LECTURA</span><h2>Preferencias de Biblia</h2><p>Elige la versión que quieres usar al leer y estudiar.</p></div>
  <label>Versión bíblica<select value={version} onChange={event=>change(event.target.value)}>{BIBLE_VERSIONS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  <small>{BIBLE_VERSIONS.find(item=>item.id===version)?.description}. Ambas versiones están disponibles para lectura sin conexión.</small>
 </section>;
}
