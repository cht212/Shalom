# Variables para Vercel

Este directorio es una plantilla local: no subas contraseñas ni claves a Git.

1. Copia los nombres y valores de `.env.example` en **Vercel → Project → Settings → Environment Variables**.
2. Configúralos para Production, Preview y Development según corresponda.
3. Para ejecutar localmente, copia los mismos valores a un archivo `.env.local` en la raíz del proyecto. Ese archivo no se versiona.

`DATABASE_URL` debe ser la cadena de conexión **pooled** de Neon. No compartas ese valor en el chat.
