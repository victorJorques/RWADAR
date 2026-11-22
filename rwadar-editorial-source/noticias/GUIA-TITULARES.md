# Titulares y fotos de las noticias del sector

Guía para quien escribe las noticias de RWAdar (a mano en el ciclo o cada
mañana con el procedimiento automático) y para quien las verifica. La
petición de la dirección (13/11/2026): «que las noticias tengan titulares
buenos y se priorice lo visual y la imagen, que atraiga».

Un titular de RWAdar tiene que **dar ganas de leer sin engañar**. Si hay que
elegir entre llamar la atención y ser exacto, gana ser exacto.

La parte que se puede medir la comprueba el programa
(`revisarEdicion()` de `rwadar-movil/lib/noticias-sector.js`): al publicar a
mano (`rwadar-publicar.js`, que se para con un error) y cada mañana, antes de
abrir el PR (el validador de las noticias automáticas, que además pasa el
camino entero del publicador: `prepararInicioPublicado()` de
`rwadar-noticias-portada.js`). Los **errores** paran la publicación; los
**avisos** los lee el verificador. Lo demás lo juzga el verificador con esta
guía delante.

**Para el procedimiento automático de cada mañana:** esta guía es el punto
de enganche. El procedimiento la lee entera antes de redactar, aplica § 1 y
§ 3 a cada titular y § 4 a cada foto, ata su SHA-256 (si la guía cambia, la
mañana siguiente usa la nueva) y frena si falta. Los apartados «1 · Las
reglas del titular», «2 · Ejemplos de las ediciones reales», «3 · Cómo se
escribe uno» y «4 · La foto» son fijos: una prueba los exige.

---

## 1 · Las reglas del titular

1. **Lo que cambia para el lector, primero.** Qué puede pasarle a quien
   invierte desde España, qué puede hacer ahora o qué ya no puede. No el
   organismo ni el trámite.
2. **Un verbo activo y un sujeto exacto.** «La CNMV autoriza…», «el emisor
   podrá restarte…». Nada de «se produce», «tiene lugar», «en el marco de».
   El sujeto es quien hace la cosa según la fuente (no «la UE» si lo pide el
   Consejo; no «los tokens» si quien resta es el emisor).
3. **Una cifra concreta si la hay**: cuántas firmas, cuántos euros, cuántas
   veces más. La cifra tiene que salir de la fuente (o de una cuenta directa
   con dos cifras de la fuente, como 300.000 / 6.000 = 50 veces) y estar
   también en el resumen o en «Por qué te importa».
4. **Largo: 60 caracteres como mucho, en castellano y en inglés.** Cualquier
   noticia puede acabar de portada (la primera de la edición, con la letra
   más grande) y en las tarjetas de dos columnas del móvil caben unas 4
   líneas de 17 caracteres. El validador de lectura admite 80 por las
   ediciones antiguas; al publicar, 60.
5. **Sin promesas ni exageraciones.**
   - **El programa lo para** (error): las frases de promesa, como palabras
     enteras: «rentabilidad garantizada», «garantizamos», «sin riesgo»,
     «oportunidad única» u «oportunidad de oro», «hazte rico», «chollo»,
     «pelotazo», «imperdible», «no te lo pierdas», «dinero fácil»; en
     inglés, «risk-free», «guaranteed return(s)», «get rich»,
     «once-in-a-lifetime», «don't miss». Y los signos «¡» y «!».
   - **El programa avisa y el verificador decide**: las raíces sueltas
     «garantiz», «asegur», «oportunidad», «guarantee» y «opportunit», que
     también salen en titulares correctos («bonos garantizados por el
     Estado», «una aseguradora tokeniza…», «la CNMV avisa de la falsa
     oportunidad…»); y las exageraciones «se dispara», «se desploma», «se
     hunde», «histórico», «revoluciona», «increíble», «brutal», «bomba»; en
     inglés, «skyrocket», «soar», «plunge», «crash», «historic»,
     «revolution», «incredible». En su lugar, el verbo llano y la cifra:
     «cae un 40 %», «sube a 300.000 millones».
6. **Lo que aún no es, no se cuenta como hecho.** Un proyecto «propone», una
   posición negociadora «pide», un folleto «permite» o «podrá». «Abre la
   puerta» o «ya» solo si ya ha pasado.
7. **Sin jerga si hay palabra corriente.** «Mercados tokenizados» mejor que
   «mercados DLT»; «firmas sin registro» mejor que «entidades no
   inscritas». Las siglas conocidas (CNMV, ESMA, UE) valen; las demás, no en
   el titular.
8. **Un consejo, solo si la fuente lo respalda y es prudencia genérica**
   («compruébalas antes de invertir», cuando el regulador ofrece su
   buscador). Nunca «compra», «vende», «invierte en».
9. **El titular se entiende solo.** Nada que remita a otra noticia que ya no
   está («Otras 11 firmas…»), ni preguntas cuya respuesta no esté en el
   resumen.
10. **Sin nombres de personas**, como el resto de la noticia.
11. **Inglés**: el mismo hecho y la misma cifra, no una traducción palabra a
    palabra; mismas reglas y mismo límite.
12. **Forma**: sin punto final (salvo el de una abreviatura: «EE. UU.»,
    «S. A.»), sin emojis, sin comillas de adorno, sin mayúsculas sostenidas.

## 2 · Ejemplos de las ediciones reales

**Buenos**

| Titular | Por qué funciona |
| --- | --- |
| España ya tiene dos mercados de valores tokenizados (51) | Hecho, cifra y verbo; se entiende sin saber qué es la CNMV. |
| Prosegur Cash tokeniza 500.000 € en pagarés (43) | Quién, qué y cuánto, en seis palabras. |
| 11 firmas sin registro: compruébalas antes de invertir (54) | Cifra y lo que puede hacer el lector, respaldado por el buscador de la CNMV que cita la fuente. |
| Robinhood: el emisor podrá restarte Stock Tokens por costes (59) | Lo que te puede pasar a ti, con el sujeto exacto y en futuro («podrá»), como dice el folleto. |
| Mercados tokenizados: los 27 piden un tope 50 veces mayor (57) | Cifra (300.000 / 6.000) y verbo de posición («piden»), sin la sigla DLT. |

**Malos (y cómo quedaron)**

| Titular | Problema | Mejor |
| --- | --- | --- |
| Europa busca el idioma común de los tokens | Vago: no dice qué cambia ni para quién. | Decir qué hace el grupo y para cuándo, o no darla como noticia para particulares. |
| La CNMV abre la puerta a tus quejas contra plataformas cripto | Suena a hecho y es un proyecto en consulta. | La CNMV propone atender tus quejas contra plataformas cripto |
| La CNMV destapa un clon de XTB y otros 8 chiringuitos | «Destapa» dramatiza un aviso rutinario y calla que dos eran clones de PJT. | 9 webs sin licencia, con clones de XTB y PJT: la CNMV avisa |
| Los Stock Tokens de Robinhood podrán cobrarse costes en tokens | Sujeto equivocado: los tokens no cobran; resta el emisor. | Robinhood: el emisor podrá restarte Stock Tokens por costes |
| Mercados DLT: los Veintisiete piden un tope 50 veces mayor | Jerga («DLT»). | Mercados tokenizados: los 27 piden un tope 50 veces mayor |
| Otras 11 firmas sin registro: avisos de tres países de la UE | «Otras» remite a una noticia que ya no estaba en la edición. | 11 firmas sin registro: compruébalas antes de invertir |
| Mercados tokenizados: los Veintisiete quieren un límite 50 veces mayor (70) | Demasiado largo para la portada y las tarjetas. | Mercados tokenizados: los 27 piden un tope 50 veces mayor |

## 3 · Cómo se escribe uno

1. Lee la fuente y apunta la frase que respalda el hecho (cita literal).
2. Escribe **tres propuestas** por idioma, distintas de verdad (otro ángulo,
   no otro orden de palabras).
3. Quita las que fallen una regla de § 1 y elige la que mejor diga qué
   cambia para el lector. Apunta en una frase por qué.
4. Cuenta los caracteres de las dos lenguas.
5. El verificador (que no es quien redacta) comprueba el elegido contra la
   cita literal y contra el resumen.

## 4 · La foto

Las fotos son de la biblioteca (fotos.json). Ninguna es una foto de la
noticia: ilustran su tema, y así se dice debajo de las noticias (la línea la
pone el programa según las fotos que se ven). Hay dos clases:

- **Fotos reales** con licencia libre de Wikimedia Commons (la biblioteca
  las admite desde el 22/11/2026; las que hay están en la tabla de abajo):
  llevan su crédito («Foto: autor · licencia · Wikimedia Commons») y su
  descripción, que es lo que de verdad se ve.
- **Escenas generadas con IA**: genéricas, sin texto, logotipos, banderas ni
  personas; se ven con «Ilustración generada con IA».

0. **Mientras «fotos.realesEnApp» sea false** en el config.json de las
   noticias automáticas, ninguna noticia lleva una foto real: la app
   instalada antes de la OTA con los créditos las daría por IA y sin el autor
   que pide su licencia (V-2 y el publicador lo paran). Se pone a true, en un
   PR aparte, después de enviar esa OTA. Hasta entonces, las reglas 1 y 6 se
   leen con las escenas de IA.
1. **Prefiere una foto real** que muestre de verdad lo que dice su
   descripción y que tenga que ver con la noticia: para una noticia de un
   supervisor, su sede si está en la biblioteca; para el oro, lingotes; para
   una bolsa, su edificio. Lee la descripción, no solo la clave.
2. **Nunca se presenta como foto del hecho**: la sede de la CNMV ilustra una
   noticia de la CNMV, no «la reunión de ayer». Ni el titular ni el resumen
   dicen «en la imagen».
3. **Sin personas reconocibles** (la biblioteca solo admite fotos reales sin
   ellas) y que la foto no diga lo contrario que la noticia: el rojo de
   alarma solo para avisos, fraude o riesgo; nada de oro para un bono ni de
   banco para una plataforma cripto; la sede de un supervisor no va con una
   noticia de otro.
4. **Ninguna foto se repite en la misma edición** (el programa lo para). Si
   el tema ya está usado, otra foto del mismo tema; si no hay, la de un tema
   cercano que no engañe.
5. **La portada** (la primera noticia) es la que más se ve: dale la foto más
   clara del tema. Si la portada de ayer llevaba la misma foto y hay otra del
   tema, cámbiala.
6. **Las escenas de IA, solo si ninguna foto real encaja**. Si tampoco encaja
   ninguna escena, la genérica de la categoría (genericas en fotos.json) y se
   apunta la foto que faltaría (faltaria) para ampliar la biblioteca. Las
   mañanas automáticas **nunca generan ni importan fotos**: las fotos reales
   las trae una persona con importar-foto.py (README de la biblioteca).
7. El crédito y la descripción son los de la biblioteca: no se escriben a
   mano en la noticia ni se cambian (el verificador lo comprueba).

| Tema | Fotos reales (primero) | Escenas de IA |
| --- | --- | --- |
| Regulación en España | `real-cnmv-sede-madrid`, `real-cnmv-entrada-edison`, `real-banco-espana-alcala`, `real-banco-espana-banderas` | `regulador-espana`, `regulador-espana-2`, `documentos-consulta` |
| Regulación en la UE | `real-comision-europea-berlaymont`, `real-bce-francfort`, `real-parlamento-europeo-bruselas` | `red-europea`, `instituciones-ue`, `instituciones-ue-2` |
| Avisos y fraude | `real-cnmv-sede-madrid`, `real-cnmv-entrada-edison`, `real-sede-bafin-francfort`, `real-sec-washington` | `alerta-fraude`, `pago-online`, `alerta-fraude-2`, `alerta-fraude-3` |
| Consultas y reclamaciones | `real-cnmv-sede-madrid`, `real-cnmv-entrada-edison`, `real-banco-espana-alcala` | `documentos-consulta` |
| Bonos, pagarés y deuda | `real-tesoro-eeuu-fachada` | `pagares-deuda`, `bonos-emision` |
| Inmobiliario | `real-urbanizacion-punta-prima` | `inmuebles-ciudad`, `inmuebles-costa` |
| Oro y materias primas | `real-lingotes-oro-400oz`, `real-lingote-oro-terciopelo` | `oro-pepitas` |
| Fondos monetarios y del Tesoro | `real-tesoro-eeuu-fachada`, `real-monedas-euro-bandera` | `fondos-liquidez` |
| Acciones tokenizadas | `real-bolsa-nueva-york-fachada`, `real-pantalla-cotizaciones-grafico` | `acciones-eeuu`, `acciones-movil` |
| Pagos y monedas estables | `real-monedas-euro-bandera`, `real-datafono-tarjeta` | `pago-online`, `moneda-digital` |
| Bancos | `real-banco-espana-alcala`, `real-banco-espana-banderas`, `real-cajero-teclado` | `banco-sala` |
| Bolsas y mercados | `real-bolsa-francfort-toro-oso`, `real-bolsa-nueva-york-fachada`, `real-pantalla-cotizaciones-grafico`, `real-bolsa-madrid-fachada` | `acciones-eeuu`, `bolsa-madrid` |
| Ciberseguridad | `real-sala-servidores-bastidores`, `real-servidores-cables` | `servidores-seguridad` |
| Emisiones e infraestructura | `real-sala-servidores-bastidores`, `real-servidores-cables` | `red-europea` |
| Internacional | `real-sede-bafin-francfort`, `real-sec-washington` | `planeta-noche` |

Genéricas por categoría (`genericas` en `fotos.json`; siempre fotos ya
publicadas):

- regulación → `regulador-espana`
- mercado → `red-europea`
- producto → `acciones-eeuu`
- riesgo → `alerta-fraude`

(Esta tabla es la de fotos.json: una prueba las compara; al importar una
foto real, se añade su clave en su columna. La sala de
operaciones que se probó el 14/11 no se aprobó, porque en sus dos tomas los
monitores salían con seudotexto; para bolsas y mercados quedan `bolsa-madrid`
y `acciones-eeuu`. Si un tema se queda sin foto, sale de la lista de temas y
se usa la genérica.)
