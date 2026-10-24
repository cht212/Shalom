# Chapter narration

Audio is generated locally with Piper 1.4.2 and the Spanish SHARVARD medium voice, female speaker F=1. This is synthetic neural speech, not a human narrator or cloned voice. No API key and no external audio redirect. Bible text is read only from the bundled RV1909 chapters. The voice service accepts a fixed book/chapter pair, not arbitrary text or remote URLs.

Run `npm run voice` in one terminal and `npm run dev` in another. The local application uses the voice service at 127.0.0.1:8766 when `NARRATION_ORIGIN=http://127.0.0.1:8766` is configured. The audio button is only in the Bible chapter view. Audio is cached in ignored `.sites-runtime/chapter-audio/`; the first generation takes longer. Subsequent requests and byte ranges use the cache.

One-time installation on Windows:

```powershell
python -m venv .sites-runtime/voice-env
.sites-runtime/voice-env/Scripts/python.exe -m pip install piper-tts==1.4.2
python scripts/setup-voice.py
npm run dev
```

On Linux/macOS, use `.sites-runtime/voice-env/bin/python` for pip. Keep the voice model and cache outside Git.

For hosting, either run this Python service on a protected backend and set `NARRATION_ORIGIN` to its HTTPS address, or pregenerate chapters and upload them with the structure `audio/BOOK/CHAPTER.wav` to public object storage such as Vercel Blob. The second option is recommended for stable production playback. Do not expose the generation service directly without authentication, rate limits and a job queue. When hosted audio is unavailable, the web application falls back to the device's Spanish speech synthesis.

## Attribution and licenses

- Piper: https://github.com/OHF-Voice/piper1-gpl — GPL-3.0. The project calls this independently installed local service over HTTP. Preserve the upstream license/source obligations when distributing Piper.
- Voice: https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/sharvard/medium — model card lists SHARVARD dataset under CC BY 3.0: https://datashare.ed.ac.uk/handle/10283/574 . Credit the SHARVARD corpus / University of Edinburgh and retain this attribution when using generated recordings. Speaker map: M=0, F=1. No human-narrator claim is made for generated recordings.
- Text: Reina-Valera 1909, public domain, from BibleAquifer. See public/bible/SOURCE.md.

La selección diaria usa una lista revisada de pasajes de enseñanza, consejo y ánimo, con rotación sin repetición hasta completar la lista. La voz pausada v2 conserva el texto original, añade descansos entre frases y versículos y lee con length_scale=1.20. El cambio de versión evita reutilizar el audio anterior más rápido. Las pruebas de preservación textual no garantizan la pronunciación de cada palabra por parte del modelo neuronal.
