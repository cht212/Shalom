'use client';

import {useRouter} from 'next/navigation';
import ReaderHeader from './reader-header';
import {useSession} from './use-session';
import type {Actor} from '../lib/access';
import {searchBibleReferences} from '../lib/bible-reference';
import books from '../public/bible/books.json';

export default function AppNavigation({actor:initialActor,view='home'}:{actor?:Actor;view?:'home'|'profile'}={}){
 const router=useRouter();
 const {actor,loading}=useSession(initialActor);
 function search(query:string){const matches=searchBibleReferences(query,books).matches.filter(m=>!m.error),match=matches.length===1?matches[0]:null;router.push(match?'/?book='+match.book.id+'&chapter='+(match.chapter??1)+(match.verse?'&verse='+match.verse:''):'/?view=bible&search='+encodeURIComponent(query))}
 return <ReaderHeader actor={actor||initialActor||null} sessionLoading={loading} view={view} onSearch={search} onHome={()=>router.push('/')} onRead={()=>router.push('/?view=bible')} onSaved={()=>router.push('/?view=saved')} onDevotional={()=>router.push('/?view=devocional')}/>;
}
