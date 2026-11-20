# Vigilancia · 20/11/2026

Consultas hechas entre las 16:53 y las 17:04 UTC. El vigía no lee ninguna
cifra de Hausera: solo sirvió para re-fechar las búsquedas de advertencias de
«Hausera», «Holdtx» y «Prosegur» en la CNMV (16:52 UTC, «no cambia»). Todo lo
demás se abrió a mano.

## Ficha publicada

**Hausera · próximas ofertas → actualizar.**

- **Qué pasó con Alicante 3.** La preventa abrió. El 20/11 la ficha, la
  página de oportunidades y la portada dicen «PREVENTA ABIERTA». Los datos
  públicos del sitio también lo dicen: el estado pasa de COMMINGSOON a PRESALE.
  La oferta pública sigue anunciada para el 25/11/2026. Hay un banner nuevo:
  «¡Apúntate a la lista de Alicante 3! Solicitar tickets».
- **Qué no publica.** No dice cuánto se ha reservado. En Polygon, el contrato
  Alicante_3 sigue sin ningún token (0 a las 16:57 UTC). No se puede saber si
  ya está cubierta.
- **CNMV.** La emisión sigue sin inscribir. En el registro de Ursus-3 (ERIR)
  siguen las mismas 8 emisiones de Hausera, de la SPV a la SPV 8. La última
  inscripción de Hausera es del 23/10. No están ni la SPV 10 (Alicante 2) ni la
  SPV 11 (Alicante 3). Hausera y Holdtx no figuran como plataformas de
  financiación participativa y no tienen advertencias.
- **Lo que no cambia.** Los cuatro documentos de Drive (documento de emisión,
  acuerdo de reserva, dossier y documento de Alicante 2) tienen el mismo
  SHA-256 que el 13/11. Los términos y la FAQ dicen lo mismo. Alicante 2 sigue
  financiada.
- **Cambios en la tarjeta.**
  - El resumen pasa de «abre la preventa el 18/11» a «tiene la preventa
    abierta desde el 18/11 y la suscripción empieza el 25/11/2026».
  - El aviso de la inscripción pasa a «el 20/11/2026, con la preventa ya
    abierta, Alicante 3 aún no estaba inscrita».
  - La fecha del mínimo pasa al 20/11.
  - Sigue «en camino».

## Candidatas: ninguna se admite

- **Pagarés de Prosegur Cash: no admitir.**
  - La ERIR de Minos sigue igual: solo la emisión de 500.000 € del 06/11.
  - No hay comunicaciones nuevas de Prosegur Cash.
  - En la lista de ISIN de la CNMV aparece un pagaré nuevo (ES0505229338,
    3,3 M€, emitido el 18/11, vence el 20/05/2027). Su nominal es de 100.000 €
    por título: es un pagaré de su programa habitual, para profesionales, y
    nada indica que sea el tokenizado.
  - Sigue sin documento, mínimo ni destinatarios.
- **Securitize Stocks: no admitir.**
  - El mismo texto: lo ofrece Securitize Markets, LLC (EE. UU.) «to eligible
    investors in permitted jurisdictions».
  - No hay lista de países, KID ni mínimo.
- **Bonos de Profitus/Axiology: no admitir.**
  - Hay 551 proyectos y 7 abiertos.
  - Los 7 son préstamos (4 en Lituania, 1 en Letonia y 2 en España). Ningún
    bono.
- **Valorix (Bit2Me STX): no admitir.**
  - Las webs de Valorix tienen el mismo SHA-256.
  - Bit2Me sigue diciendo «previsto para diciembre de 2026».
  - La ERIR de Bit2Me STX está vacía.
- **CANDO1 (Token City): no admitir.**
  - Sigue «En estudio» en «Próximamente».
  - La ERIR de Token City solo tiene la emisión de Series A Grupo UAE.
- **Crypto.com Tokenized Stocks (UE): no admitir.**
  - La «versión nueva» de la FSMA es un cambio técnico de la página. Pesa los
    mismos 159.983 bytes y dice lo mismo: libre prestación en Bélgica desde el
    07/05/2026. No dice nada de España.
  - Los tres PDF tienen el mismo SHA-256 y la ayuda dice lo mismo.
  - Sigue sin KID público.
- **Hausera Alicante 3 como candidata propia: no admitir.**
  - Está en preventa y sin inscribir en la CNMV.
  - Se sigue en la ficha «en camino».

## Bloqueos y notas

- No se pulsó «Reservar tickets» ni «Solicitar tickets» porque piden registro.
- La ficha ESI de Ursus-3, el índice ERIR general y la EAFN nº 21 no se
  reabrieron para Hausera. El índice ERIR sí se leyó para las candidatas y es
  igual.
- Los PDF de Hausera se descargaron solo para comprobar el SHA-256 y se
  borraron, porque tienen datos personales o pesan más de 3 MB.
- Se recortaron nombres de personas en las copias de la portada de Hausera y
  de la nota de Bit2Me.
- La carpeta temporal es compartida entre agentes. Otro grupo usaba el mismo
  nombre de script (`scratchpad/s/fetch.py`), y uno de mis lanzamientos
  ejecutó el suyo, que escribe en la carpeta de «suiza». Después trabajé en
  `scratchpad/vigilancia-q7/`. Conviene que «suiza» compruebe su
  `inventario-consultas.json` por si hubo una segunda pasada hacia las
  16:56 UTC.
