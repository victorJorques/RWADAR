# Pruebas de ataque · 1 de octubre de 2026

**Quién:** Claude, a petición de Víctor.
**Objetivo:** atacar RWAdar como lo haría alguien con malas intenciones, para
aprender qué aguanta y qué no.
**Dónde:** contra una **copia local idéntica** de la web y de la base de datos.
Desde el entorno de Claude no se puede llegar a `rwadar.pages.dev` ni a
Supabase: la red de ese entorno los bloquea. **No se ha tocado producción.**

---

## Resumen en una frase

**La web y la base aguantan todos los ataques que se probaron.** No se ha
encontrado ningún agujero que permita robar datos, cambiar contenido o
ejecutar código en el navegador de un visitante. Quedan riesgos menores y
cosas que solo se pueden comprobar contra la web real.

---

## Qué se atacó y qué pasó

### 1 · Inyectar código en la página (XSS)

**El ataque:** se metió código malicioso dentro de los datos del catálogo
(nombre de una plataforma, descripción, aval, un descarte y un enlace
`javascript:`), como si alguien hubiera conseguido colar una fila envenenada.
Después se abrió la web en un navegador real (Chromium) y se hizo clic en la
ficha.

| Prueba | Resultado |
|---|---|
| `<img onerror=…>` en el nombre | Se ve como texto. No se ejecuta. |
| `<svg onload=…>` y `</script><script>` en la descripción | Se ven como texto. No se ejecutan. |
| `<img onerror=…>` en un descarte | Se ve como texto. No se ejecuta. |
| Enlace `javascript:` en la web oficial | Rechazado: la plataforma no llega a pintarse. |
| Lo mismo **sin** la política de seguridad (CSP) | Tampoco se ejecuta: el escapado basta por sí solo. |

**Por qué aguanta:** todo lo que viene de la base pasa por `escHtml` (convierte
`<` y `>` en texto) y todos los enlaces por `urlHttps` (solo admite `https://`).

### 2 · Saltarse la política de seguridad del navegador (CSP)

**El ataque:** una página de prueba con los cuatro trucos clásicos (script en
línea, `onerror`, enlace `javascript:` y script de otro dominio), servida con
las mismas cabeceras que publica Cloudflare.

| | Sin CSP | Con la CSP de RWAdar |
|---|---|---|
| Script en línea | se ejecuta | **bloqueado** |
| `onerror` | se ejecuta | **bloqueado** |
| Enlace `javascript:` | se ejecuta | **bloqueado** |
| Script de otro dominio | se ejecuta | **bloqueado** |

Es decir: aunque algún día fallara el escapado, la CSP pararía el ataque.
**Hay dos cerraduras, no una.**

### 3 · Meter la web dentro de otra página (clickjacking)

**El ataque:** una página ajena que carga RWAdar en un `<iframe>` para engañar
al usuario con clics invisibles.
**Resultado:** el navegador se niega a cargarla (`frame-ancestors 'none'` y
`X-Frame-Options: DENY`).

### 4 · Atacar la base de datos

Se montó la base con **todas** las migraciones y se atacó como visitante
anónimo y como usuario registrado. Para ponerse en el peor caso, se simularon
además los permisos por defecto de Supabase (todo concedido salvo que se quite
a mano).

| Ataque | Resultado |
|---|---|
| Hacerse administrador (función, editar perfil, upsert) | **bloqueado** (3 de 3) |
| Ver quién escribió cada opinión (`usuario_id`) | **bloqueado** |
| Leer perfiles propios o ajenos | **bloqueado** |
| Leer dispositivos o tokens push ajenos, incluso conociendo el identificador | **bloqueado** |
| Inyección SQL por la cabecera `x-instalacion` | **bloqueado** |
| Seguir plataformas en nombre de otro dispositivo | **bloqueado** |
| Registrar un dispositivo a nombre de otro usuario | **bloqueado** |
| Leer la cola de avisos push o de correo | **bloqueado** |
| Leer la cola de moderación | **bloqueado** |
| Ver borradores del catálogo | 0 filas: invisibles |
| Descartar una plataforma | **bloqueado** |
| Publicar una opinión (cuentas en pausa) | **bloqueado** |
| Funciones privilegiadas abiertas a anónimos o registrados | **0** |
| Tablas con escritura abierta a anónimos o registrados | **0** |

### 5 · Dependencias con fallos conocidos

| Parte | Resultado |
|---|---|
| Base de datos y herramientas (`rwadar-app`) | 0 avisos |
| App móvil (`rwadar-movil`) | 10 moderados, todos en herramientas de compilación de Expo (`xcode` → `uuid`). No van dentro de la app que se ejecuta en el móvil. |
| Fallo de memoria en `uuidv5` de Expo (iOS) | **Corregido hoy** con un parche propio. Expo aún no lo ha arreglado. |

---

## Lo que se puede mejorar (de más a menos importante)

1. **Que te tumben por cuota (plan gratuito).** Cualquiera puede leer los
   datos públicos con la clave publicable; está hecho así a propósito. Si
   alguien hiciera millones de peticiones, podría agotar la cuota gratuita de
   Supabase y el proyecto se pausaría. La web seguiría enseñando su copia,
   pero sin refrescar. *No se ha probado: sería un ataque de denegación de
   servicio.* **Qué hacer:** activar las alertas de uso en Supabase y, si
   crece el tráfico, poner una caché de Cloudflare delante de las lecturas.
2. **Un script de un tercero.** La CSP permite el script de Cloudflare Web
   Analytics. Si Cloudflare fuera atacado, ese script podría hacer cualquier
   cosa en la página. Es un riesgo pequeño y aceptado a cambio de la
   analítica, pero conviene saberlo. Sin analítica, desaparece.
3. **Borrar la cuenta uno mismo está desactivado** mientras las cuentas están
   en pausa. La política de privacidad dice que los derechos se atienden por
   correo; hay que mantenerlo así hasta reabrir las cuentas.
4. **Cuando haya dominio propio:** añadir `includeSubDomains` a la cabecera
   HSTS. En `pages.dev` no aplica.
5. **El historial de Git guarda un token antiguo** de Supabase (revocado). El
   repositorio es privado y el token ya no sirve, pero si algún día se hace
   público hay que limpiar el historial antes.

## Lo que falta probar contra la web real

Para esto el entorno de Claude necesita permiso de red para
`rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`. Se cambia en la
configuración del entorno: menú del entorno → *Edit* → *Network access*.

- Que Cloudflare sirve exactamente estas cabeceras.
- Que Supabase de verdad tiene cerradas las altas y el acceso anónimo.
- Que la base en línea coincide con la del repositorio (la consulta de
  funciones abiertas debe dar 0 filas; está en `docs/COPIAS-DE-SEGURIDAD.md`).

## Cómo repetir estas pruebas

- Base de datos: `cd rwadar-app && npm run test:seguridad`.
- Web: `npm run test:web` (341 comprobaciones, incluidas las de cabeceras).
- App: `cd rwadar-movil && npm test`.

Las pruebas de navegador con datos envenenados se hicieron con scripts
desechables. Si se quieren dejar fijas, lo natural es añadirlas a
`probar-web.mjs`.
