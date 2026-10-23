'use client';

import {useEffect,useState} from 'react';

type ProfilePerson={
 name:string;
 phone:string;
 age:number|null;
 address:string;
 maritalStatus?:string;
};

type ProfileResponse={person:ProfilePerson|null};

export default function ProfileWorkspace(){
 const [person,setPerson]=useState<ProfilePerson|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  fetch('/api/profile')
   .then(async response=>{
    const result=await response.json() as ProfileResponse & {error?:string};
    if(!response.ok)throw Error(result.error||'No se pudo cargar el perfil.');
    setPerson(result.person);
   })
   .catch(cause=>setError((cause as Error).message))
   .finally(()=>setLoaded(true));
 },[]);

 if(!loaded)return <p>Cargando perfil…</p>;

 return <section className="panel profileedit">
  <h2>Mis datos personales</h2>
  {message&&<div role="status" className="notice">{message}</div>}
  {error&&<div role="alert" className="notice error">{error}</div>}
  {person?<form onSubmit={async event=>{
   event.preventDefault();
   setBusy(true);
   setError('');
   setMessage('');
   const form=new FormData(event.currentTarget);
   try{
    const response=await fetch('/api/profile',{
     method:'PATCH',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({
      name:form.get('name'),
      phone:form.get('phone'),
      age:Number(form.get('age')),
      address:form.get('address'),
      maritalStatus:form.get('maritalStatus'),
     }),
    });
    const result=await response.json() as {error?:string};
    if(!response.ok)throw Error(result.error||'No se pudieron actualizar los datos.');
    setMessage('Datos actualizados. Se usarán en los próximos informes.');
   }catch(cause){
    setError((cause as Error).message);
   }finally{
    setBusy(false);
   }
  }}>
   <label>Nombre y apellidos<input name="name" required defaultValue={person.name}/></label>
   <div className="formcolumns">
    <label>Teléfono<input name="phone" type="tel" required defaultValue={person.phone}/></label>
    <label>Edad<input name="age" type="number" min={0} max={120} required defaultValue={person.age??''}/></label>
   </div>
   <label>Dirección<input name="address" maxLength={300} defaultValue={person.address||''} placeholder="Completa tu dirección"/></label>
   <label>Estado civil<select name="maritalStatus" defaultValue={person.maritalStatus||''}>
    <option value="">Por completar</option>
    {['Soltero/a','Casado/a','Conviviente','Viudo/a','Divorciado/a'].map(status=><option key={status}>{status}</option>)}
   </select></label>
   <button className="primary" disabled={busy}>{busy?'Guardando…':'Guardar mis datos'}</button>
  </form>:<p>El administrador debe vincular tu cuenta a su registro de persona.</p>}
 </section>;
}
