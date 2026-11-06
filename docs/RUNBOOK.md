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
Contratos de encargo: [`legal/encargados/README.md`](legal/encargados/README.md).

- **La base se toca solo desde GitHub**, con el flujo «Avisos a registrados
  (base)» (`.github/workflows/avisos-base.yml`), y cada acción con orden
  expresa de Víctor. Antes de aplicar o activar nada, `ensayo-30` (aplica y
  deshace) y `verificar-30` (solo lee). Las acciones que cambian la base piden
  escribir `AVISOS` y hacen una copia cifrada antes. Para el correo, además:
  `ensayo-31` y `aplicar-31` (la 31: el correo sale por Lettermint) y
  `guardar-correo` (copia al Vault el secreto de GitHub
  `LETTERMINT_API_TOKEN` y guarda el remitente). **Si se reaplica la 30, hay
  que reaplicar la 31:** la 30 devuelve el envío al código de Brevo.
- **Bajas que llegan por correo** (LSSI art. 22.1: basta con pedirlo al
  remitente). Mientras salgan avisos:
  1. Antes de cada envío —y cada día si `ofertas_automaticas` está encendido—
     revisa RWAdar@protonmail.com (es también la dirección de respuesta de los
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
  3. Añadir el dominio en Lettermint y poner sus registros DNS en Cloudflare.
  4. Crear el token del proyecto (sin pegarlo en ningún sitio).
  5. Guardarlo como secreto de GitHub `LETTERMINT_API_TOKEN`.
  6. Flujo «Avisos a registrados (base)»: `ensayo-31` y después `aplicar-31`.
  7. Mismo flujo: `guardar-correo`, con remitente `avisos@<dominio>`.
  8. Pasar los correos de Auth (confirmación y recuperación) a Lettermint,
     en este orden (detalle en el contrato, punto 5.8):
     1. pegar en Supabase › Authentication › Emails › Templates las dos
        plantillas de `rwadar-app/plantillas-auth/`, que llevan la dirección
        postal en el pie (Lettermint la pide en cada correo);
     2. dejar al día la privacidad (§6 y §8: Lettermint en vez de Gmail para
        estos correos) y la «Información básica», y publicarlas **antes** de
        cambiar el SMTP;
     3. en Lettermint, la ruta de servicio con el seguimiento apagado (por
        SMTP no van los `settings` de la API);
     4. Supabase › Authentication › Emails › SMTP Settings: host
        `smtp.lettermint.co`, puerto `587`, usuario `lettermint`, contraseña
        el token, remitente `avisos@<dominio>`;
     5. probar una recuperación de contraseña y mirar el original (sin
        píxel, enlace sin reescribir, dirección en el pie);
     6. quitar el Gmail (`rwadares@gmail.com`), que no tiene contrato de
        encargo.
  9. Pedir al soporte de Lettermint que quite su enlace de baja automático de
     la ruta de difusión (RWAdar tiene su baja). Mientras no lo hagan, sus
     bajas se aplican a mano (arriba).
  10. Prueba real a un buzón propio: en el código fuente del correo, ningún
      píxel ni enlaces reescritos; la cabecera `List-Unsubscribe`; y que la
      ruta de difusión se llama `broadcast`.
  11. Solo entonces, `activar-correo`, y la comprobación final con una cuenta
      propia (bienvenida, un solo correo al repetir el envío y la baja). La
      repetición, en los 25 minutos siguientes al primer envío y antes de
      probar la baja; si no, no comprueba nada (contrato, punto 5.11).
