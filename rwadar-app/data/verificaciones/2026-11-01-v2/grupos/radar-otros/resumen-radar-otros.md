# Resumen · grupo radar-otros · ciclo del 1 de noviembre de 2026

**En una frase:** no propongo admitir ninguna oferta nueva. La que más se acerca
a lo que busca un particular en España es la acción de la obra de Francis Bacon
en ARTEX, pero hoy no se puede comprobar que se negocie ni que un particular
español pueda comprarla.

## Qué revisé

Las 13 plataformas del encargo: Lofty, Blocksquare y sus marketplaces, Courtyard,
Archax, ADDX, ARTEX, Republic, Figure, tZERO, INX, Swarm, Taurus y Tokeny.
Ninguna tenía ofertas publicadas en el catálogo, así que no hay cambios sobre
ofertas publicadas.

La sesión se cortó una vez por el límite de uso, y después el coordinador cerró
la fase de captura. Por eso solo **ARTEX** se investigó a fondo con fuentes
primarias de hoy. Para **Swarm** hay una consulta nueva al registro de la FMA de
Liechtenstein. Para el resto hay una búsqueda nueva en la lista de advertencias
de la CNMV, y la licencia y el acceso vienen del radar del 22/10, sin releer.

Lo consultado está en `fuentes/` y en `inventario-consultas.json`: 69 consultas,
con URL, HTTP, hora UTC real y sha256.

## Candidata examinada a fondo

### ARTEX · Art Share 002 (Francis Bacon) → `no_admitir`

Expediente: `expedientes/artex-art-share-002-bacon.json`.

- **Qué es:** acción ordinaria de clase B de Art Share 002 S.A., una sociedad de
  titulización de Luxemburgo que posee el tríptico «Three studies for Portrait of
  George Dyer» (1963). ISIN LU2583605592, símbolo BAC1EU, en euros, con 412.000
  acciones admitidas desde el 08/03/2024. No es un token.
- **Supervisor:** el mercado lo opera ARTEX Global Markets AG. Lo comprobé en el
  registro público de la FMA-LI: n.º 307407, licencia de empresa de inversión
  (WPFG) desde el 23/12/2022 y sin revocar. El **emisor no está supervisado**;
  lo dice su propio aviso de riesgos.
- **Precio:** el último negociado es de 67 €, sin fecha y sin precios de compra
  ni de venta. Es la misma cifra que vio el radar el 22/10. La última pausa de
  volatilidad registrada es del 26/06/2025. No hay oferta primaria abierta.
- **Comisiones:** el mercado cobra un 0,19 % por operación a sus miembros
  (tarifa V8, junio de 2026). Lo que cobra el banco al particular no consta.
- **Cómo se compra:** solo a través de bancos o brokers miembros o conectados.
  La lista publicada son bancos de Francia, Suiza, Liechtenstein, Alemania,
  Italia y Reino Unido, casi todos de banca privada. **Ninguno es español.**
- **Exclusiones:** los términos del emisor excluyen a EE. UU. y Canadá, no a
  España.
- **Folleto:** no hay ninguno en el registro de la ESMA, así que no hay pasaporte
  a España.
- **Advertencias:** la CNMV no tiene ninguna por «ARTEX» ni por «Art Share».
- **Motivo de no admitirla:** no hay reventa activa demostrable y el acceso desde
  España como particular no está confirmado. Se podría reevaluar como
  «secundario» si aparece un broker accesible desde España y se lee el folleto
  o el KID.

## Expedientes breves, todos `no_admitir`

En estas plataformas no se examinó ninguna oferta concreta en este ciclo:

| Slug | Motivo |
|---|---|
| `swarm-sin-oferta-concreta` | Su contraparte, Swarm Capital GmbH (Vaduz), **no aparece en el registro de la FMA-LI** (búsqueda «Swarm»: 0 resultados el 01/11). Sin licencia verificable. |
| `blocksquare-marketplaces-sin-oferta-concreta` | No se documentó ningún marketplace ni inmueble concreto. La plantilla de términos dice que el operador no presta servicios con licencia. |
| `lofty-sin-oferta-concreta` | Es de EE. UU. y declara no estar registrada ante la SEC. Sin base legal para España. |
| `courtyard-sin-oferta-concreta` | Vende un coleccionable o NFT, no un valor supervisado. |
| `archax-sin-oferta-concreta` | Sociedad de valores en la CNMV (n.º 289, según el radar), pero solo para profesionales e institucionales y en «pre-launch». |
| `addx-sin-oferta-concreta` | Solo acreditados o institucionales no estadounidenses (MAS). |
| `republic-sin-oferta-concreta` | Registros de la FINRA (EE. UU.). No se examinó ninguna campaña abierta a España. |
| `figure-sin-oferta-concreta` | Es de EE. UU. La búsqueda en la CNMV falló («upstream request failed»). |
| `tzero-sin-oferta-concreta` | ATS de EE. UU. sin acceso comprobado desde España. |
| `inx-sin-oferta-concreta` | ATS de EE. UU. sin acceso comprobado desde España. |
| `taurus-sin-oferta-concreta` | Sobre todo institucional (FINMA/CySEC). No se comprobó el alta minorista desde España. |
| `tokeny-sin-oferta-concreta` | Proveedor de software, no punto de venta. |

**Advertencias de la CNMV (01/11):** ninguna coincidencia contra estas
plataformas. Con «Republic» solo salen clones de Trade Republic, y con «INX»
solo nombres parecidos de otras entidades.

## Bloqueos y conflictos

- La web de Art Share 002 pide declarar el tipo de inversor antes de enseñar el
  folleto y el KID. El control de permisos no dejó declararlo en nombre del
  usuario, así que esos documentos no se leyeron.
- La ficha de la CNMV de «ARTEX MTF AG» sale en el buscador, pero no se pudo
  abrir.
- La ficha de ARTEX muestra «Volume 4 180», «High 70 €», «Low 50 €» y «26.42%»
  sin periodo claro. No se publican.
- Se encontró, y se corrigió, una colisión de scripts con otro grupo en la
  carpeta temporal compartida: un archivo mío acabó en
  `nuevas-fuera-radar/fuentes`. Lo devolví a esta carpeta y quité solo esa línea
  de su inventario.

## Pendiente para otro ciclo

- Identificar los marketplaces europeos que usan Blocksquare y su registro.
- Las campañas de Republic Europe y su régimen europeo.
- El estado actual de la entidad de Swarm.
- Preguntar a ARTEX qué intermediario da acceso a un particular residente en
  España.
