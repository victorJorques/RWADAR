# Documentación de RWAdar · por dónde empezar

**Empieza por [`INTERNO.md`](INTERNO.md).** Explica en cinco minutos qué es
RWAdar, qué funciona hoy y qué falta.

## Para trabajar

| Documento | Para qué sirve |
|---|---|
| [`INTERNO.md`](INTERNO.md) | Estado del proyecto, pendientes y quién hace qué |
| [`RUNBOOK.md`](RUNBOOK.md) | Trabajar en local sin romper nada; comandos seguros y peligrosos |
| [`OPERACION-LANZAMIENTO.md`](OPERACION-LANZAMIENTO.md) | Cómo se publica una versión |
| [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md) | Copias nocturnas, recuperar datos y actualizar Postgres |
| [`ANALITICA.md`](ANALITICA.md) | Dónde mirar las visitas y cómo interpretarlas |
| [`ENTREGA-TIENDAS-Y-ANUNCIOS.md`](ENTREGA-TIENDAS-Y-ANUNCIOS.md) | Google Play, App Store y AdMob |
| [`../rwadar-academy/LEEME.md`](../rwadar-academy/LEEME.md) | Cómo se actualizan y publican las lecciones de RWAdar Academy |
| [`academy/`](academy/) | Entrega de la Academy de Eric y la revisión de su contenido |
| [`tareas/`](tareas/) | Trabajo pendiente y traspasos entre Codex y Claude |

## Seguridad

| Documento | Para qué sirve |
|---|---|
| [`../SECURITY.md`](../SECURITY.md) | Cómo avisar de un fallo de seguridad |
| [`seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`](seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md) | Qué aguanta la web ante ataques y qué mejorar |
| [`seguridad/RUNBOOK-REVOCACION-ROTACION.md`](seguridad/RUNBOOK-REVOCACION-ROTACION.md) | Qué hacer si se filtra una credencial |
| [`legal/BRECHAS-DE-DATOS.md`](legal/BRECHAS-DE-DATOS.md) | Si hay datos personales afectados: plazos (72 horas) y a quién avisar |
| [`seguridad/REVISION-SEGURIDAD-2026-09-27.md`](seguridad/REVISION-SEGURIDAD-2026-09-27.md) | Revisión previa al relanzamiento |
| [`seguridad/INCIDENTE-P0-CREDENCIAL-HISTORICA-2026-09-21.md`](seguridad/INCIDENTE-P0-CREDENCIAL-HISTORICA-2026-09-21.md) | El token antiguo que apareció en Git (revocado) |

## Negocio y legal

En [`comercial/`](comercial/) están las decisiones sobre ingresos, el plan del
primer patrocinador, la revisión editorial y la guía para cargar el catálogo
en Supabase. En [`plantillas/`](plantillas/) están los borradores de acuerdos,
fichas y correos.

| Documento | Para qué sirve |
|---|---|
| [`legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`](legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md) | Qué datos personales trata RWAdar, para qué, con quién y cuánto tiempo |
| [`legal/encargados/README.md`](legal/encargados/README.md) | El contrato de encargo de cada proveedor, con su copia en PDF |
| [`legal/BRECHAS-DE-DATOS.md`](legal/BRECHAS-DE-DATOS.md) | Qué hacer si hay una brecha de datos, y su registro |
| [`legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`](legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md) | Revisión legal de los avisos y de la Academy con cuenta |
| [`legal/ANEXO-NOTIFICACIONES-2026-11-12.md`](legal/ANEXO-NOTIFICACIONES-2026-11-12.md) | Anexo legal de las notificaciones en el móvil (web y Android): «sí, con condiciones» para encender el envío |
| [`tareas/PLAN-CEO-2026-11-06.md`](tareas/PLAN-CEO-2026-11-06.md) | El orden para encender los avisos (dominio, Lettermint, GitHub Team, push) |
| [`tareas/LETTERMINT-VERIFICACION-RESPUESTAS.md`](tareas/LETTERMINT-VERIFICACION-RESPUESTAS.md) | Borrador de respuestas para que Lettermint verifique la cuenta |

> Las pruebas automáticas leen algunos de estos archivos. Si cambias
> `comercial/` o `plantillas/`, ejecuta después `npm --prefix rwadar-app test`.

## Archivo técnico (no hace falta leerlo)

Son informes de un día concreto, con todas las comprobaciones, huellas e
identificadores. Sirven de **prueba** de lo verificado y la compuerta de
publicación los cita, por eso siguen aquí y **no se deben borrar ni mover**.

| Informe | Qué se comprobó |
|---|---|
| [`VERIFICACION-WEB-2026-09-28.md`](VERIFICACION-WEB-2026-09-28.md) | La web publicada el 28/09 |
| [`VERIFICACION-ANDROID-2026-09-28.md`](VERIFICACION-ANDROID-2026-09-28.md) | El APK del 28/09 |
| [`VERIFICACION-ANDROID-2026-09-30.md`](VERIFICACION-ANDROID-2026-09-30.md) | El APK 1.1.2 del 30/09 |
| [`CATALOGO-V2-2026-09-30.md`](CATALOGO-V2-2026-09-30.md) | El catálogo de 49 referencias |
| [`CORRECCION-OFERTAS-2026-09-30.md`](CORRECCION-OFERTAS-2026-09-30.md) | La corrección de ofertas y enlaces |
| [`SEO-2026-09-30.md`](SEO-2026-09-30.md) | Indexación en Google |
| [`PREPARACION-PLAY-2026-09-30.md`](PREPARACION-PLAY-2026-09-30.md) | Gráficos y paquete para Google Play |

Más atrás, en [`archive/`](archive/): agosto (antes y durante el apagado) y la
versión detallada del estado a 30 de septiembre.
