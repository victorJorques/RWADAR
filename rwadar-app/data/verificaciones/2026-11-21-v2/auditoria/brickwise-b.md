# Auditoría independiente · ámbito «brickwise-b» · 21/11/2026

Auditor independiente: no investigué ni monté nada de este ciclo. Abrí yo
mismo cada fuente entre las **20:13 y las 20:25 UTC** del 21/11/2026, sin
sesión ni cuenta, con `curl` y su agente por defecto y Playwright sin trucos.
Copias solo en `/tmp/auditoria-2026-11-21/brickwise-b/` (fuera del
repositorio; la API trae direcciones de cartera de particulares y no se
publica).

Fichas: Randhartingergasse 9 (Viena), apartamento vacacional Hinterstoder 50,
vivienda Pottendorfer Straße 62 (Wiener Neustadt), fotovoltaica GreenPoint y
fotovoltaica Cohotel. Lo auditado: lo publicado (entrega 2026-11-20.2:
`escaparate-publicacion.json` y `documentacion-ofertas.json`) más los cambios
de `DECISIONES-COORDINADOR.md` §2 y §4, con los textos de `expedientes/` y las
correcciones de `revision-independiente/brickwise-b.md`.

## En una frase

Las cifras del día, los documentos y los registros aguantan. Hay **dos cosas
que arreglar antes de publicar**: el mínimo de tres fichas es un precio que
hoy solo se vende en lote (Randhartingergasse, Hinterstoder y Cohotel), y el
aviso nuevo del número fiscal austriaco dice algo que la ayuda de Brickwise no
dice («Brickwise lo tramita») y, al sustituir al publicado, se come el aviso de
que hay que tributar en Austria.

## Lo que comprobé (230 datos visibles)

- **Libro de órdenes.** API v1 (20:13:47 UTC) y v2 (20:13:48 UTC): **los
  mismos bytes** que el vigía de las 17:36 (`edaee0fe…d207` y `b6d47201…2506`).
  Lo recalculé yo desde las órdenes abiertas:

  | Ficha | Más barata (cantidad) | 1 sola, la más barata (+1,5 %) | En venta | Mejor compra |
  |---|---|---|---|---|
  | Randhartingergasse 9 | 78 € (1 orden de 20, 29/06/2026) | 85 € → 86,28 € (06/11/2026) | 188 | 64 € (1, 12/11/2026) |
  | Hinterstoder 50 | 75 € (1 orden de 5, 08/11/2026) | 82 € → 83,23 € (15/11/2026) | 252 | 20 € (4 en 2 órdenes; la más antigua 19/05/2025) |
  | Pottendorfer 62 | 81 € (1, 15/11/2026) | 81 € → 82,22 € | 96 | 64 € (1, 17/11/2026) |
  | GreenPoint | 102 € (8: órdenes de 5, 2 y 1) | 102 € → 103,53 € (11/11/2026) | 347 | 29 € (1, 10/08/2024) |
  | Cohotel | 110 € (35: órdenes de 31 y 4) | 120 € → 121,80 € (15/11/2026) | 59 | 3 € (1, 23/11/2024) |

  Coincide con todas las referencias del libro propuestas para el 21/11. Ningún
  bloqueo de interesado activo. El mercado de la app, abierto sin sesión a las
  20:21:42 UTC (texto con el mismo SHA-256 que el del investigador,
  `2e6b144a…`), enseña «Preis pro Anteil ab» 78,00 / 75,00 / 81,00 / 102,00 /
  110,00 €, «Laufzeit: endlos» en las tres viviendas, «KESt» delante de
  Pottendorfer, GreenPoint y Cohotel, y no delante de Randhartingergasse ni de
  Hinterstoder.
- **Documentos (21 PDF), 20:14:46–20:14:53 UTC: los 21 tienen el mismo
  SHA-256** que el expediente y `vigia.json` (contratos, KID, Informationsblatt
  y Rücktrittsbelehrung de las cinco, y Kosteninformationen). Además los leí:
  precio de emisión 100,24 / 100,20 / 100,44 / 100,32 / 100,85 €; mínimo de la
  suscripción original igual, con plazos cerrados (2022–2024); riesgo 6 de 7
  en los cinco KID; emisores y FN (Brick Sagarmatha FN 549469v, Brick Qogir
  FN 549470w, Green-Point 62 FN 329414 h, COHOTEL FN 281947 d);
  «Ordentliche Kündigung: Nein» (Randhartingergasse y Hinterstoder); primera
  cancelación tras 15 años (Pottendorfer); «Beendigungszeitpunkt: 31.12.2038»
  y subordinación del punto 9.2 (GreenPoint y Cohotel); 1,5 % comprador y
  vendedor; «Kein Rücktrittsrecht am Zweitmarkt», «Stand: 10.07.2026».
- **API de cada activo** (20:14:17–20:14:19 UTC, mismos SHA-256 que el
  expediente): `participationRightEquity` y sociedad en `AUT` en
  Randhartingergasse y Hinterstoder; `participationRightDebtCapital` en las
  otras tres; `isAllowedDomicile: []` en las cinco; alquiler de
  Randhartingergasse que «endet am 28.02.2026. Es wird ein Nachmieter
  gesucht»; Pottendorfer «Das Mietverhältnis endet am 30.11.2025» y
  «Grundbücherliche Besicherung noch ausstehend»; `plannedFirstRentalIncomeDate`
  de 2024 en GreenPoint y Cohotel (bien quitarla).
- **Ayudas e Impressum** (20:15:40–20:16:58 UTC; las tres ayudas con el mismo
  SHA-256 que el expediente): cuenta para «Jede Person mit einem Wohnsitz in
  einem der EWR-Mitgliedstaaten»; oferta «bestehend aus Preis pro Anteil und
  der Anzahl der angebotenen Wertpapiere»; sin inquilino «keine Ausschüttungen
  erfolgen»; Brickwise, agente vinculado «ausschließlich für Rechnung und unter
  Haftung der Effecta GmbH».
- **Código público de la app** (`app.85dda63a.js`, mismo SHA-256): la compra
  (también en reventa, `handleSecondaryBuy` → `initialChecks("buy")`) se para
  si el producto es de capital propio, la sociedad está en Austria y la cuenta
  no tiene número fiscal austriaco. Y dice: «Investitionen in Produkte, deren
  Einkünfte der Kapitalertragssteuer (KESt/KapEst) unterliegen, sind hingegen
  jederzeit möglich».
- **Registros.** CNMV (20:24:16–20:24:19 UTC): EFFECTA GmbH n.º 5003, registro
  11/11/2020, Alemania, solo «Recepción y transmisión de órdenes»; «Agentes: No
  se han encontrado datos disponibles». Advertencias (20:23:59–20:24:08 UTC):
  Brickwise, Effecta, Brick Sagarmatha, Brick Qogir, Green-Point y Cohotel, «No
  hay datos disponibles»; la búsqueda de control «Trading» sí da resultados.
  BaFin (20:24:42 UTC): Effecta GmbH, Anlagevermittlung y Anlageberatung desde
  26.06.2021.
- **Enlaces.** El botón «Ver fuente» y todas las URL de fuentes y referencias
  responden 200.

## Lo que hay que arreglar (obligatorio)

1. **Mínimo en lote: Randhartingergasse, Hinterstoder y Cohotel.** El texto
   «Desde 78 € / 75 € / 110 € la participación en reventa (21/11)» va con la
   etiqueta «Mínimo de inversión», pero a ese precio solo hay lotes: 20
   participaciones (Randhartingergasse), 5 (Hinterstoder) y 31 o 4 (Cohotel), y
   ninguna fuente pública dice que se pueda comprar parte de una orden. Lo que
   hoy se puede pagar con seguridad por una sola participación es 85 €, 82 € y
   120 € (86,28 €, 83,23 € y 121,80 € con el 1,5 %). Es la corrección C1 del
   revisor; las Normas ponen este mismo ejemplo («1 participación desde 78 € en
   reventa»). Debe quedar:
   - Randhartingergasse: «1 participación desde 85 € en reventa (21/11)»
   - Hinterstoder: «1 participación desde 82 € en reventa (21/11)»
   - Cohotel: «1 participación desde 120 € en reventa (21/11)»

   con fuente `https://api.app.brickwise.at/api/v1/assets` (el mercado enseña
   «ab» el precio del lote) y la venta más barata en lote como referencia de la
   ficha, como ya está. Si el motor no admite ese formato, se ajusta el motor;
   publicar 78 / 75 / 110 € como mínimo no se sostiene.
2. **Aviso del número fiscal (Randhartingergasse y Hinterstoder).** El texto
   de §2, «Para comprar hace falta un número fiscal austriaco. Brickwise lo
   tramita gratis con su asesor.», no lo respalda el literal. La ayuda dice:
   «Sollte keine österreichische Steuernummer vorhanden sein, so kann diese
   beim österreichischen Finanzamt persönlich oder durch einen Steuerberater
   beantragt werden. Gerne stellt Brickwise auch einen Kontakt zu einem
   Steuerberater her. In diesem Fall entstehen für die Beantragung der
   Steuernummer keine Kosten». Brickwise no lo tramita: te pone en contacto con
   un asesor, y así pedirlo no cuesta nada. Además, como sustituye al aviso
   publicado, desaparece que las rentas tributan en Austria (declaración
   conjunta de la comunidad de inversores, que «zwingend» pide ese número) y que
   la ganancia al vender paga allí la ImmoESt («besondere Vorauszahlung» al
   Finanzamt austriaco). Es una obligación importante para quien vive en
   España. Debe quedar: «Para comprar hace falta un número fiscal austriaco: se
   pide a Hacienda de Austria y, si lo pides con el asesor que te presenta
   Brickwise, no cuesta nada. Las rentas tributan en Austria y, si vendes con
   ganancia, pagas allí el impuesto inmobiliario (ImmoESt).»

## Recomendado

- **Acceso desde España de Randhartingergasse y Hinterstoder.** Víctor decidió
  dejarlo como está y no es falso, pero no dice lo que más pesa. Sin salir de
  «Sin confirmar»: «Sin confirmar: cuenta para residentes del EEE (España
  incluida), pero para comprar pide número fiscal austriaco; no consta que se
  distribuya en España.» Decide Víctor.
- **Acceso y aviso de la cuenta en las tres «KESt».** «cuenta para residentes
  del EEE y sin número fiscal austriaco» se lee como «no hay acceso sin
  número». Mejor (R1 del revisor): «Sin confirmar: cuenta para residentes del
  EEE, no pide número fiscal austriaco; no consta su venta en España.» Y en el
  aviso: «Cuenta abierta a residentes del EEE (España incluida); esta emisión
  no pide número fiscal austriaco, pero no consta que se comercialice en España
  y la documentación está en alemán.»
- **Subordinación (GreenPoint y Cohotel).** «baja del 8 % de recursos propios»
  → «su ratio de recursos propios baja del 8 %» (R2; el contrato habla de
  «Eigenmittelquote von 8 %»).
- **Piso de Randhartingergasse.** El texto de la API no tiene fecha y se
  escribió antes del 28/02/2026 («endet am»); hoy la app pone «Vermietungsstatus
  befristet» y «Erw. nächste Ausschüttung: 15.12.2026». Mejor: «Según la API, el
  alquiler terminó el 28/02/2026 y se buscaba otro inquilino; no consta si ya
  lo hay. Mientras esté vacía no hay repartos. La rentabilidad no se muestra.»
- **Páginas de activo de la web en las fuentes (Randhartingergasse,
  Hinterstoder y Pottendorfer).** `www.brickwise.at/assets/…` se pinta hoy con
  «Investments ab € 100 in diese Immobilie», «Preis pro Anteil» del último
  cambio (65,00 € en Hinterstoder, 73,00 € en Pottendorfer) y, en Pottendorfer,
  «Grundbücherlich besichert», que choca con el aviso de la hipoteca pendiente.
  Quitarlas de `documentacion.fuentes` (la propuesta ya las quita de
  `fuentesActuales`).
- **Cohotel: vida útil de la instalación.** La API da `commissioningDate`
  30/09/2016 y `lifespan` 20 («Geplante Nutzungsdauer» en la app): unos dos
  años antes de la devolución del 31/12/2038. Aviso posible: «La instalación
  funciona desde 2016 y su uso previsto es de 20 años, hasta 2036; el
  reembolso es el 31/12/2038.»
- **Citas que no son literales.** Hinterstoder, «Salida · consulta
  21/11/2026»: el contrato dice «(siehe zu den Ausnahmen Ziffer 11)», no
  «Punkt 11». GreenPoint y Cohotel, «Mínimo de la suscripción original»: el
  contrato dice «Mindestzeichnungsbetrag je Investor: EUR 100,32» (y 100,85).

## Comprobado y sin problema

Título, proveedor, resumen y emisor de las cinco; colección «secundario»;
botón «Ver fuente»; métricas (precio de emisión original, 1,5 % comprador y
vendedor, agente vinculado de Effecta, reembolso, riesgo 6 de 7, EUR); avisos
de reventa, de riesgo, de compra parcial no confirmada, de precios que cambian,
de Pottendorfer (alquiler hasta el 30/11/2025 e hipoteca pendiente) y el aviso
KESt corregido (C2: «werden von den Emittentinnen einbehalten» y «erfolgt kein
automatischer Abzug … in der eigenen Jahressteuererklärung»); salidas de las
cinco; referencias re-fechadas con el vigía (documentos byte a byte iguales);
«Número fiscal austriaco: Obligatorio» (las dos de capital propio) y «No hace
falta» (las tres KESt); quitar «Distribuciones esperadas desde» (fechas de
2024); fechas en DD/MM; sin promesas ni «por participación» en el mínimo; sin
rentabilidad ni precio principal en reventa; mínimos de Pottendorfer (81 €) y
GreenPoint (102 €), que sí tienen orden de 1 participación.

## Sin poder comprobar

- Registro de agentes de la BaFin (Brickwise Investment GmbH, n.º 80174029):
  es un formulario de búsqueda y no lo rellené. Sí comprobé el Impressum y la
  ficha de Effecta en la BaFin.
- Si se puede comprar solo una parte de una orden de venta: ninguna fuente
  pública lo dice.
- Si Randhartingergasse y Pottendorfer tienen hoy inquilino: los contratos de
  alquiler del CDN son escaneos sin texto y la descripción de la API no tiene
  fecha.
- Si cada emisión se ofrece en España: solo consta el pasaporte de Effecta
  (CNMV n.º 5003), sin agentes.
- La ventana del número fiscal, vista en el código público, no en pantalla
  (haría falta cuenta).
- Firmenbuch (de pago): los FN salen de los contratos.
