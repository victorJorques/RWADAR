# Grupo profunda-2 · winvesta (Verde Beach São Francisco) · 11/11/2026

Revisé una sola candidata, la pista 2 del estratega: los bonos tokenizados de
winvesta. Leí entre las 10:08 y las 10:22 UTC. Solo usé páginas, documentos,
API y registros públicos. No inicié sesión, no hice KYC, no rellené
formularios, no conecté monederos y no usé git. Las copias completas están en
`fuentes/crudo/`, fuera de Git, porque varios documentos nombran a personas
físicas. Los extractos citables, sin nombres, están en
`fuentes/extractos-literales.json`. Las horas y los SHA-256 están en
`inventario-consultas.json`.

## Decisión

| Slug | Decisión |
|---|---|
| `winvesta-verde-beach-sao-francisco-junior` | **no_admitir** |

**Motivo principal: un particular en España no puede comprarlo.** El aviso
legal de la ficha del producto en el marketplace de winvesta dice: «Die
Informationen in diesem Dokument richten sich ausschließlich an Personen, die
ihren Wohnsitz bzw. gewöhnlichen Aufenthalt in der Bundesrepublik Deutschland
haben». El mismo aviso aparece en todos los tramos y en las demás fichas que
abrí. No hay folleto con pasaporte: en el registro de la ESMA hay 0 documentos
para el ISIN DE000A4DFMM3 y 0 para el LEI del emisor.

## Lo que la pista tenía mal

1. **No es Portugal, es Cabo Verde**, fuera del EEE. Es un terreno de playa de
   unas 6,5 hectáreas en la isla de Santiago, junto a Praia. Los «7600
   Santiago» y «Praia» de la portada engañan.
2. **Los documentos sí son públicos.** Las condiciones y el KID de cada tramo
   están en finexity.com/ire-invest. Los descargué (19 PDF), con su SHA-256.
3. **El bono no es subordinado** («nicht nachrangig»), pero **no tiene
   garantía** hasta que se compre el terreno: «Bis dahin sind die
   Schuldverschreibungen unbesichert».
4. **Sí hay fuente sobre España, y excluye**: el aviso «solo Alemania».

## Qué es el producto

- **Emisor:** InterREAL Estate Invest GmbH (Bremen, HRB 37723 HB), una
  sociedad vehículo sin supervisión.
- **Destino del dinero:**
  - comprar el 100 % de una sociedad de Cabo Verde que a su vez debe comprar el
    terreno, que según las condiciones del 15/05/2025 era aún «Eigentum des
    Staates»; el contrato «wird derzeit noch verhandelt»;
  - pagar un bono puente de 1.205.000 € al **42 % anual**, prorrogado hasta el
    01/01/2026;
  - marketing y costes de emisión.
- **Tramo Junior:**
  - **mínimo de 5.000 €**;
  - 5,50 % fijo y entre 4 % y 6 % anual adicional si el terreno se vende por
    más de 12 o 16 millones de euros, todo pagado al vencimiento (14/06/2028);
  - KID en clase de riesgo 6 de 7, con 0 € en los escenarios de tensión y
    pesimista.
- **Costes:** el KID calcula 1.859,87 € sobre 10.000 € en 3 años (18,6 %), que
  paga el emisor, y aun así pone «0,00 % pro Jahr»: es incoherente.
- **Estado hoy:**
  - colocación abierta en los tramos Junior, Advanced (25.000 €) y
    Special-Investor (100.000 €), con el 37 % colocado;
  - Retail (500 €) y Anchor (250.000 €), cerrados;
  - el periodo de oferta se ha prorrogado dos veces, hasta el **30/06/2027**,
    y «Die Ausgabe der Token wird entsprechend später erfolgen». Choca con el
    «Laufzeitbeginn Juni 2025» de la ficha y de los documentos.
- **Salida:**
  - las condiciones no dejan que el inversor cancele;
  - el KID dice «Derzeit existiert kein liquider Zweitmarkt»;
  - las FAQ de winvesta prometen un mercado secundario «vollkommen
    gebührenfrei»;
  - en el marketplace de hoy hay 17 productos «Trading paused» y compra y venta
    vacías en los 13 productos con libro de órdenes.

## Conflictos registrados

- **Garantía:** la ficha comercial habla de una «Erstrangige
  Grundschuldsicherheit in Höhe von 10,83 Mio. EUR». Las condiciones y el KID
  dicen que no hay garantía hasta la compra, y que aún no hay acuerdo que
  obligue a la sociedad objetivo a darla.
- **Inicio del plazo:** el 15/06/2025 según las condiciones, el KID y la
  ficha; las cartas del emisor dicen que aún no hay tokens emitidos.
- **Mercado secundario:** las FAQ chocan con el KID y con el estado del
  marketplace.
- **Costes:** 18,6 % en total frente a un impacto anual del «0,00 %» en el
  mismo KID.

## Registros y advertencias (hoy)

- **BaFin:** winvesta GmbH es agente vinculado n.º 80176451 de Effecta GmbH,
  activo desde el 16/03/2022, con datos a 10/11/2026. Effecta (BaFin-ID
  10133261) puede hacer intermediación y asesoramiento en inversiones
  (Anlagevermittlung y Anlageberatung).
- **CNMV:** Effecta tiene el n.º 5003, en libre prestación y solo para
  recibir y transmitir órdenes. La pestaña «Agentes» no tiene datos.
- **Advertencias de la CNMV:** ninguna coincidencia para winvesta, Effecta,
  InterReal, Finexity ni «Verde Beach». El buscador funciona: con «Trading»
  devuelve 16 páginas.
- **Avisos de la BaFin:** el buscador de bafin.de devuelve 403, con curl y con
  el navegador. Queda **no verificable**.

## Otras señales para vigilar (no son pruebas)

- Tres bonos de winvesta, WIN-04, WIN-05 y WIN-06 («Green Tiny House»), siguen
  en estado «Marketplace» con fechas de fin pasadas (30/11/2025 y 31/01/2026).
  Otros vencidos sí figuran como «Successfully Paid Back».
- winvesta funciona sobre la tecnología de FINEXITY, que está cambiando de
  bróker y tiene pendiente la compra del 90,1 % de Effecta.
- La portada de winvesta no se modifica desde el 20/06/2025, según su sitemap.

**Conclusión:** no vale la pena seguir esta pista para RWAdar mientras el
aviso «solo Alemania» siga en pie. Aunque se levantara, el producto no cumple
lo de entrada asequible, salida explicada ni garantía clara.
