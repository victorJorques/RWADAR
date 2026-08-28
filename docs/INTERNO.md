# RWAdar · estado interno canónico

- **Última consolidación:** 28 de agosto de 2026
- **Estado:** proyecto privado; aplicación completa apagada; trabajo conservado
- **Rama de trabajo:** `codex/interno-privado`

Este es el único documento de estado vivo. Si contradice un informe de
`docs/archive/2026-08/`, prevalece este archivo.

## 1. Resumen ejecutivo

RWAdar es un registro editorial de plataformas de tokenización, con web/PWA,
backend Supabase, app Expo y herramientas de publicación. Se retiró de internet
para continuar su desarrollo internamente sin exponer versiones incompletas.

- La aplicación completa **no se sirve públicamente**.
- `rwadar.pages.dev` y `rwadar.netlify.app` sirven una página neutra de
  limpieza y un service worker que intenta borrar la antigua PWA instalada.
- Supabase `exgpmjpaaebyoolpwced` sigue activo. La clave publicable se rotó el
  25 de agosto; la anterior quedó revocada. No guardar valores de claves aquí.
- El repositorio privado conserva tanto el producto más reciente como la
  historia del apagado. Privado en Git no significa aislado en ejecución: los
  clientes locales siguen conectados a Supabase de producción.

## 2. Qué versión es cada cosa

| Pieza | Papel vigente |
|---|---|
| `codex/interno-privado` | Rama canónica para continuar el trabajo interno. Une la rama moderna con los commits del apagado sin reemplazar el producto nuevo por la web antigua. |
| `4b8c952` | Último commit de producto recuperado: portadas editoriales. No llegó a producción. |
| `c6a61fa` | Última versión que coincide materialmente con la producción de Cloudflare antes del apagado. |
| `rwadar-site/` | Fuente editable de la web/PWA más reciente. |
| `rwadar-publicado/` | Artefacto generado; se reconstruye y no se edita. |
| `rwadar-version-codex/` | Copia forense descargada del antiguo despliegue. Es histórica e incompleta como fuente canónica; no editar. |
| `rwadar-limpieza/` | Cinco archivos de retirada que hoy sirven ambos dominios. Conservar. |

La rama moderna recuperada contiene 19 commits posteriores al antiguo
`origin/main` `42018de`. Los commits locales `3110fe8` y `f71f5fe` documentaron
el apagado, la rotación y la sincronización del rescate. La rama interna
conserva ambas líneas de historia para que nada dependa de sesiones antiguas.

## 3. Estado externo verificado

Comprobado directamente el **28 de agosto de 2026 a las 11:23 CEST**:

| Superficie | Estado |
|---|---|
| Cloudflare `https://rwadar.pages.dev/` | `200`, página neutra, `no-store`, `noindex`. |
| Cloudflare `/sw.js` | `200`, JavaScript, 979 bytes; service worker de limpieza. Despliegue de referencia `237c1ed9`. |
| Netlify `https://rwadar.netlify.app/` | `200`, misma limpieza; site ID `f13a4520-b3e2-4668-9ec2-6c1f52d1b999`. |
| Netlify `/sw.js` | `200`, `application/javascript`, 979 bytes. |
| GitHub `victorJorques/RWADAR` | `PRIVATE`, verificado mediante la API el 28 de agosto de 2026. Volver a comprobar antes de cada subida; nunca asumirlo por `package.json`. |
| Supabase | Producción activa; catálogo y aplicaciones comparten el proyecto `exgpmjpaaebyoolpwced`. |

La limpieza PWA es coherente, pero tiene límites: necesita una apertura con
red; cada origen se limpia por separado; no borra el icono de la pantalla de
inicio, cookies, IndexedDB ni datos del servidor. En Netlify, un HTTP 404
online se mostraba como 404 porque `fetch()` no rechaza por estado HTTP; sin
red se intentaba usar la caché antigua. Falta una prueba física concluyente en
iPhone de una instalación antigua. En un futuro despliegue de limpieza conviene
esperar `skipWaiting()` desde `install` y esperar también las navegaciones de
clientes durante `activate`.

## 4. Mapa mínimo

| Ruta | Qué contiene | Regla |
|---|---|---|
| `rwadar-site/` | HTML, CSS, JS, PWA y activos web | Fuente web canónica. |
| `rwadar-editorial-source/` | Maestros de portadas editoriales | Fuente; no confundir con imágenes generadas. |
| `rwadar-app/` | Esquema, migraciones, pruebas y sincronización | Supabase es producción salvo configuración explícita distinta. |
| `rwadar-movil/` | App React Native / Expo 57 | Puede escribir instalaciones, seguimiento y tokens. |
| `rwadar-qr/` | Generación y validación del QR | Los artefactos actuales resuelven a Cloudflare; tarjetas impresas anteriores pueden apuntar a Netlify, por eso se conservan ambas limpiezas. |
| `rwadar-limpieza/` | Retirada de PWA | Infraestructura pública mínima; no es la aplicación. |
| `rwadar-publicado/` | Resultado publicable | Generado, ignorado y reemplazable. |
| `rwadar-generated-source/` | Intermedios de imagen | Generado; no canónico. |
| `rwadar-version-codex/` | Rescate histórico del hosting | Solo forense. |

Flujo web: **Supabase → `rwadar-app/sincronizar.js` → `rwadar-site/` →
`rwadar-publicar.js --local` → `rwadar-publicado/`**.

## 5. Frontera real de privacidad

El servidor `node rwadar-servir.js` escucha en `127.0.0.1`, de modo que no
abre el ordenador a la Wi-Fi. Sin embargo, el JavaScript servido puede leer
Supabase de producción y, con sesión, escribir vigilancia u opiniones. La app
móvil usa el mismo backend y puede registrar dispositivos, seguimiento y
tokens. Para un entorno totalmente aislado todavía falta uno de estos pasos:

1. crear un proyecto Supabase de desarrollo con datos anonimizados; o
2. introducir un modo local basado en mocks/PGlite para web y móvil.

Hasta entonces, trabajar en local sin iniciar sesión y usar las pruebas
PGlite/mocks es el modo de menor riesgo. No probar escrituras remotas por
comodidad.

## 6. Decisiones vigentes

1. El proyecto y su Git permanecen privados.
2. La aplicación completa permanece apagada hasta una petición explícita de
   republicación.
3. Las páginas de limpieza se conservan mientras puedan existir PWA antiguas.
4. La rama interna y `rwadar-site/` son la fuente; el rescate no se bifurca.
5. Supabase sigue siendo la fuente de verdad de catálogo, descartes y
   emisiones; no se congelan datos a mano en el artefacto.
6. Correo, push, tienda y cualquier entrega EAS siguen fuera del flujo normal.
7. Una inscripción regulatoria no se presenta como aval y ningún descarte se
   publica sin fuente verificable.
8. Las decisiones nuevas se registran en este archivo, no en cinco memorias.

## 7. Pendientes reales

| Prioridad | Pendiente | Cierre verificable |
|---|---|---|
| Alta | Aislar el backend de desarrollo | Web y móvil funcionan contra desarrollo/mocks sin tocar producción. |
| Alta | Mantener el bloqueo técnico de despliegue | `--preview` y `--produccion` fallan antes de contactar al proveedor. |
| Media | Probar la retirada en un iPhone con PWA antigua | Sin registros SW ni Cache Storage tras apertura online y reapertura. |
| Media | Corregir el correo del smoke mutante | Usa un dominio real controlado y siempre limpia la cuenta en `finally`. |
| Baja | Decidir cuándo retirar las páginas de limpieza | Decisión explícita, con fecha y evidencia; nunca por accidente. |

## 8. Documentación histórica

Los informes de agosto conservan decisiones, pruebas y trazabilidad, pero
mezclan distintos commits, despliegues, cachés y cifras. Están en
`docs/archive/2026-08/`. No se actualizan ni se cargan por defecto. Para una
investigación histórica, localiza primero una fecha, hash o título con `rg` y
lee solo el fragmento necesario.

`SECURITY.md` permanece como referencia de seguridad y divulgación. Los
`LEEME.md` dentro de backend, móvil, QR y portadas siguen siendo guías de su
ámbito; este archivo prevalece para el estado global.

## 9. Regla de mantenimiento

Después de cualquier cambio material, actualiza solo: fecha, estado afectado,
decisión y evidencia mínima. No copies claves, sesiones, cuerpos de logs ni
inventarios extensos. Git conserva el detalle; este manual conserva el mapa.
