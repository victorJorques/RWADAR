# Revisión independiente de cumplimiento · entrega 2026-11-10

Revisión de cumplimiento normativo (MiFID II, MiCA, Reglamento de Folletos
(UE) 2017/1129, Reglamento (UE) 2020/1503 de financiación participativa,
régimen piloto DLT y Circular 2/2020 de la CNMV). No monté esta entrega. Solo
lectura: no toqué Supabase ni ningún servicio remoto (solo páginas públicas,
con GET) y no edité nada más que este archivo. 10/11/2026, de 16:05 a 16:40 UTC.

**Veredicto: `aprobado_con_cambios`.** El SQL se puede aplicar tal cual.
Ningún texto nuevo promete rentabilidad, garantía ni liquidez. Las tres
rentabilidades llevan base, fecha y «no garantizado». Cada acceso desde España
se apoya en una fuente que lo dice o sale como «sin confirmar». Ninguna entidad
con cambios tiene advertencias de la CNMV. El botón «Ver oferta en X» solo
sale donde la regla del sitio lo permite.

Hay **tres correcciones obligatorias, y ninguna cambia el SQL**: dos en
`despues-de-aplicar.mjs` (Hausera) y una sobre lo que irá a Git. El SHA-256 de
`aplicar-y-aprobar.sql` sigue siendo
`60feef2cf10d648d01e9b7acef1811f2416522eaab419194a1b411d9bd05383a` (16:37:16 UTC).

Coincido con C2 y C3 de `REVISION-ENTREGA-contenido.md` y con las n.º 2 y 3 de
`REVISION-ENTREGA-sql.md`. Desde cumplimiento las amplío (O2 y O3).

## 1. Qué hice

- Leí `DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md` y los 95 cambios de
  `contraste-2026-11-10.json`. También leí `escaparate-publicacion.json` y
  `documentacion-ofertas.json` nuevos, y los expedientes de las fichas que
  cambian (las tres de Spiko, Kraken, Boss Info y Hausera).
- Leí las revisiones `espana-proximas.md` y `suiza.md`, `transparencia.json` y
  `despues-de-aplicar.mjs`.
- Leí la regla del botón en tres sitios: `rwadar-fichas.js`,
  `rwadar-site/assets/rwadar-20260820.js` y `rwadar-movil/componentes/Ofertas.js`.
  También el punto 5.3 de `docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`.
- Calculé con el código real (`rwadar-movil/lib/ficha-editorial.js`,
  `resumenOferta`) el acceso, el botón y los datos cortos de las 22 fichas. Usé
  los datos nuevos y los «cumple» de `transparencia.json`, que
  `despues-de-aplicar.mjs` no cambia. Los scripts están en mi carpeta temporal,
  no en el repositorio.
- Hice mis propias consultas hoy:
  - buscador de advertencias de la CNMV (17 búsquedas y 2 controles);
  - registro ERIR de Ursus-3;
  - registro de IIC extranjeras de la CNMV (Spiko SICAV);
  - base GECO de la AMF (compartimento c124199);
  - fichas públicas de Alicante 2 y 3 en hausera.io.
- Busqué nombres de personas en tres sitios:
  - el SQL y los datos que lo forman;
  - lo que ya está en Git de esta carpeta;
  - los 792 archivos de `expedientes/`, `grupos/` y `revision-independiente/`
    que irán a Git (los que dejan pasar sus `.gitignore`).

## 2. Ficha por ficha

### Spiko Letras del Tesoro Euro y Dólar

- **Rentabilidad: cumple.** 2,44 % y 4,09 % «neto anualizado de los últimos 31
  días publicado por Spiko … (VL del 09/11/2026); consultado el 10/11/2026 …
  Variable y no garantizado». El Dólar añade «No incluye la variación del euro
  frente al dólar». Es la cifra que publica Spiko: `monthlyYield` 0.0244 y
  0.0409 en su API, según el expediente (09:01 UTC). Lleva base, fecha y no
  garantía.
- **Avisos:** capital no garantizado y límite de reembolso del 10 %; en el Dólar,
  también el riesgo de cambio. El añadido del Dólar («…aunque la web de Spiko
  diga que no hay límite de importe») mejora la ficha: enseña la contradicción
  entre la publicidad del proveedor y el folleto.
- **Acceso: cumple.** «Disponible para residentes en España…». Se apoya en la
  tabla de países de Spiko (`docs.spiko.io/documentation/product_overview/fund_availability`)
  y en el pasaporte de Spiko Finance (CNMV n.º 5325).
- **Botón:** «Ver oferta en Spiko».

### Spiko Smart Cash Euro

- **Cambios, correctos.** Sale el aviso de GECO y cambian la métrica
  «Supervisor», la descripción y la referencia «Aprobación del compartimento»,
  con la fuente de GECO. Lo comprobé en la API pública de GECO
  (`https://geco.amf-france.org/back-office/funds/compartment/c124199`,
  **16:32:52 UTC**): «cmpNom SPIKO AMUNDI OVERNIGHT SWAP FUND · cmpStatutLib
  Vivant · typeDernAutoLib Agrément · dateDernAuto 2026-02-17 · sharesIsins []».
  El aviso que sale ya no era cierto. La métrica nueva dice lo que hay: «aún sin
  clases de acciones ni valor liquidativo».
- **Rentabilidad: cumple el criterio.** 2,84 % con su base («lo que creció el
  fondo en su último día de cálculo, pasado a un año»), su fecha (VL del 09/11,
  consulta del 10/11) y «no es un tipo fijo ni está garantizado». Es una cifra
  de un solo día (ver R6).
- **Acceso: cumple la letra del criterio** («condiciones con lista de países»).
  Dice «Disponible para particulares residentes en España **según Spiko**…»,
  con la tabla de países de Spiko («🇪🇸 Spain ✅ (Smart Cash)», actualizada el
  23/10/2026). Está atribuido al emisor, y el aviso 2 dice que ningún registro
  lo confirma.
- **Un hecho que la ficha no dice y que refuerza ese aviso.** La CNMV inscribió SPIKO SICAV el
  **30/01/2026**, y la AMF autorizó este compartimento el **17/02/2026**
  (`https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es`,
  **16:33:14 UTC**: «Nº Registro oficial 2380 · Fecha registro oficial
  30/01/2026 · … IIC Sujeto a la directiva 2009/65/CE»).
  - Por su fecha, esa inscripción no puede incluir este fondo.
  - Cada compartimento que se vende en otro país necesita su notificación
    (art. 93 de la Directiva 2009/65/CE). Si Spiko lo notificó después, la CNMV
    no lo enseña.
- **Botón:** «Ver oferta en Spiko», porque la regla del sitio acepta la tabla
  del emisor. No lo bloqueo: cumple la regla escrita y el aviso es claro. Ver R1
  y R9.

### Robinhood, Kraken y Prosegur Digital Gold (solo cambian las fechas)

- **Robinhood:** el acceso se apoya en el pasaporte inscrito en la CNMV
  (n.º 5299). Botón: «Ver oferta en Robinhood Europe». Correcto.
- **Kraken:** botón «Ver oferta en Kraken (Payward Europe Digital Solutions)».
  - La regla escrita se cumple: el vendedor tiene licencia de CySEC, está
    inscrito en la CNMV (n.º 4474) y Kraken lo vende en la UE.
  - Pero el primer aviso de la propia ficha dice: «las condiciones finales del
    emisor solo ofrecen el producto en Liechtenstein y Suiza: el folleto no
    cubre su venta en España» (art. 3 del Reglamento de Folletos). Ver R1.
- **Prosegur Digital Gold:** en `transparencia.json` la entidad no consta
  supervisada, así que el botón dice «Ir a la web del proveedor (sales de
  RWAdar)». Correcto.

### mTBILL

- «Valor por token · 09/11/2026: 1,0776 USD (oráculo del emisor)»: está
  atribuido al emisor.
- Sigue en «fuentes en conflicto», con el aviso de que los límites de reembolso
  no coinciden.
- Ningún texto usa la lista blanca como prueba de acceso. Busqué «lista
  blanca», «whitelist» y «allowlist»: 0 resultados.
- Botón: «sales de RWAdar». Correcto.

### Aktionariat, Boss Info y Switzerlend

- **Aktionariat:** cambian las fechas y el aviso de vendedores (6,20 ZCHF frente
  a 7,25 CHF). Sus avisos ya dicen «Sin folleto ni KID … el emisor no está
  supervisado». Botón: «sales de RWAdar». Correcto.
- **Boss Info:** resumen y descripción nuevos («El emisor vende a 8,50 CHF, pero
  nadie le compra desde el 29/06/2026; la última operación fue entre
  accionistas, 1 acción a 8,40 ZCHF el 05/11/2026»), y un aviso con cifra y
  fecha.
  - Distingue CHF (precio del emisor) y ZCHF (reventa).
  - Lo de «nadie le compra» lo comprobó en cadena el revisor del grupo
    (`suiza.md` §1: la última compra al emisor fue el 29/06/2026).
  - No es promoción: es un dato de falta de liquidez. Correcto. Botón: «sales
    de RWAdar».
- **Switzerlend:** solo fechas. Correcto.
- **Observación (ya estaba así antes):** en Boss Info y Switzerlend, «sin
  folleto ni KID» y «emisor no supervisado» no están en los avisos. Solo están
  en dos sitios:
  - la métrica «Supervisor», que la vista pública tapa porque estas fichas no
    están «actual»;
  - la caja de transparencia («✗ No»).

  Ver R7.

### Brickwise (11 fichas de reventa)

- **Cumple.**
  - Mínimo: «Desde X € la participación en reventa (10/11)». Es el precio de
    reventa del día, con fecha, y nunca sale como precio de emisión.
  - Acceso: «Sin confirmar: … no consta que esta emisión se distribuya en
    España».
  - Avisos de posible pérdida total (riesgo 6 de 7 del KID) y de que solo hay
    reventa.
  - Botón: «sales de RWAdar».
- **Observación (ya estaba así antes):** seis fichas siguen enseñando en «Datos
  con su fecha» dos referencias: «Distribución anual esperada · 22/10/2026» y
  «Próxima distribución esperada · 22/10/2026: 15/11/2026». Una es
  Plüddemanngasse, aunque su aviso dice que el alquiler terminó el 31/07/2024.
  Ver R8.

### Hausera · próximas ofertas (en camino)

**Lo que comprobé yo:**

- `https://hausera.io/propiedad/alicante_2/` (16:32:25 UTC): «Alicante 2
  FINANCIADA … Inicio de oferta pública: 11/11/2026».
- `https://hausera.io/propiedad/alicante_3/` (16:32:26 UTC): «Alicante 3
  PRÓXIMA OPORTUNIDAD Preventa: 18/11/2026 09:00h … Inicio de oferta pública:
  25/11/2026».
  - La misma página anuncia «Rentabilidad anualizada: 13,20 %» y un «0,5% extra
    de rentabilidad» para quien invirtió en Alicante 2.
  - La ficha no copia ninguna de esas cifras, y su aviso dice «Las
    rentabilidades anunciadas son previsiones del promotor». Bien.
- Registro ERIR de Ursus-3
  (`https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es`,
  16:22:17 UTC):
  - las últimas inscripciones son de SPV 7 y SPV 8 (23/10/2026); SPV 11
    (Alicante 3) no aparece;
  - la página avisa: «no implica que la CNMV haya validado las condiciones de
    la emisión ni la información facilitada por el emisor».

  Por eso el aviso «El documento de emisión no es un folleto y la CNMV no lo ha
  revisado. El 10/11/2026 Alicante 3 aún no estaba inscrita…» es exacto.

**Lo que está bien:**

- Los avisos cubren los riesgos importantes:
  - pérdida («Puedes perder todo o parte del dinero»);
  - liquidez («no hay mercado secundario garantizado»);
  - sin folleto y sin revisión de la CNMV;
  - el dinero de la reserva lo usa el emisor antes de inscribir la emisión;
  - Hausera dice no ser una empresa de servicios de inversión.
- Botón: «Ir a la web del proveedor (sales de RWAdar)». Correcto.
- La característica «Emisor», fuera de la letra de DECISIONES, está bien desde
  cumplimiento: quita una contradicción y sale del documento de emisión.

**Lo que falla (se arregla sin tocar el SQL):**

- «Lo esencial» y la tarjeta recortan la salida a «Cobras cuando se venden las
  viviendas…» (40 caracteres; lo calculé con el código). Suena a promesa de
  cobro y pierde «sin fecha cierta» y «sin mercado secundario garantizado»
  (O1).
- La comprobación «documentoEspana» de `transparencia.json` dice algo que hoy
  es falso, y además habla de otra operación (O2).

**Lo que falta (cambiaría el SQL; no bloquea en esta ventana):**

- La contradicción del mínimo de la emisión no está en los avisos.
  - El documento de emisión, el acuerdo de reserva y la condición (r) de la
    escritura dicen 50 %. La condición (o) de la escritura dice 70 %.
  - Importa a quien reserva: su dinero solo vuelve «si la emisión no sale
    adelante», y que salga adelante depende de ese mínimo.
- Nadie puede reservar antes del 18/11, después del último día vigente (el
  17/11). Por eso no lo bloqueo. Lo cubro ya en O2 sin tocar el SQL y pido el
  aviso antes del 18/11 (R2).

**Acceso:**

- Dice «Emisión española para particulares que pasen el test de idoneidad del
  emisor; Hausera no está registrada en la CNMV.».
- La tarjeta enseña «Sin comprobar si se puede contratar desde España», porque
  el código no lo lee como «sí». Es prudente.
- Pero «test de idoneidad» es el nombre que da MiFID II (art. 25.2) a la
  evaluación que hace una empresa autorizada. Aquí es un cuestionario del propio
  emisor: el documento dice «considerarlo idóneo» (apartados 5.6 y 5.7). Ver R3.

## 3. Botón al proveedor (regla 5.3 del 06/11/2026)

La regla está igual en la web, en las fichas fijas y en la app: «Ver oferta en
X» solo si se cumplen las cuatro condiciones:

- la oferta es principal;
- `disponibleEs` es verdadero;
- el acceso desde España sale «sí», con fuente;
- `transparencia.json` dice «supervisada: Sí», con la misma fecha de
  verificación.

Si falta alguna, el botón dice «Ir a la web del proveedor (sales de RWAdar)».

Así queda después de aplicar y de ejecutar `despues-de-aplicar.mjs`:

| Ficha | Acceso desde España | Supervisada | Botón |
|---|---|---|---|
| Spiko Euro (Letras), Spiko Dólar, Spiko Smart Cash Euro | sí | Sí | Ver oferta en Spiko |
| Robinhood Classic Stock Tokens | sí | Sí | Ver oferta en Robinhood Europe |
| Kraken xStocks | sí | Sí | Ver oferta en Kraken (Payward Europe Digital Solutions) |
| Prosegur Digital Gold, Aktionariat | sí | No | Ir a la web del proveedor (sales de RWAdar) |
| mTBILL | sin comprobar | No | Ir a la web del proveedor (sales de RWAdar) |
| Boss Info, Switzerlend | sí (reventa) | No | Ir a la web del proveedor (sales de RWAdar) |
| Las 11 de Brickwise | sin comprobar | No | Ir a la web del proveedor (sales de RWAdar) |
| Hausera | sin comprobar | No | Ir a la web del proveedor (sales de RWAdar) |

- Es lo mismo que está publicado hoy (lo miré en `rwadar-site/ofertas/*.html`).
- Ninguna ficha de reventa enseña «Abrir mercado»: ninguna tiene `urlMercado` en
  el catálogo sincronizado.
- Entre que se aplica el SQL y se publican la web y la OTA, la web y la app no
  encuentran la transparencia del 10/11. Entonces ponen «sales de RWAdar» en
  todas (fallan cerrado). Bien.

## 4. Advertencias de la CNMV (búsqueda propia, 10/11/2026)

Buscador: `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=<nombre>`.

- **Controles positivos:**
  - «Trading» (16:20:50 UTC): «Página 1 de 16», y la primera advertencia es del
    10/11/2026;
  - «Gemini» (16:21:56 UTC): dos entidades.

  El buscador funciona y está al día.
- **Sin resultados («No hay datos disponibles»)**, hora UTC entre paréntesis:
  - Hausera (16:21:06), HOLDTX (16:21:09) y «Property Manager», el nombre de
    las sociedades de Hausera (16:21:11);
  - Ursus (16:21:14), Spiko (16:21:17), Twenty First (16:21:51) y Amundi
    (16:21:54);
  - Boss Info (16:21:20), Switzerlend (16:21:23) y Aktionariat (16:21:25);
  - Brickwise (16:21:28) y Midas (16:21:30);
  - Kraken (16:21:39), Payward (16:21:42) y Backed (16:21:49);
  - Robinhood (16:21:44) y Prosegur (16:21:46).

No aparecer en el buscador no significa estar autorizado.

## 5. Datos personales

- **SQL y datos que van en él:** no hay nombres de personas, correos ni
  teléfonos. Tampoco en el escaparate, la documentación, el contraste, la
  lectura pública, el radar ni los informes de esta carpeta. Busqué nombres de
  pila frecuentes, tratamientos («Sr.», «Herr», «Dr.»…) y cargos.
  - Solo aparece el nombre de pila del responsable del proyecto: en el
    comentario de cabecera del SQL y en `aprobada_referencia`, igual que en
    todos los lotes.
  - `aprobada_referencia` es una tabla interna: no sale en las vistas públicas
    (0 apariciones en `lectura-publica/`). Ver R10.
- **Lo que irá a Git:** en los 792 archivos hay más nombres que los 9 que lista
  `REVISION-ENTREGA-sql.md` §6 (O3).

## 6. Correcciones obligatorias (ninguna cambia el SQL)

### O1 · Hausera: la salida corta no puede sonar a promesa

**Problema.** Hausera no tiene `salidaCorta`. Por eso la tarjeta y «Lo esencial»
de la web y de la app recortan la salida a 40 caracteres: «Cobras cuando se
venden las viviendas…». Se pierden «sin fecha cierta» y «sin mercado secundario
garantizado», que eran la corrección obligatoria del revisor del grupo. Y queda
una frase que da por hecho el cobro.

**Corrección.** En `despues-de-aplicar.mjs`, junto al mínimo corto de Hausera
(mismo texto que C3 de contenido, 39 caracteres):

```js
assert.ok([null, 'Al vender las viviendas, sin fecha fija'].includes(t.ofertas['hausera-proximas-ofertas'].salidaCorta), 'Hausera: salida corta de partida');
t.ofertas['hausera-proximas-ofertas'].salidaCorta = 'Al vender las viviendas, sin fecha fija';
```

**La OTA hace falta.** La app enseña la transparencia que lleva empaquetada
(`rwadar-movil/lib/transparencia-contenido.js`). Sin OTA, en cuanto se aplique
el SQL la app enseñaría «Cobras cuando se venden las viviendas…». Hay que
publicar la web y enviar la OTA justo después de aplicar.

### O2 · Hausera: «documentoEspana» dice algo falso hoy y le falta la contradicción 50 % / 70 %

**Problema.** Hoy dice: «Alicante 2 no tiene documento de emisión público: su
ficha pide iniciar sesión…», con fuente en la ficha de Alicante 2 y fecha del
05/11. Tiene tres fallos:

- es falso: el documento se ve sin iniciar sesión;
- habla de una operación que ya no se sigue;
- la web y la app lo enseñan con su motivo y su fuente.

Además, la contradicción del mínimo de la emisión no sale en ningún sitio de la
ficha (ver §2, Hausera).

**Corrección.** En `despues-de-aplicar.mjs`, en tres pasos:

1. Quitar la entrada `NO_REFECHAR['hausera-proximas-ofertas.documentoEspana']`.
2. Quitar su `assert.ok(fechas.some(f => f.sinRefechar …))`.
3. Escribir la comprobación entera:

```js
t.ofertas['hausera-proximas-ofertas'].documentoEspana = {
  cumple: false,
  motivo: 'El documento de emisión de Alicante 3 es público, pero no es un folleto ni un KID y la CNMV no lo ha revisado. Además, sus documentos no coinciden en cuánto hay que colocar para que la emisión siga adelante (50 % o 70 %).',
  fuente: {
    titulo: 'Hausera · documento de emisión de Alicante 3',
    url: 'https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_',
  },
  consultadaEl: '2026-11-10',
};
```

- El motivo tiene 221 caracteres (el máximo es 300).
- Une los textos de SQL n.º 2 y de contenido C2, y añade la contradicción, que
  respaldan el expediente (claim `minimoEmision`, estado `en_conflicto`) y
  `espana-proximas.md` («Conflicto del mínimo de la emisión — confirmado»).
- Resultado esperado de `despues-de-aplicar.mjs`: «42 de 44».

### O3 · Nombres de personas que irían a Git

**Problema.** Antes de sacar `expedientes/`, `grupos/` y
`revision-independiente/` de `.git/info/exclude`, quedan más nombres de
personas que los 9 archivos de `REVISION-ENTREGA-sql.md` §6. Aquí no escribo
ninguno; solo dónde están. Rutas desde `2026-11-10-v2/`:

| Archivo | Qué hay |
|---|---|
| `grupos/brickwise/fuentes/brickwise/web-home-2026-11-10.txt` | Dos testimonios firmados con nombre (líneas 163 y 167) |
| `revision-independiente/fuentes/brickwise/web-home-revisor-2026-11-10.txt` | Los mismos dos testimonios |
| `grupos/ampliacion/fuentes/novedades/rhj_ft_aal.txt`, `rhj_base_prospectus.txt` y `rhj_base_prospectus_supplement_09_november_2026.txt` | Nombres de los administradores del emisor (47, 6 y 8 apariciones) |
| `grupos/ampliacion/fuentes/navegador/conda-cooee-alpin-nachrangige-anleihe-der-you-will-like-it-hotels-gmbh.txt` | Nombres de los dos fundadores (línea 136) |
| `grupos/ampliacion/fuentes/crowdedhero/home.txt` | Además del consejero delegado: otro directivo y varios testimonios con nombre |
| `grupos/ampliacion/fuentes/crowdedhero/project-45.txt` y `project-49.txt` | Nombre del propietario actual y nombres de socios y consejeros |
| `grupos/ampliacion-1/fuentes/press-stocks.txt` y `grupos/ampliacion/fuentes/radar-sin-oferta/securitize-press-stocks.txt` | Además del cargo público: nombres de directivos citados |
| `grupos/ampliacion/fuentes/radar-sin-oferta/securitize-home.txt` | Nombre del consejero delegado |
| `grupos/candidatas-mercados/fuentes/coinbase-nvdac-prospectus.txt` | Además de los fundadores: nombres de consejeros |
| `grupos/ampliacion/fuentes/radar-sin-oferta/ondo-home.txt` y `lofty-home.txt`; `grupos/acciones-oro-tesoro/fuentes/xstocks-fi-us.txt` (línea 137) | Una persona citada o el fundador |
| `grupos/ampliacion-1/fuentes/stocks-aapl.txt` y `grupos/ampliacion/fuentes/radar-sin-oferta/securitize-stocks-aapl.txt` | Nombres de los fundadores de la empresa cotizada |

**Corrección.**

1. En cada uno, cambiar el nombre por «[persona física recortada]» y dejar el
   cargo.
2. Añadir estos archivos a DECISIONES §4.
3. Repetir gitleaks y una búsqueda de nombres antes del commit.

Mi búsqueda no es exhaustiva: nombres de pila frecuentes, tratamientos y cargos
junto a un nombre propio. Dejo fuera, como falsos positivos:

- nombres de calles y de empresas;
- un nombre de ejemplo de un formulario suizo;
- el nombre del premio de periodismo del pie de página de la CNMV, que sale en
  todas sus copias. Ese premio lo decide el coordinador.

## 7. Recomendaciones (no bloquean)

**R1 · Regla 5.3: pedir también el documento para España.** Para «Ver oferta en
X», exigir además «documentoEspana: Sí» en `transparencia.json`.
- Es un cambio de código en la web, las fichas y la app, así que necesita OTA y
  una orden aparte.
- Hoy cambiaría solo Kraken y Spiko Smart Cash Euro a «sales de RWAdar». Son las
  dos fichas cuyos propios avisos dicen que no consta la base para venderlas en
  España (folleto que no cubre España; compartimento sin notificación visible).

**R2 · Hausera, aviso de la contradicción (antes del 18/11).** En la próxima
entrega, y siempre antes de que abra la preventa el 18/11, añadir este aviso:
«Los documentos de Alicante 3 no coinciden en cuánto hay que colocar para que la
emisión siga adelante (50 % o 70 %); pregunta a Hausera antes de reservar.»
(154 caracteres).

**R3 · Hausera, acceso sin el término de MiFID.** Cambiar la referencia por
«Emisión española para particulares que el emisor considere idóneos; Hausera no
está registrada en la CNMV.» (106 caracteres). Lo probé con `resumenOferta`:
sigue saliendo «Sin comprobar si se puede contratar desde España».

**R4 · Hausera, protecciones que no tiene.** Añadir un aviso: «Hausera no es una
plataforma de financiación participativa autorizada: aquí no tienes las
protecciones de esas plataformas, como la ficha de datos fundamentales o los 4
días para echarte atrás.» (Reglamento (UE) 2020/1503, arts. 21 a 23.)
- También conviene decir quién valida el documento. Según el expediente, la
  «entidad autorizada» que lo valida es una empresa de asesoramiento financiero
  autorizada solo para asesorar, no para colocar. La comercialización la hace el
  propio emisor.

**R5 · Hausera, aviso de la preventa sin urgencia.** Escribirlo de forma que no
empuje a reservar: «Puede que no llegues a la oferta pública: Alicante 2 se
cubrió en la preventa (figuraba como financiada el 10/11/2026, antes de su
oferta pública del 11/11). Reservar en la preventa tiene el riesgo del aviso
anterior.»

**R6 · Spiko, rentabilidades pasadas.**
- Añadir «Las rentabilidades pasadas no son un indicador fiable de las futuras»
  a los tres literales, o como línea fija de la interfaz junto a toda
  rentabilidad (Circular 2/2020; revisión legal del 06/11, punto 5.3).
- En Smart Cash, mejor la ventana de 28 a 31 días (2,83 % según el recálculo
  del expediente) que la de un solo día, como en los otros dos fondos.

**R7 · Boss Info y Switzerlend, aviso visible.** Añadir, como ya tiene
Aktionariat: «Sin folleto ni KID, y el emisor no está supervisado: su portal no
dice en qué exención se apoya para vender en el EEE.» (118 caracteres). Hoy la
vista pública tapa la métrica «Supervisor» de estas fichas.

**R8 · Brickwise, distribuciones esperadas.** Quitar «Distribución anual
esperada/prevista» y «Próxima distribución esperada», o rotularlas «según
Brickwise (histórico)». Sobre todo donde el alquiler terminó (Plüddemanngasse) o
el 15/11 ya ha pasado.

**R9 · Spiko Smart Cash Euro, el hecho de las fechas.** Añadir al aviso 2 y al
motivo de `documentoEspana`: «la CNMV inscribió Spiko SICAV el 30/01/2026, antes
de que la AMF autorizara este fondo (17/02/2026)».

**R10 · SQL sin nombres.** En los próximos lotes, escribir «el responsable del
proyecto» en el comentario de cabecera y en `aprobada_referencia`, y no su nombre
de pila.

**R11 · Salida de Hausera, también en el SQL.** Si el SQL se regenera por otro
motivo, que la salida de Hausera empiece por «Solo al vender las viviendas, sin
fecha cierta (previsto en 20 meses); …». Así el recorte a 40 caracteres no suena
a promesa ni siquiera sin `transparencia.json`.

**R12 · Mínimo corto de Switzerlend.** Lo de C1 de contenido (pasar a «10/11»)
me parece bien. No lo exijo: una fecha anterior con el mismo precio no engaña.

## 8. Límites de esta revisión

- No abrí los PDF de Hausera (documento de emisión, acuerdo de reserva y
  escritura). Para el 50 % / 70 %, los apartados 5.6 y 5.7 y la entidad que
  valida el documento me apoyo en el expediente y en `espana-proximas.md`.
- No volví a leer Kraken, Robinhood ni Prosegur, porque solo cambian las fechas.
  Me apoyo en sus expedientes.
- No hice altas ni KYC.
- No revisé las noticias del sector, que no van en el SQL.
- La búsqueda de nombres de O3 es un barrido amplio, no una lectura línea a
  línea de los 792 archivos.
