# RWAdar · instrucciones para agentes (Codex, Claude y otros)

RWAdar está **publicado**: la web en `https://rwadar.pages.dev` y la app de
Android en GitHub (`RWAdar-downloads`). El repositorio es privado.

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

**Investigación del catálogo: inicio manual.** Por indicación de Víctor del
22/10/2026, la tarea queda preparada y **PAUSADA**. Sólo se inicia cuando Víctor
pulsa **Ejecutar** o pide **«haz la investigación»**. No se ejecuta por horario
ni existe autorización recurrente para iniciar investigaciones, aplicar SQL o
publicar por cuenta propia. Cada inicio manual corresponde a un solo ciclo;
no reactiva la programación ni autoriza futuras ejecuciones.
Esta indicación sustituye el modo automático anterior descrito en los informes
y traspasos fechados del 22/10.

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
«en investigación». En otro inicio manual se consultan de nuevo las fuentes,
sin arrastrar aprobaciones. El catálogo completo ya publicado se conserva.
La única excepción a «inicio manual» son las noticias del sector de cada
mañana (abajo).

**Noticias del sector automáticas (autorización permanente de Víctor del
13/11/2026).** Cada mañana, la tarea programada «Noticias automáticas de
RWAdar» sigue la skill
[`noticias-automaticas`](.claude/skills/noticias-automaticas/SKILL.md) y, sin
pedir permiso cada vez, puede: escribir y verificar las noticias del sector
(un editor y un verificador independientes), abrir su PR, unirlo a `main` con
la CI en verde, sellar ese contenido en el mismo PR y lanzar «Publicar web»
(revisión y producción). Solo si pasan todas las compuertas de la skill (el
freno); si algo falla o hay dudas, no se publica nada y se avisa a Víctor.
Nunca se avisa a los usuarios.

El PR de la mañana solo puede cambiar `rwadar-site/datos/noticias-v2.json`,
`rwadar-site/datos/noticias.json`, `rwadar-app/data/noticias-diarias/<fecha>/`
y el sello (`estado.json`: commit, huella y nota; nunca `actualizadoEl`, que
sigue siendo la fecha del último sello revisado por una persona: a los 7 días
sin uno, la mañana se para y avisa). Esta autorización **no** incluye:
investigar o cambiar el catálogo, tocar Supabase (salvo la lectura de
visitante), enviar OTA, compilar la app, avisos o notificaciones a usuarios,
generar o cambiar fotos, cambiar código, la CI, la skill, la guía de titulares
o esta autorización, ni publicar si el freno paró.

Sigue necesitando la orden de Víctor: encender la tarea, cambiar su hora o su
texto, volver a encenderla tras pausarla, publicar unas noticias que el freno
paró, retirar unas noticias ya publicadas y cualquier cambio en el
procedimiento. Para pausarla sin borrar nada: `"activo": false` en
`.claude/skills/noticias-automaticas/config.json` (cualquier herramienta puede
proponerlo en un PR), desactivar la tarea programada o, solo un día, crear la
rama `claude/cerrojo-ciclo-<AAAA-MM-DD>`. Estado: preparada y **SIN
ENCENDER** (ver [`ORDEN-TAREA.md`](.claude/skills/noticias-automaticas/ORDEN-TAREA.md)).

## Límites de seguridad

- La web y la app en local apuntan al Supabase de producción y pueden escribir
  si se inicia sesión.
- Nada de secretos en Git. No recuperes credenciales de historiales. La clave
  publicable de Supabase va en el cliente, pero no se copia a la documentación.
- `rwadar-site/` es la fuente web. `rwadar-publicado/` y
  `rwadar-generated-source/` se generan y se pueden tirar.
- `rwadar-version-codex/` es una copia histórica: no se edita.
- `rwadar-limpieza/` desinstala la PWA antigua de Netlify: se conserva.
- Los datos del catálogo no se editan en el HTML ni en el JS: la fuente de
  verdad es Supabase. **Ninguna plataforma descartada sin una fuente citable.**
- **El catálogo está siempre disponible para el público** salvo orden expresa
  de Víctor (`public.catalogo_publicacion.retirado`). No vuelvas a vaciar la
  web porque una revisión caduque o no se pueda comprobar: se muestra la última
  copia completa con aviso y sin cifras vencidas.
- Los informes con fecha de `docs/` (`VERIFICACION-…`, `CATALOGO-V2-…`, etc.)
  los cita la compuerta de publicación: no se borran ni se mueven.

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
- Pruebas del área que tocas; para cambios transversales, `npm test`. Ninguna
  prueba local demuestra cómo está producción.
- El estado vigente va en `docs/INTERNO.md`, en lenguaje llano y sin hashes ni
  identificadores de ejecuciones. Las pruebas técnicas detalladas, en un
  informe con fecha aparte.
