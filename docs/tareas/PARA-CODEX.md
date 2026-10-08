# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 8 de octubre de 2026 · Claude (8) · cuentas fase 1: casi abiertas, falta que Gmail acepte la contraseña

**Rama:** `claude/abrir-cuentas` (sale de `main` tras el PR #10). PR abierto
para que lo revises. **La web pública NO tiene las cuentas encendidas**;
solo la vista previa `https://revision.rwadar.pages.dev`.

### Ya hecho y comprobado

| Qué | Dónde / cómo se comprobó |
|---|---|
| Web: `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`; opiniones, avisos por correo, comunidad, manual y Turnstile siguen apagados | `rwadar-site/assets/rwadar-20260820.js` |
| Privacidad reescrita para cuentas abiertas (7/10/2026): apartado «Tu cuenta (opcional)», correos de confirmación/recuperación por una cuenta de Gmail de RWAdar, sesión solo en memoria, borrado desde Perfil, conservación | `rwadar-site/privacidad.html`, `sitemap.xml` |
| Pruebas: el camino cerrado se sigue probando sobre la misma web con los interruptores apagados (`jsCerrado` en `probar-web.mjs`) | `npm test` en verde |
| Ensayo E2E en Chrome real contra Supabase simulado (PGlite + 26): alta, confirmación, entrar, vigilar, recuperar, móvil, borrar, Turnstile | `node rwadar-app/ensayo-cuentas-web.mjs` → **61/61** (Playwright con `RWADAR_CHROMIUM` = Chrome instalado) |
| Migración 26 + verificador en una transacción | `rwadar-app/db/26_abrir_cuentas_un_paso.sql`; probado en PGlite (dos veces) |
| **Supabase producción:** 26 aplicada (SQL Editor, «Success», verificador sin excepción) | 07/10, 23:3x |
| **Supabase Auth:** SMTP propio activado (remitente y usuario `rwadares@gmail.com`, nombre `RWAdar`, `smtp.gmail.com`, puerto 587); plantillas en español «Confirma tu cuenta de RWAdar» y «Recupera tu acceso a RWAdar» (texto de `REABRIR-CUENTAS.md`); **altas abiertas**; confirmación de correo obligatoria; contraseña mínima 12 (ya estaba); Redirect URLs: añadido `https://revision.rwadar.pages.dev/` | `GET /auth/v1/settings` → `disable_signup:false`, `mailer_autoconfirm:false` |
| Vista previa con cuentas | despliegue `b8745f05`, alias `revision.rwadar.pages.dev`; `comprobar-publicado.mjs` 35/35; aprobación en `estado.json` (commit `e87141c`) |

### Lo que falla ahora (bloqueante)

Al crear una cuenta en la vista previa sale «Error sending confirmation
email». En *Logs › Auth* de Supabase:
1. Primer intento: `535 5.7.8 Username and Password not accepted` (credenciales).
2. Último intento (08/10 00:02): `534 5.7.9 Application-specific password required`.
   Es decir: la verificación en dos pasos de `rwadares@gmail.com` ya está
   activa, pero en *SMTP Settings › Password* sigue la contraseña normal de
   Gmail. Hay que generar una **contraseña de aplicación** en
   https://myaccount.google.com/apppasswords (16 letras, **sin espacios**) y
   pegarla ahí › *Save changes*. Esto solo lo puede hacer Víctor: ni Claude
   ni Codex deben crear credenciales ni escribir contraseñas.

Quedó una cuenta de prueba de Víctor **sin confirmar** en Auth › Users: al
registrarse otra vez con el mismo correo se reenvía la confirmación; si no,
borrarla desde ahí.

### Lo que falta, en orden

1. Víctor: contraseña de aplicación en Supabase (arriba).
2. Prueba real en `https://revision.rwadar.pages.dev`: crear cuenta, recibir
   «Confirma tu cuenta de RWAdar», confirmar, vigilar una plataforma, salir y
   entrar, «He olvidado la contraseña», borrar la cuenta. Si un paso falla,
   el motivo está en Supabase › Logs › Auth (abrir la fila y leer `error`).
3. Publicar en producción desde la rama: `node rwadar-publicar.js --produccion`
   (si sincroniza y ensucia JS/portada/sitemap: commit + nueva aprobación en
   `estado.json` y repetir, como siempre) y comprobar con
   `node .github/comprobar-publicado.mjs https://rwadar.pages.dev`.
4. Supabase › URL Configuration: quitar `https://revision.rwadar.pages.dev/`
   (y valorar quitar `https://rwadar.netlify.app/`, que es solo la página de
   limpieza). Deben quedar solo los de `rwadar.pages.dev`.
5. Unir el PR de `claude/abrir-cuentas` a `main`.
6. Recomendado antes de anunciar cuentas: anti-robots Turnstile (sección
   «Anti-robots» de `REABRIR-CUENTAS.md`: Víctor crea el widget y pega la
   Secret Key en Supabase; la Site Key va al JS, CSP en `_headers` y
   `rwadar-servir.js`, privacidad y pruebas).
7. Gmail no está pensado para envíos masivos (unos cientos al día). A medio
   plazo: dominio propio + Brevo (`REABRIR-CUENTAS.md`, opción B).

### Otros pendientes que no son de cuentas

- **El catálogo vence el 13/10** (lote `a0df3111`). Repetir la revisión antes
  (`docs/CATALOGO-V2-2026-10-06.md`); si no, web y app muestran «Revisión
  pendiente».
- Modo de la sesión de Claude: aun fuera de «Auto», el filtro de Claude bloquea
  pulsar «Run» en el SQL Editor de producción; Víctor tuvo que pulsarlo.

## 7 de octubre de 2026 · Claude (7) · catálogo del 06/10 en producción, web y app 1.2.0 publicadas

- **Supabase:** Víctor pegó `aplicar-y-aprobar.sql` tres veces (SQL Editor).
  Lote vigente **`a0df3111`** (06/10, hasta el 13/10). Sustituye a `36945ee9`
  (cifra principal de mF-ONE y Spiko sin actualizar: el montador buscaba la
  etiqueta en métricas ya cambiadas) y a `c0e20ca3` (texto de Spiko con
  «observado el 30/09»). Cada corrección se probó en PGlite encima de los
  lotes ya aplicados. Comprobado por REST anónimo: 26/49 y contrato de la app.
- **Web:** despliegue de producción `b3fcc32f` desde el ordenador de Víctor;
  `comprobar-publicado.mjs` 35/35 en `rwadar.pages.dev`; mF-ONE 7,58 %,
  Spiko 2,16 % «observado el 06/10/2026», «Última revisión del registro:
  06.10.2026». Sincronizar cambia JS y portada: dos rondas de commit +
  aprobación en `estado.json`, como siempre.
- **Pruebas:** `probar-web.mjs` tenía el reloj de la pestaña simulada fijo
  en el 30/09 y fichas sintéticas de septiembre; ahora se fechan respecto al
  lote incrustado (`fechaLoteEmbebido`, `pestanaCatalogo({ inicio })`).
  Sin esto, cualquier lote nuevo rompía `npm test`.
- **App 1.2.0, versionCode 12:** build EAS `99fd77d8` (la `6c3ed542` murió
  por un fallo del servidor de Expo). APK 85 558 264 bytes, SHA-256
  `87900ef2…b8e3ea`, certificado `f506dea7…` (el de siempre). Probada en
  emulador Android 15 con el flujo nuevo `android-smoke-120.yml` del repo
  `RWAdar-downloads` (run 37446968987: Inicio, Buscar 24/21/4, Spiko 2,16 %,
  Academy 7 lecciones, Perfil; sin errores). Release `v1.2.0` marcada como
  latest; `/android` lleva a ella y la descarga anónima coincide byte a byte.
- `gh` instalado en el ordenador de Víctor (cuenta victorJorques, con
  permiso `workflow`).

## 6 de octubre de 2026 · Claude (6) · revisión nueva del catálogo, app 1.2.0 compilando

**Rama:** `claude/revision-catalogo-2026-10-06` (sale de `claude/publicar-2026-10-05`,
PR #9 aún sin unir). **Nada aplicado en Supabase todavía.**

- **Revisión del 06/10** (lote `36945ee9`, vigente hasta el 13/10): 70 fuentes
  del radar y 49 fichas consultadas de nuevo; mismo manifiesto 26/49 (24/21/4).
  Detalle y criterios en `docs/CATALOGO-V2-2026-10-06.md`. No se alargó la
  vigencia de la anterior (la base limita a 7 días y la app instalada también).
- **Para publicarla:** pegar `rwadar-app/data/importaciones/catalogo-2026-10-06-v2/aplicar-y-aprobar.sql`
  entero en Supabase › SQL Editor › Run, **después de las 02:00 de España**
  (Supabase va en UTC; antes falla a propósito y no cambia nada). Importa y
  aprueba en una transacción y se deshace si el lote no queda publicable.
  Después: `rwadar-publicar.js --preview` (sincroniza; habrá que commitear JS
  y portada y reaprobar en `estado.json` dos veces, como el 5/10), comprobar
  y `--produccion`.
- Comprobado: `node -r <reloj+3h> rwadar-app/comprobar-revision-2026-10-06.mjs`
  aplica ese mismo SQL sobre la cadena de producción en PGlite: 26/49, 9 fichas
  con cifras el 06/10, caduca el 14/10. `npm test` en verde. Sin el reloj
  adelantado se ejecuta tal cual a partir de las 02:00 del 06/10.
- **App 1.2.0, versionCode 11:** build EAS `6c3ed542-aa13-45c6-9e4d-9c4dbd144cf9`
  (perfil `editorial`, misma clave), lanzada desde el ordenador de Víctor;
  estaba en cola. Falta: descargar APK, comprobar firma/huella, probar en un
  móvil real y publicarlo como release `v1.2.0` en `RWAdar-downloads`
  (`/android` apunta a `releases/latest`). `gh` no está instalado: hacerlo
  desde el Chrome de Víctor.
- Pendiente de Víctor: «Merge» en el PR #9 y en el de esta rama.

## 5 de octubre de 2026 · Claude (5) · web publicada en producción desde el ordenador de Víctor

- **Publicado** con `rwadar-publicar.js --produccion` desde una copia limpia
  de `main` (`23f9faf`) en el ordenador de Víctor, con su sesión de
  Wrangler (cuenta `52d07be0…`). Despliegue `cbe0aa77`; antes, preview
  `a060c69e` (alias `revision.rwadar.pages.dev`). Ya no hace falta el
  secreto `CLOUDFLARE_API_TOKEN` para esta publicación, aunque sigue
  pendiente para publicar desde GitHub.
- La sincronización con Supabase cambió dos archivos, igual que el 2/10:
  `eee89fc` (catálogo en el JS: 10 fichas del 30/09 con vigencia de 1 día
  pasan a «Cifras pendientes de nueva revisión») y `e320b21` (portada
  pre-renderizada). Aprobaciones en `589be2c` y `4e06d9e`, por orden expresa
  de Víctor en el chat.
- Comprobado: `npm test` en verde; `.github/comprobar-publicado.mjs` 35/35
  sobre la preview y sobre `https://rwadar.pages.dev`; en Chromium móvil, la
  barra Inicio · Buscar · Academy · Perfil cambia de panel, Academy muestra
  «0 de 7 lecciones leídas», Perfil muestra «Cuentas en pausa»; consola sin
  errores; cabeceras (CSP, HSTS, X-Frame-Options DENY, nosniff) presentes;
  `/.git/config`, `/package.json`, `/.env` y el código fuente dan 404;
  barrido de secretos de `rwadar-publicado/` sin coincidencias.
- **Cuentas: siguen en pausa.** Para abrirlas faltan los pasos 1 a 3 de
  `docs/tareas/REABRIR-CUENTAS.md` (SMTP, ajustes de Auth y SQL 26), que
  solo puede hacer Víctor.
- **Ojo:** el lote del catálogo vence el 5/10 inclusive; a partir del 6/10
  la web lo enseña con «Revisión pendiente» hasta que haya revisión nueva.

## 5 de octubre de 2026 · Claude (4) · #6 y #7 unidos, manual corregido, anti-robots preparado

- **PR #6 unido a `main`** (`ecba31e`): comunidad apagada, app 1.2.0, flujo
  «Compilar app Android» y tu mejora de tarjetas. CI verde (pruebas + gitleaks).
  `main` es idéntico a lo aprobado en `estado.json` (`70b2346`).
- **Publicar sigue bloqueado por la clave**: lancé «Publicar web» (preview)
  desde `main` y se paró en «Comprobar que existe la credencial de
  Cloudflare» (run 37311901615). No se tocó nada en línea. La aprobación
  caduca el 7/10.
- **Manual de Eric corregido** (sin tocar el original):
  `docs/manual/corregir-manual.py` → `RWAdar_Como_Usar_RWAdar_2026_corregido.pdf`.
  Página 9: lista de vigilancia hoy, guías y avisos «próximamente», Academy
  con 7 lecciones. Página 7: el checklist «llegará próximamente». Las demás
  páginas salen idénticas píxel a píxel. Falta el visto bueno de Eric; se
  enciende con las cuentas (`docs/manual/LEEME.md`).
- **Anti-robots (Turnstile), apagado**: `TURNSTILE_SITEKEY=''` en el módulo
  `Cuenta`. Encendido, alta, entrada con contraseña, recuperación y reenvío
  piden un testigo nuevo cada vez y lo mandan como
  `gotrue_meta_security.captcha_token` (formato comprobado en
  `@supabase/auth-js`). El script de Cloudflare solo se carga al pedir algo
  a Auth. Caja `#cuentaRobot` en la ventana de cuenta. Para encenderlo hay
  que tocar CSP, pruebas y privacidad: pasos en
  `docs/tareas/REABRIR-CUENTAS.md`, «Anti-robots». Ensayo, sección 11, con
  Turnstile y Supabase de mentira: alta, reenvío y entrada con testigos
  distintos, bloqueador que impide cargarlo, y Supabase que lo exige sin
  que la web lo lleve.
- **Fallo real arreglado** gracias al ensayo, que fallaba 1 de cada 3
  vueltas. Al abrir la ventana de cuenta, un temporizador de 60 ms movía el
  cursor a «Correo» aunque ya se estuviera escribiendo en «Contraseña», y la
  clave acababa en el campo del correo (`correo=[ana@ejemplo.testuna clave…]`).
  Ahora no mueve el cursor si ya hay un campo de la ventana activo. El ensayo
  también espera ya a que la lista de la comunidad se refresque.
- **Segundo fallo, del propio anti-robots, arreglado antes de salir**: si se
  cerraba la ventana mientras cargaba Turnstile, la entrada cancelada se
  enviaba igual en segundo plano. `antiRobots`/`conAntiRobots` comprueban
  ahora `operacionCuenta` tras cargar y tras el testigo.
- Pruebas: web 501, `rwadar-app` completo, móvil 126, QR, tools; ensayo en
  el navegador 61/61, repetido varias veces seguidas.

## 5 de octubre de 2026 · Claude (3) · comunidad preparada y app lista para compilar

- **Comunidad** (apagada, `PUBLICACIONES_REMOTAS=false`): `rwadar-app/db/27_comunidad.sql`
  + `27_comunidad_cerrar.sql`. Una publicación por cuenta y día de España
  (`unique (usuario_id, dia)`), 10–500 caracteres, sin enlaces (CHECK), autor
  «Miembro de RWAdar» salvo que elija su nombre, lectura pública solo de
  `id, autor, texto, creada_el`, escritura solo por RPC (`publicar`,
  `mis_publicaciones`, `borrar_mi_publicacion`, `denunciar_publicacion`,
  `moderar_publicacion`, `cola_publicaciones`), tres denuncias la ocultan.
  Prueba `probar-comunidad.mjs` 30/30 (en `npm test`). Web: módulo
  `Comunidad` (`comunidad:inicio/fin`) en Inicio, escucha el evento
  `rwadar:sesion` que lanza `Cuenta.pinta()`. Ensayo en el navegador 48/48.
  Moderación por SQL documentada en `docs/tareas/REABRIR-CUENTAS.md`.
- **App 1.2.0** y flujo manual `.github/workflows/compilar-app.yml` (pruebas →
  EAS → artefacto con SHA-256). Necesita el secreto `EXPO_TOKEN`
  (`rwadar-movil/LEEME.md`, «Compilar desde GitHub»).
- Pruebas: web 407, `rwadar-app` completo, móvil 104, tools y QR.
- **Tu mejora de tarjetas (`mejora-tarjetas-local`) está integrada** en esta
  rama: tarjeta nueva + botón «☆ Guardar», pruebas adaptadas (web 499, móvil
  126). `lib/config-ios-uuid-seguro.js` se conserva con sus pruebas pero se
  quitó de `app.json`: choca con `scripts/parchear-expo-uuidv5.cjs` (mismo
  archivo, huella distinta) y rompería la build de iOS. Hay que elegir uno.

## 5 de octubre de 2026 · Claude (2) · nueva barra: Inicio · Buscar · Academy · Perfil

**Rama:** `claude/zealous-shannon-endwcn` (reiniciada desde `main` tras unir
#4). Petición de Víctor: reorganizar la barra del móvil y dejar los avisos
como «próximamente». No toca producción, Supabase ni EAS.

### Web (móvil; el escritorio no cambia)

- Pestañas `inicio` · `buscar` · `academy` · `cuenta` (rótulo «Perfil»). Con
  JavaScript el móvil abre en Inicio salvo que la URL traiga ancla; sin él se
  ve Buscar (`movilPanelRadar` no lleva `hidden`, como el escritorio).
- **Inicio** (`movilPanelInicio`): presentación, atajos, noticias generadas
  (marcas `<!--noticias:ini-->`), Comunidad «próximamente» (una publicación al
  día por cuenta cuando haya cuentas) y Método/Fuera/3D.
- **Academy** (`movilPanelAcademy`): en el móvil se **mueve** el bloque real
  `.academia-lecciones` de la portada (con ancla para devolverlo en
  escritorio) y se cuenta lo leído con la clave `rwadar.academy.v1`.
- **Perfil** (`movilPanelMas`): tarjeta de cuenta (en pausa), empresas y
  ofertas guardadas, Avisos «llegarán próximamente a la app» con la vía para
  retirar un consentimiento anterior, privacidad, sonido, borrar guardados,
  CSV y contacto. Desaparecen Favoritos, Inversiones y la subvista de Avisos
  (su JS queda inerte: sin esos nodos no hace nada).
- **Favoritos locales**: módulo `Favoritos` (`favoritos-locales:inicio/fin`,
  al principio del JS porque las tarjetas se pintan antes), clave
  `rwadar.favoritos.v1` (nombres de empresa y slugs de oferta). Botón
  «Guardar en favoritos» en la ficha (cuando no hay cuentas) y «☆ Guardar» en
  las tarjetas de oferta; solo visibles en el móvil (`.fav-local`).
- Privacidad actualizada (5/10/2026) y `sitemap.xml`.

### Noticias

Fuente única `rwadar-noticias/noticias.json` → `rwadar-noticias.js` escribe
el bloque de Inicio de la web y `rwadar-movil/lib/noticias-contenido.js`.
`--comprobar` en `test:tools`; `rwadar-publicar.js` bloquea si no está al día;
añadido a `RUTAS_CONTENIDO_APROBADO`. **Ojo:** la noticia «RWAdar Academy ya
está abierta» lleva fecha 5/10; si se publica otro día, cambia la fecha.

### App (necesita versión nueva para llegar a los móviles)

- `Navegacion.js`: Inicio · Buscar · Academy · Perfil (iconos nuevos; insignia
  de guardados en Perfil).
- `componentes/Inicio.js` nuevo. Buscar = selector «Empresas | Ofertas» sobre
  las dos listas de siempre. Academy pasa de modal a pestaña (`onCerrar`
  opcional). `PantallaPerfil` sustituye a «Más», «Siguiendo» y «Avisos»: en
  modo editorial enseña «Avisos · próximamente»; con la capacidad remota
  vuelve a usar `PanelAvisos`.
- Ofertas guardadas en el dispositivo (`ofertasGuardadas`,
  `alternarOfertaGuardada`, clave `…ofertas.guardadas.v1`, borrada con el
  resto) y estrella en `DetalleOferta`.

### Pruebas

Web 406, `rwadar-app` completo, móvil 104, tools, QR y ensayo de cuentas 37.
Capturas reales en Chromium (web móvil y app exportada con react-native-web).

## 5 de octubre de 2026 · Claude · cuentas (fase 1) preparadas, manual, seguridad

**Rama:** `claude/zealous-shannon-endwcn`. **No toca producción:** nada
publicado, nada aplicado en Supabase, sin EAS. Todo lo nuevo queda apagado.

### Qué hay

| Pieza | Dónde |
|---|---|
| Migración de reapertura, fase 1: perfil, vigilancia, baja y fecha de descarga del manual. Opiniones, moderación, dispositivos y push siguen cerrados | `rwadar-app/db/26_reabrir_cuentas.sql` + `_verificar.sql`; marcha atrás = reaplicar 25 |
| Prueba sobre la cadena de producción (01-22, 24, 25, catálogo) | `rwadar-app/probar-reabrir-cuentas.mjs` (36/36), dentro de `npm test` |
| Ensayo E2E en Chromium: la web real con cuentas encendidas en memoria contra un Supabase simulado sobre PGlite + 26 | `rwadar-app/ensayo-cuentas-web.mjs` (37/37; necesita Playwright, no está en `npm test`) |
| Web: interruptores separados `OPINIONES_REMOTAS`, `AVISOS_CORREO_REMOTOS`, `MANUAL_BIENVENIDA` (todos apagados, igual que `SERVICIOS_USUARIO_REMOTOS` y `CORREO_AUTH_E2E`) | `rwadar-site/assets/rwadar-20260820.js` |
| Dos fallos corregidos que solo salían con cuentas abiertas: botón de cuenta del móvil siempre desactivado; botón «Entrar» bloqueado tras «Confirma tu correo» | mismo archivo; pruebas fijas en `probar-web.mjs` |
| Textos de cuenta sin promesas de opiniones mientras estén cerradas (etiqueta del nombre, aviso legal del alta, subtítulo) | `rwadar-site/index.html` |
| Manual de bienvenida de Eric (PDF original, revisión y cómo encenderlo). **Sección 8 promete avisos y guías por correo que no existen; la 6 remite a un checklist que no tenemos** | `docs/manual/` |
| Pasos de Víctor para abrir cuentas (SMTP, Auth, SQL, prueba real) | `docs/tareas/REABRIR-CUENTAS.md` |
| Revisión de seguridad | `docs/seguridad/REVISION-SEGURIDAD-2026-10-05.md` |
| Pasos exactos para crear la clave de Cloudflare | `docs/OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub» |

Academy «ENTREGA_WEB_1_2»: las 9 lecciones son idénticas byte a byte a la
entrega del 2/10 (commit `5cecbb8`); no hay nada nuevo que montar.

### Pruebas

`npm test` por partes en verde: web 405, `rwadar-app` completo (incluida la
nueva), móvil 101, tools y QR. Gitleaks sobre 74 commits: 10 avisos, todos
falsos (detalle en la revisión de seguridad).

### Pendiente (de Víctor)

1. Secreto `CLOUDFLARE_API_TOKEN` en GitHub → Claude publica (la aprobación
   caduca el 7/10).
2. Pasos 1 a 3 de `REABRIR-CUENTAS.md` → Claude enciende cuentas en
   `revision`, Víctor prueba, se reescribe la privacidad y se publica.
3. Eric: corregir la sección 8 del manual y enviar el Checklist de
   Elegibilidad.

---

## 2 de octubre de 2026 · Claude · RWAdar Academy en la web y en la app

**Rama:** `claude/zealous-shannon-endwcn`, commit «feat(academy): …». No toca
producción: ni web publicada, ni Supabase, ni EAS.

Víctor pasó la entrega de Eric (`RWAdar_Academy_ENTREGA_WEB`): 9 lecciones en
Markdown y una especificación. Está montada en la web y en la app.

### Qué hay

| Pieza | Dónde |
|---|---|
| Fuente única: las 9 lecciones tal cual, `academy.json` (qué se publica, niveles, destinos de los botones) y el aviso legal común | `rwadar-academy/` (léete su `LEEME.md`) |
| Generador: valida las lecciones y escribe web + app; `--comprobar` no escribe | `rwadar-academy.js` |
| Web: índice `/academy/` y una página por lección publicada (TL;DR, índice lateral, recuadros, test con explicación, siguiente paso, aviso legal, progreso en `localStorage`) | `rwadar-site/academy/`, `assets/academy-20261002.{css,js}` |
| Portada: bloque de lecciones (entre `<!--academy:ini-->` y `<!--academy:fin-->`), enlace «Academy» en cabecera y pie, ancla `#comparador` | `rwadar-site/index.html` |
| App: pantalla nativa (Más › RWAdar Academy y aviso en el radar), test, progreso en el dispositivo | `rwadar-movil/componentes/Academy.js`, `lib/academy-contenido.js` (generado), `lib/academy-progreso.js` |
| Revisión del contenido y decisiones | `docs/academy/REVISION-CONTENIDO-2026-10-02.md` |

**Publicadas:** lecciones 1–6. **Próximamente:** 7 (sus «cuatro criterios» no
coinciden con el Método), 8 y 9 (calendario de Eric). Evaluador de Viabilidad
y checklist del expediente: «Próximamente», nunca enlace roto.

### Cambios en piezas existentes

- `rwadar-publicacion-segura.js`: `PAGINAS_ACADEMY` (lista cerrada) dentro de
  `ARCHIVOS_PUBLICABLES`, más los dos assets; `rwadar-academy` y
  `rwadar-academy.js` añadidos a `RUTAS_CONTENIDO_APROBADO`.
- `rwadar-publicar.js`: `PAGINAS_HTML` común (CSP estricta y assets con
  huella también en la Academy) y bloqueo si la Academy no está al día o no
  coincide con `PAGINAS_ACADEMY`.
- `rwadar-servir.js`: URL limpias `/academy/…` como en Cloudflare.
- `_headers` (`/academy/*` sin caché), analítica (mide `/academy/…` limpias),
  `sitemap.xml` (solo lo publicado).
- **`privacidad.html`**: dice que el progreso de la Academy se guarda en el
  navegador o en el dispositivo y no se envía. Fecha de revisión → 2/10/2026.
  En la app, «Borrar datos del dispositivo» también borra el progreso.
- Pruebas antiguas ajustadas: la «videoteca» ya no existe, y dos pruebas de
  `rwadar-app` contaban apariciones de nombres de página en el publicador.

### Pruebas

- `npm test` completo en verde: web 394 (48 nuevas de la Academy), app 101
  (8 nuevas, una pinta las 6 lecciones con react-native-web) y todas las de
  `rwadar-app`.
- Chromium real, web en escritorio y móvil: sin desbordamiento horizontal,
  test corrige y abre las explicaciones, «Marcar como leída» sobrevive a
  recargar y se ve en el índice, sin errores de consola.
- App exportada a web (copia aislada con datos locales, sin Supabase):
  índice, lección, test, tabla con desplazamiento, aviso reforzado, botón al
  radar y progreso tras recargar.

### Cierre del 2 de octubre (petición de Víctor)

- **Lección 7 publicada** (7 de 9). `PAGINAS_ACADEMY` ya la incluye.
- **Revisión legal:** Víctor la ha verificado; las nueve lecciones dicen
  2 de octubre de 2026.
- **Lectura:** letra mayor, más interlineado y gris más claro en web y app;
  cursiva real de Geist en la app.
- **Tipografía de toda la web arreglada:** la Geist incrustada en
  `rwadar-20260820.css` era solo el recorte «latin-ext» (sin a-z), así que la
  web se veía con la letra del sistema. Ahora es el paquete oficial `geist`
  1.7.2 recortado a latín (22 kB sans, 16 kB mono; la Academy lleva además
  la cursiva). Comprobado en Chromium: el 100 % del texto sale en Geist.
- **Aprobación registrada** en `estado.json` (commit propio) y **unido a
  `main`** con merge commit (PR #1); la auditoría sobre `main` da «LISTO PARA
  CORTE FINAL». Desde la nube de Claude no hay red ni credenciales de
  Cloudflare: la subida la hace Víctor o Codex en local (`git pull`,
  `--preview`, comprobar y `--produccion`).

### Pendiente

1. ~~Decidir con Eric los criterios y las funciones prometidas.~~ **Hecho**
   por petición de Víctor (tercer commit): las lecciones usan los cuatro
   criterios del Método y anuncian como «próximamente» el Evaluador, los
   filtros por categoría y por supervisión y la checklist. Detalle en
   `docs/academy/REVISION-CONTENIDO-2026-10-02.md`. La lección 7 ya se
   podría publicar (solo espera al calendario).
2. **Para publicar la web (con permiso de Víctor):** registrar la aprobación
   en `estado.json` (la auditoría dirá que el contenido cambió), `--preview`,
   comprobar `/academy/`, `--produccion`.
3. **App:** entra en la próxima compilación; subir versión al compilar.
4. ~~Cabecera compacta de la PWA móvil que solapaba «RWAdar» con el título.~~
   **Arreglado** en un segundo commit: los laterales de la rejilla ya no
   pueden medir menos que la marca y los botones, el título es lo único que
   cede (con «…»), la marca se aprieta un poco por debajo de 350 px y el
   título de la subvista pasa a «Academy». Medido en 320, 360, 390 y 430 px
   en Buscar, Academy, Método, Fuera, Favoritos, Inversiones y Mi cuenta:
   ningún solape. En la app nativa, «PRÓXIMAMENTE» ya no se parte en dos
   líneas a 320 px y las tarjetas anterior/siguiente dicen «← LECCIÓN 1».

---

## 1 de octubre de 2026 · Claude (2) · catálogo siempre disponible

Víctor se quedó sin créditos de Codex y pidió a Claude que siguiera. Regla
nueva de Víctor: **el catálogo tiene que estar siempre disponible para el
público, salvo que él diga lo contrario.** He hecho la tarea
[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md) con esa
regla ampliada.

### Qué hace ahora

| Situación | Antes | Ahora |
|---|---|---|
| La revisión vence (7 días) | Web y app vacías | Se ve la última copia completa con el aviso «Revisión pendiente» |
| Cifras de una oferta vencidas | Ocultas | Ocultas (sin cambios) |
| Supabase responde vacío o incompleto | Web y app vacías | Se conserva la última copia completa con el aviso «No hemos podido comprobar…» |
| Revisión incompleta, futura o mezclada | No se publica | No se publica (sin cambios); nunca se vuelve a una anterior |
| Víctor quiere quitar el catálogo | No había forma clara | `public.catalogo_publicacion.retirado = true` (ver `RUNBOOK.md`) |

### Qué he cambiado

- **Base:** `rwadar-app/supabase/migrations/20261001150000_catalogo_siempre_disponible.sql`.
  - Políticas nuevas `*_de_revision_publicada_v2`: se puede leer la revisión
    del puntero `publicacion_v2` aunque haya vencido.
  - `revision_publicable_v2`: igual que antes, salvo que ya no exige
    vigencia.
  - Tabla `public.catalogo_publicacion`: es la orden expresa. Un disparador la
    activa al retirar la revisión publicada y la desactiva al aprobar otra.
  - **Las vistas públicas no cambian de columnas:** la web y el APK de hoy
    rechazan un lote caducado igual que antes.
- **Contrato compartido:** `validarLotePublicoV2(..., { permitirCaducado })`
  en `rwadar-movil/lib/contrato-catalogo.js`. Por defecto se comporta como
  antes; con la opción devuelve `caducado`.
- **Web** (`rwadar-site/assets/rwadar-20260820.js`, `index.html`, `.css`):
  - La caducidad ya no vacía nada. `alDia` consulta además
    `/catalogo_publicacion` y solo `retirado === true` oculta el catálogo.
  - Una vista vacía, incompleta o un lote fuera de contrato conservan la copia
    embebida o la descargada antes, con aviso.
  - Avisos nuevos: `#avisoCatalogoRadar` y `#avisoCatalogoOfertas`. El pie y
    el contador dicen «pendiente de renovar».
- **App** (`lib/catalogo-remoto.js`, `App.js`):
  - Al vencer se recarga en lugar de borrar.
  - Ya caducado, se refresca una vez al día (`programarRevisionDiaria`) para
    ocultar las cifras que vayan venciendo.
  - Solo la orden expresa borra la caché.
- **Publicación:** `sincronizar.js` admite un lote V2 caducado y avisa por
  pantalla. Así se puede publicar aunque la revisión haya vencido.

### Pruebas

- Nueva: `rwadar-app/probar-catalogo-siempre-disponible.mjs` → 29/29 contra
  PGlite. Cubre vigente, caducada, nueva revisión, incompleta, futura,
  retirada, reaprobación, orden manual y permisos.
- Web: 346/346. Las pruebas de caducidad ahora exigen que todo siga visible
  con aviso. Hay pruebas nuevas de la orden expresa y de una base antigua sin
  la tabla. Las 4 consultas anónimas están vigiladas.
- App: 93/93. Las pruebas de «retira la caché» ahora exigen que la conserve,
  y hay pruebas nuevas de la orden expresa, de una base antigua y de la
  revisión diaria.
- `npm test` completo en verde.
- Navegador real (Chromium) con la fecha fijada en el 10/10/2026 y Supabase
  caído: 26 plataformas, 49 referencias y el aviso visible, en escritorio y
  en móvil.

### Para ponerlo en producción (Víctor o Codex, con permiso de Víctor)

1. **Primero la migración** en el editor SQL de Supabase. Después del 5/10 es
   imprescindible: sin ella, Supabase devuelve las vistas vacías y la
   sincronización no puede publicar.
2. Registrar la aprobación (commit y huellas en `estado.json`, paso 2 de
   `docs/OPERACION-LANZAMIENTO.md`). La compuerta lo pide porque cambia
   `rwadar-site`, `sincronizar.js` y `contrato-catalogo.js`.
3. `--preview`, comprobar, y `--produccion`.
4. App: entra en la próxima compilación (no hay OTA).

---

## 1 de octubre de 2026 · Claude

**Rama:** `claude/magical-hamilton-aiddjs`, creada encima de
`codex/relanzamiento-publico` (último commit de Codex: `59ecbe3`). No toca nada
de producción: ni web publicada, ni Supabase, ni EAS.

### Qué he hecho

| Commit | Qué cambia | Qué tienes que saber |
|---|---|---|
| `fix(movil): parchea … uuidv5 en iOS` | `rwadar-movil/scripts/parchear-expo-uuidv5.cjs` + `postinstall` en `rwadar-movil/package.json` + `.easignore` + paso en `ci.yml` | Corrige el fallo de expo-modules-core (copiaba 20 bytes en un UUID de 16; sigue sin corregir en Expo 58.0.10). Se aplica solo en cada `npm install` o `npm ci`, también en EAS. **Si actualizas Expo** y el script se para, lee su mensaje: o el archivo cambió y hay que revisar, o Expo ya lo arregló y se puede borrar el script. Instalar con `--ignore-scripts` no aplica el parche: ejecuta luego `npm --prefix rwadar-movil run postinstall`. |
| `feat(datos): copia de seguridad cifrada diaria` | `.github/workflows/copia-seguridad.yml`, `rwadar-app/copia-seguridad.sh`, `docs/COPIAS-DE-SEGURIDAD.md` | `pg_dump` de `auth`, `public` y `rwadar_catalogo`, cifrado con gpg y comprobado. Necesita los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` y estar en `main`. **Antes de actualizar Postgres, una copia comprobada.** |
| `docs: pruebas de ataque … y tarea del catálogo` | `docs/seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`, `docs/tareas/CODEX-catalogo-no-desaparece.md` | Todos los ataques probados en local están bloqueados. La tarea del catálogo es **tuya** (ver abajo). |
| `docs: documentación en lenguaje llano …` | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/INTERNO.md`, `docs/RUNBOOK.md`, `docs/LEEME.md` nuevo | Ya no dicen que RWAdar está apagado. Las versiones anteriores están en `docs/archive/2026-09/`. Los informes con fecha **no se han movido**: los cita `rwadar-app/data/relanzamiento/estado.json`. En `CATALOGO-V2-2026-09-30.md` cambié «API35, run…» por «API 35, ejecución…» porque gitleaks lo confundía con una clave. |

### Autoría de commits (importante)

Desde ahora **firma como Codex**: lo tienes en `AGENTS.md` → «Autoría de los
commits». Los commits del 28 al 30 de septiembre salieron como «Claude» porque
la carpeta local tenía ese nombre configurado desde agosto. No cambies el
`git config` de la carpeta: usa `git -c user.name=… -c user.email=…` en cada
commit.

### Pruebas que he pasado

- Web: `npm run test:web` → 341/341.
- Base de datos: las 26 baterías de `npm --prefix rwadar-app test`, todas en
  verde.
- App: `npm --prefix rwadar-movil test` → 89/89 (5 nuevas del parche).
- Compuerta: `npm --prefix rwadar-app run auditar:relanzamiento` → «LISTO PARA
  CORTE FINAL» (los cambios de hoy no tocan rutas aprobadas).
- gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` → 0 hallazgos en archivos
  versionados.

### Pendiente para Codex

1. **[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md)**:
   que el catálogo caducado se siga viendo con aviso y sin cifras vencidas.
   Urgente: el lote vence al terminar el 5 de octubre.
2. Al siguiente build de iOS: comprobar en el simulador que la app abre y
   funciona con el parche de Expo.

### Pendiente para Víctor

1. Renovar el catálogo antes del 5 de octubre (o que Codex termine la tarea 1
   y la publique antes).
2. Crear los dos secretos de la copia en GitHub y lanzar la primera copia
   (`docs/COPIAS-DE-SEGURIDAD.md`, parte 1).
3. ~~Unir esta rama a `main`.~~ Hecho el 1 de octubre: `main` incluye todo.
4. En la carpeta local, una vez: `git config user.name "Victor Jorques"` y tu
   correo de GitHub.
5. Si quieres que Claude revise la web real: permitir en la red del entorno
   `rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`.
