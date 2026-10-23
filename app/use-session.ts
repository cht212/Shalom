'use client';
import {useEffect,useState} from 'react';
import type {Actor} from '../lib/access';
export function useSession(){const [actor,setActor]=useState<Actor|null>(null),[loading,setLoading]=useState(true);useEffect(()=>{fetch('/api/session').then(r=>{if(!r.ok)throw Error();return r.json() as Promise<{actor:Actor|null}>}).then(r=>setActor(r.actor)).catch(()=>setActor(null)).finally(()=>setLoading(false))},[]);return {actor,loading}}
