# Brickwise · resumen de la investigación del 01/11/2026

Grupo: brickwise. Fuentes leídas entre el 01/11/2026 13:10 UTC y el 02/11/2026 08:42 UTC.
Todo es público y sin iniciar sesión. Copias e inventario (hora, HTTP, SHA-256) en
`fuentes/brickwise/inventario-consultas.json`. Las direcciones de cartera de los
inversores y los nombres de personas se recortaron de las copias de la API.

## Qué se revisó

- API pública `api.app.brickwise.at/api/v2/assets` (14 activos), `/api/v1/assets`
  (17 activos con libro de órdenes) y la ficha de cada activo
  `bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>`.
- Contrato (Investitionsbedingungen), KID (Basisinformationsblatt) e
  Informationsblatt AltFG de los 16 activos con ISIN. Los contratos y KID tienen
  el mismo SHA-256 que el 23/10: no han cambiado.
- Aviso legal, FAQ de acceso por país, costes de Brickwise e información al
  consumidor de Effecta (19/06/2026).
- Registros: BaFin (Effecta GmbH y registro de agentes vinculados), CNMV
  (entidades registradas) y FMA (base de entidades autorizadas).

## Entidad y permisos (vale para todas)

- Quien comercializa: **Brickwise Investment GmbH** (Múnich, HRB 269358), agente
  vinculado de **Effecta GmbH**. Registro de la BaFin: nº 80174029, activo desde
  04/08/2021, sin fecha de baja (datos a 31/10/2026). Effecta es Wertpapierinstitut
  (BaFin-ID 10133261), con permiso de intermediación y asesoramiento.
- En la **CNMV**, Effecta figura como empresa de servicios de inversión del EEE en
  libre prestación (nº 5003, desde 11/11/2020), solo para recepción y transmisión
  de órdenes. En la pestaña de agentes no figura ninguno, así que Brickwise no consta
  como agente notificado para España.
- Los emisores son sociedades vehículo austriacas (Brick Qogir, Brick Sagarmatha,
  BrickOne, Green-Point 62, COHOTEL, C&P Bricks, Greeninfra). Las ofertas se hacen
  con **exención de folleto** (menos de 2 M€ en 12 meses) y, la más reciente, bajo
  la ley austriaca AltFG. Ni la FMA ni otra autoridad las ha revisado.
- Advertencias: el buscador de entidades de la CNMV no devuelve resultados para
  los emisores. El **buscador de advertencias de la CNMV no respondió** (timeout),
  así que no afirmamos que no haya advertencias. En la base de entidades de la FMA,
  «brickwise» no da resultados. La lista de advertencias de la FMA no se consultó.
- Acceso desde España: según la FAQ, puede abrir cuenta cualquiera con residencia
  en el EEE. Ningún documento confirma que cada emisión se distribuya en España.
  Los documentos solo están en alemán. → `disponibleEs: no_confirmado` en todas.
- Costes: 1,5 % al comprar y 1,5 % al vender (Kosteninformationen, p. 1). La
  custodia es propia, en la app. Recuperar una cuenta exige identificarse ante
  notario (unos 120 €).

## Ofertas publicadas (12)

| Slug | Hoy (API 01/11) | Decisión |
|---|---|---|
| terreno-con-arrendamiento-billa | **Emisión primaria**: 6.322 de 6.404 participaciones libres (82 suscritas) | actualizar (principales, con avisos) |
| vivienda-pluddemanngasse-101-graz | Reventa: 333 participaciones desde 80 €; mejor compra 20 € | actualizar → secundario |
| vivienda-sonnleithnergasse-2-viena | Reventa: 96 desde 75 €; compra 69 € | actualizar → secundario |
| local-de-estanco-klagenfurt | Reventa: 301 desde 95 €; compra 88 € | actualizar → secundario |
| vivienda-stallhofstra-e-28-gratwein | Reventa: 309 desde 69,90 €; compra 30 € | actualizar → secundario |
| vivienda-schwarzer-weg-18-graz | Reventa: 274 desde 69,90 €; compra 60 € | actualizar → secundario |
| drautalresidenz-paternion | Reventa: 150 desde 70 €; compra 54 € | actualizar → secundario |
| randhartingergasse-9-viena | Reventa: 183 desde 78 €; compra 40,50 € | actualizar → secundario |
| apartamento-vacacional-hinterstoder-50 | Reventa: 253 desde 72 €; compra 65 € | actualizar → secundario |
| vivienda-pottendorfer-stra-e-62-wr-neustadt | Reventa: 106 desde 80 €; compra 63 € | actualizar → secundario |
| fotovoltaica-greenpoint | Reventa: 351 desde 100 €; compra 90 € | actualizar → secundario |
| fotovoltaica-cohotel | Reventa: 65 desde 110 €; compra 3 € | actualizar → secundario |

**BILLA (Brückl, ISIN AT0000A3SE89)** es la única con cifras para una tarjeta
principal. Cada dato tiene su fuente:
- Mínimo 1.000 €, en tramos de 100 €. Precio de 100 € por participación (Informationsblatt, p. 12; KID, p. 1).
- Reparto previsto del **5,07 %** sobre el nominal: excedente de alquiler de
  32.451,43 € / 640.400 €. Cálculo de la API, comprobado. El escenario medio del
  KID usa un 5,23 % más revalorización, así que hay una discrepancia de base.
- Salida: reventa en la app, o cancelación a los 5 años y después cada año, con
  30 días de preaviso (KID, p. 3).
- Avisos críticos:
  1. El umbral mínimo es de **500.000 €** (5.000 participaciones) y solo hay **82
     suscritas** (1,6 % del umbral). Si no se alcanza, se devuelve el dinero sin
     intereses (Informationsblatt, p. 3).
  2. El plazo publicado **terminó el 16/05/2026**. El contrato permite prorrogarlo
     hasta el triple, pero no hay publicada ninguna nueva fecha. Conflicto con la
     API, que sigue en «primary».
  3. El emisor tenía **fondos propios negativos** (unos −83.000 €) a 31/12/2024 (p. 8).
  4. La garantía en el registro de la propiedad sigue pendiente.
  5. Solo 550.000 € de los 640.400 € pagan el inmueble; el resto son costes,
     marketing y licencia de Brickwise (contrato §2.2).
  6. La partida «Submietvertrag» (33.277 € al año) no se explica en los documentos.

**Las 11 de reventa**: ahora tienen fuente primaria para el precio de referencia,
el libro de órdenes, el precio de emisión original, el derecho, la salida y el
riesgo (6 de 7). Lo que debe saber el cliente:
- No tienen reembolso ordinario. En Pottendorfer la primera cancelación es a los
  15 años; las fotovoltaicas devuelven el nominal en 2038, subordinado a los
  acreedores financieros. Hasta entonces solo se sale vendiendo.
- Hay mucha distancia entre la venta más barata y la mejor compra (p. ej. 80 € frente a 20 €).
- El mínimo de compra en reventa no está documentado.

Sobre la rentabilidad que muestra la API: es el alquiler neto previsto dividido
entre el precio de referencia. **No se muestra** en 5 fichas, porque el contrato
de alquiler que cita la API ya venció (Plüddemanngasse, Stallhofstraße, Schwarzer
Weg, Randhartingergasse, Pottendorfer) o vence el 29/11/2026 (Sonnleithnergasse).

Propuesta: sacar las 11 de «principales» y pasarlas a «secundario», o agruparlas
en una sola tarjeta «Brickwise · mercado de reventa». Víctor decide.

Conflictos anotados:
- Randhartingergasse tiene `availableBricks=374` con la emisión cerrada en 2022.
  No lo interpretamos como reapertura.
- GreenPoint: el contrato dice 95 % en §5.1 y 50 % en §9.1.
- Pottendorfer y Randhartingergasse tienen copias del contrato o del KID con
  distinto SHA-256 en dos servidores (cdn y storage).
- La categoría de las fotovoltaicas debería ser «Energía e infraestructura», no «Inmobiliario».

## Candidatas (activos fuera del catálogo)

| Slug | Hallazgo | Decisión |
|---|---|---|
| fotovoltaica-cargadores-parkhaus-q2-st-poelten (AT0000A3E842) | La API da 219 de 460 participaciones «disponibles» a 507,62 €, pero el contrato limita la suscripción a 2024 (prórroga máxima: 2025). No hay órdenes de reventa. | no_admitir (conflicto sin resolver) |
| ferienimmobilie-fixpacht-hinterstoder (AT0000A35A42) | Solo reventa (71 desde 98 €). La API da un rendimiento previsto de −0,12 %, hay un préstamo variable de 250.000 € y la garantía está pendiente. | no_admitir |
| ferienapartment-fixpacht-hinterstoder-2 (AT0000A3AAY4) | stage=deleted: la emisión de 2024–2025 se quedó en 489 de 2.120 | no_admitir (desaparecida) |
| neubauwohnung-wien-22-donauzentrum (AT0000A3AAX6) | stage=deleted: se quedó en 440 de 2.200 | no_admitir (desaparecida) |

En la API v1 también aparece «KTGG-0944 Oskars Hundehütte» con stage=test. Es un
registro de prueba y no se evalúa.

## Bloqueos

- Buscador de advertencias de la CNMV: timeout en las 10 búsquedas.
- Lista de advertencias de la FMA: no consultada.
- Firmenbuch (registro mercantil austriaco): de pago, no consultado. Los números FN
  vienen de los documentos del emisor.
- No hay documento que explique el campo `sharePrice` de la API ni la prórroga del
  plazo de BILLA.
