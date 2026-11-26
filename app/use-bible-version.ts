'use client';
import {useSyncExternalStore} from 'react';
import {DEFAULT_BIBLE_VERSION,isBibleVersion,type BibleVersion} from '../lib/bible-versions';

const KEY='shalom-bible-version';
const EVENT='shalom-bible-version-change';
function snapshot(){try{const value=localStorage.getItem(KEY);return isBibleVersion(value)?value:DEFAULT_BIBLE_VERSION}catch{return DEFAULT_BIBLE_VERSION}}
function subscribe(callback:()=>void){const changed=()=>callback();window.addEventListener(EVENT,changed);window.addEventListener('storage',changed);return()=>{window.removeEventListener(EVENT,changed);window.removeEventListener('storage',changed)}}
export function useBibleVersion(){return useSyncExternalStore(subscribe,snapshot,()=>DEFAULT_BIBLE_VERSION)}
export function saveBibleVersion(version:BibleVersion){localStorage.setItem(KEY,version);window.dispatchEvent(new Event(EVENT))}
