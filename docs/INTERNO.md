# RWAdar · cómo está el proyecto

*Actualizado el 2 de octubre de 2026.* Si solo vas a leer un documento, que sea
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
| **Web** | Pública en **https://rwadar.pages.dev** (Cloudflare). Se instala en el móvil como app. Última publicación: 2 de octubre, despliegue `e1abcd33`, revisión `cccb21c`; los 54 archivos servidos coinciden con lo construido. |
| **Catálogo** | 26 plataformas en el radar, 4 descartadas con su fuente y 49 referencias de inversión: 24 principales, 21 de mercado secundario y 4 en preparación. |
| **App Android** | Versión 1.1.2, descargable desde GitHub ([RWAdar-downloads](https://github.com/victorJorques/RWAdar-downloads/releases/latest)). Todavía no está en Google Play. |
| **App iPhone** | Compilada para el simulador. Aún no hay cuenta de Apple Developer. |
| **Google** | La portada ya aparece indexada. El mapa del sitio sigue pendiente de que Google lo lea. |
| **Analítica** | Cloudflare Web Analytics, sin cookies. |
| **Legal** | Aviso legal, condiciones, privacidad y transparencia comercial publicados. |
| **RWAdar Academy** | Hecha en la rama, **sin publicar**. 9 lecciones de Eric en 3 niveles: las 6 primeras listas para salir, la 7, 8 y 9 como «Próximamente». Web en `/academy/` y app (Más › RWAdar Academy). Ver [`academy/REVISION-CONTENIDO-2026-10-02.md`](academy/REVISION-CONTENIDO-2026-10-02.md). |

**En pausa a propósito:** cuentas de usuario, opiniones, avisos por correo y
avisos push. Las altas nuevas están cerradas. Los favoritos de la app se
guardan solo en el móvil.

**Desactivado:** publicidad, comisiones y cobros. Hay una cuenta de AdMob con
dos fichas de prueba, pero nada conectado a la app.

---

## Lo que falta, por orden

0. **Publicar RWAdar Academy** (cuando Víctor lo autorice): revisar el
   contenido pendiente de Eric (los «cuatro criterios» no coinciden con el
   Método y varias lecciones prometen funciones que aún no existen), registrar
   la aprobación y publicar la web. En la app llega con la próxima compilación.

1. **Renovar la revisión del catálogo** antes del 5 de octubre si se puede.
   Ya no es urgente: desde el 2 de octubre el «catálogo siempre disponible»
   está en producción (migración aplicada en Supabase y web publicada), así
   que al vencer la web avisa en lugar de vaciarse. La app de Android lo
   tendrá en su próxima versión: la 1.1.2 sigue ocultando las fichas al
   vencer.
2. **Actualizar Postgres.** Las copias de seguridad ya están activas: la
   primera, del 2 de octubre (run 36932444985), copió 52 tablas y se comprobó
   que se descifra. Antes de actualizar, descarga una copia y ábrela una vez
   como explica [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md).
3. **Revisar la mejora visual de las tarjetas.** El trabajo de Codex que estaba
   sin subir está en la rama `mejora-tarjetas-local`, ya unida con `main` y con
   las pruebas pasando (web 429, móvil 115). No está publicado ni en `main`.
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
| **5 de octubre de 2026** | Vence la revisión del catálogo (la web avisa, no se vacía) |
| Cada noche, 02:43 UTC | Copia de seguridad cifrada, guardada 35 días en GitHub |
| Cada noche, 03:17 UTC | Limpieza de dispositivos inactivos de más de 180 días |
| Agosto de 2027 | Caduca `/.well-known/security.txt`: renovar la fecha |

---

## Quién hace qué

| | |
|---|---|
| **Víctor** (titular) | Decide; cuentas de tiendas, pagos, contratos y todo lo que exija identidad. Solo él autoriza publicar o tocar la base en línea. |
| **Eric Almiñana y Samuel Rodriguez** | Corresponsables junto a Víctor (ver [`../SECURITY.md`](../SECURITY.md)). |
| **Codex (ChatGPT)** | Integrador: publicación, catálogo, tiendas y app. |
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
