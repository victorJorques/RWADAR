# Grupo spiko · 21/11/2026

Revisé las tres fichas de Spiko entre las 17:40 y las 18:00 UTC. Hoy es
sábado, así que Spiko no publica valores liquidativos nuevos. Partí del vigía
(17:37 UTC) y abrí a mano todo lo que el vigía no cubre: la API pública de
Spiko, las webs, los registros de la AMF y de la CNMV, la tabla de países y la
web de la gestora. Lo que el vigía dio como «no cambia» lo re-fecho con su hora
y su huella, marcado `segunVigia`: los KID en español, el folleto en inglés, los
términos, el certificado de la AMF, el folleto en GECO y las búsquedas de
advertencias de la CNMV. Hice además una búsqueda de control en la CNMV:
«Trading» da 16 páginas, así que el buscador funciona y un «sin advertencias»
es un resultado real.

## Las tres métricas, recalculadas con la serie de valores liquidativos

| Ficha | Lo publicado | Hoy (API de Spiko) | Mi cálculo | Fecha del valor liquidativo |
|---|---|---|---|---|
| Letras del Tesoro Euro | 2,45 % | 2,45 % | 2,452 % (31 días, 22/10 → 22/11) | calculado el viernes 20/11 (Spiko lo fecha el 22/11) |
| Letras del Tesoro Dólar | 4,00 % en USD | 4,00 % | 4,002 % (31 días, 20/10 → 20/11) | 20/11 |
| Spiko Euro (Smart Cash) | 2,84 % | 2,84 % | 2,837 % (7 días, viernes 13/11 → viernes 20/11) | 20/11 |

No cambia ninguna cifra. El vigía marcó «cambia» en el fondo de Letras en euros
porque la cifra publicada no tiene una fecha con la que comparar. Pero es el
mismo valor liquidativo que ya está publicado (1,063496 €, calculado el 20/11 a
las 17:18 UTC). Los próximos llegan el lunes 23/11: hacia las 18:00 UTC los de
Letras y hacia las 19:30 UTC el de Spiko Euro.

## ¿Puede invertir hoy un particular que vive en España?

- **Letras del Tesoro Euro: sí.** La sociedad del fondo (Spiko SICAV) está
  inscrita en la CNMV para venderse en España (n.º 2380, 30/01/2026). Este
  fondo existe desde 2024, antes de esa inscripción, así que queda cubierto.
  Spiko Finance, que recibe las órdenes, está inscrita en la CNMV (n.º 5325).
  La tabla de países de Spiko (13/11/2026) marca España. Hace falta abrir una
  cuenta y verificar la identidad, y no se admiten personas estadounidenses.
- **Letras del Tesoro Dólar: sí**, por lo mismo. Además está el riesgo de
  cambio euro/dólar.
- **Spiko Euro (Smart Cash): sin confirmar.** Spiko dice que sí, y su tabla
  marca España. Pero nadie más lo confirma:
  - la CNMV solo enseña la sociedad, no sus fondos uno a uno. Lo comprobé hoy
    con otra sociedad francesa, LAZARD FUNDS, y tampoco enseña sus fondos;
  - la AMF lleva dos días sin enseñar la ficha de este fondo. La página sale
    vacía, y su buscador no lo encuentra ni por el nombre, ni por el ISIN, ni
    por el número de autorización, aunque sí encuentra los otros fondos de
    Spiko;
  - la web de la gestora (Twenty First Capital) no enseña los fondos de Spiko.

  La propia Spiko escribe que un fondo creado después de la inscripción
  necesita darse de alta por su cuenta. Este fondo es de febrero o marzo de
  2026, y la inscripción en la CNMV es del 30/01/2026. Tampoco nadie lo niega,
  así que no propongo «No» ni retirarlo. Propongo que la tarjeta diga
  **«España: Sin confirmar»** en lugar de «Sí», con el texto «Sin confirmar:
  Spiko lo ofrece a residentes en España, pero ni la CNMV ni la AMF muestran
  este fondo.». El aviso que ya está publicado sigue valiendo. Lo decide el
  coordinador.

## Qué propongo en cada ficha

- **spiko-letras-del-tesoro-euro: actualizar** (solo textos). Los datos son
  los mismos. Propongo quitar del texto de la rentabilidad la fecha
  «22/11/2026»: leída hoy está en el futuro y se puede tomar por la fecha de la
  oferta. Quedaría «…con el valor liquidativo calculado el viernes 20/11/2026;
  consultado el 21/11/2026». Opcional: que «Acceso desde España» diga por qué
  («Sí: el fondo está inscrito en la CNMV y Spiko admite a residentes en España
  tras el alta y el KYC.»).
- **spiko-letras-del-tesoro-dolar: mantener.** Todo igual, con la consulta del
  21/11. Siguen los tres conflictos ya avisados: el valor liquidativo al que se
  ejecutan las órdenes, el mínimo de la clase en euros, y la web, que dice «sin
  límite de importe» cuando el folleto pone un límite del 10 %. La misma mejora
  opcional del texto de España.
- **spiko-smart-cash-euro: actualizar.** El cambio crítico es España, de «Sí»
  a «Sin confirmar» (arriba). En «Supervisor» solo cambia la fecha: «desde el
  20/11/2026 el fondo no aparece en la base pública de la AMF». Siguen
  vigentes los seis avisos. La web sigue diciendo «Interés a tipo fijo»,
  «Garantizado por contrapartes» y «Sociedad gestora Amundi», y la página para
  particulares sigue diciendo «No existen límites de retirada».

## Nada viejo ni pasado

Las tres siguen abiertas hoy: hay valor liquidativo del viernes y el botón
«Crea tu cuenta». Ninguna tarjeta lleva fechas de campaña. Las únicas fechas
son las del valor liquidativo, que están etiquetadas como tales.

## Bloqueos

- El folleto en español sigue dando error 403. Se usan el inglés y el francés,
  que no han cambiado.
- Que Spiko Euro se venda en España no se puede confirmar en ningún registro
  público.
- La AMF sigue sin publicar la ficha de Spiko Euro, por segundo día. No dice
  por qué.
- La llamada directa al buscador de la AMF con la petición de ayer devuelve
  vacío por un cambio de formato. Usé el buscador con navegador, que sí
  funciona.
- El patrimonio de Spiko Euro tiene tres cifras distintas según la fuente de
  Spiko. No se publica.

Copias en `fuentes/` (y en `fuentes/crudo/` las respuestas de la API). En la
copia de la página para particulares he recortado el nombre de una persona que
aparece en un testimonio. Las huellas están en `inventario-consultas.json`.
