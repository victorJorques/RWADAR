# Candidatas España · resumen (ciclo 10/11/2026)

Grupo: **candidatas-espana**. Busqué ofertas nuevas de activos reales
tokenizados de proveedores españoles que un particular residente en España
pueda comprar hoy, con una entidad supervisada por la CNMV o con un documento
de emisión público. No tengo fichas publicadas a mi cargo.

Todas las consultas son de hoy, 10/11/2026, entre las 09:01 y las 09:29 UTC.
Cada lectura está en `inventario-consultas.json`, con su URL, hora, código
HTTP, tamaño y sha256. No inicié sesión, no rellené formularios de alta y no
toqué wallets.

## En una frase

**Hoy no hay ninguna oferta española nueva que se pueda admitir.** He
encontrado tres ofertas o emisiones nuevas y las he documentado, pero ninguna
cumple lo esencial: dos se venden sin ninguna entidad registrada en la CNMV y
la tercera, la más seria, todavía no tiene documentos públicos.

## Lo nuevo de hoy en los registros de la CNMV

- **El índice ERIR ya no tiene solo a Ursus-3.** Hoy aparecen tres entidades
  que llevan el registro de valores tokenizados: Ursus-3 Capital, **Minos
  Securities** (grupo Prosegur) y **Token City European Exchange**. Las dos
  nuevas tienen una inscripción cada una, ambas del **06/11/2026**:
  - Minos Securities: «1ª Emisión de Pagarés Prosegur Cash 2026», pagarés
    tokenizados de **Prosegur Cash, S.A.** por **500.000 €**.
  - Token City: acciones tokenizadas de **Series A Grupo UAE, S.A.** por
    **60.000 €**. No encontré ninguna oferta pública ni ninguna web de esa
    sociedad. Por el importe, parece una operación pequeña y privada.
- **Ursus-3 sigue con las mismas 23 emisiones** que el 05/11. La última es del
  23/10/2026.
- **Bestinver Securities** sigue sin aparecer como ERIR, aunque una noticia de
  mayo dice que la CNMV la autorizó. Lo que vale es el registro.
- **Plataformas de financiación participativa (PSFP):** la lista es idéntica a
  la del 03/11 (27 plataformas). **Infraestructuras del régimen piloto:** igual
  que el 05/11 (Bit2Me STX y Securitize).
- **Proveedores de criptoactivos (MiCA), frente al 03/11:** entran ABANCA y
  Webull Securities (Europe) y sale «Digital Assets Limited Liability Company
  for Intermediation and Services». Son servicios de criptoactivos, no activos
  reales.
- **Advertencias de la CNMV:** consulté 24 nombres. **Ninguno está advertido.**
  Antes validé el buscador con «Gemini», que sí devuelve dos advertidas. Novedad
  útil para todos los grupos: la pestaña «otras entidades» (tipo=2) sigue dando
  error 400, pero la CNMV publica esa misma lista en PDF
  (`Advertencias_CNMV_Otras.pdf`). La he usado para comprobar cada nombre y la
  he validado con «Comunitae», que sí aparece.

## Expedientes

| Slug | Decisión | Qué hay hoy |
|---|---|---|
| `reental-rentas-4` | no_admitir | **Emisión nueva de Reental.** Se puso a la venta el 04/11 a las 18:00 UTC y hoy le quedan 11.853 de 20.000 tokens de 100 € (API pública). Es una LLC de Florida, Series RNT SPV-25, que presta todo lo captado a AURA Inmoinversión, S.L., una sociedad del propio grupo Reental, al 12 % fijo durante 36 meses para comprar, reformar y vender pisos en España. Es una **colocación privada** (Regulation S) para «inversores calificados». Su dosier dice que es «exclusivamente» para inversores profesionales, lo que choca con el mínimo de 100 €. Ninguna entidad que intervenga está registrada en la CNMV. Una EAF nacional solo firma un certificado de revisión del documento. Se rige por la ley de Florida y no tiene mercado secundario garantizado. |
| `prosegur-cash-pagares-tokenizados-2026` | no_admitir | **La novedad más seria:** es la primera deuda tokenizada de una cotizada española inscrita en la CNMV, con una agencia de valores (Minos Securities, nº 333) como registro. Pero ni Prosegur Cash (comunicaciones a la CNMV, la última del 16/06, y sala de prensa) ni Minos publican documento, plazo, interés, mínimo ni a quién se vende. No se puede comprar ni comprobar nada. **Vigilarla.** |
| `tokenix-toketuk-flota-cruceros-hito-1` | no_admitir | Tokenix (Tenerife) usa la tecnología de marca blanca de Token City. Hoy tiene abierta una campaña de Toketuk, S.A.U. para comprar tuk-tuks eléctricos en Las Palmas: 909 de 1.025 derechos vendidos, desde 200 €. El propio documento dice que **no es un valor**, que no lo revisa la CNMV, que no interviene ninguna entidad autorizada, que los derechos **no se pueden vender a otro** y que, al terminar el negocio en 2035, **no se devuelve lo aportado**. Anuncia un «retorno anual estimado» del 48 % («¡multiplicas tu inversión por 4!»). Hay que evitarla. |

Ninguno lleva propuesta de tarjeta. En `propuestaTarjeta.resumenTarjeta` dejo
los tres datos de hoy como referencia, con `null` donde no hay fuente.

## Pistas del encargo, una a una

- **Reental:** ver `reental-rentas-4`. La otra emisión abierta, **Miami 7**,
  sigue en venta privada con 4.563 tokens disponibles (8.948 el 01/11). Su
  rechazo del 01/11 sigue igual: es una LLC de Florida, en colocación privada y
  sin entidad en la CNMV. «Reental» y «Rental Token» no aparecen en el buscador
  de registros de la CNMV. Ninguna emisión de Reental está marcada como ERIR en
  la API.
- **Urbanitae** (PSFP nº 4) y **Housers** (Crowpire, PSFP nº 13): sus webs no
  hablan de tokens. Hacen financiación participativa clásica.
- **Brickken:** solo pone la tecnología. Su lista de «tokenizaciones en vivo»
  incluye emisores españoles: Tendencia Total (Galicia), Doc Energy Skill
  (Tenerife), El Globo Experience (préstamo privado), Bosko, E-Brick Finance,
  TokenCrowd y Tokenix. Ninguna web cita a la CNMV ni a una entidad supervisada
  que coloque. Bosko anuncia un «retorno anual garantizado» y El Globo dice que
  el token es «instrumental» dentro de una «estructura privada».
- **Bit2Me STX:** sigue con una sola emisión anunciada, el bono de Valorix (lo
  revisa otro grupo). La página de aterrizaje dice lo mismo que el 05/11. Según
  la prensa, las acciones llegarán en 2027. En el buscador de la CNMV aparece
  también «BIT2ME STOCKS, S.L.U.», que encaja con su producto de acciones
  tradicionales, no tokenizadas.
- **Token City:** su bolsa sigue mostrando solo CANDO1, «en estudio» (lo revisa
  otro grupo). Su ERIR tiene inscrita la emisión de Series A Grupo UAE, pero no
  la de CANDO1 ni la de Casa de Outeiro.
- **Casa de Outeiro (Alius), retirada el 05/11:** la campaña sigue con fecha de
  fin 31/10/2026 y sin prórroga en la API. Tiene **1.123.000 €** (2.000 € más que
  el 05/11) frente a un mínimo de 2.000.000 €. Las pestañas tienen el mismo
  sha256 que el 05/11. Ha entrado dinero después del 31/10, pero la plataforma
  sigue sin publicar la prórroga y la emisión no está inscrita en la ERIR de
  Token City. **No la vuelvo a proponer.**
- **Criptan:** su página en español da 404 y no encontré ningún activo real
  tokenizado.
- **Onyze:** da a Ursus-3 la tecnología de registro y custodia. No vende
  emisiones.
- **BeToken:** igual que el 05/11. El GitBook tiene el mismo sha256,
  betoken.io corta la conexión y beselfbrands.com da error 522.
- **Mintable:** es una plataforma de NFT que está cerrando. Fuera de alcance.
- **Vottun:** consultora de IA y blockchain, sin ofertas.
- **Bancos y gestoras:**
  - BBVA AM distribuirá la clase tokenizada del fondo Hamilton Lane Global
    Private Assets, pero BBVA dice que es «para carteras institucionales».
  - El fondo tokenizado de BBVA en el sandbox es solo para empleados (según la
    prensa).
  - **Azvalor Blockchain, FI** está inscrito en la CNMV (nº 5982, 03/10/2025,
    depositario BNP Paribas), pero su ficha no tiene folleto ni datos
    fundamentales y la web de Azvalor no lo menciona: no se comercializa en
    público.
  - Santander, Bankinter, Renta 4, Inversis, Cecabank y Allfunds: no encontré
    ninguna emisión tokenizada abierta a particulares.
- **Otras emisiones de la ERIR de Ursus-3 sin plataforma conocida** (Proptech
  SPV, FDX001/FDX002, Rona Habitat, Arca Habitatum): no encontré ninguna web
  pública. Sí identifiqué **7 Islas Tok**: la vendió Tokenix y está cerrada.

## Bloqueos

- Documentos de los pagarés tokenizados de Prosegur Cash: no publicados.
- La ficha de Rentas 4 está marcada como venta «PRIVATE». Sin iniciar sesión no
  se puede ver quién puede comprarla. Su Operating Agreement no es público.
- minossecurities.com corta la conexión y da 502. La web vigente es
  minos-securities.com, que sí se lee. openbrick.es (BME) da 502 en el proxy.
- La pestaña «otras entidades» del buscador de advertencias de la CNMV da
  error 400. Se sustituyó por la lista oficial en PDF.
- WebSearch y WebFetch solo se usaron para descubrir pistas (noticias de BBVA,
  Bit2Me, Bestinver y Prosegur). Cada afirmación de los expedientes sale de
  fuente primaria.

## Datos personales

- Los documentos de Reental y de Toketuk y algunas páginas contienen nombres de
  personas, y la firma del certificado de Rentas 4 incluye un DNI.
- Los originales HTML y PDF están en `fuentes/crudo/originales/`, fuera de Git.
  El PDF del certificado está borrado.
- En `fuentes/` solo quedan textos con los nombres y el DNI cambiados por
  «[nombre recortado]» y «[DNI recortado]». También quité la dirección del
  contrato de Toketuk.
- Revisé las copias buscando `token=`, `X-Amz`, `signature=` y `key=`: no hay
  ninguna fuera de `crudo/`.
