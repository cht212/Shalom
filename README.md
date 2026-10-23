# Shalom

Aplicación para lectura pública de la Biblia, devocionales personales y organización de células, diseñada desde el móvil con los logos de Shalom.

## Ejecutar localmente

Desde `C:\Users\User\Documents\Shalom\shalom-web`, ejecuta `npm run dev` y abre la dirección de la terminal. Inicia sesión en `/ingresar` con un usuario y contraseña de Shalom.

Las cinco cuentas locales de prueba están en `.sites-runtime/USUARIOS_PRUEBA.txt`. Ese archivo es privado, no se publica ni se incluye en Git. Usa contraseñas nuevas para personas reales. El administrador entrega las cuentas desde Panel → Accesos y roles. Primero registra la persona y después vincúlala a una cuenta.

## Funcionamiento

El discípulo completa sus propios datos, escribe devocionales desde la página principal y consulta su historial debajo del formulario. Los líderes revisan miembros y devocionales de su célula o sector. El pastor tiene alcance general. Solo el administrador gestiona cuentas y estructura.

Desde Perfil o Personas, los responsables pueden generar una invitación QR para una célula dentro de su alcance. Vence en 30 días. El formulario público pide nombre, teléfono, edad y autorización; registra la primera asistencia. El enlace debe ser accesible desde el celular: `127.0.0.1` funciona solamente en la computadora que ejecuta la web.

Informes prepara las seis tablas de `FORMATOScd.docx`, ubicado en la carpeta superior. La copia interna de la plantilla tiene borrados los datos de ejemplo. Los campos faltantes quedan vacíos. Descarga el Word, revisa los datos, confirma la revisión y envíalo al pastor dentro de la aplicación. No envía correos. El informe enviado conserva los datos de ese momento. La vista previa muestra tablas; abre el Word para comprobar la paginación final.

## Alojamiento y datos

El servidor utiliza Vinext/Cloudflare Workers y D1, también en desarrollo local. Otro hosting puede requerir adaptar el servidor y la base de datos; no basta con copiar el código a un hosting PHP o estático. El inicio de sesión utiliza cookies HttpOnly, contraseñas con PBKDF2 y salt individual, y validación de permisos en el servidor. Conserva copias de los datos antes de migrar.

La Biblia Reina-Valera 1909 está incluida localmente. La voz neuronal usa un servicio Python: consulta `scripts/VOICE.md` para instalarlo y alojarlo.

## Comprobaciones

`node node_modules/typescript/bin/tsc --noEmit` revisa los tipos. `python tests/local-workflows.py` comprueba las cinco cuentas, permisos, QR, perfiles, devocionales e informes contra el servidor local, y limpia sus registros temporales. La revisión visual en navegador y la paginación del Word requieren comprobación manual.
