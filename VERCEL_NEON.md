# Publicación en Vercel con Neon

La aplicación ya no depende de Cloudflare D1: usa `DATABASE_URL` y PostgreSQL.

## 1. Configura Neon

En Neon, abre **Connect** y copia la cadena con *Connection pooling* activado (el host contiene `-pooler`). En Vercel, no la guardes en Git ni la pegues en el código.

## 2. Variables en Vercel

En **Project → Settings → Environment Variables**, agrega los nombres de `env/.env.example`:

- `DATABASE_URL`: cadena pooled de Neon.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: valores de Cloudinary.
- `NARRATION_ORIGIN`: solo si se publica el servicio de voz en otra URL HTTPS.

Selecciona **Production**, **Preview** y **Development** para `DATABASE_URL` y las variables de Cloudinary. Las claves nunca deben comenzar por `NEXT_PUBLIC_`.

## 3. Crea las tablas de Neon

En tu PC, crea temporalmente `.env.local` en la raíz con `DATABASE_URL` y ejecuta:

```powershell
npm.cmd install
npm.cmd run db:push
```

No ejecutes ese comando hasta haber puesto una URL válida. Crea las tablas `church`, `accounts`, `credentials`, `sessions`, `invites`, `attempts`, `devotions` y `study` en Neon.

## 4. Despliega

1. Sube estos cambios a `main` con Git.
2. En Vercel elige **Add New → Project**, importa `cht212/Shalom` y deja el framework como **Next.js**.
3. Vercel ejecutará `npm run build` y publicará la aplicación.
4. Prueba inicio de sesión, registro por QR, panel y gestión de cuentas en la URL de producción.

Cloudinary queda preparado mediante variables. La aplicación actual no cuenta aún con una pantalla o endpoint de carga; conectaremos esas claves al crear esa función.
