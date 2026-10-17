# Función de contacto (Firebase)

`contact` es una Cloud Function HTTPS (2ª generación, Node 22, región `us-central1`) que recibe el formulario del portafolio y envía el mensaje a tu correo con Gmail (nodemailer).

## Arquitectura

```
Navegador (GitHub Pages) ── POST JSON ──► Cloud Function `contact` ──► Gmail SMTP ──► tu bandeja
```

Sin Firestore, sin Storage, sin Authentication: no se almacenan mensajes en ninguna colección.

## Protecciones

- Solo acepta `POST` desde los orígenes de `ALLOWED_ORIGINS` (CORS + comprobación en servidor); el resto recibe 403.
- Validación en servidor (nombre 2–80, correo válido, asunto 3–120, mensaje 10–2000, máx. 3 enlaces) y limpieza de saltos de línea para evitar inyección de cabeceras. El HTML del correo se escapa.
- Campo trampa `website` (bots) y tiempo mínimo de relleno (2,5 s).
- Límite de 3 envíos por IP cada 10 min y 30 por hora por instancia. **Es en memoria**: se reinicia con cada instancia y no es un límite global exacto. Para endurecerlo más, activa Firebase App Check (reCAPTCHA) o un límite persistente, que requeriría Firestore.
- `maxInstances: 3` limita el costo máximo ante abuso. Cuerpo máximo 10 KB.
- La contraseña vive en **Secret Manager** (`GMAIL_APP_PASSWORD`); no hay credenciales en el repositorio.

## Requisitos externos

1. **Plan Blaze** del proyecto de Firebase (Functions y Secret Manager lo exigen). Conviene crear una alerta de presupuesto en Google Cloud.
2. Cuenta de Gmail con **verificación en dos pasos** y una **contraseña de aplicación** (Cuenta de Google → Seguridad → Contraseñas de aplicaciones).
3. Firebase CLI: `npm install -g firebase-tools`.

## Despliegue (independiente de GitHub Pages)

Desde la raíz del repositorio:

```bash
firebase login
firebase use --add                                   # crea .firebaserc con tu proyecto (puede subirse a GitHub)
firebase functions:secrets:set GMAIL_APP_PASSWORD    # pega la contraseña de aplicación (16 caracteres)
cd firebase/functions && npm install && npm test && cd ../..
firebase deploy --only functions
```

Al terminar verás la URL de `contact`. Pégala en `data/profile.json` → `contact.endpoint`.

### Configuración opcional

Valores por defecto: `MAIL_USER` y `CONTACT_TO` = `jahirarana06@gmail.com`, `ALLOWED_ORIGINS` = `https://jazyelae.github.io`. Para cambiarlos, copia `firebase/functions/.env.example` a `.env` (ignorado por git) y redespliega. Si usas dominio propio, añade su origen separado por comas: `https://jazyelae.github.io,https://tu-dominio.com`.

## Probar

```bash
cd firebase/functions && npm test        # 13 pruebas de validación, antispam y errores (sin red)
```

Prueba real tras desplegar (el origen debe estar permitido):

```bash
curl -i -X POST "URL_DE_LA_FUNCION" \
  -H "Content-Type: application/json" -H "Origin: https://jazyelae.github.io" \
  -d '{"name":"Prueba","email":"prueba@example.com","subject":"Hola","message":"Mensaje de prueba desde curl","website":"","elapsed":9000}'
```

Respuesta esperada: `200 {"ok":true}` y un correo en tu bandeja. Ver registros: `firebase functions:log`.

## Respuestas de la API

| Código | Significado |
|---|---|
| 200 `{ok:true}` | Enviado |
| 400 `{error:"validation", fields}` / `too_fast` | Datos inválidos o envío demasiado rápido |
| 403 | Origen no permitido |
| 413 | Cuerpo demasiado grande |
| 429 | Demasiados envíos |
| 502 `send_failed` | Falló Gmail (revisa la contraseña de aplicación) |
