export type BibleVersion='bes'|'rv1909';
export const DEFAULT_BIBLE_VERSION:BibleVersion='bes';
export const BIBLE_VERSIONS=[
 {id:'bes' as const,name:'Biblia en Español Sencillo 2026',shortName:'Español Sencillo 2026',description:'Español actual · Dominio público'},
 {id:'rv1909' as const,name:'Reina-Valera 1909',shortName:'Reina-Valera 1909',description:'Versión histórica · Dominio público'},
];
export function isBibleVersion(value:unknown):value is BibleVersion{return value==='bes'||value==='rv1909'}
