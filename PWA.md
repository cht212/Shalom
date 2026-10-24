# Shalom como PWA

## Ejecutar y probar

```powershell
npm.cmd run lint
npm.cmd run check
npm.cmd run start -- --port 3005
```

Abrir `http://localhost:3005`. El service worker se registra en producción y en un contexto seguro (HTTPS o localhost). `next dev` no registra un worker nuevo. Para probar desde un teléfono se necesita un origen HTTPS; la dirección HTTP de la red local no sirve para comprobar la PWA.

`npm run build` ejecuta Next.js y después genera `public/pwa-build.js` con la versión y la lista de recursos públicos de esa compilación. El archivo generado no se versiona en Git. No omitir el segundo paso usando solamente `next build` al publicar.

## Instalación y presentación

- Manifest en `app/manifest.ts`, identidad `/`, idioma español y modo `standalone`.
- Chrome/Edge y Android: «Instalar Shalom» usa el evento de instalación del navegador cuando está disponible. También se puede instalar desde el menú del navegador.
- iPhone/iPad: el botón explica «Compartir → Agregar a pantalla de inicio». Se oculta en modo instalado.
- Iconos de 192 y 512 píxeles, variantes maskable con margen de seguridad y apple-touch-icon de 180 píxeles. Todos se derivan del emblema original; `scripts/generate-pwa-icons.mjs` permite regenerarlos sin redibujarlo ni recolorearlo.
- Fuentes locales DM Sans y Manrope, con sus licencias OFL en `public/fonts`. `app/fonts.css` usa las mismas fuentes que `public/fonts.css`, que sirve la pantalla offline independiente.

## Qué se guarda

| Recurso | Comportamiento |
| --- | --- |
| Interfaz pública, JS, CSS, fuentes, iconos | Lista explícita por compilación, precargada al instalar el worker. |
| Navegaciones a Inicio/Biblia/Guardados/Devocional | Red primero; si falla, interfaz pública precargada y anónima. |
| Biblia RV1909 | Caché por libro, también desde la primera lectura antes de activar el worker. Descarga completa opcional: 66 libros y catálogo, aproximadamente 4.59 MB. |
| Audio | Descarga explícita de un capítulo; Blob en IndexedDB. No se descarga audio automáticamente. |
| Guardados de invitado | La clave local existente `shalom-study-guest`. |
| Guardados de cuenta | Copia local por ID de usuario: marcadores, resaltados, última lectura, revisión y estado pendiente. |
| API, sesión, autenticación, perfil, administración | Exclusivamente red; nunca entran en Cache Storage. |
| POST, PUT, PATCH, DELETE y respuestas RSC | Exclusivamente red; el worker no las intercepta. |

El worker obtiene la interfaz precargada sin cookies. Las imágenes optimizadas que se precargan están limitadas a URLs explícitas del emblema público. No se guardan contraseñas, cookies ni tokens. El ID recordado para abrir guardados offline no concede sesión ni permisos: perfil, registros, devocionales e informes necesitan conexión y validación del servidor.

El panel «Administrar descargas» muestra los libros y el espacio ocupado, permite reanudar una descarga parcial, eliminar la Biblia sin borrar marcadores, y eliminar capítulos de audio individualmente. El navegador puede liberar almacenamiento por falta de espacio o al borrar datos del sitio.

## Sincronización y conflictos

Los cambios de estudio se escriben localmente antes de intentar enviarlos. Al recuperar internet se verifica la sesión y se compara la revisión con `/api/study`. Solo una sesión confirmada puede sincronizar esa cuenta. El marcador de cuenta activa se elimina cuando el servidor confirma que no hay sesión; las copias de cuentas distintas nunca se mezclan con los guardados de invitado.

Una revisión distinta o un HTTP 409 conserva la copia local y muestra un aviso persistente. El usuario puede exportarla, abrir la versión de nube o reemplazar explícitamente la nube con su copia local. Las dos últimas acciones requieren una confirmación que explica el resultado y conservan la versión anterior como respaldo local exportable. La escritura sigue comprobando revisiones; nunca fuerza una actualización en Neon.

El estado de conexión combina la señal del navegador y los fallos de red de la comprobación de sesión. Se vuelve a comprobar al recuperar conexión, al enfocar la aplicación y cada 30 segundos mientras está visible. El perfil, los registros administrativos y las sesiones no se conservan offline.

## Audio

La grabación personal de devocionales es una función distinta del audio de la Biblia. Su configuración, envío opcional y permisos están descritos en [DEVOCIONAL_VOZ.md](DEVOCIONAL_VOZ.md); sus archivos privados permanecen exclusivamente en red.

Se conserva `/api/narration` y el respaldo de SpeechSynthesis. «Descargar capítulo» solo se habilita cuando se pudo cargar audio alojado. Se valida una respuesta completa de tipo `audio/*` antes de almacenarla; las respuestas de API no se guardan en la caché del worker. Para reproducir una descarga se crea una URL Blob local, sin pedir nuevamente el audio a la nube.

Si `NARRATION_ORIGIN` no está configurado, el botón explica que falta audio alojado y el respaldo actual continúa disponible. La voz del dispositivo no garantiza funcionamiento sin internet.

## Actualizaciones

Un worker nuevo queda esperando. «Hay una actualización disponible» permite aplicarlo; antes se avisa que la página se recargará y deben terminarse los formularios. Solo se eliminan cachés antiguas de la interfaz. Biblia, audio y guardados locales tienen almacenamiento independiente y se conservan.

## Verificaciones

- Pruebas Node de exclusión de API/mutaciones/RSC, precarga anónima, activación controlada y conservación de descargas al actualizar: `tests/pwa.mjs`, incluidas en `npm run check`.
- Comprobación en Chromium de producción local: manifest sin errores de instalación; primera lectura; descarga completa; recarga y enlaces a capítulos offline; marcadores de invitado; pantalla offline de Perfil; audio de prueba descargado y reproducido desde Blob; actualización con conservación de datos.
- Cuenta simulada: copia local tras reiniciar sin internet, sincronización al reconectar, conflicto de revisión sin sobrescribir la nube. Las pruebas usan respuestas simuladas y no escriben en Neon.
- Emulación móvil: instrucciones de iPhone y ocultación del botón después de instalar. Las pruebas automatizadas no sustituyen la instalación en teléfonos físicos.
- Lighthouse actual evalúa rendimiento, accesibilidad, buenas prácticas y SEO; la categoría PWA fue retirada. La instalación y el modo offline se comprueban por separado. Los informes locales se encuentran en `.sites-runtime/lighthouse-pwa-final.report.html` y `.json`.

La última auditoría local con simulación móvil obtuvo rendimiento 76, accesibilidad 95, buenas prácticas 100 y SEO 100. El informe señala dos contrastes existentes en el diseño (texto dorado de la marca y texto secundario sobre fondo crema). Se mantuvieron los colores de marca y el diseño solicitados. La precarga inicial y las transferencias de los libros completos influyen en la puntuación de rendimiento; los resultados de laboratorio no equivalen a mediciones en teléfonos físicos.

Referencias: [PWA en Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps), [estrategias de caché de MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) y [retirada de la categoría PWA en Lighthouse 12](https://developers.google.com/speed/docs/insights/release_notes).

Antes de publicar, comprobar manualmente en Android/Chrome, iPhone/Safari y Windows: instalación desde un origen HTTPS, apertura desde el icono, navegación, cierre y reapertura en modo avión, recuperación de conexión con una cuenta de prueba y aplicación de una actualización. La sincronización contra Neon y el audio real requieren las variables de entorno correspondientes y una cuenta/servidor de prueba.

No se ha hecho push ni despliegue como parte de este trabajo.
