# Revisión independiente · grupo «vigilancia» · 12/11/2026

No preparé estos expedientes. Volví a abrir yo mismo cada fuente primaria hoy, 12/11/2026,
entre las **00:51 y las 00:56 UTC**, sin iniciar sesión, sin KYC y sin saltar ningún
filtro. Las copias de lo leído están en `fuentes/vigilancia/`, con su
`inventario-revision.json` (URL, hora UTC, código HTTP, bytes y SHA-256). Las respuestas
en bruto se quedan fuera del repositorio. Los PDF de Hausera llevan datos personales:
solo anoto su SHA-256 y los borré después de leerlos.

## Veredicto

**Aprobado con cambios.** Las siete decisiones se sostienen: Hausera se mantiene y las
seis candidatas no se admiten. Hay **una corrección obligatoria**: una copia del grupo
lleva nombres de personas físicas (ver el último apartado). No afecta a lo publicado.

| Ficha | Decisión del investigador | Mi veredicto |
|---|---|---|
| Hausera · próximas ofertas (publicada) | mantener | confirmado |
| Pagarés de Prosegur Cash | no_admitir | confirmado |
| Securitize Stocks | no_admitir | confirmado |
| Bonos de Profitus/Axiology | no_admitir | confirmado |
| Bono Valorix (Bit2Me STX) | no_admitir | confirmado |
| CANDO1 (Token City) | no_admitir | confirmado |
| Acciones tokenizadas de Crypto.com (EEE) | no_admitir | confirmado |
| Copias del grupo (datos personales) | «recortados» | **confirmado con cambios** |

No hay cambios críticos, ni `admitir_propuesta`, ni `retirar_propuesta` que revisar.
Las siete fichas son «sin cambios», así que las comprobé todas, no por muestreo.

## Hausera · próximas ofertas · confirmado

Lo que comprobé:

- **Alicante 3 sigue «PRÓXIMA OPORTUNIDAD».**
  - Ficha en el navegador (https://hausera.io/propiedad/alicante_3/, 00:52:17Z, HTTP 200):
    «Preventa: 18/11/2026 09:00h», «Inicio de oferta pública: 25/11/2026», botón «Reservar
    tickets» (no lo pulsé).
  - Datos públicos (`page-data.json`, 00:51:50Z, mismo SHA-256 que el investigador,
    `8f323413…`): `status COMMINGSOON`, `presaleDate 18/11/2026`, `launchDate 25/11/2026`.
- **Alicante 2 sigue «FINANCIADA»** en su ficha (00:52:17Z). En los datos públicos
  (`2f9272ee…`, igual que el investigador) su estado es `FUNDED`.
- **Los cuatro PDF son idénticos** (descarga pública de Google Drive, 00:51:50Z):
  - documento de emisión `9170562a…`;
  - acuerdo de reserva con la escritura `69cbadaf…`;
  - dossier `72a312e2…`;
  - documento de Alicante 2 `d3d7dd40…`.
  - En el documento de emisión siguen los literales «Ticket mínimo: 100,00 euros», «no es
    considerado un folleto informativo» y el periodo de suscripción «hasta el 30/6/2027»
    (relectura a las 00:55:58Z).
- **Siguen sin inscribir en la CNMV.**
  - Registro ERIR de Ursus-3, págs. 1 a 3
    (https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es, 00:51:20Z):
    los bytes coinciden con los del investigador.
  - De Hausera figuran la SPV y las SPV 2 a 8; la última es del 23/10/2026. No hay
    ninguna línea con «SPV 9», «SPV 10» ni «SPV 11».
  - Ursus-3 es la agencia de valores nº 251 (ficha ESI, 00:55:46Z).
- **En Polygon** (nodo público, 00:51:54Z), el contrato Alicante_2 tiene 51.960 tokens y el
  de Alicante_3, 0.
- **Advertencias de la CNMV** (00:51:35Z): «Hausera» y «Holdtx» dan «No hay datos
  disponibles». El buscador funciona: «Trading» devuelve 16 páginas. El PDF de otras
  entidades tiene el mismo SHA-256 (`5e63b537…`).

**Los textos de la tarjeta.** Lo publicado sigue siendo exacto. Los dos cambios
opcionales que propone el investigador están respaldados hoy:

- el aviso «El 12/11/2026 Alicante 3 aún no estaba inscrita…»;
- la fecha (12/11) del mínimo.

Los tres textos de `resumenTarjeta` cumplen las normas:

| Texto | Longitud | Fuente que lo respalda |
|---|---|---|
| mínimo | 92 caracteres | documento de emisión |
| acceso desde España | 116 caracteres | documento de emisión, apartado 5.7 |
| salida | 115 caracteres | 2.3.5 y duración de 20 meses en la ficha |

Están en castellano llano, sin citas literales ni promesas.

Nota sin consecuencias: la página no dice en qué zona horaria están las «09:00h». La
cuenta atrás del navegador (UTC) apunta a las 09:00 UTC. No pongas la hora en la tarjeta
sin zona horaria. Ahora no la lleva.

## Candidatas · todas no_admitir, confirmado

- **Prosegur Cash.**
  - ERIR de Minos (00:51:20Z, mismos bytes que el investigador): solo la «1ª Emisión de
    Pagarés Prosegur Cash 2026», de 500.000 €, inscrita el 06/11/2026.
  - La comunicación más reciente a la CNMV es del 03/11/2026. La lista de ISIN no cambia.
  - Los JSON de prosegurcash.com tienen el mismo SHA-256 (`e1bb810f…`, `f278734b…`).
  - No hay documento, mínimo ni destinatarios.
- **Securitize Stocks.**
  - En el navegador (https://securitize.io/investments/stocks, 00:53:48Z): «offered by
    Securitize Markets, LLC … to eligible investors in permitted jurisdictions», «Now onchain
    for U.S. investors» y «Available in the U.S., EU and other eligible markets». Esta última
    frase ya está en el expediente.
  - FAQ (00:56:16Z): KYC y monedero propio que Securitize pone en lista blanca.
  - CNMV: Securitize Europe Brokerage and Markets, S.V., nº 327 (25/04/2025).
  - No hay lista de países, KID ni mínimo.
  - **No pude volver a abrir** la respuesta sobre la comisión del 0,10 % (no se desplegó).
    No cambia la decisión.
- **Profitus/Axiology.**
  - API pública (https://api.profitus.com/api/v1/landing/projects, págs. 1 a 3, 00:52:42Z y
    00:53:08Z): 550 proyectos en total.
  - Hay 7 abiertos (`open_for_investments`) y los 7 son préstamos `standard`: 3 en España y
    4 en Lituania. Ninguno es un bono.
  - CNMV, proveedores europeos: UAB «PROFITUS CROWDFUNDING», Lituania, «No. Registro Oficial
    21», desde el 28/12/2023.
- **Valorix (Bit2Me STX).**
  - Blog de Bit2Me (00:53:08Z, mismos bytes): «un bono corporativo tokenizado de 1 millón de
    euros, dirigido a inversores elegibles … previsto para diciembre de 2026».
  - valorix.com, su página «invertir» y el documento de enero tienen los mismos bytes que en
    la consulta del investigador.
  - ERIR de Bit2Me STX: «No se han encontrado datos disponibles».
  - valorix.es: curl corta la conexión (00:52:42Z) y el navegador da 502 (00:53:48Z).
- **CANDO1 (Token City).**
  - https://exchange.token-city.com/es da 503 con curl y con el navegador (00:52:42Z y
    00:52:17Z): «Sistema deshabilitado temporalmente · Estamos en mantenimiento».
  - ERIR de Token City: solo Series A Grupo UAE (06/11/2026).
- **Crypto.com (EEE).** El motivo es exacto y está bien redactado: dice «no localizado en
  una fuente pública accesible desde aquí», no «no hay KID». Lo comprobé así:
  - Condiciones (`1169bff5…`, iguales): «Last Update: 11 August 2026». En el 3.1(d), los
    países excluidos están en las «Tokenized Stocks FAQs». En el 5.2, el KID se entrega «via
    the Crypto.com App».
  - La página de divulgaciones redirige con un 301 a https://crypto.com/ (00:52:52Z). No la
    seguí ni intenté saltarla.
  - CySEC: licencia 344/17 del 27/11/2017, con España en la lista de países.
  - CNMV: FORIS CAPITAL CY LIMITED, nº 4485, desde el 19/01/2018 (mismos bytes).
  - App Store española: versión 3.244.01 del 11/11/2026, «desde 1 USD».
  - Advertencias de la CNMV: «Crypto.com» y «Foris» solo devuelven dominios clon ajenos.
- **Advertencias de la CNMV:** ninguna para Prosegur, Minos, Securitize, Profitus, Axiology,
  Valorix, Bit2Me, Token City ni Cando (00:51:35Z).

## Bloqueos

- exchange.token-city.com: 503 por mantenimiento. CANDO1 sigue sin poder comprobarse.
- valorix.es: corta la conexión con curl y da 502 en el navegador.
- La página del KID de Crypto.com redirige por país. No se elude.
- La FAQ de Securitize no desplegó la respuesta de las comisiones.
- No reabrí la ficha de la EAFN nº 21 (último dato, del 11/11). Solo se cita en un registro
  del expediente de Hausera y no cambia nada de la tarjeta.

## Correcciones obligatorias

1. **Datos personales en una copia del grupo.**
   - Archivo: `grupos/vigilancia/fuentes/bit2me/bit2me-blog-autorizacion-2026-11-12.txt`.
   - Lleva los nombres y apellidos de tres personas físicas, directivos y fundadores de
     Bit2Me, en las líneas 37, 38 y 45.
   - Hay que cambiarlos por «[nombre recortado]» y dejar el original solo en `crudo/`.
   - Además, el apartado «Datos personales» de `resumen-vigilancia.md` dice que solo se
     recortaron Hausera y Prosegur: hay que añadir esta copia.
   - Los expedientes, el resumen y el inventario no llevan nombres. Las copias de Hausera y
     Prosegur sí están bien recortadas.

No hay correcciones obligatorias en la tarjeta de Hausera ni en las decisiones.
