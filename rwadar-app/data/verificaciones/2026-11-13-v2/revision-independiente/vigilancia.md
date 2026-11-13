# Revisión independiente · grupo «vigilancia» · 13/11/2026

No preparé estos expedientes. Volví a abrir yo mismo cada fuente primaria hoy,
13/11/2026, entre las **08:46 y las 08:54 UTC**, sin iniciar sesión, sin KYC,
sin pulsar «Reservar tickets» y sin saltar ningún filtro.

- Copias de lo leído: `fuentes/vigilancia/` (extractos en texto, sin nombres de
  personas).
- Inventario: `fuentes/vigilancia/inventario-revision.json` (URL, hora UTC,
  código HTTP, bytes y SHA-256).
- Respuestas en bruto: `fuentes/vigilancia/crudo/`, fuera de Git.
- Los PDF de Hausera llevan nombres, DNI e IBAN: los descargué, calculé su
  SHA-256, leí lo necesario y los borré.

## Veredicto

**Aprobado con cambios.** Las siete decisiones se sostienen: Hausera se mantiene
y las seis candidatas no se admiten. Hay **una corrección obligatoria**: dos
copias del grupo llevan nombres de personas físicas (último apartado). No
afecta a lo publicado ni a ninguna decisión.

| Ficha | Decisión del investigador | Mi veredicto |
|---|---|---|
| Hausera · próximas ofertas (publicada) | mantener | confirmado |
| Pagarés de Prosegur Cash | no_admitir | confirmado |
| Securitize Stocks | no_admitir | confirmado |
| Bonos de Profitus/Axiology | no_admitir | confirmado |
| Bono Valorix (Bit2Me STX) | no_admitir | confirmado |
| CANDO1 (Token City) | no_admitir | confirmado |
| Acciones tokenizadas de Crypto.com (EEE) | no_admitir | confirmado |
| Copias del grupo (datos personales) | «recortados» | **confirmado con cambios** |

No hay cambios críticos, ni `admitir_propuesta`, ni `retirar_propuesta` que
revisar. Las siete fichas son «sin cambios», así que las comprobé **todas**, no
por muestreo.

## Hausera · próximas ofertas · confirmado

**Alicante 3 sigue «PRÓXIMA OPORTUNIDAD».**

- Ficha en el navegador (https://hausera.io/propiedad/alicante_3/, 08:47:47Z,
  HTTP 200): «Preventa: 18/11/2026 09:00h», «Inicio de oferta pública:
  25/11/2026», botón «Reservar tickets» (no lo pulsé).
- Datos públicos del sitio (`page-data.json` de Oportunidades, Alicante 3 y
  Alicante 2, 08:46:06Z): **mismo SHA-256 que el investigador y que el 12/11**
  (`af4dc677…`, `8f323413…`, `2f9272ee…`).
  - Alicante 3: `COMMINGSOON`, `presaleDate 18/11/2026`, `launchDate 25/11/2026`.
  - Es el único proyecto «próximo» de los 43 del sitio (24 `CLOSED`, 14
    `FUNDED`, 4 `EXPLOTATION`). No hay ninguna operación nueva abierta.

**Alicante 2 sigue «FINANCIADA».** Ficha (08:47:16Z) y datos públicos: `FUNDED`,
`launchDate 11/11/2026`. El aviso publicado («ya figuraba como financiada el
10/11/2026, antes de su oferta pública del 11/11») sigue siendo exacto.

**Los cuatro documentos son idénticos** (descarga pública de Google Drive,
08:46:06Z), con el mismo SHA-256 que el 12/11:

- documento de emisión de Alicante 3 `9170562a…` (27 págs.);
- acuerdo de reserva con la escritura `69cbadaf…`;
- dossier `72a312e2…` (19 págs.);
- documento de Alicante 2 `d3d7dd40…`.

En el documento de emisión releí: «Emisor: HAUSERA PROPERTY MANAGER SPV 11,
S.A», «Ticket mínimo: 100,00 euros», «no es considerado un folleto
informativo», suscripción que «se inicia el 25/11/2026 y se extenderá hasta el
30/6/2027», «Plazo de Inversión: 20 meses» y devolución «una vez se haya
producido la venta efectiva del inmueble». En el acuerdo de reserva: «Los
fondos anticipados podrán ser gestionados por el Emisor…» y «libre de
comisiones y gastos para el suscriptor».

**Siguen sin inscribir en la CNMV.**

- Registro ERIR de Ursus-3, cuatro páginas
  (https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es,
  08:46:06Z–08:46:44Z): **byte a byte iguales** a las del investigador
  (`a4ca7d48…`, `067fdc76…`, `23e7b2c6…`, `bd80398d…`).
- De Hausera figuran la SPV y las SPV 2 a 8. Ninguna línea dice «SPV 9»,
  «SPV 10» ni «SPV 11». La fecha más reciente es el 23/10/2026.
- Ursus-3 es la agencia de valores nº 251, inscrita el 29/08/2013 (ficha ESI,
  08:46:45Z).
- Hausera (HOLDTX SPAIN, S.L.) no está en el listado de plataformas de
  financiación participativa (`67c47da5…`, igual que el investigador).
- Términos (https://hausera.io/terms/, 08:47:16Z): mismo texto que el
  investigador (`19c7294d…`), con «HOLDTX no actúa como empresa de servicios de
  inversión».

**En Polygon** (nodo público, 08:49:12Z), el contrato Alicante_2 tiene 51.960
tokens y el de Alicante_3, 0.

**Portada** (08:54:05Z): siguen «42 operaciones», «24 terminadas» y «128M€
financiado».

**Advertencias de la CNMV** (08:46:06Z): «Hausera» y «Holdtx» dan «No hay datos
disponibles». El buscador funciona («Trading» devuelve resultados, mismo
SHA-256 `4c1905c0…`). El PDF de otras entidades no cambia (`5e63b537…`).

**Textos de la tarjeta.** Los dos cambios opcionales del investigador están
respaldados hoy:

- el aviso refechado «El 13/11/2026 Alicante 3 aún no estaba inscrita en el
  registro de la CNMV» (comprobado a las 08:46:06Z–08:46:44Z);
- el mínimo con (13/11), porque el documento es idéntico.

Los tres textos de `resumenTarjeta` están en castellano llano, sin cifras de
rentabilidad, y no pasan de 120 caracteres:

- mínimo, 92;
- acceso desde España, 116;
- salida, 115.

Una nota sin consecuencias para el texto: la cuenta atrás de la web se calcula
con la hora del navegador. En un navegador en hora UTC marca hasta las 09:00
UTC del 18/11; a las 08:47:47Z quedaban «05 días 00 horas 11 minutos». La web no
dice en qué zona horaria están esas «09:00h». Si son hora peninsular, la
preventa abre a las 08:00 UTC. La tarjeta no da la hora, así que no hay nada
que corregir. El 18/11 conviene comprobarlo a partir de las 08:00 UTC.

## Pagarés de Prosegur Cash · confirmado

- ERIR de Minos
  (https://www.cnmv.es/portal/consultas/esi/erir_esi.aspx?nif=A23875529&lang=es,
  08:46:44Z): byte a byte igual que la del investigador (`6d7eb7cb…`). Solo
  figura la inscripción del 06/11/2026: «“1ª Emisión de Pagarés Prosegur Cash
  2026” por importe de 500.000 euros».
- Otra información relevante (`b13dcc7b…`) y lista de ISIN (`40ab22d5…`) de la
  CNMV, y los dos JSON de comunicaciones de Prosegur Cash (`e1bb810f…`,
  `f278734b…`, 08:52:30Z): todos con el mismo SHA-256 que el investigador.
- No hay documento de emisión, mínimo, plazo, interés ni destinatarios.
- Advertencias: «Prosegur» y «Minos», «No hay datos disponibles».

## Securitize Stocks · confirmado

- Página (https://securitize.io/investments/stocks, navegador, 08:47:47Z): mismo
  texto que el investigador (`10c48b49…`): «Securitize Stocks are offered by
  Securitize Markets, LLC … to eligible investors in permitted jurisdictions».
- FAQ (https://stocks.securitize.io/faq, 08:51:46Z, pregunta a pregunta):
  «Trading is supported using third party self-custody wallets only»,
  «Securities can only move between whitelisted wallets on the platform» y «The
  platform charges a fee of .10% of trade amount in USDC».
- No hay lista de países, KID ni mínimo.
- Ficha de Securitize Europe en la CNMV: nº 327, 25/04/2025 (08:46:07Z).
- Advertencias: «Securitize», «No hay datos disponibles».

## Bonos de Profitus/Axiology · confirmado

- API pública (https://api.profitus.com/api/v1/landing/projects?limit=50&page=1…12,
  08:46:06Z–08:48:23Z). **Leí las 11 páginas**; el investigador leyó las dos
  primeras:
  - 549 proyectos, todos distintos;
  - **7 abiertos** (`open_for_investments`), los 7 préstamos `standard`: 6 en
    Lituania y 1 en España.
- Solo hay un proyecto con `loan_type: bonds`, «"Gesons" Bonds». Está
  `confirmed` y tiene ya invertido todo lo que pedía (3.443.500). No está
  abierto, así que no cambia nada. Si se quiere, se puede anotar en el
  expediente que existe ese bono pasado.
- Página «Bonds» (08:47:16Z): mismo texto que el investigador (`7d2afc89…`).
  Está dirigida a empresas emisoras y no lista ninguna emisión abierta.
- Listado de la CNMV de plataformas europeas: «UAB "PROFITUS CROWDFUNDING"
  LITUANIA 21 28/12/2023» (igual byte a byte, `837fb5ce…`).
- Advertencias: «Profitus» y «Axiology», «No hay datos disponibles».

## Bono Valorix (Bit2Me STX) · confirmado

- Nota de Bit2Me (08:46:07Z): mismo SHA-256 que el investigador (`889382f2…`).
  Dice: «un bono corporativo tokenizado de 1 millón de euros, dirigido a
  inversores elegibles … previsto para diciembre de 2026».
- valorix.com, su página «invertir» y su documento de emisión de enero: byte a
  byte iguales (`5ae0d7ef…`, `b233b45d…`, `5640e211…`).
- ERIR de Bit2Me STX (08:46:07Z): «No se han encontrado datos disponibles»
  (`42c61370…`, igual).
- Advertencias: «Valorix» y «Bit2Me», «No hay datos disponibles».
- **Bloqueo confirmado:** valorix.es corta la conexión con curl (08:46:07Z,
  «Connection reset by peer») y da 502 en el navegador (08:47:16Z).

## CANDO1 (Token City) · confirmado

- exchange.token-city.com/es funciona (curl 200 a las 08:46:07Z, mismo HTML
  `706b14ef…`; navegador a las 08:47:16Z, mismo texto `1ada747a…`).
- CANDO1 (CDO1) sigue «En estudio», bajo «Oportunidades de inversión ·
  PRÓXIMAMENTE», con «Lista prioritaria». La web da «Objetivo de emisión
  1.971.000 €», «TIR bruta estimada ~11,7% anual» e «Inversión mínima 657 €».
  Son cifras comerciales, sin documento de emisión detrás.
- ERIR de Token City (08:46:07Z): solo «06/11/2026 SERIES A GRUPO UAE SA»
  (`12ac95b9…`, igual). Nada de CANDO1 ni de Lornin.
- Advertencias: «Token City», «Lornin» y «Cando», «No hay datos disponibles».

## Acciones tokenizadas de Crypto.com (EEE) · confirmado

- Los tres documentos tienen el mismo SHA-256 que el 11/11 y el 12/11 (08:46:07Z
  y 08:46:08Z):
  - condiciones (`1169bff5…`, «Last Update: 11 August 2026»);
  - declaración de riesgos (`8d5a498f…`);
  - política de eventos corporativos (`06d4eac0…`).
- En las condiciones siguen dos literales clave:
  - el KID se pone a disposición «via the Crypto.com App in electronic form»;
  - la lista de países excluidos está en «the Tokenized Stocks FAQs» (3.1(d)).
- Página de divulgaciones (https://crypto.com/eea/financialservices/disclosures,
  08:46:08Z): **301 a https://crypto.com/**. No se intentó saltar el filtro.
- Centro de ayuda (08:46:08Z): «Starting from $1». Condiciones 6.3: «Tokenized
  Stocks cannot be transferred by you to any third party or to any external
  wallet». Los dos textos de `resumenTarjeta` (mínimo, 60 caracteres; salida,
  78) están respaldados, pero la tarjeta no se propone.
- CNMV nº 4485, inscrita el 19/01/2018 (08:46:45Z, byte a byte igual,
  `031f36b7…`). App Store española: versión 3.244.01, del 11/11/2026.
- Advertencias: «Crypto.com» solo devuelve seis dominios clon ajenos
  (DELTASCRYPTO.COM, FXPROCRYPTO.COM, IDCXSCRYPTO.COM, TRADESCRYPTO.COM,
  ALPHASCRYPTO.COM, CCXCRYPTO.COM). «Foris» solo devuelve FORISDAXLTD.COM y
  MY.FORISDAXLTD.TOP. Los dos resultados son byte a byte iguales a los del
  investigador.
- Sin KID ni lista de países, `no_admitir` es correcto.

## Bloqueos de esta revisión

- valorix.es: conexión cortada (08:46:07Z) y 502 (08:47:16Z), como en el
  expediente.
- Página del KID de Crypto.com: 301 por país (08:46:08Z). No se elude.
- No reabrí, por rapidez:
  - el programa de actividades de Securitize Europe en la CNMV;
  - la ficha de la EAFN nº 21;
  - la FSMA belga;
  - stx.bit2me.com.

  Ninguno sostiene una decisión: las candidatas no se admiten por motivos que
  sí comprobé, y en Hausera el aviso sobre la EAFN es el publicado.

## Datos personales · confirmado con cambios (corrección obligatoria)

Los recortes que anota el investigador están bien hechos:

- el nombre de la portada de Hausera;
- los tres nombres de las páginas de Prosegur Cash.

Además, la ficha de la EAFN nº 21 está solo en `crudo/` y los PDF de Hausera no
se guardaron. No encontré nombres de personas en los siete expedientes ni en el
resumen del grupo.

Pero **quedan dos copias del grupo, que irían a Git, con nombres y apellidos de
personas físicas:**

1. `grupos/vigilancia/fuentes/bit2me/bit2me-blog-autorizacion-2026-11-13.txt`,
   líneas 65 y 69:
   - lleva los nombres de los dos consejeros delegados y cofundadores que cita
     la nota de Bit2Me;
   - es el mismo fallo que la revisión del 12/11 ya mandó corregir en la copia
     de ayer, y que allí sí se corrigió.
2. `grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`, línea
   126: lleva el nombre del consejero delegado de Axiology, en una cita.

**Corrección obligatoria:**

- cambiar esos tres nombres por «[nombre recortado]»;
- dejar los originales solo en `crudo/`;
- añadir esas dos copias a la lista de recortes de `resumen-vigilancia.md`,
  que hoy está incompleta.

Mis propias copias (`fuentes/vigilancia/`, fuera de `crudo/`) no llevan
ninguno de estos nombres; lo comprobé con una búsqueda a las 08:55 UTC.
