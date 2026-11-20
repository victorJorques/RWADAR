# Verificación de la entrega 2026-11-20 (comprobación determinista)

Generado por `motor.mjs auditar 2026-11-20`. Compara el SQL que vieron los revisores con el de después de corregir.

**Veredicto:** EL SQL CAMBIÓ. Hace falta el auditor (agente) para ver que cada diferencia de abajo es una corrección pedida.

- SQL revisado (antes de corregir): `4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6` (es el que dio el montador).
- SQL final: `cb27c32885c8430a6bb0dd7157d771cc6096245bcb9ead906c74bc6bc94d4f30`.
- Rehecho dos veces desde decisiones.json en una carpeta aparte: mismos SHA-256 las dos veces: sí; igual byte a byte a lo de la carpeta: sí.
- Mismo inventario de sentencias antes y después: sí (288 sentencias: 35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias que cambian (sin contar la revisión y la huella): 9.
  - insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #13:
    - « No se obtuvieron los términos finales vigentes de mTBILL.» → «»
    - «No se obtuvieron términos » → «Las condiciones »
    - «vigentes que permitan confirmar acceso minorista, mínimo » → «de mTBILL (17/07/2026) incluyen España entre los países »
    - «inversión o elegibilidad desde España» → «la oferta pública y no prohíben la venta a minoristas del EEE»
    - «» → « Eso no confirma que la web te deje darte de alta.»
  - insert into rwadar_catalogo.alertas (revision_id,plataforma_id,codigo,detalle) s #13:
    - «los términos» → «las condiciones»
    - «vigentes » → «»
    - «» → «; las del 17/07/2026 no lo prohíben»
    - «que » → «pero eso »
    - «hemos podido obtener» → «confirma que la web te deje darte de alta»
  - insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #16:
    - «30» → «31»
    - «09» → «10»
  - insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #17:
    - «La fuente primaria localizada acredita una emisión española concreta con ERIR; » → «Reental dice que su actividad en España »
    - «acredita una » → «está sujeta a »
    - «general de Reental como empresa » → «ni registro previo »
    - «servicios de inversión» → «la CNMV»
  - insert into rwadar_catalogo.plataforma_fuentes (revision_id,plataforma_id,campo, #67:
    - «emision» → «web»
  - rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill':
    - «» → «,"https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media"»
    - «Acceso desde España · consulta 01/11/2026","valor":"mTBILL: Midas Software GmbH · «Public offer under the EU Prospectus Regulation» · offer: public","fechaDato":null,"fechaConsulta":"2026-11-01","fuente":"https://midas.app/assets/main-DOxid0Zj.js","alcance":"Configuración de la propia web; coincide con las Condiciones Finales. Localizador: Bundle JS de midas.app, mapa de emisores (extracto en fuentes/midas-app-bundle-extracto-emisores.txt)."},{"etiqueta":"» → «»
    - «» → «,{"etiqueta":"Países de oferta pública · Condiciones Finales del 17/07/2026","valor":"Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany","fechaDato":"2026-07-17","fechaConsulta":"2026-11-20","fuente":"https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media","alcance":"Condiciones Finales de mTBILL del 17/07/2026 (copia en la docum»
  - rwadar_catalogo.ofertas 'prosegur-digital-gold' 'https://www.prosegurcrypto.com/digital-gold':
    - «Oro » → «Según su contrato, oro »
  - rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «Genussscheine ...» → «Das Produkt»
  - rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «Genussscheine ...» → «Das Produkt»
- Ensayo en PGlite: correcto, 18 comprobaciones y 6 casos de fallo.
- Escáner de secretos sobre lo que irá a Git: sin hallazgos.

## Hallazgos

Ninguno.
