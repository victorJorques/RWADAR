# RWAdar · cómo está el proyecto

*Actualizado el 11 de octubre de 2026.* Si solo vas a leer un documento, que sea
este. El detalle técnico con todas las pruebas del 30 de septiembre está en
[`archive/2026-09/INTERNO-detalle-2026-09-30.md`](archive/2026-09/INTERNO-detalle-2026-09-30.md).

---

## Qué es RWAdar

Un **radar de plataformas de tokenización** de activos reales: inmuebles,
fondos del Tesoro, materias primas, crédito… Dice cuáles existen, cuáles están
supervisadas y cuáles se han descartado, **siempre con la fuente al lado**.

RWAdar informa: no vende, no invierte el dinero de nadie y no cobra a quien
consulta. Entrar en el radar es gratis para las plataformas.

---

## Qué está funcionando hoy

| | Estado |
|---|---|
| **Web** | Pública en **https://rwadar.pages.dev** (Cloudflare), **con las cuentas activadas desde el 11/10**. La publicación y sus recursos se comprobaron en línea; los formularios de alta, entrada y Perfil se observaron en el navegador de producción. Se instala en el móvil como app. Incluye la Academy, la barra Inicio · Buscar · Academy · Perfil y las tarjetas nuevas. |
| **Catálogo** | Revisión del **6 de octubre**, vigente **hasta el 13 de octubre**: 26 plataformas en el radar, 4 descartadas con su fuente y 49 referencias de inversión (24 principales, 21 de mercado secundario y 4 en preparación). La lectura en línea del 11/10 confirmó las 26 plataformas y 49 referencias; el catálogo público **no está retirado**. Detalle en [`CATALOGO-V2-2026-10-06.md`](CATALOGO-V2-2026-10-06.md). |
| **App Android** | Sigue publicada la **versión 1.2.0** (código 12) en GitHub ([RWAdar-downloads](https://github.com/victorJorques/RWAdar-downloads/releases/latest)); la web la ofrece en `/android`. No contiene el panel de cuentas nuevo. El APK **1.3.0** (código 13) **ya está compilado sin cargos**, con firma y tamaño comprobados. Falta ejecutar sus pruebas de uso antes de publicarlo en GitHub. Todavía no está en Google Play. |
| **App iPhone** | Compilada para el simulador. Aún no hay cuenta de Apple Developer. |
| **Google** | La portada ya aparece indexada. El mapa del sitio sigue pendiente de que Google lo lea. |
| **Analítica** | Cloudflare Web Analytics, sin cookies. |
| **Legal** | Aviso legal, condiciones, privacidad y transparencia comercial publicados. |
| **RWAdar Academy** | **Publicada** en la web (`/academy/`) desde el 5/10. 9 lecciones de Eric en 3 niveles: 1 a 7 publicadas, 8 y 9 «Próximamente». Revisión legal verificada por Víctor el 2/10/2026. En la app, pestaña Academy. Ver [`academy/REVISION-CONTENIDO-2026-10-02.md`](academy/REVISION-CONTENIDO-2026-10-02.md). |
| **Tipografía** | Arreglada el 2/10: la Geist incrustada no traía a-z, así que la web se veía con la letra del sistema. Ya es la completa. |

**Cuentas:** ya están activadas en la web pública. En la versión de
revisión, Víctor confirmó el 11/10 que recibió el correo de alta y que su
enlace funciona. **Llega a spam**: la entrega debe mejorarse antes de anunciar
las cuentas. Supabase permite las altas y exige confirmar el correo; esa
confirmación se mantiene obligatoria. El perfil confirmado se mostró y cerrar
sesión funcionó en la revisión existente. El correo de recuperación solicitado
por Codex **ya llegó a la bandeja de entrada**, con sus comprobaciones de
autenticidad correctas; no se leyeron su cuerpo ni su enlace. Falta que Víctor
introduzca la nueva contraseña y verificar la entrada posterior: la recuperación
real todavía no está completada.

**Cambios del 11/10:** panel nativo de cuentas y refuerzos de la web
para evitar mezclar sesiones; registro, acceso, nombre, vigilancia, recuperación
y baja con contraseña recién comprobada. Los favoritos locales no se convierten
en vigilancia remota. La sesión nativa queda solo en memoria. La app no activa
instalaciones históricas ni push. El refuerzo de sesión **ya se aplicó en
Supabase con permiso expreso de Víctor**. La lectura posterior comprobó las
políticas restrictivas de acceso, la sesión confirmada y vigente, la exclusión
de usuarios anónimos y que el esquema privado no queda expuesto por REST.

**Publicación y app:** la web está publicada con las guardas de cuentas
encendidas. El APK nativo 1.3.0 también las lleva activadas, pero sigue pendiente
de pruebas de ejecución y publicación. Los servicios antiguos de instalaciones
y push permanecen apagados. Víctor autorizó EAS Android y GitHub **sin cargos**;
la compilación se hizo dentro de la cuota gratuita. La comprobación de
dependencias nativas pasó sus 21 controles.

**Pruebas locales finales:** `npm test` terminó correctamente con las guardas
de cuentas de web y app activadas y la candidata nativa 1.3.0: web 501
comprobaciones, móvil 180 y SQL 196; QR y herramientas también al día. Los
ensayos de cuentas en Chrome con servicios simulados pasaron 61 y 30 casos.
La revisión independiente terminó sin bloqueos. Estas pruebas no demuestran
por sí solas el cambio real de contraseña ni el funcionamiento de un APK nuevo
instalado.

Codex es responsable de integrar, configurar y comprobar técnicamente los
cambios, y de publicar dentro de las autorizaciones expresas. Víctor únicamente
introduce sus credenciales, verifica su identidad y autoriza las operaciones
reservadas; no se le asignan cambios de código. Plan vigente:
[`tareas/CUENTAS-WEB-MOVIL-2026-10-11.md`](tareas/CUENTAS-WEB-MOVIL-2026-10-11.md).
La evidencia local y el diagnóstico real están en
[`VERIFICACION-CUENTAS-2026-10-11.md`](VERIFICACION-CUENTAS-2026-10-11.md).
La web nueva ya está publicada. El APK 1.3.0 está compilado y revisado, pero
todavía no está publicado en GitHub ni verificado mediante su ejecución.

**En pausa:** opiniones, comunidad, avisos de cambios por correo y avisos push. Seguridad anterior:
[`seguridad/REVISION-SEGURIDAD-2026-10-05.md`](seguridad/REVISION-SEGURIDAD-2026-10-05.md).
Manual de bienvenida de Eric recibido, pendiente de corregir su sección 8:
[`manual/LEEME.md`](manual/LEEME.md).

**Nueva barra del móvil (5/10): Inicio · Buscar · Academy · Perfil**, en la
web y en la app. Inicio trae las noticias de RWAdar (se editan en
[`../rwadar-noticias/`](../rwadar-noticias/LEEME.md)) y anuncia la comunidad;
Perfil reúne las empresas y ofertas guardadas (solo en el navegador o en el
móvil) y los avisos como «próximamente». Publicada en la web el 5/10 y en la
app con la versión 1.2.0.

**Desactivado:** publicidad, comisiones y cobros. Hay una cuenta de AdMob con
dos fichas de prueba, pero nada conectado a la app.

---

## Lo que falta, por orden

1. **Renovar la revisión del catálogo antes del 13 de octubre.** Cómo se hizo
   la del 6/10 (comprobación de las 70 fuentes y las 49 fichas, SQL de un solo
   paso y republicación de la web) está en
   [`CATALOGO-V2-2026-10-06.md`](CATALOGO-V2-2026-10-06.md). Si vence, la web
   y la app 1.2.0 avisan en lugar de vaciarse; la 1.1.2 ocultaba las fichas.
2. **Actualizar Postgres.** Las copias de seguridad ya están activas: la
   primera, del 2 de octubre, copió 52 tablas y se comprobó
   que se descifra. Antes de actualizar, descarga una copia y ábrela una vez
   como explica [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md).
3. **Completar la comprobación real de cuentas y entregar Android.** La web ya
   está publicada con cuentas. Completar el cambio de contraseña de
   recuperación y la entrada posterior, mejorar la entrega del correo que
   llega a spam y comprobar los flujos sobre la versión publicada. El refuerzo
   de sesión ya está aplicado y verificado. Ejecutar las pruebas del mismo APK
   1.3.0 ya compilado y, si pasan, publicarlo en GitHub dentro de la autorización
   sin cargos. No confundir la revisión del paquete con una prueba de uso.
   Codex hace los pasos técnicos; el plan y las autorizaciones concretas
   están en [`tareas/CUENTAS-WEB-MOVIL-2026-10-11.md`](tareas/CUENTAS-WEB-MOVIL-2026-10-11.md).
4. **Tiendas.** Apple y Google tienen cada uno una consulta de soporte
   pendiente sobre el alta como persona física. Hasta que respondan, no se paga
   ni se rellena nada. El paquete para Google Play (AAB 1.1.2, icono, cabecera y
   capturas) ya está preparado.
5. **Dominio propio** (unos 12 € al año). Da seriedad y permite un correo
   propio.
6. **iPhone:** el fallo de memoria de una librería de Expo ya está corregido.
   Falta probar la app en un simulador o un iPhone de verdad antes de enviarla.
7. **Ingresos:** decidir con un abogado cómo se puede cobrar a las
   plataformas. El veredicto editorial no se vende nunca.

---

## Fechas que conviene tener a mano

| Cuándo | Qué |
|---|---|
| **13 de octubre de 2026** | Vence la revisión del catálogo (la web avisa, no se vacía) |
| Cada noche, 02:43 UTC | Copia de seguridad cifrada, guardada 35 días en GitHub |
| Cada noche, 03:17 UTC | Limpieza de dispositivos inactivos de más de 180 días |
| Agosto de 2027 | Caduca `/.well-known/security.txt`: renovar la fecha |

---

## Quién hace qué

| | |
|---|---|
| **Víctor** (titular) | Decide; cuentas de tiendas, pagos, contratos y todo lo que exija identidad. Solo él autoriza publicar o tocar la base en línea. |
| **Eric Almiñana y Samuel Rodriguez** | Corresponsables junto a Víctor (ver [`../SECURITY.md`](../SECURITY.md)). |
| **Codex (ChatGPT)** | Responsable de la integración técnica, configuración, pruebas y publicación autorizada de web y app; también del trabajo técnico de catálogo y tiendas. |
| **Claude** | Seguridad, copias de seguridad, revisiones y documentación. |

Cada herramienta firma sus commits con su propio nombre (ver
[`../AGENTS.md`](../AGENTS.md)). Lo que hace una queda anotado para la otra en
[`tareas/PARA-CODEX.md`](tareas/PARA-CODEX.md).

---

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `rwadar-site/` | La web: lo que se edita |
| `rwadar-academy/` | Las lecciones de la Academy en Markdown; `node rwadar-academy.js` genera la web y la app |
| `rwadar-publicado/` | La web lista para subir. Se genera sola: no se edita |
| `rwadar-app/` | Base de datos: migraciones, importadores y pruebas |
| `rwadar-movil/` | App de Android e iPhone (Expo) |
| `rwadar-qr/` | Código QR de la tarjeta |
| `rwadar-limpieza/` | Página que desinstala la PWA antigua de Netlify: se conserva |
| `rwadar-version-codex/` | Copia rescatada de la versión de agosto: no se edita |
| `docs/` | Esta documentación |

**Documentos para el día a día:**

- [`RUNBOOK.md`](RUNBOOK.md): cómo trabajar en local y qué comandos son
  peligrosos.
- [`OPERACION-LANZAMIENTO.md`](OPERACION-LANZAMIENTO.md): cómo se publica.
- [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md): copias y actualización
  de Postgres.
- [`ANALITICA.md`](ANALITICA.md): cómo leer las visitas.
- [`ENTREGA-TIENDAS-Y-ANUNCIOS.md`](ENTREGA-TIENDAS-Y-ANUNCIOS.md): tiendas y
  anuncios.
- [`seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`](seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md):
  qué aguanta la web y qué se puede mejorar.

Los informes con fecha (`VERIFICACION-…`, `CATALOGO-V2-…`, `SEO-…`,
`PREPARACION-PLAY-…`, `CORRECCION-OFERTAS-…`) son **pruebas técnicas** de lo
que se comprobó cada día. La compuerta de publicación las cita, por eso siguen
ahí. No hace falta leerlas para trabajar. Índice en [`LEEME.md`](LEEME.md).

---

## Reglas que no se negocian

1. **Ninguna plataforma descartada sin una fuente citable.** Es el mayor
   riesgo legal del proyecto.
2. **Los datos se cambian en Supabase**, nunca a mano en el HTML o el JS.
3. **Una cifra que no se puede comprobar no se publica.** Un hueco es
   correcto; una cifra inventada, no.
4. **Lo patrocinado se marca y no cambia el orden.**
5. **Publicar, tocar la base en línea o compilar la app** solo con permiso
   expreso de Víctor.
6. **Secretos fuera de Git:** contraseñas, tokens y claves de servicio nunca
   entran en el repositorio.
7. **El catálogo está siempre disponible para el público**, salvo que Víctor
   diga lo contrario. Si la revisión caduca o no se puede comprobar, se muestra
   la última copia completa con un aviso y sin cifras vencidas. Solo se oculta
   con la orden expresa (ver «Retirar el catálogo» en [`RUNBOOK.md`](RUNBOOK.md)).
