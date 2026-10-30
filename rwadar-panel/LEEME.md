# RWAdar · panel de control

Un panel para vigilar la web y la app de RWAdar: ver si algo falla, ver las
visitas y el uso de la app, y gestionar las cuentas. No apaga la web: cuando
haga falta, Víctor se lo pide a Claude o a Codex. Hay dos formas de usarlo:

- **En tu ordenador**, solo para ti (doble clic y listo).
- **Compartido en Cloudflare**, con un enlace personal que mandas por WhatsApp
  a Eric y Samuel. Lo abren y ya están dentro: sin cuentas, correos ni códigos.
  Tienen los mismos botones que tú y el registro apunta quién hace cada cosa.

## En tu ordenador

Doble clic en **`rwadar-panel/abrir-panel.cmd`**. Se abre una ventana negra y el
navegador en <http://127.0.0.1:4180>. Mientras la ventana negra siga abierta, el
panel funciona; al cerrarla, se apaga.

También desde la terminal, en la carpeta `Downloads`:

```bash
npm.cmd run panel
```

Para probarlo **sin tocar nada real** (datos inventados, se puede pulsar todo):

```bash
npm.cmd run panel:demo
```

y abre <http://127.0.0.1:4181>.

### Las claves

Sin claves el panel ya enseña la salud de la web, la app y las descargas. Para
lo demás necesita estas claves, que se guardan en `rwadar-panel/.env.local` (Git
lo ignora; nunca sale de tu ordenador). En **Ajustes › Abrir el archivo de
claves** se abre con el Bloc de notas y vienen los pasos.

| Clave | Para qué | Dónde se saca |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Ver las visitas de la web | dash.cloudflare.com › Mi perfil › API Tokens › Create Custom Token. Permiso: *Account · Account Analytics · Read*. Empieza por `cfut_` (la «Global API Key», `cfk_`, no vale) |
| `GITHUB_TOKEN` | Descargas del APK y copia de seguridad en el panel de la nube (desde Cloudflare, GitHub corta las consultas sin clave) | github.com › Settings › Developer settings › Fine-grained tokens: solo los repositorios RWADAR y RWAdar-downloads, *Actions: Read-only* y *Contents: Read-only* |
| `SUPABASE_SECRET_KEY` | Ver y gestionar las cuentas, retirar el catálogo | Supabase › Project Settings › API Keys › Secret keys (empieza por `sb_secret_`) |
| `SUPABASE_ACCESS_TOKEN` | Contar cuántas veces se abre la app y la web cada hora, los correos de las cuentas y el plan de Supabase | Supabase › Account › Access Tokens (empieza por `sbp_`). Si deja elegir permisos, solo lectura de registros, del proyecto y de su configuración de Auth |

Después de guardar, cierra la ventana negra y vuelve a abrir el panel.

La clave de Supabase es la llave maestra de la base. No la pegues en ningún
chat ni la mandes por correo. Si se escapa, bórrala en Supabase y crea otra.

## Compartirlo con tus socios (enlace por WhatsApp)

Cada socio tiene **su propio enlace**. Lo abre una vez y ese móvil queda dentro
90 días, sin cuentas ni contraseñas. Una sola vez:

1. En el archivo de claves, escribe los nombres detrás de `PANEL_SOCIOS`,
   separados por comas: `PANEL_SOCIOS=Víctor,Eric,Samuel`.
2. En `Downloads`, ejecuta `npm.cmd run panel:nube`. Sube el panel a Cloudflare
   como Worker `rwadar-panel`, guarda las claves como secretos del Worker y
   hace un enlace para cada nombre.
3. Abre el panel de tu ordenador › **Ajustes**: hay un botón **Enviar por
   WhatsApp** para cada socio, con su enlace y un mensaje.

**Cada enlace es una llave:** quien lo tenga entra con tus mismos permisos.
Si alguien pierde el móvil o reenvía el mensaje, anula su enlace y mándale otro:

```bash
npm.cmd run panel:nube -- --enlace-nuevo=Eric
```

Para anularlos todos: `npm.cmd run panel:nube -- --enlaces-nuevos`. Para quitar
a alguien, sácalo de `PANEL_SOCIOS` y vuelve a ejecutar `npm.cmd run panel:nube`:
su enlace y su sesión dejan de valer al momento.

Si algún día quieres más seguridad (correo + código), se puede usar Cloudflare
Access: con `TEAM_DOMAIN` y `POLICY_AUD` en el archivo de claves, el panel deja
los enlaces y pide Access (en `PANEL_SOCIOS` van entonces los correos).

Para ver cómo lo verán ellos sin subir nada:

```bash
npm.cmd run panel:nube:demo
```

y abre <http://127.0.0.1:8789/?como=eric> (o `?como=victor`, o `?como=intruso`
para ver qué pasa con un enlace que no vale).

## Qué hay en cada sección

- **Resumen:** el estado general, las cosas que corregir y las cifras de la semana.
- **Interruptores:**
  - **Web.** Solo dice si está encendida. Para apagarla, se pide a Claude o a Codex.
  - **Catálogo.** *Retirar* lo oculta a la vez en la web y en la app (las dos
    leen la orden `catalogo_publicacion.retirado` de Supabase). Pide un motivo.
    Necesita que la base dé a la clave secreta permiso sobre esa tabla; si no
    lo tiene, el panel lo dice en vez de enseñar el botón.
- **Salud:** quince comprobaciones (portada, cabeceras, páginas clave, enlace
  Android, última versión, base de datos, servicio de cuentas, catálogo visible
  y al día, copia de seguridad nocturna, tareas de GitHub, correos de alta y
  contraseña, fechas que caducan, velocidad para la gente y planes gratis),
  cada una con qué hacer si falla. *Comprobación a fondo* (solo en tu
  ordenador) lanza `.github/comprobar-publicado.mjs`.
- **Tráfico web:** visitas y páginas vistas (24 h, 7 o 30 días), por dónde se
  mueve la gente (secciones), fichas más vistas, de dónde llega, países,
  dispositivos, navegadores y sistemas. Sin bots. Y la **velocidad real** de
  la última semana en móvil y en ordenador (lo que tarda en verse lo principal,
  en reaccionar al tocar y si la página salta), con los umbrales de Google; con
  menos de 10 visitas medidas no se pone nota.
- **App:** cuántas veces se abre el catálogo desde la app y desde la web, hora
  a hora en las últimas 24 horas y por día después (se cuenta en los registros
  de Supabase: no hace falta cambiar la app ni se guarda quién es nadie).
  Desde la 1.4.1 (29/10/2026) la web y la app piden el catálogo por la
  pasarela de rwadar.pages.dev (`/api/acceso/catalogo/…`), que llama a
  Supabase sin agente: esas cargas salen como «pasarela (app o web)». Para
  volver a separarlas, la pasarela tendría que reenviar de quién viene;
  descargas del APK por versión y por día. Una descarga no es una instalación.
- **Cuentas:** todas las cuentas (web y app son las mismas), altas por día,
  buscador, filtros y CSV. Por cuenta: *Confirmar* el correo a mano,
  *Bloquear/Desbloquear* y *Borrar* (hay que escribir su correo; borra también
  su perfil, su vigilancia y sus avisos). Arriba, los **correos**: de dónde
  salen, cuántas altas se confirman y cuánto tardan, cuentas que llevan más de
  un día sin confirmar (correo perdido o en spam) y los errores de envío de las
  últimas 24 horas, sin enseñar ninguna dirección.
- **Catálogo y Academy:** lo publicado por categoría, acceso y región, cuántas
  ofertas tiene cada proveedor, plataformas sin ofertas y cuánto hace que se
  verificó cada cosa (aviso a los 60 días). Lecciones de Academy más leídas y
  las que nadie abre, y las fichas «fuera del radar». La web **no mide** qué
  fichas de oferta o plataforma se abren (solo carga la analítica en portada,
  Academy y páginas legales: `assets/analitica-*.js`); si algún día lo hace,
  el panel las cruza solo.
- **Límites y fechas:** lo que caduca (revisión del catálogo, `security.txt`,
  claves de GitHub y Cloudflare del panel) y lo gastado de cada plan gratis:
  Workers y almacén KV de Cloudflare (por día), Supabase (plan, salud, último
  uso: un proyecto gratis se pausa a los 7 días sin uso), minutos de GitHub
  Actions del mes (exactos por trabajo; se apuntan en `minutos-AAAA-MM`) y
  compilaciones de Android en Expo lanzadas desde GitHub (15 al mes).
- **Registro:** todo lo que se ha cambiado desde el panel, con fecha, quién y
  resultado. En tu ordenador, en `rwadar-panel/datos/registro.jsonl` (fuera de
  Git); en la nube, en Cloudflare KV.

## Seguridad

- **En tu ordenador** solo escucha en `127.0.0.1`. Cada arranque crea una
  contraseña de sesión dentro de la página; sin ella la API no responde, así
  que otra web abierta en el navegador no puede pulsar botones por ti. Rechaza
  también nombres de host ajenos (DNS rebinding).
- **En la nube**, con enlaces personales: la llave va detrás de `#`, así que
  no viaja en la vista previa de WhatsApp ni queda en los registros, y la
  página la borra de la barra de direcciones al entrar. Se cambia por una
  cookie firmada (HttpOnly, Secure, SameSite=Strict, 90 días). En Cloudflare
  solo se guarda la huella de cada llave, no la llave. Anular un enlace saca
  a esa persona al momento. Sin enlaces configurados, no abre (falla cerrado).
  Las direcciones de vista previa están desactivadas.
- Las claves nunca llegan al navegador.
- Lo que no tiene vuelta atrás pide escribir una palabra (RETIRAR o el correo
  de la cuenta) y queda en el registro, salga bien o mal.
- Una acción a la vez: un doble clic no hace la misma cosa dos veces.

## Para quien toque el código

- `lib/` es común a los dos paneles: `api.js` (todas las rutas), Supabase,
  Cloudflare, GitHub, salud y estado de la web. No usa nada de Node salvo
  `config.js`, `almacen-archivos.js`, `gh-cli.js` y `a-fondo.js`, que solo carga
  `servidor.js` (el panel del ordenador); `wrangler.js` lo usan la subida y la demo.
- `lib/uso-app.js` cuenta las aperturas del catálogo en los registros de
  Supabase (API de administración, ClickHouse, como mucho 24 h por consulta) y
  `lib/historial-app.js` las apunta por día junto a las descargas.
- `lib/correos.js`, `fechas.js`, `velocidad.js`, `planes.js` y `contenido.js`
  alimentan Cuentas › Correos, Límites y fechas, Tráfico › Velocidad y Catálogo
  y Academy. `api.js` guarda sus resultados un rato (`leidos`) y la salud usa
  esa misma copia. De la configuración de Auth de Supabase solo se leen campos
  que no son secretos (nunca la contraseña del correo).
- En la nube cada visita puede hacer **50 consultas a fuera** como mucho
  (plan gratis de Workers); la salud completa gasta unas 32. Por eso los
  minutos exactos de GitHub se cuentan de 5 en 5 al abrir el panel y de 30
  en 30 en la tarea de cada hora.
- `nube/` es el Worker: `manejador.mjs` (entrada, puerta, sesión y cron de cada
  hora), `acceso.mjs` (enlaces personales o Cloudflare Access), `almacen-kv.mjs`
  y `publicar.mjs` (la subida). `nube/generado/` lo crea la subida y Git lo
  ignora; `datos/nube.json` guarda las llaves de los enlaces (fuera de Git).
- `publico/` es la página (sin librerías; gráficos en SVG), la misma en los dos.
- `demo/simulador.js` imita Cloudflare, Supabase, GitHub, la web y Access; lo
  usan las demos y las pruebas.
- Pruebas: `npm.cmd run test:panel` (también dentro de `npm test`). Ensayo de
  empaquetado del Worker sin subir: `npm.cmd run panel:nube -- --ensayo`.
- Lo público (dirección de la web, proyecto, clave publicable, versión de
  wrangler) se lee de `rwadar-publicacion-segura.js` y `rwadar-publicar.js`.
  La fecha de compatibilidad del Worker no puede pasar de la que admite esa
  versión de wrangler (4.125.0 llega al 2026-08-27).
