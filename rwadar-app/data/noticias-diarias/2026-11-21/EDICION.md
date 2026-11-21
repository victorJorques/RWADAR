# Edición de noticias · 21/11/2026 (sábado, segundo pase) · notas del editor

Editor: Claude (subagente, ciclo manual de la tarde por la orden de la
dirección «busca noticias nuevas»). Archivos entregados:
`editor/noticias-2026-11-21.json` (5 noticias: **ninguna de «Hoy»** y 5 de
«Lo más importante») y `editor/titulares.json`. Guía de titulares leída
entera y atada por su SHA-256 (`ef8916de…`, la misma de esta mañana).

**En una frase:** entra la noticia de xStocks (tokens de más de 200 empresas
de Reino Unido y la UE, 11/11) y sale la del Consejo de la UE sobre el tope
del régimen piloto (04/11); las otras cuatro siguen letra a letra como la
edición publicada esta mañana.

Comprobado por programa antes de entregar:
- `comprobar-fuentes`: «Fuentes de la edición: 5/5 responden».
- `validar --fase editor`: «13 reglas bien» (salida 0), a la primera.
- `revisarEdicion()`: sin errores y sin avisos.

## Qué miré

1. El barrido del programa (`barrido.json`, 16:46:08 a 16:46:41 UTC) y sus
   copias en bruto. Solo marca un elemento «nuevo»: el mismo convenio del BOE
   entre un organismo de investigación y una universidad de esta mañana, que
   no es del sector. Las cinco fuentes de la edición publicada responden con
   HTTP 200 y la misma huella que la publicada. Desde la mañana no ha
   aparecido nada del sector: la CNMV sigue con el aviso del 18/11 como lo
   último; ESMA, con lo del 18/11 (proveedores de datos); el Consejo trae
   presupuesto, ayuda militar, deporte y agendas; el BCE, un discurso del
   20/11; la EBA, su resumen del 20/11; la Comisión (finanzas), el acuerdo
   sobre productos sostenibles (20/11) y un acto de educación financiera
   (18/11). Nada para quien invierte en activos tokenizados.
2. Las tres candidatas de los analistas (`pistas/candidatas.json`), como
   datos. Abrí yo mismo las tres fuentes.
3. Yo mismo, con curl y petición normal, entre las 16:48:38 y las 16:49:53
   UTC, todas con HTTP 200 (detalle en `inventario-consultas.txt`): la nota
   de xStocks, las cinco fuentes de la edición publicada (también la del
   Consejo, que sale), el fichero de entidades no conformes de MiCA de la
   ESMA y la nota de Amundi. Las cinco fuentes publicadas dan **la misma
   huella SHA-256 que el barrido de hoy**, así que dicen lo mismo.
4. La ficha de xStocks del catálogo publicado (`kraken-xstocks`), para que la
   noticia no diga nada contrario a ella.

## Hoy (20 y 21/11): ninguna

No hay nada del sector con fuente primaria del 20 ni del 21/11, y ninguna de
las candidatas es de esos días (11/11, 05/11 y 06/11). No se fuerza ninguna.

## Lo más importante (últimos 30 días, desde el 22/10)

1. **Oro y acciones sin folleto: tres avisos llegan de Alemania** (CNMV,
   18/11). Portada, igual que esta mañana. PDF `6b1d350e…`, el mismo.
2. **9 firmas sin registro; dos imitan a firmas registradas** (CNMV, 16/11).
   PDF `d80481e5…`, el mismo.
3. **Nueva: xStocks lanza tokens de más de 200 empresas europeas** (nota de
   xStocks del 11/11/2026; fuente de la empresa, primaria). La página dice
   «November 11, 2026» y sus metadatos `datePublished` 2026-11-11. Citas
   literales que la respaldan:
   - «xStocks has launched its first regional markets, bringing tokenized
     equities for 200+ of the largest UK and EU-listed companies, and every
     constituent of the DAX 40.»
   - «Each xStock is backed 1:1 by the underlying share but represents
     economic exposure only, not direct ownership.»
   - «This new batch of xStocks are available on Kraken, Kraken Pro,
     participating xStocks Alliance partners…»
   - «offered … to eligible EU customers via Payward Europe Digital Solutions
     Ltd., a company authorised and regulated by the Cyprus Securities and
     Exchange Commission» y «xStocks are not, nor will they be registered
     with any local securities regulators.»
   - «The first non-US regional markets are live on xStocks» (de ahí «son
     los primeros xStocks de fuera de EE. UU.»).
   Por qué entra: xStocks está en el catálogo de RWAdar y Kraken UE lo vende a
   particulares en España; hasta ahora solo seguía acciones de EE. UU. y ahora
   también de grandes empresas europeas. Es lo que más cambia para un
   particular en España de lo que había sin publicar. El texto no contradice
   la ficha del catálogo: dice que no te hace accionista y recoge la
   advertencia de la propia nota sobre los supervisores locales. No digo que
   «se negocien» en 360X (el matiz del verificador de los analistas): no lo
   menciono, porque al lector en España le importa dónde se ofrecen (Kraken y
   socios). Huellas: mi copia `f4542a1b…` y la del programa `66c95cf0…` son
   distintas porque la página cambia su código en cada carga, pero el texto
   visible es idéntico en las dos (lo comparé). La nota cita a un directivo;
   no lo uso (sin personas).
4. **Robinhood: el emisor podrá restarte Stock Tokens por costes** (09/11).
   PDF `978eea67…`, el mismo.
5. **España ya tiene dos mercados de valores tokenizados** (CNMV, 28/10).
   PDF `e09fadd3…`, el mismo. Sigue dentro de la ventana (desde el 22/10).

Las cuatro que siguen conservan `id`, `fecha`, `fuente.url` y todo su texto,
y ya tenían `consultadaEl` 2026-11-21 desde esta mañana: quedan idénticas a
la publicada.

## Cuál sale y por qué

**Sale «Mercados tokenizados: los 27 piden un tope 50 veces mayor»** (Consejo
de la UE, 04/11). El máximo de «Lo más importante» es 5 y la edición ya
tenía 5, así que para que entre xStocks tiene que salir una. Es la que menos
afecta hoy a un particular en España: es una posición negociadora de los
Estados, no una ley (falta pactarla con el Parlamento Europeo), y trata del
tope de las infraestructuras, no de algo que el lector pueda hacer o que le
pase. Su fuente sigue diciendo lo mismo (`757b8851…`); no sale por error,
sino por sitio. Bit2Me STX (28/10) es más antigua, pero es de España y es un
hecho ya autorizado; las dos de la CNMV y la de Robinhood afectan
directamente al lector.

## Qué quedó fuera y por qué

- **Amundi, clase tokenizada de un fondo indexado de acciones europeas
  (05/11)**: lo abrí (`f2e49500…`, publicada el 05/11). La nota no dice qué
  fondo es, no da ISIN ni documento de datos fundamentales y no dice que un
  particular en España pueda comprarla. Ya se descartó el 10/11 por lo
  mismo. No llega a desplazar a ninguna de las cinco.
- **Lituania y el fichero de entidades no conformes de MiCA de la ESMA**:
  lo abrí (`5fbe5938…`): 217 filas, 27 del Banco de Lituania, todas con
  fecha de actualización 06/11/2026 (5 con decisión del 27/10 y 22 del
  03/11). Fuera por cuatro motivos: (1) no se puede fechar la noticia: el
  06/11 es la última actualización de cada fila y el fichero se rehace cada
  semana, así que no consta cuándo se publicaron; (2) el titular tendría que
  apoyarse en una deducción («sin licencia») que la fila no dice; (3) son
  plataformas cripto sin relación con el catálogo, no activos tokenizados;
  (4) ya hay dos avisos de riesgo en la edición y no cabe sin quitar una
  noticia que afecta más al lector. Además, un fichero que cambia cada semana
  daría otra huella cada mañana.
- **Lo demás del barrido** (BOE, Consejo, BCE, EBA, Comisión): no es del
  sector (ver arriba).

## Titulares

- **xStocks (nuevo)**: tres propuestas por idioma, distintas de verdad:
  1. «xStocks lanza tokens de más de 200 empresas europeas» (52) / «xStocks
     launches tokens of over 200 European companies» (54). **Elegido.**
  2. «Las 40 del DAX alemán, ya en tokens de xStocks» (46) / «All 40 DAX
     companies now come as xStocks tokens» (47). Se queda corto: el DAX es
     solo una parte.
  3. «Empresas europeas en xStocks: tokens sin hacerte accionista» (59) /
     «European shares as xStocks tokens, but you won't own them» (57). El
     matiz es bueno, pero va mejor en el texto.
  Por qué el elegido: dice primero lo que cambia (ya hay xStocks de empresas
  europeas), con la cifra de la fuente («200+», que en el resumen es «más de
  200») y el sujeto exacto («xStocks has launched»). «Europeas» vale para
  Reino Unido y la UE. Sin promesas ni consejos.
- **Las cuatro que siguen**: el titular es el publicado y el elegido del
  20/11, y la carpeta `rwadar-app/data/noticias-diarias/2026-11-20/` tiene
  su `titulares.json` con esos mismos elegidos, así que llevan
  `"heredado": "2026-11-20"` y copian sus propuestas tal cual, como esta
  mañana.

## Fotos

Todas distintas y con encaje propio; ninguna genérica, así que ningún
«faltaria».

- **xStocks: `acciones-eeuu`** (un escritorio de operaciones de noche con dos
  monitores con gráficos de bolsa genéricos). Del tema «Acciones
  tokenizadas» quedan `acciones-eeuu` y `acciones-movil`, y esta última la
  lleva Robinhood. La foto no tiene nada de EE. UU. a la vista (sin texto ni
  banderas), así que no contradice que sean empresas europeas. Alternativas:
  `acciones-movil` y `bolsa-madrid` (las dos usadas).
- Las demás se quedan como esta mañana: portada `alerta-fraude-3` (CNMV,
  18/11), `pago-online` (CNMV, 16/11), `acciones-movil` (Robinhood) y
  `bolsa-madrid` (Bit2Me STX). Al salir la del Consejo, `instituciones-ue-2`
  queda libre.

Nada de esto es una recomendación.
