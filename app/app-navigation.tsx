'use client';

import {useRouter} from 'next/navigation';
import ReaderHeader from './reader-header';

export default function AppNavigation(){
 const router=useRouter();
 return <ReaderHeader actor={null} view="home" onHome={()=>router.push('/')} onRead={()=>router.push('/?view=bible')} onSaved={()=>router.push('/?view=saved')} onDevotional={()=>router.push('/?view=devocional')}/>;
}
