// Shalom account session helpers.
import {redirect} from 'next/navigation';
import {localUser} from '../lib/local-auth';
export type ShalomUser={userId:string;displayName:string;email:string;fullName:string|null;mustChange?:boolean};
export const getShalomUser=localUser;
export async function requireShalomUser(returnTo:string):Promise<ShalomUser>{const user=await localUser();if(user)return user;redirect('/ingresar?return_to='+encodeURIComponent(returnTo))}
export const shalomSignInPath=(path='/')=>'/ingresar?return_to='+encodeURIComponent(path);
export const shalomSignOutPath=()=>'/api/auth/logout';
