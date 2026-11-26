import {existsSync} from 'node:fs';
import postgres from 'postgres';

if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(!process.env.DATABASE_URL){
 console.log('Falta completar DATABASE_URL en .env.local. No se consultó ninguna base.');
 process.exitCode=1;
}else{
 let sql;
 try{
  sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,connect_timeout:12});
  const rows=await sql`SELECT c.username,a.name,a.role,a.active FROM accounts a LEFT JOIN credentials c ON c.account=a.id ORDER BY a.name`;
  console.log(JSON.stringify({accounts:rows},null,2));
 }catch(error){
  console.error('No se pudo consultar las cuentas. Código:',typeof error.code==='string'?error.code:'CONNECTION_FAILED');
  process.exitCode=1;
 }finally{if(sql)await sql.end({timeout:5})}
}
