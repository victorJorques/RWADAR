# Nuevas en España · resumen (ciclo 03/11/2026)

Grupo: **nuevas-espana**. Busqué ofertas nuevas de activos reales tokenizados
que un particular residente en España pueda comprar hoy, con una entidad
española supervisada (o con pasaporte a España) y documentos públicos. Las
consultas son reales, de las 10:05 a las 10:27 UTC del 03/11/2026. Cada lectura
está en `inventario-consultas.json`, con su URL, hora, código HTTP y sha256. No
inicié sesión ni rellené formularios.

## En una frase

**Hoy no hay ninguna oferta española nueva que se pueda admitir.** En España,
los valores tokenizados regulados existen, pero a día de hoy no hay ninguno
abierto a particulares a través de una entidad supervisada que no esté ya
publicado (Casa de Outeiro, de Alius) o estudiado por otro grupo (Hausera y
Reental).

## Qué revisé (fuente primaria, hoy)

1. **Registro ERIR de la CNMV.** Es el registro de las entidades que llevan el
   registro de valores tokenizados. Solo hay una: **Ursus-3 Capital, A.V.**
   (nº 251). Tiene **23 emisiones inscritas** (3 páginas):
   - Hausera Property Manager SPV, SPV 2, 3, 4, 5, 6, 7 y 8: obligaciones de
     5,1 a 8 M€ cada una. La última se inscribió el 23/10/2026.
   - Proptech SPV SP, SPV2 Business y SPV Tres: obligaciones de 4,2 a 8 M€
     (12/12/2025). No identifiqué la plataforma.
   - Gestión de Inversiones y Proyectos Inmobiliarios 2025, S.A.: obligaciones
     FDX001 y FDX002, de 1,35 M€ cada una (24/07/2026).
   - 7 Islas Tok, S.A.: obligaciones de 594.000 € con token A y token B (19/06/2026).
   - Otesa SPV Cal (Alius, campaña cerrada), Rona Habitat, Reental Tourist Homes
     (322.500 €) y Valorix Digital (500.000 €), todas obligaciones.
   - Acciones de Hispania Defense Solutions, Tokenix Global, Arca Habitatum
     Capital, Beself Brands y Dianelum.

   La CNMV avisa de que la inscripción «no implica que la CNMV haya validado las
   condiciones de la emisión».
2. **Registro de PSFP de la CNMV (27 plataformas españolas).** Leí las portadas
   de 25 por descarga directa y de 7 más con navegador. Solo **Alius
   (Adventurees Capital PFP, nº 11)** ofrece tokens, y es de otro grupo. Ninguna
   otra menciona tokenización. No pude leer urbix.es (el proxy la bloquea),
   gocrowd.es (502) ni sodacrowd.com (404).
3. **Infraestructuras del régimen piloto DLT (lista de la CNMV).** Hay dos
   sistemas de negociación y liquidación con TRD:
   - **Bit2Me STX**: Bit2Me Security Tokens Exchange STX, A.V., nº 343.
   - **Securitize**: Securitize Europe Brokerage and Markets, S.V., nº 327.

   Ninguna de las dos tiene hoy una emisión abierta a particulares.
4. **Otras agencias de valores dedicadas a la tokenización**: Token City
   European Exchange A.V. (nº 334) y Minos Securities A.V. (nº 333, del grupo
   Prosegur). Ninguna publica una emisión abierta.
5. **MiCA (lista de proveedores de servicios de criptoactivos de la CNMV).**
   Las españolas son, entre otras, Bitcoinforme (Bit2Me), Criptan, Minos Global,
   Prosegur Custodia, Renta 4, BBVA, CaixaBank y Cecabank. No encontré ningún
   token de oro u otro activo real distinto del de Prosegur, que ya está
   publicado.
6. **Fondos tokenizados españoles.** Azvalor Blockchain FI y el fondo token de
   BBVA AM solo se ofrecen a listas cerradas o a empleados (según prensa y la
   propia BBVA). No están abiertos.
7. **Advertencias de la CNMV** («no autorizadas»), por nombre exacto. Antes
   validé el buscador con «Gemini», que sí devuelve dos advertidas. Bit2Me,
   Valorix, Activos y Valores Digitales, Credimax, Rapicredit, Beself, Beself
   Brands, Betoken y Token City dan **sin coincidencias**.

## Expedientes

| Slug | Decisión | Motivo |
|---|---|---|
| `bit2me-stx-bono-valorix` | **no_admitir** | Hoy no hay oferta. La entidad está autorizada: Bit2Me STX es agencia de valores nº 343 y opera un sistema de negociación y liquidación con TRD inscrito en la CNMV. Su primera emisión es un bono de Valorix de 1 M€, previsto para **diciembre de 2026** y «dirigido a inversores elegibles», sin definir quiénes (nota de prensa del 28/10/2026). No hay documento de emisión, mínimo, cupón, vencimiento ni comisiones. La página de STX sigue mostrando las condiciones del sandbox de 2024 (mínimo de 1.000 €), que no valen para esta emisión. |
| `beself-brands-betoken` | **no_admitir** | Son acciones tokenizadas de una empresa de comercio electrónico, inscritas a través de Ursus-3. Según su documento de oferta (28/03/2025), las fases de venta terminaron en **septiembre de 2025**, el mínimo era de 100 € y el precio de 2,60–2,75 € por token. **No hay mercado secundario.** No tiene folleto aprobado; el documento lo valida una EAF (nº 147, inscrita). betoken.io y beselfbrands.com no responden hoy (conexión reiniciada y error 522). |

Ninguna lleva `propuestaTarjeta` porque no se admiten.

## Pistas para otro ciclo

- **Bit2Me STX · bono de Valorix (diciembre de 2026).** Es la mejor pista
  española. Hay que revisarlo cuando se publique el documento de emisión. Si
  admite a particulares residentes en España, podría entrar en «en camino» o en
  principales.
- **Hausera (para su grupo).** Hay 8 emisiones de obligaciones con TRD inscritas
  en la CNMV vía Ursus-3. Las cotizadas se negocian en **Portfolio Stock
  Exchange**, un SMN autorizado por la CNMV (European Digital Securities Exchange,
  S.V., nº 314). Según su portada, admite minoristas directamente; no dice que
  use DLT.
- **Reental (para su grupo).** Reental Tourist Homes, S.A.U. emitió
  obligaciones con TRD de 322.500 €, inscritas por la CNMV el 19/12/2025.
- **Token City.** Su bolsa regulada figura como «Próximamente». Su
  *marketplace* lista emisores en «mercados privados»: Hispania Defense
  Solutions, Arca Habitatum, Tokenix, Valorix, Dianelum, un token de oro
  («globalgold»), pistas de pádel y otros. Varios tienen la emisión inscrita en
  la ERIR, pero los vende el propio emisor, sin una entidad supervisada que los
  coloque. Con nuestro criterio no se admiten.
- **Securitize Europe (SV nº 327).** Según la prensa, solo atiende a clientes
  profesionales. No lo comprobé en el programa de actividades de la CNMV, que
  está en una pestaña que no cargó.
- **Minos Securities A.V. (nº 333).** Puede colocar y tokenizar valores, pero no
  publica emisiones. Conviene vigilarla porque es del grupo Prosegur.
- **Archax Markets Europe, S.V. (nº 289).** Gestiona el SMN Dowgate en España.
  Es institucional y no la estudié.
- **PSFP europeas con pasaporte a España (50 en la lista de la CNMV).** Habría
  que mirar si alguna emite tokens (Bergfürst, Conda, Inrento…). Encaja mejor en
  el grupo nuevas-europa.
- **Emisores con la plataforma sin identificar**: Proptech SPV (3 emisiones),
  FDX001/FDX002, 7 Islas Tok y Rona Habitat.

## Bloqueos y límites

- No consulté la pestaña de advertencias «otras entidades» de la CNMV: la
  consulta devolvió una página de error. Tampoco consulté el registro de ESMA.
- stx.bit2me.com es una aplicación que exige registro; no entré.
- El PDF de Beself contiene los DNI de los fundadores. No lo conservo: guardo el
  texto con esos datos y la dirección del contrato suprimidos, y el sha256 del
  original.
- Escáner de secretos: revisé todas mis copias buscando `token=`, `access=`,
  `signature=`, `key=` y `X-Amz-`. Solo apareció uno: la portada de eCrowd
  incrusta un mapa de Google con un parámetro `key=`. La moví a
  `fuentes/crudo/psfp-home/`, que no entra en Git, y lo anoté en el inventario.
  Ningún `.txt`, `.json` ni `.md` del grupo contiene esos parámetros.

## Incidencia de proceso

El directorio temporal (*scratchpad*) es compartido con otros grupos. Al
principio, otro agente sobrescribió mi script de descarga en la misma ruta. Por
eso dos descargas de la CNMV cayeron un momento en la raíz del repositorio
(`/home/user/RWADAR/cnmv-erir-ursus3.html` y `cnmv-psfp-listado.html`) y
añadieron dos líneas al inventario temporal de otro agente. Moví los dos
archivos a mi carpeta, borré solo esas dos líneas mías y desde entonces uso
scripts en una subcarpeta propia (`scratchpad/nuevas-espana/`).
