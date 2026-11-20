# Revisión independiente · grupo spiko · 20/11/2026

Revisé las tres fichas de Spiko entre las 17:04 y las 17:07 UTC. Abrí yo mismo
las fuentes primarias. No usé las copias del investigador. Mis copias están en
`revision-independiente/fuentes/spiko/`, con su hora y su SHA-256 en
`inventario-revision.json`.

**Resultado: aprobado con cambios.** Las tres cifras son correctas. Hay que
hacer dos correcciones antes de montar la entrega:

1. **Spiko Euro, «Supervisor»:** el texto nuevo dice que la fecha de
   autorización, el 17/02/2026, viene del certificado de la AMF y del folleto.
   Ninguno de los dos documentos la recoge.
2. **Datos personales:** una copia del grupo que no está en `crudo/` lleva el
   nombre de una persona física.

## Letras del Tesoro Euro (EUTBL): confirmado

- API de rentabilidad: <https://public-api.spiko.io/v0/share-classes/EUTBL/yield>,
  a las 17:04:52 UTC. Literal: `"monthlyYield":"0.0235"`, con
  `"updatedAt":"2026-11-19T16:44:57Z"`. SHA-256 `d01e752c…`, el mismo que el
  del vigía.
- Último valor liquidativo (VL):
  <https://public-api.spiko.io/v0/net-asset-values/EUTBL/latest>. Literal:
  `"day":"2026-11-19"`, `"value":"1.063276"`.
- Mi cálculo con la serie de VL (`?startDay=2026-09-20`, 17:05:02 UTC): del
  19/10 (1,06118) al 19/11 (1,063276) son 31 días. Capitalizando sale
  **2,3505 %**, así que 2,35 % es correcto.
- La web <https://www.spiko.io/es/spiko-letras-del-tesoro-euro> (17:06:40 UTC)
  dice: «2,35% Rendimiento neto actual».
- Los tres textos de la tarjeta ocupan 23, 94 y 115 caracteres. Están en
  castellano llano y respaldados por el KID ES, que tiene el mismo SHA-256.

## Letras del Tesoro Dólar (USTBL): confirmado

- API: `"monthlyYield":"0.0397"`, con `updatedAt 2026-11-19T16:45:20Z`, a las
  17:04:52 UTC. SHA-256 `4bad4f56…`, el mismo que el del vigía. VL del 19/11:
  1,103445 USD.
- Mi cálculo del 19/10 (1,099805) al 19/11: **3,9671 %**, así que 3,97 % es
  correcto.
- La web (17:06:40 UTC) dice «3,97% Rendimiento neto actual». Sigue diciendo
  «sin preaviso y sin límite de importe», en conflicto con el límite del 10 %
  del folleto. El aviso publicado sigue haciendo falta.
- Los tres textos de la tarjeta ocupan 73, 94 y 116 caracteres. Son correctos.

## Spiko Euro (Smart Cash): confirmado con cambios

- API: `"dailyYield":"0.0284"`, a las 17:04:52 UTC. VL del 20/11: 1,017886 €
  (`updatedAt 2026-11-20T16:37:37Z`). Mi cálculo da **2,8372 %** a 7 días
  (del 13/11 al 20/11) y **2,8340 %** a 35 días. La cifra de 2,84 % y la fecha
  20/11 son correctas.
- La web <https://www.spiko.io/es/spiko-euro> (17:06:39 UTC) sigue diciendo
  «Interés a tipo fijo 2,84% Garantizado por contrapartes» y «Sociedad gestora
  Amundi Asset Management». La página para particulares sigue diciendo «No
  existen límites de retirada». Los avisos publicados siguen haciendo falta.
- **GECO c124199** (la base pública de fondos de la AMF):
  - <https://geco.amf-france.org/back-office/funds/compartment/c124199>, a las
    17:05:12 UTC. Literal: `{"idInterne":0,…,"published":false}`. Las clases
    de acciones salen como `[]`.
  - El buscador (POST `keyword=spiko`, 17:05:32 UTC) devuelve 4 fondos: c118189,
    c79399, c79398 y c119640. **No devuelve c124199.** Con `FR0014015LD3`,
    `overnight swap` y `SCV20260075` da 0 resultados.
  - La novedad que da el investigador es cierta.
- **Comercialización en España:**
  - La CNMV (iicextranjera N0401205J, 17:06:27 UTC) solo muestra «SPIKO SICAV ·
    2380 · 30/01/2026 · SICAV · FRANCIA», sin compartimentos.
  - La tabla de Spiko (docs.spiko.io, 17:06:44 UTC) dice «Last updated:
    November 13, 2026» y marca «🇪🇸 Spain ✅» en la columna Smart Cash, que es la
    primera.
  - Nadie lo confirma en un registro público y nadie lo niega. Estoy de acuerdo
    en mantener el aviso y no retirar la ficha.
- Los tres textos de la tarjeta ocupan 9, 108 y 116 caracteres. Son correctos.
  El de acceso dice claramente que ningún registro lo confirma.

### Corrección obligatoria: el texto de «Supervisor»

El texto propuesto dice: «n.º SCV20260075, **autorizado el 17/02/2026 según el
certificado de la AMF y el folleto**». Lo he comprobado y no se sostiene:

- El certificado de la AMF
  (<https://cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf>, SHA-256
  `709e0585…`) va fechado «Paris, 2026-02-23». Pone «SCV20260075 SPIKO AMUNDI
  OVERNIGHT SWAP FUND» en la lista de subfondos que cubre, **pero no da la fecha
  17/02/2026**.
- El folleto de GECO 438274 (SHA-256 `940559b4…`) y el folleto en inglés
  (`7457e79f…`) no contienen ni «SCV20260075» ni «17/02/2026». Lo busqué con
  `pdftotext`.
- La fecha 17/02/2026 solo venía de la ficha GECO c124199 («Date d'autorisation
  : 17/02/2026»), y esa ficha ya no se publica.

Texto que hay que usar: «AMF (Francia): n.º SCV20260075, según el certificado
de la AMF del 23/02/2026; el 20/11/2026 el fondo ya no aparece en la base
pública de la AMF (GECO) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV
no muestra qué fondos de la SICAV están dados de alta en España».

Hay que corregir lo mismo en el claim del expediente que dice «según el
certificado de la AMF y el folleto». En `documentacion-ofertas`, también la
descripción y «Aprobación del compartimento», que dicen «autorizado por la AMF
el 17/02/2026 … (ficha pública en GECO y certificado de la AMF)». Si se
conserva la fecha, tiene que decir que viene de la ficha GECO consultada por
última vez el 13/11, que ya no se publica. Lo más claro es quitar la fecha.

La URL c124199 no estaba en los `fuentesActuales` publicados del escaparate.
Sí está en `documentacion-ofertas`, así que hay que quitarla de ahí.

## Lo re-fechado con el vigía (`segunVigia`), comprobado por muestreo

Descargué los documentos entre las 17:05:39 y las 17:05:42 UTC. Los siete dan
el mismo SHA-256 que `vigia.json`:

| Documento | SHA-256 |
| --- | --- |
| KID_EUTBL_ES | `cb1a621d…` |
| KID_USTBL_ES | `c1ce5400…` |
| KID_eurSAFO_ES | `53effea2…` |
| SAFO_Letter_EN | `709e0585…` |
| GECO 438274 | `940559b4…` |
| Prospectus EN | `7457e79f…` |

También coinciden con el vigía las dos API de VL y las de rentabilidad de EUTBL
y USTBL.

Búsquedas de advertencias de la CNMV (17:06:20–17:06:24 UTC), por Spiko, Aldana,
Twenty First Capital y Amundi: las cuatro dicen «No hay datos disponibles». El
SHA-256 de la página cambia en cada consulta porque tiene partes dinámicas, pero
el texto es el mismo.

Todos los `segunVigia` del grupo corresponden a entradas «no cambia» de
`vigia.json`. Ninguno corresponde a «cambia» ni a «no se pudo leer».

Detalle menor: algunos (GECO 438274 en las fichas EUTBL y USTBL; Terms_of_Use y
Prospectus EN en USTBL y Smart Cash) están en el vigía con la misma URL y el
mismo SHA-256, pero bajo otra ficha de Spiko. No es motivo de rechazo.

## Datos personales: corrección obligatoria

- `grupos/spiko/fuentes/spiko-web-es-particulares-render.json` **no** está
  dentro de `crudo/`, así que entraría en Git. Contiene el nombre de una persona
  física (un testimonio de la web de Spiko, con su cargo). Hay que quitar el
  nombre de esa copia.
- La copia en bruto de esa misma página está en `crudo/`, que no entra en Git,
  y también tiene nombres de testimonios.
- En mis copias he quitado los nombres, también los que salían en los nombres
  de las imágenes.
- No encontré otros datos personales. Los correos que aparecen son genéricos de
  empresa.

## Bloqueos

- El folleto en español sigue dando 403 a las 17:05:43 UTC.
- **Hora:** la próxima VL de EUTBL y USTBL llega a las 18:00:00 UTC de hoy
  (`nextYieldTimestamp 1795197600`). Si la entrega se monta después de esa
  hora, hay que volver a leer la API y cambiar la cifra y la fecha (VL del
  20/11). Si no, las cifras del 19/11 son correctas. La de Spiko Euro no cambia
  hasta el lunes 23/11, a las 19:30 UTC.
- Sigue sin saberse por qué la AMF ha dejado de publicar la ficha c124199. Hay
  que volver a mirarlo en el próximo ciclo.
