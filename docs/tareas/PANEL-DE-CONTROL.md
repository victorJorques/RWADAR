# Panel de control de RWAdar · traspaso

*23 de octubre de 2026 · Claude.* Lo pidió Víctor el 22/10: un panel para
vigilar la web y la app y gestionar las cuentas, compartido con Eric y Samuel
por WhatsApp sin que tengan que hacerse cuenta. Manual de uso:
[`rwadar-panel/LEEME.md`](../../rwadar-panel/LEEME.md).

## Dónde está

- **Código:** `rwadar-panel/`, en la rama `claude/panel-control`. No está
  unida a `main`; `package.json` añade `panel`, `panel:demo`, `panel:nube`,
  `panel:nube:demo` y `test:panel` (este último dentro de `npm test`), y
  `.gitignore` readmite `rwadar-panel/` e ignora `datos/`, `datos-demo/` y
  `nube/generado/`. No toca `rwadar-site/` ni ninguna ruta con huella aprobada.
- **En internet:** Worker `rwadar-panel` en
  <https://rwadar-panel.victorjorquesgranero.workers.dev>, con KV
  `rwadar-panel-almacen` y un cron cada hora. Lo subió Claude con permiso
  expreso de Víctor (22 y 23/10) usando `npm run panel:nube`.
- **Claves:** en `rwadar-panel/.env.local` del ordenador de Víctor (fuera de
  Git) y como secretos del Worker: token de Cloudflare (solo Account Analytics
  Read), clave secreta de Supabase, token de registros de Supabase y un
  `GITHUB_TOKEN` fino de solo lectura sobre RWADAR y RWAdar-downloads (no ve
  Calix; caduca el 23/10/2027).
- **Enlaces de los socios:** uno por persona; las llaves están en
  `rwadar-panel/datos/nube.json` (fuera de Git) y en Cloudflare solo su huella.
  `publicar.mjs` las conserva al volver a subir.

## Qué hace

Salud (11 comprobaciones), visitas de Web Analytics, uso de la app (aperturas
del catálogo leídas de los registros de Supabase), descargas del APK, cuentas
(confirmar, bloquear, borrar) y registro con quién hizo cada cosa. **No apaga
ni enciende la web**: Víctor lo decidió el 22/10; cuando haga falta os lo pide.

## Lo comprobado contra producción

- Web Analytics por GraphQL funciona. Cloudflare solo cuenta exacto 7 días;
  más allá muestrea 1 de cada 10. El panel apunta cada día las visitas exactas
  (`visitas-AAAA-MM-DD`) para que los 30 días se corrijan solos.
- Registros de Supabase: la tabla `logs` filtra por `source` (no
  `source_name`); los detalles van en `log_attributes['request.path']`,
  `['request.headers.user_agent']`, `['request.headers.x_client_info']`. La app
  es `okhttp` + `runtime=react-native`. La API da 429 si se consulta seguido.
- Desde Cloudflare, GitHub corta las consultas sin clave: hace falta el token.
- La sesión antigua de `wrangler` solo tenía Pages; se rehízo `wrangler login`.
  La fecha de compatibilidad del Worker no puede pasar de 2026-08-27 con
  wrangler 4.125.0.

## Pendiente (decisión de Víctor)

- **Retirar el catálogo desde el panel:** la base devuelve 42501 a
  `service_role` sobre `public.catalogo_publicacion` (y también sobre
  `perfiles` y `vigilancia`). Haría falta `GRANT SELECT, UPDATE ON
  public.catalogo_publicacion TO service_role;`. No se ha aplicado: es un
  cambio de permisos en producción. Mientras, el panel no enseña el botón.
- Unir la rama a `main` cuando Víctor lo diga.

## Pruebas

`npm run test:panel`: 36/36 (contra el simulador `rwadar-panel/demo/simulador.js`).
Recorrido completo con datos reales en el panel local y en el de la nube el 23/10.
