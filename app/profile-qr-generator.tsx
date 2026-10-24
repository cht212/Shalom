'use client';

import {useState} from 'react';
import QRCode from 'qrcode';
import {Download,QrCode,X} from 'lucide-react';

type Cell={id:string;name:string};

export default function ProfileQrGenerator({cells}:{cells:Cell[]}){
 const [cell,setCell]=useState(cells[0]?.id||'');
 const [qr,setQr]=useState('');
 const [link,setLink]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const selected=cells.find(item=>item.id===cell);

 async function generate(){
  if(!cell)return;
  setBusy(true);
  setError('');
  try{
   const response=await fetch('/api/invites',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({cell}),
   });
   const result=await response.json() as {url?:string;error?:string};
   if(!response.ok||!result.url)throw Error(result.error||'No se pudo generar el QR.');
   setLink(result.url);
   setQr(await QRCode.toDataURL(result.url,{width:320,margin:2,color:{dark:'#10375c',light:'#ffffff'}}));
  }catch(cause){
   setError((cause as Error).message);
  }finally{
   setBusy(false);
  }
 }

 return <section className="panel profileqr">
  <div className="profileqrheading">
   <span className="iconbox blue"><QrCode size={22}/></span>
   <div><h2>QR de registro</h2><p>Genera una invitación para registrar personas nuevas en tu célula.</p></div>
  </div>
  {error&&<div className="notice error" role="alert">{error}</div>}
  {cells.length?<div className="profileqractions">
   <label>Célula<select value={cell} onChange={event=>setCell(event.target.value)}>{cells.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
   <button className="primary" onClick={generate} disabled={!cell||busy}><QrCode size={17}/>{busy?'Generando…':'Generar QR'}</button>
  </div>:<div className="notice neutral">No tienes una célula asignada para generar invitaciones.</div>}
  <small>La invitación será válida durante 30 días.</small>
  {qr&&<div className="modalbackdrop" onClick={()=>setQr('')}>
   <section className="modal qrcontent" role="dialog" aria-modal="true" aria-labelledby="profile-qr-title" onClick={event=>event.stopPropagation()}>
    <button className="close" onClick={()=>setQr('')} aria-label="Cerrar QR"><X size={20}/></button>
    <h2 id="profile-qr-title">Registro de {selected?.name}</h2>
    {/* El QR se genera localmente como una URL de datos, por eso no usa next/image. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={qr} width={260} height={260} alt={'QR para registrarse en '+(selected?.name||'la célula')}/>
    <p>Invitación válida durante 30 días.</p>
    <a className="primary" href={qr} download="registro-celula.png"><Download size={16}/>Descargar QR</a>
    <a className="outline" href={link} target="_blank" rel="noreferrer">Abrir formulario</a>
   </section>
  </div>}
 </section>;
}
