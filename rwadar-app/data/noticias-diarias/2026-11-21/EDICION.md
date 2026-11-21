# Edición de noticias · 21/11/2026 (sábado) · notas del editor

Editor: Claude (subagente de la mañana automática). Archivos entregados:
`editor/noticias-2026-11-21.json` (5 noticias: **ninguna de «Hoy»** y 5 de
«Lo más importante») y `editor/titulares.json` (los cinco titulares
heredados del 20/11, el motivo y la foto). Guía de titulares leída entera y
atada por su SHA-256 (`ef8916de…`, la misma que ayer).

**En una frase:** hoy no hay nada nuevo del sector con fuente primaria, así
que siguen las mismas cinco noticias de la edición publicada, con su fuente
vuelta a abrir hoy (la misma huella que ayer); solo cambian las fechas de
consulta y la foto de la portada.

Comprobado por programa antes de entregar:
- `comprobar-fuentes`: «Fuentes de la edición: 5/5 responden».
- `validar --fase editor`: «13 reglas bien» (salida 0), a la primera.
- `revisarEdicion()`: sin errores; los dos avisos de «cifra» de siempre en
  el titular del Consejo (27 y 50 no están tal cual en el resumen), que sale
  de una cuenta directa (300.000 / 6.000 = 50; los 27 Estados).

## Qué miré

1. El barrido del programa (`barrido.json`, 15:18:52 a 15:19:21 UTC) y sus
   copias en bruto. Desde el 20/11 solo marca un elemento «nuevo»: un
   convenio del BOE entre un organismo de investigación y una universidad,
   que no es del sector (lo ha cogido el filtro por alguna palabra suelta).
   Las cinco fuentes de la edición publicada responden con HTTP 200 y la
   misma huella que la publicada.
2. Las copias en bruto «fuera del sector», por si el filtro se dejaba algo:
   - **CNMV**: lo último es el aviso del 18/11. Nada del 19, 20 ni 21/11.
   - **ESMA**: lo último es del 18/11 (proveedores de suministro de datos),
     que ya se descartó ayer.
   - **BOE del 21/11** (285 disposiciones): leí todos los títulos con
     palabras del sector. Hay una resolución del Banco de España que cambia
     las cláusulas de sus operaciones de política monetaria (con bancos, no
     con particulares), los cambios del euro del 20/11 y los precios del
     tabaco. Nada para quien invierte en activos tokenizados.
   - **Consejo de la UE** (20 y 21/11): presupuesto plurianual de la UE,
     cumbre UE-Reino Unido, ayuda militar, deporte, protección civil y una
     declaración del Eurogrupo sobre puestos del BCE. Nada del sector.
   - **Comisión (finanzas), 20/11**: celebra el acuerdo político sobre la
     transparencia de los productos financieros sostenibles. Ayer ya se dejó
     fuera la misma noticia del Consejo: no es del sector.
   - **BCE**: un discurso del 20/11 y el informe de estabilidad financiera
     del 18/11; opinión y análisis, no un cambio para el particular.
   - **EBA**: el resumen del 20/11 trae la resistencia de los bancos de la
     UE, grupos de bancos de fuera de la UE y preguntas técnicas de
     información bancaria. Nada del sector.
3. Yo mismo, con curl y petición normal, entre las 15:21:26 y las 15:21:53
   UTC, todas con HTTP 200 (detalle en `inventario-consultas.txt`): las cinco
   fuentes de la edición publicada, la lista de notas de prensa de la CNMV,
   el RSS de ESMA y el del Consejo. Las cinco fuentes dan **la misma huella
   SHA-256 que el barrido de hoy y que el inventario de ayer**, así que dicen
   lo mismo. Releí además el texto de los tres PDF de la CNMV para confirmar
   las frases que respaldan cada titular.

## Hoy (20 y 21/11): ninguna

No hay nada del sector con fuente primaria del 20 ni del 21/11 (ver arriba).
No se fuerza ninguna «Hoy».

## Lo más importante (últimos 30 días, desde el 22/10)

Siguen las cinco de la edición publicada. Conservan `id`, `fecha`,
`fuente.url` y todo su texto; solo `consultadaEl` pasa a 2026-11-21 (la
fuente responde y dice lo mismo) y, en la portada, `imagen`.

1. **Oro y acciones sin folleto: tres avisos llegan de Alemania** (CNMV,
   18/11). Portada. PDF `6b1d350e…`. Cita: «ha prohibido a … la oferta al
   público de oro físico por no haber publicado el folleto informativo o
   documento equivalente»; las otras dos son una suspensión de una oferta de
   acciones y unos indicios de oferta de un producto de inversión, ambas sin
   folleto.
2. **9 firmas sin registro; dos imitan a firmas registradas** (CNMV, 16/11).
   PDF `d80481e5…`. Nueve entidades en la tabla, dos marcadas «(clon)»; la
   nota dice que «no figuran inscritas en el correspondiente registro» y «no
   están autorizadas para prestar servicios de inversión».
3. **Robinhood: el emisor podrá restarte Stock Tokens por costes** (09/11).
   PDF `978eea67…`.
4. **Mercados tokenizados: los 27 piden un tope 50 veces mayor** (Coreper,
   04/11). PDF `757b8851…`. En el RSS del Consejo hasta hoy no hay acuerdo
   con el Parlamento: sigue siendo una posición negociadora.
5. **España ya tiene dos mercados de valores tokenizados** (CNMV, 28/10).
   PDF `e09fadd3…`. Cita: «En Bit2MeSTX se podrán negociar acciones y bonos
   representados en TRD». Sigue dentro de la ventana (desde el 22/10).

No sale ninguna: las cinco siguen dentro de los 30 días y el máximo de «Lo
más importante» es 5, así que no hay sitio para otra sin quitar una.

## Qué quedó fuera y por qué

- **Aviso de la CNMV del 11/11** y **del 10/11**: los relevan los del 18/11 y
  16/11, del mismo tipo y más nuevos (lo mismo que ayer).
- **ESMA, 18/11 (proveedores de suministro de datos)**: infraestructura de
  datos de mercado; no cambia nada para quien invierte en activos
  tokenizados.
- **Grupo de normas de tokenización (09/11)** y **pagarés de Prosegur Cash
  (06/11)**: fuera por las mismas razones que el 14 y el 20/11 (no es para
  particulares; es la que menos afecta al particular) y porque no caben.
- **Acuerdo sobre la transparencia de productos sostenibles** (Consejo,
  19/11; Comisión, 20/11): no es del sector.
- **Banco de España en el BOE del 21/11** (cláusulas de política monetaria):
  afecta a las operaciones con bancos, no al particular.

## Titulares

Los cinco titulares son los publicados y los elegidos el 20/11, y la carpeta
`rwadar-app/data/noticias-diarias/2026-11-20/` tiene su `titulares.json` con
esos mismos elegidos, así que llevan `"heredado": "2026-11-20"`. Copio sus
propuestas de ayer tal cual (no hay propuestas nuevas). Siguen cumpliendo la
guía: la fuente no ha cambiado, tienen 60 caracteres como mucho y no llevan
promesas, consejos de compra ni nombres de personas.

## Fotos

Todas distintas y con encaje propio; ninguna genérica, así que ningún
«faltaria».

- **Portada (18/11): `alerta-fraude-3`** (una luz roja de aviso en un muro
  de hormigón). Ayer la portada era esta misma noticia con `alerta-fraude`;
  la guía (§ 4.3) pide cambiarla si hay otra del tema. Del tema «Avisos y
  fraude» quedaban `alerta-fraude-2` y `alerta-fraude-3` (`pago-online` la
  lleva la del 16/11). Elijo la luz de aviso porque es la más clara para
  «tres avisos»; el móvil roto de `alerta-fraude-2` sugiere un daño ya
  hecho, que la noticia no cuenta.
- Las demás se quedan como estaban: `pago-online` (16/11), `acciones-movil`
  (Robinhood), `instituciones-ue-2` (Consejo) y `bolsa-madrid` (Bit2Me STX).

Nada de esto es una recomendación.
