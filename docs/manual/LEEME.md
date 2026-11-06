# Manual de bienvenida «Cómo usar RWAdar» · estado

*5 de octubre de 2026 · Claude.* Entrega de Eric del 02/10/2026:
[`LEEME_ENTREGA.md`](LEEME_ENTREGA.md), [`MENSAJE.md`](MENSAJE.md) y el PDF
original sin tocar, [`RWAdar_Como_Usar_RWAdar_2026.pdf`](RWAdar_Como_Usar_RWAdar_2026.pdf)
(10 páginas, 594 KB, sha256 `035e9568…1534`).

*06/11/2026 · Claude.* La RWAdar Academy ya tiene las nueve lecciones
publicadas, y en la web cada lección se abre con una cuenta gratuita
confirmada (el índice `/academy/` y el tutorial 3D siguen públicos). Por eso
la página 9 del manual corregido ya no dice «siete lecciones publicadas … y
dos más en preparación», sino que la cuenta gratuita abre la Academy, con sus
nueve lecciones, «de los fundamentos a lo que ocurre después de emitir,
pasando por cómo leer el radar» (la 9 es «Después de emitir»; «cómo leer el
radar» es la 7). Y, por la revisión legal
([`REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`](../legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md),
punto 5.13), el párrafo de los avisos ya no promete «baja en un clic» ni
avisos «cuando una plataforma que vigila cambie de situación». Ahora dice:
«También llegarán próximamente, solo si usted los pide, los avisos de
novedades: fichas nuevas en el radar y novedades de la web y la app. Podrá
darse de baja cuando quiera, desde el enlace de cada correo o en su Perfil,
sin perder la cuenta.» Los avisos siguen apagados. PDF regenerado (sha256
`e21d0e3a…4fdf`): solo cambian esos dos párrafos de la página 9, y el resto
de páginas sale idéntico píxel a píxel a la versión del 05/10. Ojo: cada
vez que se ejecuta el script, el sha256 sale distinto aunque el contenido sea
el mismo, porque PyMuPDF pone al guardar un identificador interno (`/ID`) al
azar. Para comparar dos versiones, compara cómo se ven las páginas, no el sha256.

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
(sha256 `e21d0e3a…4fdf`, revisada el 06/11/2026). La genera [`corregir-manual.py`](corregir-manual.py)
a partir del original, que no se toca. Usa la misma letra (Carlito), con el
mismo tamaño, color e interlineado. Las páginas 1–6, 8 y 10 salen idénticas
píxel a píxel, y el texto viejo se elimina de verdad, no se tapa. Solo
cambian estas dos:

- **Página 9:** el título pasa a «Su cuenta: su lista de vigilancia».
  Arriba, lo que la cuenta hace hoy: guardar la lista y volver a ella. El
  párrafo «Por qué importa» es el de Eric, sin tocar. «Qué recibirá a partir
  de ahora» pasa a «Próximamente: las guías de la serie», con la misma tabla
  y la aclaración de que llegarán solo si la persona lo pide. La cuenta
  gratuita abre la RWAdar Academy, con sus nueve lecciones publicadas. Los
  avisos de novedades (fichas nuevas en el radar y novedades de la web y la
  app) se anuncian como próximamente, solo si la persona los pide, con baja
  desde el enlace de cada correo o en su Perfil.
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
   > **Próximamente:** las guías de la serie (comisiones y costes, guía del
   > inversor, viabilidad de la tokenización, seguridad y regulación
   > MiCA-CNMV) y los avisos de novedades (fichas nuevas en el radar y
   > novedades de la web y la app). Solo llegarán si usted lo pide, y podrá
   > darse de baja cuando quiera, desde el enlace de cada correo o en su
   > Perfil. Mientras tanto, su cuenta gratuita ya le abre la RWAdar
   > Academy: nueve lecciones publicadas, de los fundamentos a lo que ocurre
   > después de emitir, pasando por cómo leer el radar.

   (Si Eric prefiere otra redacción, vale cualquiera que no presente como
   activo lo que todavía no lo está. Desde el 06/11/2026 la Academy tiene
   las 9 lecciones publicadas, y cada una se abre con la cuenta gratuita.)

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
