# RWAdar · punto de entrada

Este archivo se carga solo al abrir sesión. Su único trabajo es que llegues
al sitio correcto **sin leer nada más**. No lo alargues: cada línea aquí se
paga en todas las sesiones.

Este repositorio contiene RWAdar. La información de estado más reciente es la
de `RWADAR-TRASPASO.md`, reconciliada el 20 de agosto de 2026 sobre el baseline
`42018de`; prevalece sobre cualquier afirmación histórica que aún quede en un
documento de contexto.

---

## RWAdar · registro de plataformas de tokenización

**En línea, pero no terminado: https://rwadar.netlify.app** · Supabase
`exgpmjpaaebyoolpwced` · Netlify site `0211fd28-d371-43cd-9d93-3944fea57680`

Producción muestra 26 fichas y 4 descartadas, es instalable como PWA y no
publica la sección de emisiones. La web remediada de este repositorio está
probada localmente (121/121; QR 6/6; 26/4/0) pero no desplegada. La versión
pública antigua aún usa `unsafe-inline`, privacidad 09-08 y service worker v1.
La indexación no quedó confirmada en esta reconciliación: robots y sitemap
responden, pero hay que verificar Search Console. La migración 22 está validada
en local (270 aserciones + 8 gates SQL) y pendiente de aplicar y verificar en
producción, que no se tocó. El correo no envía avisos y el
push permanece deshabilitado. Fresh-install, 22, rollback y recuperación dejan
el flag backend en `false` y 0 cron `rwadar-push`; el opt-in no se ejecutó.
La 22 termina además las colas heredadas pendientes, pone `token=NULL`, marca
los intentos como terminales y limpia la petición.

Los dos smokes remotos son de solo lectura por defecto, sin destino ni clave
embebidos. Su modo mutante requiere confirmación ligada a la referencia y un
`finally` con limpieza verificable; el contrato adversarial local pasa 21/21
sin red.

Producción devuelve `mailer_autoconfirm=true`. El marcador
`data-deploy-blocker` bloquea tanto `--preview` como `--produccion`, por lo que
hoy solo se puede construir con `--local`. Aun después de retirar el marcador,
el preflight remoto exige `mailer_autoconfirm=false` exacto y falla cerrado si
Auth no responde o falta el campo. No prometas confirmación por correo hasta
cambiar esa configuración y probar un alta real de extremo a extremo.

Auditoría de dependencias: backend 0; móvil 46 paquetes afectados (29 high, 17
moderate, 0 critical), derivados de tres avisos fuente de toolchain sin arreglo
compatible. Expo install check OK, Doctor 21/21 y tests 7/7.

Los corresponsables actuales, sin sociedad constituida, son **Eric Almiñana,
Samuel Rodriguez y Victor Jorques**. Contacto: `RWAdar@protonmail.com`. El
acuerdo interno y los plazos de conservación siguen pendientes de aprobación;
no los presentes como definitivos.

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

**Producción NO coincide con este repositorio.** Las migraciones históricas 14
y 15 ya tienen implementación y verificadores reproducibles, pero el cierre de
regresiones de `db/22_cierre_regresiones.sql` sigue solo en local. No describas
la 22 como aplicada hasta ejecutar su verificador contra producción. El
contrato vigente está en `RWADAR-MANANA.md`.

**Seis reglas que no se negocian:**

1. **Publicar solo con `node rwadar-publicar.js --produccion`.** Exactamente un
   modo es obligatorio. Mientras exista `data-deploy-blocker`, usa únicamente
   `--local`: `--preview` y `--produccion` deben fallar antes de tocar Auth,
   Supabase o Netlify. Tras cerrar los bloqueos y superar el preflight de Auth,
   usa `--preview` para revisar y `--produccion` solo de forma deliberada. Nunca
   `netlify deploy` a secas: sin el pre-renderizado la página queda vacía para Google, y sin
   `--dir`/`--site` explícitos el CLI publica lo que diga el `.netlify` que
   él mismo deja en esta carpeta (llegó a apuntar a Downloads entera).
   Además, **lo que se sube no es `rwadar-site/` sino `rwadar-publicado/`**,
   que el publicador genera adelgazando el HTML: la fuente conserva sus
   comentarios y lo publicado pesa 84 kB por la red en vez de 104.
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
que la entrega real esté operativa. Para preparar un cambio de código:
`cd rwadar-movil && npx.cmd eas update --branch production --environment production -m "qué cambia"`.

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
