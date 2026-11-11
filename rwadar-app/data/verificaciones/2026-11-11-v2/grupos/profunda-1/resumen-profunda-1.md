# Grupo profunda-1 · arttrade (bonos de arte tokenizados) · 11/11/2026

Revisado entre las 10:08 y las 10:19 UTC con fuentes primarias de hoy.
Expediente: [`../../expedientes/arttrade-attram-03.json`](../../expedientes/arttrade-attram-03.json).
Inventario: [`inventario-consultas.json`](inventario-consultas.json) (115 entradas con SHA-256).

## Decisión: no admitir

**Un particular que vive en España no puede comprar.** Las condiciones de uso de
arttrade (versión de enero de 2025, punto 4) lo dicen sin rodeos:

> «Nutzer, die über die Plattform Finanzinstrumente erwerben wollen, müssen
> ihren Sitz bzw. Wohnsitz in Deutschland haben…»

En castellano: solo puede comprar quien tiene su domicilio en Alemania. Otras
dos fuentes apuntan en la misma dirección:

- La información de cliente de Effecta, que la propia plataforma enlaza hoy,
  dice que Effecta «setzt ausschließlich in Deutschland vertraglich gebundene
  Vermittler … ein»: solo usa agentes vinculados en Alemania.
- En la CNMV, Effecta (n.º 5003) solo tiene pasaporte para recibir y transmitir
  órdenes, en libre prestación. En la pestaña «Agentes» no hay datos, así que
  arttrade no consta como agente para España.

Hay otros fallos que por sí solos también bastarían para dejarla fuera:

1. **No se sabe qué está abierto hoy.** La web dice que las ofertas abiertas
   «können ausschließlich von registrierten Nutzern eingesehen werden» (solo se
   ven tras registrarse). El portal `arttrade-investments.de` lleva directamente
   al login. No inicié sesión ni creé ninguna cuenta. El KID de ATTRAM#03 se
   revisó el 08/12/2025, pero nada público dice que la emisión siga abierta.
2. **Todo está solo en alemán.** La información al consumidor dice «Die
   Kapitalanlage wird nur in deutscher Sprache angeboten». La web no tiene
   versión en inglés ni en español: `/en/` y `/es/` dan 404.
3. **No es para el inversor común.** El KID lo dirige a inversores «mit
   erweiterten Kenntnissen und Erfahrungen», es decir, con conocimientos y
   experiencia por encima de lo normal.

## Qué es el producto (ATTRAM#03, ISIN DE000A4AG7X0)

- **Emisor.** arttrade custody 004 UG (haftungsbeschränkt), de Düsseldorf
  (HRB 103466). Es una sociedad vehículo pequeña, filial de arttrade GmbH, y no
  está supervisada. El KID lo dice así: «Eine laufende Aufsicht besteht nicht».
- **Qué compras.** Bonos subordinados de 1,00 € de nominal cada uno, con un
  bloqueo de pagos que se aplica antes de una insolvencia («vorinsolvenzliche
  Durchsetzungssperre»). No compras las obras. La emisión es de 1.000.000 € como
  máximo.
  - Intereses: el 50 % de lo que ingresen las obras mientras se gestionan.
  - Al vencimiento: el 100 % del nominal más el 90 % de la plusvalía al venderlas.
- **Cómo se guarda.** Los bonos son criptovalores alemanes (eWpG). El registro lo
  lleva Cashlink, que tiene licencia de la BaFin desde el 26/06/2024, y los
  tokens están en Polygon. Las claves se guardan en una cartera colectiva de
  Tangany, que es custodio con licencia de la BaFin y de MiCA.
- **Costes según el KID.** Un 2 % de entrada (agio), un 2 % al año de gestión y
  un 10 % de la plusvalía. En el ejemplo de 10.000 € a 5 años suman 1.893 €, un
  2,6 % al año.
- **Salida.**
  - No se puede pedir el reembolso antes de tiempo y no hay mercado secundario.
  - Se cobra cuando vence, el 03/06/2029. El emisor puede alargarlo él solo
    hasta el 03/06/2031.
  - El mercado propio está «planeado», sin fecha.
- **Riesgo.** 6 de 7 en el KID, con posible pérdida total y sin fondo de
  garantía.
- **Mínimo.** «Bereits ab 1.000 €», es decir, desde 1.000 €. Solo lo dice la web
  comercial: el KID y las condiciones no fijan ningún mínimo.

## Contradicciones encontradas

- **Costes.** La web dice «somit entfallen laufende Kosten für den Anleger», o
  sea, que el inversor no paga costes corrientes. El KID y las condiciones fijan
  un 2 % anual.
- **Venta.** La web llama a los bonos «handelbar» (negociables), pero el KID dice
  que «es existiert noch kein liquider Zweitmarkt» (todavía no hay un mercado
  secundario líquido).
- **Direcciones.** No coinciden en estos casos:

  | Entidad | Dirección en los documentos o la API | Dirección en el registro |
  |---|---|---|
  | arttrade | Immermannstraße 19 (AGB y API) | Schinkelstraße 38-40 (Impressum y BaFin) |
  | Cashlink | Sandweg 94 (KID) | Wiesenhüttenplatz 25 (BaFin) |
  | Tangany | Agnes-Pockels-Bogen 1 (AGB) | Brienner Straße 53 (BaFin) |

- **Enlace del KID.** El KID remite a `www.arttrade.io/bib`, que hoy da 404. El
  mismo PDF sí está en `arttrade.de/basis-informationsblaetter/`.

## Correcciones a la pista del estratega

- **Número de Effecta.** El n.º 80175757 es el de **arttrade** como agente
  vinculado: activo desde el 01/12/2021 y notificado el 12/03/2026. Effecta tiene
  el BaFin-ID 10133261.
- **Fechas.** El 04/06/2024 es el inicio del plazo de los bonos. El KID vigente
  es del 08/12/2025.
- **Comisión del 2 %.** La «Emissionsgebühr» del 2 % es un agio. Además hay un
  2 % anual de gestión que la web no menciona.
- **Duda sobre la residencia.** La pista la dejaba abierta y las condiciones de
  uso la resuelven: hay que vivir en Alemania.

## Pistas secundarias

- **Agitarex.** Agitarex GmbH, de Colonia, es otro agente vinculado de Effecta
  (BaFin n.º 80176491) y distribuye otra serie de arttrade, **ATTDAP#01**. Lo
  encontré en una nota de prensa del 10/02/2025. Su ficha está protegida con
  contraseña y no tiene KID público, así que no sirve como vía.
- **V-Bank.** Su acuerdo con arttrade se conoce solo por prensa y está pensado
  para gestores de patrimonio en Alemania. No lo seguí.

## Registros y advertencias (11/11/2026)

- **BaFin.**
  - Effecta: es Wertpapierinstitut, con mediación y asesoramiento en inversiones.
  - arttrade: agente vinculado activo. No tiene licencia propia (la búsqueda da
    «Keine Ergebnisse»).
  - Cashlink y Tangany: tienen licencia. Los datos de la BaFin son a 10/11/2026.
- **CNMV.** No hay advertencias para arttrade, Effecta, arttrade custody,
  Cashlink ni Tangany. Comprobé que el buscador funciona con «Trading», que
  devuelve 16 páginas.

## Bloqueos

- **Lista de criptovalores de la BaFin (§ 20 eWpG).** No la pude consultar: la
  página muestra hoy una portada genérica y las otras rutas dan 404 o 403. La
  ISIN no aparece en ningún sitio fuera de los documentos de arttrade.
- **Registro mercantil del emisor.** No lo consulté porque se accede con un
  formulario.

## Fuentes

- **Copias crudas** (HTML, PDF, JSON y la captura del login): en
  `fuentes/crudo/`, que queda fuera de Git.
- **Textos extraídos:** en `fuentes/` y `fuentes/documentos/`, con los nombres de
  personas físicas sustituidos por «[persona física omitida]».
- **Mismas copias que el estratega.** El KID, las condiciones y la página «Art
  Investment» tienen el mismo SHA-256 que las suyas de esta mañana.
- **Búsquedas web.** WebSearch y WebFetch solo sirvieron para encontrar pistas
  (Agitarex y la lista de la BaFin). Ninguna afirmación se apoya solo en ellas.
