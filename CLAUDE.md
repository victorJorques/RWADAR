# RWAdar · punto de entrada

Este archivo se carga solo al abrir sesión. Su único trabajo es que llegues
al sitio correcto **sin leer nada más**. No lo alargues: cada línea aquí se
paga en todas las sesiones.

Este repositorio contiene RWAdar. La información de estado más reciente es la
de `RWADAR-TRASPASO.md`, reconciliada el **22 de agosto de 2026** sobre el
baseline `42018de`; prevalece sobre cualquier afirmación histórica que aún
quede en un documento de contexto.

---

## RWAdar · registro de plataformas de tokenización

**Producción web GO: https://rwadar.pages.dev** · Cloudflare Pages proyecto
`rwadar` · Supabase `exgpmjpaaebyoolpwced`.

Cloudflare sirve la versión endurecida, pre-renderizada e instalable como PWA:
26 fichas, 4 descartadas y 0 emisiones públicas; CSP estricta, sin RUM/Zaraz y
sin tokens de sesión en `localStorage`. El despliegue actual es `395980eb...`
(`https://395980eb.rwadar.pages.dev`), el canonical es
`https://rwadar.pages.dev` y la caché es `rwadar-v-9b1583232e8bea4b`. El
artefacto final es `outputs/rwadar-cloudflare-pages-20260822-9b158323.zip`,
875.030 bytes y 21/21
archivos verificados, SHA-256
`3435EC036030F390855D721EAAFB7FE0FB904187FA3284D20C270C479B6DE945`; no usar
el paquete pre-privacidad anterior.
La web pasa 190/190 y la suite raíz terminó con código 0. El smoke externo de
portada, privacidad, redirecciones, 404, cabeceras, assets,
service worker, manifiesto, canonical, robots y sitemap quedó GO.

`https://rwadar.netlify.app` es ahora el origen antiguo: conserva una versión
anterior porque el panel indica que los despliegues de producción están
pausados al quedar solo créditos operativos y la CLI responde `Forbidden`.
Seguirá así hasta el reinicio o ampliación de créditos; está en línea y ya
figura indexado, pero no es el canonical ni el destino de producción actual.
Search Console tiene verificada la propiedad `rwadar.pages.dev`; se solicitó la
indexación de la portada. El sitemap se envió y su primera lectura mostró el
estado transitorio «No se ha podido obtener»: hay que revisarlo de nuevo, no
describir todavía la URL nueva como indexada.

La migración 22 (`02F2...0666`) está aplicada y verificada en producción. Su
verificador (`4182...2C3`) terminó con `Success. No rows returned`; el smoke
backend quedó verde y Security Advisor mostró 0 Critical y 0 Security Definer
View. Correo y push permanecen apagados; la retención diaria independiente está
activa.

Los dos smokes remotos son de solo lectura por defecto, sin destino ni clave
embebidos. Su modo mutante requiere confirmación ligada a la referencia y un
`finally` con limpieza verificable; el contrato adversarial local pasa 21/21
sin red.

Confirm email está activo, signup sigue habilitado y Auth devuelve
`mailer_autoconfirm=false`. `Site URL` está guardada como
`https://rwadar.pages.dev`; las redirecciones permitidas son exactamente
`https://rwadar.pages.dev/` y `https://rwadar.netlify.app/`. No hay SMTP propio
y todavía faltan pruebas E2E reales de confirmación y recuperación.

El correo de avisos tiene una migración 23 preparada y verificada **solo en
local**. No está aplicada en producción: faltan `BREVO_API_KEY`, remitente
verificado en Vault y prueba E2E. El push también
sigue OFF en producción: 0 tokens, 0 cron `rwadar-push` y entrega E2E no
demostrada. Activarlo exige un dispositivo físico nativo con token válido,
credenciales de entrega y verificación de ticket, recibo y recepción.

Auditoría de dependencias: backend 0; móvil 46 paquetes afectados (29 high, 17
moderate, 0 critical), derivados de tres avisos fuente de toolchain sin arreglo
compatible. Expo install check y Doctor están verdes. El preview terminó
`FINISHED`: Android 1.0.0 build 4, ID
`c7bb915b-da3b-46d4-9bd6-811a432b4cb3`, fingerprint
`af69452933f988f2d48d45861802f09d3df06e8b`. APK:
`outputs/rwadar-android-preview-v1.0.0-build4-c7bb915b.apk`, 84.783.140 bytes,
SHA-256 `5E505F18C26FF91A8FC12899DEE39D9757C5D2E7FFC665DF0D7AFF090CFC4DB7`.
La OTA del canal Android `preview`, grupo `4f9d7e19...` y runtime
`af69452933f988f2d48d45861802f09d3df06e8b`, publica el rediseño y el listener
que abre un aviso push; es compatible con ese build 4. No hay publicación en
Play Store ni build nativo iOS. La PWA sí se actualiza desde la web en iOS y
Android, muestra las cuatro pestañas `Radar`, `Siguiendo`, `Avisos` y `Más`, y
migra automáticamente instalaciones con service worker v1. La ficha de empresa
móvil conserva información, puntuación, opiniones y animaciones 3D, pero las
agrupa visualmente; mantiene «Web oficial» fija, reinicia el scroll y ofrece
cierres superior e inferior de al menos 48 px, safe-area y cierre con Back. La
OTA no demuestra ni activa la entrega push.

Los corresponsables actuales, sin sociedad constituida, son **Eric Almiñana,
Samuel Rodriguez y Victor Jorques**. Contacto: `RWAdar@protonmail.com`. El
acuerdo interno y los plazos de conservación siguen pendientes de aprobación;
no los presentes como definitivos. La política de privacidad fija en el punto
11 una edad mínima de 18 años.

**Esa dirección es también la aplicación.** Desde el móvil se instala en la
pantalla de inicio y se abre con su icono y sin barra de navegador. Una sola
dirección para todo: no hay una segunda que explicar. Lo que lo hace posible
son cinco archivos de `rwadar-site/` —`manifest.webmanifest`, `sw.js` y los
tres `icono-*.png`— y las etiquetas del `<head>`.

La web sigue siendo estática y sin compilación, pero **ya no es un único
archivo**. `rwadar-site/index.html` carga CSS y JavaScript propios desde
`rwadar-site/assets/`; los estilos y el código ejecutable inline se eliminaron
para permitir una CSP estricta. Las sesiones no persisten tokens en
`localStorage`.

| Si vas a… | Lee primero | Coste |
|---|---|---|
| **retomar el proyecto donde se dejó** | **`RWADAR-TRASPASO.md`** — en qué punto está, qué falta y las trampas | ~3 k |
| **tocar cuentas, opiniones, moderación o la base en línea** | **`RWADAR-MANANA.md`** | ~2 k |
| tocar la web | `RWADAR-MAPA.md` → te da la marca de grep exacta | ~2,8 k |
| entender por qué algo está así | `RWADAR-ESTADO.md` (tiene índice; lee solo la sección) | ~6 k entero |
| reportar o revisar una vulnerabilidad | `SECURITY.md` | corto |
| trabajar la app móvil | `rwadar-movil/` | — |
| tocar datos o esquema | `rwadar-app/` | — |

**La web remediada sí está en producción en Cloudflare Pages.** No confundas
eso con tener correo, push o apps de tienda operativos. El cierre 22 está en
Supabase; la 23 de correo sigue solo local. El contrato vigente está en
`RWADAR-MANANA.md`.

**Seis reglas que no se negocian:**

1. **Generar y validar primero con `node rwadar-publicar.js --local`.** El
   publicador remoto existente aún llama a Netlify; no es la ruta de producción
   de Cloudflare. Para Cloudflare se despliega deliberadamente
   `rwadar-publicado/` con Wrangler fijado, proyecto `rwadar` y rama `main`,
   después de verificar cuenta, artefacto y hashes. El OAuth de Wrangler quedó
   reducido a 3 permisos: User Read obligatorio, Account Read y Pages Write.
   Nunca subas `rwadar-site/`, la raíz ni CALIX. **CALIX es otro proyecto y no
   se toca desde RWAdar.**
2. **Los datos no se editan en el HTML ni en el JS generado.** La fuente de
   verdad es Supabase; la siguiente publicación sobrescribe `P`, `FUERA` y `EMI`
   dentro del JavaScript externo versionado.
3. **Ninguna descartada sin fuente.** Comprobarlo antes de publicar (el
   comando está en el mapa). Es riesgo legal, no una preferencia.
4. **No borrar** `google6b2e3e5f58b7e557.html` ni
   `c9417d2d5003bb9a41fee63c7f5ec00f.txt` de `rwadar-site/`.
5. **No reintroducir inline ejecutable.** El JS y el CSS propios van en
   `rwadar-site/assets/`; RUM permanece desactivado y cualquier inyección se
   trata como fallo.
6. **No convertir una inscripción regulatoria en un aval.** El ERIR de la CNMV
   lista emisiones concretas de Reental Tourist Homes y varias SPV de Hausera,
   pero la propia CNMV dice que no valida las condiciones ni la información del
   emisor. Ver `RWADAR-TRASPASO.md`.

**Para empezar, un solo comando:**
```bash
node rwadar-arrancar.js
```
Comprueba que el JS externo compila, que el pre-renderizado está puesto, que la
carpeta publicable no tiene archivos de más, que Supabase responde, que
**ninguna descartada va sin fuente** y si lo publicado coincide con lo
local. Luego levanta el servidor en http://localhost:4173 (y `/banco`).

---

El baseline versionado es `42018de`. En este clon, `origin` apunta a la copia
local de Downloads; una URL histórica de GitHub no demuestra que el remoto
esté accesible o actualizado. Comprueba el destino antes de empujar. El
`.gitignore` es una **lista blanca**: no lo conviertas en lista negra ni le
quites la primera línea, porque la carpeta de origen puede contener documentos
ajenos al proyecto.

La app móvil admite actualizaciones EAS, pero una configuración no demuestra
que la entrega real esté operativa. El build 4 escucha el canal `preview`; la
OTA vigente es el grupo `4f9d7e19...`. No publiques una actualización en otra
rama ni inicies otro build/update salvo una nueva decisión explícita.

No ejecutes ese comando como si fuera una prueba de push: el reparto de avisos
push sigue sin estar demostrado de extremo a extremo en producción y debe
fallar de forma cerrada.

---

## Cómo trabaja Víctor

- **Rechaza lo que no puede ver funcionando.** Ejecuta de punta a punta y
  enséñale el resultado —captura, PNG, medida—, no la intención.
- Da notas sobre 10 y pide iterar. Cuando dice que algo está soso o falso,
  suele tener razón: escúchalo antes de defender la decisión.
- **No escribas archivos con `Set-Content` de PowerShell**: mete BOM y ha
  roto JSON dos veces. Usa la herramienta Write.
- El panel de vista previa **no compone fotogramas**: `requestAnimationFrame`
  no corre y las capturas salen en negro. Las recetas para verificar
  animación y sonido están en `RWADAR-MAPA.md`.
