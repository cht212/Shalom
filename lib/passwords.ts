const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('');
export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)).buffer)}
export async function digest(value:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))}
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
export function equalHash(a:string,b:string){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0}
