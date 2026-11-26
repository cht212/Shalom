'use client';

import {useState} from 'react';

const STORAGE_KEY='shalom-bible-version';
const versions=[{id:'rv1909',name:'Reina-Valera 1909',description:'Texto local y disponible sin conexión.'}];

export default function BiblePreferences(){
 const [version,setVersion]=useState('rv1909');
 function change(next:string){setVersion(next);try{localStorage.setItem(STORAGE_KEY,next);window.dispatchEvent(new CustomEvent('shalom-bible-version-change',{detail:next}))}catch{}}
 return <section className="panel profileedit bible-preferences">
  <div><span className="eyebrow">LECTURA</span><h2>Preferencias de Biblia</h2><p>Elige la versión que quieres usar al leer y estudiar.</p></div>
  <label>Versión bíblica<select value={version} onChange={event=>change(event.target.value)}>{versions.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}<option disabled>Otras versiones · próximamente</option></select></label>
  <small>{versions.find(item=>item.id===version)?.description} Las nuevas versiones aparecerán aquí cuando estén disponibles para lectura sin conexión.</small>
 </section>;
}
