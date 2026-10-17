# JAZIEL.DEV — Portafolio de Jahir Jaziel Serrano Arana

Portafolio estático (HTML5, CSS3, JavaScript ES Modules, sin frameworks ni paso de compilación) para publicar en **GitHub Pages**. El contenido vive en archivos JSON; Firebase se usa solo para el formulario de contacto.

```
index.html · project.html · 404.html     Páginas
css/                                     Estilos modulares
js/                                      Módulos (main, data, navigation, animations, projects, project-detail, contact, utils)
data/projects.json · profile.json · skills.json   Contenido editable
assets/images · assets/cv · assets/fonts · assets/icons
firebase/functions/                      Función de contacto (Node 22)
scripts/                                 set-site-url.mjs · validate-data.mjs
docs/PRUEBAS-MANUALES.md                 Lista de pruebas
```

## 1. Abrir el proyecto en local

Los módulos JS y `fetch` no funcionan con `file://`. Usa un servidor estático:

```bash
python3 -m http.server 8000      # o: npx serve .
```

Abre http://localhost:8000. Antes de publicar, valida los datos: `node scripts/validate-data.mjs`.

## 2. Cambiar textos y habilidades

| Qué | Dónde |
|---|---|
| Titular, subtítulo, botones del hero | `index.html` (sección `#inicio`) |
| Texto de perfil, áreas destacadas, formación, enlaces (correo/GitHub/LinkedIn), disponibilidad | `data/profile.json` |
| Habilidades (grupos y etiquetas) | `data/skills.json` |
| Colores y tipografías | `css/variables.css` |

- **Disponibilidad laboral**: está apagada. Para mostrarla, en `profile.json` pon `"availability": { "enabled": true, "text": "Tu texto" }`.
- **LinkedIn**: verifica la URL en `profile.json`. Tu CV usa `linkedin.com/in/jahir-jaziel-serrano-arana` y el prompt original `linkedin.com/in/jahirjazielserrano`; el sitio usa la segunda.
- Las habilidades no llevan porcentajes ni barras a propósito.

## 3. Añadir, editar, ocultar y eliminar proyectos

Todo se hace en `data/projects.json`, sin tocar el código.

- **Añadir**: copia un objeto de `projects`, cambia `id`, `slug` (minúsculas y guiones, es la URL) y los datos, y déjalo con `"published": true`.
- **Editar**: cambia cualquier campo.
- **Ocultar**: `"published": false` (los borradores 3 y 4 están así hasta que completes su información).
- **Eliminar**: borra el objeto del arreglo.
- **Destacar**: `"featured": true` marca la tarjeta con una línea de acento. **Orden**: `sortOrder` (menor primero).
- **Filtros**: se generan solos con las `categories` de los proyectos publicados. Las categorías están definidas arriba en el mismo archivo (`frontend`, `qa`, `web`, `backend`); una categoría sin proyectos no aparece.

Campos de un proyecto:

| Campo | Notas |
|---|---|
| `id`, `slug`, `title`, `shortDescription`, `description` | Obligatorios |
| `subtitle`, `role`, `period`, `team`, `status` | Opcionales; se muestran en la ficha del detalle |
| `categories` | Arreglo de ids definidos en `categories` |
| `technologies` | Arreglo de textos |
| `coverImage` | Ruta, p. ej. `assets/images/projects/mi-proyecto.webp`. Vacío = portada tipográfica (no simula ser una captura) |
| `gallery` | `[{ "src": "assets/images/projects/mi-proyecto-1.webp", "alt": "Descripción" }]` |
| `repositoryUrl`, `liveUrl` | Solo `https://`. Vacío = no se muestra el botón |
| `details.context / objective / problem / solution` | Texto. Vacío = el apartado se oculta |
| `details.contribution`, `details.features` | Listas. `featuresLabel` cambia el título (p. ej. "Módulos evaluados") |
| `featured`, `published`, `sortOrder` | Ver arriba |

Publicar un cambio: edita → `node scripts/validate-data.mjs` → `git add . && git commit -m "Actualiza proyectos" && git push`.

## 4. Fotografías y capturas

- **Tu foto**: `assets/images/jaziel-profile.webp` (665 px) y `jaziel-profile-480.webp`. Para cambiarla, reemplaza ambos conservando el nombre; el `<img>` del hero usa `srcset` con las dos. Si el archivo falta, el hero muestra un monograma, nunca una imagen rota.
- **Portadas y capturas**: guarda `.webp` (idealmente ≤ 1600 px de ancho, ≤ 200 KB) en `assets/images/projects/` y referencia la ruta en el JSON. Usa capturas reales del proyecto.
- **Imagen para compartir** (WhatsApp, LinkedIn…): `assets/images/og-cover.png` (1200×630).

## 5. Actualizar el CV

Reemplaza `assets/cv/cv-jahir-jaziel.pdf` conservando el nombre. Los botones "CV" solo aparecen si el archivo existe. Nota: el CV incluido contiene tu teléfono y experiencia laboral ajena al desarrollo; considera subir una versión pensada para público.

## 6. Publicar en GitHub Pages

1. Crea un repositorio (p. ej. `jaziel-dev`) en la cuenta `JazyelAe` y sube el contenido de esta carpeta a la rama `main`:
   ```bash
   git init && git add . && git commit -m "JAZIEL.DEV" && git branch -M main
   git remote add origin https://github.com/JazyelAe/jaziel-dev.git && git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)`**.
3. La URL será `https://jazyelae.github.io/<repositorio>/`. Si el repositorio **no** se llama `jaziel-dev`, ajusta las URLs absolutas (canonical, Open Graph, sitemap, 404):
   ```bash
   node scripts/set-site-url.mjs https://jazyelae.github.io/nombre-del-repositorio/
   ```
   Todas las rutas internas son relativas, así que el sitio funciona bajo `/<repositorio>/` sin más cambios.
4. Tras cambiar la URL o los proyectos, vuelve a ejecutar el script (regenera `sitemap.xml`) y haz commit.

**Dominio propio (opcional, más adelante)**: crea un archivo `CNAME` en la raíz con tu dominio, configura el DNS según la guía de GitHub Pages, ejecuta `node scripts/set-site-url.mjs https://tu-dominio.com/` y añade el dominio a `ALLOWED_ORIGINS` de la función (sección 7).

## 7. Firebase: formulario de contacto

El formulario envía a una Cloud Function (`firebase/functions`) que valida en servidor, aplica antispam y te manda el mensaje por correo. **No se guarda nada en Firestore ni en Storage**, así que no hay reglas que proteger. Detalle completo en [`firebase/README.md`](firebase/README.md). Resumen:

- **Requiere el plan Blaze de Firebase** (pago por uso; necesita tarjeta). Las Cloud Functions y Secret Manager no están disponibles en Spark. Con el tráfico de un portafolio el costo esperado es mínimo, pero depende de tu cuenta de Google Cloud: configura una alerta de presupuesto.
- Requiere una **contraseña de aplicación de Gmail** (verificación en dos pasos activa).
- Mientras `contact.endpoint` esté vacío en `data/profile.json`, el formulario **no finge éxito**: ofrece enviar el mensaje con tu app de correo.

## 8. Desplegar el backend de contacto

```bash
npm install -g firebase-tools
firebase login
firebase use --add                                  # elige tu proyecto de Firebase
firebase functions:secrets:set GMAIL_APP_PASSWORD   # pega la contraseña de aplicación
cd firebase/functions && npm install && npm test && cd ../..
firebase deploy --only functions
```

Copia la URL de la función `contact` que muestra el despliegue en `data/profile.json` → `"contact": { "endpoint": "https://…" }`, haz commit y push.

## 9. Errores frecuentes

| Síntoma | Causa / solución |
|---|---|
| Página en blanco o sin proyectos en local | Abriste el HTML con doble clic. Usa `python3 -m http.server`. |
| 404 en CSS/JS/imágenes tras publicar | Sitio en `/<repositorio>/` y alguna ruta empieza con `/`. Usa rutas relativas. |
| El proyecto no aparece | `published` en `false`, JSON con coma de más (`node scripts/validate-data.mjs`) o categoría no definida. |
| Botón "CV" ausente | Falta `assets/cv/cv-jahir-jaziel.pdf` o el nombre difiere. |
| Imagen de portada no se ve | Ruta o mayúsculas distintas: GitHub Pages distingue mayúsculas de minúsculas. |
| Formulario: "No hay conexión con el servidor" | `endpoint` mal copiado, función sin desplegar, o tu origen no está en `ALLOWED_ORIGINS` (error CORS en consola). |
| Formulario: "No se pudo enviar" (502) | Contraseña de aplicación incorrecta o cuenta sin verificación en dos pasos. Revisa `firebase functions:log`. |
| Cambios no se ven tras `push` | Pages tarda 1–2 min; recarga forzada (Ctrl/Cmd+Shift+R). |

## Diseño y rendimiento

- Sin dependencias externas en ejecución: fuentes Geist autoalojadas, iconos en SVG propio, animaciones con CSS + `requestAnimationFrame`.
- Movimiento reducido (`prefers-reduced-motion`) respetado; en móviles el fondo de nodos usa menos partículas; el fondo se pausa con la pestaña oculta.
- Si `main.js` no carga en 4 s, se muestra todo el contenido sin animaciones.

Pruebas manuales: [`docs/PRUEBAS-MANUALES.md`](docs/PRUEBAS-MANUALES.md).
