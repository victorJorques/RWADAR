# Auditoría independiente · ámbito «brickwise-b» · 20/11/2026

Auditor independiente (no investigué ni monté nada de este ciclo). Consultas
propias entre las 17:16 y las 17:29 UTC del 20/11/2026, sin sesión ni cuenta,
con `curl` y su agente por defecto y Playwright sin trucos. Copias en
`/tmp/auditoria-2026-11-20/brickwise-b/` (fuera del repositorio; los crudos de
la API llevan carteras de particulares y no se publican).

Fichas: Randhartingergasse 9 (Viena), apartamento vacacional Hinterstoder 50,
vivienda Pottendorfer Straße 62 (Wiener Neustadt), fotovoltaica GreenPoint y
fotovoltaica Cohotel. Lo auditado: lo publicado el 13/11 más los cambios de
`DECISIONES-COORDINADOR.md` §2 y §4, y la entrega ya montada
(`documentacion-ofertas.json` y `escaparate-publicacion.json` del 20/11, que
coinciden con los expedientes).

## Resumen en llano

- **Las cifras nuevas del día están bien.** Mínimo de la tarjeta, venta más
  barata, orden de menor importe (con el 1,5 % recalculado), participaciones en
  venta y mejor compra cuadran en las cinco fichas con lo que leí yo. La API
  dio a las 17:16 y a las 17:28 UTC exactamente los mismos bytes que al vigía
  (SHA-256 `895fcaef…026b` la v1 y `db1b9ef9…a9b` la v2). El mercado de la app,
  abierto sin sesión a las 17:22 UTC, enseña «Preis pro Anteil ab» 78,00 /
  75,00 / 81,00 / 102,00 / 110,00 €.
- **Los documentos no han cambiado y además los leí.** Los 21 PDF (contratos,
  KID, Informationsblatt, Kosteninformationen y Rücktrittsbelehrung) dan hoy el
  mismo SHA-256 que el expediente. En el texto están: precio de emisión
  (100,24 / 100,20 / 100,44 / 100,32 / 100,85 €), riesgo 6 de 7, emisores y
  números FN, «Ordentliche Kündigung: Nein» (Randhartingergasse y Hinterstoder),
  primera cancelación a los 15 años (Pottendorfer, punto 10.2), vencimiento
  31.12.2038 y subordinación (GreenPoint y Cohotel), 1,5 % por operación y sin
  desistimiento en reventa.
- **Registros, iguales.** BaFin: Effecta GmbH (Wertpapierinstitut,
  Anlagevermittlung y Anlageberatung desde 26.06.2021) y Brickwise Investment
  GmbH agente vinculado n.º 80174029, «Tätig ab 04.08.2021», sin fecha de baja,
  datos a 19.11.2026. CNMV: Effecta n.º 5003 (11/11/2020), solo recepción y
  transmisión de órdenes, «Agentes: No se han encontrado datos disponibles».
  Advertencias de la CNMV: Brickwise, Effecta, Brick Sagarmatha, Brick Qogir,
  Green-Point y Cohotel, «No hay datos disponibles» (la búsqueda de control
  «Trading» sí da resultados).

## Lo que hay que arreglar (obligatorio)

1. **Número fiscal austriaco (Randhartingergasse y Hinterstoder).** Son
   productos de «capital propio» (en la app no llevan la etiqueta «KESt»; en la
   API, `participationRightEquity`). La página de ayuda de Brickwise «Wie sind
   die Erträge zu versteuern?» dice que quien no tributa en Austria solo puede
   invertir en ellos «durch vorherige Bekanntgabe einer Steuernummer in
   Österreich», que las rentas «sind auch für ausländische Investor:innen in
   Österreich steuerpflichtig» y que la ganancia al vender paga la ImmoESt
   austriaca. La app pública lo repite: «Um in dieses Produkt investieren zu
   können, wird eine österreichische Steuernummer benötigt». Las fichas no lo
   dicen en ningún sitio: es una condición de acceso desde España que falta.
2. **Rentabilidades en reventa («Datos con su fecha»).** Las cinco fichas
   siguen enseñando repartos y rentabilidades viejos (27/09, 22/10 y 01/11). En
   Randhartingergasse y Pottendorfer un aviso de la misma ficha dice «la
   rentabilidad no se muestra», y la ficha muestra 3,09 % y 2,47 %, y 3,80 % y
   4,22 %. Hoy la app da otras cifras (por ejemplo, 4,65 % en Hinterstoder
   frente al 4,84 % publicado). La norma 2 no deja rentabilidad en reventa,
   tampoco como referencia de la ficha. Hay que quitarlas.
3. **«Participaciones disponibles en emisión (API) · 22/10/2026: 374 de 2.670»
   (Randhartingergasse).** La emisión cerró el 15/09/2022 (`issueEndDate` de la
   API), la app la pone en «Bestand» y no en «Finanzierungsphase», y el propio
   expediente llama a ese 374 «anomalía». Publicado así, dice que quedan 374
   participaciones a la venta en la emisión. Hay que quitarla.

## Recomendado

- **Mínimo en lote (Cohotel, Randhartingergasse, Hinterstoder).** El precio
  más bajo por participación solo se vende en lotes: en Cohotel, 110 € en
  órdenes de 31 y de 4 (la de 1 participación más barata pide 120 €); en
  Randhartingergasse, 78 € en un lote de 20 (suelta, 85 €); en Hinterstoder,
  75 € en un lote de 5 (suelta, 82 €). El texto copia bien el «ab» de la app,
  pero en «Mínimo» se lee como lo que cuesta entrar. Propuesta: «Desde 110 € la
  participación en lotes de 4 o 31; 1 sola, 120 € (20/11)» y análogas.
- **Impuesto austriaco en los productos de deuda (Pottendorfer, GreenPoint,
  Cohotel).** Llevan la etiqueta «KESt»: Austria retiene impuesto de los
  repartos y quien vive en España debe declararlos aquí. En Pottendorfer la
  API dice «Ausschüttungen unterliegen der Kapitalertragsteuer iHv 27,5%».
- **Subordinación cualificada (GreenPoint, Cohotel).** El contrato (punto 9.2)
  deja sin pagar repartos y reembolso si llevarían al emisor a insolvencia,
  fondos propios negativos o menos del 8 % de recursos propios. El aviso solo
  dice «subordinado a los acreedores financieros».
- **Cohotel: vida útil.** La API de la ficha dice `commissioningDate`
  30/09/2016 y `lifespan` 20 (hasta 2036), antes de la devolución del nominal
  el 31/12/2038.
- **Randhartingergasse: piso vacío.** La ayuda de Brickwise («Was passiert bei
  einem Leerstand?») dice que sin inquilino «keine Ausschüttungen erfolgen».
  Conviene añadirlo al aviso del alquiler.
- **Citas «literales» que no están en el KID (Randhartingergasse y
  Hinterstoder).** «…erfolgt ausschließlich eigenverantwortlich…» y
  «Genussscheine … läuft endlos/ewig»: esos KID dicen «hat eigenverantwortlich
  durch den Anleger zu erfolgen» y hablan de «Genussrecht».
- **«Plazo · 22/10/2026: hasta el 31/12/2038» (GreenPoint y Cohotel)** se
  atribuye a la app, que hoy enseña «Laufzeit: 30.12.2038». El 31.12.2038 está
  en el KID: citar el KID.
- Errata «comprobado el30/09/2026» en «Destino de consulta comprobado» (las
  cinco). Hinterstoder enseña además «Próxima distribución esperada ·
  22/10/2026: 15/11/2026», ya pasada (la app dice hoy 15.12.2026).

## Comprobado y sin problema

Título, proveedor, resumen y emisor de las cinco; colección «secundario»;
botón «Ver fuente» al mercado de la app (200); todas las URL de
`documentacion.fuentes` responden 200 (ayudas, Impressum, páginas de activo,
API v1/v2, API de cada activo, PDF de cdn y de storage.googleapis); métricas
(precio de emisión, comisión 1,5 % comprador y vendedor, intermediario
agente vinculado de Effecta, reembolso, riesgo 6 de 7, EUR); avisos de
reventa, de cuenta para residentes del EEE, de riesgo, de compra parcial no
confirmada y de precios que cambian; aviso de Randhartingergasse (la API dice
«endet am 28.02.2026. Es wird ein Nachmieter gesucht»); avisos de Pottendorfer
(alquiler hasta el 30.11.2025 y «Grundbücherliche Besicherung noch
ausstehend»); salidas de las cinco; desistimiento (punto 2 «Kein
Rücktrittsrecht am Zweitmarkt», Stand 10.07.2026); fechas en DD/MM; sin
promesas ni «por participación» en el mínimo; reventa sin rentabilidad ni
precio principal en la tarjeta. Ninguna orden más barata tiene hoy un
interesado con bloqueo activo.

## Sin poder comprobar

- FMA (Austria): la base de empresas da 200 pero el HTML estático no trae
  resultados; la búsqueda general sigue tras Cloudflare. No se insiste. Vale la
  lectura del 11/11.
- Firmenbuch (de pago): no consultado; los FN salen de los contratos.
- Si se puede comprar solo una parte de una orden: ninguna fuente pública lo
  dice (la ayuda describe la oferta como precio más cantidad).

## Fuera de mi ámbito, para el coordinador

El mercado de la app enseña hoy en «Neue Objekte» un activo nuevo en emisión
primaria: «Betriebsgrundstück mit langfristigem BILLA-Mietvertrag» (Brückl),
«Mindestinvestition € 1.000,00», «KESt» (API: `AT0000A3SE89`, `stage`
primary). No está en el catálogo.
