import {BIBLE_CACHE} from './offline-downloads';
export type Verse={verse:string;text:string};
export async function readBibleBook(book:string,signal?:AbortSignal):Promise<Record<string,Verse[]>>{
 if(!/^[A-Z0-9]{3}$/.test(book))throw Error('Libro inválido.');
 const path='/bible/'+book+'.json';
 let cache:Cache|undefined;
 try{if('caches'in window)cache=await caches.open(BIBLE_CACHE)}catch{}
 const saved=await cache?.match(path);
 if(saved){const data=await saved.json();signal?.throwIfAborted();return data}
 signal?.throwIfAborted();
 const response=await fetch(path,{signal,credentials:'omit'});
 if(!response.ok||!response.headers.get('content-type')?.includes('json'))throw Error('No se pudo cargar el capítulo.');
 const data=await response.clone().json() as Record<string,Verse[]>;
 signal?.throwIfAborted();
 // Also retain the first book read before the service worker gains control.
 try{await cache?.put(path,response)}catch{/* Reading still works if device storage is full. */}
 return data;
}
