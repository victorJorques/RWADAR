# Candidatas España · resumen (ciclo 05/11/2026)

Grupo: **candidatas-espana**. Busqué ofertas nuevas de activos reales
tokenizados de proveedores españoles, o dirigidas a particulares en España,
que se puedan comprar hoy con un KYC normal. También repasé las tres candidatas
de días anteriores (bono de Valorix en Bit2Me STX, Hausera ETI en Portfolio y
BeToken).

Todas las consultas son reales, del 05/11/2026 entre las 08:02 y las 08:19 UTC.
Cada lectura está en `inventario-consultas.json`, con su URL, hora, código HTTP,
tamaño y sha256. No inicié sesión ni rellené formularios. No había copias a
medias de un intento anterior en esta carpeta: todo es de hoy.

## En una frase

**Hoy no hay ninguna oferta española nueva que se pueda admitir.** La pista
nueva más seria es **CANDO1**, la primera oportunidad que anuncia la agencia de
valores Token City (inscrita en la CNMV), pero está «en estudio» y sin
documentos. Además, Hausera ETI ya tiene documentos públicos y con ellos se ve
que no es un activo tokenizado.

## Expedientes

| Slug | Decisión | Qué hay hoy |
|---|---|---|
| `bit2me-stx-bono-valorix` | no_admitir | Igual que el 03/11. El bono de Valorix de 1 M€ sigue anunciado para **diciembre de 2026**, para «inversores elegibles» sin definir. No hay documento de emisión, mínimo, cupón ni vencimiento. Bit2Me STX sigue inscrita (agencia de valores nº 343 y uno de los dos sistemas de negociación con blockchain de la lista de la CNMV). La página de producto todavía enseña las condiciones de la prueba de 2024. |
| `hausera-eti-portfolio` | no_admitir | **Cambia mucho respecto al 03/11.** En la pestaña «Documentos» de Portfolio ya están el KID en español (17/03/2026), las condiciones finales y el folleto base aprobado por la FMA de Liechtenstein (18/12/2025), notificado a España. Portfolio es un sistema multilateral de negociación de una sociedad de valores inscrita en la CNMV (nº 314). Pero el producto **no es un token**: es una nota de deuda perpetua, al portador y liquidada en Euroclear, de Altarius ETI AG (Liechtenstein). Esa nota sigue a otra nota privada de Gibraltar que invierte en la estrategia de Hausera. El KID le da **riesgo 6 de 7**, lo llama producto complejo para «inversores informados» y avisa de que puede ser difícil venderlo. Hoy no hay órdenes de compra en el libro. |
| `beself-brands-betoken` | no_admitir | betoken.io y beselfbrands.com siguen sin responder (conexión reiniciada y error 522). **Corrección:** el 03/11 dijimos que la venta terminó en septiembre de 2025. El GitBook del emisor dice que la última fase termina «al final de la colocación de todos los tokens», así que no consta ese cierre. Tampoco se puede comprobar que siga abierta. El documento de oferta es el mismo (sha256 idéntico). Sigue sin mercado secundario. |
| `token-city-exchange-cando1` | no_admitir (nueva) | Token City European Exchange A.V. (CNMV nº 334) anuncia en exchange.token-city.com su primera oportunidad: **CANDO1**, ligada a una residencia de mayores de 76 apartamentos en La Moraleja (Madrid), de Lornin Ibérica, S.L. Está «en estudio» y solo admite apuntarse a una lista. No hay documento de emisión, vehículo ni derecho, ni inscripción en el registro de valores tokenizados. El mínimo de 657 € y la «TIR bruta estimada ~11,7 %» son cifras comerciales sin respaldo: no se usan. |

Ninguna lleva propuesta de tarjeta. Cada expediente deja en `propuestaTarjeta`
solo los tres datos de hoy (mínimo, acceso desde España y salida) como
referencia, con `null` donde no hay fuente.

## Qué revisé (fuente primaria, hoy)

1. **Registro ERIR de la CNMV** (registro de valores tokenizados). Sigue
   habiendo una sola entidad, Ursus-3 Capital, con las mismas 23 emisiones que
   el 03/11 (páginas 1 y 3 idénticas byte a byte; la 2 solo cambia en el
   formato). No hay inscripciones nuevas.
2. **Infraestructuras de mercado de la CNMV.** Siguen dos sistemas de
   negociación y liquidación con blockchain (régimen piloto): Bit2Me STX y
   Securitize. Portfolio Stock Exchange aparece como sistema multilateral de
   negociación normal.
3. **Sociedades y agencias de valores de la CNMV.** Comprobé hoy Bit2Me STX
   (nº 343), Token City (nº 334), Minos Securities (nº 333) y European
   Digital Securities Exchange (Portfolio, nº 314). Leí con navegador el
   programa de actividades de Bit2Me STX y de Token City. Las casillas de tipo
   de cliente son iconos y no se pueden leer.
4. **Advertencias de la CNMV** («no autorizadas»), por nombre. Antes validé el
   buscador con «Gemini», que devuelve dos entidades advertidas. Dan **sin
   coincidencias**: Bit2Me, Valorix, Activos y Valores Digitales, Altarius,
   Hausera, Portfolio Stock Exchange, European Digital Securities, Beself,
   Betoken, Token City, Lornin y Cando. La pestaña de «otras entidades»
   (tipo=2) devuelve un error 400 y no se pudo consultar.
5. **Otras pistas descartadas sin expediente**:
   - Alius Capital no tiene campañas nuevas: el aviso del marketplace de Token
     City enlaza a Casa de Outeiro, que ya está publicada.
   - El «mercado privado» de Token City (Hispania Defense, oro, pádel,
     diamantes de Dianelum, etc.) lo venden los propios emisores, sin una
     entidad supervisada que coloque. No entra con nuestro criterio.
   - Azvalor Blockchain FI no aparece entre los fondos de la web de Azvalor
     (la URL probada da 404). Según la prensa, solo está abierto a un grupo
     cerrado.
   - openbrick.es (de BME) no responde (502 en el proxy) y no figura como
     infraestructura en la CNMV.
   - minossecurities.com no responde (conexión reiniciada).

## Conflictos que conviene saber

- **Token City se presenta como sistema de negociación del régimen piloto**
  («Agencia de Valores autorizada por la CNMV para operar un Sistema de
  Negociación y Liquidación bajo el Régimen Piloto»). Sin embargo, la CNMV no
  la incluye en su lista de infraestructuras, y una noticia del 22/05/2026
  (Bolsamanía) dice que solo lo «prevé». Lo que sí está inscrito es la agencia
  de valores nº 334.
- **Bestinver Securities como ERIR.** Esa misma noticia dice que Bestinver
  Securities obtuvo la autorización de ERIR. La página de la CNMV de entidades
  designadas ERIR solo muestra hoy a Ursus-3 Capital. No lo he resuelto.
- **Hausera ETI.** Sus condiciones finales (serie 19) ponen en el apartado 11
  el ISIN de otra serie (Hausera Madrid 2). El KID dice que los costes
  corrientes son del 0,00 %, mientras que las condiciones finales fijan
  comisiones anuales de hasta el 0,90 % del valor liquidativo. Hay otra
  Altarius en el registro de la AFM neerlandesa, irlandesa y supervisada por el
  Banco Central de Irlanda (folleto notificado el 20/07/2026), que no es el
  emisor de Hausera ETI.

## Nota para otros grupos

- La página de Bolsamanía leída hoy enlaza a la noticia «OTESA amortiza con
  éxito su primer bono tokenizado junto a Token City». Es la campaña de Alius
  ya cerrada (Otesa Calella). Puede servir al grupo que revisa Casa de Outeiro,
  aunque no la he leído.

## Bloqueos

- Documentos de emisión no publicados: bono de Valorix de diciembre y CANDO1.
- betoken.io, beselfbrands.com, valorix.es, minossecurities.com y openbrick.es
  no responden.
- Advertencias de «otras entidades» de la CNMV: error 400.
- No consulté el registro de folletos de la FMA de Liechtenstein ni el de
  folletos pasaportados de la CNMV. La aprobación y la notificación del folleto
  de Altarius se toman del propio folleto y de las condiciones finales.
- El folleto base de Altarius (5,98 MB) y el informe de diciembre de 2025 de
  Hausera ETI (3,39 MB) superan 3 MB: guardo solo el texto y el sha256.
- El documento de oferta de BeToken contiene DNI de los fundadores. Lo releí en
  una carpeta temporal fuera del repositorio y lo borré; solo anoto su sha256.
- Escáner de secretos: una copia del GitBook de BeToken incrusta una URL de
  imagen con `token=`. La moví a `fuentes/crudo/` (fuera de Git) y lo anoté en
  el inventario. Ningún otro `.txt`, `.md` ni `.json` del grupo contiene esos
  parámetros.
