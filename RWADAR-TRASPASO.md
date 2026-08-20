# RWAdar · traspaso

**Para quien recoge el proyecto.** Escrito el 17 de agosto de 2026.
Léelo entero antes de tocar nada: son cinco minutos y evita los errores
que este proyecto ya ha pagado.

Empieza por `CLAUDE.md` (mapa general) y `RWADAR-MAPA.md` (dónde está
cada cosa). Este archivo cuenta **en qué punto se dejó** y **por qué**.

---

## 1 · Estado en una frase

La web está terminada y en línea. Encima se acaba de construir un
**«Booking de tokenización»** —listar las emisiones abiertas, no solo las
plataformas— que está **probado pero sin publicar**, porque al ir a
cargar datos reales resultó que hoy no hay casi nada abierto.

## 2 · Qué está en línea y qué no

| | Estado |
|---|---|
| Web pública, 26 fichas + 4 descartadas | **En línea** |
| Instalable como app (PWA) | **En línea** |
| Cuentas, opiniones, moderación, avisos push | **En línea** |
| Arreglo de la contraseña (mínimo 12) | **En línea** |
| Arreglo de la equis de «Tu cuenta» | **En línea** |
| Adelgazado al publicar (104 → 84 kB por la red) | **En línea** |
| Tablas `emisiones` + vistas en Supabase | **Aplicadas en producción** (vacías) |
| Sección «Abierto ahora mismo» en la web | **Hecha, probada, SIN PUBLICAR** |
| Emisiones reales cargadas | **Ninguna todavía** ← aquí se paró |

`node rwadar-arrancar.js` dirá «lo publicado NO coincide con lo local».
Es correcto y deliberado: lo local lleva la sección de emisiones.

## 3 · Lo que se hizo, por commits

- `addd594` La tarjeta de emisión asume que en tokenización lo minorista
  casi nunca cierra: cinco formas de decir en qué momento está algo.
- `f672643` El esquema corregido contra la realidad (migraciones 19-21).
- `b07f974` Las emisiones abiertas: esquema 18, 28 pruebas, sección web.
- `900c83a` El adelgazador: la fuente y lo publicado dejan de ser el
  mismo archivo.
- `40da1d7` La contraseña pedía 8, el servidor exigía 12 y el aviso
  decía 8.
- `b19eccd` La equis de «Tu cuenta» no cerraba y dejaba la página muerta.

## 4 · EL HALLAZGO QUE CAMBIA EL PRODUCTO

Se construyó el escaparate y al ir a llenarlo, **estaba vacío**. Medido
el 16 de agosto de 2026 con los filtros de las propias plataformas:

| Plataforma | Abiertas | Cómo se comprobó |
|---|---|---|
| Reental (España, en el radar) | **0** | 9 inmuebles, todos «Financiado» / «En explotación» / «En reforma». No existe el estado «disponible» |
| Hausera (española, NO en el radar) | **0** | Su filtro «Abiertas» devuelve cero. 14 financiadas, 22 cerradas |
| Domoblock | — | **Descartada** por declarar que no la supervisa la CNMV |
| Lofty (EE. UU.) | — | Sirve página reducida a navegadores automáticos. **No lo esquives** |
| Republic (EE. UU.) | — | Rondas de startups Reg CF, no activos reales |
| Blocksquare | — | Infraestructura B2B: no vende a personas, nunca tendrá emisiones |
| **Midas** (UE) | **~10 productos** | Reales: mTBILL, mBASIS, mWIN (con Wellington). 3,2 %–29,9 %. 599 M$ |

**La conclusión, y es la clave del proyecto ahora mismo:**

> En tokenización inmobiliaria española hoy no hay nada abierto. Lo que
> sí se puede comprar son **productos continuos** (oro, fondos del
> Tesoro, estrategias tokenizadas), que están abiertos siempre.

Y el dato que abre el camino: **Hausera lleva 38 operaciones**. No es que
no abran nunca; abren, se llenan en días y cierran. Hoy toca vacío.

**Por tanto el producto no es la lista, es el aviso:** «avísame cuando
abra una nueva». Eso hace volver a la gente en un mercado intermitente, y
**ya está construido** (cuentas + seguimiento + push, probado en
producción). Solo hay que apuntarlo a las emisiones.

## 5 · Lo que falta, en orden

1. **Cargar Midas.** Es real, europea, comprobable en abierto y ya está
   en el radar. Con eso la sección deja de estar vacía. Sus productos son
   `continua = true`: sin fecha de cierre ni objetivo.
2. **Publicar la sección.** `node rwadar-publicar.js`. Si se publica
   vacía, la web ya enseña un estado vacío honesto que invita a crear
   cuenta para recibir avisos — es defendible, pero mejor con contenido.
3. **El aviso de emisión nueva.** El producto de verdad. Reaprovechar
   `seguimiento` + `avisos_pendientes`.
4. **Terminar la investigación del sector inmobiliario.** Se quedó a
   medias por un límite de uso. Dos preguntas concretas y sin responder:
   - **¿Reental está registrada en la CNMV?** Su web dice literalmente
     que tokeniza «desde España **bajo los criterios de** la CNMV».
     «Bajo los criterios de» NO es «registrada en», y esa diferencia es
     exactamente lo que mide el criterio 01. **No es una acusación: es
     una comprobación pendiente.** Hace falta el número de registro, o la
     búsqueda que demuestre que no aparece. El buscador de la CNMV es un
     formulario ASP.NET antiguo que no devolvió resultados; probar por
     otra vía.
   - **Hausera y Equito**: los cuatro criterios, y sobre todo si son
     tokenización real o crowdfunding con otro nombre. Hausera declara
     103 M€ financiados y 16,41 % histórico, pero **no está en el radar**
     y no puede entrar sin pasar el filtro.
5. **Dominio propio.** Lo único que separa esto de parecer serio. Cuesta
   ~12 €/año y **lo tiene que comprar Víctor**.

## 6 · Reglas que NO se negocian

Están puestas en la base de datos a propósito, no en la buena voluntad de
quien mete los datos. Si algo te las salta, es un fallo.

1. **Ninguna descartada sin fuente.** Es el mayor riesgo legal del
   proyecto. `node rwadar-arrancar.js` lo comprueba.
2. **Ninguna emisión sin enlace https a su origen.** La cifra que se
   publica es la que dice la plataforma, y cualquiera debe poder
   comprobarla en un clic.
3. **Ninguna emisión sin fecha de comprobación.** La vista
   `emisiones_rancias` saca las de más de 7 días.
4. **No se promociona a quien no pasa el filtro.** Un disparador rechaza
   emisiones de plataformas fuera del radar, y si una cae, sus emisiones
   se cancelan solas. *Ya funcionó: rechazó la emisión de Domoblock.*
5. **Un hueco es correcto; una cifra inventada es un problema legal.** Si
   la plataforma no publica rentabilidad, la tarjeta no pinta cifra.
6. **Lo patrocinado se marca y NO altera el orden.** Si se comprara el
   orden, el orden dejaría de significar nada.
7. **Publicar solo con `node rwadar-publicar.js`.** Nunca `netlify
   deploy` a secas.

## 7 · Trampas técnicas, todas medidas

- **Las cifras solo existen tras ejecutar el JavaScript.** En Urbanitae,
  el HTML servido decía *719.976 €* y la pantalla mostraba *899.970 €*.
  Un `fetch` normal habría publicado cifras de dinero equivocadas desde
  el enlace correcto. **Hace falta navegador real, no HTTP.**
- **Lofty sirve una página reducida a navegadores automáticos.** Es su
  decisión: no la esquives.
- **`Intl` no existe en el pre-renderizado.** Usarlo tumba la
  publicación. Los miles y las fechas se formatean a mano.
- **El panel de vista previa no compone fotogramas**: las transiciones
  CSS no avanzan y un panel deslizante se mide *fuera de pantalla*
  (`elementFromPoint` devuelve `null`). Inyecta
  `*{transition:none !important}` antes de medir.
- **Postgres no deja usar un valor de enum recién creado en la misma
  transacción.** Por eso las migraciones 19 y 20 van separadas.
- **Lo que se sube es `rwadar-publicado/`, no `rwadar-site/`.** La
  primera se genera adelgazando la segunda. Nunca edites la generada.
- **El `.gitignore` es lista blanca.** Un archivo nuevo hay que
  readmitirlo; no lo fuerces con `-f`. Y **el repositorio es público**:
  en esta carpeta hay documentos personales, así que jamás escribas
  credenciales en disco.
- **Los fallos de interfaz de este archivo vienen siempre de lo mismo**:
  dos cosas distintas compartiendo nombre o vocabulario. Ha pasado cuatro
  veces (`.velo`, `.vacio`, `.cuenta`, y el cierre del panel de cuenta).
  Antes de buscar a ciegas, pasa el barrido de selectores CSS duplicados
  y comprueba que cada apertura tenga su cierre simétrico.

## 8 · Comandos

```bash
node rwadar-arrancar.js                 # diagnóstico + servidor local
node rwadar-publicar.js                 # sincroniza, pre-renderiza, adelgaza y publica
node rwadar-publicar.js --local         # todo menos publicar
cd rwadar-app && node probar-produccion.mjs    # contra la base real, se limpia sola
cd rwadar-app && node probar-emisiones.mjs     # 28 pruebas del esquema de emisiones
```

Migraciones aplicadas en producción: `18_emisiones.sql`,
`19_emisiones_estados.sql`, `20_emisiones_realidad.sql`,
`21_emisiones_continuas.sql`. Aplicarlas requiere un **token personal de
Supabase de Víctor**; el asistente no debe manejarlo ni escribirlo en
disco.

## 9 · Lo que solo puede hacer Víctor

1. **Comprar el dominio** (~12 €/año).
2. **Las cuentas de tienda**: Google Play (25 $) y Apple (99 $/año). Ya
   no bloquean el acceso a la app: la web se instala desde el navegador.
3. **Media hora con un abogado antes de cobrar el primer euro** a una
   plataforma por destacar. Cobrar por destacar productos de inversión
   tiene normas propias en España. El código ya sabe etiquetar lo
   patrocinado; falta confirmar que se puede cobrar y cómo.
4. **Revocar el token de Supabase** que se usó para aplicar las
   migraciones (*Account → Access Tokens*).

## 10 · El modelo de negocio, decidido

Booking de **tokenización** (no se mezcla crowdfunding). Gratis los
primeros años. Cuando se cobre, **a las empresas, no a las personas**.

Y la separación que lo sostiene, copiada de Booking: **Booking no puntúa
los hoteles, los puntúan los usuarios.** El veredicto editorial —en el
radar o descartada, con su fuente— **no se vende nunca**. Se cobra por
presencia, herramientas y API. El día que se descarte a un cliente y se
publique con su fuente, esa decisión será la mejor publicidad; si no se
puede tomar, no hay producto.

## 11 · Cómo trabaja Víctor

- **Rechaza lo que no puede ver funcionando.** Ejecuta de punta a punta y
  enséñale el resultado —captura, medida, salida real—, no la intención.
- Da notas sobre 10 y pide iterar. Cuando dice que algo está soso o
  falso, suele tener razón.
- Pide explicaciones en lenguaje llano. Si le sueltas jerga, se pierde y
  lo dice.
- No escribas archivos con `Set-Content` de PowerShell: mete BOM y ha
  roto JSON dos veces.
- En su terminal `npx` falla por la ExecutionPolicy: usa `npx.cmd` y
  `npm.cmd`.
