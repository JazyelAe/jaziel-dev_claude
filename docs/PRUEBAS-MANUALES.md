# Pruebas manuales

Marca cada punto en escritorio (≥1280 px) y en móvil (≈390 px). Ejecuta primero `node scripts/validate-data.mjs` y `cd firebase/functions && npm test`.

## Carga y rendimiento
- [ ] La consola del navegador no muestra errores al cargar `index.html` ni `project.html`.
- [ ] La intro dura ~2 s y no bloquea el scroll; al volver desde un proyecto en la misma sesión no se repite.
- [ ] Con "Reducir movimiento" activado en el sistema, el contenido aparece de inmediato y no hay fondo animado.
- [ ] Bloquea `js/main.js` en DevTools → tras ~4 s todo el contenido es visible (sin animaciones).

## Navegación
- [ ] Los 5 enlaces llevan a su sección y el activo cambia al hacer scroll.
- [ ] Barra de progreso superior avanza con el scroll.
- [ ] Móvil: el botón abre/cierra el menú, `Esc` lo cierra, `Tab` no sale del menú, se cierra al elegir un enlace.
- [ ] Teclado: todos los controles tienen foco visible; el enlace "Saltar al contenido" funciona.
- [ ] En móvil no hay scroll horizontal.

## Hero y foto
- [ ] La foto se ve nítida, sin deformar. Renombra temporalmente `jaziel-profile.webp`: aparece el monograma, sin imagen rota.
- [ ] Botones "Explorar proyectos", "Contactar" y "CV" funcionan; GitHub, LinkedIn y Correo abren el destino correcto.
- [ ] "Consultar CV" abre el PDF. Renombra el PDF: los botones de CV desaparecen.

## Proyectos
- [ ] Se muestran solo TalentHub México y Consultas Médicas (los borradores están ocultos).
- [ ] Filtros: Todos (2), Frontend (1), QA / Testing (1), Aplicaciones web (2); no aparece "Backend". El texto de estado lo anuncia un lector de pantalla.
- [ ] Repositorio y Demo abren en pestaña nueva; Demo no aparece en Consultas Médicas.
- [ ] Clic en una tarjeta abre `project.html?slug=…` con título, ficha y solo los apartados con contenido.
- [ ] `project.html?slug=inexistente`, `…?slug=django-bootstrap-app` y sin `slug` muestran un mensaje claro con enlace de regreso.
- [ ] Cambia `published` de un borrador a `true`: aparece en la lista, en los filtros y en su detalle.
- [ ] Rompe el JSON a propósito: aparece el mensaje de error con "Reintentar".
- [ ] Añade `coverImage` y `gallery` reales: portada, galería y ampliación (lightbox con `Esc`) funcionan.
- [ ] Botones "Anterior/Siguiente" del detalle navegan entre proyectos.

## Perfil y tecnologías
- [ ] El texto de perfil, las 6 áreas y la formación coinciden con `profile.json`.
- [ ] Los 5 grupos de tecnologías coinciden con `skills.json`; no hay porcentajes ni barras.

## Contacto
- [ ] "Copiar correo" copia `jahirarana06@gmail.com` y anuncia "Copiado".
- [ ] Enviar vacío marca los campos con mensaje de error y mueve el foco al primero inválido.
- [ ] Correo inválido, asunto corto y mensaje < 10 caracteres se rechazan; el contador de mensaje avanza.
- [ ] Sin `endpoint`: el formulario NO muestra éxito; ofrece enviar con la app de correo.
- [ ] Con `endpoint` (tras desplegar Firebase): envío real → llega el correo, el formulario se limpia y se muestra la confirmación.
- [ ] Apaga la red y envía: mensaje de error de conexión sin perder lo escrito.
- [ ] Rellena el campo oculto `website` desde DevTools: no llega correo.
- [ ] Cuarto envío seguido desde la misma IP: mensaje de "demasiados mensajes".

## Publicación
- [ ] En `https://jazyelae.github.io/<repo>/` cargan estilos, fuentes, JSON, imágenes y el PDF.
- [ ] `…/<repo>/ruta-inexistente` muestra la página 404 con estilos y el botón vuelve al inicio.
- [ ] `sitemap.xml` y `robots.txt` apuntan a la URL real; pega el enlace en LinkedIn/WhatsApp y comprueba la vista previa.
- [ ] El repositorio no contiene contraseñas ni claves (solo `.env.example`).
