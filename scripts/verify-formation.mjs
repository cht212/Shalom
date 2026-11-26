// Creates an isolated schema; production records are read, never modified.
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID,pbkdf2Sync} from 'node:crypto';
import postgres from 'postgres';

if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const url=process.env.DATABASE_URL;
if(!url)throw Error('Configura DATABASE_URL para comprobar la formación.');
for(const key of ['SHALOM_TEST_ADMIN_PASSWORD','SHALOM_TEST_LEADER_PASSWORD','SHALOM_TEST_SECOND_LEADER_PASSWORD'])if(!process.env[key])throw Error('Configura las contraseñas de prueba mediante variables de entorno.');
const schema='shalom_verify_'+randomUUID().replaceAll('-','');
if(!/^shalom_verify_[a-f0-9]{32}$/.test(schema))throw Error('Invalid isolated schema');
const source=postgres(url,{max:1,prepare:false,connect_timeout:15});
let isolated,server,created=false;
const port=3700;
try{const response=await fetch('http://localhost:'+port+'/ingresar');if(response)throw Error('El puerto 3700 ya está ocupado. Detén ese servidor antes de ejecutar la verificación.')}catch(error){if(!String(error.message).includes('fetch failed')){await source.end({timeout:5});throw error}}
const direct=new URL(url);direct.hostname=direct.hostname.replace('-pooler.','.');direct.searchParams.set('options','-csearch_path='+schema);
try{
 await source.unsafe(`CREATE SCHEMA "${schema}"`);created=true;
 const tables=['church','accounts','credentials','sessions','attempts','study','invites','devotions'];
 for(const table of tables)await source.unsafe(`CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`);
 for(const table of ['church','accounts','credentials'])await source.unsafe(`INSERT INTO "${schema}"."${table}" SELECT * FROM public."${table}"`);
 isolated=postgres(direct.toString(),{max:1,prepare:false,connect_timeout:15});
 const [{current_schema:actual}]=await isolated`SELECT current_schema()`;
 if(actual!==schema)throw Error('Schema isolation check failed');
 const [row]=await isolated`SELECT data FROM church WHERE id='shalom'`;
 const data=JSON.parse(row.data);
 const [leader]=await isolated`SELECT id,cell,sector FROM accounts a JOIN credentials c ON c.account=a.id WHERE c.username='albert'`;
 if(!leader?.cell)throw Error('Missing leader cell');
 const memberId='verification-member',outsideId='verification-outside';
 data.cells.push({id:'verification-other-cell',name:'Célula externa de verificación',sector:'verification-sector',leader:'Verificación'});
 data.people.push({id:memberId,name:'Discípulo de verificación',cell:leader.cell,phone:'000000000',joined:'2026-11-26'},{id:outsideId,name:'Miembro fuera de alcance',cell:'verification-other-cell',phone:'000000001',joined:'2026-11-26'});
 await isolated`UPDATE church SET data=${JSON.stringify(data)} WHERE id='shalom'`;
 const password=randomBytes(24).toString('hex');
 for(const [id,person,cell]of [['verification-account',memberId,leader.cell],['verification-other-account',outsideId,'verification-other-cell']]){
  const salt=randomBytes(32).toString('hex'),hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');
  await isolated`INSERT INTO accounts (id,email,name,role,cell,person,active) VALUES (${id},${id+'@example.invalid'},${id},'disciple',${cell},${person},1)`;
  await isolated`INSERT INTO credentials (account,username,salt,hash,must_change) VALUES (${id},${id},${salt},${hash},0)`;
 }
 console.log('Isolated test schema ready; production records unchanged.');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3700'],{env:{...process.env,DATABASE_URL:direct.toString(),APP_URL:'http://localhost:3700'},stdio:['ignore','ignore','ignore'],windowsHide:true});
 let ready=false;for(let attempt=0;attempt<40;attempt++){try{const r=await fetch('http://localhost:3700/ingresar');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}
 if(!ready)throw Error('Test server unavailable');
 const child=spawn('python',['tests/formation-workflow.py'],{env:{...process.env,SHALOM_TEST_MEMBER_PASSWORD:password,SHALOM_TEST_LEADER_ID:leader.id,SHALOM_TEST_MEMBER_ID:memberId,SHALOM_TEST_OUTSIDE_ID:outsideId},stdio:'inherit',windowsHide:true});
 const code=await new Promise(resolve=>child.on('exit',resolve));if(code!==0)throw Error('Formation workflow failed');
}catch(error){console.error('Verification failed:',error.code||error.message);process.exitCode=1}
finally{
 if(server){server.kill();await new Promise(resolve=>server.once('exit',resolve))}
 if(isolated)await isolated.end({timeout:5});
 if(created){await source.unsafe(`DROP SCHEMA "${schema}" CASCADE`);console.log('Removed isolated test schema and its test records.');}
 await source.end({timeout:5});
}
