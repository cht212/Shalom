import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const python=path.join(root,'.sites-runtime','voice-env',process.platform==='win32'?'Scripts/python.exe':'bin/python');
let voice;
async function health(){try{const r=await fetch('http://127.0.0.1:8766/health',{signal:AbortSignal.timeout(1000)});return r.ok}catch{return false}}
if(!await health()){
 if(existsSync(python)&&existsSync(path.join(root,'.sites-runtime/voice-model/es_ES-sharvard-medium.onnx'))){
  voice=spawn(python,['scripts/voice-server.py'],{cwd:root,stdio:'inherit',windowsHide:true});
  voice.on('error',error=>console.error('No se pudo iniciar la voz:',error.message));
  for(let i=0;i<40&&!await health();i++)await new Promise(resolve=>setTimeout(resolve,250));
 }else console.warn('Para activar la voz neuronal, sigue scripts/VOICE.md.');
}
const framework=spawn(process.execPath,['scripts/run-framework.mjs','dev',...process.argv.slice(2)],{cwd:root,stdio:'inherit',windowsHide:true});
let stopping=false;const stop=()=>{if(stopping)return;stopping=true;framework.kill();voice?.kill()};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
framework.on('exit',code=>{voice?.kill();process.exitCode=code??0});
