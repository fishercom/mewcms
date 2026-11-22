# Rama `render`: el demo en Render

Esta rama es la versión de MewCMS que corre el demo público en https://mewcms.onrender.com.
Todo lo que sea solo para Render va aquí y no entra a `main`, para que el proyecto base no
dependa de cómo funciona el hosting.

## Cómo se mantiene

- Se crea desde `main` y recibe los cambios de `main` con un merge (`git merge main`), no con rebase.
- Los PR con personalizaciones para Render apuntan a `render`, no a `main`.
- Cada cambio de esta rama se anota abajo en "Personalizaciones", con el motivo.
- En Render, el servicio `mewcms` debe desplegar desde esta rama
  (Settings → Build & Deploy → Branch = `render`).

## Cómo está desplegado

- Servicio web Docker en el plan gratuito, definido en [`render.yaml`](render.yaml), y construido con el
  [`Dockerfile`](Dockerfile).
- El contenedor arranca con [`docker-entrypoint.sh`](docker-entrypoint.sh): migraciones, seed si la
  base está vacía, import del contenido demo (`DEMO_CONTENT=default`), caches y el servidor PHP
  con SSR.
- La base de datos es MySQL externa (TiDB, puerto 4000, SSL). Las sesiones, la caché y la cola
  también se guardan ahí (`SESSION_DRIVER`, `CACHE_STORE` y `QUEUE_CONNECTION` = `database`).

## Limitaciones del plan gratuito

- **No hay disco persistente.** Cuando el servicio se duerme (tras unos 15 minutos sin
  visitas), se reinicia o se vuelve a desplegar, el contenedor nuevo arranca con
  `storage/app/public` vacío. La base de datos sí se conserva, así que sigue apuntando a
  archivos que ya no existen.
- Por eso, lo que se sube desde el admin (Medios) se pierde en el siguiente reinicio. Para
  conservarlo hay dos opciones:
  1. Un Persistent Disk de Render (solo en planes de pago), montado en
     `/var/www/html/storage/app/public`.
  2. Un almacenamiento externo tipo S3 para el disco `public` (requiere cambios de código y
     variables de entorno).

## Personalizaciones

### 1. Volver a poner las imágenes del tema que se pierden en cada reinicio (2026-11-22)

**Síntoma:** en el demo, las imágenes del contenido (`/storage/media/default/*.jpg` y sus
versiones WebP en `/storage/media/variants/...`) daban 404.

**Causa:** con `--if-changed`, `cms:content-import` se salta el import cuando `content.json`
no cambió. Esa marca se guarda en la caché, y la caché vive en la base de datos, así que
sobrevive al reinicio mientras que los archivos no. Además, cuando el import sí corría, una
imagen que ya estaba en la tabla `cms_media` no se volvía a escribir en el disco.

**Cambio:**
- `ContentImporter::restoreMedia()` vuelve a escribir los originales que faltan, desde la
  carpeta `content` del tema, y regenera sus versiones WebP.
- `cms:content-import --if-changed` lo llama aunque se salte el import, así que cada arranque
  repone las imágenes. El log muestra `(N media files restored)`.
- Un import completo también repone los archivos de imágenes que ya estaban registradas.
- Test: `tests/Feature/ContentImportTest.php`, "puts back media files lost from the disk while the
  database kept them".

**Límite:** solo cubre las imágenes que vienen del `content.json` del tema. Las que se suben
desde el admin siguen necesitando un disco persistente o S3 (ver arriba).
