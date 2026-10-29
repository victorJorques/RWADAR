# Primera entrega · Brickwise y Reental · 23/10/2026

Investigación iniciada por orden manual de Víctor. Este expediente no publica,
no modifica Supabase y **no certifica 34 investigaciones profundas terminadas**.

Inventario: 12 referencias Brickwise; 21 referencias Reental de reventa y una
referencia documental de emisión primaria. La copia del inventario anterior se
conserva en `inventario-34.json`; sus fechas no se han renovado.

Se han conservado mediante GET público directo 46 fuentes nuevas: 12 contratos
Brickwise, 12 KID específicos y 22 páginas Reental. `inventario-consultas.json`
identifica URL, hora UTC de consulta, HTTP, última modificación recibida,
SHA-256 y extracción por páginas de los PDF. **Captura no equivale a lectura,
contraste, revisión independiente ni aprobación.** Las matrices identifican qué
afirmaciones se han contrastado; no asumir por el número de archivos una
cobertura jurídica completa.

## Hechos ya contrastados y límites

- **Brickwise, costes comunes:** el PDF oficial de dos páginas establece 1,5 %
  por transacción a cada comprador/vendedor; las cifras medias de costes del
  producto no sustituyen el KID individual. El original descargado tiene
  SHA-256 `3ddf88826e098f02a2552f3b6d9a6236e406ac57ba2cb37fc7da95a0906b862b`;
  el servidor informa modificación del 01/04/2023. Consultarlo hoy no lo
  convierte en un documento de octubre de 2026.
- **Brickwise, cuenta y España:** la FAQ permite abrir cuenta con residencia en
  el EEE. No prueba que cada emisión pueda distribuirse a un residente de
  España ni sustituye sus requisitos contractuales y de intermediación.
- **Brickwise, mercado:** GET de API a las 19:06:19 UTC, HTTP 200, 53.972 bytes,
  SHA-256 `e633e1253a68c2bff3c1a42198c7cfe773ecd56ab815b89d61ada7182b580710`.
  Contiene 14 activos, 12 del catálogo asignado. BILLA figura `primary`; los
  otros once figuran `secondary`. Randhartingergasse tiene `stage=secondary`
  pero `availableBricks=374`: no resolver esa divergencia afirmando una
  reapertura primaria. Precio de mercado, precio de emisión y mínimo son
  campos distintos.
- **Brickwise, contratos antiguos:** en Plüddemanngasse, Sonnleithnergasse,
  Klagenfurt y Stallhofstraße se han leído las reglas de derecho adquirido,
  transmisión y terminación. No otorgan propiedad registral ni participación
  societaria; vender requiere adquirente y consentimiento en las condiciones
  del contrato. Los mínimos de suscripción de 2021/2022 no se presentan como
  mínimos actuales del mercado secundario.
- **Reental, documento frente a marketing:** la FAQ distingue préstamo
  participativo español y participación de LLC estadounidense. KYC/AML y
  requisitos adicionales son necesarios; el marco de una jurisdicción no
  acredita por sí solo una licencia para todas las referencias.
- **Reental, error de extracción localizado:** el HTML contiene simultáneamente
  las tres etiquetas «En explotación», «En reforma» y «Financiado», pero las
  dos primeras llevan `w-condition-invisible` en Miami 1, Granada 3 y Houston 3.
  Una extracción de texto sin comprobar esa clase mostraría estados falsos.
  En esos tres casos el distintivo no oculto es «Financiado». Eso no prueba
  disponibilidad P2P.
- **Reental, moneda:** en esos HTML también existen símbolos de moneda ocultos.
  El símbolo no oculto del precio de Miami 1 y Houston 3 es USD; el de Granada 3
  es EUR. No convertir 100 USD en 100 EUR ni convertir precio por token en
  mínimo de compra en reventa.
- **Reental, Miami 1:** el acuerdo oficial de 2023 identifica `Series RNT –
  Miami 1, LLC`, inversión denominada en USD y restricciones de transmisión,
  incluido plazo mínimo inicial de un año (§1.4). El propio contrato dice que
  la oferta no está registrada bajo la ley de valores y contiene restricciones
  para extranjeros (§3.9). No equivale a una aprobación de la SEC ni confirma
  la admisión de un comprador español concreto. Su web muestra rentabilidades
  proyectadas sin fecha de cálculo actual; no se renueva su vigencia.

## Pendiente real antes de certificar cobertura profunda

Completar la lectura y comparación de los doce KID/contratos por activo,
acreditar el registro oficial y su alcance, leer los acuerdos y whitepapers
particulares de cada proyecto Reental (varios tienen decenas de páginas),
resolver costes y restricciones por producto y comprobar mercado secundario
sin inferir liquidez de una ficha pública. El acceso a la portada P2P explica
que es un producto de la comunidad; no prueba que haya una orden ejecutable.

No se propone por ahora ninguna alta nueva, retirada ni renovación general de
las 34 fichas. Se conserva el catálogo público completo y la fecha real de sus
datos mientras se completa la investigación y la revisión independiente.
