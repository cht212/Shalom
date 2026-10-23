import {cookies} from 'next/headers';
import {db} from '../../../../lib/server';
import {digest} from '../../../../lib/passwords';
export async function GET(request:Request){const token=(await cookies()).get('shalom_session')?.value;if(token)await db().prepare('DELETE FROM sessions WHERE token=?').bind(await digest(token)).run();return new Response(null,{status:303,headers:{Location:new URL('/',request.url).toString(),'Set-Cookie':'shalom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'}})}
