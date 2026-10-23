# Alojamiento futuro

Los cambios actuales se realizan en el proyecto local. `npm run dev` y `npm run build` no publican la aplicación.

La web ya usa cuentas propias de Shalom, con usuario, contraseña y sesión validada por el servidor. No necesita cuentas de ChatGPT.

El servidor depende actualmente de Cloudflare Workers y D1. Para alojarlo en otra plataforma habrá que adaptar el servidor y la base de datos a esa plataforma. Un hosting solo de archivos estáticos o PHP no ejecuta este servidor directamente. La voz neuronal requiere además alojar su servicio Python.

La publicación anterior en Sites conserva su versión anterior; estos cambios no la actualizan. El proyecto local y esa publicación tienen bases de datos independientes.

Antes de migrar, respalda los datos, configura el dominio y HTTPS, aplica las migraciones de `drizzle`, provisiona una cuenta administradora en la base de datos de destino y prueba los permisos de los cinco roles. El script `scripts/seed-local-users.py` crea exclusivamente cuentas de prueba en la base local; sus contraseñas no deben reutilizarse para usuarios reales.
