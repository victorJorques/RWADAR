# Revisión independiente de contenido · entrega 2026-11-10 (solo lectura)

**Veredicto: `aprobado_con_cambios`.** Lo que va en el SQL está bien y se puede
aplicar tal cual: cada cambio de `DECISIONES-COORDINADOR.md` está aplicado con
su texto, su fuente y sus fechas, y no cambia nada más (salvo una característica
de Hausera que hacía falta tocar y que confirmo, §3). Las cifras que abrí yo hoy
en la fuente primaria coinciden con lo publicado. Hay **tres correcciones
obligatorias que no tocan el SQL**: las tres van en `despues-de-aplicar.mjs`
(es decir, en `transparencia.json`, lo que pinta la tarjeta y «Lo esencial» de
la web y de la app). Ver §7.

- Revisión `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`, sobre la publicada
  `88d5a757-3481-f70e-dc7c-6272704a00b3` (entrega 2026-11-05.2).
- **SHA-256 de `aplicar-y-aprobar.sql`: `60feef2cf10d648d01e9b7acef1811f2416522eaab419194a1b411d9bd05383a`**
  (lo comprobé a las 16:08:28 UTC; es el que dice el montador). `catalogo.sql`
  `b4c2bb7e…7379`, `revision.json` `2ddb1fef…3a68`, `escaparate-publicacion.json`
  `424be5af…dda8`, `documentacion-ofertas.json` `633ed15f…f127`.
- Revisor: Claude, 10/11/2026, de 15:48 a 16:15 UTC. No monté esta entrega. No
  he tocado Supabase, no he publicado, no he hecho commit. Solo he escrito este
  informe. Las copias de fuentes que bajé están en mi carpeta temporal, fuera de
  Git; el PDF de Alicante 3 (lleva nombres y DNI de personas) y las páginas de
  Hausera los borré nada más leerlos.

## 1. Qué hice

1. Comparé, ficha por ficha y campo por campo, `escaparate-publicacion.json` y
   `documentacion-ofertas.json` de la base (2026-11-05.2) con los de hoy. Las
   referencias, avisos y métricas las emparejé por su etiqueta o texto, no por
   posición.
2. Ejecuté `resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`)
   con las 22 ofertas nuevas (oferta + su documentación) a 10/11, 17/11 y 18/11,
   y le apliqué la misma regla que usan la web (`datosCortosOferta`) y la app
   (`rwadar-movil/lib/transparencia.js`, `datosCortosOferta`): el mínimo de la
   tarjeta sale de `minimoCorto` de `transparencia.json` y la salida de
   «Lo esencial», de `salidaCorta` o, si no hay, del texto largo recortado a 40
   caracteres.
3. Abrí hoy la fuente primaria de 14 datos publicados (§5).
4. Crucé cada aviso re-fechado al 10/11 con la comprobación del expediente de
   hoy, y cada referencia re-fechada con las fuentes que leyó ese expediente.
5. Busqué en `aplicar-y-aprobar.sql` los textos nuevos clave (aparecen) y los
   retirados (no aparecen).

## 2. DECISIONES, punto por punto

| Ficha | Lo que pide DECISIONES | Lo que hay en la entrega | Veredicto |
|---|---|---|---|
| Spiko Letras Euro | 2,39 % → 2,44 % (VL del 09/11, consulta 10/11); métrica, literal y referencia | Métrica «Rentabilidad publicada · 31 días · 09/11/2026: 2,44 %»; literal «…publicado por Spiko el 09/11/2026 (VL del 09/11/2026); consultado el 10/11/2026…»; referencia con `fechaDato` 09/11 y consulta 10/11 | correcto |
| Spiko Letras Dólar | 3,99 % → 4,09 % en USD; aviso del 10 % con «, aunque la web de Spiko diga que no hay límite de importe» | Igual; el añadido va antes del punto final: «…superan el 10 % del patrimonio, aunque la web de Spiko diga que no hay límite de importe.» | correcto |
| Spiko Smart Cash | 2,84 % con fecha nueva; quitar el aviso de GECO; «Supervisor» nuevo; «Aprobación del compartimento» con fuente GECO y consulta 10/11; acceso y aviso 2 igual | Todo así. Referencia «Autorizado por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en GECO y certificado de la AMF del 23/02/2026)», `fechaDato` 17/02/2026, fuente `geco.amf-france.org/produit-d-epargne/c124199` | correcto |
| Robinhood · Kraken · Prosegur | Solo fechas | Solo fechas (y el texto de alcance «Comprobado de nuevo en la fuente el 10/11/2026») | correcto |
| mTBILL | «Valor por token · 09/11/2026: 1,0776 USD (oráculo del emisor)»; nada más; sin «lista blanca» | Así; ningún texto dice «lista blanca», «greenlist» ni «whitelist» | correcto |
| Aktionariat | Fechas 10/11 en precio, «Supervisor» y aviso de vendedores | Así | correcto |
| Boss Info | Resumen y descripción con la operación del 05/11 y la moneda; referencia nueva «Última operación · 10/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)»; quitar las tres del cruce de 6,70; aviso con «(venta más barata 8,40 ZCHF el 10/11/2026)»; mínimo y «Supervisor» al 10/11 | Todo así. El resumen añade «nadie le compra desde el 29/06/2026», que está en el resumen del expediente y el revisor del grupo dio por bueno («El resumen nuevo es correcto»); lo comprobé yo también (§5) | correcto |
| Switzerlend | Fechas 10/11 en los dos avisos, en el mínimo («1 acción (68,01 CHF el 10/11)») y en «Supervisor» | En el SQL, así. **En la tarjeta, no** (sigue «05/11»): corrección C1 | corregir fuera del SQL |
| Brickwise (11) | Mínimo «Desde X € la participación en reventa (10/11)» con la tabla; mejor compra Drautal 60, Randhartinger 46, Hinterstoder 20, Greenpoint 84; resto con fecha nueva | Las 11 cifras de la tabla y las 4 de mejor compra, exactas; venta más barata, participaciones en venta y mejor compra re-creadas al 10/11 | correcto |
| Hausera | Resumen y métricas de Alicante 3; mínimo, acceso y salida de la tarjeta (salida corregida por el revisor); seis avisos; fuera las tres rentabilidades de octubre; historial 42/24/128 M€; no publicar el mínimo de emisión (50 %/70 %) | Todo así; ningún «%» en sus textos, `rentabilidad` y `precio` vacíos | correcto (con C2 y C3 fuera del SQL) |

En el SQL están, una vez cada uno, «2,44 %», «4,09 %», «1,0776 USD (oráculo del
emisor)», «Desde 68,80 € la participación en reventa (10/11)», «aunque la web de
Spiko diga que no hay límite de importe», «venta más barata 8,40 ZCHF el
10/11/2026», «8,40 ZCHF (1 acción, 05/11/2026)», «1 acción (68,01 CHF el 10/11)»
y la salida corregida de Hausera. No están «El enlace de la web de Spiko
para…», «(para Alicante 2, no publicada)» ni «Rentabilidad anualizada
anunciada».

## 3. Lo que cambia y no nombra DECISIONES

- **Hausera, característica «Emisor»** (lo pide confirmar el montador). Decía
  «SPV del Grupo Hausera identificada en cada documento de emisión (para
  Alicante 2, no publicada)», que hoy es falso. Ahora: «Una sociedad por
  operación, identificada en su documento de emisión; la de Alicante 3 es
  HAUSERA PROPERTY MANAGER SPV 11, S.A». Sale del campo `emisor` del
  expediente y lo respalda el documento (portada: «Emisor HAUSERA PROPERTY
  MANAGER SPV 11, S.A»). **Confirmado**, y además hace falta: la vista pública
  tapa las métricas de las fichas que no están «actual», así que esta
  característica es lo único donde el visitante ve el emisor que decidió
  DECISIONES.
- **Texto de «alcance» de las referencias re-fechadas**: pasa a «Comprobado de
  nuevo en la fuente el 10/11/2026. …». En las 22 fichas, la fuente de cada
  referencia re-fechada aparece entre lo que leyó hoy su expediente. Correcto.
- **Plataformas y radar**: solo cambian fechas (25 `verificadoEl` y las
  consultas de sus fuentes; 69 consultas del radar) y el texto de origen de la
  revisión del radar. Ninguna dirección ni texto de plataforma.
- Los campos fijos de las 22 ofertas (título, colección, estado, país, URL,
  imagen, etc.) son iguales; mismas 22 y en el mismo orden.

## 4. Lo que enseñará la tarjeta (web y app) y «Lo esencial»

Calculado con `resumenOferta` a 10/11 y la regla de la web y de la app. «Antes»
es con el `transparencia.json` de hoy; «después», tras `despues-de-aplicar.mjs`.

| Oferta | Tarjeta antes | Tarjeta después | Comentario |
|---|---|---|---|
| Spiko Euro · Smart Cash · Robinhood · Kraken | Mínimo 1 € · España Sí | igual | |
| Spiko Dólar | Mínimo 1 USD · España Sí | igual | |
| Prosegur | Mínimo 1 gramo de oro · España Sí | igual | |
| Aktionariat | Mínimo 500 CHF · España Sí | igual | |
| mTBILL | Mínimo Sin mínimo vigente en euros · España Sin confirmar | igual | fuentes en conflicto, como hoy |
| Boss Info | Mínimo 100 CHF · España Sí | igual | |
| Switzerlend | Mínimo 1 acción (68,01 CHF, 05/11) · España Sí | **igual (05/11)** | la ficha dirá «el 10/11»: C1 |
| Brickwise (11) | Desde N € la participación (05/11) · España Sin confirmar | Desde N € la participación (10/11): Hinterstoder 75, Schwarzer Weg 65, Stallhofstraße 68,80; las otras ocho, el mismo precio que el 05/11 | correcto; ninguno pasa de 40 caracteres |
| Hausera | Mínimo 100 € según la FAQ de Hausera · España Sin confirmar | Mínimo Desde 100 € en Alicante 3 (10/11) · España Sin confirmar | ver R1 |

- **Vigencia:** las 22 siguen vigentes el 17/11 (23:00 UTC); el 18/11 (00:30
  UTC) las 22 quedan caducadas y se ocultan sus cifras.
- **Datos de la tarjeta** (etiquetas fijas «Mínimo de inversión», «Acceso desde
  España», «Salida», «Reembolso»): el más largo tiene 119 caracteres; los nuevos
  de Hausera, 92, 116 y 115. Ningún mínimo dice «por participación», «por token»
  ni «por acción». Reventa y próximas: `rentabilidad` y `precio` vacíos en las 14.
- **«Lo esencial» de Hausera:** la fila «Salida» no tiene texto corto propio
  (`salidaCorta: null`), así que la web y la app recortan el texto largo a 40
  caracteres. Lo ejecuté con la función de la web (`textoCortoLocal`): sale
  **«Cobras cuando se venden las viviendas…»**, sin «sin fecha cierta» ni «sin
  mercado secundario garantizado», que es justo lo que corrigió el revisor del
  grupo. Corrección C3.
- **«España» de Hausera:** su referencia nueva lleva «no está registrada»;
  `resumenOferta` no la lee ni como sí ni como no y la tarjeta y «Lo esencial»
  dicen «Sin confirmar». Es prudente para una oferta que aún no abre. Ver R1.

## 5. Fuentes primarias que abrí yo (10/11/2026, UTC)

| Cifra publicada | Fuente | Lo que leí | Hora |
|---|---|---|---|
| Spiko Euro 2,44 % (VL 09/11) | `https://public-api.spiko.io/v0/share-classes/EUTBL/yield` y `…/net-asset-values/EUTBL/latest` | `"monthlyYield":"0.0244"`, `updatedAt 2026-11-09T16:23:58Z`; VL `1.062624` EUR del `2026-11-09`. Mi cálculo de 1,060378 € (08/10) a 1,062624 € (09/11), compuesto en 32 días: 2,443 % | 15:55:14 |
| Spiko Dólar 4,09 % (VL 09/11) | `…/share-classes/USTBL/yield` y `…/net-asset-values/USTBL/latest` | `"monthlyYield":"0.0409"`, `updatedAt 2026-11-09T16:23:50Z`; VL `1.102439` USD del `2026-11-09`. De 1,098694 $ (09/10), 31 días: 4,088 % | 15:55:15 |
| Spiko Smart Cash 2,84 % (VL 09/11) | `…/share-classes/eurSAFO/yield` y `…/net-asset-values/eurSAFO/latest` | `"monthlyYield":"0.0284"`; VL `1.016874` EUR del `2026-11-09` | 15:55:15–22 |
| Aviso nuevo de Spiko Dólar | `https://www.spiko.io/es/spiko-letras-del-tesoro-dollar` | «4,09% Rendimiento neto actual» y «…cualquier solicitud de reembolso, sin preaviso y sin límite de importe» | 16:04:44 |
| mTBILL 1,0776 USD (09/11) | Oráculo `0x056339C044055819E8Db84E71f5f2E1F536b2E5b` en Ethereum (`ethereum-rpc.publicnode.com` y `eth.drpc.org`, bloque 26.385.543) | `latestRoundData`: ronda 491, 1,07756597 USD, `updatedAt 2026-11-09T14:23:59Z`; a esa hora aún no había ronda del 10/11 | 15:55:36 |
| Smart Cash: «Supervisor» y aviso de GECO retirado | `https://geco.amf-france.org/back-office/funds/compartment/c124199` y `…/shares` | `"published":true`, `"numDernAuto":"SCV20260075"`, `"dateDernAuto":"2026-02-17"`, `"cmpStatutLib":"Vivant"`; clases: `[]` | 15:58:10 y 16:03:17 |
| Brickwise, las 11 tarjetas y sus referencias | `https://api.app.brickwise.at/api/v1/assets` y `/api/v2/assets` (SHA-256 `42be450f…` y `5360bc26…`) | Las 11 coinciden en venta más barata, cuántas a ese precio y fecha de la orden, participaciones en venta y mejor compra. Ej.: Hinterstoder 75 € × 5 (orden del 08/11), 265 en venta, mejor compra 20 € × 4 en 2 órdenes (la más antigua del 19/05/2025); Schwarzer Weg 65 € × 1 (09/11); Stallhofstraße 68,8 € × 1 (08/11); Drautal mejor compra 60 € (05/11); Randhartinger 46 € (09/11); Greenpoint 84 € (23/06/2026) | 15:55:43 |
| Boss Info: operación del 05/11 y venta más barata | `https://shares.bossinfo.com/api/secondarymarkets/getTrades` y `…/getOrderBook` (POST, `company` 1664) | Última: `2026-11-05T13:35:35Z`, 1 acción, 8,4, `SECONDARY`; la anterior, 28/09, 474 a 6,7. Venta: 8,40 × 103; compra: 7,30 × 1.000 | 15:56:17 |
| Boss Info: «nadie le compra desde el 29/06/2026» y mínimo | Mismo `getTrades` (`limit` 400) y `…/api/brokerbotsettings?ticker=BOSS` | Última `PRIMARY`: `2026-06-29T10:53:35Z`, 183 acciones; mínimos 100 (transferencia) y 9 (cripto); recompra: «Ankauf … aufgrund eines Wartungsfensters deaktiviert» | 16:03:38–16:04:29 |
| Switzerlend: precio, recompra y vendedores | Contrato de venta `0x8d90319fe817fe9e23973fcab9f1ff0f1e0d9b65` en Ethereum y `https://shares.lend.ch/api/secondarymarkets/getOrderBook` | `getPrice()` 68,0105; `settings()` 5; 0,031766 ZCHF en el contrato; venta más barata 67,00 × 15 | 15:56:17–46 |
| Aktionariat: vendedores a 6,20 | `https://shares.aktionariat.com/api/secondarymarkets/getOrderBook` (`company` 77) | Venta más barata 6,20 × 356; mejor compra 6,10 | 16:03:38 |
| Hausera: documento de Alicante 3 | `https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_` | Se abre sin sesión («Whitepaper - Alicante 3.pdf»); SHA-256 `9170562a…` igual al del expediente. «Ticket mínimo: 100,00 euros»; «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»; «duración estimada de veinte (20) meses, sin constituir obligación de vencimiento en fecha cierta»; «pueden no tener un mercado secundario»; «no es considerado un folleto informativo ni ha sido revisado…»; ERIR «Ursus-3 Capital AV, S.A (nº Registro 251)»; «14 viviendas … La Zenia (Orihuela Costa)» | 15:56:54 |
| Hausera: preventa 18/11, Alicante 2 cubierta | `https://hausera.io/page-data/propiedad/alicante_3/page-data.json` | Alicante_3: `status COMMINGSOON`, `presaleDate 18/11/2026`, `launchDate 25/11/2026`, `feesPlatform 0`. Alicante_2: `PRESALE_CLOSED`, `launchDate 11/11/2026` | 15:57:38 |
| Hausera: historial | `https://hausera.io/` | «42 operaciones realizadas 24 operaciones terminadas … 128M€ total financiado» | 15:57:17 |
| Hausera: «no inscrita el 10/11» | `https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es` | Emisiones inscritas de Ursus-3: SPV 2 a SPV 8. La SPV 11 (Alicante 3) no aparece | 15:57:51 |

Nota sin consecuencias: Spiko llama a su cifra «de los últimos 31 días», pero
entre los dos VL del Euro que cita la referencia hay 32 días. Con 32 días sale
2,443 %, la cifra de Spiko; no hay que cambiar nada.

## 6. Avisos con fecha

- Los avisos re-fechados al 10/11 tienen todos su comprobación de hoy en el
  expediente (`revisionAvisos` o `avisosConFecha`: «vigente», «sigue_vigente»,
  «cambia» o «nuevo»; los que llevan hora, entre 09:01 y 09:18 UTC). **No hay
  ningún aviso re-fechado sin comprobar.**
- Retirados con motivo: el de GECO de Smart Cash (`ya_no_aplica`; lo confirmé en
  GECO) y el de la reserva de Hausera del 05/11 (sustituido, como dice
  DECISIONES).
- No entra el aviso propuesto «Nadie ha comprado al emisor desde el 29/06/2026»
  de Boss Info: no está en DECISIONES y el dato ya va en el resumen. Correcto.
- Los avisos nuevos (Spiko Dólar, Boss Info y los tres de Hausera) están en
  castellano llano, con fecha DD/MM cuando la llevan, y sin promesas.

## 7. Correcciones obligatorias (ninguna cambia el SQL)

Las tres van en `despues-de-aplicar.mjs`. Después hay que repetir en la copia
aparte el ensayo de `despues-de-aplicar.mjs`, `transparencia.mjs`,
`rwadar-fichas.js` y `npm test`. El SHA-256 del SQL no cambia.

### C1 · Switzerlend: el mínimo de la tarjeta con la fecha de hoy

DECISIONES pasa el mínimo de Switzerlend a «1 acción (68,01 CHF el 10/11)». La
tarjeta y «Lo esencial» de la web y de la app no enseñan ese texto, sino
`minimoCorto` de `transparencia.json`, que seguiría en «1 acción (68,01 CHF,
05/11)». La ficha diría 10/11 y la tarjeta 05/11. Hoy el precio es el mismo
(`getPrice()` 68,0105 a las 15:56:46 UTC). Añadir, junto a los mínimos de
Brickwise y Hausera:

```js
assert.equal(tarjeta('switzerlend', 'Mínimo de inversión'), '1 acción (68,01 CHF el 10/11)');
assert.ok(['1 acción (68,01 CHF, 05/11)', '1 acción (68,01 CHF, 10/11)'].includes(t.ofertas.switzerlend.minimoCorto), 'Switzerlend: mínimo corto de partida');
t.ofertas.switzerlend.minimoCorto = '1 acción (68,01 CHF, 10/11)';
```

### C2 · Hausera: la comprobación «documentoEspana» dice algo que ya no es cierto

Hoy dice «Alicante 2 no tiene documento de emisión público: su ficha pide
iniciar sesión y no hay folleto ni ficha informativa», con la fuente «Hausera ·
ficha de Alicante 2 (redirige al inicio de sesión)». La web y la app la enseñan
en la ficha de Hausera, con su motivo y su fuente. Desde hoy es falsa: el
documento se abre sin sesión (15:56:54 UTC) y la propia ficha cita el de
Alicante 3. Dejarla con la fecha del 05/11 no la arregla. El resultado («no
cumple») sigue siendo correcto. Sustituir la comprobación entera:

```js
t.ofertas['hausera-proximas-ofertas'].documentoEspana = {
  cumple: false,
  motivo: 'El documento de emisión de Alicante 3 es público, pero no es un folleto ni lo ha revisado la CNMV.',
  fuente: {
    titulo: 'Hausera · documento de emisión de Alicante 3 (portada: «no es considerado un folleto informativo»)',
    url: 'https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_',
  },
  consultadaEl: '2026-11-10',
};
```

Y quitar la excepción `NO_REFECHAR['hausera-proximas-ofertas.documentoEspana']`
y su `assert.ok(fechas.some(f => f.sinRefechar …))`. El motivo es el aviso que
ya aprobó DECISIONES, dicho del documento, y lo respalda la portada del
documento (literal arriba). Tiene 98 caracteres (máximo 300) y el título, 98
(máximo 240).

### C3 · Hausera: la salida de «Lo esencial» pierde las cautelas

Sin `salidaCorta`, la web y la app recortan la salida decidida a «Cobras cuando
se venden las viviendas…». Se pierden «sin fecha cierta» y «sin mercado
secundario garantizado», justo lo que corrigió el revisor del grupo, y queda una
frase que suena a promesa. Añadir:

```js
assert.ok([null, 'Al vender las viviendas, sin fecha fija'].includes(t.ofertas['hausera-proximas-ofertas'].salidaCorta), 'Hausera: salida corta de partida');
t.ofertas['hausera-proximas-ofertas'].salidaCorta = 'Al vender las viviendas, sin fecha fija';
```

Tiene 39 caracteres (máximo 40). Lo respalda el documento de Alicante 3: la
devolución se hará «únicamente una vez se haya producido la venta efectiva del
inmueble» (2.3.7), con una duración de 20 meses «sin constituir obligación de
vencimiento en fecha cierta» (2.3.5).

## 8. Recomendadas (no bloquean)

- **R1 · España de Hausera.** La tarjeta y «Lo esencial» dirán «Sin
  confirmar», aunque la referencia dice que es una emisión española para
  particulares. Es prudente mientras no abra. Si el coordinador prefiere «Sí»,
  en otra entrega (cambia el SQL) hay que escribirlo sin «no» y con «admite»,
  por ejemplo: «Emisión española; admite particulares que el emisor considere
  idóneos. Hausera carece de registro en la CNMV.» (109 caracteres; lo probé
  con `resumenOferta` y da «Disponible desde España según la fuente»).
- **R2 · Kraken, texto de alcance contradictorio.** En sus tres datos de
  tarjeta dice «Comprobado de nuevo en la fuente el 10/11/2026. Página de xStocks
  de Kraken UE consultada el 03/11/2026.». Viene ya del 05/11. En la próxima
  entrega, quitar «consultada el 03/11/2026».
- **R3 · Kraken, la fecha de «documentoEspana» en `transparencia.json`.** El
  expediente sí volvió a bajar hoy las condiciones finales n.º 159 (09:16:32 UTC,
  mismo SHA-256). Pero la expresión de URLs de `despues-de-aplicar.mjs`
  (`/https:\/\/[^\s"'«»)<>,]+/g`) corta en el «)» de «(LITEx)» y no la reconoce.
  Así que se queda en 05/11, y la nota «el expediente no volvió a leer esa
  fuente» no es exacta para Kraken. Quedarse en 05/11 es más prudente, no falso.
  Si se quiere arreglar: admitir paréntesis en la URL y quitar solo un «)» final
  sin pareja.
- **R4 · Referencias «Último…» que ya no son las últimas.** Boss Info conserva
  «Último cruce documentado: 8,44 CHF» (dato del 29/08/2026), al lado de la
  nueva «Última operación · 10/11/2026». Aktionariat y Switzerlend tienen otras
  parecidas, y Aktionariat lleva «Último cruce publicado: 6,25 CHF» repetida.
  Todas llevan fecha. En una próxima entrega, quitarlas o rotularlas «Cruce del
  DD/MM/AAAA (histórico)».
- **R5 · Brickwise, «Próxima distribución esperada · 22/10/2026: 15/11/2026».**
  Está en seis fichas, algunas con aviso de alquiler terminado (p. ej.
  Plüddemanngasse: «alquiler que terminó el 31/07/2024»). Es de octubre y viene
  de antes, pero puede sugerir un cobro. Revisarla en el próximo ciclo.
- **R6 · Ilustración de Hausera.** Sus pasos dicen «Se reforma y se vende».
  Hausera describe así su modelo («compra, reforma y venta»), pero Alicante 3 es
  obra nueva (el documento dice que el edificio «se construirá»). La próxima vez
  que se regenere la imagen: «Se construye y se vende». Hoy no se tocan
  imágenes.
- **R7 · Texto de origen del radar.** Dice «la lista de la OCC, con curl» y
  «onboarding». Si se enseña al público, mejor «descargándola directamente» y
  «alta de clientes».
- **R8 · Comisiones de Hausera.** La métrica «Comisiones: Ninguna para el
  suscriptor; Hausera cobra con la plusvalía que supere el tope del inversor» no
  la verá nadie, porque la vista pública tapa las métricas de las fichas que no
  están «actual». Si se quiere que se vea, ponerla como característica en otra
  entrega.

## 9. Límites de esta revisión

- No ejecuté `npm test` ni el ensayo completo: mi revisión es de contenido. La
  tarjeta y «Lo esencial» los calculé con el código real de la web y de la app
  (`resumenOferta`, `textoCortoLocal` y la misma regla de `datosCortosOferta`),
  no en un navegador ni con capturas.
- No volví a abrir los documentos de Robinhood, Kraken y Prosegur (no cambian),
  ni el acuerdo de reserva ni el dossier de Alicante 3. Me fío del revisor del
  grupo en el respaldo del aviso de la reserva.
- Los datos personales de las copias de los grupos son tarea del coordinador
  antes del commit; no los revisé.
