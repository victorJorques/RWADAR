# RWAdar · cómo trabajar sin romper nada

Guía práctica para el día a día. El estado del proyecto está en
[`INTERNO.md`](INTERNO.md) y cómo se publica, en
[`OPERACION-LANZAMIENTO.md`](OPERACION-LANZAMIENTO.md).

La versión anterior de este documento, con la lista completa del
relanzamiento del 21–30 de septiembre, está en
[`archive/2026-09/RUNBOOK-2026-09-30.md`](archive/2026-09/RUNBOOK-2026-09-30.md).

---

## La rutina, en cinco pasos

1. Mira en qué rama estás y si hay cambios sin guardar:

   ```powershell
   git status --short --branch
   ```

2. Busca antes de leer: `rg -n "texto" ruta`. No abras enteros los
   históricos, las imágenes ni los archivos generados.
3. Reconstruye la web sin consultar Supabase:

   ```powershell
   node rwadar-publicar.js --local --sin-sincronizar
   ```

4. Ábrela solo en tu ordenador:

   ```powershell
   node rwadar-servir.js
   ```

   y entra en `http://localhost:4173`. Desde esa dirección la web entra en
   **modo local seguro**: no habla con Supabase y las cuentas quedan apagadas.
   Otros servidores o copias no tienen esa protección.
5. Pasa la prueba de lo que has tocado (tabla de abajo) y vuelve a mirar
   `git status`.

---

## Qué comandos son seguros y cuáles no

### 🟢 Solo en tu ordenador: úsalos sin miedo

```powershell
npm --prefix rwadar-app test
npm --prefix rwadar-movil test
node rwadar-app/probar-escaparate-local.mjs
node rwadar-qr/comprobar-qr.js
node rwadar-publicar.js --local --sin-sincronizar
```

`npm test` también es local, pero regenera la web y puede cambiar el
pre-renderizado. Compara `git status` antes y después.

### 🟡 Leen de internet y cambian archivos locales

Necesitan red y un motivo:

```powershell
node rwadar-publicar.js --local
node rwadar-app/sincronizar.js
node rwadar-app/volcar-seed.js
node rwadar-capturar-portadas.mjs
```

No escriben en el servidor, pero pueden traer cambios grandes de datos o
imágenes. Revisa el diff.

### 🔴 Cambian algo fuera: solo con permiso expreso de Víctor

- `rwadar-publicar.js --preview` o `--produccion`;
- cualquier `wrangler pages deploy` o `netlify deploy`;
- los scripts `.cmd` de `rwadar-app/`;
- los smokes con `RWADAR_SMOKE_MUTANTE=SI` o `RWADAR_MOVIL_SMOKE_MUTANTE=SI`;
- SQL contra el Supabase en línea;
- `eas update`, `eas build` o `eas submit`;
- cambiar la visibilidad del repositorio, borrar hosting o rotar credenciales.

`--sin-sincronizar` solo se admite con `--local`. Preview y producción siempre
sincronizan con Supabase y se paran si esa lectura deja cambios en Git.

---

## Qué prueba pasar según lo que toques

| Si cambias… | Ejecuta |
|---|---|
| Base de datos o esquema | `npm --prefix rwadar-app test` |
| App móvil | `npm --prefix rwadar-movil test` |
| Código QR | `node rwadar-qr/comprobar-qr.js` |
| Web o publicador | `node rwadar-publicar.js --local --sin-sincronizar` y `node probar-web.mjs` |
| Lecciones de la Academy | `node rwadar-academy.js` y después `npm run test:web` y `npm run test:mobile` |
| Imágenes de las ofertas | `node rwadar-editorial-source/ofertas/generar.mjs` (ver su `README.md`) y `npm test` |
| Imagen para redes (`og.png`) | `node rwadar-editorial-source/og.mjs` y `npm run test:web` |
| Compuerta de publicación | `npm --prefix rwadar-app run test:relanzamiento` y `npm --prefix rwadar-app run auditar:relanzamiento` |
| Varias cosas a la vez | `npm test` |

Que algo pase en local (PGlite, simulaciones o navegador) **no demuestra** que
funcione en producción: permisos reales, Auth, correo, push, hosting o
móviles de verdad se comprueban aparte.

---

## Datos y secretos

- La clave publicable de Supabase va en el código del cliente; no la copies a
  la documentación. Su poder depende de los permisos de la base.
- Tokens administrativos, `service_role`, credenciales de proveedores y
  archivos de firma **nunca** entran en Git.
- Hubo un token personal de Supabase en un commit antiguo; Víctor confirmó que
  está revocado. No lo busques ni lo pruebes. Qué hacer si pasa otra vez:
  [`seguridad/RUNBOOK-REVOCACION-ROTACION.md`](seguridad/RUNBOOK-REVOCACION-ROTACION.md).
- El `.gitignore` es una **lista blanca**, porque la carpeta raíz es
  `Downloads` y tiene documentos personales. No la conviertas en lista negra
  ni uses `git add -f` para saltártela.
- Antes de cada commit: `git diff --check`, `git diff --cached` y un escaneo
  de secretos proporcional al cambio.

---

## Copias y recuperación

- **Copia de la base:** automática cada noche cuando esté activada. Ver
  [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md).
- **Código:** sube ramas normales a GitHub, sin `--force`. Comprueba que el
  repositorio sigue en `PRIVATE`.
- Lo generado se reconstruye. Las fuentes, migraciones, portadas editoriales,
  la página de limpieza y la documentación sí tienen que estar en Git.
- Para recuperar una decisión antigua, usa el historial de Git y
  `docs/archive/`.

---

## Catálogo

El catálogo se carga en Supabase con los importadores, nunca a mano en la web.
Guía: [`comercial/RUNBOOK-CATALOGO-SUPABASE.md`](comercial/RUNBOOK-CATALOGO-SUPABASE.md).
Cada revisión dura como mucho 7 días: renuévala antes de que venza.

**Renovarla con una sola orden** (lee de internet y escribe archivos locales;
no toca Supabase ni publica):

```powershell
npm run catalogo
```

Vuelve a leer las fuentes del radar y todas las fichas, comprueba que cada
fuente sigue diciendo lo que respalda (`rwadar-app/data/comprobaciones-fuentes.json`),
pone al día cada ficha con lo leído ese día (una cifra que no se puede leer se
quita y la ficha lleva aviso), monta el lote, lo prueba en PGlite y deja un
informe en `rwadar-app/data/verificaciones/<etiqueta>-v2/informe-<etiqueta>.md`.
La etiqueta es la fecha o, si ese día ya hubo otra entrega, `AAAA-MM-DD.2`, `.3`…
(se puede actualizar las veces que haga falta). Si una fuente del radar falla,
se para sin montar nada y dice cuál revisar a mano. Las fichas sin regla
automática se marcan para revisarlas a mano. Tras la revisión independiente,
la entrega se une a `main` y se aplica con el flujo «Aplicar catálogo»
(etiqueta de la entrega); después se publica la web con «Publicar web».
Desde un ordenador en España se leen más fuentes que desde la nube (Midas
bloquea las consultas automáticas desde fuera).

**Siempre disponible.** Si la revisión vence o no se puede comprobar, la web y
la app siguen enseñando la última copia completa con un aviso de «revisión
pendiente» y sin cifras caducadas. Una revisión incompleta, futura o retirada
nunca se publica, y nunca se vuelve a una anterior.

### Retirar el catálogo (solo por orden de Víctor)

En el editor SQL de Supabase:

```sql
update public.catalogo_publicacion
   set retirado = true, motivo = 'Explica aquí el motivo', actualizado_el = now()
 where unica;
```

Para volver a mostrarlo:

```sql
update public.catalogo_publicacion
   set retirado = false, motivo = null, actualizado_el = now()
 where unica;
```

Retirar la revisión publicada (estado `retirada`) activa la orden sola, y
aprobar una revisión nueva la desactiva. Las webs ya abiertas lo notan en su
siguiente consulta (como mucho, un minuto después de volver a la pestaña).

---

## RWAdar Academy

Las lecciones viven en `rwadar-academy/lecciones/` (Markdown, tal como las
entrega el equipo editorial) y salen en la web (`/academy/`) y en la app.
**No se editan las páginas de `rwadar-site/academy/` a mano:** se cambia la
lección y se ejecuta `node rwadar-academy.js`. Qué se publica, adónde lleva
cada botón y el aviso legal común están explicados en
[`../rwadar-academy/LEEME.md`](../rwadar-academy/LEEME.md).

El publicador se niega a construir si la Academy no está al día con sus
lecciones o si una lección publicada no está en la lista cerrada
`PAGINAS_ACADEMY` de `rwadar-publicacion-segura.js`.

## Avisos a registrados

Plan, activación y textos:
[`tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
Revisión legal: [`legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`](legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md).
Condiciones antes de encender el envío para todos (`activar-push`):
[`legal/ANEXO-NOTIFICACIONES-2026-11-12.md`](legal/ANEXO-NOTIFICACIONES-2026-11-12.md), apartado 4.
Contratos de encargo: [`legal/encargados/README.md`](legal/encargados/README.md).

**Notificaciones web (migración 33).** Las envía Supabase: `procesar()`, cada
5 minutos con el push encendido, pide por pg_net cada envío a
`/api/interno/webpush` de la web (Cloudflare), que lo cifra, lo firma y lo
entrega. GitHub ya no envía a todos; «Notificaciones web» solo hace la
prueba de administración. Orden de puesta en marcha, cada paso con orden de
Víctor:

1. «Avisos a registrados (base)» › `ensayo-33` y `aplicar-33`.
2. Sello y «Publicar web» con el punto nuevo (preview, comprobar,
   producción). En la preview, un GET a `/api/interno/webpush` da 405 y un
   POST sin claves, 403.
3. `prueba-webpush`: debe decir al menos una «aceptada» y llegar «Prueba de
   RWAdar» al iPhone de Víctor.
4. `activar-push`, solo con las condiciones del anexo cumplidas.

Con el push apagado, 1 y 2 pueden ir en cualquier orden (no sale nada), pero
los dos antes de 3 y 4: sin el punto nuevo, cada envío acaba fallido.

Si se apaga el push con envíos en vuelo, encenderlo antes de 6 horas (lo que
pg_net guarda las respuestas) o aceptar algún duplicado. Cada notificación es
una petición a Pages Functions (tandas de 50 cada 5 minutos): suma al cupo
gratuito de 100.000 al día de toda la web; vigilarlo antes de subir la tanda.

- **La base se toca solo desde GitHub**, con el flujo «Avisos a registrados
  (base)» (`.github/workflows/avisos-base.yml`), y cada acción con orden
  expresa de Víctor. Antes de aplicar o activar nada, `ensayo-30` (aplica y
  deshace) y `verificar-30` (solo lee). Las acciones que cambian la base piden
  escribir `AVISOS` y hacen una copia cifrada antes. Para el correo, además:
  `ensayo-31` y `aplicar-31` (la 31: el correo sale por Lettermint) y
  `guardar-correo` (copia al Vault el secreto de GitHub
  `LETTERMINT_API_TOKEN` y guarda el remitente; desde el 08/11 lo normal es
  `crear-token-base` de «Dominio de correo», que guarda el token en el Vault
  sin pasar por GitHub: ver «Encender el correo», abajo). **Si se reaplica la 30, hay
  que reaplicar la 31:** la 30 devuelve el envío al código de Brevo.
- **Bajas que llegan por correo** (LSSI art. 22.1: basta con pedirlo al
  remitente). Mientras salgan avisos:
  1. Antes de cada envío —y cada día si `ofertas_automaticas` está encendido—
     revisa rwadares@gmail.com (es también la dirección de respuesta de los
     avisos). Si nadie lo puede revisar a diario, `ofertas_automaticas` se
     queda apagado.
  2. Cada baja se aplica antes del siguiente envío, en Supabase › SQL Editor:
     `select rwadar_novedades.baja_por_correo('correo@de.la.persona');`
     (devuelve `true` si encontró la cuenta; deja la baja en el historial).
  3. Responde «Hecho: ya no recibirás avisos de RWAdar» y anota la fecha.
  El asunto puede ser «baja» o «Baja de los avisos de RWAdar»: valen los dos.

  **Bajas guardadas en Lettermint.** Su ruta de difusión (la de los
  anuncios) añade su propio enlace de baja y guarda las bajas en su lista.
  Mientras su soporte no lo quite, la regla es la misma que para el buzón:
  antes de cada anuncio y, si `ofertas_automaticas` está encendido, cada día
  (el anuncio automático sale minutos después de aprobar el catálogo), mira
  esa lista en el panel de Lettermint y aplica cada dirección nueva con la
  misma `baja_por_correo`. Si nadie puede revisarla a diario,
  `ofertas_automaticas` se queda apagado hasta que el soporte quite su enlace.
  Aplicarla no es opcional: una baja dada solo en Lettermint deja la cuenta
  apuntada en RWAdar y le siguen llegando los push de novedades;
  `baja_por_correo` corta los dos.
- **Correo: Lettermint** (Países Bajos, UE). Brevo quedó descartado: mete un
  píxel de apertura también en los correos de servicio (revisión legal,
  §4.10, y su anexo del 06/11/2026). Lettermint no sigue aperturas ni clics si
  no se pide, y cada petición de RWAdar lo desactiva expresamente. Aun así,
  **no se enciende** sin la prueba real a un buzón propio: en el original del
  mensaje, ningún píxel ni enlaces reescritos.

  **Encender el correo, en orden** (detalle en el contrato, «Activación»,
  paso 5; cada paso que toca Supabase, con orden de Víctor):
  1. Comprar el dominio: recomendado `rwadar.app` en Cloudflare (la web ya
     está allí). `rwadar.com` y `rwadar.io` los tiene un tercero a la venta;
     `rwadar.es` parece libre, pero Cloudflare no vende `.es`.
  2. Crear la cuenta y un proyecto en Lettermint. Con eso se acepta su
     contrato de encargo: apuntar la fecha en `legal/encargados/README.md`.
  3. Añadir el dominio en Lettermint (Domains › Add domain, asociado al
     proyecto «RWAdar») y copiar sus registros DNS en Cloudflare ›
     `rwadar.app` › DNS: lo hace a mano la sesión de Claude del PC de Víctor,
     con su Chrome, mientras él mira (no hay clave de Cloudflare: decisión
     del 08/11/2026). Los CNAME en «DNS only»; si ya hay un SPF en la raíz,
     se fusiona, nunca un segundo SPF. Después, flujo «Dominio de correo» ›
     `verificar-dominio` hasta que salga verificado (`estado` enseña cómo va
     cada registro). `preparar-dominio` solo sirve si algún día existe
     `CLOUDFLARE_DNS_TOKEN`; sin él, para sin hacer nada.
  4. Las dos claves de Víctor, como secretos de GitHub:
     `LETTERMINT_GESTION_TOKEN` y `SUPABASE_ACCESS_TOKEN` (permisos y
     caducidad: `tareas/PLAN-CEO-2026-11-06.md`, «Claves que da Víctor»).
  5. Subir en un PR la CA de Supabase como
     `rwadar-app/certificados/supabase-ca.crt` (Project Settings › Database ›
     SSL Configuration › Download certificate; es pública). Sin ella,
     `crear-token-base` no crea nada.
  6. «Dominio de correo» › `ajustar-rutas` (seguimiento apagado; prueba a
     quitar el enlace de baja de Lettermint, que en el plan gratis lo
     rechazan: sus bajas se aplican a mano, arriba, o con `sincronizar-bajas`
     de «Correo Lettermint», que usa su propio `LETTERMINT_TEAM_TOKEN` de solo
     `read:suppressions`). Escribir al soporte para que lo quiten es opcional.
  7. «Dominio de correo» › `crear-token-base`, con el remitente
     `avisos@<dominio>`. Crea el token de proyecto «RWAdar base (API)» y lo
     guarda **directamente** en el Vault con
     `db/31_correo_lettermint_guardar.sql`; nadie lo ve ni lo copia. Si ya
     hay uno, no crea otro sin `rotar` = `SI`. (La 31 ya está aplicada desde
     el 06/11; si se reaplica, «Avisos a registrados (base)» › `ensayo-31` y
     `aplicar-31`.) **Alternativa**, solo si estos flujos no se pueden usar:
     crear el token a mano, guardarlo como secreto `LETTERMINT_API_TOKEN` y
     lanzar `guardar-correo` de «Avisos a registrados (base)». No mezclar los
     dos caminos: un token puesto a mano, `crear-token-base` no lo sabe
     borrar al rotar (lo dice y hay que borrarlo en el panel).
  8. Pasar los correos de Auth (confirmación y recuperación) a Lettermint,
     con el flujo «Supabase (gestión de Auth)» y en este orden (detalle en el
     contrato, punto 5.8):
     1. `plantillas`: pone las dos de `rwadar-app/plantillas-auth/`, con la
        dirección postal en el pie (Lettermint la pide en cada correo), y
        guarda antes las de ahora como artefacto (vuelta atrás);
     2. dejar al día la privacidad (§6 y §8: Lettermint en vez de Gmail para
        estos correos) y la «Información básica», y publicarlas **antes** de
        cambiar el SMTP (`smtp-lettermint` lo comprueba y, si no, para);
     3. `smtp-lettermint`, con `cuenta_verificada` = `SI` (solo cuando
        Lettermint haya aprobado la verificación de la cuenta), el remitente
        `avisos@<dominio>` y `correo_prueba` = el buzón de Víctor. Crea el
        token «RWAdar Auth (SMTP)», enseña el SMTP de antes (vuelta atrás) y
        pone host `smtp.lettermint.co`, puerto `587` y usuario `lettermint`;
     4. mirar el original del correo de prueba (sin píxel, enlace sin
        reescribir, dirección en el pie). Si Supabase tiene el CAPTCHA
        encendido, la prueba se hace con «¿Has olvidado tu contraseña?» en la
        web;
     5. quitar el Gmail (`rwadares@gmail.com`), que no tiene contrato de
        encargo, y revocar `LETTERMINT_GESTION_TOKEN`.
  9. Si algo de esto falla, el flujo sale en rojo y dice qué hacer. **A mano,
     solo como alternativa**: pegar las plantillas en Supabase ›
     Authentication › Emails › Templates y el SMTP en SMTP Settings, con un
     token de proyecto creado en Lettermint que no se pega en ningún otro
     sitio.
  10. Prueba real a un buzón propio: en el código fuente del correo, ningún
      píxel ni enlaces reescritos; la cabecera `List-Unsubscribe`; y que la
      ruta de difusión se llama `broadcast`.
  11. Solo entonces, `activar-correo`, y la comprobación final con una cuenta
      propia (bienvenida, un solo correo al repetir el envío y la baja). La
      repetición, en los 25 minutos siguientes al primer envío y antes de
      probar la baja; si no, no comprueba nada (contrato, punto 5.11).
