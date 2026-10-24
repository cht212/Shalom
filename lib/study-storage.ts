export type Mark={book:string;chapter:number;verse:string};
export type Study={highlights:Mark[];bookmarks:Mark[];last:{book:string;chapter:number}|null};
export type StudyCopy={data:Study;revision:number;dirty:boolean;conflict?:boolean};
export const blankStudy:Study={highlights:[],bookmarks:[],last:null};
export const ACTIVE_STUDY_USER='shalom-study-active-user';
const key=(owner:string)=>'shalom-study-user:'+owner;
export function readStudy(owner:string):StudyCopy|null{
 const raw=localStorage.getItem(key(owner));if(!raw)return null;
 const value=JSON.parse(raw) as StudyCopy;
 if(!value.data||!Array.isArray(value.data.bookmarks)||!Array.isArray(value.data.highlights)||!Number.isInteger(value.revision))throw Error('La copia local de tus guardados no es válida.');
 return value;
}
export function writeStudy(owner:string,copy:StudyCopy){localStorage.setItem(key(owner),JSON.stringify(copy))}
export function preserveStudy(owner:string,copy:StudyCopy){localStorage.setItem(key(owner)+':backup',JSON.stringify(copy))}
