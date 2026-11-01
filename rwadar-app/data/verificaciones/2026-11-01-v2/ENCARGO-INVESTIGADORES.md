# Encargo común · investigación del catálogo · 1 de noviembre de 2026

Ciclo iniciado manualmente por Víctor el 01/11/2026 («haz la investigación» en
el chat: actualizar las ofertas publicadas y encontrar nuevas con el criterio de
RWAdar). Este encargo autoriza **solo investigación y expedientes locales**.

## Lo que NO se hace (sin excepciones)

- Nada de iniciar sesión, KYC, rellenar formularios, conectar wallets, pulsar
  «invertir», crear cuentas ni enviar correos. Solo páginas y documentos públicos.
- Nada de publicar web, tocar Supabase, SQL remoto, EAS, ni comandos `git` que
  cambien estado (commit, checkout, stash, reset, push). El coordinador hace los commits.
- Solo escribes dentro de tu carpeta asignada y en `expedientes/<slug>.json` de
  tus slugs. No edites otros archivos del repositorio.
- No copies datos personales (DNI, nombres de inversores, direcciones privadas)
  ni documentos restringidos. Si una URL lleva firma o token (`?X-Amz-Signature`,
  `token=`…), guárdala recortada y anota «URL firmada recortada».

## Criterio de selección de RWAdar (los cuatro criterios del Método)

1. **Entidad y permisos.** Qué entidad legal comercializa, quién emite, qué
   vehículo y qué token/derecho se adquiere. Licencia o registro **consultado en
   el registro del regulador** (CNMV, BaFin, FMA-AT, FMA-LI, AMF, FINMA, MAS,
   Banco de España, ESMA, etc.) y su alcance exacto. Una licencia de la entidad
   no acredita cualquier producto ni su distribución en España.
2. **Actividad y fecha.** Qué se observa hoy (abierta, cerrada, agotada, solo
   reventa, próxima) y en qué fecha. Fecha del dato ≠ fecha de consulta.
3. **Acceso y condiciones.** Acceso desde **España** (lista de países, residencia,
   tipo de inversor: minorista / acreditado / profesional), mínimo y moneda,
   comisiones de entrada/gestión/salida, custodia y titularidad, mecanismo de
   salida y liquidez, plazos. Mercado primario vs. reventa vs. mera referencia.
4. **Riesgos y alertas.** Advertencias documentadas (folleto, KID, términos),
   advertencias de reguladores (consulta la lista de advertencias de la CNMV
   y de otros supervisores por el nombre exacto de la entidad), incidencias.

Reglas que no se negocian:

- **Una cifra que no se puede comprobar en su fuente primaria no se publica.** Un
  hueco (`null`) es correcto; una cifra inventada no. No deduzcas cifras de
  imágenes. No conviertas un objetivo/expectativa en rendimiento.
- Distingue APY / YTW / TIR objetivo / NAV / precio; bruto / neto; histórico /
  objetivo / variable; divisa y clase. Anota base de cálculo y plazo.
- Si dos fuentes discrepan (portada vs. contrato vs. KID vs. API), regístralo
  como conflicto y explícalo; no elijas la cifra más atractiva.
- Portada, buscador, resumen de IA o agregador **no sustituyen** el documento
  primario. Úsalos solo para descubrir. Las afirmaciones van a fuente primaria.
- Si no puedes leer una fuente (bloqueo, 403, Cloudflare), registra el bloqueo,
  el último dato realmente comprobado y la incertidumbre. No marques como
  «consultada hoy» lo que no leíste.
- Para una **candidata nueva**, solo propón «admitir» si tienes, con fuente
  primaria citable: entidad + registro regulador, estado (abierta o reventa
  activa), acceso/elegibilidad que no excluya a residentes en España (o lo diga
  con precisión), mínimo o precio de entrada, mecanismo de salida y riesgos.
  Si falta algo esencial: `no_admitir` con el motivo concreto.
- Qué buscamos para «nuestros clientes»: inversores particulares residentes en
  España. Prioriza ofertas **accesibles desde España** y documentadas. Las de
  solo acreditados/institucionales pueden entrar pero marcadas como tal y con
  menor prioridad. Nunca presentes algo como recomendación.

## Herramientas

- `curl -sS -A "Mozilla/5.0" URL` y Python (`pypdf` 6.17, `pdftotext`).
- Navegador: Playwright para Node está instalado (`NODE_PATH=$(npm root -g) node script.cjs`,
  `chromium.launch()` sin opciones). Midas (midas.app) devuelve desafío de
  Cloudflare: prueba `docs.midas.app`, `midas.app/llms.txt`, APIs públicas y
  WebFetch; si todo falla, registra el bloqueo.
- WebSearch / WebFetch: cárgalas con ToolSearch (`select:WebSearch,WebFetch`).
- Guarda copias de lo leído en tu carpeta `fuentes/<grupo>/` (HTML/JSON/texto
  extraído; PDF solo si pesa < 3 MB) y un `inventario-consultas.json` con
  `url`, `archivo`, `http`, `consultadoUtc` (hora real), `bytes`, `sha256`.

## Formato del expediente (`expedientes/<slug>.json`, uno por oferta)

```json
{
  "slug": "slug-de-la-oferta",
  "tipoExpediente": "publicada | candidata",
  "grupo": "nombre-del-grupo",
  "proveedor": "Nombre comercial de la plataforma",
  "plataformaSlug": "slug del radar si existe",
  "entidadComercializadora": "Razón social exacta",
  "emisor": "Razón social del emisor",
  "vehiculo": "SPV / fondo / compartimento / sociedad",
  "token": "nombre, red y contrato si consta",
  "derechoAdquirido": "qué se compra realmente",
  "jurisdiccion": "ISO",
  "identificador": "ISIN / LEI / ID si existe",
  "moneda": "EUR | USD | CHF…",
  "documentos": [{"titulo": "", "url": "", "versionOFecha": "", "paginas": null, "sha256": null, "leido": true}],
  "registros": [{"regulador": "", "entidad": "", "numero": "", "url": "", "alcance": "", "consultadoUtc": ""}],
  "advertenciasReguladores": [{"regulador": "CNMV", "busqueda": "", "resultado": "sin coincidencias | coincidencia: …", "url": "", "consultadoUtc": ""}],
  "claims": [{
    "campo": "estado | minimo | precio | rentabilidad | comisiones | custodia | salida | accesoEspana | derecho | riesgos | …",
    "literal": "texto exacto breve (máx. ~200 caracteres)",
    "dato": "valor normalizado o null",
    "fuentePrimaria": "https://…",
    "localizador": "documento, versión, página/sección",
    "fechaDato": "AAAA-MM-DD o null",
    "consultadoUtc": "AAAA-MM-DDTHH:MM:SSZ",
    "alcanceYLimites": "moneda, clase, residencia, discrepancias",
    "estado": "respaldado | respaldado_con_alcance | en_conflicto | no_verificable"
  }],
  "criterios": {
    "entidadYPermisos": {"veredicto": "cumple | cumple_con_limites | no_cumple | no_verificable", "nota": ""},
    "actividadYFecha": {"veredicto": "", "nota": ""},
    "accesoYCondiciones": {"veredicto": "", "nota": ""},
    "riesgosYAlertas": {"veredicto": "", "nota": ""}
  },
  "estadoOferta": "abierta | cerrada | agotada | solo_reventa | proxima | no_verificable | desaparecida",
  "disponibleEs": "confirmado | solo_acreditados | no_confirmado | excluido",
  "cambiosRespectoPublicado": [{"campo": "", "antes": "", "ahora": "", "fuente": "", "critico": true}],
  "propuestaTarjeta": {
    "titulo": "", "categoria": "Inmobiliario | Tesoro y fondos | Crédito privado | Materias primas | Acciones y capital privado | …",
    "pais": "ISO o UE", "tipo": "rendimiento | valor", "coleccion": "principales | secundario | en_camino",
    "resumen": "1–2 frases neutras, sin promesas",
    "rentabilidad": {"mostrada": "x,xx %", "literal": "qué es exactamente esa cifra"},
    "metricas": [{"etiqueta": "", "valor": ""}],
    "avisos": [""],
    "url": "URL oficial de la oferta", "fuentesActuales": ["…"],
    "lugar": "Ciudad · País (para la ilustración)",
    "pasos": ["≤ 4 palabras", "≤ 4 palabras", "≤ 4 palabras"],
    "concepto": "completa «Ilustración editorial de …», sin marcas ni cifras"
  },
  "decision": "mantener | actualizar | retirar_propuesta | admitir_propuesta | no_admitir",
  "motivoDecision": "",
  "bloqueos": [""],
  "consulta": {"inicioUtc": "", "finUtc": ""}
}
```

`propuestaTarjeta.rentabilidad` va a `null` si la cifra no se sostiene hoy. Los
«pasos» describen el mecanismo real («Compras si hay oferta», «Reparto o
reventa»), sin cifras, marcas ni promesas. `concepto` sin marcas comerciales.

## Entrega

Además de los expedientes, escribe `resumen-<grupo>.md` en tu carpeta de grupo,
en español llano: qué revisaste, qué cambia en cada oferta publicada (con
fuente), qué candidatas nuevas propones admitir y por qué, cuáles no y por qué,
bloqueos y conflictos. Tu respuesta final al coordinador: un resumen breve de
lo mismo (máx. 400 palabras) con la lista de slugs y decisión.

## Enfoque de Víctor para los clientes (añadido el 01/11, 14:57 UTC)

Víctor pide pensar en **nuestros clientes: el inversor particular común en
España**. Queremos ofertas que, al verlas, hagan pensar «uau, qué ofertas tiene
esta plataforma», que le ahorren horas de búsqueda y que le den la confianza
suficiente para invertir de verdad. La confianza se gana así:

- **Se puede comprar de verdad desde España**, hoy, como particular (no solo
  acreditados o institucionales), con KYC normal.
- **Entrada asequible** (mínimo bajo y claro) y **moneda** indicada.
- **Entidad regulada y verificable** en el registro del supervisor, con nombre
  exacto, y sin advertencias de la CNMV.
- **Documentos claros** (folleto, KID en español si existe, términos) y una
  **cifra real y reciente** con su fuente y su base (nunca inventada ni inflada).
- **Salida explicada**: cómo y cuándo se recupera el dinero, con sus límites.
- **Riesgos dichos con claridad.**

Consecuencias para tu trabajo:

1. Prioriza la profundidad en las ofertas que mejor cumplen lo anterior. Mejor
   pocas ofertas excelentes y documentadas que muchas dudosas.
2. En las publicadas, señala las que hoy restan confianza (cerradas,
   desaparecidas, sin datos verificables durante semanas, solo acreditados) y
   propón `retirar_propuesta` o agruparlas, con fuente y motivo. La retirada
   solo la decide Víctor.
3. Rellena las **métricas que ahorran tiempo** al cliente en `propuestaTarjeta.metricas`
   (p. ej. «Mínimo», «Supervisor», «Reembolso», «Comisión de gestión»,
   «Rentabilidad publicada · base y fecha»), siempre con su claim respaldado.
4. Añade al expediente un bloque interno (no se publica, no es una puntuación
   ni una recomendación al cliente) para que el coordinador seleccione:

```json
"prioridadEditorial": {
  "compraDesdeEspanaComoParticular": "si | no | no_confirmado",
  "minimoEntrada": "texto con moneda o null",
  "supervisorVerificado": "nombre del supervisor y registro, o null",
  "documentacionClara": "si | parcial | no",
  "salidaExplicada": "si | parcial | no",
  "cifraRecienteVerificada": "si | no",
  "porQueDestaca": "una frase factual, sin adjetivos promocionales",
  "porQueNo": "una frase con lo que falla, si algo falla"
}
```

5. La tarjeta sigue sin promesas ni superlativos: lo que impresiona es el dato
   comprobado («Desde 1 €», «Supervisado por la AMF», «Reembolso diario»), no el
   adjetivo. No ordenamos ni elegimos por rentabilidad.
6. **Guarda cada expediente en cuanto lo termines** (no al final): la sesión
   anterior se cortó por límite de uso y se perdió trabajo no guardado.
