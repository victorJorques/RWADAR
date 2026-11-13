# Grupo «vigilancia» · 13 de noviembre de 2026

Puesta al día rápida. Lo leí todo hoy, 13/11/2026, entre las 08:30 y las 08:38
UTC. No inicié sesión, no hice KYC, no usé monederos ni rellené formularios.
Cada lectura está en `inventario-consultas.json`, con la URL, la hora, el código
HTTP, el tamaño y el SHA-256. Las respuestas crudas van en `fuentes/crudo/`,
que no entra en Git. Los PDF de Hausera llevan nombres, DNI e IBAN, así que no
los guardo: anoto solo su SHA-256 y los borré tras calcularlo.

## En pocas palabras

**Hoy no cambia nada importante.**

- **Hausera:** se mantiene tal cual. Alicante 3 conserva la preventa del
  **18/11/2026 a las 09:00**. Si se quiere, el aviso de la inscripción y la
  fecha del mínimo pueden pasar al 13/11.
- **Candidatas:** no propongo admitir ninguna de las seis.
- **Única novedad:** la web de Token City vuelve a funcionar, pero CANDO1 sigue
  «En estudio».

| Ficha | Decisión | Qué pasa hoy |
|---|---|---|
| Hausera · próximas ofertas (publicada) | mantener | Alicante 3: preventa el 18/11 a las 09:00 y suscripción el 25/11. Alicante 2 sigue «FINANCIADA». Los datos del sitio y los cuatro documentos son idénticos a los de ayer (mismo SHA-256). Ninguna de las dos está inscrita todavía en la CNMV. |
| Pagarés de Prosegur Cash | no admitir | Solo existe la inscripción de la CNMV del 06/11 (500.000 €). No hay documento ni condiciones. |
| Securitize Stocks | no admitir | Lo ofrece una entidad de EE. UU. «a inversores elegibles». No hay lista de países ni KID. |
| Bonos de Profitus/Axiology | no admitir | Hay 7 proyectos abiertos y los 7 son préstamos. Ningún bono. |
| Bono Valorix (Bit2Me STX) | no admitir | Sigue «previsto para diciembre de 2026», sin documento de emisión. |
| CANDO1 (Token City) | no admitir | La web ya funciona, pero CANDO1 está «En estudio» (solo lista prioritaria). No hay documento ni inscripción en la CNMV. |
| Acciones tokenizadas de Crypto.com (EEE) | no admitir | El KID sigue sin estar en ninguna fuente pública que se pueda abrir desde aquí. |

## Hausera (publicada) · mantener

**Qué miré:**

- Con un navegador en español y sin sesión:
  - las páginas de Oportunidades, Alicante 3 y Alicante 2;
  - la portada, los términos y la FAQ.
- Los datos públicos del sitio (JSON).
- Los cuatro PDF.
- En la CNMV:
  - el registro ERIR de Ursus-3 (sus cuatro páginas) y el índice ERIR;
  - la ficha de Ursus-3 y la ficha general de la EAFN nº 21;
  - el listado de plataformas de financiación participativa y las advertencias.
- En Polygon, los dos contratos de los tokens.

**Resultado:**

- **Alicante 3 sigue como «PRÓXIMA OPORTUNIDAD»:**
  - «Preventa: 18/11/2026 09:00h».
  - A las 08:33 UTC la cuenta atrás marcaba 5 días, 0 horas y 26 minutos.
  - La oferta pública empieza el 25/11/2026.
  - En los datos públicos sigue como `COMMINGSOON`, con preventa el
    18/11/2026 y lanzamiento el 25/11/2026.
  - **La preventa del 18/11 se mantiene.**
- **Alicante 2 sigue «FINANCIADA»** (`FUNDED`).
- **El sitio no cambia.** Las tres páginas de datos tienen el mismo SHA-256 que
  ayer. Solo cambia el identificador de compilación del sitio, que no es
  contenido. Los términos y la FAQ tienen el mismo texto.
- **Los documentos no cambian.** El documento de emisión, el acuerdo de reserva
  con la escritura, el dossier y el documento de Alicante 2 tienen el mismo
  SHA-256 que el 10/11, el 11/11 y el 12/11. Por tanto, siguen igual:
  - el mínimo de 100 €;
  - el acceso de particulares tras el test;
  - la salida al vender;
  - la ausencia de comisiones;
  - el uso del dinero de la reserva.
- **¿Están ya inscritas en el registro de la CNMV? No.**
  - Las cuatro páginas del registro de Ursus-3 son idénticas byte a byte a las
    de ayer.
  - De Hausera solo figuran las SPV, 2 a 8; la última es del 23/10/2026. No
    están la 9, la 10 ni la 11.
  - En cadena, Alicante 2 conserva los 51.960 tokens. Alicante 3 sigue con 0.
- **Advertencias de la CNMV:** ninguna para Hausera ni para Holdtx. El buscador
  funciona: «Trading» da el mismo resultado que ayer. El PDF de «otras
  entidades» no ha cambiado.
- **Portada:** las cifras del promotor no cambian (42 operaciones, 24
  terminadas, 128 M€).
- **EAFN nº 21:** sigue inscrita (registro del 12/01/2024). Su programa de
  actividades no lo reabrí; el último dato es del 11/11 (solo asesoramiento).

**Propuesta:** dejar la tarjeta igual. Hay dos cambios opcionales, y ninguno es
crítico:

- el aviso «El 12/11/2026 Alicante 3 aún no estaba inscrita…» puede pasar a
  «El 13/11/2026…»;
- la fecha del mínimo puede pasar a (13/11).

**Próximas fechas:**

- **18/11, preventa.** Ese día la tarjeta tendrá que decir si abrió.
- **25/11, suscripción.**

## Candidatas

- **Pagarés tokenizados de Prosegur Cash:** sin cambios.
  - En la CNMV, la ERIR de Minos, la otra información relevante y la lista de
    ISIN son idénticas byte a byte a las de ayer. Solo figura la «1ª Emisión de
    Pagarés Prosegur Cash 2026», de 500.000 €, inscrita el 06/11.
  - Los JSON de comunicaciones de Prosegur Cash tienen el mismo SHA-256.
  - Su web y la de Minos dicen lo mismo; solo cambia la cotización del pie.
  - No hay documento de emisión, mínimo, plazo, interés ni destinatarios.
  - **No admitir.**
- **Securitize Stocks:** sin cambios.
  - La página, la FAQ (desplegada pregunta a pregunta) y la biblioteca de
    documentos tienen el mismo texto.
  - Los tres documentos europeos tienen el mismo SHA-256.
  - Sigue ofreciéndolo Securitize Markets, LLC (EE. UU.) «to eligible investors
    in permitted jurisdictions».
  - La ficha de Securitize Europe en la CNMV (nº 327) no cambia.
  - **No admitir.**
- **Bonos digitales de Profitus/Axiology:** hoy no hay ningún bono abierto.
  - La API pública lista 549 proyectos.
  - Hay 7 abiertos y los 7 son préstamos «standard»: 1 en España y 6 en
    Lituania. Entran dos préstamos y salen dos.
  - La página «Bonds» es informativa para empresas que quieran emitir. No lista
    ninguna emisión.
  - Profitus sigue en el listado de la CNMV como plataforma europea (nº 21).
  - **No admitir.** Seguir vigilando.
- **Bono Valorix (Bit2Me STX):** sin cambios.
  - La nota de Bit2Me sigue diciendo «previsto para diciembre de 2026», para
    «inversores elegibles». Solo cambian los precios de criptomonedas del menú.
  - valorix.com, su página «invertir» y el documento de enero son byte a byte
    iguales.
  - El registro ERIR de Bit2Me STX sigue vacío.
  - **No admitir:** no hay documento del bono de diciembre.
- **CANDO1 (Token City): no admitir. Es la única novedad.**
  - exchange.token-city.com **vuelve a funcionar** (200). Ayer daba 503 por
    mantenimiento.
  - CANDO1 (CDO1) aparece «En estudio», en el bloque «Próximamente», con un
    botón de «Lista prioritaria».
  - La web habla de LORNIN IBÉRICA S.L., 76 apartamentos de Senior Living en La
    Moraleja y un objetivo de 1.971.000 € en 1.971 tokens. También da un mínimo
    de 657 € y una «TIR bruta estimada ~11,7%».
  - Esas cifras son comerciales: no hay documento de emisión detrás.
  - La ERIR de Token City sigue sin CANDO1 (solo Series A Grupo UAE, del
    06/11).
  - Revisar cuando abra.
- **Acciones tokenizadas de Crypto.com (EEE): no admitir, por el mismo motivo
  que ayer.**
  - **Falta el KID en una fuente pública que se pueda abrir desde aquí.**
    - Las condiciones (del 11/08/2026, mismo SHA-256) dicen en el 5.2 que el
      KID se entrega «via the Crypto.com App».
    - La página europea de divulgaciones sigue redirigiendo (301) a la portada
      de crypto.com por el país desde el que consultamos. No se intenta saltar
      ese filtro.
  - **La lista de países excluidos** no se ha localizado.
  - **Lo que sí está acreditado hoy:**
    - la licencia de la CySEC 344/17, con España entre los países donde opera
      (mismo texto que ayer);
    - la ficha de la CNMV nº 4485, idéntica byte a byte a la de ayer;
    - la App Store española, que sigue en la versión 3.244.01.

## Advertencias de la CNMV de hoy

Busqué estos nombres entre las 08:32:39 y las 08:33:45 UTC:

- Hausera, Holdtx, Prosegur, Minos, Securitize, Profitus, Axiology, Valorix,
  Bit2Me, Token City, Lornin y Cando: **ninguno aparece**.
- Crypto.com y Foris: solo salen dominios clon ajenos. El resultado es idéntico
  byte a byte al de ayer.

Comprobé que el buscador funcionaba con «Trading» (08:32:33). El PDF de «otras
entidades» tiene el mismo SHA-256 que el 10/11, el 11/11 y el 12/11.

## Bloqueos

- **valorix.es:**
  - curl corta la conexión (08:31:08, tres intentos);
  - el navegador da 502 (08:34:54).
- **Página del KID de Crypto.com:** redirige con un 301 por el país de origen
  (08:31:39 y 08:38:08). No se elude.
- **Ficha de Alicante 2 en el navegador:** agotó la espera de red, pero la
  página se pintó entera y el texto se guardó.
- **No reabiertos hoy, por rapidez** (ninguno afecta a una decisión):
  - stx.bit2me.com (404 sin sesión el 12/11);
  - la ficha de Foris en la FSMA belga;
  - el programa de actividades de la EAFN nº 21.

## Datos personales

- **Recortados en las copias:**
  - el nombre de una persona en la portada de Hausera;
  - tres nombres en las páginas de Prosegur Cash;
  - en el blog de Bit2Me (`fuentes/bit2me/bit2me-blog-autorizacion-2026-11-13.txt`),
    los nombres de sus cofundadores (líneas 65, 69 y 82);
  - en la página de bonos de Profitus
    (`fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`), el nombre del
    fundador de Axiology (líneas 124 y 126) y el nombre, el correo de trabajo y
    el teléfono directo de un empleado de Profitus (líneas 240, 244 y 249). Se
    queda el teléfono de atención al cliente de la empresa (línea 291).
    Recorte completado el 13/11/2026 a las 14:40 UTC por el montador
    (corrección C1 de la revisión de SQL y O2 de la de cumplimiento).

  Los originales están solo en `fuentes/crudo/` o en `crudo/` (las copias de
  texto de Bit2Me y Profitus), fuera de Git.
- **Solo en `fuentes/crudo/`:** la ficha de la EAFN nº 21, que lleva el nombre
  y la dirección de una persona física.
- **No guardados:** los PDF de Hausera.

## Nota de método

- Las consultas de la CNMV y las del resto de webs se lanzaron en paralelo.
- Al principio las dos escribieron a la vez en el inventario y se perdieron
  filas.
- Rehíce el inventario con las horas del registro de cada lanzamiento. El
  SHA-256 y el tamaño se calcularon con los archivos guardados en disco.
