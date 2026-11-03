# Nuevas de Europa · resumen (ciclo 03/11/2026)

Grupo: **nuevas-europa**. Busqué ofertas nuevas de activos reales tokenizados de
proveedores de otros países del EEE que un particular residente en España pueda
comprar hoy. Todo se leyó hoy entre las 10:06 y las 10:25 UTC. Las horas exactas
están en `inventario-consultas.json`. Solo usé páginas y documentos públicos:
no inicié sesión ni conecté wallets.

## Resultado en una línea

**Hoy no propongo admitir ninguna.** La más cercana es Crypto.com Tokenized
Stocks (EEE). Le faltan dos cosas: el KID público y una prueba pública de que el
producto se ofrece en España.

## Qué revisé

- **Acciones y ETF tokenizados para minoristas de la UE.** Revisé Crypto.com
  (Foris Capital CY), Assetera (Austria), OKX Europe, Coinbase, eToro, Bybit EU,
  Bitvavo y Revolut. No toqué Kraken xStocks ni Robinhood: los lleva otro grupo.
- **Fondos monetarios tokenizados para minoristas del EEE.** Solo encontré
  lanzamientos institucionales: BlackRock ICS (04/08/2026), Schroders (CBI,
  10/08/2026) y BNP AssetFoundry (02/2026). Ninguno sirve para un particular.
- **Bonos tokenizados con folleto de la UE.** El único concreto que encontré es
  el de DN Group. Su tramo B es un criptovalor eWpG.
- **Inmuebles o energía con licencia ECSP o MiFID y pasaporte a España.** No
  encontré ninguna emisión tokenizada concreta abierta fuera de Brickwise.
- **Oro con autorización MiCA.** El registro provisional de ESMA
  (`ARTZZ.csv`) **no tiene ningún emisor de ficha referenciada a activos
  autorizado**. Los tokens de oro que aparecen son white papers notificados,
  no autorizados: LCX Gold, DGLD (Gold Token SA) y NatGold.
- **Registros consultados hoy:** CySEC, FMA de Austria, el listado de la CNMV de
  ESI del EEE en libre prestación y las fichas 4485 y 5216, y el buscador de
  advertencias de la CNMV con los nombres «Crypto.com», «Foris», «Allnew»,
  «Assetera», «DN Group» y «LCX».

## Expedientes

| Slug | Decisión | Motivo |
|---|---|---|
| `crypto-com-tokenized-stocks-eea` | no_admitir (casi lista) | Comprobado hoy: Foris Capital CY Ltd, con licencia CySEC 344/17. España está en su pasaporte y la empresa consta en la CNMV (nº 4485). Mínimo 1 USD. Sales vendiendo o reembolsando en la app cuando quieras, pero no puedes sacarlo a otra wallet. Fondo de compensación de Chipre: hasta 20.000 €. Términos del 11/08/2026 y documento de riesgos leídos. **Falta**: el KID solo está dentro de la app, y la lista de países excluidos está en unas FAQ que no son públicas. Dejo un borrador de tarjeta. |
| `assetera-xstocks` | no_admitir | ASSETERA GmbH tiene licencia de la FMA (WAG 2018, desde el 28/02/2022) y consta en la CNMV (nº 5216). Ofrece xStocks desde el 15/09/2026, pero no publica mínimo, costes, países ni documentos del producto, y para comprar hace falta una wallet con USDC o EUROP. |
| `dn-group-anleihe-2026-2033-tranche-b` | no_admitir | El folleto (BaFin, 06/07/2026) limita la oferta pública a Alemania y Luxemburgo. Bono al 10 % sin garantía. La emisora puede aplazar cupones y alargar el vencimiento un año. |
| `lcx-gold-lcxg` | no_admitir | Según su propio white paper, el token no está respaldado por oro ni da derecho a él. Es un token de utilidad. |

## Lo que tiene Crypto.com Tokenized Stocks (EEE)

- **Qué es.** Un contrato derivado OTC con Foris Capital CY, que sigue el precio
  de unas 1.500 acciones y ETF de EE. UU. (dato del lanzamiento, 12/08/2026).
  No eres dueño de la acción. Si la empresa quiebra, eres acreedor sin garantía.
- **Cómo se entra.** Hay un test de conveniencia y te clasifican como minorista.
  Se paga en USD; si pagas en euros, te cambian la moneda con diferencial. La
  comisión es del 0 % «por un periodo limitado», sin fecha de fin publicada.
- **Conflictos.**
  - Emisor: la nota de prensa y la cláusula 7.1 dicen que es Foris Capital CY.
    La cláusula 6.2 dice que lo emite Foris Capital MU Limited.
  - Dividendos: la ayuda dice que se reinvierten tras una retención del 30 %.
    Los términos dicen que no hay derecho a dividendos y que los ajustes son
    discrecionales.
- **Advertencias de la CNMV.**
  - «Crypto.com»: salen 6 dominios ajenos.
  - «Foris»: salen dos webs clon, `forisdaxltd.com` y `my.forisdaxltd.top`. No
    son la entidad. Conviene avisarlo si algún día se publica.
- **Siguiente paso.** Pedir el KID y la lista de países a
  compliance.cy@crypto.com, o mirarlos en la app desde España. Para eso hace
  falta cuenta o contacto, y no lo hice.

## Pistas para otro ciclo

- **OKX Europe Markets Limited** (Malta, MiFID; CNMV nº 5024): según la prensa,
  tiene 100 acciones tokenizadas para el EEE desde el 10/09/2026. No encontré
  documento oficial.
- **Ondo Stocks a través de Assetera** (07/10/2026): Assetera dice ofrecerlo a
  «clientes minoristas y profesionales» de 30 países del EEE. Puede cambiar lo
  que concluyó el expediente `ondo-global-markets`. No lo comprobé en los
  documentos de Ondo.
- **Coinbase Financial Services Europe** (CNMV nº 4854), **eToro (Europe)**
  (nº 2534), **Gate Securities (Cyprus)** (nº 5063), **Bitstamp Financial
  Services** (nº 5284) y **Revolut Securities Europe** (nº 5175) tienen
  pasaporte MiFID en España. De Coinbase y eToro hay anuncios de acciones
  tokenizadas, pero ninguno confirmado para el EEE.
- **Deploi** (notas de crédito al consumo del Reino Unido vía Assetera): anuncia
  un rendimiento objetivo del 6–18 %. No hay documento ni condiciones para
  minoristas.
- **DGLD (Gold Token SA, white paper notificado en Malta)** y **NatGold**
  (notificado en Irlanda, no aprobado): falta mirar quién lo vende en España y
  qué derecho dan sobre el oro.
- **VNX Gold**: una fuente secundaria dice que suspendió su plataforma el
  30/06/2026. Está sin comprobar.

## Incidencia técnica

Entre las 10:06:40 y las 10:06:53 UTC, otro grupo, el de Brickwise, usó por
error mi script `bin/fetch.sh` del scratchpad compartido. Había sobrescrito el
suyo sin querer. Sus descargas de ese intervalo fallaron, pero ahora sus
archivos existen en su carpeta. Quité esas líneas de mi inventario y dejé
`bin/fetch.sh` en una versión neutra, que no escribe en mi carpeta. Desde
entonces uso `nuevas-europa-bin/`.
