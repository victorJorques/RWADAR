# RWAdar · runbook privado

> Corte autorizado del 27/09/2026: la secuencia vigente de publicación está en
> `OPERACION-LANZAMIENTO.md` y el estado en `INTERNO.md`. Migraciones24y25 ya
> aplicadas; no repetirlas como instalación inicial. Los ejemplos mutantes de
> cuentas y push no forman parte de la edición editorial y no deben ejecutarse.

Este runbook separa trabajo local, acceso de red y mutaciones externas. El
estado y las decisiones están en `INTERNO.md`.

## Rutina diaria de menor riesgo

1. Confirma la rama y el árbol:

   ```powershell
   git status --short --branch
   ```

2. Localiza antes de leer: `rg -n "texto" ruta`. Evita escanear históricos,
   imágenes o generados.
3. Para reconstruir sin consultar Supabase:

   ```powershell
   node rwadar-publicar.js --local --sin-sincronizar
   ```

4. Sirve únicamente en este ordenador:

   ```powershell
   node rwadar-servir.js
   ```

   Abre `http://localhost:4173`. En ese origen exacto la revisión carga el
   escaparate compartido y la CSP solo permite conexiones al propio servidor;
   cuentas, opiniones y seguimiento remoto quedan desactivados. Esto no hace
   seguros otros servidores ni una copia con `MODO_LOCAL` retirado.
5. Ejecuta la prueba más cercana al cambio y revisa de nuevo `git status`.

## Comandos por nivel de riesgo

### Locales, sin escritura remota

```powershell
npm --prefix rwadar-app test
npm --prefix rwadar-movil test
node rwadar-app/probar-escaparate-local.mjs
node rwadar-qr/comprobar-qr.js
node rwadar-publicar.js --local --sin-sincronizar
```

`npm test` también es local, pero regenera el artefacto y puede actualizar el
pre-render. Úsalo para cambios transversales y compara el árbol antes/después.

### Lectura remota con cambios locales

Estos comandos consultan Supabase o fuentes externas y escriben archivos
locales. Requieren red y una razón concreta:

```powershell
node rwadar-publicar.js --local
node rwadar-app/sincronizar.js
node rwadar-app/volcar-seed.js
node rwadar-capturar-portadas.mjs
```

Revisa el diff: una lectura remota puede producir un cambio grande de datos o
activos aunque no haya escrito en el servidor.

### Mutación externa o publicación

No ejecutar sin autorización explícita del usuario en el turno actual:

- `rwadar-publicar.js --preview` o `--produccion`;
- cualquier `wrangler pages deploy` o `netlify deploy`;
- los scripts `.cmd` de `rwadar-app/`;
- smokes con `RWADAR_SMOKE_MUTANTE=SI` o `RWADAR_MOVIL_SMOKE_MUTANTE=SI`;
- SQL contra un proyecto Supabase enlazado;
- `eas update`, `eas build` o `eas submit`;
- cambios de visibilidad, borrado de hosting o rotación de credenciales.

El publicador incorpora además un bloqueo de modo privado. Retirar ese bloqueo
es un cambio de producto revisable, no un paso rutinario del runbook.
`--sin-sincronizar` se admite únicamente con `--local`: preview y producción
siempre sincronizan y se detienen si esa lectura deja cambios en Git.

## Pruebas

| Cambio | Verificación mínima |
|---|---|
| Backend/esquema | `npm --prefix rwadar-app test` |
| App móvil | `npm --prefix rwadar-movil test` |
| QR | `node rwadar-qr/comprobar-qr.js` |
| Web o publicador | `node rwadar-publicar.js --local --sin-sincronizar` y `node probar-web.mjs` |
| Compuerta de relanzamiento | `npm --prefix rwadar-app run test:relanzamiento` y `npm --prefix rwadar-app run auditar:relanzamiento` |
| Transversal | `npm test` |

Los smokes remotos son otra categoría. Ser verde en PGlite, mocks o navegador
local no prueba RLS, Auth, correo, push, hosting ni dispositivos reales.

## Datos y secretos

- No copies la clave publicable a documentación. El código cliente la necesita,
  pero su poder depende de RLS y debe rotarse si queda obsoleta.
- Tokens administrativos, `service_role`, credenciales de proveedor y ficheros
  de firma nunca entran en Git.
- Hay un P0 histórico abierto por un token personal de Supabase en un commit
  antiguo. No leas ni pruebes el valor. Sigue
  `seguridad/RUNBOOK-REVOCACION-ROTACION.md`; revocación, rotación o reescritura
  de Git requieren autorización y evidencia separadas.
- La `.gitignore` es una lista blanca porque la raíz está en `Downloads`.
  No la conviertas en lista negra y no uses `git add -f` para saltártela.
- Antes de confirmar: `git diff --check`, `git diff --cached` y un escaneo de
  secretos proporcional al cambio.

## Copia privada y recuperación

1. Confirma que GitHub informa `PRIVATE`; no basta el campo `private` de npm.
2. Empuja una rama normal, sin `--force`.
3. Conserva `main` como punto histórico del apagado hasta revisar el merge.
4. Los artefactos generados se reconstruyen; las fuentes, migraciones,
   maestros editoriales, limpieza y documentación sí deben estar versionados.
5. Para recuperar una decisión antigua, usa Git y `docs/archive/2026-08/`; no
   vuelvas a escanear transcripciones de sesiones salvo que falte evidencia.

## Relanzamiento solicitado el 21 de septiembre de 2026

El usuario ha autorizado preparar y realizar un relanzamiento público, pero la
autorización no permite afirmar vigencia sin verificarla ni publicar material
sin derechos. `MODO_PRIVADO` permanece activo hasta que una revisión deje todos
estos puntos cerrados:

1. fijar titular jurídico y fiscal, responsables, domicilio y contacto;
2. aprobar aviso legal, condiciones, privacidad, riesgos, metodología y
   transparencia comercial sin contradicciones;
3. documentar derechos de materiales; exigir acuerdos y circuito de cobro solo
   al alcance monetizado que los necesite, no a la beta editorial gratuita;
4. revalidar cada oferta desde su fuente primaria y hacer fallar cerrado todo
   dato rancio, sin fuente o sin permiso de imagen;
5. revisar el alcance elegido. `editorial-gratuito` exige anuncios, atribución,
   comisiones y cobros apagados. Publicidad en app es el ingreso inicial previsto,
   no implementado ni habilitado por este perfil; comisiones son una fase futura.
   Ninguna monetización se activa sin revisión específica y pruebas reales;
6. decidir fuente, backend y política de cuentas; para la primera beta se
   mantienen apagados cuenta, opiniones, correo y push si no tienen E2E;
7. probar primero contra staging aislado, ejecutar suite completa y auditoría
   de seguridad, cerrar el P0 de credencial histórica y consolidar un commit
   revisable;
8. decidir conscientemente cómo sustituir la página y el SW de limpieza;
9. desplegar solo `rwadar-publicado/` y verificar `/`, `/sw.js`, legal,
   cabeceras, caché, monitorización y rollback;
10. actualizar `INTERNO.md` con fecha, commit, destino y evidencia.

La compuerta remota añade controles mecánicos a esa lista:

- `rwadar-app/data/relanzamiento/estado.json` usa la versión 3, declara
  `actualizadoEl` con una fecha ISO real de no más de siete días y conserva
  exactamente los controles conocidos, perfil explícito y cuatro capacidades
  booleanas. En `editorial-gratuito` no se exigen aprobación de
  `primer_acuerdo_patrocinio` ni `facturacion_y_cobro`, pero sí de
  `alcance_editorial_sin_monetizacion` y todos los controles comunes. Los
  registros no exigidos se conservan como pendientes, no como falsos aprobados;
- cada control aprobado contiene evidencias como objetos con `tipo`,
  `referencia`, `verificadoEl` y `resumen` sustanciales. Una cadena como
  `["ok"]`, un estado inventado o una fecha futura fallan cerrado;
- `revisionAprobada.commit` identifica el commit completo que se revisó y
  `revisionAprobada.contenidoSha256` y `revisionAprobada.alcanceSha256` copian las huellas que muestra
  `npm --prefix rwadar-app run auditar:relanzamiento`. El commit puede ser
  ancestro del que incorpora el manifiesto para evitar una referencia
  circular, pero ninguna ruta sujeta a aprobación puede cambiar entre ambos;
- antes de tocar Auth/Supabase, después de sincronizar y justo antes de
  Wrangler, Git debe seguir limpio y la huella debe coincidir. Archivos no
  versionados que no estén ignorados también cierran la compuerta; el árbol
  publicable se valida además contra su lista cerrada. Auditor y publicador
  contrastan que las páginas comerciales no declaren capacidades activas en
  el perfil editorial. Sincronizador y lector web rechazan fichas patrocinadas
  en el catálogo gratuito; los anuncios de red serán un módulo independiente.

En el corte final, primero consolida el contenido y el cambio explícito de
`MODO_PRIVADO` en el commit revisado mientras el manifiesto todavía bloquea;
después registra commit y huella en un commit separado que no altere las rutas
aprobadas. Vuelve a ejecutar la auditoría sobre un árbol limpio. No rellenes
la revisión con marcadores ni recalcules la huella para hacer pasar cambios no
revisados.

Hasta completar ese procedimiento, el trabajo de relanzamiento sigue siendo
local y RWAdar continúa apagado públicamente.

### Catálogo Supabase 26/28 preparado, no aplicado

La ruta fail-closed que sustituirá a `radar_publico` y
`emisiones_publicas` durante una publicación está documentada en
`comercial/RUNBOOK-CATALOGO-SUPABASE.md`. La migración 24, el importador y sus
pruebas son solo locales: no forman parte de los instaladores aprobados y no se
aplican hasta disponer de staging, cerrar el P0 y recibir autorización expresa.
