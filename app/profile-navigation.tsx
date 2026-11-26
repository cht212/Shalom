'use client';
import type {Actor} from '../lib/access';
import AppNavigation from './app-navigation';
export default function ProfileNavigation({actor}:{actor:Actor}){return <AppNavigation actor={actor} view="profile"/>}
