export function limaDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima'}).format(now)}
// Selected for standalone teaching, encouragement and practical guidance.
export const dailySelections=[
 ['PRO',3,'5'],['PRO',4,'23'],['PRO',15,'1'],['PRO',16,'3'],['PRO',17,'17'],['PRO',19,'20'],
 ['PSA',23,'1'],['PSA',27,'1'],['PSA',34,'8'],['PSA',37,'5'],['PSA',46,'1'],['PSA',55,'22'],['PSA',119,'105'],['PSA',121,'2'],
 ['MAT',5,'9'],['MAT',6,'33'],['MAT',7,'12'],['MAT',11,'28'],
 ['ROM',12,'2'],['ROM',12,'12'],['ROM',12,'21'],['PHP',4,'6'],['PHP',4,'13'],['GAL',6,'9'],['EPH',4,'32'],['COL',3,'23'],
 ['1TH',5,'11'],['1TH',5,'16'],['1TH',5,'18'],['JAS',1,'5'],['JAS',1,'19'],['1PE',5,'7'],['1CO',13,'4'],['1CO',13,'13'],
 ['2TI',1,'7'],['HEB',13,'16'],['ISA',40,'31'],['ISA',41,'10'],['JOS',1,'9'],['MIC',6,'8'],['DEU',31,'6'],
] as const;
function hash(value:string){let n=2166136261;for(const c of value){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0}
const rotation=[...dailySelections].sort((a,b)=>hash(a.join(':'))-hash(b.join(':')));
export function dailyPosition(date:string){const day=Math.floor(Date.parse(date+'T12:00:00Z')/86400000);if(!Number.isFinite(day))throw Error('Fecha inválida');const [book,chapter,verse]=rotation[((day%rotation.length)+rotation.length)%rotation.length];return {book,chapter,verse}}
