import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url),root=resolve(import.meta.dirname,'..');
// Execute actual route modules with an isolated, in-memory database and session.
function loadModule(relative,mocks={},cache=new Map()){
 const path=resolve(root,relative);if(path in mocks)return mocks[path];if(cache.has(path))return cache.get(path).exports;
 if(path.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));
 const compiled=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const record={exports:{}};cache.set(path,record);
 const localRequire=name=>{
  if(!name.startsWith('.'))return require(name);
  let target=resolve(dirname(path),name);
  if(!existsSync(target))target+='.ts';
  return loadModule(target,mocks,cache);
 };
 new Function('require','module','exports',compiled)(localRequire,record,record.exports);
 return record.exports;
}
const base={id:'u1',email:'test@example.invalid',name:'Test',cell:'c1',sector:'s1',person:'p1',role:'disciple'};
const church={sectors:[{id:'s1'},{id:'s2'}],cells:[{id:'c1',sector:'s1'},{id:'c2',sector:'s2'}],people:[{id:'p1',cell:'c1'}],attendance:[],reports:[],devotions:[]};
function setup(){
 let user=base,missing=false,count=1;const commands=[],rows=[];
 const server={actor:async()=>user,state:async()=>({data:church}),dateLima:()=> '2026-10-24',json:(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}}),denied:()=>new Response(null,{status:403}),unauth:()=>new Response(null,{status:401}),
  db:()=>({prepare(sql){let values=[];const statement={bind(...next){values=next;return statement},async first(){
   if(sql.includes('attempts'))return {count};
   if(sql.startsWith('SELECT author,cell'))return {author:'u1',cell:'c1'};
   if(sql.startsWith('SELECT mime,data'))return {mime:'audio/webm',data:validAudio.toString('base64')};
   return null;
  },async all(){if(missing&&sql.includes('EXISTS'))throw Object.assign(Error('Missing audio table'),{code:'42P01'});return {results:rows}},async run(){commands.push({sql,values});return {meta:{changes:1}}}};return statement},async transaction(next){if(missing)throw Object.assign(Error('Missing audio table'),{code:'42P01'});commands.push(...next)}}),
 };
 const mocks={[resolve(root,'lib/server.ts')]:server};
 return {load:relative=>loadModule(relative,mocks),commands,rows,setUser(value){user=value},setMissing(value){missing=value},setCount(value){count=value}};
}
const validAudio=Buffer.from([0x1a,0x45,0xdf,0xa3,...Array(100).fill(0)]);
function formRequest({attach=true,clip=validAudio}={}){
 const form=new FormData();form.set('book','PSA');form.set('chapter','23');form.set('reflection','Hoy aprendí a confiar en Dios.');form.set('application','Voy a ayudar a mi familia.');
 if(attach){form.set('attachAudio','true');form.set('audioSeconds','12');form.set('audio',new Blob([clip],{type:'audio/webm'}),'devocional.webm')}
 return new Request('https://shalom.test/api/devotions',{method:'POST',body:form});
}
test('audio validation rejects incorrect content, unsupported types and oversized bodies',async()=>{
 const audioModule=loadModule('lib/devotional-audio.ts');
 assert.equal(audioModule.validateDevotionalAudio(validAudio,'audio/webm;codecs=opus'),'audio/webm');
 assert.throws(()=>audioModule.validateDevotionalAudio(Buffer.from('<html>not audio</html>'),'audio/webm'));
 assert.throws(()=>audioModule.validateDevotionalAudio(validAudio,'text/html'));
 assert.throws(()=>audioModule.validateDevotionalAudio(new Uint8Array(2_500_001),'audio/webm'));
 const {limitedBody,BodyLimitError}=loadModule('lib/http-body.ts');
 await assert.rejects(()=>limitedBody(new Request('https://shalom.test',{method:'POST',body:'too big'}),3),BodyLimitError);
});
test('text-only submission does not store audio; opted-in attachment commits text and audio together',async()=>{
 const fixture=setup(),route=fixture.load('app/api/devotions/route.ts');
 assert.equal((await route.POST(formRequest({attach:false}))).status,201);
 assert.equal(fixture.commands.length,1);assert.ok(!fixture.commands[0].sql.includes('devotion_audio'));
 fixture.commands.length=0;
 assert.equal((await route.POST(formRequest())).status,201);
 assert.equal(fixture.commands.length,2);assert.match(fixture.commands[1].sql,/INSERT INTO devotion_audio/);
 assert.equal(fixture.commands[0].values[0],fixture.commands[1].values[0]);
 assert.equal(fixture.commands[1].values[4],validAudio.toString('base64'));
});
test('unauthorized, pending and cross-origin submissions are rejected without writes',async()=>{
 const fixture=setup(),route=fixture.load('app/api/devotions/route.ts');
 fixture.setUser(null);assert.equal((await route.POST(formRequest())).status,401);
 fixture.setUser({...base,role:'pending'});assert.equal((await route.POST(formRequest())).status,403);
 fixture.setUser(base);const request=formRequest();request.headers.set('Origin','https://attacker.test');assert.equal((await route.POST(request)).status,403);
 assert.equal(fixture.commands.length,0);
});
test('missing audio migration preserves text-only operation and rejects the full attachment atomically',async()=>{
 const fixture=setup(),route=fixture.load('app/api/devotions/route.ts');fixture.setMissing(true);
 assert.equal((await route.POST(formRequest())).status,503);assert.equal(fixture.commands.length,0);
 assert.equal((await route.POST(formRequest({attach:false}))).status,201);
 assert.equal((await route.GET(new Request('https://shalom.test/api/devotions'))).status,200);
});
test('audio delivery checks account and cell permission before returning bytes; supports ranges without cache',async()=>{
 const fixture=setup(),route=fixture.load('app/api/devotions/[id]/audio/route.ts'),params={params:Promise.resolve({id:'d1'})};
 let response=await route.GET(new Request('https://shalom.test/api/devotions/d1/audio'),params);
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store, private');
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),validAudio);
 response=await route.GET(new Request('https://shalom.test/api/devotions/d1/audio',{headers:{Range:'bytes=0-3'}}),params);
 assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,4);
 fixture.setUser({...base,id:'stranger',role:'disciple',person:'p2'});assert.equal((await route.GET(new Request('https://shalom.test/audio'),params)).status,403);
 fixture.setUser({...base,id:'leader',role:'cell_leader',cell:'c2'});assert.equal((await route.GET(new Request('https://shalom.test/audio'),params)).status,403);
 fixture.setUser({...base,id:'leader',role:'cell_leader'});assert.equal((await route.GET(new Request('https://shalom.test/audio'),params)).status,200);
 fixture.setUser(null);assert.equal((await route.GET(new Request('https://shalom.test/audio'),params)).status,401);
});
test('transcription sends the file and Spanish context to the official endpoint and validates returned text',async()=>{
 const {transcribeDevotional}=loadModule('lib/transcription.ts');
 const text=await transcribeDevotional(new Uint8Array(validAudio),'audio/webm','Salmos 23',{key:'test-key',fetcher:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/audio/transcriptions');assert.equal(options.headers.Authorization,'Bearer test-key');
  assert.equal(options.body.get('model'),'gpt-transcribe');assert.match(options.body.get('prompt'),/Salmos 23/);
  assert.ok(options.body.get('file') instanceof File);return Response.json({text:' Hoy aprendí a confiar en Dios. '});
 }});
 assert.equal(text,'Hoy aprendí a confiar en Dios.');
 await assert.rejects(()=>transcribeDevotional(new Uint8Array(validAudio),'audio/webm','Salmos 23',{key:'test-key',fetcher:async()=>Response.json({text:''})}));
});
test('transcription is disabled without a key and rate-limited before provider calls',async()=>{
 const fixture=setup(),route=fixture.load('app/api/devotions/transcribe/route.ts'),previous=process.env.OPENAI_API_KEY;
 try{
  delete process.env.OPENAI_API_KEY;
  assert.deepEqual(await (await route.GET()).json(),{available:false});
  assert.equal((await route.POST(formRequest())).status,503);
  process.env.OPENAI_API_KEY='test-key';fixture.setCount(7);
  assert.equal((await route.POST(formRequest())).status,429);
 }finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous}
});
