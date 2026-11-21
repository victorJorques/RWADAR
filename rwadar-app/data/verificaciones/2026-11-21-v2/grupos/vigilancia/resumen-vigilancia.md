# Vigilancia · 21/11/2026

Consultas hechas entre las 17:42 y las 17:58 UTC. Todo se abrió a mano.

El vigía no lee ninguna cifra de Hausera. Solo marcaba como «cambia» dos
búsquedas de advertencias de la CNMV: «Hausera» y «Holdtx». Las abrí a mano y
**no cambian**. Las dos dicen «No hay datos disponibles», tienen el mismo
SHA-256 que leyó el vigía y la búsqueda de control («Trading») sí da
resultados. El aviso venía de cómo lee el vigía lo publicado. El 20/11 el
expediente ponía «sin advertencias (según el vigía…)», y el vigía solo
reconoce como vacío un texto que empiece por «sin coincidencias». Hoy lo dejo
escrito como «sin coincidencias («No hay datos disponibles»)» para que no se
repita.

## Ficha publicada

**Hausera · próximas ofertas → actualizar** (sigue «en camino»).

**Cómo está Alicante 3 hoy.** Igual que el 20/11.

- La ficha, la página de oportunidades y la portada dicen «PREVENTA ABIERTA»:
  preventa desde el 18/11/2026 y oferta pública desde el 25/11/2026. Botón
  «Reservar tickets».
- Los datos públicos de la web son idénticos byte a byte a los del 20/11
  (estado PRESALE). El mapa del sitio tampoco cambia.
- En Polygon, el contrato «Alicante_3» sigue con **0 tokens** (17:45 UTC). No
  se ha emitido nada. Alicante 2 mantiene sus 51.960.
- **CNMV:** la emisión sigue sin inscribir. El registro de Ursus-3 (agencia de
  valores n.º 251) tiene el mismo texto: 8 emisiones de Hausera, la última del
  23/10, y ni la SPV 10 ni la SPV 11. Hausera y Holdtx no figuran como
  plataformas de financiación participativa y no tienen advertencias. La EAFN
  n.º 21 sigue autorizada solo para asesorar.
- Los cuatro documentos de Drive tienen el mismo SHA-256. Los términos y la FAQ
  dicen lo mismo.

**¿Puede invertir hoy un particular en España?**

- **Invertir, no.** Suscribir las obligaciones solo se puede a partir del
  25/11/2026, y la emisión sigue sin inscribir.
- **Reservar, sí según la web, pero sin comprobar.** Hace falta darse de alta y
  pasar el test del emisor. Después se firma un acuerdo de reserva y se
  transfiere el dinero antes de que la emisión esté inscrita. No se comprobó
  porque pide registro.

**Fechas del evento** (documento de emisión, mismo SHA-256):

- reserva desde el 18/11;
- suscripción del 25/11/2026 al 30/06/2027;
- el 02/12/2026, si no se ha llegado al 50 % de la emisión, la emisión no sigue
  y se devuelve el dinero.

**Lo que cambia en la tarjeta** (lo que pidió Víctor):

- Mínimo corto: «Desde 100 € en Alicante 3 (20/11)» → **«Desde 100 € ·
  suscripción el 25/11»** (34 caracteres).
  - La alternativa del encargo es «Desde 100 € · abre el 25/11». Con ella
    parecería que hoy todavía no se puede hacer nada, y la reserva ya está
    abierta desde el 18/11.
- Mínimo largo: quito «(20/11)», que era el día de la consulta, y pongo el
  calendario. Queda «Desde 100 € en Alicante 3 (documento de emisión); reserva
  desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.»
- Acceso desde España: ahora dice qué se puede hacer y desde cuándo.
  «Particulares en España que pasen el alta y el test del emisor: reserva desde
  el 18/11 y suscripción desde el 25/11/2026.»
- Aviso de la inscripción: separo la fecha del evento de la de la comprobación.
  «… Alicante 3 tiene la preventa abierta desde el 18/11/2026 y el 21/11/2026
  aún no estaba inscrita en el registro de la CNMV.»
- La etiqueta «Historial publicado · 20/11/2026» pasa a «Historial que publica
  Hausera (consultado el 21/11/2026)». Las cifras son las mismas.
- El resumen, las métricas y los demás avisos solo llevan fechas del evento y
  siguen valiendo.

**Para el coordinador.** El «(20/11)» del mínimo lo ponía el motor de la
entrega. En el 20.2, DECISIONES dice: «el comienzo del alcance de “Mínimo de
inversión”, que pone el motor». Hay que evitar que lo vuelva a poner. También
hay que cambiar `minimoCorto` en `transparencia.json`.

## Candidatas: ninguna se admite

- **Pagarés de Prosegur Cash: no admitir.**
  - La CNMV tiene el mismo texto que el 20/11: solo la emisión de 500.000 €
    inscrita el 06/11 en la ERIR de Minos, sin comunicaciones nuevas y sin
    ISIN nuevos.
  - Los JSON de Prosegur Cash tienen el mismo SHA-256.
  - Sigue sin documento, mínimo ni destinatarios.
- **Securitize Stocks: no admitir.**
  - La página tiene el mismo texto: lo ofrece Securitize Markets, LLC (EE. UU.)
    «to eligible investors in permitted jurisdictions».
  - No hay lista de países, KID ni mínimo.
  - La FAQ hoy solo muestra las preguntas, sin las respuestas.
- **Bonos de Profitus/Axiology: no admitir.**
  - Hay 552 proyectos y 6 abiertos, todos préstamos (3 en Lituania, 1 en
    Letonia y 2 en España). Ningún bono.
  - La página «Bonds» solo se dirige a emisores.
- **Valorix (Bit2Me STX): no admitir.**
  - Las webs de Valorix tienen el mismo SHA-256.
  - Bit2Me sigue diciendo «previsto para diciembre de 2026».
  - La ERIR de Bit2Me STX está vacía.
- **CANDO1 (Token City): no admitir.**
  - Sigue «En estudio».
  - La ERIR de Token City solo tiene SERIES A GRUPO UAE.
- **Crypto.com Tokenized Stocks (UE): no admitir.**
  - La ficha de la FSMA es idéntica byte a byte a la del 20/11: libre
    prestación en Bélgica desde el 07/05/2026, nada de España.
  - Los tres PDF tienen el mismo SHA-256 y la ayuda dice lo mismo.
  - La app española tiene una versión nueva (3.245.02, del 19/11), con el mismo
    texto sobre el KID y sin enlace.
  - La página de divulgaciones de la UE da 301 a la portada. No se intenta
    saltar.
  - El KID y la lista de países siguen sin localizar.

## Bloqueos y notas

- No se pulsó «Reservar tickets» ni «Solicitar tickets» y no se abrió cuenta:
  es un límite firme. Que un residente en España pase el alta no está
  comprobado.
- Hausera no publica cuánto se ha reservado.
- Las fichas de Alicante 2 y 3 no llegan a «networkidle» en el navegador, pero
  el contenido carga entero. El HTML se pidió aparte con curl (200).
- Los PDF de Hausera se descargaron solo para comprobar el SHA-256 y se
  borraron, porque tienen datos personales o pesan más de 3 MB.
- Recorté un nombre de persona en la copia de la portada de Hausera. La ficha
  de la EAFN n.º 21 es de una persona física: está solo en `fuentes/crudo/`.
- `fuentes/crudo/` no debe ir a Git. Tiene, entre otras cosas, el HTML de la
  EAFN y el de las fichas de Hausera.
