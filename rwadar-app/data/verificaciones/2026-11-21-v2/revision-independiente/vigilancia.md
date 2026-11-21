# Revisión independiente · grupo «vigilancia» · 21/11/2026

Revisor independiente (no preparé estos expedientes). Abrí yo mismo cada
fuente primaria entre las **18:01 y las 18:10 UTC** del 21/11/2026. Copias en
`revision-independiente/fuentes/vigilancia/` (sin nombres de personas ni
documentos con datos personales; los PDF de Drive se descargaron solo para la
huella y se borraron).

## Veredicto

**Aprobado con cambios.**

- **Hausera · próximas ofertas: confirmado con cambios.** El estado y las
  fechas son correctos. Hay 4 correcciones obligatorias (abajo).
- **Las seis candidatas: no admitir, confirmado.** Ninguna tiene hoy una oferta
  abierta con documento, mínimo y acceso desde España respaldados.

## 1. Hausera: lo que comprobé

**¿Puede invertir hoy un particular en España? No.** Solo puede reservar,
previa alta y test del emisor. Suscribir las obligaciones empieza el
25/11/2026. Lo sostienen la web y el documento de emisión.

| Qué | Fuente y hora (UTC) | Literal corto | ¿Cuadra con el expediente? |
|---|---|---|---|
| Estado de Alicante 3 | https://hausera.io/propiedad/alicante_3/ · 18:02:30Z (navegador, 200) | «PREVENTA ABIERTA · Inicio de preventa: 18/11/2026 · Inicio de oferta pública: 25/11/2026 · … Reservar tickets» | Sí |
| Datos de la web | `page-data.json` de Alicante 3, Alicante 2 y Oportunidades · 18:01:19Z–18:01:20Z | `status=PRESALE`, `presaleDate=18/11/2026`, `launchDate=25/11/2026`; SHA-256 f95e3a75…, 8e94a545…, f9913b84… | Sí, byte a byte (y el sitemap, f21d8559…) |
| Alicante 2 | https://hausera.io/propiedad/alicante_2/ · 18:02:39Z | «FINANCIADA» | Sí |
| Mínimo | Documento de emisión (Drive 1cpWVN3J…) · 18:01:44Z · SHA-256 9170562a… (27 págs., creado 23/10/2026) | «Ticket mínimo: 100,00 euros» | Sí, misma huella |
| Calendario | Mismo documento, cuadro resumen y 5.9 | «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»; «Si a fecha 02/12/2026 no se hubiera alcanzado al menos el 50 %… (softcap)» | Sí |
| A quién va | Mismo documento, 5.7 y 5.8 | «… determinadas personas físicas … que no tengan la condición de inversor cualificado … analizará … para considerarlo idóneo»; «pueden optar por suscribir un Acuerdo de Reserva de Suscripción, mediante el cual adelantan fondos» | Sí |
| Reserva con dinero | https://hausera.io/terms/ · 18:03:07Z | «Tras la firma del Acuerdo de Reserva, el Usuario deberá realizar la transferencia bancaria» | Sí |
| Acuerdo de reserva | Drive 1vfq0Ljr… · 18:01:46Z | SHA-256 69cbadaf… | Sí, misma huella |
| Token | Polygon, contrato 0xbc10da13…C265 (la dirección sale del propio documento de emisión) · publicnode, 18:02:10Z, bloque 97.719.107 | `name()` = «Alicante_3», `totalSupply()` = 0 | Sí: no hay ningún token emitido |
| Inscripción en la CNMV | https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es y páginas 1 a 3 · 18:04:17Z–18:04:22Z | Ursus-3: 8 emisiones de Hausera (SPV y SPV 2 a SPV 8), la última del 23/10/2026; página 4 vacía | Sí: Alicante 3 (SPV 11) sigue sin inscribir |
| ¿Es plataforma registrada? | Listado de PSFP de la CNMV · 18:04:25Z | 28 proveedores; ninguno es Hausera ni Holdtx | Sí |
| ERIR designada | Ficha ESI de Ursus-3 · 18:04:28Z | Agencia de valores, n.º 251, 29/08/2013 | Sí |
| Advertencias | `ResultadoBusqueda?tipo=1&nombre=Hausera` y `…Holdtx` · 18:05:23Z y 18:05:25Z | «No hay datos disponibles.» | Sí (ver § 4: el «cambia» del vigía es un falso positivo) |
| Historial | https://hausera.io/ · 18:02:58Z | «42 operaciones realizadas · 24 terminadas · 128M€ total financiado» | Sí |

## 2. Los textos nuevos de la tarjeta

| Texto | Caracteres | Respaldo | Veredicto |
|---|---|---|---|
| Mínimo corto: «Desde 100 € · suscripción el 25/11» | 34 | Documento de emisión | **Cambiar** (corrección 1) |
| Mínimo de inversión: «Desde 100 € en Alicante 3 (documento de emisión); reserva desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.» | 116 | Documento (cuadro resumen y 5.9) y ficha web | Vale |
| Acceso desde España: «Particulares en España que pasen el alta y el test del emisor: reserva desde el 18/11 y suscripción desde el 25/11/2026.» | 120 | Documento (5.7, 5.8, 5.9) y términos | Vale; se puede mejorar (recomendación A) |
| Salida (sin cambios): «Cobras cuando se venden las viviendas (previsto en 20 meses, sin fecha cierta); sin mercado secundario garantizado.» | 115 | Documento | Vale |
| Aviso: «… Alicante 3 tiene la preventa abierta desde el 18/11/2026 y el 21/11/2026 aún no estaba inscrita en el registro de la CNMV.» | — | ERIR de Ursus-3, 18:04 UTC | Vale |
| Referencia «Historial que publica Hausera (consultado el 21/11/2026)» | — | Portada, 18:02:58Z | Vale |

Los tres textos están en castellano llano, sin «oportunidad», «rentabilidad»
ni promesas, y sin citas en otro idioma. El resumen, las métricas y los demás
avisos publicados solo llevan fechas del evento y siguen siendo ciertos hoy.

## 3. Correcciones obligatorias

1. **Mínimo corto: «Desde 100 € · suscripción desde el 25/11»** (40
   caracteres, el máximo). La suscripción es un periodo (del 25/11/2026 al
   30/06/2027), no un día. «Suscripción el 25/11» se lee como una cita de un
   solo día. Del 26 al 28/11, mientras la ficha siga vigente, parecería una
   fecha ya pasada, que es justo lo que se quejó Víctor. «Desde el 25/11» es
   cierto antes y después de esa fecha. También vale «Desde 100 € ·
   suscripción desde 25/11» (37). Descarto «abre el 25/11», como el
   investigador, porque la reserva ya está abierta desde el 18/11.
2. **El otro texto con la fecha de consulta.** En `transparencia.json`,
   `documentoEspana.motivo` de Hausera sigue diciendo «la CNMV no lo ha
   revisado y el 20/11/2026 la emisión aún no estaba inscrita». El expediente
   no lo cambia. Debe pasar al 21/11, con la misma forma que el aviso nuevo,
   por ejemplo: «… la CNMV no lo ha revisado. Alicante 3 tiene la preventa
   abierta desde el 18/11/2026 y el 21/11/2026 aún no estaba inscrita.»
   Prueba: la ERIR de Ursus-3 a las 18:04 UTC. Además hay que poner
   `consultadaEl: 2026-11-21` en `supervisada` (listado PSFP, 18:04:25Z) y en
   `documentoEspana`.
3. **Dónde se cambia (corrige el bloqueo del investigador).** El «(20/11)» no
   lo pone el motor:
   - el mínimo corto lo escribió el coordinador en
     `2026-11-20-v2/decisiones.json` → `transparencia.minimosCortos.hausera-proximas-ofertas`
     (`«antes: (13/11)», «después: (20/11)»`);
   - el motivo de `documentoEspana`, en `transparencia.textos`;
   - el texto largo venía del `resumenTarjeta.minimo` del expediente del 20/11.

   La cita de DECISIONES 20.2 («que pone el motor») habla del **comienzo del
   alcance** («Comprobado de nuevo en la fuente el …»), no del valor. El
   coordinador debe poner los tres textos nuevos en `decisiones.json` de esta
   entrega y comprobar que no aparece «(20/11)» ni «(21/11)» en el mínimo
   corto de la tarjeta.
4. **Datos personales en las copias del grupo** (fuera de `crudo/`). Se
   deben recortar o mover a `crudo/` antes de cualquier commit:
   - `grupos/vigilancia/fuentes/bit2me/bit2me-blog-autorizacion-2026-11-21.txt`,
     líneas 65, 69 y 82: nombres de dos directivos de Bit2Me;
   - `grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-21.txt`,
     líneas 124 y 126 (nombre de un directivo de Axiology) y líneas 240 y 244
     (nombre y **correo personal de trabajo** de un empleado de Profitus).

   Además, `grupos/vigilancia/fuentes/crudo/` **no está en `.gitignore`**
   (`git check-ignore` no da ninguna regla; solo se ignoran `*/vigia-crudo/`
   y `acceso/crudo/`). Tiene la ficha de la EAFN n.º 21, que es una persona
   física, y la portada de Hausera sin recortar. El coordinador no debe
   añadirla al commit.

**Recomendaciones (no bloquean):**

- **A. Acceso desde España**, para que responda directamente a la pregunta de
  Víctor sin usar «hoy», que caduca: «Particulares en España, tras alta y test
  del emisor: hasta el 24/11 solo reserva; suscripción desde el 25/11/2026.»
  (114 caracteres).
- **B.** Que el texto largo del mínimo use un solo formato de fecha (18/11/2026
  o 18/11 en las tres fechas).

## 4. El vigía

- En este grupo no hay **ningún dato con `"segunVigia": true`**: busqué en los
  7 expedientes y no aparece. No hay nada que muestrear ni que rechazar por
  esa regla.
- Las dos búsquedas de la CNMV que el vigía dio como «cambia» (Hausera y
  Holdtx) son un **falso positivo**. Lo comprobé así:
  - con un agente que no es navegador (`curl/8`), la página es estable y da
    exactamente la huella del vigía: Hausera 9a78fe54… (211.370 bytes,
    18:05:23Z) y Holdtx 9f100d8f… (211.348 bytes, 18:05:25Z);
  - con agente de navegador cambian el tamaño y la huella solo por campos
    ocultos de ASP.NET (`__VIEWSTATE`, `__EVENTVALIDATION`), y el texto es el
    mismo;
  - las dos dicen «No hay datos disponibles.»;
  - la búsqueda de control «Trading» sí da resultados.
- Con el mismo método reabrí las 12 búsquedas de advertencias de las
  candidatas (18:09:35Z–18:09:56Z). Las 12 huellas coinciden con las del
  expediente:
  - Prosegur, Minos, Securitize, Profitus, Axiology, Valorix, Bit2Me, Token
    City, Lornin y Cando: «No hay datos disponibles»;
  - Crypto.com y Foris: coincidencias de dominios clon, ajenos a la entidad.

## 5. Candidatas (todas: no admitir, confirmado)

| Candidata | Lo que abrí hoy (UTC) | Resultado |
|---|---|---|
| Pagarés de Prosegur Cash | ERIR de Minos (18:06:45Z, SHA-256 6d7eb7cb…, igual); información relevante de la CNMV (b13dcc7b…, igual); ISIN (mismo texto); JSON de Prosegur Cash (e1bb810f…, igual) | Solo «PROSEGUR CASH, S.A.» del 06/11/2026 en la ERIR. Sin documento, mínimo, destinatarios ni oferta abierta. |
| Securitize Stocks | https://securitize.io/investments/stocks (18:07:46Z) | «offered by Securitize Markets, LLC … to eligible investors in permitted jurisdictions». Sin lista de países, KID ni mínimo. |
| Bonos de Profitus/Axiology | API pública (18:06:54Z) | `total=552`; 6 abiertos, todos `loan_type: standard` (1 LV, 3 LT, 2 ES). Ningún bono. |
| Valorix (Bit2Me STX) | valorix.com e «invertir» (5ae0d7ef…, b233b45d…, iguales); blog de Bit2Me (18:06:55Z); ERIR de Bit2Me STX (42c61370…, igual) | «previsto para diciembre de 2026», «dirigido a inversores elegibles»; ERIR «No se han encontrado datos disponibles». |
| CANDO1 (Token City) | https://exchange.token-city.com/es (18:07:36Z); ERIR de Token City (12ac95b9…, igual) | «CANDO1 (CDO1) · En estudio». En la ERIR solo SERIES A GRUPO UAE SA (06/11/2026). |
| Crypto.com Tokenized Stocks (UE) | FSMA (f63e5d0f…, igual, 18:06:59Z); los tres PDF (1169bff5…, 8d5a498f…, 06d4eac0…, iguales); CNMV Foris n.º 4485 (19/01/2018); página de divulgaciones (301 a la portada, 18:07:46Z) | Libre prestación en Bélgica desde el 07/05/2026; nada sobre España. El KID solo está en la app. |

## 6. Bloqueos de esta revisión

- No pulsé «Reservar tickets» ni abrí cuenta (límite firme). No está comprobado
  que un residente en España pase el alta, y la web no publica cuánto se ha
  reservado.
- https://polygon-rpc.com da 403 («tenant disabled»). La consulta del token se
  hizo en polygon-bor-rpc.publicnode.com, la misma que usó el investigador.
- No reabrí la ficha de la CySEC ni las respuestas de la FAQ de Securitize
  (siguen siendo del 13/11). No cambian la decisión: las dos candidatas se
  quedan fuera por otros motivos comprobados hoy.
- La página de divulgaciones de Crypto.com redirige a la portada (301). No se
  intenta saltar.
