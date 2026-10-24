export const BIBLE_CACHE='shalom-bible-rv1909-v1';
export type AudioDownload={key:string;title:string;blob:Blob;bytes:number};

function database():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('shalom-downloads',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('audio',{keyPath:'key'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(Error('No se pudo abrir el almacenamiento de audio.'));
 });
}
async function audioOperation<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await database();
 return new Promise((resolve,reject)=>{
  const transaction=db.transaction('audio',mode);
  const request=operation(transaction.objectStore('audio'));
  transaction.oncomplete=()=>{db.close();resolve(request.result)};
  transaction.onabort=()=>{db.close();reject(transaction.error||Error('No se pudo guardar el audio.'))};
  transaction.onerror=()=>{db.close();reject(transaction.error||Error('El almacenamiento no está disponible.'))};
 });
}
export const getAudio=(key:string)=>audioOperation<AudioDownload|undefined>('readonly',store=>store.get(key));
export const listAudio=()=>audioOperation<AudioDownload[]>('readonly',store=>store.getAll());
export const saveAudio=(audio:AudioDownload)=>audioOperation('readwrite',store=>store.put(audio));
export const deleteAudio=(key:string)=>audioOperation('readwrite',store=>store.delete(key));
export function formatBytes(bytes:number){return bytes<1024*1024?`${(bytes/1024).toFixed(0)} KB`:`${(bytes/1024/1024).toFixed(2)} MB`}
