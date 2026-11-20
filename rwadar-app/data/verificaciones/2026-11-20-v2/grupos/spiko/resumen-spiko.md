# Grupo spiko · 20/11/2026

Revisé las tres fichas de Spiko entre las 16:53 y las 17:04 UTC. Partí del vigía
(16:52 UTC) y confirmé a mano, en la API pública de Spiko, cada cifra que daba
como «cambia». Lo que el vigía daba como «no cambia» (KID en español, folleto en
inglés, términos, carta de la AMF, folleto en GECO y búsquedas de advertencias
de la CNMV) lo re-fecho con su hora y su huella, marcado `segunVigia`. Webs,
registros, acceso desde España y salida los abrí a mano.

## Qué cambia en cada ficha

**Spiko Letras del Tesoro Euro: actualizar.**
- La rentabilidad de 31 días baja de **2,40 % a 2,35 %** (VL del 19/11/2026,
  1,063276 €). La API dice 2,35 %. Mi cálculo con la serie de VL (19/10 → 19/11)
  da 2,350 %. La web y data.spiko.io dicen lo mismo.
- No cambian ni los documentos (mismo SHA-256), ni los registros (AMF, CNMV,
  REGAFI), ni el acceso desde España, ni los avisos.

**Spiko Letras del Tesoro Dólar: actualizar.**
- La rentabilidad de 31 días en dólares baja de **3,98 % a 3,97 %** (VL del
  19/11/2026, 1,103445 $). Mi cálculo con la serie da 3,967 %.
- Siguen igual los conflictos ya avisados: la web dice «sin límite de importe»
  y el folleto pone un límite del 10 %; la clase en euros tiene un mínimo de
  1.000 en la API.

**Spiko Euro (Smart Cash): actualizar.**
- La cifra sigue en **2,84 %**. Cambia la fecha: VL del 20/11/2026, 1,017886 €.
  Mi cálculo con la serie da 2,837 % a 7 días (de viernes a viernes) y 2,834 %
  a 35 días.
- **Novedad:** la ficha pública del fondo en la base de la AMF (GECO c124199)
  ya no se publica hoy. La página sale vacía, la API dice `"published": false`
  y el buscador de la AMF ya no encuentra el fondo, aunque sí los otros fondos
  de Spiko. Lo comprobé dos veces (16:54 y 17:03 UTC). No consta que se haya
  retirado la autorización: el certificado de la AMF (23/02/2026) y el folleto
  siguen igual. Propongo cambiar el texto de «Supervisor» para que no remita a
  esa ficha y quitar su enlace de las fuentes.
- **Comercialización en España:** sigue sin confirmarse en ningún registro, y
  nadie la niega. La CNMV solo muestra la SICAV (n.º 2380, comercializadora
  Aldana Capital) y no sus fondos. La AMF ya no muestra la ficha del fondo y
  ESMA no tiene resultados. La tabla de Spiko, actualizada el 13/11, sigue
  marcando España en Smart Cash. Como nadie lo niega, no procede retirar la
  ficha. Sigue vigente el aviso publicado.
- Siguen igual la web («Interés a tipo fijo», «Garantizado por contrapartes»,
  «Sociedad gestora Amundi») y la página para particulares («No existen límites
  de retirada»). Siguen vigentes los avisos.

## Otros cambios menores (solo expediente)

- La tabla de países de docs.spiko.io dice ahora «Last updated: November 13,
  2026» y ya no incluye Bélgica. España no cambia.
- Patrimonio de Spiko Euro: siguen tres cifras distintas de Spiko (API
  1.860,94 M€, data.spiko.io 2.108,89 M€, web 2.416 M€). No se publica.

## Bloqueos

- El folleto en español sigue dando 403. Se usan el inglés y el francés (mismo
  SHA-256).
- Ninguna fuente pública confirma que Spiko Euro se comercialice en España.
- No sé por qué la AMF ha dejado de publicar la ficha de Spiko Euro. Hay que
  volver a mirarla en el próximo ciclo.

## Para el coordinador

Las VL de los dos fondos T-Bills (Euro y Dólar) se esperan hoy hacia las
18:00 UTC. Si la entrega se monta después, hay que volver a leer la API y fechar
con la VL del 20/11. La próxima VL de Spiko Euro llega el lunes 23/11, así que
la del 20/11 vale para hoy.
