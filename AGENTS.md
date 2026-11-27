# RWAdar · instrucciones para agentes (Codex, Claude y otros)

RWAdar está **publicado**: la web en `https://rwadar.pages.dev` y la app de
Android en GitHub (`RWAdar-downloads`). El repositorio es público desde el
21/11/2026 (decisión de Víctor); las claves siguen en los secretos de GitHub y
nunca en Git.

**Antes de empezar, lee en este orden:**

1. [`docs/tareas/PARA-CODEX.md`](docs/tareas/PARA-CODEX.md): lo último que
   hizo la otra herramienta y lo que queda pendiente.
2. [`docs/INTERNO.md`](docs/INTERNO.md): estado del proyecto.
3. Solo la sección de [`docs/RUNBOOK.md`](docs/RUNBOOK.md) que necesites.

Lo de `docs/archive/` es histórico y no describe el estado vigente.

## Qué no se hace sin permiso expreso de Víctor en el turno actual

- Publicar la web (`--preview`, `--produccion`, Wrangler, Netlify).
- Tocar la base en línea: SQL remoto, scripts `.cmd`, smokes con
  `*_MUTANTE=SI`.
- Compilar o publicar la app: `eas build`, `eas update`, `eas submit`.
- Cambiar la visibilidad del repositorio, borrar hosting o rotar credenciales.
- Avisos a registrados (petición de Víctor del 05/11/2026, ver
  [`AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md)):
  aplicar la migración 30 o sus scripts de activación, poner la plantilla de
  Auth, encender `AVISOS_NOVEDADES_REMOTOS`, lanzar el flujo «Avisar novedad»
  o publicar un anuncio retenido. Cada paso, con su orden expresa.
  **Excepción permanente (Víctor, 14/11/2026: «pon las novedades como
  notificación, acuérdate eso siempre»):** cada vez que se publique algo nuevo
  para el usuario (mejoras de la web o la app, o un ciclo del catálogo con
  cambios), se lanza «Avisar novedad» (`anunciar`, tipo `novedad`) sin pedir
  otra orden. **Noticias nuevas del sector (Víctor, 21/11/2026: «Sii vale»):**
  también se avisa cuando una edición de noticias publicada trae alguna noticia
  que no estaba (`noticias-auto.mjs aviso-usuarios` da el título, el texto y el
  enlace), una vez al día como mucho y nunca si solo se volvieron a comprobar.
  **Con gancho (Víctor, 27/11/2026: «escribir con gancho la notificación a la
  gente para que entren a la app y la web»):** título y texto que den ganas de
  abrir el aviso (lo más llamativo y concreto primero, una invitación a
  entrar), sin decir nada que no esté publicado, sin promesas y sin
  «oportunidad», «rentabilidad», «garantiz…» ni %. El texto de
  `aviso-usuarios` es la base de hechos; el titular se reescribe con gancho.
  Modelos (27/11): «Un token de Amazon que no es del todo tuyo. Te lo
  explicamos» y «De Hong Kong a Bermudas: 8 plataformas que no estaban en tu
  radar». Sin invitar a invertir ni dar a entender lo que no está comprobado.

**Investigación del catálogo: se prepara sola y se publica con la orden de
Víctor.** Aplicar el SQL, publicar la web, enviar la OTA y avisar de la
novedad siguen necesitando su orden: **«haz la investigación»** (o pulsar
**Ejecutar**) para un ciclo entero, o **«dale»** para uno ya preparado. Cada
orden corresponde a un solo ciclo. Nada se aplica ni se publica por horario.

**Preparación automática (Víctor, 21/11/2026: «elegimos las dos… y así yo te
doy también la verificación»).** Cada mañana a las 07:33 (España), la tarea
programada «Catálogo automático de RWAdar» mira cuánto le queda al catálogo
publicado (`node .github/vigilante.mjs --solo-web`, solo lectura). Si le quedan
**menos de 72 h**, prepara el ciclo con la skill `investigacion-catalogo` en
**modo preparar**: hasta el PR de la entrega («Catálogo preparado del …
(espera el «dale»)») con la CI en verde. **No une ese ni ningún otro PR, no
lanza «Aplicar catálogo» ni ningún flujo que escriba en Supabase o publique, no
envía la OTA y no avisa a los usuarios.** Después manda a Víctor una
notificación con lo que cambia y espera su «dale»: con él, el ciclo sigue
desde el paso 3 de la skill. El ciclo preparado no es una cola: vale mientras
la guarda del SQL lo deje; si el «dale» llega otro día, se vuelve a pasar el
vigía y se rehacen las noticias de «Hoy», y si algo cambió se re-fecha o se
corrige con su revisión antes de aplicar. Si el último vigilante tiene otras
fallas, la tarea busca la causa sin cambiar nada y se la cuenta a Víctor en
una notificación. Si no hay nada que hacer, termina sin avisar. Cada aviso
dice cuántos agentes y cuánto tiempo gastó, para vigilar el consumo de Claude
Code. Para pararla: desactivar la tarea programada o pedírselo a Claude.
Texto exacto de la tarea:
[`ORDEN-AUTOMATICA.md`](.claude/skills/investigacion-catalogo/ORDEN-AUTOMATICA.md).
Sustituye la pausa del 22/10/2026.

Seguir la investigación profunda, la revisión independiente y las compuertas de
[`CICLO-DIARIO-CATALOGO.md`](docs/tareas/CICLO-DIARIO-CATALOGO.md).
El orden de trabajo para hacerlo entero el mismo día, en paralelo, está en la
skill [`investigacion-catalogo`](.claude/skills/investigacion-catalogo/SKILL.md)
(Claude la carga sola con «haz la investigación»; Codex puede seguirla a mano).

**La orden de Víctor autoriza el ciclo completo** (indicación expresa de Víctor
del 03/11/2026: «que se pueda modificar en cualquier momento; las ofertas no
esperan» y «modifica esto»). La orden de Víctor de investigar o actualizar el
catálogo es, para ese ciclo, el permiso expreso para aplicar el SQL revisado
con el flujo de GitHub «Aplicar catálogo», publicar la web con «Publicar web»
(preview y después producción) y enviar la OTA con «OTA Android», si pasan las
pruebas, el ensayo en PGlite, la revisión independiente y el sello. Un fallo
detiene el ciclo en ese paso. Se puede entregar el catálogo varias veces el
mismo día (`AAAA-MM-DD`, después `AAAA-MM-DD.2`, `.3`…). No incluye cuentas,
comunidad, Auth, RLS/ACL, funciones, migraciones de esquema, credenciales,
correos, pagos, `eas build`/`eas submit`, tiendas, visibilidad ni otras
operaciones. Con la migración 30 aplicada, aprobar un catálogo con ofertas
nuevas solo deja un anuncio **retenido** (no se envía ni se ve) mientras
`ofertas_automaticas` siga apagado; publicarlo es otra orden de Víctor.
Cada candidata se admite y publica tras las compuertas y con autorización, o no
se admite ni publica ese día; no se mantiene una cola ni un estado público
«en investigación». En el siguiente ciclo se consultan de nuevo las fuentes,
sin arrastrar aprobaciones. El catálogo completo ya publicado se conserva.
Las tareas automáticas son la preparación del catálogo (arriba) y las noticias
del sector de cada mañana (abajo, apagadas).

**Noticias del sector automáticas (autorización permanente de Víctor del
13/11/2026).** Cada mañana, la tarea programada «Noticias automáticas de
RWAdar» sigue la skill
[`noticias-automaticas`](.claude/skills/noticias-automaticas/SKILL.md) y, sin
pedir permiso cada vez, puede: escribir y verificar las noticias del sector
(un editor y un verificador independientes), abrir su PR, unirlo a `main` con
la CI en verde, sellar ese contenido en el mismo PR y lanzar «Publicar web»
(revisión y producción). Solo si pasan todas las compuertas de la skill (el
freno); si algo falla o hay dudas, no se publica nada y se avisa a Víctor.
A los usuarios solo se les avisa si la edición publicada trae noticias nuevas
(«Avisar novedad» con lo que da `aviso-usuarios`; una vez al día como mucho;
Víctor, 21/11/2026).

El PR de la mañana solo puede cambiar `rwadar-site/datos/noticias-v2.json`,
`rwadar-site/datos/noticias.json`, `rwadar-app/data/noticias-diarias/<fecha>/`
y el sello (`estado.json`: commit, huella y nota; nunca `actualizadoEl`, que
sigue siendo la fecha del último sello revisado por una persona: a los 7 días
sin uno, la mañana se para y avisa). Esta autorización **no** incluye:
investigar o cambiar el catálogo, tocar Supabase (salvo la lectura de
visitante), enviar OTA, compilar la app, otros avisos o notificaciones a
usuarios (solo el de noticias nuevas, de arriba), generar o cambiar fotos, cambiar código, la CI, la skill, la guía de titulares
o esta autorización, ni publicar si el freno paró.

Sigue necesitando la orden de Víctor: encender la tarea, cambiar su hora o su
texto, volver a encenderla tras pausarla, publicar unas noticias que el freno
paró, retirar unas noticias ya publicadas y cualquier cambio en el
procedimiento. Para pausarla sin borrar nada: `"activo": false` en
`.claude/skills/noticias-automaticas/config.json` (cualquier herramienta puede
proponerlo en un PR), desactivar la tarea programada o, solo un día, crear la
rama `claude/cerrojo-ciclo-<AAAA-MM-DD>`. Estado: encendida el 14/11/2026 y
**apagada desde el 18/11/2026** (la tarea programada «Noticias automáticas de
RWAdar» está desactivada); volver a encenderla es decisión de la dirección (ver
[`ORDEN-TAREA.md`](.claude/skills/noticias-automaticas/ORDEN-TAREA.md)).

## Límites de seguridad

- La web y la app en local apuntan al Supabase de producción y pueden escribir
  si se inicia sesión.
- Nada de secretos en Git. No recuperes credenciales de historiales. La clave
  publicable de Supabase va en el cliente, pero no se copia a la documentación.
- `rwadar-site/` es la fuente web. `rwadar-publicado/` y
  `rwadar-generated-source/` se generan y se pueden tirar.
- `rwadar-limpieza/` desinstala la PWA antigua de Netlify: se conserva.
- Los datos del catálogo no se editan en el HTML ni en el JS: la fuente de
  verdad es Supabase. **Ninguna plataforma descartada sin una fuente citable.**
- **El catálogo está siempre disponible para el público** salvo orden expresa
  de Víctor (`public.catalogo_publicacion.retirado`). No vuelvas a vaciar la
  web porque una revisión caduque o no se pueda comprobar: se muestra la última
  copia completa con aviso y sin cifras vencidas.
- Los informes con fecha de `docs/` (`VERIFICACION-…`, `CATALOGO-V2-…`, etc.)
  que cita la compuerta de publicación (`rwadar-app/data/relanzamiento/estado.json`)
  no se borran ni se mueven.

## Autoría de los commits

Cada herramienta firma con **su propio nombre**. Nunca con el de otra.

La carpeta local la comparten Víctor, Codex y Claude, así que no cambies el
`git config` del repositorio: indica tu identidad en cada commit.

**Codex:**

```bash
git -c user.name="Codex" -c user.email="noreply@openai.com" commit
```

y termina el mensaje con:

```
Co-Authored-By: Codex <noreply@openai.com>
```

**Claude:**

```bash
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit
```

con su línea `Co-Authored-By: Claude …` al final.

**Víctor:** su nombre y su correo de GitHub. Para dejarlo fijo en la carpeta
local, una sola vez:

```bash
git config user.name "Victor Jorques"
git config user.email "TU-CORREO-DE-GITHUB"
```

Los commits del 28 al 30 de septiembre de 2026 aparecen firmados como
«Claude», pero los hizo Codex: la carpeta tenía configurado ese nombre desde
agosto.

## Traspaso entre herramientas

Al terminar una sesión con cambios, añade una entrada **arriba del todo** en
[`docs/tareas/PARA-CODEX.md`](docs/tareas/PARA-CODEX.md) con:

- qué cambiaste y en qué commits;
- qué pruebas pasaste;
- qué queda pendiente o qué tiene que hacer Víctor.

Las tareas grandes para la otra herramienta van en su propio archivo dentro de
`docs/tareas/`.

## Forma de trabajar

- Localiza con `rg` antes de leer. No leas enteros los manuales históricos,
  binarios, tipografías en base64 ni archivos generados.
- `git status --short --branch` antes y después de los generadores.
- Las ramas ya unidas se borran con el flujo «Limpiar ramas» (lo lanza
  Víctor; sin BORRAR solo lista; los cerrojos solo con `incluir_cerrojos=si`).
- Pruebas del área que tocas; para cambios transversales, `npm test`. Ninguna
  prueba local demuestra cómo está producción.
- El estado vigente va en `docs/INTERNO.md`, en lenguaje llano y sin hashes ni
  identificadores de ejecuciones. Las pruebas técnicas detalladas, en un
  informe con fecha aparte.
