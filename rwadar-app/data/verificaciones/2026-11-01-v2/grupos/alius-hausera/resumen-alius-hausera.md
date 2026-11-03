# Grupo alius-hausera · resumen · 01–02/11/2026

Lecturas reales: Alius y Token City (API pública, solo campos de campaña y
documentos), CNMV (registro de PSFP, registro de ESI, buscador de advertencias)
el 01/11 entre 13:10 y 15:08 UTC; Hausera (página de oportunidades) el 02/11 a
las 08:42 UTC. Todo está en `fuentes/` y en `fuentes/inventario-consultas.json`.
De los PDF solo se guarda el texto extraído, sin los DNI, teléfonos ni correos de
personas físicas. El sha256 que consta es el del PDF original.

## Entidades

- **Alius Capital** está en el registro de PSFP de la CNMV con el **nº 11**
  (alta el 03/11/2023, NIF B76632793). Figura con su nombre anterior,
  *Adventurees Capital PFP, S.L.*; la web usa *Alius Capital STOS PSFP S.L.* y
  el NIF es el mismo. Sus condiciones admiten a particulares no experimentados:
  prueba de conocimientos, simulación de pérdidas, aviso si invierten más de
  1.000 € o del 5 % del patrimonio, y 4 días para desistir.
- **Token City European Exchange A.V., S.A.** es la entidad de registro (ERIR).
  Está en la CNMV como agencia de valores, **nº 334** (06/02/2026), y puede
  custodiar instrumentos de registro distribuido. No comprobé que la ERIR de cada
  emisión esté inscrita.
- **Hausera** la opera HOLDTX SPAIN, S.L. Según sus términos, no es empresa de
  servicios de inversión, y no aparece como PSFP en la CNMV.
- La CNMV no tiene advertencias para Alius Capital, Alius, Adventurees, Token
  City, Outeiro, IOD Applications, Hausera ni Holdtx. Comprobé antes que el
  buscador sí encuentra un nombre advertido conocido.

## Ofertas publicadas

| slug | decisión | qué cambia (fuente) |
|---|---|---|
| casa-de-outeiro | **actualizar** | La ficha de datos v5, firmada el **30/10/2026**, amplía la fecha límite al **31/03/2027**. La campaña sigue «En campaña» con el botón Invertir activo, pero su fecha de fin sigue siendo el 31/10/2026, la pestaña «Proceso» no se ha cambiado y aparece «Días restantes --». Esto es un conflicto. Lleva **1.121.000 €** de un mínimo de 2.000.000 €, la misma cifra que el 23/10. Si no llega al mínimo, se cancela y se devuelve el dinero. Mínimo: 2.000 €. |
| iod-occasio | **retirar_propuesta** | Emisión **CLOSED**, «Emisión completada», 120.000 € de 120.000 €, con fin el 23/10. No hay nueva emisión de IOD ni reventa. La escritura del 28/09 dice que el seguro **no beneficia al inversor**. Una emisión cerrada no encaja en «en camino». |
| hausera-proximas-ofertas | **actualizar** | Anuncia **Alicante 2**: preventa el 04/11/2026, oferta pública el 11/11/2026, 5.196.000 €. La tarjeta dice «preventa 11/11»: otro conflicto. No hay documento de emisión. El operador no está supervisado: si solo se muestran entidades reguladas, sería candidata a retirar (decide Víctor). |

## Candidatas

- Alius no tiene ninguna campaña nueva. La API devuelve 1 en campaña (Casa de
  Outeiro), 0 en precampaña, 0 en campaña privada y 2 cerradas (IOD y OTESA
  Calella Living, cerrada el 20/01/2026).
- **hausera-alicante-2: no_admitir.** Falta el documento de emisión, la SPV que
  emite, el mínimo, la admisión de residentes en España y una entidad
  supervisada. La preventa es una reserva sin compromiso.

## Bloqueos y límites

- No probé la contratación, porque no hay sesión. No sé si Casa de Outeiro acepta
  órdenes después del 31/10.
- Las condiciones de Alius fijan campañas de 6 meses como máximo. Del 01/07/2026
  al 31/03/2027 van 9 meses.
- No leí los estatutos ni el pacto de socios de Casa de Outeiro.
- Los términos, la FAQ y la página de cotizadas de Hausera son copias del 23/10;
  hoy no las volví a leer.
- La API indica `network 80002` (la red de pruebas Polygon Amoy) para los tokens
  CdO e IODO1. Solo lo dejo anotado: no saco conclusiones.
