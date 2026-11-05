# Revisión independiente · grupo «espana-proximas» · 5 de noviembre de 2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo las
fuentes primarias el 05/11/2026 entre las 08:15 y las 08:25 UTC, sin iniciar
sesión, sin pulsar «Invertir» ni «Reservar» y sin seguir enlaces a documentos
que la web reserva a usuarios registrados. Copias en
`fuentes/espana-proximas/` e inventario (URL, hora, HTTP, bytes y SHA-256) en
`fuentes/espana-proximas/inventario-consultas.json`. Las copias íntegras que
nombran a personas físicas, los PDF y los HTML quedan fuera de Git.

## Veredicto

**Aprobado con cambios.** Casa de Outeiro se confirma tal cual. En Hausera
casi todo se confirma, pero **el mínimo propuesto («sin publicar») es falso**:
Hausera publica un mínimo de **100 €** en su FAQ y en su portada, y los datos
públicos de Alicante 2 dan 100 € por ticket. Además, el aviso de la preventa
debe aclarar que firmar el acuerdo de reserva obliga a pagar. Ninguna de las
dos fichas puede subir a principales; las dos siguen «en camino».

| Ficha | Asunto | Veredicto |
|---|---|---|
| casa-de-outeiro | Recaudado 1.121.000 € (05/11) | confirmado |
| casa-de-outeiro | Estado y plazo sin cambios de fondo | confirmado |
| casa-de-outeiro | Aviso del plazo con fecha 05/11 | confirmado |
| casa-de-outeiro | Métrica del plazo con el conflicto | confirmado |
| casa-de-outeiro | Token City sin emisiones inscritas como ERIR | confirmado |
| casa-de-outeiro | Advertencias de la CNMV | confirmado |
| casa-de-outeiro | Mínimo, acceso, salida y comisiones sin cambios (tres textos de la tarjeta) | confirmado |
| hausera-proximas-ofertas | Preventa en curso desde el 04/11; oferta pública el 11/11 | confirmado |
| hausera-proximas-ofertas | Documento de emisión no público | confirmado |
| hausera-proximas-ofertas | Emisor sin identificar | confirmado |
| hausera-proximas-ofertas | Registro en la CNMV sin cambios | confirmado |
| hausera-proximas-ofertas | Mínimo: «1.000 €» → «sin publicar» | **rechazado** |
| hausera-proximas-ofertas | Nueva «Alicante 3 · Próximamente» | confirmado |
| hausera-proximas-ofertas | Activo: 14 viviendas en La Zenia; lugar Orihuela Costa | confirmado |
| hausera-proximas-ofertas | Aviso del documento y de la preventa | confirmado con cambios |
| hausera-proximas-ofertas | Textos de acceso y salida de la tarjeta | confirmado |

## Casa de Outeiro (Alius Capital)

### Recaudado: confirmado

- API pública de la campaña
  (`saas-pfp-base-api.token-city.com/v3/dashboard/issuance/slug/casa-de-outeiro/expand/…`),
  08:15:48Z: `invested: 1121000`, `invested_tokens: 44840`, `supply: 128800`,
  `target_amount: 3220000.00`, `minimum_revenue_money: 2000000`. SHA-256
  `00af0e4d…13c5`, **idéntico** al de la copia del investigador.
- Página `https://aliuscap.com/projects/casa-de-outeiro` renderizada a las
  08:16:52Z: «Recaudado 1.121.000,00 €», «Umbral de éxito 2.000.000,00 €»,
  «Importe máximo 3.220.000,00 €», «Tokens vendidos 44.840».
- Cuentas: 1.121.000 / 2.000.000 = 56 %; 1.121.000 / 3.220.000 = 34,8 % (35 %).
  Los +5.000 € desde el 22/10 cuadran con la referencia publicada
  «Recaudado · 22/10/2026: 1.116.000 EUR».

### Estado y plazo: confirmado

- Página del proyecto (08:16:52Z): «Campaña», «Días restantes --», botón
  «Invertir». Listado `https://aliuscap.com/invest` (08:17:05Z): Casa de Outeiro
  «En campaña»; las otras dos emisiones, «Emisión completada».
- API: `campaign.end_date: 2026-10-31`, `extend_days: None`,
  `campaign_status: CAMPAIGN`. Recuento por estado (08:16:41Z):
  `CAMPAIGN 1, PRIVATE_CAMPAIGN 0, PRE_CAMPAIGN 0, CLOSED 2`.
- Ficha de datos (`…/issuance/71/document/263`, 08:16:00Z): SHA-256
  `147cd972…0de3`, el mismo de los días anteriores. Literal: «Fecha límite:
  31/03/2027» y «Madrid, 30 de octubre del 2026». Anexos (doc. 264): SHA-256
  `332e32c2…976b`, el mismo.
- Pestañas (`…/issuance/71/tabs`, 08:16:03Z): SHA-256 `3ec67c48…b741`, igual.
  «Proceso»: «con fecha límite el 31/10/2026» y «desde el 01/07/2026 hasta el
  31/10/2026». «Actualizaciones»: la última es «21/07/2026: WEBINAR Q&A».
- Web del emisor `https://casadeouteiro.com/emision-capital/` (08:17:30Z):
  «EMISIÓN DE CAPITAL HASTA 31/10», «Última actualización 17/09/26».
- Condiciones de Alius `https://aliuscap.com/general-terms` (08:17:58Z): «El
  plazo mínimo será de un (1) mes y el máximo de seis (6) meses». Del 01/07/2026
  al 31/03/2027 hay 9 meses: el conflicto sigue abierto.
- Búsqueda web de hoy (solo para descubrir): ninguna noticia de prórroga.

### Aviso y métrica del plazo: confirmados

El nuevo texto del aviso («el 05/11/2026 seguía sin días restantes ni
ampliación en la plataforma, aunque la ficha de datos del 30/10 cita el
31/03/2027») y la métrica («Hasta el 31/03/2027 según la ficha del 30/10/2026;
Alius aún muestra fin el 31/10/2026») describen exactamente lo que vi hoy.

### Registro: confirmado

- CNMV, PSFP (`…/Proveedor.aspx?nreg=11&nif=B76632793`, 08:18:27Z):
  «ADVENTUREES CAPITAL PFP, SOCIEDAD LIMITADA», «11», «03/11/2023»,
  «www.aliuscap.com».
- CNMV, ESI (`…/esi/esis.aspx?nif=A25988981`, 08:18:29Z): «TOKEN CITY
  EUROPEAN EXCHANGE A.V., S.A.», «334», «06/02/2026».
- CNMV, emisiones de Token City como ERIR (`…/esi/erir_esi?nif=A25988981`,
  08:18:31Z): «No se han encontrado datos disponibles». La ficha de datos dice
  que los tokens se entregan «tras la inscripción en CNMV de la ERIR de la
  emisión», así que es coherente con una campaña sin cerrar.

### Advertencias de la CNMV: confirmado

Buscador de entidades advertidas (`ResultadoBusqueda?tipo=1&nombre=…`),
validado con «Trading» a las 08:19:18Z (devuelve advertencias, «Página 1 de
16»). «No hay datos disponibles» para Alius (08:19:20Z), Alius Capital
(08:19:22Z), Adventurees (08:19:24Z), Token City (08:19:26Z), Outeiro
(08:19:28Z) y, como prueba extra, «Casa de Outeiro» (08:19:35Z). No aparecer
no equivale a estar autorizado.

### Mínimo, acceso, salida y comisiones sin cambios: confirmado

- Mínimo: ficha de datos §3, «“ticket” o aportación mínima de 80 acciones
  (2.000€)»; página «Inversión mínima 2.000,00 €»; API
  `minimum_offer_money 2000`.
- Acceso: condiciones de Alius, «Inversor No Experimentado», aviso y
  consentimiento para inversiones de más de 1.000 € y 4 días de reflexión.
  PSFP nº 11 releído hoy.
- Salida: ficha §2 («se reembolsarán las aportaciones a los inversores») y §5
  («liberación del 10% en paquetes del 2.5% anual por inversor» de 2027 a 2030).
- Comisiones: ficha §6, «El inversor no soportará coste alguno».
- Tres textos de la tarjeta: 30, 90 y 101 caracteres, castellano llano, sin
  rentabilidad ni precio principal. Siguen respaldados.

## Hausera · próximas ofertas

### Estado: confirmado

- `https://hausera.io/oportunidades/` renderizada a las 08:20:26Z: «¡APÚNTATE A
  LA LISTA DE ALICANTE 2! SOLICITAR TICKETS», «Alicante 2 · PREVENTA», «Inicio
  de preventa: 04/11/2026», «Inicio de oferta pública: 11/11/2026», «Fin
  previsto de proyecto: 11/07/2028», «Duración (meses): 20».
- Datos públicos de la ficha
  (`https://hausera.io/page-data/propiedad/alicante_2/page-data.json`,
  08:19:54Z, SHA-256 `b2a63ccc…c1d5`, idéntico al del investigador):
  `status PRESALE`, `presaleDate 04/11/2026`, `launchDate 11/11/2026`. Su
  calendario: «04/11/2026 · Preventa · Comenzamos la preventa…» y «11/11/2026 ·
  Inicio de la oportunidad».

### Documento de emisión: confirmado

Los datos públicos enumeran cinco documentos (Dossier, Informe de valoración
de mercado, Referencia catastral, Acuerdo de suscripción y Whitepaper); ninguno
se llama «Documento de emisión». Sus enlaces de Google Drive aparecen en el
JSON estático del sitio, pero la web los enseña solo tras registrarse. **No los
abrí**: la regla prohíbe entrar en documentos restringidos. Los términos
(`https://hausera.io/terms/`, 08:21:28Z), §5.3: «el Usuario podrá recibir por
correo electrónico el Acuerdo de Reserva, junto con el Documento de Emisión».

### Emisor: confirmado

Ni los términos ni los datos públicos de Alicante 2 ni las páginas renderizadas
nombran la sociedad emisora. Términos: «Emisor o SPV: … identificada en el
Documento de Emisión y/o en el Acuerdo de Reserva».

### Registro en la CNMV: confirmado

- Listado de PSFP de la CNMV (08:18:34Z): ninguna coincidencia con Hausera u
  Holdtx (sí aparece ADVENTUREES). Su HTML coincide byte a byte con el del
  investigador.
- **Comprobación nueva:** ESI de la CNMV por el NIF de HOLDTX
  (`…/esi/esis.aspx?nif=B67708032`, 08:19:47Z): «No se han encontrado datos
  disponibles». NIF tomado de los términos: «Número de Identificación Fiscal:
  B67708032».
- Términos: HOLDTX «no actúa como empresa de servicios de inversión».
- CNMV, emisiones de Ursus-3 como ERIR (páginas 1 a 3, 08:18:53Z–08:18:57Z):
  ocho emisiones de HAUSERA PROPERTY MANAGER SPV (SPV, SPV 2 … SPV 8), de
  5.065.500 € a 7.991.000 €. La fecha más reciente es el 23/10/2026. No hay
  ninguna de 5.196.000 € ni posterior al 23/10. Ursus-3: ESI nº 251,
  29/08/2013 (08:24:19Z).
- Matiz: el HTML de la CNMV **no** es estable byte a byte. Mi copia de la
  página 1 tiene otro SHA-256 que la del investigador (`3ea04f8f…` frente a
  `bc39c56a…`), pero el listado es el mismo. Lo que se mantiene igual es el
  contenido, no los bytes. Esto no cambia la conclusión.
- Advertencias: «No hay datos disponibles» para Hausera (08:19:30Z), Holdtx
  (08:19:31Z) y «HOLDTX SPAIN» (08:19:33Z).

### Mínimo: rechazado

La propuesta dice «Sin publicar: Hausera envía el documento de emisión de
Alicante 2 tras registrarse y reservar (05/11)». **Es falso que el mínimo no
esté publicado:**

- FAQ `https://hausera.io/faq/`, pestaña «Inversión» (que no se ve por
  defecto; la abrí a las 08:22:35Z): «¿Cuánto es el máximo y el mínimo que se
  puede invertir? **El importe mínimo son 100€.**»
- La portada `https://hausera.io/` (08:21:04Z) repite: «El importe mínimo son
  100€.» La copia de la portada del propio investigador
  (`grupos/espana-proximas/fuentes/hausera/nav-hausera-home-2026-11-05.txt`,
  línea 207) también lo tiene, pero no se usó.
- Datos públicos de Alicante 2: `priceToken 100`, `tokens 51960` y
  `totalFinancedEur 5196000` (51.960 × 100 € = 5.196.000 €), además de
  `isin null`, `is_secondary_market false` y `market_name null`.
- Sí es correcto quitar los 1.000 €: la página
  `https://hausera.io/mercado-secundario/` (08:21:38Z) los aplica solo a las
  «oportunidades cotizadas». Alicante 2 no cotiza, y la pestaña Suscripciones
  de Portfolio (08:23:45Z) muestra «EMISIONES 0», «No se han encontrado
  resultados».
- Límite: los 100 € son una regla general de la plataforma. El documento de
  emisión de Alicante 2 podría fijar otra cifra, y no es público.

### Alicante 3: confirmado

Oportunidades (08:20:26Z): «PRÓXIMAMENTE · Alicante 3 · ROI: 22,00% · 20 meses
· Anualizado: 13,20% · 5.196.000€», las mismas cifras que Alicante 2. Los datos
públicos dicen `status STUDY` y `launchDate 25/11/2026`. La ficha
`/propiedad/alicante_3/` redirige al inicio de sesión (08:20:51Z). Ninguna de
esas cifras debe subir a la tarjeta, y la propuesta no las sube.

### Activo y lugar: confirmado

La ficha `/propiedad/alicante_2/`, capturada al poco de cargar (08:22:06Z),
enseña durante unos 3 segundos «Resumen del inmueble: Alicante 2 es un
proyecto formado por 14 viviendas … ubicadas en La Zenia (Orihuela Costa)» y
«2.204,46 m2». Después redirige a `/login/` (08:22:11Z). El mismo texto está
en los datos públicos (`pageContext.summary`). Una carga normal termina en el
inicio de sesión (08:20:37Z). «Orihuela Costa · España» está respaldado.

### Aviso del documento y de la preventa: confirmado con cambios

El texto nuevo («La preventa es una reserva sin compromiso. El 05/11/2026 el
documento de emisión de Alicante 2 y su emisor no eran públicos: Hausera los
envía tras registrarse y reservar.») acierta en lo del documento y el emisor,
pero «reserva sin compromiso» se queda corto:

- Términos, definición de «Preventa»: «manifestación de interés no
  vinculante». Pero el §5.3 añade: «La firma electrónica del Acuerdo de Reserva
  constituirá manifestación expresa del consentimiento» y «Tras la firma del
  Acuerdo de Reserva, el Usuario deberá realizar la transferencia bancaria
  correspondiente dentro del plazo indicado».
- FAQ, pestaña «Inversión»: la preventa sirve para «realizar una reserva de
  tickets para tenerlos asegurados», y «Cuando reserves tickets … recibirás los
  datos para hacer la transferencia bancaria».

Apuntarse no obliga, pero firmar la reserva sí obliga a pagar. Como el aviso se
reescribe hoy con fecha, tiene que decirlo (ver correcciones).

### Textos de acceso y salida: confirmados

- Acceso, 95 caracteres: «Plataforma española abierta a particulares según
  su FAQ; Hausera no está registrada en la CNMV.» La FAQ dice «dirigida a todo
  tipo de inversores: minoristas, profesionales e institucionales». En la CNMV
  no figura como PSFP ni como ESI (comprobado hoy).
- Salida, 114 caracteres: «Cobras cuando se venden las viviendas (previsto
  en 20 meses, sin garantía); no hay mercado secundario garantizado.» Lo
  respaldan la FAQ («Una vez finalizada la operación, el inversor recibe su
  inversión inicial junto con la plusvalía obtenida por la venta»),
  Oportunidades («Duración (meses): 20») y los términos («La existencia de
  mercado secundario no está garantizada»).
- Coste: «Sin comisión por invertir (FAQ)» se mantiene («Hausera no cobra nada
  a los usuarios por invertir»). Los datos de Alicante 2 dan
  `feesPlatform 0`.

## Muestreo de «sin cambios»

El grupo tiene solo dos fichas y las dos son «actualizar», así que revisé las
partes que el investigador da por «sin cambios» en ambas:

- Casa de Outeiro: ficha de datos, anexos, API y pestañas con el mismo
  SHA-256; mínimo, acceso, salida, comisiones y registro iguales.
- Hausera: acceso, salida, coste, registro (Ursus-3 sin emisiones nuevas) y
  advertencias, iguales.

Todo se confirma salvo el mínimo de Hausera, que ya estaba mal resuelto el
03/11. Aquel expediente decía que los 100 € venían de «una FAQ antigua que hoy
no aparece en la FAQ general», y hoy siguen en la FAQ (pestaña «Inversión») y
en la portada.

## Bloqueos

- No pulsé «Invertir» en Alius ni «Reservar tickets» en Hausera. Sigue sin
  saberse si Alius acepta órdenes después del 31/10.
- No abrí los documentos de Alicante 2 (enlaces de Google Drive del JSON
  público), porque la web los reserva a registrados. Tampoco los estatutos y el
  pacto de socios de Casa de Outeiro.
- No usé git (lo prohíbe el encargo), así que no pude comprobar qué entró en
  el commit `301c690`.

## Correcciones obligatorias

1. **Hausera, `resumenTarjeta.minimo`:** sustituir «Sin publicar: …» por un
   texto respaldado, por ejemplo (118 caracteres): «100 € según la FAQ de
   Hausera (05/11); las condiciones de Alicante 2 están en su documento de
   emisión, aún no público.» Fuente: `https://hausera.io/faq/` (pestaña
   «Inversión») y `https://hausera.io/`, consultadas el 05/11/2026. Lo mismo
   para el claim `minimo` (dato «100 EUR, regla general de la plataforma»,
   estado `respaldado_con_alcance`), para el cambio
   `resumenTarjeta/minimo` de `cambiosRespectoPublicado` y para
   `prioridadEditorial.minimoEntrada` («100 EUR según la FAQ; sin documento
   de emisión»). Hay que corregir también el resumen del grupo y el cambio
   crítico «Mínimo en la tarjeta … → sin publicar».
2. **Hausera, aviso de la preventa:** no decir solo «reserva sin compromiso».
   Propuesta: «Apuntarte a la preventa no te obliga, pero si firmas el acuerdo
   de reserva debes transferir el dinero en el plazo fijado. El 05/11/2026 el
   documento de emisión de Alicante 2 y su emisor no eran públicos.» Fuentes:
   `https://hausera.io/terms/` §5.3 y la FAQ, pestaña «Inversión».
3. **Datos personales (para el coordinador, antes de cualquier commit):** las
   copias en texto del investigador
   `grupos/espana-proximas/fuentes/alius/casa-fdf-v5.pdf.txt` (línea ~312-313)
   y `casa-anexos-v3.pdf.txt` (línea ~362-363) entran en Git y siguen
   mostrando, en la tabla de capital, los nombres de dos personas físicas con
   su número de acciones y su porcentaje. Hay que recortarlos como ya se hizo
   en `nav-casa-de-outeiro-2026-11-05.txt` y
   `nav-casadeouteiro-emision-capital-2026-11-05.txt`, que hoy están limpias.
   Las copias de ciclos anteriores (`2026-11-01-v2` y `2026-11-03.3-v2`)
   tienen el mismo problema.

## Observaciones (no bloquean)

- Hausera: en los expedientes, decir «mismo contenido» en vez de «idéntica byte
  a byte» para las páginas de la CNMV, porque su HTML cambia en cada carga.
- Casa de Outeiro: se mantiene la propuesta de retirarla si el 10/11 sigue sin
  avance ni ampliación. Hoy no hay ninguna fuente primaria que la rebata.
