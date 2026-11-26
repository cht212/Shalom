# Libros de formación

La biblioteca de Inicio solo aparece con una sesión confirmada. Cada cuenta ve los libros asignados a su persona o a su cuenta de líder. Las tarjetas contienen portada y título; los filtros separan libros por completar y completados.

## Preparar y publicar un libro

1. Entra como administrador o pastor en **Perfil → Mi panel → Discipulado**.
2. Abre **Biblioteca · libros y contenido**. Selecciona un libro o **Nuevo libro**.
3. Escribe el título y guarda el borrador. Agrega lecciones, enseñanzas y preguntas con el contenido autorizado del libro físico.
4. Carga una portada JPG, PNG o WebP. Las imágenes se normalizan en el servidor; no se acepta SVG.
5. Puedes adjuntar un PDF de hasta 3 MB. Su descarga es privada y solo se habilita para cuentas autorizadas cuando el libro está publicado.
6. Marca **Publicado para las personas asignadas** y guarda. Un libro debe tener lecciones o PDF para publicarse.

La aplicación no inventa contenido ni convierte automáticamente un PDF en preguntas. El editor permite transcribir y adaptar las lecciones. Una vez que existen respuestas, las lecciones se conservan; para cambiar su estructura se crea una nueva edición. El título, portada y PDF pueden actualizarse.

## Asignar y acompañar

- Administración y pastor pueden habilitar libros a líderes. Un líder de sector puede habilitarlos dentro de su sector.
- Cada líder de célula necesita recibir el libro antes de asignarlo a miembros de su propia célula.
- Se pueden elegir varios destinatarios. El servidor vuelve a comprobar todos sus permisos.
- El discípulo abre su libro desde Inicio, guarda borradores y envía las lecciones. Una lección enviada no puede editarse hasta que el líder la devuelva.
- En **Revisar lecciones**, el responsable aprueba o devuelve respuestas con comentarios. Nadie aprueba su propia lección.
- Todas las lecciones aprobadas completan el libro. El responsable también puede registrar manualmente el estado del trabajo en el libro físico.
- Retirar la habilitación de un líder retira las asignaciones delegadas por ese líder para ese libro. La interfaz pide confirmación.

## Datos y privacidad

El documento privado `formation` de la tabla `church` contiene catálogo, archivos, asignaciones y respuestas. No cambia la estructura de las tablas y no sobrescribe el documento `shalom`. Las escrituras usan control de revisión para detectar cambios simultáneos. Los endpoints `/api/formation*` requieren sesión, no se guardan en el service worker y validan el origen de las escrituras.

Los archivos y el contenido oficial deben cargarse desde el panel; no se incluyen libros de ejemplo publicados.

## Verificación

`npm run test` comprueba reglas de permisos. `node scripts/verify-formation.mjs` usa `DATABASE_URL` para crear un esquema temporal aislado, copiar cuentas y datos para la prueba, ejecutar el recorrido completo y eliminar solo ese esquema. El servidor local usa el puerto 3700. No debe haber otro proceso escuchando en ese puerto. Requiere Python y Playwright.

La prueba usa las tres cuentas existentes y dos miembros sintéticos únicamente dentro del esquema temporal. Antes de ejecutarla configura `SHALOM_TEST_ADMIN_PASSWORD`, `SHALOM_TEST_LEADER_PASSWORD` y `SHALOM_TEST_SECOND_LEADER_PASSWORD` con sus contraseñas actuales. No se almacenan contraseñas en el código ni se imprimen conexiones.
