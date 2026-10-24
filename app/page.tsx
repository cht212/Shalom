import Bible from './bible';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==='string'?params[key]:undefined;
 return <Bible key={[value('view'),value('book'),value('chapter'),value('verse')].join(':')} initialView={value('view')} initialBook={value('book')} initialChapter={Number(value('chapter'))} initialVerse={value('verse')}/>;
}
