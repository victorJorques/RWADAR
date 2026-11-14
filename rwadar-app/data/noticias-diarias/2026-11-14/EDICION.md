# Edición de noticias · 14/11/2026 (sábado) · notas del editor

Editor: Claude (subagente de la mañana automática). Archivos entregados:
`editor/noticias-2026-11-14.json` (5 noticias: **ninguna de «Hoy»** y 5 de
«Lo más importante») y `editor/titulares.json` (3 propuestas por idioma en
cada noticia, la elegida y la foto). Guía de titulares leída entera y atada
por su SHA-256 (`ef8916de…`).

**En una frase:** son las mismas cinco noticias que ayer, con sus fuentes
vueltas a abrir hoy (byte a byte iguales), la fecha de consulta al 14/11 y
**otra foto en la portada**. No hay nada del 13 ni del 14/11 con fuente
primaria que sea del sector.

Comprobado por programa antes de entregar:
- `comprobar-fuentes`: «Fuentes de la edición: 5/5 responden».
- `validar --fase editor`: «13 reglas bien» (salida 0), a la primera.
- Diferencias con la edición publicada (`diff`): `actualizadoEl` y los cinco
  `consultadaEl` pasan a 2026-11-14, y la portada cambia `alerta-fraude` por
  `alerta-fraude-3`. Ningún texto cambia.

## Qué miré

1. El barrido del programa (`barrido.json`, 12:57:49 a 12:58:21 UTC) y sus
   copias en bruto: un solo elemento nuevo del sector desde el 13/11 (BOE) y
   las cinco fuentes de la edición respondiendo con HTTP 200.
2. Las copias en bruto de las fuentes «fuera del sector», por si el filtro se
   dejaba algo: Consejo de la UE (RSS hasta el 14/11), BCE (RSS: solo
   discursos y datos bancarios), EBA (solo alertas de correo), Comisión FISMA
   (la página no la leyó el programa, 0 elementos; la miré a mano: lo último
   es del 12/11, auditoría de sostenibilidad, y del 11/11, competitividad
   bancaria; nada del sector) y ESMA (lo último sigue siendo del 09/11).
3. Yo mismo, con curl y petición normal, entre las 12:59:55 y las 13:01:39
   UTC, todas con HTTP 200 (detalle en `inventario-consultas.txt`): las cinco
   fuentes de la edición, la lista de notas de prensa de la CNMV, la nota de
   la CNMV del 10/11, el BOE del día (la resolución de la CNMV), la página
   española de Robinhood, la lista de ESMA de infraestructuras DLT, el
   documento ST 14900/26 del Consejo y la lista de noticias de ESMA.
4. Dos búsquedas web (modo estándar) como pista: «tokenización CNMV noviembre
   2026 valores tokenizados» y «tokenized securities Europe 13 November
   2026». Nada fechado el 13 o el 14/11; solo artículos antiguos de medios.

## Hoy (13 y 14/11): ninguna

- **CNMV:** la lista de notas de prensa sigue empezando por la del 11/11
  13:00. Nada del 12, 13 ni 14/11 (es sábado).
- **ESMA:** lo último es del 09/11 (grupo de normas de tokenización).
- **BOE del 14/11:** el único elemento nuevo del barrido es una resolución
  de la CNMV que publica las sanciones firmes a Construcciones y Auxiliar de
  Ferrocarriles, SA: 350.000 euros por una infracción muy grave y 50.000
  euros por una grave, por notificar con retraso operaciones con acciones
  propias (Ley 6/2023, art. 106). Es una empresa cotizada de la bolsa de
  siempre y una obligación de transparencia; no tiene que ver con activos
  tokenizados ni cambia lo que un particular puede comprar en el sector.
  **Fuera**, como la sanción del BOE del 12/11. El barrido omitió además otro
  elemento del BOE por llevar un nombre de persona; no lo he abierto.
- Consejo, BCE, EBA y Comisión: nada del sector el 13 ni el 14/11.

No se fuerza ninguna «Hoy».

## Lo más importante (últimos 30 días, desde el 15/10)

Las cinco ya estaban publicadas y conservan `id`, `fecha` y `fuente.url`.
He vuelto a abrir cada fuente: **la misma huella SHA-256 que el barrido de
hoy y que la verificación del 13/11**, así que dicen lo mismo y
`consultadaEl` pasa a 2026-11-14. Además he releído la frase que respalda
cada titular y cada cifra.

1. **11 firmas sin registro: compruébalas antes de invertir** (CNMV, 11/11).
   PDF `e781ed72…`. Seis avisos de Austria, cuatro de Países Bajos y uno de
   Alemania (6 + 4 + 1 = 11); el alemán prohibió a una de ellas ofrecer
   acciones al público por no publicar el folleto; «la web de la CNMV ofrece
   un buscador de entidades advertidas». Es la portada (la más reciente).
2. **Robinhood: el emisor podrá restarte Stock Tokens por costes** (09/11).
   PDF `978eea67…`: «Supplement dated 09 November 2026», aprobado por la FMA
   «on 09 November 2026», «may include proportionately reducing the number of
   Products held by such Investors», y España en la lista de notificaciones.
   La página española de Robinhood (huella nueva, es HTML dinámico) sigue
   diciendo «Explora más de 2.000 Classic Stock Tokens…»: respalda «En
   España, Robinhood solo vende hoy los Classic».
3. **Mercados tokenizados: los 27 piden un tope 50 veces mayor** (Coreper,
   04/11). ST 13779/1/26 REV 1 (`757b8851…`): «EUR 6 billion» y «shall not
   exceed EUR 300 billion»; ST 14900/26 (`54f5eeef…`): «approved by Coreper.
   Part 2, on 04.11.2026». En el RSS del Consejo hasta hoy no hay acuerdo con
   el Parlamento: sigue siendo una posición.
4. **España ya tiene dos mercados de valores tokenizados** (CNMV, 28/10). PDF
   `e09fadd3…`: «será operada por Bit2Me Security Tokens Exchange STX, A.V.» y
   «se podrán negociar acciones y bonos representados en TRD». La lista de
   ESMA (`8f223820…`, la misma de ayer) da dos en España: Securitize
   (26/11/2025) y Bit2Me STX (27/10/2026).
5. **La CNMV propone atender tus quejas contra plataformas cripto** (CNMV,
   15/10). PDF `289265b2…`: «Los comentarios pueden enviarse por escrito hasta
   el próximo 16 de noviembre». El plazo sigue vivo hoy.
   **Ojo para mañana (15/11):** su fecha (15/10) sale de la ventana de 30
   días (desde el 16/10), así que mañana tiene que salir de la edición. La
   sustituta natural es la de los pagarés de Prosegur Cash (06/11) o el aviso
   de la CNMV del 10/11 (ver abajo); hay que volver a abrir su fuente.

## Titulares

Los cinco elegidos son los publicados, que ya siguen la guía (cuatro son sus
ejemplos buenos y el quinto es su «Mejor»). No había carpetas de días
anteriores con `titulares.json` (`rwadar-app/data/noticias-diarias/` solo
tiene el LEEME), así que no se puede usar «heredado»: cada noticia lleva tres
propuestas por idioma, distintas de verdad (otro ángulo), y el motivo de la
elegida. Todas de 60 caracteres como mucho (contados por programa; dos que
pasaban, 61 y 62, se acortaron antes de entregar). Ninguna lleva promesas,
consejos de compra ni nombres de personas.

## Fotos

- **Portada: `alerta-fraude` → `alerta-fraude-3`.** La guía (§ 4.3) pide
  cambiar la foto de la portada si ayer llevaba la misma y hay otra del
  tema; ayer la portada era esta misma noticia con `alerta-fraude`. De las
  otras de «Avisos y fraude», `alerta-fraude-3` (dos luces rojas de aviso en
  un muro, reflejadas en el suelo mojado) es la que mejor dice «advertencia»;
  `alerta-fraude-2` (un móvil roto en el asfalto) sugiere una pérdida ya
  ocurrida, y `pago-online` es más de pagos. Miré las dos tomas a 480 px.
- Las demás se quedan como estaban, todas con encaje propio y distintas
  entre sí: `acciones-movil` (acciones tokenizadas), `instituciones-ue-2`
  (una sala de reuniones vacía: la reunión de los embajadores),
  `bolsa-madrid` (bolsas y mercados, en España) y `documentos-consulta`
  (consultas y reclamaciones). Ninguna genérica, así que ningún «faltaria».

## Qué quedó fuera y por qué

- **Sanción de la CNMV a Construcciones y Auxiliar de Ferrocarriles (BOE
  del 14/11):** fuera del sector (ver «Hoy»).
- **Aviso de la CNMV del 10/11 (9 webs sin licencia, con clones de XTB y
  PJT).** Sigue válido (PDF `d6d617a4…`, el mismo que el 13/11). Fuera porque
  «Lo más importante» ya tiene 5 (el máximo) y el aviso del 11/11 cubre lo
  mismo para el lector (comprobar antes de invertir); dos avisos seguidos
  quitarían sitio a otros temas. Candidata para mañana.
- **Pagarés de Prosegur Cash en registro DLT (06/11).** No lo he vuelto a
  abrir hoy: no cabe (máximo 5) y ayer ya quedó fuera por ser la que menos
  afecta al particular. Candidata para mañana.
- **Grupo de normas de tokenización (ESMA, BCE y Comisión, 09/11).** La guía
  lo pone como ejemplo de titular vago y de noticia que no es para
  particulares: fuera, como ayer.
- **CNMV, otras notas recientes** (fortaleza de los mercados, 06/11; código
  de buen gobierno de las cotizadas, 03/11; preguntas y respuestas sobre
  folletos, 28/10; mercados privados, 27/10): no son del sector o no cambian
  nada para quien invierte en activos tokenizados.
- **Discursos del BCE** (13/11 y anteriores): opinión, no hechos; fuera.
- **Lo que salió en las búsquedas** (artículos de medios sobre Securitize,
  Bit2Me, emisiones de deuda tokenizada, régimen piloto): todo antiguo o sin
  fecha del 13-14/11, y solo medios; ninguna pista nueva.

Nada de esto es una recomendación.
