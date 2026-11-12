# Grupo «vigilancia» · 12 de noviembre de 2026

Puesta al día rápida. Lo leí todo hoy, 12/11/2026, entre las 00:33 y las 00:49
UTC. No inicié sesión, no hice KYC, no usé monederos ni rellené formularios.
Cada lectura está en `inventario-consultas.json`, con la URL, la hora, el código
HTTP, el tamaño y el SHA-256. Las respuestas crudas van en `fuentes/crudo/`,
que no entra en Git. Los PDF de Hausera llevan nombres, DNI e IBAN, así que no
los guardo: anoto solo su SHA-256.

## En pocas palabras

**Hoy no cambia nada importante.** Desde ayer a las 09:30 UTC solo han pasado
unas 15 horas.

- **Hausera:** se mantiene tal cual. Si se quiere, el aviso de la inscripción
  se puede poner con fecha del 12/11.
- **Candidatas:** no propongo admitir ninguna de las seis.
- **Crypto.com:** el motivo exacto del «no» está más abajo.

| Ficha | Decisión | Qué pasa hoy |
|---|---|---|
| Hausera · próximas ofertas (publicada) | mantener | Alicante 3: preventa el 18/11 a las 09:00 y suscripción el 25/11. Alicante 2 sigue «FINANCIADA». Los cuatro documentos son idénticos (mismo SHA-256). Ninguna de las dos está inscrita todavía en la CNMV. |
| Pagarés de Prosegur Cash | no admitir | Solo existe la inscripción de la CNMV del 06/11 (500.000 €). No hay documento ni condiciones. |
| Securitize Stocks | no admitir | Lo ofrece una entidad de EE. UU. «a inversores elegibles». No hay lista de países ni KID. |
| Bonos de Profitus/Axiology | no admitir | Hay 7 proyectos abiertos y los 7 son préstamos. Ningún bono. |
| Bono Valorix (Bit2Me STX) | no admitir | Sigue «previsto para diciembre de 2026», sin documento de emisión. |
| CANDO1 (Token City) | no admitir | La web sigue en mantenimiento (503). No consta en la CNMV. |
| Acciones tokenizadas de Crypto.com (EEE) | no admitir | El KID no está en ninguna fuente pública que se pueda abrir desde aquí. Detalle abajo. |

## Hausera (publicada) · mantener

**Qué miré:**

- Las páginas de Oportunidades, Alicante 3 y Alicante 2, la portada, los
  términos y la FAQ. Usé un navegador en español, sin sesión.
- Los datos públicos del sitio (JSON).
- Los cuatro PDF.
- En la CNMV: el registro ERIR de Ursus-3 (sus cuatro páginas), el índice ERIR,
  la ficha de Ursus-3, el listado de plataformas de financiación participativa
  y las advertencias.
- En Polygon, los dos contratos de los tokens.

**Resultado:**

- **Alicante 3 sigue como «PRÓXIMA OPORTUNIDAD»**, con la preventa el
  18/11/2026 a las 09:00. A las 00:37 UTC la cuenta atrás marcaba 6 días, 8
  horas y 22 minutos. La oferta pública empieza el 25/11/2026. En los datos
  públicos figura como `COMMINGSOON`.
- **Alicante 2 sigue «FINANCIADA».** El único cambio del día está en los datos
  internos de la web: su estado pasa de `PRESALE_CLOSED` a `FUNDED`. Lo que ve
  el visitante no cambia.
- **Los documentos no han cambiado.** El documento de emisión, el acuerdo de
  reserva con la escritura, el dossier y el documento de Alicante 2 tienen el
  mismo SHA-256 que el 10/11 y el 11/11. Por tanto, el mínimo de 100 €, el
  acceso de particulares tras el test, la salida al vender, la ausencia de
  comisiones y el uso del dinero de la reserva siguen igual.
- **¿Están ya inscritas en el registro de la CNMV? No.**
  - El texto de las cuatro páginas del registro de Ursus-3 es idéntico al de
    ayer.
  - De Hausera solo figuran las SPV, 2 a 8; la última es del 23/10/2026. No
    están la 9, la 10 ni la 11.
  - En cadena, Alicante 2 conserva los 51.960 tokens acuñados ayer, aunque la
    CNMV todavía no la lista. Alicante 3 sigue con 0 tokens.
- **Advertencias de la CNMV:** ninguna para Hausera ni para Holdtx.
  - Comprobé que el buscador funcionaba con «Trading», que devuelve 16
    páginas.
  - El PDF de «otras entidades» es el mismo que el 10/11 y el 11/11.
- **Portada:** las cifras del promotor no cambian (42 operaciones, 24
  terminadas, 128 M€).

**Propuesta:** dejar la tarjeta igual. Hay un único cambio opcional: el aviso
«El 10/11/2026 Alicante 3 aún no estaba inscrita…» puede pasar a «El
12/11/2026…», porque lo he comprobado hoy en la CNMV. La fecha que acompaña al
mínimo puede pasar a (12/11), porque el documento es idéntico. Ninguno de los
dos cambios es crítico.

Próximas fechas: el **18/11** (preventa) y el **25/11** (suscripción).

## Candidatas

- **Pagarés tokenizados de Prosegur Cash:** sin cambios.
  - El registro ERIR de Minos tiene el mismo texto que ayer: solo la «1ª
    Emisión de Pagarés Prosegur Cash 2026», de 500.000 €, inscrita el 06/11.
  - La última comunicación de Prosegur Cash a la CNMV sigue siendo la del 03/11.
    La lista de ISIN no cambia.
  - Las comunicaciones y la prensa de su web, y la portada de Minos, siguen
    igual. Los JSON de comunicaciones tienen el mismo SHA-256.
  - No hay documento de emisión, mínimo, plazo, interés ni destinatarios.
  - **No admitir.**
- **Securitize Stocks:** sin cambios.
  - La página sigue diciendo que los ofrece Securitize Markets, LLC (EE. UU.)
    «to eligible investors in permitted jurisdictions». También sigue diciendo
    «Now onchain for U.S. investors».
  - La FAQ exige KYC y un monedero propio en lista blanca, y cobra un 0,10 %
    por operación en USDC.
  - Los tres documentos europeos tienen el mismo SHA-256.
  - La ficha de Securitize Europe en la CNMV (nº 327) no cambia. Pero ninguna
    fuente dice que un particular de España pueda comprar este producto hoy.
  - **No admitir.**
- **Bonos digitales de Profitus/Axiology:** hoy no hay ningún bono abierto.
  - La API pública lista 550 proyectos.
  - Hay 7 abiertos y los 7 son préstamos «standard»: 3 en España y 4 en
    Lituania. Han entrado dos préstamos nuevos y han salido dos.
  - Profitus sigue en el listado de la CNMV como plataforma europea de
    financiación participativa (nº 21).
  - **No admitir.** Seguir vigilando.
- **Bono Valorix (Bit2Me STX):** sin cambios.
  - La nota de Bit2Me sigue diciendo «previsto para diciembre de 2026», para
    «inversores elegibles».
  - valorix.com, su página «invertir» y el documento de enero son byte a byte
    iguales.
  - El registro ERIR de Bit2Me STX sigue vacío.
  - **No admitir:** no hay documento del bono de diciembre.
- **CANDO1 (Token City):** no se puede ver.
  - exchange.token-city.com sigue en mantenimiento (503 con curl y con el
    navegador).
  - El registro ERIR de Token City no cambia: solo tiene Series A Grupo UAE.
  - **No admitir.** Mirar otra vez cuando vuelva la web.
- **Acciones tokenizadas de Crypto.com (EEE): no admitir, por este motivo
  exacto.**
  - **Falta el KID en una fuente pública que se pueda abrir desde aquí.**
    - Las condiciones (versión del 11/08/2026, mismo SHA-256) dicen en el 5.2
      que FCCY entrega el KID «via the Crypto.com App».
    - La página europea de divulgaciones, donde estaría el KID, nos redirige
      (301) a la portada de crypto.com por el país desde el que consultamos.
      Las rutas en español dan 404. No se intenta saltar ese filtro.
    - Sin KID no podemos comprobar costes ni escenarios.
  - **La lista de países excluidos** está, según el 3.1(d), en unas FAQ que no
    he localizado. Así que ningún documento del producto confirma que España no
    esté excluida.
  - **Lo que sí está acreditado hoy:**
    - FORIS CAPITAL CY LIMITED tiene la licencia de la CySEC 344/17, del
      27/11/2017. En su ficha figura España entre los países donde opera.
    - Está en la CNMV con el nº 4485, en libre prestación desde el 19/01/2018.
      La ficha tiene el mismo SHA-256 que ayer.
    - La App Store española lo anuncia en castellano: «desde 1 USD», versión
      3.244.01 del 11/11/2026.
  - **Además:** es un derivado OTC con FCCY como única contraparte, en USD y no
    transferible a otra cartera.
  - Sin advertencias de la CNMV: las búsquedas «Crypto.com» y «Foris» solo
    devuelven dominios clon que no son esta empresa.

## Advertencias de la CNMV de hoy

Busqué estos nombres entre las 00:34:21 y las 00:34:38 UTC:

- Hausera, Holdtx, Prosegur, Minos, Securitize, Profitus, Axiology, Valorix,
  Bit2Me, Token City, Lornin y Cando: **ninguno aparece**.
- Crypto.com y Foris: solo salen dominios clon ajenos.

El PDF de «otras entidades» tiene el mismo SHA-256 que el 10/11 y el 11/11.

## Bloqueos

- **exchange.token-city.com:** 503 por mantenimiento (00:41:13 y 00:45:48
  UTC).
- **valorix.es:** curl corta la conexión (00:41:05) y el navegador da 502
  (00:45:51).
- **stx.bit2me.com:** 404 sin sesión.
- **Página del KID de Crypto.com:** redirige con un 301 por el país de origen.
  No se elude.
- **Fichas de Alicante 2 y 3 en el navegador:** agotaron la espera de red
  (código 0), pero la página se pintó entera y el texto se guardó. Los datos
  JSON se leyeron con curl (200).
- **No reabiertos hoy, por rapidez** (nada en ellos afecta a una decisión):
  - la página profitus.com/bonds;
  - la ficha de la EAFN nº 21 (último dato, del 11/11: solo asesoramiento).

## Datos personales

- **Recortados en las copias:** el nombre de una persona en la portada de
  Hausera y tres nombres en las páginas de Prosegur Cash. Los originales están
  solo en `fuentes/crudo/`.
- **No guardados:** los PDF de Hausera.
