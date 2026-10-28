# Seguridad web · revisión acotada del 28/10

**Aplicado y observado hoy:** `https://rwadar.pages.dev/` y `/acceso` responden 200 con CSP sin scripts/estilos inline, HSTS, DENY, nosniff, COOP/CORP y permisos limitados. `/api/acceso/sesion` sin cookie responde 401, JSON y `private, no-store`; una ruta API no admitida responde 404. Cuatro GET públicos, sin credenciales ni escrituras.

**Fuente revisada:** BFF con cookie `__Host-`, HttpOnly/Secure/SameSite; POST exige Origin propio y JSON; valida Auth y `mi_perfil` antes de dar identidad, también para detectar revocación. Rutas/métodos cerrados, entrada máxima 16 KiB, respuesta privada 128 KiB y plazo de 8 s. El callback elimina el fragmento y muestra mensajes mediante textContent. No se encontró un defecto crítico nuevo que justifique cambiar el producto.

**Evidencia conservada:** las pruebas Auth y las 37 dirigidas previas, la lectura SQL del 26/10 (RLS de perfiles/vigilancia conservado) y los ensayos de SQL27 se reutilizan por su alcance; no se repitió ninguna suite. No se comprobó de nuevo SQL remoto, sesiones reales, dependencias ni configuración de paneles.

**No consta terminado:** SQL27 de comunidad está preparado y pasó 64 comprobaciones locales; el informe del 22/10 no acredita su aplicación y la interfaz sigue OFF. No debe abrirse para dar por cerrado un refuerzo de seguridad.

**Pendiente de configuración y coordinación:** CAPTCHA/Turnstile no tiene integración en este BFF; tampoco hay limitador propio de intentos. La protección real de Auth/WAF y el inventario de redirecciones necesitan comprobación de panel. Activar CAPTCHA sin adaptar web y Android bloquearía clientes. SMTP Gmail y recepción sí se acreditaron el 24/10; no se revalidaron hoy ni se enviaron correos. MFA, protección de contraseñas filtradas y permisos de administración no se pueden certificar por HTTP público.

Fuentes locales: `rwadar-acceso/servidor.mjs`, `compilar.cjs`, `rwadar-site/assets/acceso.js`, `docs/VERIFICACION-ACCESO-PUBLICO-2026-10-26.md`, `docs/VERIFICACION-SEGURIDAD-COMUNIDAD-2026-10-22.md`, `docs/VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md`. Sin cambio de producto, SQL, Auth, correo ni publicación.
