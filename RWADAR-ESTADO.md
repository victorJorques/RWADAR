# RWAdar · estado del proyecto

> Documento de traspaso. Léelo entero antes de tocar nada: hay decisiones
> que parecen arbitrarias y no lo son, y dos o tres trampas que ya nos
> costaron tiempo una vez.
>
> **Este documento explica el POR QUÉ. Para el DÓNDE —en qué punto exacto
> de la web está cada cosa— está `RWADAR-MAPA.md`. El HTML, CSS y JavaScript
> propios están ahora en archivos separados.**

> **Vigencia:** reconciliado el 22 de agosto de 2026 sobre el traspaso del
> 17–20 de agosto y el baseline `42018de`. `RWADAR-TRASPASO.md` manda para el
> estado operativo. La web remediada y la migración 22 están desplegadas y
> verificadas; correo y push siguen OFF. Sin SMTP propio probado, las altas y la
> recuperación públicas están pausadas fail-closed; el login existente y el
> radar sin cuenta permanecen disponibles. Este proyecto no está terminado.

## Índice · lee solo el tramo que necesites

Entero cuesta varios miles de tokens. Casi nunca hace falta. Cada fila da una
marca que se localiza con `rg`; abre solo el tramo necesario.

> **Antes que nada: si el trabajo va de cuentas, opiniones, moderación o de
> la base en línea, empieza por `RWADAR-MANANA.md`.** Producción no coincide
> con el repositorio y ese documento separa explícitamente lo local de lo
> desplegado.

| Necesito | Marca de búsqueda | ~líneas |
|---|---|---|
| Qué es, direcciones y qué archivo es cada cosa | `## Qué es` | 71-123 |
| **Estado y qué bloquea el avance** | `## Estado a 22` | 124-190 |
| Cómo cambiar contenido, publicar, probar | `## Cómo se trabaja` | 157-247 |
| ↳ avisar a los buscadores (IndexNow) | `## Avisar a los buscadores` | ~215 |
| ↳ volver atrás si algo sale mal | `## Volver atrás` | ~230 |
| ↳ si algún día hay dominio propio | `## Si algún día se registra` | ~236 |
| **Decisiones que no conviene deshacer** | `## Decisiones que conviene` | 248-535 |
| ↳ pre-renderizado y SEO | `va pre-renderizado` | ~253 |
| ↳ descartadas: el listón | `listón alto` | ~258 |
| ↳ **un estudio no es una fuente** | `un estudio no es una fuente` | ~267 |
| ↳ el dibujo 3D: por qué un edificio | `un EDIFICIO, no una metáfora` | ~296 |
| ↳ trampas del edificio (NaN, z-fighting…) | `Cuatro trampas del edificio` | ~333 |
| ↳ reflejo, sombra y suelo | `Tres cosas del render` | ~351 |
| ↳ el radar de portada | `no es un adorno` | ~363 |
| ↳ la calculadora | `enseña la cuenta` | ~382 |
| ↳ **sonido**: carácter y motivos | `La altura SUBE, no baja` | ~393 |
| ↳ sonido: nada de DynamicsCompressor | `DynamicsCompressor` | ~435 |
| ↳ **color**: los dos errores previos | `el verde de un eco de radar` | ~450 |
| ↳ color: distancias medidas en Lab | `medidas en Lab` | ~479 |
| ↳ tipografía | `tipografía de Apple` | ~484 |
| ↳ por qué la app no es la web envuelta | `la web envuelta` | ~489 |
| **Trampas que costaron tiempo** | `## Trampas que ya nos costaron` | 536-578 |
| Qué hacer a continuación | `## Lo siguiente` | 579-596 |

Última reconciliación de estado: 22 de agosto de 2026. El resto conserva
decisiones de diseño históricas y debe leerse con esa fecha en mente.

**Rediseño de agosto de 2026, publicado el día 8.** La web pasó de papel
—fondo crema, tinta azul, verde menta— a instrumento: fondo de noche cálido,
el verde de un eco de radar como color de marca y el contenido emitiendo luz
propia. Con el cambio de piel entraron:

- un **dibujo 3D nuevo**: un rascacielos de 885 paneles de fachada con las
  ventanas encendidas, sobre cristal negro, con reflejo, sombra de contacto
  y viñeta — en lugar de la torre de cubos flotando en el vacío. Pasó por un
  panal de fichas hexagonales por el camino;
- el **radar de portada**: el registro entero dibujado como radar, con cada
  plataforma como un punto que se puede pulsar y una lectura al pasar por
  encima;
- la **calculadora** del explicador, con la cuenta a la vista paso a paso y
  la rentabilidad recibida;
- el explicador **reescrito sin tecnicismos**;
- el **sonido rehecho tres veces** hasta dar con el carácter (familia «pop»,
  la altura sube), elegido a oído en un banco de pruebas;
- la **paleta**, que llegó a su sitio por descarte: crema y azul → negro y
  oro (falso premium) → monocromo (soso) → verde de radar con grises
  cálidos;
- la **imagen de vista previa** (`og.png`), regenerada con la identidad
  nueva y con el radar de datos reales dentro.

Nada de eso tocó los datos ni el flujo de publicación.

---

## Qué es

Un registro curado de plataformas de tokenización de activos reales (RWA).
La producción actual publica 26 fichas y 4 descartadas. Un descarte solo se
señala cuando el motivo se respalda con una fuente citable y vigente.

Existe como **web pública** y como **app móvil**, ambas alimentadas por la
misma base de datos.

---

## Dónde está cada cosa

| Pieza | Dirección |
|---|---|
| Web canónica | https://rwadar.pages.dev |
| Panel de Cloudflare | Cuenta `52d07be006e7a27f5f793c59e1796b13`, proyecto Pages `rwadar` |
| Web legada | https://rwadar.netlify.app (no canónica; ya indexada) |
| Base de datos | https://supabase.com/dashboard/project/exgpmjpaaebyoolpwced |
| Search Console | https://search.google.com/search-console (propiedad verificada) |

```
repositorio/
  rwadar-site/                  Fuente web: HTML + assets CSS/JS + PWA
  rwadar-publicado/             Artefacto generado; es lo que se despliega
  rwadar-app/                   Esquema de la base de datos y utilidades de datos
  rwadar-movil/                 App en React Native / Expo
  rwadar-arrancar.js            Diagnóstico de todo + servidor local. Empieza aquí
  rwadar-publicar.js            Sincroniza + pre-renderiza + publica la web
  rwadar-servir.js              Servidor local en :4173 (lo levanta el anterior)
  rwadar-banco-de-sonidos.html  Banco de pruebas de sonido, servido en /banco
  RWADAR-ESTADO.md              Este archivo: el porqué
  RWADAR-MAPA.md                El dónde: qué archivo y símbolo contiene cada cosa
```

Solo se despliega `rwadar-publicado/`, generado por el publicador desde
`rwadar-site/`. El servidor, el banco de sonidos y la documentación quedan
fuera del artefacto.

### Identificadores

```
Cloudflare Pages: rwadar (deployment actual d7f7e611...)
Netlify legado : 0211fd28-d371-43cd-9d93-3944fea57680
Supabase ref   : exgpmjpaaebyoolpwced
Supabase URL   : https://exgpmjpaaebyoolpwced.supabase.co
Clave pública  : sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F
```

La clave publicable va dentro de la web y de la app **a propósito**. Identifica
el proyecto, no es una credencial administrativa. Su seguridad depende de RLS,
los `GRANT` y las RPC: nunca uses su carácter público como prueba suficiente de
que una operación esté protegida.

---

## Estado a 22 de agosto de 2026

| Fase | Estado verificable |
|---|---|
| Web pública | **GO en `https://rwadar.pages.dev`** con 26 fichas, 4 descartadas y PWA |
| Emisiones públicas | 0 en producción; sección no visible |
| Web remediada | **Desplegada y verificada**: 26/4/0; CSS/JS externos, CSP estricta, sin RUM/Zaraz y sin tokens en `localStorage` |
| Deployment y artefacto | Actual `d7f7e611-15a3-4e89-9a39-72bbe371b054` (`https://d7f7e611.rwadar.pages.dev`); canonical `https://rwadar.pages.dev`; web 203/203 y suite raíz código 0; ZIP `rwadar-cloudflare-pages-20260822-3688f59d.zip`, 878.052 bytes, 21/21, SHA-256 `C2FAC300F4B6C9BC83FDD63C26EB64B4615F8F540B73589D54B6EDD8D8E936E4`; smoke externo GO |
| Base de producción | Migración 22 **aplicada y verificada**; Security Advisor: 0 Critical y 0 Security Definer View |
| Migración 22 | `02F2...0666`: `COMMIT`, `schedule=19`; verificador `4182...2C3`: `Success. No rows returned` y aviso `RWAdar 22 OK` |
| Smoke público backend | Radar 26, descartadas 4; `opiniones.usuario_id` 401, moderación directa 401, firma antigua ausente (404/PGRST202), firma nueva anónima 401/42501 |
| Smokes remotos | Ambos solo lectura por defecto; mutación opt-in ligada al proyecto y limpieza verificable; contrato local 21/21 sin red |
| Cuentas | Radar completo sin cuenta y login existente disponible. Altas y recuperación públicas pausadas fail-closed, sin llamadas `/signup` ni `/recover`; Auth conserva Confirm email y `mailer_autoconfirm=false`, pero no hay SMTP propio probado |
| Opiniones/moderación | Backend endurecido mediante RPC; probar el frontend que quede realmente desplegado |
| Correo de avisos | **OFF en producción**; 23 GO local, sin Brevo/Vault/remitente ni E2E |
| Push | **OFF en producción:** 0 tokens y 0 cron; exige dispositivo físico y E2E |
| Dependencias móviles | 46 paquetes afectados: 29 high, 17 moderate, 0 critical; 3 avisos fuente de toolchain sin fix compatible |
| Indexación | Pages verificada; portada en cola. Sitemap enviado, primera lectura «No se ha podido obtener». Netlify legada sí indexada |
| Hosting | Cloudflare Pages es producción. Netlify conserva la versión anterior: producción pausada porque solo quedan créditos operativos y CLI `Forbidden`; seguirá así hasta reinicio o ampliación de créditos. CALIX es distinto y no se tocó |
| Móvil | Android build 4 compatible con OTA `preview` `4f9d7e19...`, runtime `af694...`; rediseño + apertura de avisos. Sin Play Store ni iOS nativo; PWA en ambos con caché `rwadar-v-3688f59d62fd0079`, pestañas `Radar`/`Siguiendo`/`Avisos`/`Más` y migración automática desde SW v1. La ficha agrupa toda la información y opiniones, conserva el 3D, fija «Web oficial», reinicia el scroll y permite cerrar arriba, abajo o con Back |

### Bloqueos reales

No hay un único bloqueo y el proyecto no debe llamarse terminado. Faltan, como
mínimo:

1. que Eric Almiñana, Samuel Rodriguez y Victor Jorques revisen y firmen el
   acuerdo de corresponsabilidad y decidan los plazos propuestos de 12 meses y
   3 años;
2. conservar la evidencia de la 22 aplicada y verificada y repetir su
   verificador de solo lectura tras cualquier cambio de esquema;
3. mantener altas y recuperación públicas pausadas fail-closed hasta disponer
   de SMTP propio y pruebas reales de extremo a extremo; conservar el login de
   cuentas existentes y el radar completo sin cuenta. El acuerdo pendiente ya
   se declara de forma transparente y no es un bloqueo técnico del publicador;
4. conservar el deployment Cloudflare, el ZIP final y el hash como evidencia de la
   publicación GO, y repetir el smoke tras cualquier cambio;
5. reconsultar Search Console hasta que la portada y el sitemap de Pages tengan
   estado definitivo;
6. configurar y probar por separado correo y push antes de activarlos o
   prometer avisos.

### Advertencia de método

Las pruebas locales describen el repositorio, no Cloudflare ni la base real. La
regla permanece: **producción se mide, no se supone**. `RWADAR-MANANA.md`
contiene el contrato operativo y `RWADAR-TRASPASO.md` el orden de continuación.

---

## Cómo se trabaja

### Cambiar contenido

**La fuente de verdad es Supabase, no el HTML.** Se edita la tabla
`plataformas` en el panel. Si editas los arrays del JavaScript externo a mano, la
siguiente publicación los sobrescribe.

Los visitantes ven el cambio **al momento**: la web consulta la base al
cargar y se actualiza sola si algo cambió desde la última publicación.

### Publicar la web

```bash
node rwadar-publicar.js --local
npx.cmd --yes wrangler@4.125.0 pages deploy rwadar-publicado --project-name rwadar --branch main
```

El primer comando sincroniza, pre-renderiza y valida `rwadar-publicado/`. El
segundo despliega solo ese artefacto al proyecto Pages `rwadar`, tras comprobar
cuenta, directorio y hashes. Wrangler quedó con 3 permisos: User Read
obligatorio, Account Read y Pages Write. No subas la fuente, la raíz ni CALIX.

En el estado actual, la política declara
`data-deploy-legal-status="acuerdo-pendiente-de-documentar"`: la versión
completa puede avanzar dejando visible que el acuerdo y los plazos no están
cerrados. Un `data-deploy-blocker`, un estado ausente o uno desconocido detienen
ambos modos remotos antes de Auth o sincronización. El preflight exige
`mailer_autoconfirm=false` exacto en `/auth/v1/settings`; producción ya devuelve
`false` y Confirm email está activo. Un error o campo ausente detienen la
publicación. Sin SMTP propio probado, la interfaz no expone la capacidad técnica
de signup: altas y recuperación públicas quedan pausadas fail-closed y no envían
solicitudes. El login existente sigue disponible y el radar no exige cuenta.

La web endurecida ya está en Cloudflare Pages, deployment actual
`d7f7e611-15a3-4e89-9a39-72bbe371b054`
(`https://d7f7e611.rwadar.pages.dev`), canonical `https://rwadar.pages.dev` y
caché `rwadar-v-3688f59d62fd0079`. El ZIP congelado
`outputs/rwadar-cloudflare-pages-20260822-3688f59d.zip` tiene 878.052 bytes,
21/21 archivos verificados y SHA-256
`C2FAC300F4B6C9BC83FDD63C26EB64B4615F8F540B73589D54B6EDD8D8E936E4`.
El paquete `PRE-AUTH-NO-USAR-...-9b158323.zip` anterior no debe usarse. El publicador remoto heredado
aún llama a Netlify: no lo uses como ruta de Pages ni ejecutes `netlify deploy`
a secas; hoy la CLI responde `Forbidden` y el panel mantiene producción pausada
por créditos, por lo que Netlify conserva la versión anterior.

### Probar la app

```bash
cd rwadar-movil && npx.cmd expo start
```
Escanear el QR con **Expo Go**. Añadir `--web` para verla en el ordenador.

### Tocar el esquema de la base

Requiere la autenticación normal del CLI, una referencia de proyecto explícita
y una versión exacta revisada. No pases tokens por argumentos ni los escribas
en disco:

```cmd
cd rwadar-app
set RWADAR_SUPABASE_CLI_VERSION=2.79.0
aplicar-sql.cmd exgpmjpaaebyoolpwced db\22_cierre_regresiones.sql
```

El instalador general de una base nueva incluye 01–12, 14–15 y 17–22, con
verificadores. La activación de correo 23 está separada y no se aplica por
defecto. En la base existente, aplica solo el fichero aprobado que falte.

Para la producción existente no ejecutes 16, retratos recuperados ni
migraciones históricas. La 22 ya se aplicó y pasó su verificador interno; no la
reapliques como forma de comprobación. Conserva el verificador 22 y
`fresh_install_verificar.sql` (26/4) para controles de solo lectura. Su rollback
es solo de emergencia y requiere diagnóstico y copia previa.

Aplicar la 22 **no enciende push**: deja `push_configuracion.habilitado=false`,
0 cron `rwadar-push` y las funciones/trigger gated. Sí instala la retención
diaria independiente de dispositivos a las 03:17 con monitor de ejecución. La
22 minimiza además colas heredadas: token nulo, intentos terminales y sin
petición pendiente. El
único opt-in es `activar-push.cmd <REF>`, con PAT, aprobación E2E, confirmación
ligada a la referencia y verificador propio; no se ejecutó y no debe ejecutarse
antes de una prueba externa aprobada.

Producción conserva 0 tokens y 0 cron `rwadar-push`. La OTA solo añade el
listener que abre avisos; activar exige dispositivo físico, token real y E2E.
La 23 de correo está GO local, pero faltan Brevo, secreto y remitente en Vault
y E2E: no se aplica en producción.

Antes de tocar producción, las pruebas corren contra un Postgres real
embebido, sin instalar nada:

```bash
cd rwadar-app && npm.cmd test
```

Y para que el fichero de instalación no se separe de la base real:

```bash
node volcar-seed.js
```

### Avisar a los buscadores tras publicar

Google va por Search Console: *Inspección de URLs* → pegar la dirección →
**Solicitar indexación**. Hay cuota diaria; si dice "Cuota superada", al día
siguiente.

La propiedad Pages está verificada y la portada se envió a indexación. El
sitemap también se envió, pero la primera lectura mostró «No se ha podido
obtener». Reconsulta antes de afirmar que Pages ya está indexada. La URL legada
de Netlify sí figura indexada.

Al resto —Bing, Yandex, Seznam, Naver, Yep— se les avisa de una vez con
IndexNow. La llave es el archivo de nombre raro de `rwadar-site/`:

```bash
curl -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json" -d "{\"host\":\"rwadar.pages.dev\",\"key\":\"c9417d2d5003bb9a41fee63c7f5ec00f\",\"keyLocation\":\"https://rwadar.pages.dev/c9417d2d5003bb9a41fee63c7f5ec00f.txt\",\"urlList\":[\"https://rwadar.pages.dev/\"]}"
```

Un `202` es aceptado.

### Volver atrás si algo sale mal

Conserva un artefacto conocido y sus hashes. Para restaurarlo, revísalo y
publícalo deliberadamente con el mismo proceso de producción; no promociones
un preview ni uses la interfaz del hosting para saltarte las validaciones. La
base tiene rollback específico para la 22, pero primero se hace copia.

### Si algún día se registra un dominio propio

Mientras no exista un dominio propio aprobado, el sitio se identifica ante
Google como `rwadar.pages.dev`.

Al añadirlo en *Domain settings* hay que sustituir `https://rwadar.pages.dev`
por el dominio nuevo en tres sitios —`index.html` (14 apariciones),
`robots.txt` y `sitemap.xml`— y volver a publicar. Si el sitio dice ser una
dirección y vive en otra, Google indexa la equivocada.

---

## Decisiones que conviene no deshacer

**El contenido va pre-renderizado en el HTML.** Todo vive en un array de
JavaScript; sin pre-renderizar, el robot de Google veía 438 palabras en vez
de 1.936. Es la diferencia entre indexar una página con contenido y una
vacía.

**La lista de descartadas tiene un listón alto.** Solo aparece una empresa
señalada si el motivo se respalda con una fuente citable y vigente. Se retiraron
motivos que eran juicios de valor (como «escala pequeña», «poca transparencia»
o «nicho») o dependían de fuentes secundarias controvertidas.

`select * from descartadas_sin_fuente` **debe devolver cero filas siempre.**
Es una comprobación editorial y legal previa a cualquier publicación.

**Una inscripción no es un aval.** El
[registro ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182)
recoge una emisión de REENTAL TOURIST HOMES, S.A.U. y varias de sociedades
HAUSERA PROPERTY MANAGER SPV. Es evidencia oficial de esas inscripciones
concretas. La propia CNMV aclara que no implica que haya validado las
condiciones de la emisión ni la información del emisor. Por tanto no se
describe a Reental, Hausera o una inversión como «avalada por la CNMV».

**El mismo listón vale para lo que entra, y por eso un estudio no basta como
fuente.** Un estudio externo puede servir para decidir a quién investigar,
pero sus puntuaciones o conclusiones no se publican sin contrastar cada dato
contra la fuente primaria correspondiente y anotar la fecha.

Las comprobaciones regulatorias deben enlazar el registro oficial, indicar la
entidad jurídica y describir solo el permiso o inscripción concreta. Nunca se
llaman «avales» ni se trasladan automáticamente de una filial a una marca, un
producto o una inversión. Las características económicas de un producto se
verifican además en su documentación vigente.

Los cambios editoriales históricos de Archax y Republic están en
`rwadar-app/db/06_archax_republic.sql`. Que el SQL sea reproducible no sustituye
la revisión periódica de las fuentes regulatorias y de producto.

**La retícula del explicador es uniforme.** Si las piezas fueran desiguales
no serían participaciones y el dibujo contradiría al texto.

**El dibujo es un EDIFICIO, no una metáfora.** Antes era un panal plano de
fichas hexagonales: se veía bien y explicaba mal. Una moneda partida en
gajos es una metáfora que hay que traducir — mientras el texto habla de un
local, de inquilinos y de un alquiler, el dibujo enseñaba galletas. Ahora
el activo es un **rascacielos de 885 paneles de fachada**, de pie sobre el
cristal negro. Cada panel es una participación.

La primera versión del edificio parecía un montón de piezas de Lego y se
quedó en un 6. Lo que la sacó de ahí fueron cuatro decisiones, y ninguna es
un ajuste fino:

1. **Proporción.** Torre esbelta (25 plantas sobre una base de siete metros)
   y paneles **altos y estrechos**, 0,62 × 1,0, como el despiece de un muro
   cortina de verdad. Con paneles cuadrados sobre una caja rechoncha no hay
   iluminación que salve el resultado: se lee como cubos apilados. El cuarto
   cuerpo es la **corona**: sin remate, la torre termina de golpe.
2. **Ventanas encendidas.** Una de cada cuatro emite luz propia. Es lo que
   convierte un volumen en un edificio habitado, y lo que hace que apetezca.
   Además explica la idea sin una palabra: entero, todas las ventanas son
   del mismo oro; repartido, cada ventana brilla del color de su dueño.
   **Solo se enciende el vidrio, no el marco** — se distingue comparando la
   normal del fragmento con la dirección del panel (`vFwd`). Encendiendo el
   panel entero parece una bombilla, no una ventana.
3. **Oro que parece oro.** Reflejo de entorno fuerte, especular apretado y
   **ambiente bajo**. Un ambiente alto ilumina por igual la cara que da a la
   luz y la que no, el volumen desaparece y la torre queda como una silueta
   plana recortada.
4. **Formato vertical.** El lienzo pasó a ser más alto que ancho. En un
   lienzo apaisado una torre deja medio cuadro negro a cada lado por mucho
   que se acerque la cámara: el formato tiene que seguir al motivo.

En el último paso unos cuantos paneles se intercambian **en cadena** —cada
uno al hueco del siguiente, así no queda ningún hueco vacío— y doce salen a
orbitar la torre: son las participaciones que están en el mercado ahora
mismo. Doce de 353 es un 4 %: se ven, y no desmontan nada. Que la silueta
aguante es el mensaje entero: vender tu parte no tira el edificio.

**Cuatro trampas del edificio, todas encontradas mirando el render:**

1. *El retardo de entrada se calcula desde `celdas[i].p[1]`.* Al pasar de
   panal a edificio, `celdas` dejó de ser pares `[x,z]` para ser objetos
   `{p,r}`, y el cálculo seguía leyendo `celdas[i][0]`. Eso metía **NaN** en
   el atributo de instancia. Un NaN ahí no rompe nada visible: cada panel
   interpola por su cuenta y la fachada aparece desalineada al azar. Costó
   media tarde porque parecía un problema de colocación.
2. *Cada panel va en el PLANO de su fachada* (`r+0,5`), no en el centro de
   su celda. En el centro, las cuatro paredes no casan en las esquinas.
3. *`TAM[0] = 0,97`: ni tocarse ni solaparse.* Solapados se ven todas las
   intersecciones y la fachada queda como un empedrado; tocándose justo,
   las caras laterales contiguas quedan coplanarias y pelean por la
   profundidad. Con 0,97 queda el despiece limpio de un muro cortina.
4. *La cámara no puede bajar de ~10°.* A cuatro grados la fachada se ve tan
   rasante que los paneles se tapan unos a otros y la torre parece un
   derrumbe. El ángulo bajo era heroico y también ilegible.

**Tres cosas del render que costaron encontrar y no conviene deshacer:**

1. *Las fichas se apoyan en el suelo* (`SUELO_Y = −0,72`). Flotando a −4,4 su
   reflejo se leía como un segundo objeto ahí abajo. Un reflejo solo
   convence cuando el objeto lo toca.
2. *El reflejo espeja la posición pero NO la normal.* Volteándola también,
   las caras de abajo miraban a la luz principal y el reflejo salía
   encendido, con la retícula marcada como un tablero de ajedrez.
3. *En el estado macizo `TAM[0]` tiene que ser ≥ 1/(1−bisel).* Con un bisel
   de 0,085 eso son 1,093; por debajo queda un surco entre fichas,
   invisible por arriba y clarísimo en el reflejo.

**El radar de portada no es un adorno.** Sale de la misma lista `P` que las
fichas, se repinta cuando la base de datos cambia y cada punto abre su
ficha. El ángulo es el tipo de activo y el radio, a quién deja entrar: las
abiertas a cualquiera caen cerca del centro. Además:

- pasar por encima o tabular escribe la plataforma en el panel de lectura
  de abajo — sin eso el radar es bonito y mudo, y hay que abrir puntos al
  azar para saber qué son;
- el rótulo de cada sector va **del color de su categoría**, y con eso el
  radar gana la leyenda que le faltaba;
- pulsar ese rótulo filtra la lista de abajo y baja hasta ella: el dibujo
  es también el índice;
- los halos se encienden al paso del barrido con un retardo negativo por
  punto calculado desde su ángulo, medido **desde el eje +X**, igual que la
  rotación del barrido: sumarle 90 por empezar los sectores arriba los
  desfasa un cuarto de vuelta;
- el lienzo va con `viewBox="-30 0 460 400"` para que «Infraestructura»
  quepa entero fuera del círculo sin abreviaturas.

**La calculadora del explicador enseña la cuenta, no solo el resultado.**
Local de 300.000 € partido en 3.000 trozos de 100 €, con dos barras: cuánto
pones y cuánto renta el local. Debajo, las cuatro operaciones a la vista,
una por línea, para que cualquiera pueda rehacerlas con los dedos. El
remate es el que de verdad enseña algo: **la rentabilidad no cambia con lo
que pongas** —un 6 % es un 6 % con 100 € y con 10.000 €—, y lo único que
cambia es cuánto cobras. Eso es exactamente lo que se compra con un trozo:
la misma proporción que el dueño de al lado. Lleva su aviso de que es el
bruto, antes de comisiones e impuestos, y de que no es una oferta ni una
previsión. Ese aviso no se quita.

**La altura SUBE, no baja.** Es la decisión que define el carácter del
sonido y se tomó **a oído**, comparando cinco familias en un banco de
pruebas (`rwadar-banco-de-sonidos.html`, servido en `/banco`). Un tono que
cae suena a algo que se posa; uno que sube en cincuenta milisegundos suena
a algo que se suelta. La segunda sensación es la que engancha, y es la del
«pop» de enviar un mensaje en un Mac. Todo el juego está montado sobre ese
gesto ascendente, con dos excepciones que significan lo contrario: cerrar
baja, y desmarcar baja.

Ese banco de pruebas **no se borra**. Yo puedo medir el sonido —pico,
espectro, duración, chasquidos— pero no oírlo, así que la única forma de
decidir el carácter es que lo escuche una persona. Si algún día hay que
volver a tocarlo, se añade una familia más y se compara.

**Los sonidos son TONOS cortos, no golpes de ruido.**
Esto corrige una decisión anterior de este mismo documento, que decía
«golpes de material, nunca notas». Aquella regla nació de huir del tono
puro sostenido —que efectivamente suena a juguete— pero la conclusión era
demasiado amplia, y la receta que la sustituía (ruido blanco por un paso
banda de Q alto) es un resonador metálico: todo el registro caía entre 2 y
4 kHz, justo donde el oído es más sensible y antes se cansa. Sonaba tosco,
y cuanto más se subía, más chillaba.

La receta actual es la que usa cualquiera que hace esto bien:

- **tono, no ruido**: un seno con una caída de altura mínima;
- **grave de salida**: arrancan entre 260 y 700 Hz y suben hasta su octava
  en unos 30 ms. Medido por cruces por cero, el `toque` pasa de 625 Hz a
  los 25 ms a 856 Hz a los 45 ms, y `cerrar` hace el camino inverso, de
  562 a 428. Nada vive por encima de 3 kHz, que es donde chillaba antes;
- **cortos**: entre 22 y 105 ms las pulsaciones. La versión anterior
  llegaba a 220 ms y por eso sonaba a xilófono en vez de a interfaz;
- **sin chasquido**: el ataque es un coseno elevado vía
  `setValueCurveAtTime`, no una rampa. Una rampa recta deja un quiebre en
  la derivada y el oído lo oye como un «clac»;
- **una sola familia**: todo sale del mismo timbre y de una escala
  pentatónica, así que dos sonidos seguidos nunca disuenan. Hay altura
  distinta solo cuando significa algo: marcar sube, desmarcar baja, y cada
  categoría tiene su nota de la misma escala.
- **±1,2 % de desafinación por pulsación**: inaudible como nota, decisivo
  como sensación. Dos toques idénticos delatan una grabación.

**El sonido NO puede pasar por un `DynamicsCompressor`.** Parece la pieza
obvia para no saturar y es justo la que lo arruinaba: tiene detector de
envolvente y un sonido de interfaz dura milisegundos. Medido en el propio
grafo, un transitorio de 0,30 salía a 0,074. En su lugar va un `WaveShaper`
con una curva que es una recta por debajo de 0,6 y se dobla por encima:
recorta sin detector y sin tocar los transitorios. Detrás va un paso bajo a
7 kHz, que es lo que separa «sonido de interfaz» de «pitido de
electrodoméstico».

**Los picos están medidos, no elegidos a ojo.** Todos entre 0,09 y 0,27, sin
recorte. La comprobación se hace renderizando el mismo grafo en un
`OfflineAudioContext` y midiendo pico, duración, reparto por bandas y saltos
entre muestras (un chasquido es una discontinuidad aislada; muchos saltos
repartidos son solo el aire del sonido).

**El color de RWAdar es `#25E39A`, el verde de un eco de radar.**
Esta decisión pasó por dos errores antes de asentarse, y los dos enseñan
algo:

1. *Negro y oro* (agosto, primera versión oscura). Error de fondo: oro
   sobre negro es el atajo más repetido para **aparentar** lujo —el de las
   landings de cripto y el de los relojes de imitación—, así que se lee como
   «esto quiere parecer caro». En una web cuyo argumento entero es la
   credibilidad, juega en contra de lo que dice el texto.
2. *Monocromo total.* Al quitar el oro se quitó también toda la identidad:
   logotipo en blanco y negro, ni un acento. Quedó correcta y **sosa**. La
   lección: quitar el color que sobra no es lo mismo que quedarse sin color.
   Una marca necesita uno propio; lo que no necesita es uno que grite.

El verde de radar resuelve las dos cosas: es lo que la marca dice ser —un
instrumento que detecta—, tiene 11,8:1 de contraste sobre el fondo, y es
exactamente lo contrario del oro: no intenta parecer caro, intenta parecer
preciso.

**Dónde va y dónde no.** La señal está en el logotipo, los rótulos, la
acción principal, los enlaces y el foco. En ningún otro sitio. **El resto
del color de la página lo ponen los datos**: las seis categorías de activo,
más la propia señal para «verificado» (es la promesa de la marca, no un
color aparte) y el rojo para «descartada».

**Los grises son CÁLIDOS**, no neutros ni azulados. Es el cambio que más se
nota al leer: un secundario gris neutro sobre negro se lee apagado y cansa;
el mismo valor tirando a tierra se lee cómodo.

**Las distancias entre colores están medidas en Lab, no juzgadas a ojo.**
Mirando el radar habría jurado que el problema era azul contra cian —y están
a 54 de distancia, de sobra—. El choque real era el naranja de «materias
primas» contra el coral de «descartada», a 22,9: una categoría confundible
con una advertencia. Pasando el aviso a rojo puro (`#FF3B30`) la distancia
sube a 34,5. Ampliar la búsqueda no compensa: con ocho colores simultáneos
sobre negro el espacio ya está lleno, y el óptimo global solo ganaba 3
puntos a cambio de un amarillo pálido ilegible.

**La torre del explicador es de piedra clara**, no de oro: una torre dorada
pedía una interfaz dorada. En piedra con las ventanas encendidas en cálido
parece un edificio de noche de verdad, y el salto a los colores de dueño es
mucho más fuerte saliendo de un neutro.

**Los puntos del radar están colocados por búsqueda, no a ojo.** Se recorre
el espacio de (apertura del sector, escalón radial) midiendo la distancia
mínima entre puntos, con dos límites duros: la apertura no puede pasar de
56° o algún punto se sale de su sector y parece de otra categoría, y el
escalón no puede pasar de 0,12 o invade el anillo de al lado y se pierde la
lectura de «distancia = a quién deja entrar». El óptimo dentro de eso deja
11,2 unidades entre los dos puntos más juntos, frente a 9,4 antes. El azar
sobra: jitter 0 gana a cualquier jitter, porque desordena sin separar.

**Cada paso del dibujo suena UNA vez, como una gota.** Antes cada paso
disparaba una ráfaga —cinco chispas, cuatro destellos, dos roces— y sonaba a
fuegos artificiales y a algo que se alargaba. Un explicador que avanza solo
no puede sonar sostenido: la atención se va al sonido en vez de al dibujo.
Una gota es un tono que sube muy rápido de altura y se apaga: medido, 76 ms
subiendo de 567 a 1036 Hz. Esa subida rápida es lo que el oído reconoce como
gota — es la resonancia de la cavidad al cerrarse.

**Las tipografías van dentro del CSS local, no se piden a Google.** Antes la
página cargaba nueve ficheros estáticos desde `fonts.googleapis.com`: 138 kB,
una petición bloqueante y, sobre todo, la IP de cada visitante viajando a un
tercero — algo difícil de defender en un sitio dirigido a inversores
españoles y contradictorio con el cuidado legal del resto del proyecto. Ahora
van las dos **versiones variables** incrustadas en base64 dentro de
`assets/rwadar-20260820.css`: 30 kB para todo el
rango de peso de ambas familias, cero terceros y sin salto de tipografía al
cargar. De paso murió una falsa negrita: se usaba Geist Mono 700 sin haberla
pedido nunca y el navegador la fabricaba estirando la 600.

Cuesta peso en el CSS y evita peticiones a terceros. Geist es de Vercel con licencia SIL
Open Font 1.1, que permite incrustarla; conviene no perder esa nota si el
proyecto cambia de manos.

**La tipografía de Apple no se puede usar.** San Francisco tiene licencia
restringida a interfaces de sus propias plataformas. Se usa Geist, libre y
de la misma familia visual, con `system-ui` de respaldo: en un iPhone cae en
San Francisco de forma legítima.

**La app no debe ser solo la web envuelta.** Su valor nativo está en el
seguimiento, la caché sin conexión y una experiencia propia. Los avisos push
son una capacidad preparada, no una entrega operativa: mientras
`pushDeliveryEnabled=false` y no haya emisor/recibos E2E, no se prometen.

**Pero el explicador 3D SÍ se reutiliza de la web, y es deliberado.** La app
lo abre embebido, apuntando a la sección `#explain` de la página publicada.

El motivo no es la pereza: es que la alternativa ya falló. La app nació en
agosto con su propio explicador —bloques animados en vez de WebGL— y con su
propia paleta. Cuando la web se rediseñó el día 8, la app **se quedó atrás sin
que nadie lo notara durante seis días**: seguía en crema y azul marino, sin
radar y sin edificio. Dos implementaciones del mismo dibujo divergen; es
cuestión de tiempo.

Reutilizando, el edificio de la app es el edificio de la web por construcción,
y con él entran gratis los cuatro pasos, la calculadora y sus avisos legales.
Si mañana cambia el 3D, cambia en los dos sitios a la vez.

Lo que sí se porta a nativo es lo barato y lo que tiene que ir suelto: **el
radar de portada** (SVG, con las mismas cifras medidas) y **el logotipo**. La
lista, el buscador, los filtros, la caché y el seguimiento siempre fueron
nativos.

**El explicador nativo no se borra**: es el respaldo que se enseña sin
conexión. La caché y ese fallback deben probarse antes de anunciar cobertura
offline en una versión de tienda.

---

## Trampas que ya nos costaron tiempo

**El publicador remoto heredado sigue siendo de Netlify.** No lo uses para
actualizar Cloudflare Pages. La ruta vigente es generar/verificar con `--local`
y desplegar `rwadar-publicado/` con Wrangler al proyecto y cuenta exactos.
CALIX es otro proyecto y queda fuera de cualquier operación RWAdar.

**Las capturas de pantalla mienten con las animaciones.** Ni el modo sin
ventana ni el panel de vista previa ejecutan fotogramas de forma fiable: el
modo virtual da un solo fotograma y el panel no compone nada — ahí
`requestAnimationFrame` **no se dispara ni una vez**. Perseguí un fallo
inexistente en el 3D durante un buen rato por fiarme de ellas.

La forma que sí funciona, y que está preparada en el código:

```js
window.__gl3d.pinta(t)   // dibuja UN fotograma con la marca de tiempo que le des
```

Llamándolo en bucle con tiempos crecientes se avanza la animación a mano.
Después, `gl.readPixels` sobre el lienzo da los píxeles reales, y
`node rwadar-servir.js` acepta un POST en `/guardar?n=algo.png` para
escribirlos en disco y poder mirarlos. Así se comprobaron los cuatro pasos
del explicador.

**El sonido también se comprueba sin altavoces.** El mismo grafo se
reconstruye en un `OfflineAudioContext` (sustituyendo `window.AudioContext`
antes del primer sonido) y `startRendering()` devuelve las muestras exactas.
Con `c.suspend(t)` se dispara un sonido distinto en cada segundo y se miden
todos los picos de una vez. No hace falta gesto del usuario.

**No borres la etiqueta de Google** (`google-site-verification` en el
`<head>`) ni el archivo `google6b2e3e5f58b7e557.html`. Si desaparecen,
Google revoca la verificación.

**Tampoco borres** `c9417d2d5003bb9a41fee63c7f5ec00f.txt`: es la llave de
IndexNow, que avisa a Bing, Yandex y compañía.

**No escribas ficheros con `Set-Content` de PowerShell**: mete BOM y rompe
los JSON.

---

## Lo siguiente, por orden de riesgo

1. Cerrar el acuerdo de corresponsabilidad de Eric Almiñana, Samuel Rodriguez
   y Victor Jorques (`RWAdar@protonmail.com`) y decidir los plazos propuestos
   de 12 meses y 3 años.
2. Conservar la evidencia de la migración 22 aplicada y verificada; repetir el
   verificador tras cambios de esquema.
3. Conservar visible `acuerdo-pendiente-de-documentar`; mantener altas y
   recuperación públicas pausadas fail-closed hasta tener SMTP propio y pruebas
   E2E. Mantener el login existente y el radar completo sin cuenta.
4. Conservar el deployment `d7f7e611...`, el ZIP final y su SHA-256; repetir web
   203/203 y smoke externo después de cualquier cambio.
5. Reconsultar la portada y el sitemap en Search Console hasta obtener un estado
   definitivo; la solicitud ya está hecha, no la indexación confirmada.
6. Mantener push y correo OFF hasta contar con sus credenciales, consentimiento,
   dispositivo o remitente y pruebas E2E verificadas.
7. Resolver de forma compatible los tres avisos fuente del toolchain móvil; no
   usar `npm audit --force`, que propone Expo 46 incompatible.
8. Investigar distribución y enlaces solo después de cerrar seguridad,
   privacidad y despliegue.
9. Probar en un Android físico el build 4 actualizado por OTA `preview` antes
   de cualquier opt-in push; no presentarlo como Play Store ni como app iOS.

**Nunca sembrar enlaces en foros y directorios.** Google lo llama *esquema
de enlaces*, lo detecta y el castigo es que el sitio entero baje o
desaparezca. Es la forma más rápida de conseguir lo contrario de lo que se
busca.
