import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const python=path.join(root,'.sites-runtime/voice-env',process.platform==='win32'?'Scripts/python.exe':'bin/python');
const child=spawn(python,['scripts/voice-server.py'],{cwd:root,stdio:'inherit',windowsHide:true});
child.on('error',()=>{console.error('Instala la voz siguiendo scripts/VOICE.md.');process.exitCode=1});
child.on('exit',code=>{process.exitCode=code??0});
process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
