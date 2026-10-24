# Audio de los capítulos

La aplicación intenta reproducir primero `/api/narration`. Si `NARRATION_ORIGIN` no está configurado o el servicio no responde, usa la voz en español disponible en el navegador o dispositivo.

Para conservar la voz neuronal de Piper en producción, genera previamente los WAV y sírvelos desde almacenamiento público (por ejemplo, Vercel Blob) con la estructura `audio/LIBRO/CAPITULO.wav`. Configura la URL base como `NARRATION_ORIGIN` en Vercel.

Consulta `scripts/VOICE.md` para la instalación local, las licencias y las alternativas de despliegue.
