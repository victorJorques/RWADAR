# RWAdar · panel de control

Un panel para controlar la web y la app de RWAdar: encender y apagar, ver si
algo falla, ver las visitas y gestionar las cuentas. Hay dos formas de usarlo:

- **En tu ordenador**, solo para ti (doble clic y listo).
- **Compartido en Cloudflare**, con un enlace que mandas por WhatsApp a Eric y
  Samuel. Cada uno entra con su correo y un código, y tiene los mismos botones
  que tú. El registro apunta quién hace cada cosa.

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

### Las dos claves

Sin claves el panel ya enseña la salud de la web, la app y las descargas. Para
lo demás necesita dos claves, que se guardan en `rwadar-panel/.env.local` (Git
lo ignora; nunca sale de tu ordenador). En **Ajustes › Abrir el archivo de
claves** se abre con el Bloc de notas y vienen los pasos.

| Clave | Para qué | Dónde se saca |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Ver las visitas, los despliegues y apagar/encender la web | dash.cloudflare.com › Mi perfil › API Tokens › Create Custom Token. Permisos: *Account · Cloudflare Pages · Edit* y *Account · Account Analytics · Read* |
| `SUPABASE_SECRET_KEY` | Ver y gestionar las cuentas, retirar el catálogo | Supabase › Project Settings › API Keys › Secret keys (empieza por `sb_secret_`) |

Después de guardar, cierra la ventana negra y vuelve a abrir el panel.

La clave de Supabase es la llave maestra de la base. No la pegues en ningún
chat ni la mandes por correo. Si se escapa, bórrala en Supabase y crea otra.

## Compartirlo con tus socios (enlace por WhatsApp)

Una sola vez:

1. En el archivo de claves, rellena `PANEL_SOCIOS` con los correos que pueden
   entrar, separados por comas (el tuyo también).
2. En `Downloads`, ejecuta `npm.cmd run panel:nube`. Sube el panel a Cloudflare
   como Worker `rwadar-panel` y guarda las claves como secretos del Worker.
   Al terminar dice la dirección (`https://rwadar-panel….workers.dev`).
   Sube **cerrado**: hasta el paso 4 no deja entrar a nadie.
3. En dash.cloudflare.com › Workers & Pages › rwadar-panel › Settings ›
   Domains & Routes, en «workers.dev», pulsa **Enable Cloudflare Access**.
   La ventana enseña dos datos: cópialos al archivo de claves como
   `TEAM_DOMAIN=…` y `POLICY_AUD=…`. En **Manage Cloudflare Access** añade los
   correos de tus socios.
4. Vuelve a ejecutar `npm.cmd run panel:nube`.
5. **Apaga la web una vez desde el panel de tu ordenador** y vuelve a
   encenderla (un minuto). Así la página de mantenimiento queda subida en
   Cloudflare y desde entonces se puede apagar y encender desde el móvil, en
   segundos. Sin ese paso, el panel compartido lo explica y no apaga.

Después, en **Ajustes** del panel aparece el botón **Enviar por WhatsApp**.

Cada vez que cambies una clave o la lista de socios, repite el paso 4. Para
quitar a alguien, sácalo de `PANEL_SOCIOS` y de la política de Access.

Para ver cómo lo verán ellos sin subir nada:

```bash
npm.cmd run panel:nube:demo
```

y abre <http://127.0.0.1:8789/?como=eric> (o `?como=victor`, o
`?correo=alguien@example.com` para ver lo que ve alguien que no está en la lista).

## Qué hay en cada sección

- **Resumen:** el estado general, las cosas que corregir y las cifras de la semana.
- **Interruptores:**
  - **Web.** *Apagar* pone en producción una página de «Estamos haciendo
    mantenimiento» (código 503, que Google entiende como pausa). El enlace
    `/android` sigue llevando al APK. *Encender* vuelve exactamente al
    despliegue que había, sin publicar nada nuevo. Si mientras estaba apagada
    alguien publicó una web nueva, *Encender* no la pisa.
  - **Catálogo.** *Retirar* lo oculta a la vez en la web y en la app (las dos
    leen la orden `catalogo_publicacion.retirado` de Supabase). Pide un motivo.
- **Salud:** doce comprobaciones (portada, cabeceras, páginas clave, enlace
  Android, última versión, base de datos, servicio de cuentas, catálogo visible
  y al día, copia de seguridad nocturna, tareas de GitHub y último despliegue),
  cada una con qué hacer si falla. *Comprobación a fondo* (solo en tu
  ordenador) lanza `.github/comprobar-publicado.mjs`.
- **Tráfico web:** visitas y páginas vistas (24 h, 7 o 30 días), por dónde se
  mueve la gente (secciones), fichas más vistas, de dónde llega, países,
  dispositivos, navegadores y sistemas. Sin bots.
- **App:** descargas del APK por versión. La app no mide aperturas (decisión de
  privacidad) y una descarga no es una instalación.
- **Cuentas:** todas las cuentas (web y app son las mismas), altas por día,
  buscador, filtros y CSV. Por cuenta: *Confirmar* el correo a mano,
  *Bloquear/Desbloquear* y *Borrar* (hay que escribir su correo; borra también
  su perfil, su vigilancia y sus avisos).
- **Registro:** todo lo que se ha cambiado desde el panel, con fecha, quién y
  resultado. En tu ordenador, en `rwadar-panel/datos/registro.jsonl` (fuera de
  Git); en la nube, en Cloudflare KV.

## Seguridad

- **En tu ordenador** solo escucha en `127.0.0.1`. Cada arranque crea una
  contraseña de sesión dentro de la página; sin ella la API no responde, así
  que otra web abierta en el navegador no puede pulsar botones por ti. Rechaza
  también nombres de host ajenos (DNS rebinding).
- **En la nube** la puerta es Cloudflare Access (correo + código). Aun así el
  panel comprueba en cada petición la firma del pase, que sea para este panel,
  que no haya caducado y que el correo esté en `PANEL_SOCIOS`. Si falta algo,
  no abre (falla cerrado). Las direcciones de vista previa están desactivadas.
- Las claves nunca llegan al navegador.
- Lo que no tiene vuelta atrás pide escribir una palabra (APAGAR, RETIRAR o el
  correo de la cuenta) y queda en el registro, salga bien o mal.
- Una acción a la vez: un doble clic no apaga la web dos veces.

## Para quien toque el código

- `lib/` es común a los dos paneles: `api.js` (todas las rutas), Supabase,
  Cloudflare, GitHub, salud e interruptor. No usa nada de Node salvo
  `config.js`, `almacen-archivos.js`, `wrangler.js`, `gh-cli.js` y `a-fondo.js`,
  que solo carga `servidor.js` (el panel del ordenador).
- `nube/` es el Worker: `manejador.mjs` (entrada, Access y sesión),
  `acceso.mjs` (comprobación del pase), `almacen-kv.mjs` y `publicar.mjs` (la
  subida). `nube/generado/` lo crea la subida y Git lo ignora.
- `publico/` es la página (sin librerías; gráficos en SVG), la misma en los dos.
- `mantenimiento/` es lo que se sube al apagar (`index.html` + `_worker.js`).
- `demo/simulador.js` imita Cloudflare, Supabase, GitHub, la web y Access; lo
  usan las demos y las pruebas.
- Pruebas: `npm.cmd run test:panel` (también dentro de `npm test`). Ensayo de
  empaquetado del Worker sin subir: `npm.cmd run panel:nube -- --ensayo`.
- Lo público (dirección de la web, proyecto, clave publicable, versión de
  wrangler) se lee de `rwadar-publicacion-segura.js` y `rwadar-publicar.js`.
  La fecha de compatibilidad del Worker no puede pasar de la que admite esa
  versión de wrangler (4.125.0 llega al 2026-08-27).
