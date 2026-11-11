# Revisión independiente · grupo «vigilancia» · 11/11/2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo las
fuentes entre las **09:38 y las 09:48 UTC** del 11/11/2026, sin iniciar
sesión, sin pulsar «Reservar tickets», sin rellenar formularios y sin
conectar monederos. Las copias (texto recortado, sin nombres de personas)
están en `fuentes/vigilancia/` con su inventario y SHA-256 en
`fuentes/vigilancia/inventario-revision.json`. Lo crudo (JSON de Hausera,
HTML de la CNMV, registros de Polygon con monederos) va en
`fuentes/vigilancia/crudo/`, fuera de Git. Los PDF de Hausera no se guardan
porque llevan nombres, DNI e IBAN.

## Veredicto

**Aprobado con cambios.** La tarjeta de Hausera se puede mantener tal cual
(«en camino», mismo texto, verificada el 11/11): todo lo que dice se sostiene
hoy en la fuente primaria. Ninguna candidata se puede admitir, como dice el
investigador. Pero hay **dos correcciones obligatorias** en el expediente y en
las copias, que no tocan el texto de la tarjeta:

1. **Alicante 2 ya tiene sus tokens.** El contrato de Alicante 2 en Polygon
   acuñó hoy **51.960 tokens** (5.196.000 €, el importe total) entre las
   **09:29:03 y las 09:31:16 UTC**, 16 segundos después de que el
   investigador lo leyera en 0. La frase «los tokens tienen suministro 0»
   ya no vale para Alicante 2. El de Alicante 3 sigue en 0.
2. **Hay nombres de personas en una copia.** La copia
   `grupos/vigilancia/fuentes/bit2me/bit2me-blog-autorizacion-2026-11-11.txt`
   lleva el nombre de tres personas físicas (directivos y fundadores de
   Bit2Me) en las líneas 68, 70 y 84. El resumen dice que se recortaron los
   nombres, pero esta copia se quedó sin recortar.

| Asunto | Veredicto |
|---|---|
| Hausera · estado (Alicante 3 el 18/11 y el 25/11; Alicante 2 financiada) | confirmado |
| Hausera · documentos (mismo SHA-256) y literales de la tarjeta | confirmado |
| Hausera · textos de la tarjeta (mínimo, acceso, salida) | confirmado |
| Hausera · registro en la CNMV y tokens en Polygon | **confirmado con cambios** |
| Hausera · entidades, advertencias y avisos | confirmado |
| Pagarés tokenizados de Prosegur Cash · no admitir | confirmado (con un matiz) |
| Securitize Stocks · no admitir | confirmado |
| Bonos de Profitus/Axiology · no admitir | confirmado |
| Bono Valorix (Bit2Me STX) · no admitir | confirmado |
| CANDO1 (Token City) · sin cambios | no verificable (la web sigue en mantenimiento) |
| Advertencias de la CNMV (12 nombres) | confirmado |
| Datos personales en las copias del grupo | **confirmado con cambios** |

No hay cambios críticos que revisar, ni propuestas de admitir o de retirar.

## Hechos comprobados

### Hausera · estado de Alicante 3 y Alicante 2: confirmado

- `https://hausera.io/oportunidades/` (página renderizada sin sesión,
  09:39:03Z): «Alicante 3 · PRÓXIMA OPORTUNIDAD · **Preventa: 18/11/2026
  09:00h** … Inicio de preventa: 18/11/2026 · Inicio de oferta pública:
  **25/11/2026** … Duración (meses): 20». En el buscador, Alicante 2 sale
  «FINANCIADA».
- `https://hausera.io/propiedad/alicante_3/` (09:39:11Z): lo mismo, con el
  botón «Reservar tickets», que no pulsé. «Alicante 3 es un proyecto formado
  por 14 viviendas … en La Zenia (Orihuela Costa)».
- `https://hausera.io/propiedad/alicante_2/` (09:39:18Z): «Alicante 2 ·
  **FINANCIADA** · … Inicio de oferta pública: 11/11/2026». No hay botón de
  reserva.
- Datos públicos de las fichas (09:38:47Z–09:38:48Z): Alicante 3
  `7a12fb34…`, Alicante 2 `73c8e236…` y Oportunidades `23352808…`. Los tres
  SHA-256 son **iguales** a los del investigador. Alicante 3:
  `presaleDate 18/11/2026`, `priceToken 100`.
- Matiz sin efecto en la tarjeta: la cuenta atrás se calcula con el reloj de
  quien mira. Con el navegador en UTC daba 6 días, 23 horas y 20 minutos a las
  09:39Z, o sea, «09:00» en UTC. Si las 09:00 son hora de España, son las
  08:00 UTC. La tarjeta no da la hora, así que no cambia nada; basta con no
  escribir en ningún sitio que la preventa abre «a las 09:00 UTC».

### Hausera · documentos y literales: confirmado

Descargué de Google Drive, sin sesión, los cuatro PDF (09:40:47Z–09:40:52Z).
Los cuatro SHA-256 coinciden con los del investigador y los del 10/11:

- Documento de emisión de Alicante 3 `1cpWVN3J…` → `9170562a…`.
- Acuerdo de reserva con la escritura `1vfq0Ljr…` → `69cbadaf…`.
- Dossier `1rbAUwmH…` → `72a312e2…`.
- Documento de Alicante 2 `1vCqpOwj…` → `d3d7dd40…`.

Volví a leer en el texto (copia en `hausera-alicante-3-documentos-literales.txt`):

- «Importe nominal unitario: 100,00 euros … **Ticket mínimo: 100,00 euros**».
- 5.7: «… como a determinadas personas físicas y jurídicas que no tengan la
  condición de inversor cualificado. En estos últimos casos, HAUSERA PROPERTY
  MANAGER SPV 11, S.A analizará la información … para considerarlo idóneo».
- «La devolución del principal … se realizará **únicamente una vez se haya
  producido la venta efectiva del inmueble**»; «Plazo de Inversión: 20 meses
  computados desde el 25/11/2026»; «sin que implique una obligación de pago
  en fecha cierta»; «pueden no tener un mercado secundario líquido».
- Escritura: «la emisión está libre de comisiones y gastos para el
  suscriptor».
- Acuerdo: «Los fondos anticipados podrán ser gestionados por el Emisor …».
- «El presente documento no es considerado un folleto informativo ni ha sido
  revisado por parte de la Comisión …».
- Sigue el conflicto entre el 50 % (Soft Cap) y el 70 % (escritura,
  condición «o»). Bien que no se publique ninguno de los dos.

### Hausera · textos de la tarjeta: confirmado

Los tres textos son los publicados el 10/11 y están en castellano llano, con
fuente, y no pasan de 120 caracteres:

- Mínimo (92): «Desde 100 € en Alicante 3, según su documento de emisión
  (10/11); la preventa abre el 18/11.» Respaldado por el «Ticket mínimo».
- Acceso desde España (116): «Emisión española para particulares que pasen
  el test de idoneidad del emisor; Hausera no está registrada en la CNMV.»
  Respaldado por el 5.7, que habla de «criterios de idoneidad» y de
  «considerarlo idóneo», y por el listado de la CNMV (abajo).
- Salida (115): «Cobras cuando se venden las viviendas (previsto en 20 meses,
  sin fecha cierta); sin mercado secundario garantizado.» Respaldado por los
  apartados 2.3.5, 2.3.7 y 8.6.

Ficha «en camino»: no lleva rentabilidad ni precio, como piden las normas.
Si se refecha el mínimo a «(11/11)», sigue respaldado y queda en 92
caracteres.

### Hausera · registro en la CNMV y tokens: confirmado con cambios

- CNMV, «Emisiones inscritas de URSUS-3 CAPITAL, A.V., S.A.»
  `https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es`.
  La página 1 se leyó a las 09:41:12Z; su SHA-256, `bc39c56a…`, es igual al
  del investigador. Las páginas 2 a 4 se leyeron entre las 09:41:23Z y las
  09:41:26Z. Hay **23 filas**; de Hausera, la SPV sin número y las SPV 2 a 8.
  La última, del **23/10/2026** («HAUSERA PROPERTY MANAGER SPV 8, S.A.»).
  **No figuran las SPV 9, 10 ni 11.** Volví a mirar la página 1 a las
  09:48:22Z y sigue sin ellas.
- Polygon, con la RPC pública `polygon-bor-rpc.publicnode.com` (copia en
  `polygon-alicante-contratos.txt`):
  - **Alicante_3** (`0xbc10…C265`), a las 09:41:51Z: `totalSupply = 0`. Sin
    cambios.
  - **Alicante_2** (`0x853F…8BAe`), a las 09:41:51Z: `totalSupply` =
    **51.960 tokens** (18 decimales). El investigador leyó 0 a las 09:28:47Z.
    Los registros del contrato muestran **2.127 acuñaciones** en 8
    transacciones, entre el bloque 97.122.591 (**09:29:03Z**) y el 97.122.680
    (**09:31:16Z**). Suman 51.960 tokens, que es el importe total del
    documento (51.960 valores de 100 €). No copio las direcciones de los
    monederos.
- Qué significa: las obligaciones de Alicante 2 se emitieron en la cadena
  hoy, el día anunciado para su «oferta pública», aunque la CNMV todavía no
  lista la SPV 10. Encaja con la tarjeta («Alicante 2 ya figuraba como
  financiada … antes de su oferta pública del 11/11»), así que **la tarjeta
  no cambia**. Lo que deja de ser cierto es lo que dicen el expediente y el
  resumen sobre los tokens de Alicante 2.

### Hausera · entidades, advertencias y avisos: confirmado

- Términos `https://hausera.io/terms/` (09:40:21Z): HOLDTX SPAIN, S.L. «no
  actúa como empresa de servicios de inversión».
- Listado de plataformas de financiación participativa de la CNMV
  (09:44:50Z): ni Hausera ni Holdtx. El control (Urbanitae) sí sale.
- Ficha de Ursus-3 en la CNMV (09:44:49Z): «Sociedades y Agencias de
  Valores · Nº Registro Oficial 251 · 29/08/2013».
- Los seis avisos de la tarjeta siguen siendo exactos. El aviso refechado
  que propone el investigador («El 11/11/2026 Alicante 3 aún no estaba
  inscrita en el registro de la CNMV») también queda respaldado por mi
  consulta de las 09:41Z y la de las 09:48Z.
- No miré otra vez la ficha de la EAFN nº 21, que es de una persona física.
  Me quedo con lo comprobado el 10/11.

### Advertencias de la CNMV: confirmado

- Buscador `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`
  (09:42:35Z–09:42:55Z). El control «Trading» devuelve «Página 1 de 16». Los
  12 nombres dan «No hay datos disponibles»: Hausera, Holdtx, Prosegur,
  Minos, Securitize, Profitus, Axiology, Valorix, Bit2Me, Token City, Lornin y
  Cando.
- PDF de «otras entidades» (09:43:05Z): SHA-256 `5e63b537…`, igual que el
  del investigador. No aparece ninguno de los 12; el control «Comunitae» sí.

### Candidatas (ninguna se admite): confirmado, salvo CANDO1

- **Pagarés tokenizados de Prosegur Cash.** La ERIR de Minos (09:43:13Z)
  tiene un texto idéntico línea a línea al del investigador, con una sola
  fila: «06/11/2026 · PROSEGUR CASH, S.A. … “1ª Emisión de Pagarés Prosegur
  Cash 2026” por importe de 500.000 euros». No hay documento, plazo, interés,
  mínimo ni destinatarios. La lista de ISIN (09:43:18Z) tiene el mismo
  SHA-256: 13 ISIN, entre ellos 11 pagarés «CASH/PAG» de nominal 100.000 €, y
  **ninguno de 500.000 €**.
  - Matiz: el resumen dice «ninguna fechada en noviembre», pero uno
    (ES0505229221) se emitió el 19/11/2025 y vence el 18/11/2026. Lo exacto
    es «ninguno emitido en noviembre de 2026».
  - No admitir: confirmado.
- **Securitize Stocks.** En `https://securitize.io/investments/stocks`
  (09:44:18Z) se lee «Now onchain for U.S. investors.», «Available in the
  U.S., EU and other eligible markets» y «offered by Securitize Markets,
  LLC … to eligible investors in permitted jurisdictions». Ninguna fuente
  dice que un particular en España pueda comprar hoy. No admitir: confirmado.
  - No desplegué las preguntas frecuentes; aparecen plegadas.
- **Profitus/Axiology.** La API pública
  `https://api.profitus.com/api/v1/landing/projects?limit=50&page=1`
  (09:43:51Z) da **7 proyectos «open_for_investments»**. Los 7 son préstamos
  («loan_type standard»): 2 en España y 5 en Lituania. No hay ningún bono.
  No admitir: confirmado.
- **Bono Valorix.** El blog de Bit2Me (09:44:06Z, SHA-256 `8beb83a8…`,
  igual) dice: «un bono corporativo tokenizado de 1 millón de euros, dirigido
  a inversores elegibles …, previsto para diciembre de 2026». Tienen el mismo
  SHA-256 que en la copia del investigador valorix.com, valorix.com/invertir.html
  y el documento de la emisión de enero. La ERIR de Bit2Me STX sigue vacía.
  No admitir: confirmado.
- **CANDO1.** `https://exchange.token-city.com/` y `/es` dan **503,
  «Sistema deshabilitado temporalmente · Estamos en mantenimiento»**, a las
  09:38:04Z, 09:38:05Z y 09:46:13Z. La ERIR de Token City (09:43:15Z) tiene
  el mismo SHA-256 que la del investigador: solo «SERIES A GRUPO UAE SA»
  (06/11), nada de CANDO1. **Hoy no se puede saber si CANDO1 sigue «En
  estudio».** El «no admitir» sigue siendo correcto, porque no hay documento
  de emisión ni inscripción.

### Datos personales en las copias: confirmado con cambios

- No hay DNI, IBAN ni correos personales. Los correos que salen son
  genéricos (contacto@, soporte@, info@…).
- Los nombres están recortados en las copias de Hausera, Prosegur Cash,
  Securitize y Profitus.
- **Falta recortar tres nombres de personas físicas** en
  `grupos/vigilancia/fuentes/bit2me/bit2me-blog-autorizacion-2026-11-11.txt`
  (líneas 68, 70 y 84: el CEO de Bit2Me STX, el CEO de Bit2Me y los dos
  fundadores).
- Nota menor: las copias de páginas de la CNMV llevan, en el menú, el nombre
  del premio de periodismo de la CNMV. Es el nombre de un premio, no un dato
  de nadie que intervenga en estas ofertas; no lo considero un fallo.

## Bloqueos

- Volví a probar los tres sitios bloqueados y **siguen igual desde este
  entorno**:
  - exchange.token-city.com: 503 por mantenimiento (09:38:04Z y 09:46:13Z);
  - valorix.es: «Connection reset by peer» (09:38:05Z);
  - stx.bit2me.com: 404 (09:38:08Z).
- No consulté la API de Token City mientras su web está en mantenimiento;
  CANDO1 queda sin comprobar hoy.
- La página de Alicante 2 no terminó de cargar toda la red en 60 s, pero el
  texto se leyó entero.

## Correcciones obligatorias

1. **Expediente `hausera-proximas-ofertas.json` y `resumen-vigilancia.md`:**
   cambiar lo que dicen de los tokens de Alicante 2, en tres sitios:
   - el claim «registro»: «Los contratos de Polygon de Alicante 2 y 3 siguen
     con suministro 0»;
   - `cambiosRespectoPublicado.registros`: «tokens con suministro 0»;
   - el resumen: «los tokens tienen suministro 0».

   Texto propuesto: «El contrato de Alicante 3 sigue con suministro 0
   (09:41:51Z). El de Alicante 2 acuñó 51.960 tokens el 11/11/2026 entre las
   09:29:03Z y las 09:31:16Z (5.196.000 €, el importe total), aunque a las
   09:48Z la CNMV aún no lista la SPV 10». El texto de la tarjeta no cambia.
2. **Copia `grupos/vigilancia/fuentes/bit2me/bit2me-blog-autorizacion-2026-11-11.txt`:**
   recortar los tres nombres de personas físicas (líneas 68, 70 y 84) y dejar
   el original solo en `fuentes/crudo/`, antes de cualquier commit.

## Recomendaciones (no bloquean)

- Resumen del grupo, en Prosegur Cash: cambiar «ninguna fechada en
  noviembre» por «ninguna emitida en noviembre de 2026».
- Resumen del grupo, en Hausera: no presentar «a las 09:16 UTC quedaban 6
  días, 23 horas y 43 minutos» como hora UTC de apertura. La cuenta atrás
  depende del reloj del navegador, y la hora de España sería las 08:00 UTC.
- Volver a mirar la ERIR de Ursus-3 en los próximos días: Alicante 2 ya está
  en la cadena y su inscripción en la CNMV debería llegar.
- Si el coordinador refecha los avisos al 11/11, tiene respaldo de hoy.
