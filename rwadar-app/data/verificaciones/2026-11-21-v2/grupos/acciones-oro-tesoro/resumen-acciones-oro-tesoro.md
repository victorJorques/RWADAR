# Grupo acciones-oro-tesoro · 21/11/2026

Revisé las cuatro fichas entre las 17:41 y las 18:00 UTC. Partí del vigía
(`vigia.json`, generado a las 17:37:41 UTC del 21/11, con base en la entrega
`2026-11-20.2`, así que valía). Lo que el vigía dio como «no cambia» lo
re-fechó con su hora y su SHA-256, marcado con `segunVigia`. Lo que no cubre
(textos de las webs, acceso desde España, salida, registros y avisos) lo abrí a
mano. El documento que dio como «cambia» (las Condiciones Finales de mTBILL) lo
leí entero.

## Resultado

| Ficha | Decisión | ¿Puede invertir hoy un particular en España? | Qué cambia |
|---|---|---|---|
| Kraken xStocks | **actualizar** | Sí, tras alta y test de Kraken UE (las condiciones finales del emisor no incluyen España) | Ya no son solo acciones de EE. UU.: desde el 11/11 también más de 200 empresas de Reino Unido y la UE |
| mTBILL | mantener | Sí: oferta pública en España para particulares | Nada; el conflicto de reembolso sigue |
| Robinhood Classic Stock Tokens | mantener | Sí: web y KID en español, pasaporte en la CNMV | Nada |
| Prosegur Digital Gold | mantener | Sí: residentes del EEE, con alta y verificación | Nada |

Las cuatro siguen abiertas hoy. Ninguna tiene fechas pasadas en la tarjeta:
las fechas que llevan (por ejemplo «Valor por token · 20/11/2026» en mTBILL)
son la fecha del dato, no la de la consulta.

## Kraken xStocks: lo que cambia por el lanzamiento del 11/11

- **Fuente primaria:** el anuncio del propio emisor en xstocks.fi (11/11/2026):
  «más de 200 de las mayores empresas de Reino Unido y la UE», disponibles «en
  Kraken y Kraken Pro», que «se negocian en el horario de su bolsa» y que no se
  venden a residentes en Reino Unido ni en EE. UU. El soporte de Kraken en
  español (actualizado el 11/11) dice: «También ofrecemos renta variable
  tokenizada de mercados no estadounidenses, como el Reino Unido y la UE», y
  lista HSBC, Shell, LVMH, Airbus, Siemens y también españolas como ACS, Aena o
  Amadeus.
- **Propongo cambiar:**
  - Título: «xStocks: certificados tokenizados que siguen el precio de acciones
    y ETF» (antes «… de acciones de EE. UU.»).
  - Resumen: «… más de 1.000 acciones y ETF de EE. UU. y más de 200 empresas de
    Reino Unido y la UE …».
  - Métrica «Salida»: «Venta a Kraken en USD o retirada a wallet; las de EE. UU.,
    24/5; las de Reino Unido y la UE, en el horario de su bolsa».
  - Aviso nuevo: «Las acciones de Reino Unido y la UE solo se pueden comprar y
    vender en el horario de su bolsa.»
  - Aviso de dividendos: quitar «en EE. UU.» (las preguntas frecuentes aplican la
    retención del 30 % también a las de Reino Unido y la UE).
  - En «Lo esencial», el acceso desde España con el «Sí» delante: «Sí, tras alta y
    test de Kraken UE; ojo: las condiciones finales del emisor no incluyen
    España».
- **España, sin cambio de fondo.** Leí las 58 condiciones finales que el emisor
  ha registrado en ESMA desde el 15/10 (56 legibles). Todas ofrecen el producto
  solo en Liechtenstein y Suiza, también las 11 de acciones alemanas del 15/10
  (Zalando, Commerzbank, Continental, Henkel…). Así que el aviso publicado sigue
  siendo cierto y vale también para las nuevas. No encontré las condiciones
  finales de las de Reino Unido (por ejemplo HSBC).
- Lo demás, igual: desde 1 €, CySEC 342/17, CNMV 4474, folleto BPWO-80
  notificado a la CNMV, comisión del 1 % (o hasta 2 USD en compras pequeñas) más
  diferencial, sin advertencias de la CNMV. La página de Kraken UE sigue
  hablando solo de EE. UU.; la de documentos del emisor sigue en «Access
  Restricted».

## mTBILL

- **Condiciones Finales (el vigía no tenía su huella):** las descargué (SHA-256
  b1e58001…, el mismo archivo que el 20/11) y las leí enteras: 7 páginas de
  condiciones y el resumen en 10 idiomas (inglés y español completos; en los
  demás comprobé que repiten las mismas cifras). Confirman la oferta pública en
  14 países con España hasta el 17/07/2027, sin mínimo y con minoristas en el
  mercado objetivo.
- **Oráculo:** la ronda más reciente sigue siendo la 498, del viernes 20/11 a las
  11:41:35 UTC (1,0789 USD). El sábado no hay ronda nueva. Por eso la
  rentabilidad pasada de 5 semanas sigue en 3,46 % (16/10 → 20/11) y la ventana
  no se mueve. Coincide con el vigía y con mi lectura de control (17:43 UTC).
  Contratos sin pausar y 66,16 millones de mTBILL en Ethereum.
- **Conflicto de reembolso: sigue.** Condiciones Finales: tope del 25 % diario y
  retención de hasta el 5 %. KID en español (mismo archivo de siempre): 15 % y
  hasta el 50 %. Las comisiones tampoco coinciden: las Condiciones Finales
  permiten hasta 0,2 % al suscribir de forma inmediata y hasta 0,05 % al
  reembolsar; el KID no cobra ninguna de las dos. Estado:
  **`fuentes_en_conflicto`**.
- ESMA y CNMV (pasaporte BPWO-84), iguales; sin advertencias. midas.app y las
  páginas HTML de la documentación siguen en 403; `llms-full.txt` responde,
  igual que el 20/11.

## Robinhood Classic Stock Tokens

- La página en español dice lo mismo que el 20/11 (desde 1 €, más de 2.000
  subyacentes, 24/5). KID y descripción de servicios en español con el mismo
  SHA-256; los documentos en inglés y la tabla de comisiones, iguales según el
  vigía. CNMV n.º 5299 y Banco de Lituania, iguales.
- Novedad solo para el expediente: una nota oficial de Robinhood (22/06/2026)
  dice que el producto está disponible «en todos los países de la UE y del
  EEE»; las restricciones por país que cita son de cripto (Bélgica y Hungría).
  Refuerza el «Sí» para España.

## Prosegur Digital Gold

- Contrato (08/07/2026), página comercial («Compra mínima 1 gramo»),
  transparencia y preguntas frecuentes: mismo texto que el 20/11. La app sigue
  vendiendo («Emitida · Comprar»); el gramo cuesta hoy 107,87 € (no va en la
  tarjeta).
- Fila de Prosegur Custodia en la CNMV y en ESMA, igual. Sin advertencias.

## Cosas viejas en las fichas (para la reunión del lunes)

Las tarjetas no tienen fechas pasadas, pero en la ficha completa quedan
referencias con fechas antiguas, repetidas por otras más nuevas, que se leen
como viejas. Propongo retirarlas o re-fecharlas:

- mTBILL: «Comisión publicada · Gestión» y «· Performance» (21/09), «TVL
  publicado en Midas» (30/09) y tres «Descripción en el índice oficial de
  productos» (20–22/10).
- Prosegur: las de «consultada el 30/09/2026» y las «· 22/10/2026».
- Robinhood: las que llevan «· consulta 01/11/2026».
- Kraken: «Registro del vendedor», «Licencia del vendedor» y «Comisión con euros»
  (03/11). Las releí hoy, así que se pueden re-fechar al 21/11. En la
  documentación larga, «Qué se adquiere» también dice «de EE. UU.».

## Bloqueos

- midas.app y las páginas HTML de docs.midas.app: 403 (un intento, no se insistió).
- assets.backed.fi: «Access Restricted».
- Condiciones finales de las xStocks de Reino Unido: no localizadas. 2 de las 58
  del emisor no se pudieron leer.
- No consulté la API del registro de la FMA de Liechtenstein (el 20/11 daba 400
  y no es fuente de la tarjeta).
- Copias en `fuentes/`; lo que lleva direcciones, tokens o es muy grande, en
  `fuentes/crudo/`. Inventario en `inventario-consultas.json`.
