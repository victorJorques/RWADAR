# Correos a las empresas de RWAdar · 13/11/2026

Encargo de Víctor (13/11): contestar a ServiceHunter (Luna Arnold, correo del
29/10) y escribir a **todas** las empresas que salen en RWAdar, de su parte
(Víctor Jorques, 28 años, de Valencia; fundador y CEO), con la web y la app,
la visión, la forma de trabajar y por qué les interesa colaborar. Tono formal,
serio y cercano.

## Estado

- **33 correos montados y revisados** en `correos/` (uno por archivo: `to`,
  `cc`, `subject`, `body` en texto y `htmlBody`). 32 empresas más la respuesta a
  Luna. Kraken (xStocks) y Backed van en uno solo: son el mismo grupo.
- **Remitente decidido por Víctor:** vcicrack@gmail.com, con
  **victorjorquesgranero@gmail.com en copia** en todos. Contacto oficial en la
  firma: rwadares@gmail.com.
- **Envío:** pendiente. El conector de Gmail cayó al reiniciarse la sesión
  (error 502; en claude.ai salía «Este conector no tiene herramientas
  disponibles»). Se envía en cuanto Gmail vuelva, en esta sesión o en una nueva.
- No se escribe a las 5 plataformas descartadas («fuera del radar») ni a las
  emisoras de Aktionariat que solo se estudiaron.

## Cómo se ha hecho

- `HECHOS.md`: lo único que pueden afirmar los correos (sin cifras de
  audiencia, sin prometer tráfico, sin vender patrocinios; RWAdar es un proyecto
  de Víctor como persona física, no una sociedad).
- `contactos-verificados.json`: un agente buscó el correo oficial de cada
  empresa y otro, por separado, lo comprobó. Cada dirección aparece literal en
  una página oficial de la empresa (URL y frase en el archivo). Ninguna está
  deducida por patrón. La de Luna (luna.arnold@quitt.ch) sale en una nota de
  prensa oficial de ServiceHunter.
- `PLANTILLAS-FINAL.md`: plantillas ES, EN, DE-CH, DE-AT y la respuesta a Luna
  (DE-CH), revisadas por tres revisores (veracidad, idioma, venta) y un editor.
  Después se repusieron a mano los enlaces de la web y la app y el apartado «por
  qué os puede interesar», que el editor había quitado.
- `montar.py` + `empresas.json` generan `correos/`. Los 43 enlaces citados
  responden 200 (`/android` redirige a la descarga, 302).

## Fichas que conviene corregir en el próximo ciclo del catálogo

Los revisores encontraron datos desfasados o contradictorios en estas fichas.
Las empresas las van a leer: los correos les piden revisarlas y mandar
correcciones con su fuente, pero conviene arreglarlas con «haz la
investigación».

- **Acceso desde España contradictorio** («Sin comprobar» en el recuadro, «Sí»
  en la transparencia): Prosegur Digital Gold, las tres de Spiko; Hausera
  parecido.
- **xStocks (Kraken):** el 11/11 anunciaron más de 200 empresas del Reino Unido
  y la UE; la ficha habla solo de EE. UU. («más de 130»).
- **Backed Finance:** dice «emisor suizo» (el emisor es Backed Assets (JE),
  Jersey) y «sin ofertas concretas», pero existe la ficha de xStocks.
- **Swarm:** la ficha habla de licencia de BaFin; Swarm Markets S.r.l. (Milán)
  anuncia que no tiene clientes y que se disolverá.
- **Taurus:** «custodia para bancos»; su web dice que es proveedor de
  tecnología, no custodio.
- **ADDX:** dice solo inversores acreditados; desde el 12/11/2025 tiene un
  fondo de Franklin registrado para minoristas en Singapur.
- **Archax:** web europea en «pre-launch»; en septiembre anunciaron más
  permisos en España y un broker-dealer en EE. UU.
- **INX:** «su matriz cotiza en Nasdaq» parece un error (hoy es filial de
  Republic).
- **Lofty:** «oferta registrada» frente a «no registrada ante la SEC».
- **Superstate:** «fondos registrados» frente a «no registrado como sociedad de
  inversión».
- **Blocksquare, Centrifuge, Courtyard:** matices en la descripción (registro
  de la propiedad, titular de los impagos de 2023, qué se acepta en la cámara).
