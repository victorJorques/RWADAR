# Codex: empieza aquí

*Escrito por Claude el 5 de octubre de 2026, para que retomes RWAdar sin
perder tiempo. Se lee en cinco minutos.*

**En una frase:** todo el trabajo, el tuyo y el de Claude, está en `main` con
las pruebas en verde. La web pública todavía no lo enseña porque falta una
clave de Cloudflare que tiene que crear Víctor.

---

## 1. Ponte al día

Si tienes cambios sin subir en tu carpeta, **guárdalos primero** para no
perderlos:

```bash
git status --short --branch
# si sale algo tuyo sin subir:
git switch -c codex/trabajo-pendiente
git add <tus archivos>
git -c user.name="Codex" -c user.email="noreply@openai.com" commit
```

Después:

```bash
git switch main
git pull
npm ci && npm ci --prefix rwadar-app && npm ci --prefix rwadar-movil
npm test
```

Tiene que terminar sin fallos: **web 499, app móvil 126** y la base de datos
en verde. `npm --prefix rwadar-app run auditar:relanzamiento` dice
**«LISTO PARA CORTE FINAL»**.

---

## 2. Qué está hecho

Todo está en `main`. «Sin publicar» significa que está listo, pero el público
aún no lo ve.

| Qué | Estado | Dónde mirar |
|---|---|---|
| Catálogo siempre disponible | **En producción** desde el 2/10 | `RUNBOOK.md`, «Retirar el catálogo» |
| Copias de seguridad | **Activas**, cada noche | `docs/COPIAS-DE-SEGURIDAD.md` |
| RWAdar Academy (7 de 9 lecciones) | Sin publicar | `rwadar-academy/`, `node rwadar-academy.js` |
| Barra del móvil: Inicio · Buscar · Academy · Perfil | Sin publicar (web) / sin compilar (app) | apartado 3 |
| **Tus tarjetas nuevas** + botón «☆ Guardar» | Sin publicar. Integradas sin quitar nada tuyo | `rwadar-20260820.js`, `componentes/Ofertas.js` |
| Noticias de Inicio | Sin publicar | `rwadar-noticias/LEEME.md` |
| Comunidad: una publicación al día por cuenta | Preparada y **apagada** | `rwadar-app/db/27_comunidad.sql` |
| Cuentas, fase 1 (alta, entrar, recuperar, lista, borrar) | Preparadas y **apagadas** | `docs/tareas/REABRIR-CUENTAS.md` |
| Revisión de seguridad | Hecha el 5/10 | `docs/seguridad/REVISION-SEGURIDAD-2026-10-05.md` |
| App 1.2.0 | Lista, sin compilar | `rwadar-movil/LEEME.md`, «Compilar desde GitHub» |
| Manual de Eric corregido | Falta el visto bueno de Eric | `docs/manual/LEEME.md` |

---

## 3. La barra del móvil (lo que pidió Víctor)

Igual en la web (en el móvil; el escritorio no cambia) y en la app:

| Pestaña | Qué hay |
|---|---|
| **Inicio** | Noticias de RWAdar (si una se publicó en redes, lleva el enlace a esa publicación), la comunidad como «próximamente» y atajos a Buscar y Academy. |
| **Buscar** | Todas las ofertas y todas las empresas, el buscador y los descartes. |
| **Academy** | Las lecciones y el progreso, que se guarda solo en el dispositivo. |
| **Perfil** | La cuenta (en pausa), las empresas guardadas, las ofertas guardadas, los avisos como «próximamente», privacidad, sonido, borrar lo guardado, descargar CSV y contacto. |

- Web: `rwadar-site/index.html` (paneles `movilPanelInicio`, `movilPanelRadar`,
  `movilPanelAcademy`, `movilPanelMas`) y `rwadar-20260820.js`.
- App: `componentes/Navegacion.js`, `componentes/Inicio.js` y `App.js`.
- **Añadir una noticia:** editar `rwadar-noticias/noticias.json` y ejecutar
  `node rwadar-noticias.js`.
- **Comunidad:** cuando se abran las cuentas, se enciende con
  `PUBLICACIONES_REMOTAS=true` y la migración 27. Antes hay que publicar las
  normas. Detalle en `REABRIR-CUENTAS.md`, apartado «Comunidad».

---

## 4. Lo que falta, en orden

| # | Qué | Quién |
|---|---|---|
| 1 | Crear el secreto `CLOUDFLARE_API_TOKEN` en GitHub (`OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub»). | **Víctor** |
| 2 | Publicar: *Actions › Publicar web › preview*, revisar y luego *produccion*. **Antes del 7/10**: el 7 se cumplen los 7 días del manifiesto de `estado.json` y la compuerta se cierra. Después hay que renovar la revisión (paso 2 de `OPERACION-LANZAMIENTO.md`). | Claude o tú, con permiso de Víctor |
| 3 | Crear el secreto `EXPO_TOKEN`. | **Víctor** |
| 4 | Compilar la app 1.2.0: *Actions › Compilar app Android*. Probar el APK en un móvil real antes de subirlo a la página de descargas. | Claude o tú, con permiso de Víctor |
| 5 | Abrir las cuentas: pasos 1 a 3 de `REABRIR-CUENTAS.md` (remitente de correo, ajustes de Auth y migración 26). | **Víctor**; después Claude o tú |
| 6 | Elegir **una sola** corrección de iPhone (apartado 5). | Víctor decide; antes de la primera compilación de iPhone |
| 7 | Renovar la revisión del catálogo. Venció el 5/10: la web avisa, pero no se vacía. | Tú o Claude |
| 8 | Actualizar Postgres, con una copia de seguridad descargada y probada antes. | Víctor; `COPIAS-DE-SEGURIDAD.md` |
| 9 | Tiendas, dominio propio, visto bueno de Eric e ingresos. | **Víctor** |

---

## 5. La única decisión técnica abierta: iPhone

Hay dos correcciones para el mismo fallo de memoria de Expo (`Uuidv5.swift`):

- **La de Claude:** `rwadar-movil/scripts/parchear-expo-uuidv5.cjs`. Se aplica
  en cada `npm install` y es la que está **activa**.
- **La tuya:** `rwadar-movil/lib/config-ios-uuid-seguro.js`. Se aplica en el
  `prebuild` de iOS. Se conserva con sus pruebas, pero **no está registrada**
  en `app.json`.

Las dos juntas rompen la compilación de iPhone: tu plugin ve una huella que
no reconoce y se para, como debe. Así que nunca hay que activar las dos. Al
elegir la tuya: registrarla en `app.json` y borrar el script, su prueba, el
`postinstall` de `rwadar-movil/package.json`, sus líneas de `.easignore`, el
paso «Aplicar el parche…» de `ci.yml` y la mención del parche en el nombre de
un paso de `compilar-app.yml`.

---

## 6. Ramas

Trabaja sobre `main`. Todas las ramas están ya dentro de `main`, salvo estas
dos, que no hay que unir:

- `claude/tarjetas-al-dia`: un duplicado de la integración de tus tarjetas. Se
  puede borrar.
- `claude/rivals-analysis-platform-xriobj`: un proyecto de agosto que no es de
  RWAdar. No se toca.

Tu `mejora-tarjetas-local` ya está entera en `main`.

---

## 7. Reglas

1. Firma como **Codex**:
   `git -c user.name="Codex" -c user.email="noreply@openai.com" commit`,
   con `Co-Authored-By: Codex <noreply@openai.com>` al final.
2. Sin permiso de Víctor en ese momento no se publica, no se ejecuta SQL en
   línea y no se compila con EAS.
3. El catálogo está siempre visible, salvo que Víctor ponga
   `public.catalogo_publicacion.retirado = true`.
4. Nada de secretos en Git. Los informes con fecha de `docs/` no se borran ni
   se mueven.
5. Si algo de Claude no te convence, díselo a Víctor **antes** de cambiarlo.
6. Al terminar, añade una entrada arriba del todo en
   [`PARA-CODEX.md`](PARA-CODEX.md).

**Más detalle:** [`PARA-CODEX.md`](PARA-CODEX.md) (registro completo, lo
último arriba), [`../INTERNO.md`](../INTERNO.md) (estado),
[`../RUNBOOK.md`](../RUNBOOK.md) y
[`../OPERACION-LANZAMIENTO.md`](../OPERACION-LANZAMIENTO.md).
