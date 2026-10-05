# Manual de bienvenida «Cómo usar RWAdar» · estado

*5 de octubre de 2026 · Claude.* Entrega de Eric del 02/10/2026:
[`LEEME_ENTREGA.md`](LEEME_ENTREGA.md), [`MENSAJE.md`](MENSAJE.md) y el PDF
original sin tocar, [`RWAdar_Como_Usar_RWAdar_2026.pdf`](RWAdar_Como_Usar_RWAdar_2026.pdf)
(10 páginas, 594 KB, sha256 `035e9568…1534`).

## Qué pide Eric

Que quien cree una cuenta pueda descargarlo: un botón en la pantalla de
confirmación del registro y el mismo enlace en el correo de confirmación.
Enlace, nunca adjunto, en una URL estable (`/descargas/como-usar-rwadar.pdf`),
contando cuántos registrados lo descargan y sin pedir otra vez la contraseña.
El Checklist de Elegibilidad sigue siendo libre, sin registro.

## Revisión del contenido

Coincide con la web: los cuatro criterios son los del Método (Entidad y
permisos · Actividad y fecha · Acceso y condiciones · Riesgos y alertas), los
campos de la ficha (Estado operativo, Licencia / registro, Acceso, Alerta
crítica, Revisión editorial), los filtros (región, acceso, entrada, búsqueda),
el comparador de hasta tres, el CSV y «Fuera del radar».

**Había que corregir dos cosas antes de ofrecerlo. Ya hay una versión
corregida, pendiente del visto bueno de Eric:**
[`RWAdar_Como_Usar_RWAdar_2026_corregido.pdf`](RWAdar_Como_Usar_RWAdar_2026_corregido.pdf)
(sha256 `85f3bd5b…3b4a`). La genera [`corregir-manual.py`](corregir-manual.py)
a partir del original, que no se toca. Usa la misma letra (Carlito), con el
mismo tamaño, color e interlineado. Las páginas 1–6, 8 y 10 salen idénticas
píxel a píxel, y el texto viejo se elimina de verdad, no se tapa. Solo
cambian estas dos:

- **Página 9:** el título pasa a «Su cuenta: su lista de vigilancia».
  Arriba, lo que la cuenta hace hoy: guardar la lista y volver a ella. El
  párrafo «Por qué importa» es el de Eric, sin tocar. «Qué recibirá a partir
  de ahora» pasa a «Próximamente: las guías de la serie», con la misma tabla
  y la aclaración de que llegarán solo si la persona lo pide. La Academy
  tiene «siete lecciones publicadas … y dos más en preparación». Los avisos
  por correo se anuncian como próximamente, opcionales y con baja en un clic.
- **Página 7:** el Checklist «llegará próximamente a la web, de descarga
  libre y sin registro».

Lo que se corrigió y por qué:

1. **Sección 8 (página 9) promete lo que no existe.** Dice que la cuenta
   avisa por correo si una plataforma cae del radar, que llegará una serie de
   cuatro guías por correo «una cada diez días» y que hay baja en un clic en
   el pie de cada correo. Hoy no se envía ningún correo salvo los de Auth
   (confirmar y recuperar), y Víctor ha decidido mantener los avisos cerrados.
   El propio `LEEME_ENTREGA.md` dice «no hay secuencia de correos: eso queda
   para más adelante». Texto propuesto para sustituir la sección 8:

   > **8 · Su cuenta: su lista de vigilancia**
   >
   > Con la cuenta puede marcar las plataformas que le interesan y encontrar
   > su lista en cualquier navegador. Una verificación vale para la fecha en
   > que se hizo: vuelva a su lista y mire la fecha de revisión de cada ficha.
   >
   > **Próximamente:** avisos por correo cuando una plataforma que vigila
   > cambie de situación, y las guías de la serie (comisiones y costes,
   > guía del inversor, viabilidad de la tokenización, seguridad y regulación
   > MiCA-CNMV). Solo se activarán si usted lo pide, y podrá darse de baja en
   > un clic. Mientras tanto, la RWAdar Academy tiene siete lecciones
   > publicadas, de los fundamentos a cómo leer el radar.

   (Si Eric prefiere otra redacción, vale cualquiera que no presente como
   activo lo que todavía no lo está. La Academy publicada tiene 7 lecciones,
   no 9.)

2. **Sección 6 (página 7) remite al «Checklist de Elegibilidad RWA», que
   «se descarga libremente desde la web».** No está en la web ni en el
   repositorio: nunca nos llegó. O Eric nos manda el PDF y se publica en
   `/descargas/checklist-elegibilidad-rwa.pdf` (libre, sin registro), o la
   frase pasa a «próximamente».

## Qué está hecho (apagado hasta abrir las cuentas)

- **Web:** botón «Descargar el manual de uso (PDF)» en la pantalla «Confirma
  tu correo para entrar», y sección «Manual de uso» en «Tu cuenta». Al abrir
  el enlace del correo de confirmación, la web abre «Tu cuenta» con el manual
  a la vista. Interruptor: `MANUAL_BIENVENIDA` en
  `rwadar-site/assets/rwadar-20260820.js` (vacío = apagado).
- **Recuento:** al descargarlo desde «Tu cuenta», la base anota solo la
  fecha de la primera descarga en el propio perfil (`perfiles.manual_descargado_el`,
  migración `rwadar-app/db/26_reabrir_cuentas.sql`). Sin IP ni navegador; se
  borra con la cuenta. Las descargas desde la pantalla anterior al primer
  inicio de sesión o desde el correo no se cuentan, porque contarlas exigiría
  rastrear correos o abrir una escritura anónima en la base.
  Para verlo, en el SQL Editor de Supabase:

  ```sql
  select count(*) filter (where manual_descargado_el is not null) as descargaron,
         count(*) as cuentas
    from perfiles;
  ```

- **Ensayo:** `node rwadar-app/ensayo-cuentas-web.mjs` lo prueba encendido
  en el navegador (botón, apertura tras confirmar, PDF servido y recuento).

## Para encenderlo (con el visto bueno de Eric y las cuentas abiertas)

1. Copiar el PDF corregido a `rwadar-site/descargas/como-usar-rwadar.pdf` (siempre
   con ese nombre: las ediciones nuevas sustituyen el archivo).
2. Añadir `descargas/como-usar-rwadar.pdf` a `ARCHIVOS_PUBLICABLES` en
   `rwadar-publicacion-segura.js`, y en `rwadar-site/_headers` el bloque
   `/descargas/*` con `X-Robots-Tag: noindex` y `Cache-Control: public, max-age=3600`.
3. Poner `const MANUAL_BIENVENIDA='/descargas/como-usar-rwadar.pdf';`.
4. En Supabase › Authentication › Email Templates › *Confirm signup*, añadir
   el enlace (plantilla en `docs/tareas/REABRIR-CUENTAS.md`).
5. Pruebas, renovar la aprobación y publicar. Solo tiene sentido con las
   cuentas ya abiertas.
