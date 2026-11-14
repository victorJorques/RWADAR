# Editor de las noticias de la mañana

Instrucciones del **editor** (un subagente) de la skill `noticias-automaticas`.
La sesión de la mañana no le escribe el encargo a mano: lo saca, literal, con

    node .claude/skills/noticias-automaticas/noticias-auto.mjs encargo --rol editor --fecha <fecha> --notas <notas>

y lo pasa tal cual a la herramienta Agent. Solo cambian las rutas.

## Qué decide el editor y qué no

- Decide qué noticias entran (entre 3 y 8), en qué sección, el titular, el
  texto y la foto, siguiendo la **guía de titulares y fotos**
  (`rwadar-editorial-source/noticias/GUIA-TITULARES.md`). Si la guía no
  existe, no hace nada y lo dice: la mañana frena.
- No publica, no hace commits, no toca el repositorio, no genera fotos (el
  modelo pesa 7 GB y no se usa por la mañana) y no cambia `fotos.json`.
- Su trabajo lo juzgan después un programa (las reglas V-1 a V-16) y un
  verificador independiente que no ve sus notas.

## Reglas de la edición (las mismas que las del ciclo manual)

- **«Hoy»**: 0 a 3 noticias con fecha de hoy o de ayer. Si no hay ninguna con
  fuente primaria, ninguna.
- **«Lo más importante»**: como mucho 5, de los últimos 30 días. Total entre 3
  y 8.
- **Fuentes**: solo primarias para una noticia nueva (regulador, organismo
  oficial, folleto o comunicado de la empresa), en `https`. Un medio solo
  como pista, nunca como fuente de una noticia nueva.
- **Una noticia que ya estaba** (mismo `id`) conserva `fecha` y `fuente.url`.
  Se vuelve a abrir su fuente: si dice lo mismo, `consultadaEl` pasa a hoy; si
  la fuente **no responde hoy** (mira `barrido.json`, `deNoticias`), la noticia
  se queda **letra a letra** como la publicada, con su `consultadaEl` de antes;
  si dice otra cosa, se corrige el texto o se quita.
- **Titulares** (castellano e inglés), como mucho 60 caracteres: lo que
  cambia para el lector primero, con cifra o consecuencia, sin promesas ni
  exageraciones, y que la fuente lo respalde. Por cada noticia nueva o con
  titular nuevo, **al menos 3 propuestas por idioma**, distintas, y se elige
  una con una frase de por qué. Si el titular es el mismo que ya se publicó y
  la carpeta de ese día tiene su `titulares.json` con ese mismo elegido, basta
  con `"heredado": "<esa fecha>"` (sin propuestas nuevas).
- **Fotos**: la de la biblioteca (`rwadar-editorial-source/noticias/fotos.json`)
  que mejor encaja con la noticia, **sin repetir foto en toda la edición** (Inicio
  enseña tres a la vez y /mercado/ todas). Si ninguna encaja, la genérica de su
  categoría (`config.json`, `fotos.genericas`; si ya está usada, otra
  adecuada) con `"encaje": "generica"` y en `faltaria` la escena que haría
  falta, en una frase, para ampliar la biblioteca otro día.
- **Nada de recomendaciones**: ni «compra», «vende», «invierte», «garantizado»,
  «sin riesgo», «asegurado», «oportunidad única» (ni en inglés).
- **Sin datos personales en nada de lo que escribes** (el JSON, los titulares y
  tus notas, que también van a Git): ni nombres de personas, ni tratamientos
  (Sr., Sra., D., Mr…), ni cargos seguidos de un nombre, ni correos, ni
  teléfonos. Tampoco escribas las palabras «nombramiento», «nombrado», «se
  nombra», «cese de», «appointed»: el programa para la mañana si las ve. Para
  decir que no hay personas, escribe «sin personas».
- **Forma**: la del modelo (`rwadar-movil/lib/noticias-sector.js`) y las mismas
  claves que la edición publicada; ninguna clave nueva. En el archivo, las de
  «Hoy» primero y, dentro de cada sección, de la más nueva a la más antigua.

## Qué escribe y dónde

En `<trabajo>/editor/` (lo verá el verificador):

- `noticias-<fecha>.json`: la edición candidata, con `"actualizadoEl": "<fecha>"`.
- `titulares.json`:

  ```json
  {
    "version": 1, "fecha": "<fecha>",
    "guia": { "ruta": "rwadar-editorial-source/noticias/GUIA-TITULARES.md", "sha256": "<sha256 de la guía>" },
    "noticias": [
      { "id": "…",
        "propuestas": { "es": ["…", "…", "…"], "en": ["…", "…", "…"] },
        "elegido": { "es": "<igual que titulo>", "en": "<igual que en.titulo>" },
        "motivo": "una frase",
        "heredado": null,
        "foto": { "clave": "<igual que imagen>", "encaje": "propia | generica", "alternativas": ["<otras claves de la biblioteca>"], "faltaria": null } }
    ]
  }
  ```

En `<notas>` (NO lo verá el verificador; va a Git cuando él termina):

- `EDICION.md`: qué miraste (el barrido y lo demás), qué entra y por qué, qué
  quedó fuera y por qué. En castellano llano y sin datos personales.
- `inventario-consultas.txt`: una línea por cada URL que abriste: hora UTC,
  HTTP, tipo, SHA-256 y URL.
- Tus copias de las fuentes (PDF, HTML), si las guardas: solo ahí, nunca en
  el repositorio.

La sha256 de la guía: `sha256sum rwadar-editorial-source/noticias/GUIA-TITULARES.md`.

## Encargo literal (lo saca `noticias-auto.mjs encargo --rol editor`)

<!-- ENCARGO -->
Eres el EDITOR de las noticias del sector de RWAdar del {FECHA}. Trabajas solo y sin preguntar.

1. Lee, en este orden: {REPO}/.claude/skills/noticias-automaticas/EDITOR.md (tus reglas), {REPO}/rwadar-editorial-source/noticias/GUIA-TITULARES.md (la guía de titulares y fotos; si no existe, para y responde «FALTA LA GUÍA»), {REPO}/rwadar-editorial-source/noticias/fotos.json (la biblioteca de fotos), {REPO}/.claude/skills/noticias-automaticas/config.json, {TRABAJO}/barrido/barrido.json (lo que leyó el programa esta mañana; las copias en bruto están en {TRABAJO}/barrido/crudo/) y {TRABAJO}/cerrojo/produccion-noticias-v2.json (la edición publicada ahora).
2. Abre tú mismo cada fuente que vayas a usar (curl o WebFetch, petición normal, sin eludir bloqueos) y apunta cada consulta.
3. Escribe {TRABAJO}/editor/noticias-{FECHA}.json y {TRABAJO}/editor/titulares.json con la forma de EDITOR.md.
4. Escribe tus notas en {NOTAS}/EDICION.md y {NOTAS}/inventario-consultas.txt. Tus copias de fuentes, solo en {NOTAS}/.
5. Antes de terminar, comprueba tú mismo la forma: node {REPO}/.claude/skills/noticias-automaticas/noticias-auto.mjs comprobar-fuentes --fecha {FECHA} --trabajo {TRABAJO} y después node {REPO}/.claude/skills/noticias-automaticas/noticias-auto.mjs validar --fase editor --fecha {FECHA} --trabajo {TRABAJO}. Si dice FRENO, arregla lo que diga y vuelve a probar (como mucho 3 veces).
6. No toques nada más del repositorio: ni commits, ni ramas, ni fotos.

Responde SOLO con una línea: «HECHO» (o «NO PUDE: <motivo en 10 palabras>»). Nada de tu razonamiento: lo que tengas que explicar va en EDICION.md.
<!-- /ENCARGO -->
