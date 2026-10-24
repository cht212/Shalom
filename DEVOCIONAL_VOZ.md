# Devocional por voz

El discípulo usa «Devocional» desde la navegación principal. No tiene panel de gestión. Los paneles permanecen reservados a líderes de célula, líderes de sector, pastores y administrador.

## Experiencia

1. Elegir el libro y capítulo leído.
2. Pulsar «Escribir mi devocional» o «Hablar mi devocional».
3. En voz: grabar, detener y escuchar la grabación. Límite de la interfaz: tres minutos y 2.5 MB.
4. Pulsar «Convertir a texto». El audio se envía a OpenAI únicamente por esta acción; no se convierte automáticamente al grabar.
5. Corregir o escuchar el texto y marcar que se revisó. La transcripción puede cometer errores; no se promete exactitud total ni se añade una reflexión generada.
6. Opcionalmente marcar «Enviar también mi audio». Viene desactivado. El texto siempre se envía; la grabación solo se adjunta cuando se eligió expresamente.
7. Pulsar «Enviar devocional».

El autor y los responsables autorizados pueden escuchar el audio adjunto. Los discípulos no pueden abrir grabaciones ajenas y los líderes de célula/sector no pueden acceder a otras asignaciones. Pastores y administrador tienen el mismo alcance global que en la consulta de devocionales existente.

## Activar la transcripción

Configurar en el servidor de Vercel:

```dotenv
OPENAI_API_KEY=tu_clave_privada
DEVOTIONAL_TRANSCRIPTION_MODEL=gpt-transcribe
```

No poner la clave en variables `NEXT_PUBLIC_*`, Git ni código del navegador. El modelo predeterminado se verificó en la [documentación oficial de OpenAI](https://developers.openai.com/api/docs/guides/speech-to-text). El uso de la API requiere una cuenta habilitada y puede generar cargos propios del servicio.

El servidor llama a `POST https://api.openai.com/v1/audio/transcriptions` con el archivo, el modelo y contexto de vocabulario bíblico en español. La clave permanece en el servidor. No se manda el archivo al proveedor si falta la sesión, el rol no está habilitado, el formato es inválido, el cuerpo excede el límite o ya se alcanzó el límite de seis conversiones por cuenta en quince minutos.

Si no hay clave, la interfaz explica que la conversión no está disponible. Se mantienen la escritura y la posibilidad de enviar una grabación con el texto escrito. La grabación local no se borra por un error de transcripción.

## Activar los adjuntos en Neon

Crear la nueva tabla ejecutando el SQL de [db/devotional-audio.sql](db/devotional-audio.sql) en Neon SQL Editor, sobre la misma base de datos de Shalom. Es una migración PostgreSQL aditiva que no cambia devocionales existentes. El esquema equivalente está en `db/schema.ts` para el flujo habitual de Drizzle.

Los SQL históricos de `drizzle/` corresponden a la antigua base SQLite; no usarlos para esta migración PostgreSQL.

El archivo no se aplica automáticamente durante la compilación y no se ha ejecutado sobre Neon en este trabajo. Sin la tabla, los devocionales escritos y la consulta de los anteriores continúan funcionando; enviar un nuevo adjunto devuelve un aviso y conserva el borrador en la interfaz.

## Almacenamiento y privacidad

- `devotion_audio` guarda el audio como base64, su MIME, tamaño, duración declarada y fecha, asociado por clave foránea al devocional. El contenido no se incluye en el listado de reflexiones.
- Texto y audio se insertan en una transacción: si falla el adjunto, no queda un devocional incompleto.
- Los audios son pequeños y acotados a 2.5 MB. Base64 añade aproximadamente un tercio de espacio. Conviene supervisar el almacenamiento de Neon si crece el número de grabaciones; esta versión no incorpora un borrado automático por antigüedad.
- Se aceptan contenedores WebM, MP4/M4A, MP3 y WAV. Se comprueban la cabecera del archivo y los límites del cuerpo; la interfaz graba únicamente la pista del micrófono. La duración real se limita en el grabador; el servidor valida la duración declarada y el tamaño, sin ejecutar un analizador multimedia de duración.
- Hasta veinte intentos de envío con audio por cuenta y día, en horario de Lima. Los devocionales solo de texto conservan su comportamiento anterior.
- `GET /api/devotions/[id]/audio` comprueba la sesión y el alcance antes de devolver bytes. No hay URL pública al archivo. Admite rangos para reproducción y usa `Cache-Control: no-store, private` y `nosniff`.
- El reproductor solicita el audio al abrirlo, mantiene una URL Blob temporal y la libera al cerrar. Los audios privados no entran en Cache Storage ni IndexedDB.
- El borrador de texto y audio se conserva en memoria ante errores de envío y desconexiones temporales mientras se permanece en Devocional. No se guarda permanentemente en el dispositivo: cerrar o recargar la pestaña o salir de Devocional puede descartarlo.
- El micrófono se detiene al salir del formulario, al pasar la aplicación a segundo plano o perder conexión. Se necesita HTTPS o localhost y permiso del usuario para grabar.

## Verificaciones

`npm.cmd run check` incluye pruebas del formato y tamaño de archivo, consentimiento de adjunto, transacción, compatibilidad sin migración, acceso por cuenta/célula, rangos, peticiones desde otro origen, transcripción sin clave y límite de conversiones. No consumen el servicio ni escriben en Neon.

Las pruebas del navegador usan un micrófono sintético y respuestas simuladas: grabación real con MediaRecorder, revisión antes de enviar, audio desactivado por defecto, envío solo de texto, envío multipart con audio, conservación del borrador tras un error y desconexión temporal.

Antes de activar para la iglesia, aplicar la migración, configurar la clave y probar con grabaciones de prueba autorizadas en Android y iPhone físicos. Las pruebas automáticas no comprueban la precisión de voces reales, acentos, nombres bíblicos o ruido ambiental.

No se hizo push ni despliegue.
