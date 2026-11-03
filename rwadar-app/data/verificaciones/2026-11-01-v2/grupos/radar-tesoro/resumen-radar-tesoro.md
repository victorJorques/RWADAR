# Grupo radar-tesoro · resumen del 01/11/2026

Encargo: buscar ofertas concretas nuevas de Tesoro, fondos monetarios, crédito
y oro en nueve plataformas del radar (Backed, Ondo, OpenEden, Franklin
Templeton, Superstate, Securitize, Centrifuge, Maple y Pax Gold), pensando en un
particular residente en España.

**Resultado: no propongo admitir ninguna.** Ninguna tiene hoy, con fuente
primaria, un canal confirmado por el que un particular en España pueda comprarla.
Hay una casi lista (grBENJI, de Franklin Templeton) a la que solo le falta ese dato.

Este grupo no tiene ofertas publicadas, así que no hay cambios en el catálogo.

## La candidata más sólida: grBENJI (Franklin Templeton)

Expediente `franklin-templeton-grbenji` (decisión: `no_admitir` por ahora; dejo
un borrador de tarjeta).

Lo que está comprobado en fuente primaria:

- Es un fondo monetario UCITS de Luxemburgo: Franklin OnChain U.S. Government
  Liquidity Fund, clase AB (Ddis) USD, ISIN LU3258450587, token grBENJI en Stellar.
- **Está inscrito en la CNMV** como IIC extranjera nº 2284 (13/12/2024). La única
  comercializadora inscrita es FTIS, Sucursal en España.
- La ficha en español del 30/09/2026 da estos datos: **mínimo de 20 USD**,
  gestión del 0,20 % anual, entrada de hasta el 1,50 %, sin comisión de salida,
  valor liquidativo de 1,00 USD y patrimonio de 57,95 M USD. Dice «Destinado a
  inversores minoristas».
- El KID del 15/06/2026 (en inglés) le da un riesgo de 1 sobre 7, permite
  reembolsar cualquier día de negociación y avisa del riesgo de divisa, de
  contraparte y de las acciones en blockchain.
- No hay rentabilidad publicada: la clase tiene menos de 12 meses y la ley no
  permite mostrarla. Por eso la tarjeta va sin cifra.

Lo que falta para admitirla:

- El KID dice que se compra «a través de la App o del portal web institucional».
  La app Benji **no aparece en la App Store española** (da 404) y la web de Benji
  solo enlaza a la tienda de EE. UU.
- 21X, la plataforma donde cotiza el token, pide datos de empresa para darse de alta.
- No encontré el KID en español ni el folleto.

Siguiente paso: preguntar a FTIS Sucursal en España (+34 91 426 3600, el teléfono
de la ficha) cómo suscribe un particular. También se puede mirar la app desde un
móvil español.

## Las que no entran y por qué

| Slug | Motivo |
|---|---|
| `backed-bib01` | Backed solo vende directamente a «inversores cualificados». Su folleto base (BPWO-80, aprobado por la FMA de Liechtenstein el 08/05/2026, con suplemento del 04/08/2026) se notificó a la CNMV. Pero las condiciones finales y el estado de bIB01 no se pudieron leer: bloqueo por país, porque la conexión sale por EE. UU. Tampoco se identificó ningún distribuidor en España. |
| `ondo-usdy` | En el EEE, solo para clientes profesionales o inversores cualificados. |
| `ondo-ousg` | No se leyó su elegibilidad. Ondo no ofrece acceso minorista general. |
| `ondo-global-markets` | Hay un folleto base aprobado por la FMA de Liechtenstein el 11/11/2025, pero solo lo vi en el buscador. No leí producto, condiciones finales ni distribuidor en España. Conviene revisarlo en otro ciclo. |
| `openeden-tbill` | Solo para profesionales de las BVI o acreditados de EE. UU. |
| `openeden-usdo` | No examinado. |
| `franklin-templeton-fobxx` | Su folleto lo excluye de la UE/EEE. Su versión europea es grBENJI. |
| `superstate-ustb` | Solo para acreditados que además sean *qualified purchasers*. |
| `superstate-uscc` | No examinado. |
| `securitize-buidl` | Es un fondo institucional y no se examinó. La autorización del régimen piloto DLT en España es de infraestructura, no de un producto. No encontré nada para particulares. |
| `centrifuge-jtrsy`, `centrifuge-jaaa` | No leí sus documentos. Centrifuge avisa de que cada fondo puede limitarse a inversores cualificados y no estar regulado. |
| `maple-syrupusdc` | La operadora declara no estar registrada ante ningún regulador. |
| `pax-gold-paxg` | Paxos dice que PAXG no está disponible en la UE. No comprobé su estado MiCA. |

Los expedientes breves se apoyan en el radar canónico verificado el 22/10/2026.
Esas fuentes no se releyeron hoy, y los claims lo dicen.

## Advertencias de la CNMV

Busqué estos nombres en el buscador de entidades no autorizadas de la CNMV:
Backed, xStocks, OpenEden, Open Eden, Superstate, Securitize, Centrifuge, Maple,
Syrup, Paxos, Franklin Templeton y Benji. **Ninguno tiene advertencias.**

Con **Ondo** el resultado no es concluyente: la página no mostró filas ni el texto
«No hay datos disponibles». Hay que repetirlo con navegador.

## Bloqueos y conflictos

- **Backed:** la documentación legal (assets.backed.fi y backedassets.fi) bloquea
  por país y el panel de bTokens necesita JavaScript.
- **Franklin Templeton:** la ficha del fondo en franklintempleton.com.es necesita
  JavaScript. El folleto y el KID en español no se localizaron.
- **Conflicto de comisión:** el agregador rwa.xyz da un 0,15 % de gestión y la
  ficha y el KID dan un 0,20 %. Se usa el 0,20 % de la fuente primaria.
- **Archivos en otra carpeta:** el script de descarga compartido del scratchpad lo
  sobrescribió otro investigador, y cuatro archivos de Backed acabaron en
  `grupos/radar-otros/`. Los moví a esta carpeta y quité sus cuatro líneas del
  `inventario-consultas.jsonl` de radar-otros. No toqué nada más allí.
- **Relación con otro grupo:** existe un `kraken-xstocks.json` de otro grupo, que
  puede servir de canal de distribución de xStocks de Backed. No lo he revisado.

Fuentes guardadas en `fuentes/` e inventario en `inventario-consultas.json`.
