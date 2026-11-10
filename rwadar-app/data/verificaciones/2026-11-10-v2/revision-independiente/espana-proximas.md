# Revisión independiente · grupo «espana-proximas» · 10/11/2026

Revisor independiente (no preparé estos expedientes). Abrí yo mismo las
fuentes entre las **09:20 y las 09:33 UTC** del 10/11/2026, sin iniciar
sesión, sin pulsar «Reservar tickets» ni rellenar formularios. Las copias
están en `fuentes/espana-proximas/` (texto recortado, sin nombres de personas)
y su inventario con SHA-256 en `fuentes/espana-proximas/inventario-revision.json`.
Lo crudo (JSON de Hausera, API de Token City, respuesta de Polygon) va en
`fuentes/espana-proximas/crudo/`, fuera de Git. Los PDF no se guardan porque
llevan nombres, DNI e IBAN.

## Veredicto

**Aprobado con cambios.** Todo lo esencial que propone el investigador se
sostiene hoy en la fuente primaria: Alicante 2 aparece como financiada,
Alicante 3 tiene preventa el 18/11 y suscripción desde el 25/11, los
documentos son públicos y respaldan emisor, mínimo, comisiones, acceso y
salida, y el registro de la CNMV sigue sin inscribir las SPV 9, 10 y 11. Hay
**una corrección obligatoria** en el texto de salida de la tarjeta (dice «no
hay mercado secundario», más tajante que el documento) y dos recomendaciones.

| Asunto | Veredicto |
|---|---|
| hausera-proximas-ofertas · estado (Alicante 2 financiada; Alicante 3 el 18/11 y 25/11) | confirmado |
| hausera-proximas-ofertas · documentos públicos sin sesión | confirmado (con un matiz) |
| hausera-proximas-ofertas · emisor SPV 11 / SPV 10 | confirmado |
| hausera-proximas-ofertas · mínimo 100 € (tarjeta y referencia) | confirmado |
| hausera-proximas-ofertas · acceso desde España | confirmado |
| hausera-proximas-ofertas · salida (tarjeta) | **confirmado con cambios** |
| hausera-proximas-ofertas · comisiones (métrica) | confirmado (recomendación) |
| hausera-proximas-ofertas · avisos (3 vigentes, 1 cambia, 2 nuevos) | confirmado |
| hausera-proximas-ofertas · registros, EAFN nº 21 y advertencias | confirmado |
| hausera-proximas-ofertas · referencias de la ficha completa | confirmado |
| hausera-proximas-ofertas · conflicto 50 % / 70 % (no se publica) | confirmado |
| hausera-alicante-2 (candidata) · no admitir | confirmado |
| Pistas sin cambios (Valorix/Bit2Me STX, CANDO1, Token City, Alius) | confirmado |
| Datos personales en las copias del grupo | confirmado (no hay) |

## Hechos comprobados

### Estado de Alicante 2 y Alicante 3 — confirmado

- `https://hausera.io/propiedad/alicante_2/` (render sin sesión, 09:21:24Z):
  «Alicante 2 · **FINANCIADA** · CRV … Inicio de preventa: 04/11/2026 · Inicio
  de oferta pública: 11/11/2026». No hay botón de reserva.
- JSON público `…/page-data/propiedad/alicante_2/page-data.json` (09:20:55Z):
  `status: PRESALE_CLOSED`, `launchDate 11/11/2026`, `isin null`. SHA-256
  `73c8e236…` **igual** al del investigador. En el buscador de Oportunidades
  aparece en la lista «FINANCIADA».
- `https://hausera.io/oportunidades/` y `…/propiedad/alicante_3/` (09:21–09:23Z):
  «Alicante 3 · PRÓXIMA OPORTUNIDAD · **Preventa: 18/11/2026 09:00h** … Inicio
  de oferta pública: **25/11/2026** … Duración (meses): 20». JSON de Alicante 3:
  `status COMMINGSOON`, `presaleDate 18/11/2026`, `launchDate 25/11/2026`,
  `priceToken 100`, `feesPlatform 0`, `tokens 51960` (SHA-256 `7a12fb34…`,
  igual).
- Documento de emisión de Alicante 3, cuadro resumen: «El periodo de
  suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027».
- Matiz: en los datos Alicante 2 figura como `PRESALE_CLOSED` y Alicante 1
  como `FUNDED`, aunque la web enseña «FINANCIADA» en los dos. El sitio no dice
  cuánto se reservó. Por eso está bien la forma «figuraba como financiada» de
  los avisos; no conviene afirmar en la tarjeta que «se cubrió entera».

### Documentos públicos — confirmado (con un matiz)

- Pestaña «Documentos» de Alicante 3 pulsada sin sesión (09:32:57Z): cinco
  documentos con «Descargar / Mostrar» (Dossier, Informe de valoración,
  Referencia catastral, Acuerdo de suscripción, Whitepaper). Lo mismo en
  Alicante 2 (09:33:10Z).
- Descargas sin sesión desde Google Drive (09:23:21Z–09:23:27Z); los cuatro
  SHA-256 coinciden con los del investigador:
  - Alicante 3 «Whitepaper» `1cpWVN3J…` (27 págs., `9170562a…`): «DOCUMENTO DE
    EMISIÓN DE OBLIGACIONES POR PARTE DE HAUSERA PROPERTY MANAGER SPV 11, S.A».
  - Alicante 3 «Acuerdo de suscripción» `1vfq0Ljr…` (85 págs., `69cbadaf…`):
    acuerdo de reserva + documento + escritura de 27/10/2026.
  - Alicante 2 documento `1vCqpOwj…` (`d3d7dd40…`) y acuerdo `1Mg6Ax-_…`
    (`ef9cff8c…`).
- **Matiz:** el 05/11 los enlaces de Drive ya estaban en el JSON público, pero
  la ficha redirigía al inicio de sesión y no se siguieron (revisión del 05/11,
  apartado «Documento de emisión»). Lo que cambia hoy es que la web los enseña
  sin sesión. En el expediente, «antes: solo para registrados» describe la web
  del 05/11, no que los archivos no existieran. No afecta a la tarjeta.

### Emisor — confirmado

- Documento de Alicante 3, 2.2.1: «Emisor: HAUSERA PROPERTY MANAGER SPV 11,
  S.A … CIF: A88963426». Portada: «Entidad Responsable Inscripción y Registro
  (ERIR) Ursus-3 Capital AV, S.A (nº Registro 251)».
- Documento de Alicante 2, 2.2.1: «HAUSERA PROPERTY MANAGER SPV 10, S.A … CIF:
  A88963418».
- Escritura anexa (Alicante 3): capital «desembolsado un 25 %» y «no cuenta con
  otras emisiones de obligaciones en circulación».

### Mínimo — confirmado

- Documento de Alicante 3, cuadro resumen: «Precio de emisión: A la par.
  Importe nominal unitario: 100,00 euros. **Ticket mínimo: 100,00 euros**»;
  5.11: «El precio de suscripción será 100 Euros por cada unidad».
- Ojo, no es un error del expediente: la página de Hausera «Oportunidades
  cotizadas» (`/mercado-secundario/`, 09:27:30Z) dice «El valor unitario de
  cada participación son 1.000€» para las operaciones que cotizan en Portfolio
  Stock Exchange. No es Alicante 3 (`is_secondary_market: false`). La tarjeta
  hace bien en decir «en Alicante 3, según su documento de emisión».

### Acceso desde España — confirmado

- Documento de Alicante 3, 5.7: «se dirigirá, tanto a inversores cualificados
  … como a determinadas personas físicas y jurídicas que no tengan la condición
  de inversor cualificado. En estos últimos casos, HAUSERA PROPERTY MANAGER SPV
  11, S.A analizará la información … para considerarlo idóneo». 5.6: KYC en
  `hausera.io/onboard` y lista blanca. Cuadro: «Las obligaciones están sometidas
  a normativa española». Sin lista de países.
- CNMV, listado de PSFP (09:25:55Z): 0 coincidencias con Hausera u Holdtx.
  Términos (`/terms/`, 09:26:07Z): HOLDTX SPAIN, S.L. «no actúa como empresa
  de servicios de inversión».

### Salida — confirmado con cambios (corrección obligatoria)

- Documento de Alicante 3, 2.3.7: «La devolución del principal y, en su caso,
  la retribución … se realizará únicamente una vez se haya producido la venta
  efectiva del inmueble»; 2.3.5: «duración estimada de veinte (20) meses, sin
  constituir obligación de vencimiento en fecha cierta», prórroga de hasta 4
  meses y otras posteriores; 6: transmisión solo a un «Comprador Autorizado»;
  escritura (t): «No hay entidades que estén comprometidas con el emisor para
  suministrar liquidez».
- **Pero** el apartado 8.6 dice que los valores «**pueden no tener** un
  mercado secundario líquido», y la propia web de Hausera
  (`/mercado-secundario/`, 09:27:30Z) anuncia: «Nuestras operaciones
  inmobiliarias ahora van a cotizar en mercados regulados (bolsas)». La frase
  propuesta «no hay mercado secundario» es más tajante que la fuente y choca
  con esa página. La tarjeta publicada decía «no hay mercado secundario
  garantizado», que sí está respaldado.

### Comisiones — confirmado (con recomendación)

- Escritura anexa (Alicante 3), condición (i): «la emisión está libre de
  comisiones y gastos para el suscriptor». JSON: `feesPlatform 0`.
- Documento, «Honorarios de Hausera»: Hausera cobra quedándose la plusvalía que
  supere el tope del inversor (en el cuadro de escenarios, del 0 % al 12,52 %
  según el escenario). La métrica «Ninguna para el suscriptor» es literal y
  correcta, pero sola puede hacer creer que Hausera no cobra nada.

### Avisos — confirmado

- «Hausera (HOLDTX SPAIN, S.L.) declara no ser una empresa de servicios de
  inversión…»: **vigente** (`/terms/`, 09:26:07Z, literal arriba).
- Aviso de la preventa: **cambia**. La frase «el 05/11 el documento y el emisor
  no eran públicos» ya no aplica. El nuevo texto está respaldado por el acuerdo
  de reserva de Alicante 3, cláusula 3: «Los fondos anticipados podrán ser
  gestionados por el Emisor con el fin de avanzar en el desarrollo del proyecto
  mientras se completa el proceso de formalización de la emisión … devolución
  íntegra de los importes reservados, sin devengo de intereses»; documento 5.8:
  los fondos «se convertirán automáticamente en valores … una vez la emisión
  sea formalmente inscrita».
- Nuevo «no es un folleto … no inscrita el 10/11»: portada del documento: «El
  presente documento no es considerado un folleto informativo ni ha sido
  revisado por parte de la Comisión del Mercado de Valores». Registro ERIR (ver
  abajo): Alicante 3 no figura.
- Nuevo «pueden cubrirse en la preventa: Alicante 2 ya figuraba como
  financiada el 10/11/2026, antes de su oferta pública del 11/11»: respaldado
  por la ficha (09:21:24Z). La forma «figuraba» es la correcta (ver el matiz del
  estado).
- «Las rentabilidades anunciadas son previsiones…» y «Puedes perder todo o
  parte del dinero; no hay mercado secundario garantizado»: **vigentes**
  (documento, resumen ejecutivo: «La inversión no garantiza la devolución del
  capital ni la obtención de rentabilidad»; 8.6).
- Comprobé además que los términos y las FAQ no cambian: comparados con las
  copias del revisor del 05/11, la única diferencia es que ya no aparece el
  banner «¡APÚNTATE A LA LISTA DE ALICANTE 2! / SOLICITAR TICKETS» (09:31Z).

### Registros, EAFN nº 21 y advertencias — confirmado

- CNMV, emisiones inscritas de URSUS-3 CAPITAL, A.V., S.A.
  (`https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es` y
  páginas 1 a 3, 09:24:29Z–09:24:53Z): la fecha más reciente es **23/10/2026**
  (SPV 7 y SPV 8). Hausera tiene 8 emisiones: SPV (sin número) y SPV 2 a SPV 8.
  **No figuran SPV 9, 10 ni 11.** Entre la inscripción en el Registro Mercantil
  y la de la CNMV pasaron entre 1 y 3 meses (por ejemplo, SPV 6: 24/06 → 24/07;
  SPV 2: 18/03 → 19/06).
- CNMV, Ursus-3 (09:30:36Z): «Sociedades y Agencias de Valores · Nº Registro
  Oficial 251 · 29/08/2013».
- Documento de Alicante 3, portada: «Entidad de Servicios de Inversión
  interviniente: [persona física] EAFN (nº Registro 21)». CNMV, EAFN nº 21
  (09:25:14Z y programa de actividades 09:25:27Z): registro 12/01/2024;
  servicios: «Asesoramiento en materia de inversión» y auxiliares
  («Asesoramiento a empresas», «Elaboración de informes de inversiones»). No
  aparecen colocación, recepción ni ejecución de órdenes. El documento dice
  «El Emisor llevará a cabo la comercialización … a través de la plataforma
  www.hausera.io» (5.6).
- Advertencias de la CNMV (09:25:45Z–09:25:48Z): «Hausera» y «Holdtx» → «No
  hay datos disponibles»; control con «Trading» → devuelve resultados.
- Polygon (`polygon-bor-rpc.publicnode.com`, 09:24:24Z): contrato de Alicante 3
  `0xbc10…C265` → `name()` «Alicante_3», `totalSupply()` 0; Alicante 2
  `0x853F…8BAe` → «Alicante_2», 0. Direcciones tomadas de la portada de cada
  documento.

### Referencias de la ficha completa — confirmado

- Oportunidades (09:21Z): «Alicante 1 · FINANCIADA · ROI: 15,00% · 15 meses ·
  Anualizado: 12,00%». Las tres referencias de octubre («12,00 % (15,00 % … en
  15 meses)») eran de Alicante 1, ya financiada: su retirada está justificada.
- Portada (09:23:31Z): «42 operaciones realizadas · 24 operaciones terminadas ·
  128M€ total financiado». Si se actualiza el «Historial publicado», que sea
  con estas cifras y fecha 10/11; la «rentabilidad histórica 15,86 %» de la
  misma portada no debe subir (ficha «en camino»).

### Conflicto del mínimo de la emisión — confirmado

- Alicante 3: documento (cuadro y 5.9) «al menos el 50%»; acuerdo, cláusula 5,
  «al menos el 50%»; escritura (r) «asciende al 50% … 2.598.000,00 €»; pero
  escritura (o) «al menos el **70%** del importe total previsto». El conflicto
  existe y el expediente hace bien en no publicar el porcentaje.
- Alicante 2: documento (cuadro y 5.9) y escritura (o) y (r) dicen 70 % a
  18/11/2026, sin conflicto.

### hausera-alicante-2 (candidata) · no admitir — confirmado

Intenté rebatirlo y no puedo: la ficha dice «FINANCIADA», no hay botón de
reserva y el JSON dice `PRESALE_CLOSED`, así que hoy no se puede comprar. El
resto también se sostiene: SPV 10 (CIF A88963418), 100 € de mínimo, sin
comisiones (escritura (i)), vencimiento objetivo 11/07/2028, mínimo de emisión
del 70 % a 18/11, no inscrita en la CNMV y colocada por el propio emisor. Aunque
el 11/11 volviera a abrirse, seguiría fallando el criterio de entidad.
Alicante 3 tampoco es admisible hoy: no abre hasta el 18/11 (preventa) y el
25/11 (suscripción).

### Pistas «sin cambios» (muestreo) — confirmado

- **Bono Valorix / Bit2Me STX:** blog de Bit2Me (09:30:24Z): bono de 1 M€
  «previsto para diciembre de 2026». `valorix.com/invertir.html` (09:29:52Z):
  «¡Lanzamos nuestra segunda emisión de bonos tokenizados! … 500.000 € … 5.000 €
  Inversión mínima · 12% TAE», solo con formulario de interés. El PDF enlazado
  (`/docs/documento-de-emision.pdf`, 09:30:00Z) es «Valorix token (VLRX1T26)»,
  firmado el 13/01/2026: no corresponde a la segunda emisión. CNMV, ERIR de
  Bit2Me STX (`nif=A56759137`, 09:29:38Z): «No se han encontrado datos».
  `valorix.es`: conexión reiniciada (09:29:53Z); `stx.bit2me.com`: 404
  (09:29:55Z).
- **CANDO1 / Token City:** `exchange.token-city.com` (09:30:12Z): «CANDO1
  (CDO1) · En estudio … Objetivo de emisión 1.971.000 € … Inversión mínima
  657 €». CNMV, ERIR de Token City (`nif=A25988981`, 09:29:37Z): una sola
  inscripción, **06/11/2026**, acciones de SERIES A GRUPO UAE, S.A. «por importe
  de 60.000 euros». Nada de CANDO1.
- **Alius:** API `count-by-status` (09:30:07Z):
  `{"CAMPAIGN":1,"PRIVATE_CAMPAIGN":0,"PRE_CAMPAIGN":0,"CLOSED":2}`, SHA-256
  `859fab07…`, igual al del investigador.
- No volví a comprobar Reental ni Brickken: quedan como las dejó el
  investigador, sin mi confirmación.

### Datos personales — confirmado

Busqué en `grupos/espana-proximas/` (también en `fuentes/crudo/`) y en los dos
expedientes: los nombres del equipo y de las personas que firman o intervienen
en los documentos, DNI, NIE, IBAN y la dirección de la EAFN. **No aparecen.**
Los extractos usan «[nombre recortado]», «[dirección recortada]» e «IBAN
recortado». La EAFN nº 21 se cita por número, que es un dato del registro
público, sin nombre. Mis copias siguen la misma regla.

## Correcciones obligatorias

1. **`resumenTarjeta.salida` de hausera-proximas-ofertas.** Cambiar «Cobras
   cuando se venden las viviendas (previsto en 20 meses, sin fecha cierta); no
   hay mercado secundario.» por un texto respaldado. Por ejemplo:
   «Cobras cuando se venden las viviendas (previsto en 20 meses, sin fecha
   cierta); sin mercado secundario garantizado.» (115 caracteres), o «Cobras al
   venderse las viviendas (unos 20 meses, sin fecha cierta); solo puedes vender
   a quien autorice el emisor.» (114). Motivo: el documento dice «pueden no
   tener un mercado secundario líquido» (8.6) y la propia web de Hausera
   anuncia cotización en bolsa para sus operaciones.

## Recomendaciones (no bloquean)

- Métrica «Comisiones»: añadir, sin cifra (una ficha «en camino» no lleva
  rentabilidad), «Ninguna para el suscriptor; Hausera cobra con la plusvalía
  que supere el tope del inversor».
- En `cambiosRespectoPublicado`, describir el cambio de documentos como «la
  web ya los enseña sin sesión». El 05/11 los enlaces ya estaban en el JSON
  público, aunque la ficha pedía registro.
- Si la ficha completa va a enseñar «Acceso desde España» y «Salida» además
  del mínimo, cada uno necesita su referencia escrita con fuente y fecha, como
  la de «Mínimo de inversión».
- Volver a mirar Hausera el 18/11 (preventa) y el 25/11 (suscripción) y,
  después, el registro ERIR de Ursus-3.

## Textos de la tarjeta revisados (≤ 120 caracteres, castellano llano)

| Campo | Texto propuesto | Caracteres | Veredicto |
|---|---|---|---|
| mínimo | Desde 100 € en Alicante 3, según su documento de emisión (10/11); la preventa abre el 18/11. | 92 | correcto |
| accesoEspana | Emisión española para particulares que pasen el test de idoneidad del emisor; Hausera no está registrada en la CNMV. | 116 | correcto |
| salida | Cobras cuando se venden las viviendas (previsto en 20 meses, sin fecha cierta); no hay mercado secundario. | 106 | **corregir** (ver arriba) |

Ninguno lleva rentabilidad ni precio principal, ni dice «por token» o «por
participación». Las citas literales se quedan en la ficha completa.

## Bloqueos

- No pulsé «Reservar tickets» ni entré en `hausera.io/onboard`: requiere
  registro (y lo prohíbe el encargo).
- En Playwright, las fichas de Alicante 2 y 3 agotaron la espera de red de
  60 s (la página sigue cargando vídeos). Leí el texto después de esa espera y
  repetí la lectura de la pestaña «Documentos» con otra carga (09:32–09:33Z).
- No probé `polygon-rpc.com`; leí los contratos directamente con publicnode.
- `valorix.es` (conexión reiniciada) y `stx.bit2me.com` (404), como el
  investigador.
- No sé cuánto se reservó en Alicante 2: la web no lo dice.
- Reental, Brickken y la posible oferta de SERIES A GRUPO UAE: no
  comprobados por mí.
