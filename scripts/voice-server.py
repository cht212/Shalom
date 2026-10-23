"""Local neural chapter audio service. Uses Piper (GPL-3.0), SHARVARD (CC-BY-3.0).
Only bundled Bible chapters are accepted; no arbitrary text or remote URLs.
"""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import hashlib,json,re,threading,wave,os
from piper import PiperVoice,SynthesisConfig
ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'.sites-runtime/voice-model/es_ES-sharvard-medium.onnx'
CACHE=ROOT/'.sites-runtime/chapter-audio'
CACHE.mkdir(parents=True,exist_ok=True)
CATALOG={b['id']:b for b in json.loads((ROOT/'public/bible/books.json').read_text(encoding='utf-8'))}
print('Loading Spanish female neural voice...',flush=True)
VOICE=PiperVoice.load(str(MODEL))
LOCK=threading.Lock()
CONFIG=SynthesisConfig(speaker_id=1,length_scale=1.20,noise_scale=.40,noise_w_scale=.55)
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/health':
            self.send_response(200);self.end_headers();self.wfile.write(b'{"ready":true}');return
        match=re.fullmatch(r'/audio/([A-Z0-9]{3})/(\d{1,3})\.wav',self.path)
        if not match:self.send_error(404);return
        book,chapter=match.group(1),int(match.group(2))
        if book not in CATALOG or not 1<=chapter<=CATALOG[book]['chapters']:self.send_error(404);return
        verses=json.loads((ROOT/'public/bible'/f'{book}.json').read_text(encoding='utf-8'))[str(chapter)]
        text=CATALOG[book]['name']+'. Capítulo '+str(chapter)+'. '+ ' '.join(v['text'] for v in verses)
        digest=hashlib.sha256(('sharvard-female-paused-v2:'+text).encode()).hexdigest()[:16]
        target=CACHE/f'{book}-{chapter}-{digest}.wav'
        try:
            if not target.exists():
                with LOCK:
                    if not target.exists():
                        print(f'Generating {book} {chapter}...',flush=True)
                        partial=target.with_suffix('.part')
                        with wave.open(str(partial),'wb') as wav:
                            wav.setframerate(22050);wav.setsampwidth(2);wav.setnchannels(1)
                            # Preserve every word and its original order; explicit rests
                            # separate clauses and verses instead of one continuous block.
                            parts=[(CATALOG[book]['name']+'. Capítulo '+str(chapter)+'.',.8)]
                            for verse in verses:
                                clauses=re.split(r'(?<=[.!?;:])\s+',verse['text'])
                                for i,clause in enumerate(clauses):
                                    if clause.strip():parts.append((clause,.65 if i==len(clauses)-1 else .30))
                            for clause,pause in parts:
                                VOICE.synthesize_wav(clause,wav,syn_config=CONFIG,set_wav_format=False)
                                wav.writeframes(b'\x00\x00'*int(22050*pause))
                        partial.replace(target)
            size=target.stat().st_size;start=0;end=size-1;status=200
            requested=self.headers.get('Range','')
            if requested:
                found=re.fullmatch(r'bytes=(\d+)-(\d*)',requested)
                if not found:self.send_error(416);return
                start=int(found.group(1));end=min(int(found.group(2)) if found.group(2) else end,end)
                if start> end:self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return
                status=206
            self.send_response(status);self.send_header('Content-Type','audio/wav');self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(end-start+1));self.send_header('Cache-Control','public, max-age=86400')
            if status==206:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
            self.end_headers()
            with target.open('rb') as audio:
                audio.seek(start);remaining=end-start+1
                while remaining:
                    chunk=audio.read(min(65536,remaining))
                    if not chunk:break
                    self.wfile.write(chunk);remaining-=len(chunk)
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception as exc:
            print(type(exc).__name__+': '+str(exc),flush=True)
            self.send_error(500,'Could not generate narration')
if __name__=='__main__':
    port=int(os.environ.get('SHALOM_VOICE_PORT','8766'))
    print(f'Neural chapter audio ready at http://127.0.0.1:{port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
