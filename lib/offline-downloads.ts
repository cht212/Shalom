export const BIBLE_CACHE='shalom-bible-texts-v2';
export function formatBytes(bytes:number){return bytes<1024*1024?`${(bytes/1024).toFixed(0)} KB`:`${(bytes/1024/1024).toFixed(2)} MB`}
