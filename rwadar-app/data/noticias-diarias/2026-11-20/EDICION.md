# Edición de noticias · 20/11/2026 (viernes) · notas del editor

Editor: Claude (subagente de la mañana automática). Archivos entregados:
`editor/noticias-2026-11-20.json` (5 noticias: **ninguna de «Hoy»** y 5 de
«Lo más importante») y `editor/titulares.json` (3 propuestas por idioma en
cada noticia, la elegida, el motivo y la foto). Guía de titulares leída entera
y atada por su SHA-256.

**En una frase:** entran dos avisos nuevos de la CNMV (18/11 y 16/11), siguen
tres noticias de la edición publicada (Robinhood, Consejo de la UE y Bit2Me
STX) con su fuente vuelta a abrir hoy, y salen dos: la de las quejas contra
plataformas cripto (fuera de los 30 días) y el aviso del 11/11 (lo releva el
del 18/11, del mismo tipo).

Comprobado por programa antes de entregar:
- `comprobar-fuentes`: «Fuentes de la edición: 5/5 responden».
- `validar --fase editor`: «13 reglas bien» (salida 0), a la primera.
- `revisarEdicion()`: sin errores; dos avisos de «cifra» en el titular del
  Consejo (27 y 50 no están tal cual en el resumen), que es el publicado y
  sale de una cuenta directa (300.000 / 6.000 = 50; los 27 Estados).

## Qué miré

1. El barrido del programa (`barrido.json`, 16:54:07 a 16:54:17 UTC) y sus
   copias en bruto: CNMV (nuevas: avisos del 16/11 y del 18/11), ESMA (nueva:
   proveedores de servicios de suministro de datos, 18/11), BOE del 20/11
   (subastas de Letras del Tesoro, contratos públicos: nada del sector),
   Consejo, BCE, EBA y Comisión (nada del sector). Las cinco fuentes de la
   edición publicada responden con HTTP 200 y la misma huella.
2. Las copias en bruto «fuera del sector», por si el filtro se dejaba algo:
   en el RSS del Consejo hay un acuerdo con el Parlamento sobre transparencia
   de productos financieros sostenibles (no es del sector) y nada sobre el
   régimen piloto DLT; el BCE trae discursos y su informe de estabilidad
   financiera (opinión y análisis, no un cambio para el particular); la EBA,
   nada del sector.
3. Yo mismo, con curl y petición normal, entre las 16:55:09 y las 16:55:18
   UTC, todas con HTTP 200 (detalle en `inventario-consultas.txt`): las cinco
   fuentes de la edición publicada, los avisos de la CNMV del 18/11, 16/11 y
   10/11, la lista de notas de prensa de la CNMV y la nota de ESMA del 18/11.

## Hoy (19 y 20/11): ninguna

- CNMV: lo último es el aviso del 18/11. Nada del 19 ni del 20/11.
- ESMA: lo último es del 18/11 y no es del sector (ver abajo).
- BOE del 20/11: nada del sector.
- Consejo, BCE, EBA y Comisión: nada del sector el 19 ni el 20/11.

No se fuerza ninguna «Hoy».

## Lo más importante (últimos 30 días, desde el 21/10)

### Nuevas

1. **Oro y acciones sin folleto: tres avisos llegan de Alemania** (CNMV,
   18/11). Portada. PDF `6b1d350e…`. La CNMV difunde tres avisos del
   supervisor alemán: «ha prohibido a … la oferta al público de oro físico
   por no haber publicado el folleto informativo o documento equivalente»,
   «ha suspendido el ofrecimiento al público de valores en forma de acciones
   … por no haber publicado el folleto» y «tiene indicios que indican que …
   está ofreciendo un producto de inversión al público sin haber publicado el
   folleto». Y «la web de la CNMV ofrece un buscador de entidades
   advertidas», que respalda el consejo prudente del «Por qué te importa».
   Entra porque el oro físico es un activo real que también se vende
   tokenizado, y el aviso es útil para el lector. No he puesto los nombres de
   las firmas: no hacen falta para entenderla. Categoría riesgo, ámbito UE.
2. **9 firmas sin registro; dos imitan a firmas registradas** (CNMV,
   16/11). PDF `d80481e5…`. Nueve entidades advertidas (contadas una a una
   en la tabla del PDF); dos marcadas «(clon)», que «no guarda relación con»
   una empresa de asesoramiento financiero (EAF) y una sociedad de capital
   riesgo, «debidamente registrada en España». La nota dice que «no figuran
   inscritas en el correspondiente registro» y «no están autorizadas para
   prestar servicios de inversión», y ofrece el buscador de entidades
   advertidas. Categoría riesgo, ámbito España. No copio el teléfono ni el
   correo de la nota.

### Las que ya estaban

Conservan `id`, `fecha`, `fuente.url` y todo su texto; solo `consultadaEl`
pasa a 2026-11-20. He vuelto a abrir cada fuente: **la misma huella SHA-256
que el barrido de hoy y que la edición publicada**, así que dicen lo mismo.

3. **Robinhood: el emisor podrá restarte Stock Tokens por costes** (09/11).
   PDF `978eea67…`.
4. **Mercados tokenizados: los 27 piden un tope 50 veces mayor** (Coreper,
   04/11). PDF `757b8851…`. En el RSS del Consejo hasta hoy no hay acuerdo
   con el Parlamento: sigue siendo una posición negociadora.
5. **España ya tiene dos mercados de valores tokenizados** (CNMV, 28/10).
   PDF `e09fadd3…`. Sigue dentro de la ventana (desde el 21/10).

## Qué salió y por qué

- **La CNMV propone atender tus quejas contra plataformas cripto** (15/10):
  su fecha queda fuera de los 30 días (la ventana empieza el 21/10) y el
  plazo de comentarios terminó el 16/11. Su fuente sigue respondiendo igual
  (`289265b2…`), pero ya no puede estar en «Lo más importante».
- **11 firmas sin registro: compruébalas antes de invertir** (CNMV, 11/11):
  su fuente sigue igual (`e781ed72…`) y la noticia sigue siendo cierta, pero
  el aviso del 18/11 es del mismo tipo (supervisores europeos, ofertas sin
  folleto), más reciente y con un activo real (oro). Tres avisos seguidos
  quitarían sitio a otros temas y el máximo es 5.

## Qué quedó fuera y por qué

- **Aviso de la CNMV del 10/11** (9 webs sin licencia, con clones): sigue
  igual (`d6d617a4…`); el del 16/11 cuenta lo mismo y es más nuevo.
- **ESMA, 18/11: responsabilidades de supervisión de los proveedores de
  servicios de suministro de datos sin cambios.** Es un asunto de
  infraestructura de datos de mercado; no cambia nada para quien invierte en
  activos tokenizados.
- **Grupo de normas de tokenización (ESMA, 09/11)** y **pagarés de Prosegur
  Cash (06/11)**: fuera por las mismas razones que el 14/11 (no es para
  particulares; es la que menos afecta al particular) y porque no caben.
- **BCE**: discursos e informe de estabilidad financiera; opinión, no hechos
  del sector.
- **Consejo, acuerdo sobre transparencia de productos sostenibles**: no es
  del sector.

## Titulares

Las cinco noticias llevan tres propuestas por idioma, distintas de verdad, y
el motivo de la elegida. No se puede usar «heredado»: la carpeta del 14/11
no tiene `titulares.json`. Las tres que ya estaban conservan el titular
publicado (son ejemplos buenos de la guía). Todos los titulares y propuestas
tienen 60 caracteres como mucho (contados por programa; tres propuestas que
pasaban se acortaron antes de entregar). Ninguno lleva promesas, consejos de
compra ni nombres de personas.

- Portada: «Oro y acciones sin folleto: tres avisos llegan de Alemania» (58)
  / «Gold and shares with no prospectus: three German alerts» (55). Dice qué
  se ofrecía y el fallo; «Alemania prohíbe…» dejaba fuera dos de los tres
  avisos y no todos son prohibiciones (uno es una suspensión y otro, indicios).
- «9 firmas sin registro; dos imitan a firmas registradas» (54) / «9
  unregistered firms; two pose as registered ones» (49): cifra y el riesgo
  concreto (que una firma se haga pasar por otra registrada), sin el
  organismo delante.

## Fotos

Todas distintas y con encaje propio; ninguna genérica, así que ningún
«faltaria».

- **Portada (18/11): `alerta-fraude`** (móvil con un gráfico en rojo de
  alerta). La portada publicada llevaba `alerta-fraude-3`; la guía (§ 4.3)
  pide no repetir la foto de la portada de ayer si hay otra del tema.
- **16/11: `pago-online`** (portátil con una página de pago desenfocada), del
  tema «Avisos y fraude»: encaja con webs que imitan a firmas registradas y
  evita poner dos fotos rojas seguidas en Inicio.
- Las demás se quedan como estaban: `acciones-movil` (Robinhood),
  `instituciones-ue-2` (Consejo) y `bolsa-madrid` (Bit2Me STX).

Nada de esto es una recomendación.
