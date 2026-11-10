# Revisión independiente · grupo candidatas-europa · 10/11/2026

No preparé estos expedientes. Volví a abrir las fuentes primarias para
intentar refutarlos. Todas las consultas son del 10/11/2026, entre las
**09:32 y las 09:44 UTC**. Solo usé páginas, documentos, API y registros
públicos. No inicié sesión, no hice KYC y no edité los expedientes.

- Extractos en texto, sin nombres de personas: `fuentes/candidatas-europa/`.
- Inventario con URL, hora, HTTP, bytes y SHA-256 de 69 consultas:
  `fuentes/candidatas-europa/inventario-revisor.json`.
- Respuestas completas: `fuentes/candidatas-europa/crudo/`, fuera de Git.

## Veredicto

**Aprobado con cambios.** Ninguna candidata se propone para admitir ni para
retirar, y las cinco decisiones `no_admitir` se sostienen. Pero hay que
corregir tres cosas antes de copiar nada del grupo a Git:

1. **Datos personales** en tres copias del grupo (apartado 5).
2. **OilXCoin:** el expediente afirma cosas que hoy no son ciertas. Sí hay
   una empresa de inversión regulada que lo vende (Assetera, con pasaporte
   en España), hay un precio a la vista y el mínimo tiene un conflicto.
3. **Oceanpoint y el resumen del grupo:** los 3 inmuebles en negociación
   están en Liubliana (Eslovenia), no en Brujas. La lista de ESMA del régimen
   piloto DLT tiene 7 infraestructuras, no 4.

| Asunto | Decisión del grupo | Mi veredicto |
|---|---|---|
| `reinvest24` (cambio crítico: advertencia de la CNMV) | no_admitir | confirmado con cambios (texto de la tarjeta) |
| `dexentra-oilxcoin` | no_admitir | confirmado con cambios (hechos erróneos) |
| `blocksquare-oceanpoint-marketplace` | no_admitir | confirmado con cambios (ubicación de los inmuebles) |
| `profitus-axiology-bonos-digitales` | no_admitir (vigilar) | confirmado con cambios (fecha y alcance de fuentes) |
| `bergfuerst` | no_admitir | confirmado |
| Copias del grupo | sin datos personales | **corrección obligatoria** |
| Resumen del grupo | — | **corrección obligatoria** (3 frases) |

## 1. El cambio crítico: advertencia de la CNMV sobre Reinvest24

Lo confirmo.

- **Buscador de advertencias de la CNMV**, búsqueda «Reinvest24»
  (https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=Reinvest24),
  09:32:54Z. Da una fila: «09/06/2025 · WWW.REINVEST24.COM · REINVEST24 OÜ».
- **El PDF de la advertencia** (enlace del expediente), 09:32:55Z. Su
  SHA-256 es `4d9543c1…`, idéntico al del investigador. Dice «REINVEST24 OÜ
  no está autorizada para desarrollar la actividad reservada a las
  plataformas de financiación participativa», con fecha «9 de junio de 2025».
- **reinvest24.com**, 09:32:56Z: «Reinvest24 has stopped publishing new
  projects in November 2023 and does not accept new investments».
- **Registros:** no está entre los 261 proveedores del registro de
  financiación participativa de ESMA (09:33:11Z). Tampoco entre los 48 del
  listado de la CNMV (09:33:12Z).

**Corrección en la tarjeta:** el texto «No: la CNMV advierte que no está
autorizada en España (09/06/2025)» generaliza. La advertencia se limita a la
actividad de plataforma de financiación participativa. Propongo: «No: la CNMV
advirtió el 09/06/2025 que no está autorizada como plataforma de
financiación participativa» (103 caracteres).

## 2. Los expedientes, uno a uno

### dexentra-oilxcoin · no_admitir confirmado, con hechos que corregir

**Lo que se confirma:**

- **Registro de folletos de ESMA** (09:33:42Z). STDA-91 es un «Standalone
  prospectus» aprobado el 2026-04-10, de categoría «SME under PR Article
  15(1)(a)», con ISIN CH1376324914. Lo notificaron a 26 Estados, «SPAIN»
  entre ellos.
- **Pasaportes recibidos por la CNMV** (09:33:43Z). STDA-91 aparece con
  notificación y aprobación el «10/04/2026». La columna «Traducción de la
  Nota de Síntesis» está vacía para STDA-91; para STDA-79 dice «Sí».
- **Nota de síntesis en español** (09:33:46Z, SHA-256 `861d53f3…`, idéntico).
  Confirma lo que cita el expediente:
  - «La inversión mínima es de 100 OilXCoin»;
  - «El precio máximo será de 100 USD»;
  - el periodo de oferta, que empezó el 10/04/2026 y dura como mucho un año;
  - «no proporcionan un rendimiento fijo ni periódico»;
  - «patrimonio neto por importe de 50.910,46 USD» a 31/12/2024;
  - sin admisión a negociación;
  - «El Emisor es el oferente» (apartado 4.3).
- **Portada oilxcoin.io** (09:33:44Z): «designed for accredited and
  qualified investors worldwide». Es cierto.
- **CNMV, advertencias:** «DeXentra» (09:38:22Z) y «OilXCoin» (09:38:24Z)
  dan «No hay datos disponibles.».

**Lo que refuto o matizo:**

1. **Sí hay un intermediario regulado.**
   - El mercado de Assetera (https://marketplace.assetera.com/) lista «OXC /
     USDC · Bond · OilXCoin».
   - Sus datos, en el HTML de las 09:43:46Z: `"issuer":{"name":"DeXentra
     GmbH"}`, `"offersPrimary":true`, `"offersSecondary":false`,
     `"listingPhase":"live"` y `"marketNature":"private"`.
   - Assetera GmbH (Viena) es una empresa de servicios de inversión del EEE
     en libre prestación en España: **CNMV nº 5216, desde el 26/10/2023**
     (ficha de la CNMV, 09:43:17Z). En el registro de ESMA figura como
     «Investment firm · Active · AUSTRIA · Austrian Financial Market
     Authority (FMA)» (09:44:38Z).
   - La propia web del emisor enlaza vídeos sobre «trading on security
     platforms»: Assetera y Archax (oilxcoin.us/en/support/videos, 09:42:06Z).
   - Por tanto, «lo vende directamente el emisor sin intermediario regulado»
     ya no es exacto. Lo vende el emisor en su web **y** se ofrece en compra
     primaria a través de Assetera. No sé si Assetera admite a un particular
     residente en España para OXC: sería en una cuenta, y el mercado está
     marcado como «private».
2. **El precio no es del todo invisible.** El render del mercado de Assetera
   (09:42:41Z) muestra «Last purchase price 1.80 USDC». No es un precio de
   emisión publicado por el emisor y no sé con qué base se calcula, así que
   no debe publicarse. Pero el texto «no se ve publicado (10/11)» hay que
   matizarlo.
3. **Hay un conflicto en el mínimo.** La página Tokenomics del emisor
   (oilxcoin.us/en/token/tokenomics, 09:34:33Z) dice «Minimum transaction
   size · None». La nota de síntesis dice «La inversión mínima es de 100
   OilXCoin». El expediente da el mínimo como respaldado y no recoge el
   conflicto.
4. **El acceso desde España no está en conflicto como se dice.** El contrato
   de suscripción publicado (oilxcoin.us/en/token/token-subscription-agreement,
   09:34:35Z) exige que el comprador sea residente en una lista de países
   «Spain» incluido, y pide la condición de «accredited investor» solo a los
   compradores de EE. UU. Ese mismo contrato remite todavía al folleto
   aprobado el «28 February 2025», no al de 2026: está desfasado. La frase
   de la portada sobre «accredited and qualified investors» es comercial.
   Los documentos contractuales no la reflejan.
5. **Salida.** Se sostiene: tampoco en Assetera hay mercado secundario
   (`"offersSecondary":false`).

La decisión `no_admitir` se sostiene. Hay motivos de sobra: el acceso desde
España por Assetera no está confirmado, el mínimo está en conflicto, no hay
salida salvo la «Terminación», es deuda subordinada y el emisor es muy
pequeño. Pero el motivo y dos textos de la tarjeta hay que corregirlos
(ver «Correcciones obligatorias»).

### blocksquare-oceanpoint-marketplace · no_admitir confirmado, con la ubicación corregida

**Lo que se confirma:**

- **FAQ** (09:35:04Z): «Luxembourg company (registered as Blocksquare S.à
  r.l., being renamed Oceanpoint S.à r.l.)». También: «Buying and holding
  BSPTs requires an account and KYC verification on a marketplace, and some
  countries are not supported» y «POINT has not launched yet».
- **Términos** (09:35:05Z): «Last modified: February 16, 2022» y «purely
  non-custodial».
- **Stats** (09:35:05Z): «Properties trading · 3», «Marketplace fills · 451»
  y «Wallets · 64», con datos de «Sep 2026».
- **Registros:**
  - CASP: sin coincidencias en el CSV de ESMA (09:35:06Z).
  - Financiación participativa: no figura en el registro ECSP de ESMA
    (09:33:11Z).
  - Empresa de inversión: no figura en el registro de ESMA (09:44:38Z).
  - CNMV: no está en sus listados de plataformas europeas ni de empresas de
    inversión del EEE (09:33:12Z, 09:43:06Z).
- **CNMV, advertencias:** «Blocksquare» y «Oceanpoint» dan «No hay datos
  disponibles.» (09:38:25Z y 09:38:27Z).

**Lo que refuto:** «3 inmuebles en Brujas» no es correcto.

- La portada (09:35:04Z) incrusta en su HTML la lista de inmuebles con su
  estado. Hay `"tradingCount":3`, y los tres con `"status":"TRADING"` están
  en Liubliana (Eslovenia):
  - BSPT-OCN-15, una residencia de estudiantes en Vrhovci;
  - BSPT-OCN-1, una residencia compartida de 24 habitaciones;
  - BSPT-OCN-0, una plaza de garaje en el Techpark.
- Los cinco de Brujas (BSPT-OCN-2, 3, 4, 5 y 39) tienen
  `"status":"LISTED"`.
- La tarjeta que la página de Trade enseña en grande cambia de un render a
  otro: a las 09:35 era la de Liubliana, no la de Groeninghe. Por eso no
  sirve para saber dónde están los inmuebles.

La decisión no cambia: no hay licencia, ni documento de emisión, ni lista de
países.

### profitus-axiology-bonos-digitales · no_admitir confirmado

**Lo que se confirma:**

- **CNMV** (09:33:12Z): «UAB "PROFITUS CROWDFUNDING" · LITUANIA · 21 ·
  28/12/2023».
- **Registro ECSP de ESMA** (09:33:11Z): «Active», autorizada el
  10/11/2023, con `ae_hostMemberState` «ESTONIA,SPAIN,GERMANY,LATVIA».
- **Lista de infraestructuras DLT de ESMA** (09:36:00Z, SHA-256 `8f223820…`,
  idéntico): «UAB Axiology DLT · Axiology DLT TSS · … Lietuvos bankas … 9
  July 2025».
- **Página de bonos de Profitus** (09:35:58Z): «We partner with Axiology …
  to distribute bonds».
- **Hoy no hay bonos abiertos.** Lo comprobé en la API pública que usa la
  web, api.profitus.com/api/v1/landing/projects (09:36:53Z, 11 páginas):
  - hay 545 proyectos;
  - 5 están en `open_for_investments`, y los 5 son `loan_type=standard`
    (préstamos);
  - solo uno tiene `loan_type=bonds`: «"Gesons" Bonds» (P00001567), en
    estado `confirmed`, es decir, ya cerrado.
- **CNMV, advertencias:** «Profitus» y «Axiology» dan «No hay datos
  disponibles.» (09:38:29Z y 09:38:30Z).

**Lo que hay que matizar:**

- **Fecha del PDF de ESMA.** El expediente le pone «2026-01», pero los
  metadatos dicen que se creó el 04/11/2026 y se modificó el 05/11/2026. La
  URL conserva «2026-01».
- **Bonos pasados.** El bloqueo dice que no hay en público una lista de
  emisiones pasadas. Sí la hay en la API: aparece el bono Gesons, cerrado.
- **Peso de la lista de países.** `primary_countries` de
  /ss/locale/countries es una lista de la interfaz (idioma y países), no una
  autorización. El acceso desde España descansa en la CNMV nº 21 y en el
  registro de ESMA (`hostMemberState` con SPAIN). Así habría que citarlo.

### bergfuerst · confirmado

- **Aviso legal** (de.bergfuerst.com/impressum, 09:33:32Z): «BERGFÜRST AG
  i.L. (in Liquidation)». Licencia de BaFin «im Hinblick auf die Vermittlung
  von Krediten», con «Registernummer: 48448».
- **Pie de bergfuerst.com/es** (09:33:34Z): «BERGFÜRST AG i.L. (en
  liquidación)».
- **CNMV** (09:33:12Z): «BERGFÜRST AG · ALEMANIA · 47 · 20/12/2025».
- **ESMA:** dos entradas «Active». La de «BERGFÜRST AG», actualizada el
  02/06/2026, tiene `hostMemberState` SPAIN.
- **CNMV, advertencias:** «Bergfürst» y «Bergfurst» dan «No hay datos
  disponibles.».
- El texto de la tarjeta se sostiene.

### reinvest24 · ver apartado 1

## 3. Textos de la tarjeta (`resumenTarjeta`)

Todos tienen 120 caracteres o menos y están en castellano llano. Ninguno se
publica, porque las cinco son `no_admitir`. Aun así, deben estar
respaldados:

| Slug · campo | Texto | ¿Respaldado hoy? |
|---|---|---|
| oilxcoin · minimo (83) | «100 tokens; el precio lo fija el emisor (máx. 100 USD) y no se ve publicado (10/11)» | **No del todo**: el mínimo choca con «Minimum transaction size · None» y Assetera muestra un último precio. Propuesta: «Folleto: 100 tokens; la web del emisor dice que no hay mínimo. Precio no publicado por el emisor (10/11)» (104) |
| oilxcoin · accesoEspana (73) | «El folleto incluye España, pero la web lo dirige a inversores acreditados» | **No del todo**: el contrato admite residentes en España sin exigirles ser acreditados. Propuesta: «Folleto y contrato incluyen España; sin confirmar que Assetera o la web acepten particulares de España» (102) |
| oilxcoin · salida (68) | «Sin mercado ni recompra: solo cobras si el token se da por terminado» | Sí (nota 3.2.1 y Terminación; Assetera `offersSecondary:false`) |
| oceanpoint · accesoEspana (74) | «Sin confirmar: pide KYC y dice que algunos países no se admiten, sin lista» | Sí (FAQ) |
| oceanpoint · salida (73) | «Reventa a otro usuario en su mercado; la liquidez prometida aún no existe» | Sí. Mejor «anunciada» que «prometida» (más neutro) |
| profitus · accesoEspana (76) | «Plataforma con pasaporte en España (CNMV nº 21); hoy no hay bonos a la venta» | Sí |
| bergfuerst · accesoEspana (71) | «Notificada en España (CNMV nº 47), pero la sociedad está en liquidación» | Sí |
| reinvest24 · accesoEspana (66) | «No: la CNMV advierte que no está autorizada en España (09/06/2025)» | Generaliza: ver apartado 1 |

## 4. Muestreo «sin cambios»

Este grupo no tiene fichas publicadas. Por eso comprobé una muestra de lo
que el resumen da por igual que antes:

- **LCX Earn** (lcx.com/en/earn, 09:39:18Z): «LCX Earn is closed to new
  investments». Sigue cerrado. Confirmado.
- **Exporo:** en ESMA aparece «EPH Investment GmbH · Exporo · Active ·
  GERMANY», sin `hostMemberState`. Tampoco está en el listado de la CNMV.
  Confirmado: no está notificada en España.
- **STOKR y Smart Valor** (CSV de CASP de ESMA, 09:35:06Z):
  - STOKR S.A.: CSSF, desde el 22/06/2026, custodia y transferencia;
  - SMART VALOR AG: FMA de Liechtenstein, desde el 01/07/2026.
  - Confirmado.
- **NN Bank** (09:41:33Z): «PROHIBITION OF SALES TO EEA RETAIL INVESTORS»,
  y el documento es un «fictional tokenised programme» del 26 May 2026.
  Confirmado.
- **Ficha de Blocksquare en el radar:** su plantilla de términos
  (docs.blocksquare.io, 09:39:19Z) sigue exigiendo KYC y control de
  sanciones, y deja en blanco la ley aplicable («governed by ______ law»).
  Lo que dice la ficha publicada sigue siendo cierto.
  - **Aviso para el coordinador:** la ficha dice que no se puede confirmar
    «que haya portales en funcionamiento». Hoy Oceanpoint enseña 3 inmuebles
    en negociación y una foto de la red Blocksquare generada el 10/11. Ese
    texto se podría actualizar en otro ciclo, con fuente.

## 5. Datos personales en las copias del grupo (corrección obligatoria)

Busqué nombres y correos en todo lo que iría a Git: lo que queda fuera de
`crudo/` y no es PDF ni HTML. Encontré estos cuatro casos sin recortar:

| Archivo | Línea | Qué hay |
|---|---|---|
| `fuentes/profitus/profitus-bonds.render.txt` | 240 | nombre y apellidos del responsable de mercados de capitales de Profitus |
| `fuentes/profitus/profitus-bonds.render.txt` | 244 | su correo personal (nombre.apellido@profitus.lt) |
| `fuentes/profitus/profitus-news.render.txt` | 59 | nombre y apellido de una persona en un titular de noticia |
| `fuentes/bancos/nn.txt` | 2593 | dos correos personales (nombre.apellido@rabobank.com) |

La nota del expediente de Profitus dice que la copia «lleva el nombre de una
persona recortado», pero solo se recortó el de la cita del consejero
delegado de Axiology.

Fuera de eso, las copias de Bergfürst, Oceanpoint, Blocksquare, STOKR y la
nota de OilXCoin tienen los nombres recortados («[nombre recortado]»).

En las copias de páginas de la CNMV aparece el nombre de su «Premio de
periodismo», que está en el menú de la web. Es texto institucional y
también está en copias de ciclos anteriores. No lo considero bloqueante.

## 6. Errores en el resumen del grupo (corrección obligatoria)

`grupos/candidatas-europa/resumen-candidatas-europa.md` tiene que cambiar en
cuatro puntos:

1. **Oceanpoint.** Dice «3 inmuebles en Brujas (Bélgica)». Hay que poner «3
   inmuebles en negociación, los tres en Liubliana (Eslovenia); otros cinco
   de Brujas figuran como "LISTED"». El mismo error está en la descripción
   de la tabla y en «Las ideas del encargo».
2. **Régimen piloto DLT.** Dice «La lista de ESMA (enero de 2026) incluye 4
   infraestructuras». Es la versión del 04–05/11/2026 y tiene 7: CSD Prague,
   21X, 360X, Axiology, LISE, Securitize Europe DLT TSS (CNMV, 26/11/2025) y
   Bit2Me STX DLT TSS (CNMV, 27/10/2026). Las dos españolas quedan fuera del
   ámbito «otros países del EEE». Aun así, la frase «Solo Axiology tiene un
   canal claro…» debe decir «de las no españolas».
3. **Bloqueos.** Dice que «El registro ECSP de ESMA no dice a qué países
   tiene pasaporte cada plataforma». No es así: el campo `ae_hostMemberState`
   lo dice. Por ejemplo, Profitus da «ESTONIA,SPAIN,GERMANY,LATVIA».
4. **OilXCoin.** Dice «lo vende el propio emisor suizo, sin intermediario
   regulado». Hay que añadir que también está en compra primaria en
   Assetera (CNMV nº 5216), sin acceso desde España confirmado.

## 7. Lo que no comprobé

- No repetí el barrido de las 44 portadas de plataformas ni el recuento de
  208 emisores con folleto pasaportado. Tampoco abrí los folletos de S01
  Issuer ni de NOEMON (son pistas para otro grupo).
- No entré con cuenta en Assetera, Oceanpoint, OilXCoin ni Profitus. Por
  eso no sé si Assetera acepta a residentes en España para OXC, qué es
  exactamente el «Last purchase price 1.80 USDC» ni el precio de cada BSPT.
- El buscador de advertencias de la CNMV solo se consultó en su tipo
  «No autorizadas» (`tipo=1`), igual que el investigador. La búsqueda de
  control «Okx» dio sus dos filas (09:38:36Z).
- Para la licencia de Bergfürst no consulté el registro de BaFin
  directamente. Usé su aviso legal y los registros de ESMA y de la CNMV.

## Correcciones obligatorias

1. **Recortar los datos personales** de las cuatro líneas del apartado 5,
   en `profitus-bonds.render.txt`, `profitus-news.render.txt` y `nn.txt`,
   antes de copiar el grupo a Git.
2. **`dexentra-oilxcoin`:**
   - corregir `motivoDecision`, `entidadComercializadora`, el criterio
     `entidadYPermisos` y `prioridadEditorial.porQueNo`: ya hay un
     intermediario regulado (Assetera, CNMV nº 5216) en compra primaria, sin
     acceso desde España confirmado;
   - marcar el claim de `minimo` como `en_conflicto` (100 OilXCoin según la
     nota; «None» según Tokenomics);
   - añadir el claim del contrato de suscripción (residentes en España; ser
     acreditado solo se exige en EE. UU.; remite al folleto de 2025);
   - cambiar `resumenTarjeta.minimo` y `resumenTarjeta.accesoEspana` por los
     textos del apartado 3, o por otros que recojan los conflictos.
3. **`blocksquare-oceanpoint-marketplace`:** corregir el claim de `estado`,
   `jurisdiccion`, `actividadYFecha`, `porQueDestaca` y `motivoDecision`. Los
   3 inmuebles en negociación están en Liubliana (Eslovenia); los de Brujas
   figuran como «LISTED».
4. **`profitus-axiology-bonos-digitales`:**
   - la fecha del PDF de ESMA es del 04–05/11/2026, no «2026-01»;
   - el acceso desde España descansa en la CNMV nº 21 y en el
     `hostMemberState` de ESMA, no en la lista de países de la interfaz;
   - el bloqueo debe mencionar el bono Gesons, ya cerrado.
5. **`reinvest24`:** precisar `resumenTarjeta.accesoEspana`: no está
   autorizada como plataforma de financiación participativa.
6. **`resumen-candidatas-europa.md`:** corregir los cuatro puntos del
   apartado 6.
