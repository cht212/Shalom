import {cookies} from 'next/headers';
import {digest} from './passwords';
import {db} from './database';
export const SESSION_COOKIE='shalom_session';
export async function localUser(){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return null;const row=await db().prepare('SELECT a.*,c.must_change FROM sessions s JOIN accounts a ON a.id=s.account JOIN credentials c ON c.account=a.id WHERE s.token=? AND s.expires>? AND a.active=1').bind(await digest(token),Date.now()).first<any>();return row?{userId:row.id,email:row.email,displayName:row.name,fullName:row.name,mustChange:!!row.must_change}:null}
