# Revisión de seguridad del 5 de octubre de 2026

*Claude, a petición de Víctor («la seguridad de la página para que no nos
hackeen»).* Revisión de lo que se publica y de lo que se prepara para reabrir
las cuentas. Sin acceso a Cloudflare ni a Supabase: lo de los paneles queda
en la lista de Víctor, al final.

## Resultado

| Qué | Cómo se comprobó | Resultado |
|---|---|---|
| Secretos en el código y en todo el historial Git | Gitleaks 8.30.1 con `rwadar-app/gitleaks.toml`, 74 commits | 10 avisos, **todos falsos**: un token de ejemplo (el prefijo de Supabase seguido solo de «x») en las instrucciones de un instalador antiguo, la clave **publicable** de Supabase (pública por diseño), un enlace público de imagen de GitBook y una cifra «API35» de un documento. Ningún secreto real. |
| Dependencias de la web y de la base de datos | `npm audit --omit=dev` en la raíz y en `rwadar-app` | 0 vulnerabilidades. |
| Dependencias de la app | `npm audit --omit=dev` en `rwadar-movil` | 24 avisos que vienen de 3 paquetes de las **herramientas de compilación** de Expo (`braces`, `node-forge`, `uuid` dentro de Metro, la CLI y el plugin de Xcode). No viajan dentro de la app ni de la web y no hay versión corregida publicada (`braces` 3.0.3 y `node-forge` 1.4.0 son las últimas). La «solución» de npm es bajar a Expo 44, que rompería la app. Se vigilan. El parche propio de uuidv5 en iOS sigue aplicándose. |
| Cabeceras de la web | `rwadar-site/_headers` y la comprobación en vivo `.github/comprobar-publicado.mjs` | CSP estricta (sin scripts ni estilos en línea, conexiones solo a Supabase y a la analítica), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP y CORP. |
| Publicación | `.github/workflows/publicar.yml` | Solo manual y solo desde `main`; permisos de solo lectura; acciones fijadas por su huella; misma compuerta que en local (aprobación, árbol limpio, Auth, CSP). |
| Integración continua | `.github/workflows/ci.yml` | En cada cambio: escáner de secretos y toda la batería de pruebas. |
| Cuentas (fase 1, aún cerradas en producción) | `probar-reabrir-cuentas.mjs` (36/36) y `ensayo-cuentas-web.mjs` (37/37) | Cada persona solo ve y toca lo suyo (probado con dos cuentas); nadie puede hacerse administrador; sin sesión no se ve nada; opiniones, moderación, dispositivos y push siguen cerrados; la sesión vive solo en la memoria de la pestaña; ninguna violación de la CSP de producción. |

## Arreglado hoy

- Dos fallos que habrían salido al abrir las cuentas: en el móvil el botón
  «Entrar» seguía bloqueado, y tras «Confirma tu correo» el botón «Entrar» se
  quedaba desactivado hasta recargar. Ya tienen prueba fija en `probar-web.mjs`.
- Opiniones (con su moderación) y avisos por correo tienen ahora interruptor
  propio: abrir las cuentas no puede abrirlos por accidente.

## Lo que tiene que hacer Víctor (15 minutos, en este orden)

1. **Verificación en dos pasos** en GitHub, Cloudflare, Supabase, Google,
   Proton y Expo. Es lo que más protege: casi todos los «hackeos» de
   proyectos pequeños empiezan por una contraseña robada.
2. **Supabase › Account › Access Tokens**
   (supabase.com/dashboard/account/tokens): un token personal da acceso a
   **todos** tus proyectos. El 27/09 seguía ahí `calix-production`, sin
   caducidad. Si nada lo usa ya, revócalo. Si lo usa CALIX, ponle caducidad.
3. **La clave de Cloudflare para publicar** (ver `docs/OPERACION-LANZAMIENTO.md`):
   créala solo con el permiso *Cloudflare Pages · Edit* y guárdala solo en
   GitHub › Settings › Secrets and variables › Actions. Si alguna vez sospechas
   que se ha filtrado: Cloudflare › My Profile › API Tokens › *Roll*.
4. **GitHub › Settings › Code security:** activa *Dependabot alerts* y, si
   aparece, *Secret scanning* con *Push protection*.
5. **Antes de anunciar las cuentas:** CAPTCHA (Cloudflare Turnstile) en
   Supabase › Authentication › Attack Protection. Pídeme el cambio de la web
   cuando lo vayas a activar (ver `docs/tareas/REABRIR-CUENTAS.md`).
