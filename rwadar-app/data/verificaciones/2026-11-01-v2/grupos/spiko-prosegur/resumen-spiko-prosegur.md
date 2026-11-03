# Grupo spiko-prosegur · revisión del 1–2 de noviembre de 2026

Revisé las dos fichas publicadas (Spiko Letras del Tesoro Euro y Prosegur
Digital Gold) y los demás fondos de Spiko que aparecen en su API pública.
Todo sale de páginas, PDF y registros públicos; no abrí cuentas ni hice KYC.
Copias e inventario con hora UTC y SHA-256 en `fuentes/` e
`inventario-consultas.json`.

## Fichas publicadas

### spiko-letras-del-tesoro-euro · decisión: actualizar

- **Cifra:** hoy es **2,35 %** (la ficha muestra 2,36 % del 22/10). Es el
  rendimiento neto anualizado de los **últimos 31 días**, calculado por Spiko
  el 30/10/2026 con el valor liquidativo del 01/11/2026
  (`public-api.spiko.io/v0/share-classes/EUTBL/yield`, `monthlyYield 0.0235`).
  La web en español, data.spiko.io y la API dan hoy la misma cifra. Lo
  recalculé con la serie de valores liquidativos de la API: 1,059941 (01/10)
  → 1,062032 (01/11), 31 días y capitalizado, da 2,348 %. Así queda resuelto el
  conflicto anterior: la ventana real es de 31 días, y la etiqueta «30d» de
  data.spiko.io es solo un rótulo.
- **Acceso desde España:** se puede pasar a **confirmado**. La tabla del emisor
  «Fund Availability» (23/10/2026) marca España ✅ para T-Bills Euro. La CNMV
  tiene inscrita SPIKO SICAV con el n.º 2380 (30/01/2026), con ALDANA CAPITAL,
  A.V. como comercializadora. España no figura en la lista de exclusiones de
  onboarding. Spiko Finance tiene pasaporte LPS a España (REGAFI). Hace falta
  KYC y no se admiten «U.S. Persons».
- **Documentos:** KID en español del 01/09/2026, folleto en inglés del
  01/09/2026 y Terms of Use v2.2 (30/06/2026). El folleto en español da 403.
- **Condiciones:** mínimo 1 EUR; coste corriente del 0,25 % anual según el KID
  (el folleto fija como máximo un 0,30 % más un 0,10 %); sin comisiones de
  entrada ni de salida; riesgo 1/7. Reembolso diario con corte a las 11:30 de
  París y gate a partir del 10 % del patrimonio. Hay retirada instantánea SEPA
  de hasta 500.000 EUR/día, sin garantía de que sea inmediata.
- **Conflicto menor:** la página comercial «Particulares» habla de un corte a
  las 15:00. El KID y docs.spiko.io dicen 11:30, y prevalece el KID.

### prosegur-digital-gold · decisión: actualizar

- **Condiciones:** no hay versión nueva. Siguen las del **08/07/2026**, con un
  texto idéntico al leído el 23/10.
- **Cambios críticos para la ficha:**
  1. Quitar «liquidación en menos de 24 h». Según el contrato, solo Prosegur
     recompra, en 1 a 7 días hábiles aproximadamente, y puede suspender la
     recompra o poner límites (§§6.4 y 6.7).
  2. Añadir el coste: **compra LBMA +4 % y venta LBMA −6 %** (§5.4). La web
     habla de «márgenes mínimos».
  3. Supervisión: en el registro MiCA de ESMA, la CNMV autorizó a **Prosegur
     Custodia de Activos Digitales, S.L.U.** como CASP el 30/06/2026 para
     custodia, recepción y transmisión de órdenes y transferencia. Pero el
     propio contrato dice que el token de oro **no** es un producto financiero
     ni está supervisado. Hay que decir las dos cosas.
- **Producto:** derecho contractual sobre oro segregado en un inventario
  fungible (lingotes de 1 kg, búnker de Prosegur Cash). Solo se revende a
  Prosegur, y con 1.000 tokens se puede pedir un lingote en Madrid. Está
  dirigido a residentes en el EEE, con KYC y liquidación en euros. El mínimo de
  1 gramo solo figura en la web.
- **Conflicto nuevo:** la página de transparencia dice Polygon/ERC-3643 y el
  contrato dice Ethereum/ERC-1155.
- **Precio del gramo:** no se capturó hoy y no se publica.

## Candidatas nuevas (Spiko)

| Slug | Decisión | Motivo |
|---|---|---|
| spiko-letras-del-tesoro-dolar (USTBL, FR001400ODM9) | **admitir_propuesta** | UCITS monetario autorizado por la AMF (SCV20240013), misma SICAV inscrita en la CNMV, España ✅, mínimo 1 USD, 0,25 %, KID en español. **4,13 %** neto anualizado en USD, 31 días, a 30/10/2026. Aviso de divisa obligatorio. Conflictos: el KID dice «último VL conocido» y el folleto y la API dicen VL desconocido; la clase EUR tiene un mínimo de 1 EUR en el folleto y de 1.000 EUR en la API. |
| spiko-smart-cash-euro (FR0014015LD3) | no_admitir (pendiente) | Encaja con lo que se busca (1 EUR, España ✅), pero no leí su KID, su ficha AMF ni su cifra. Prioridad para el próximo ciclo. |
| spiko-letras-del-tesoro-libra (UKTBL) | no_admitir | La tabla del emisor marca España ❌. |
| spiko-cash-carry (SPKCC) | no_admitir | Fondo profesional, mínimo de 100.000 EUR / 120.000 USD. |

De Prosegur Crypto no encontré otro producto para particulares en las páginas
leídas, aparte del mismo oro comprado a nombre de una empresa.

## Advertencias y bloqueos

- **CNMV, lista de advertencias:** ninguna coincidencia para «Spiko», «Twenty
  First Capital» ni «Prosegur».
- **Bloqueos:**
  - support.spiko.io devuelve un desafío de Cloudflare (403). No lo esquivé y
    usé docs.spiko.io y el PDF de los Terms.
  - El folleto de Spiko en español da 403.
  - El pasaporte en REGAFI solo se pudo leer con WebFetch, porque el proxy
    cortó curl.
  - La vista pública de la CNMV no desglosa compartimentos.
  - El LEI de Prosegur aparece en ESMA con 19 caracteres y no lo validé.
