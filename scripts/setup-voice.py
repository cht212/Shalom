"""Download the CC-BY-3.0 Spanish SHARVARD voice used by Piper."""
from pathlib import Path
import urllib.request
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'.sites-runtime'/'voice-model'
TARGET.mkdir(parents=True,exist_ok=True)
BASE='https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/sharvard/medium/'
for name in ['es_ES-sharvard-medium.onnx','es_ES-sharvard-medium.onnx.json','MODEL_CARD']:
    target=TARGET/name
    if target.exists():continue
    print('Downloading '+name,flush=True)
    partial=target.with_suffix(target.suffix+'.part')
    urllib.request.urlretrieve(BASE+name,partial)
    partial.replace(target)
print('Spanish neural voice ready (female speaker F=1).',flush=True)
