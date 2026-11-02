# Grupo midas · revisión del 01/11/2026

## Respuesta corta para el cliente

¿Puede un particular que vive en España comprar estos tokens hoy?

- **mTBILL: sí, según los documentos.** Hay oferta pública en España para
  minoristas, un folleto aprobado por la FMA de Liechtenstein y notificado a
  España (lo dice el registro de ESMA), un KID en español y no hay importe
  mínimo. Pagas y cobras en USDC con una wallet tuya, después de darte de alta.
- **mF-ONE, mGLO, mGLOBAL y mGLOeuro: no.** Son ofertas «exentas» (sin
  folleto ni KID), solo para direcciones aprobadas en lista blanca. El
  contrato de suscripción de Ethereum estaba **pausado** el 01/11. El primer
  depósito que exige el contrato ronda los 100.000–170.000 (en USD o EUR,
  según el token).

## Qué revisé y cómo

midas.app y docs.midas.app siguen devolviendo el bloqueo de Cloudflare (403) a
curl, WebFetch y Chromium. La copia de archive.org está bloqueada por la
política de salida. Así que usé fuentes primarias que sí se pueden leer:

1. **Registro de folletos de ESMA**, buscando por el LEI de Midas Software
   GmbH (38 valores y 41 documentos).
2. **Condiciones Finales de mTBILL** (17/07/2026) y **KID en español**
   (enlaces directos de GitBook).
3. **docs.midas.app/llms-full.txt**: la exportación oficial de toda la
   documentación (elegibilidad, estructura legal, registro de contratos).
4. **Lectura en cadena (Ethereum)** de los oráculos de valor, los tokens y los
   contratos de suscripción y reembolso.
5. El **código público de la web** (bundle JS), que dice qué emisor y qué tipo
   de oferta tiene cada producto.
6. Las **advertencias de la CNMV** («Midas», «Midas Software», «Midas Protocol»,
   «Aureum», «Fasanara», «MembersCap»): ninguna coincidencia. La FMA de
   Liechtenstein no tiene a Midas como entidad supervisada.

## Ofertas publicadas

| Slug | Decisión | Qué cambia |
|---|---|---|
| mtbill | **actualizar** | `disponibleEs` pasa a confirmado. Métricas nuevas: sin mínimo, folleto FMA notificado a España, KID en español con riesgo 7/7, gestión 0 % y éxito 5 %, valor por token 1,0768 USD (30/10). La rentabilidad sigue en null. |
| mf-one | **retirar_propuesta** | El APY del 7,43 % no se puede comprobar hoy. Es oferta exenta para lista blanca y la suscripción estaba pausada en cadena el 01/11. |
| mglo | **retirar_propuesta** | Sigue cerrada (contrato pausado). Oferta exenta de un compartimento luxemburgués (Aureum Securitisation Fund). |
| mglobal | **retirar_propuesta** | No se puede comprobar en la web desde el 06/10. Contrato pausado el 01/11. Oferta exenta. |
| mgloeuro | **retirar_propuesta** | Ya no es «apertura sin confirmar»: hay 6,83 millones de tokens emitidos. Pero la suscripción está pausada y es oferta exenta para lista blanca. El valor por token pasó de 100.000 EUR a 1,00 EUR el 26/10 y ningún documento lo explica. |

Si Víctor prefiere no retirar las cuatro de Fasanara, se pueden **agrupar en
una sola ficha secundaria «solo profesionales»**.

### Conflicto de mTBILL (gate y holdback)

Las dos fuentes son documentos vigentes:

- **Condiciones Finales del 17/07/2026** (pág. 4): como máximo se reembolsa el
  25 % de los tokens en circulación cada día, con una retención de hasta el 5 %
  en el reembolso inmediato.
- **KID en español** (revisión del 17/07/2026, PDF generado el 12/10/2026,
  §5): como máximo el 15 % diario y una retención de hasta el 50 %.

ESMA no tiene Condiciones Finales posteriores ni suplementos (consulta del
01/11). Por tanto, el término contractual depositado sigue siendo el de las
Condiciones Finales: 25 % / 5 %. El KID, que es lo que lee el minorista
español, es más restrictivo.

**No elegí una cifra.** Propongo mostrar el aviso con las dos. También
discrepan las comisiones: las Condiciones Finales permiten hasta un 0,2 % al
suscribir al instante y hasta un 0,05 % al reembolsar; el KID dice 0 % de
entrada y reembolso estándar sin comisión. En cadena, hoy se cobra un 0 % al
suscribir al instante y un 0,07 % al reembolsar al instante.

Otros riesgos de mTBILL:

- El emisor **no está supervisado**: la FMA aprobó el folleto, no la entidad.
- Lo que compras es un **crédito subordinado** frente a Midas Software GmbH.
- El emisor tenía **patrimonio negativo** a 31/12/2025: −5,78 millones de
  euros (resumen anexo a las Condiciones Finales, pág. 9).

## Candidatas nuevas (todas no_admitir)

- **mwin**: oferta exenta solo para lista blanca. El contrato exige un primer
  depósito de 1 token, que vale unos 131.800 USD. La documentación solo está
  en DocSend.
- **mre**: no tiene emisor, documento legal ni contrato publicado. Promete
  «protección del capital» sin ningún documento que lo respalde.
- **mbasis, medge, mhyper, mapollo**: tienen oferta pública con Condiciones
  Finales notificadas a España (ESMA, 17/07/2026). Pero su subyacente es una
  estrategia cripto/DeFi, no un activo real, y hoy no se pudieron leer sus
  Condiciones Finales ni su KID.
- **mmev**: estrategia cripto/DeFi. No identifiqué su ISIN en ESMA.

## Bloqueos

- **Fichas de producto (midas.app/<producto>)**: bloqueadas. No hay APY, YTW
  ni comisiones de hoy. No calculé ninguna rentabilidad a partir del valor por
  token.
- **Memorandos de las ofertas exentas**: están en DocSend, que pide
  identificarse. No los leí, por las reglas del encargo.
- **Folleto base 2026 completo**: no lo leí. Sus datos salen del resumen anexo
  a las Condiciones Finales y del registro de ESMA.
- **Registro luxemburgués de Aureum Securitisation Fund (RCS/CSSF)**: no lo
  consulté.
- **Lectura en cadena**: solo en Ethereum, no en otras redes. No pude leer los
  eventos de emisión de mGLOeuro, así que no sé cuándo ni a quién se
  emitieron sus tokens.
- **Flujo de alta (KYC) desde España**: no lo comprobé, porque está prohibido
  iniciar sesión.
