# Pedagogía · Cómo se aprende Excel de verdad

Línea de investigación: pedagogía basada en evidencia y diseño de ejercicios interactivos para una guía autodidacta de Excel (es-ES), de nivel 0 a autonomía en proyectos de empresa.
Fecha: 14/11/2026. Público: una mujer adulta que parte de cero y estudia sola.

Leyenda: **[VERIFICADO: url]** = comprobado en la fuente primaria (artículo, PDF del autor o página oficial leídos hoy). **[VERIFICADO-MOTOR]** = probado hoy en la hoja de práctica real (`app/motor.js` + HyperFormula 3.5.0, scripts en `research/work/ped_probe*.cjs`). **[CORREGIDO: url]** = el dato original era inexacto y se ha corregido con la fuente primaria. **[NO VERIFICABLE: no enseñarlo como dato]** = no se ha encontrado fuente fiable, así que no se enseña como dato. **[SIN VERIFICAR]** = dato de resumen secundario, de un extracto de buscador o deducción propia (pendiente de comprobar).

Cómo leer este documento: §0 son las reglas que hay que cumplir. §1 es la evidencia que las justifica. §2 da los números concretos para escribir lecciones. §3 resume a los formadores. §4 es el mapa de errores de principiante con su ejercicio-diagnóstico. §5 son los patrones de ejercicio y cómo se corrigen solos. §6 trata la motivación. §7 da la rúbrica. §8 recoge las salidas reales del motor. §9 son las alertas.

---

## 0. Lo esencial en 16 reglas

1. **Recordar sin mirar enseña más que releer.** Cada lección termina con 2-3 preguntas de recuerdo y cada módulo empieza con 2-4 preguntas de módulos anteriores. Releer da sensación de dominio, pero no lo da: una semana después, quien se había examinado recordaba el 56 % y quien había releído, el 42 %. Además, quien releyó se creía mejor preparado. [VERIFICADO: Roediger y Karpicke 2006, PDF]
2. **Repasar con huecos que crecen.** Las cajas de repaso de la app (1, 3, 7, 16 y 35 días) van en la buena dirección. El hueco óptimo entre repasos es una fracción del tiempo que hay que recordar: del 20 al 40 % si hay que recordar una semana, del 5 al 10 % si hay que recordar un año. [VERIFICADO: Cepeda et al. 2008, PDF] En el repaso hay que meter también **ejercicios de producción** (escribir la fórmula, predecir), no solo tarjetas que ella se puntúa sola.
3. **Mezclar tipos de problema en repasos y exámenes.** Lo que más falla en la oficina es elegir la herramienta, más que usarla: ¿SUMAR.SI.CONJUNTO, BUSCARX o una tabla dinámica? En práctica mezclada, la nota a los 30 días fue del 74 % frente al 42 % en práctica por bloques. [VERIFICADO: Rohrer, Dedrick y Stershic 2015, PDF (figura 4)]
4. **Primero un ejemplo resuelto, después uno a medio resolver y por último un problema entero.** Es mejor quitar primero los pasos finales («desvanecimiento hacia atrás»). [VERIFICADO: Renkl, Atkinson, Maier y Staley 2002, PDF]
5. **Quitar ayuda a medida que sabe más.** La ayuda que sirve a una novata estorba a quien ya domina el tema (efecto de inversión por pericia). La prueba de nivel debe permitir saltar ejemplos resueltos, y si acierta a la primera se pasa directamente a «hazlo sola». [VERIFICADO: Kalyuga et al. 2003, PDF]
6. **Guía explícita al principio y los errores tratados como información.** Con alguien que parte de cero hay que explicar y mostrar. Descubrir sin guía no funciona para novatos. [VERIFICADO: Kirschner, Sweller y Clark 2006 / Clark, Kirschner y Sweller 2012, PDF] Pero el entrenamiento que anima a equivocarse y a explorar (*error management training*) mejora la transferencia a tareas nuevas: d = 0,44 de media, d = 0,56 en transferencia y d = 0,80 en tareas distintas de las practicadas. 18 de los 24 estudios eran de aprender un programa informático. [VERIFICADO: Keith y Frese 2008, PDF] Solución práctica: guía en N0-N1 y cada vez más exploración desde N2, siempre con el mensaje «equivocarte aquí es gratis y es como se aprende».
7. **La corrección tiene que informar.** Decirle qué celda falla, qué da, qué debería dar, por qué y qué hacer. Un simple «correcto/incorrecto» apenas enseña. Feedback de refuerzo o castigo: d = 0,24. Corrección simple: d = 0,46. Feedback con mucha información: d = 0,99. [VERIFICADO: Wisniewski, Zierer y Hattie 2020, PMC]
8. **Tres pistas graduadas y la solución, solo al final.** Las pistas van de «orientar» a «casi la respuesta». Si ve la solución, la app le pone más tarde un **ejercicio gemelo** (mismo concepto, datos nuevos) para cerrar el ciclo.
9. **No avanzar con lagunas.** «Dominado» = acertado a la primera y sin pistas, y además en otro día distinto en lo crítico: referencias, búsquedas, condicionales y limpieza. El examen de nivel exige el 80 % a la primera, como ya hace la app.
10. **Una pantalla, una idea, y las instrucciones junto a la hoja.** Tener que ir y venir entre instrucciones y programa carga la memoria de trabajo (atención dividida), sobre todo cuando lo que se aprende obliga a manejar a la vez muchos elementos relacionados. [VERIFICADO: https://doi.org/10.1002/(SICI)1099-0720(199604)10:2%3C151::AID-ACP380%3E3.0.CO;2-U (Chandler y Sweller 1996, *Applied Cognitive Psychology* 10(2), 151-170)] La hoja en vivo debe estar en la misma pantalla que el enunciado. En el Excel real, las instrucciones van dentro del propio libro (hoja «Instrucciones»).
11. **Tareas completas de oficina desde el nivel 1.** Cada nivel acaba en una tarea con encargo real: un correo con ambigüedades, unos datos con problemas y una entrega con correo. La práctica de piezas sueltas (atajos, funciones) va en el repaso, no en lugar de la tarea. [VERIFICADO: https://www.4cid.org/about/ (4C/ID de van Merriënboer y Kirschner: las tareas de aprendizaje completas son la columna vertebral, y la práctica de partes solo se añade, además de las tareas completas, cuando hace falta mucha automatización); minimalismo de Carroll, «empezar enseguida con tareas con sentido» y «tareas reales» (Carroll 1990; van der Meij y Carroll 1995, *Technical Communication* 42(2)), comprobado en resumen secundario: https://www.instructionaldesign.org/theories/minimalism/]
12. **Enseñar a desconfiar del resultado.** En principiantes, el error más caro es metacognitivo: «si no sale ningún error, está bien». [VERIFICADO: Tort 2010, entrevista a una alumna] En auditorías a fondo, el 94 % de 85 hojas de empresa tenían errores, y las revisiones solo detectan de media el 60 % de los errores sembrados. [VERIFICADO: Panko 2015, PDF] Cada ejercicio de nivel 2 en adelante debe pedir una comprobación (total de control, cuadre, caso conocido).
13. **Pedir su seguridad antes de comprobar.** Una pregunta de un toque: «¿Qué seguridad tienes? Poca / Bastante / Total». Los errores cometidos con mucha seguridad se corrigen más a menudo que los cometidos con poca después de ver la respuesta correcta (efecto de hipercorrección). [CORREGIDO: https://pubmed.ncbi.nlm.nih.gov/11713883/ (Butterfield y Metcalfe 2001, *JEP: LMC* 27(6), 1491-1494; en el estudio se daba la respuesta correcta, no una explicación)] Además, así se le puede enseñar su calibración.
14. **Comprobar las fórmulas de forma automática por comportamiento, no por texto.** Se compara su resultado con el de la solución en la celda, en las copias y en escenarios con datos cambiados. Encima van reglas que reconocen cada error típico y dan un mensaje propio. Ver §5.15.
15. **Motivación adulta.** Explicar para qué le sirve en el trabajo, darle autonomía para saltar lo que ya sabe, y que el progreso visible sea de **habilidades** («ya sabes cruzar dos listados»), no de puntos. Evitar lo infantil. Cuando se muestra una racha rota, la gente vuelve menos a la actividad que cuando la racha sigue intacta, y el efecto se suaviza si la racha se puede «reparar». [VERIFICADO: https://doi.org/10.1093/jcr/ucac029 (Silverman y Barasch 2023, *Journal of Consumer Research* 49(6), 1095-1117; manuscrito aceptado en https://udspace.udel.edu/items/42ce576b-8e1f-429a-8541-e29e48dbcfbb)] Por eso conviene más una meta semanal con «comodín» (deducción de diseño, no probada en el estudio).
16. **Plan «si-entonces» desde el primer día.** Por ejemplo: «Si son las 21:00 de lunes, miércoles o jueves, entonces hago una lección». Las intenciones de implementación tienen d = 0,65 en 94 estudios. [VERIFICADO: Gollwitzer 2006 citando a Gollwitzer y Sheeran 2006] Una revisión de 2024 con 642 pruebas, corregida por sesgo, da efectos menores (d de 0,15 a 0,35). [VERIFICADO: https://doi.org/10.1080/10463283.2024.2334563 (Sheeran, Listrom y Gollwitzer, *European Review of Social Psychology* 36(1), 162-194, en línea en 2024; texto completo en https://kops.uni-konstanz.de/entities/publication/cf394f1f-49d8-4256-bf24-df7af124514a: media sin corregir d = 0,36; corregida por sesgo de publicación, d = 0,35 con *trim and fill* y d = 0,15 con RoBMA, un efecto pequeño pero sólido)]

---

## 1. La evidencia y cómo se aplica

### 1.1 Práctica de recuperación (*testing effect*)

**Qué dice la evidencia.**
- Roediger y Karpicke (2006), *Psychological Science* 17(3), 249-255. [VERIFICADO: https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf]
  - Experimento 1. A los 5 minutos, quien había releído recordaba más (81 % frente a 75 %). A los 2 días, quien se había examinado recordaba más (68 % frente a 54 %, d = 0,95). A la semana, 56 % frente a 42 % (d = 0,83).
  - Experimento 2 (SSSS = estudiar 4 veces; SSST = estudiar 3 y examinarse 1; STTT = estudiar 1 y examinarse 3). A los 5 minutos: 83 %, 78 % y 71 %. A la semana se invierte: STTT 61 %, SSST 56 % y SSSS 40 %.
  - Quien solo releyó **predijo que recordaría más** (4,8 frente a 4,0 en una escala de 1 a 7). La sensación de fluidez engaña.
  - Los tests **no tenían retroalimentación**, y aun así ganaron.
- Dunlosky, Rawson, Marsh, Nathan y Willingham (2013), *Psychological Science in the Public Interest* 14(1). Evaluaron 10 técnicas de estudio.
  - Utilidad **alta**: práctica con tests y práctica distribuida.
  - Utilidad **moderada**: interrogación elaborativa, autoexplicación y práctica intercalada.
  - Utilidad **baja**: resumir, subrayar, palabras clave mnemotécnicas, imágenes mentales para texto y releer.
  - [VERIFICADO: https://doi.org/10.1177/1529100612453266 (resumen del artículo original: utilidad alta para tests y práctica distribuida; moderada para interrogación elaborativa, autoexplicación y práctica intercalada; baja para resumir, subrayar, palabras clave mnemotécnicas, imágenes mentales para texto y releer); también https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html]
- Pretest: intentar responder antes de que se explique mejora el aprendizaje posterior, aunque se falle. [VERIFICADO: https://pubmed.ncbi.nlm.nih.gov/19751074/ (Richland, Kornell y Kao 2009, *J. Exp. Psych.: Applied* 15(3), 243-257: mejora incluso en las preguntas falladas en el pretest); https://pubmed.ncbi.nlm.nih.gov/19586265/ (Kornell, Hays y Bjork 2009, *JEP: LMC* 35(4), 989-998)]

**Cómo se aplica en la guía.**
- `recuerda` al final de cada lección: 2-3 preguntas de producción, sin mirar y sin poder volver a la explicación mientras responde. Por ejemplo: «escribe la fórmula», «¿qué da?» o «¿qué atajo…?». Mejor `formula`, `predice` y `respuesta_corta` que `test`. Reconocer una opción entre cuatro es más fácil que producirla.
- `repaso_inicial` de cada módulo: 2-4 ejercicios de **módulos anteriores**, mezclados.
- **Pre-pregunta** en la primera pantalla de algunas lecciones: «Antes de empezar, ¿cómo sumarías solo las ventas de Madrid?». Se acepta cualquier respuesta, no puntúa y no penaliza. Se le dice: «No pasa nada si no lo sabes: intentar responder antes ayuda a fijar lo que viene».
- Nada de «resumen para leer» al final. El resumen se convierte en preguntas.

### 1.2 Repaso espaciado

**Qué dice la evidencia.**
- Cepeda, Vul, Rohrer, Wixted y Pashler (2008), *Psychological Science* 19(11), 1095-1102. Más de 1.350 personas, con huecos de hasta 3,5 meses y pruebas de hasta un año. [VERIFICADO: https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf]
  - El hueco óptimo crece con el tiempo que hay que recordar, pero en proporción **baja**: del 20-40 % para recordar una semana al 5-10 % para recordar un año.
  - Huecos óptimos interpolados para recordar: unos 3, 8, 12 y 27 días cuando la prueba era a los 7, 35, 70 y 350 días. Son el 43 %, 23 %, 17 % y 8 % del plazo.
  - Mejora frente a no espaciar: +10 %, +59 %, +111 % y +77 % de recuerdo.
- Reaprendizaje sucesivo: practicar con preguntas hasta recordar bien cada respuesta en una sesión y volver a hacerlo en varias sesiones repartidas en días distintos. Combina dos técnicas muy potentes (tests y espaciado), y en un curso universitario real mejoró las notas de los exámenes y la retención a largo plazo. [CORREGIDO: https://eric.ed.gov/?id=EJ1036741 (Rawson, Dunlosky y Sciartelli 2013, *Educ. Psych. Review* 25(4), 523-548; el artículo la llama «técnica prometedora», no «la combinación más potente»)]
- Anki (programa de repaso espaciado) usa FSRS desde la versión 23.10. La «retención deseada» por defecto es el 90 %, y el manual avisa de que **por encima del 90 % la carga de repaso se dispara**. [VERIFICADO: https://docs.ankiweb.net/deck-options.html]

**Cómo se aplica en la guía.**
- La app ya tiene un Leitner de 5 cajas con 1, 3, 7, 16 y 35 días. Para una habilidad que debe durar años, **35 días como techo es corto**: conviene una sexta caja de unos 90 días. Con la regla de Cepeda (5-10 % de un año), lo estable acaba en repasos cada 3-6 semanas, o más. Lo que falla vuelve a la caja 1.
- **Repaso activo de ejercicios.** Se programan con el mismo calendario los ejercicios `formula`, `predice` y `respuesta_corta` ya resueltos, con prioridad para los que necesitaron pistas o fallaron. Se presenta un **ejercicio gemelo** (mismos conceptos, otros datos) cuando lo haya, para que no recuerde la respuesta de memoria.
- Tarjetas que ella misma puntúa («No me acordaba / Me costó / Fácil»). Sirven, pero la autoevaluación es optimista (§1.11). En las tarjetas con respuesta exacta (atajos, nombres de función), mejor que **escriba la respuesta** y la app la compare.
- Carga diaria: 10-15 minutos de repaso como máximo. Si se acumulan más de 30 pendientes (por ejemplo, tras una semana sin entrar), la app propone hacer solo 15 hoy y repartir el resto. Así el repaso no se convierte en una deuda que asusta.
- Ritmo de estudio recomendado: 20-30 minutos por sesión, 4-5 días por semana. Es mejor que 3 horas el sábado.

### 1.3 Práctica intercalada (*interleaving*)

**Qué dice la evidencia.**
- Rohrer, Dedrick y Stershic (2015), *J. Educational Psychology* 107(3). 126 alumnos de 7.º curso (12-13 años), 3 meses de práctica y prueba por sorpresa 1 o 30 días después. [VERIFICADO: PDF https://www.gwern.net/doc/psychology/spaced-repetition/2014-rohrer-2.pdf]
  - Práctica intercalada frente a práctica por bloques: d = 0,42 a 1 día y d = 0,79 a 30 días.
  - Notas leídas de la figura 4: 80 % frente a 64 % a 1 día, y 74 % frente a 42 % a 30 días.
  - Mecanismo: con práctica por bloques no hay que **elegir** estrategia, porque todas las preguntas de la tanda usan la misma.
- Kornell y Bjork (2008), *Psychological Science* 19(6). El 78 % de los participantes aprendió mejor con presentaciones espaciadas o intercaladas, pero **el 78 % creyó que la práctica agrupada era igual o mejor**. Sumando los experimentos 1a y 2: al 85 % le fue al menos igual de bien espaciando, pero el 83 % prefería agrupar. [VERIFICADO: PDF https://www.gwern.net/docs/spaced-repetition/2008-kornell.pdf]

**Cómo se aplica en la guía.**
- **Dentro de una lección** nueva: por bloques. Hay que aprender primero lo nuevo.
- **En `repaso_inicial`, repaso diario y examen de nivel**: siempre mezclado. Ningún bloque de 3 o más preguntas seguidas del mismo tema.
- **Ejercicios «elige la herramienta»** desde N2. Ver §5.9.
- Como la alumna sentirá que mezclar «va peor», hay que decírselo: «Mezclar temas cuesta más y parece que vas peor. Es normal: así es como se queda».

### 1.4 Ejemplos resueltos, desvanecimiento e inversión por pericia

**Qué dice la evidencia.**
- Renkl, Atkinson, Maier y Staley (2002), *J. Experimental Education* 70(4), 293-315. Ir de ejemplo completo a ejemplos cada vez más incompletos y de ahí a problema (*fading*) mejora el aprendizaje, al menos en transferencia cercana. El efecto se debe en parte a que comete **menos errores mientras aprende**. Y es **mejor quitar primero los últimos pasos** (desvanecimiento hacia atrás) que los primeros. [VERIFICADO: https://typeset.io/pdf/from-example-study-to-problem-solving-smooth-transitions-15tfd8h0l4.pdf]
- Kalyuga, Ayres, Chandler y Sweller (2003), *Educational Psychologist* 38(1), 23-31. Las técnicas muy eficaces con inexpertos «pueden perder eficacia e incluso tener consecuencias negativas» con aprendices con experiencia. [VERIFICADO: PDF https://typeset.io/pdf/the-expertise-reversal-effect-5y3mqyx7oo.pdf]
- Kirschner, Sweller y Clark (2006), *Educational Psychologist* 41(2), 75-86, y la versión divulgativa de 2012 en *American Educator*. Para novatos, la guía completa es más eficaz y eficiente que la guía parcial o el descubrimiento. [VERIFICADO: https://www.aft.org/sites/default/files/GuidedInstruction.pdf]
- Autoexplicación: pedir que explique por qué funciona un paso. Metaanálisis con 64 informes (69 tamaños del efecto): g = 0,55. [VERIFICADO: https://eric.ed.gov/?id=EJ1186664 (Bisra, Liu, Nesbit, Salimi y Winne 2018, *Educ. Psych. Review* 30(3), 703-725)]

**Cómo se aplica en la guía (secuencia tipo dentro de una lección).**

| Paso | Bloque o modo de la app | Ejemplo con BUSCARX |
|---|---|---|
| 1. Ejemplo resuelto | `pasos` («Ejemplo resuelto»), con la hoja de cada paso | Buscar el precio del código `P-104` en una tarifa: qué se busca, dónde se busca, qué se devuelve |
| 2. Autoexplicación | `test` o `abierta` corta | «¿Por qué el segundo argumento es A2:A20 y no A2:C20?» |
| 3. Falta el último paso | `formula` con `inicial` = `=BUSCARX(F2;A2:A20;` | Ella añade `C2:C20)` |
| 4. Faltan los dos últimos | `inicial` = `=BUSCARX(F2;` | Ella completa los rangos |
| 5. Problema entero | `formula` sin `inicial` | Mismo patrón con otros datos |
| 6. Variante con trampa | `formula` con `copiar_a` y `variantes` | Fijar los rangos con $ al copiar |
| 7. Mini-tarea | `formula` o `excel` | «Tu jefa quiere el precio y el proveedor de 5 pedidos» |

- **Saltar por pericia**: si acierta el paso 5 a la primera y sin pistas, la app ofrece saltar el 6 y pasar a la mini-tarea. Si en la prueba de nivel demostró el tema, la lección arranca en el paso 5 con el botón «Ver el ejemplo resuelto» plegado.
- Los ejemplos resueltos deben ser **de oficina y con datos creíbles**, no `A1+B1`. Si la diferencia entre el ejemplo y el problema es solo de datos, hay transferencia cercana. Si cambia la situación (otra columna, otra hoja, datos sucios), hay transferencia lejana. Hay que practicar las dos.

### 1.5 Carga cognitiva y diseño de pantallas

**Qué dice la evidencia.**
- La memoria de trabajo es muy limitada. El material que obliga a integrar fuentes separadas (texto en un sitio, diagrama o programa en otro) añade carga inútil (efecto de atención dividida). La información redundante también estorba, sobre todo a quien ya sabe (efecto de redundancia). [VERIFICADO: Kalyuga et al. 2003, PDF, apartados *split-attention* y *redundancy*]
- En aprendizaje de un programa informático, integrar las instrucciones en un solo soporte evita la atención dividida entre manual y pantalla. Con un programa de CAD/CAM y material con muchos elementos que interactúan, un manual autónomo que integraba la información, sin usar el ordenador, fue muy superior a los formatos con interacción continua con el ordenador. [CORREGIDO: https://doi.org/10.1002/(SICI)1099-0720(199604)10:2%3C151::AID-ACP380%3E3.0.CO;2-U (Chandler y Sweller 1996, *Applied Cognitive Psychology* 10(2), 151-170)] En otro estudio con 30 alumnos y un programa de CAD, quienes usaron un manual con capturas de pantalla y sin ordenador aprendieron el doble de rápido, sin diferencias en las pruebas práctica y escrita. [CORREGIDO: https://doi.org/10.1046/j.1365-2729.2000.00141.x (Martin-Michiellot y Mendelsohn 2000, *Journal of Computer Assisted Learning* 16(4), 284-293)]
- Principios multimedia de Mayer:
  - Segmentación: en trozos que ella controla. Mediana d ≈ 0,79 en 10 de 10 pruebas.
  - Preentrenamiento: aprender antes los nombres de las partes. d ≈ 0,75.
  - Coherencia: quitar adornos.
  - Señalización: resaltar lo importante.
  - [VERIFICADO: https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/principles-for-managing-essential-processing-in-multimedia-learning-segmenting-pretraining-and-modality-principles/DD24C2F48B9B1277CE59F78276110258 (Mayer y Pilegard 2014, cap. 13 del *Cambridge Handbook of Multimedia Learning*, 2.ª ed., pp. 316-344: segmentación, 10 de 10 pruebas, mediana d = 0,79; preentrenamiento, 13 de 16 pruebas, mediana d = 0,75). Coherencia y señalización, en el cap. 12 del mismo manual]
- Vídeos para enseñar programas: 8 pautas. En tres estudios con vídeos sobre el formato en Word, los vídeos hechos con ellas dieron, frente a un tutorial en papel, mejor motivación, más destreza justo después y mejor retención a la semana. Por ejemplo: vídeos cortos, que ella controle el ritmo y que las imágenes sean fieles a la interfaz real. [VERIFICADO: https://research.utwente.nl/en/publications/eight-guidelines-for-the-design-of-instructional-videos-for-softw/ (van der Meij y van der Meij 2013, *Technical Communication* 60(3), 205-228); las pautas de ejemplo, en un resumen que cita las páginas del artículo] Que pueda practicar justo después [NO VERIFICABLE: no enseñarlo como dato]

**Cómo se aplica en la guía.**
- **Preentrenamiento en N0**: antes de cualquier fórmula, la alumna toca y nombra las partes de la ventana (bloques `pantalla` y ejercicios `senala`): celda activa, cuadro de nombres, barra de fórmulas, controlador de relleno, pestañas de hoja y barra de estado. Sin ese vocabulario, las explicaciones posteriores sobrecargan.
- **Segmentación**: cada `texto` con una idea y 70-90 palabras como máximo. Nunca más de 2 pantallas de explicación seguidas. Es lo que ya pide la `GUIA-AUTORES.md`.
- **Señalización**: `resaltar` en la hoja de ejemplo para las celdas que importan. En la explicación, el mismo color que en la hoja.
- **Coherencia**: nada de imágenes decorativas, historietas largas ni datos con 12 columnas cuando bastan 4. Hojas de ejemplo de hasta 8 columnas y unas 15 filas.
- **Sin atención dividida**: enunciado, hoja y corrección en la misma pantalla, sin hacer scroll. En el `.xlsx` descargable, la hoja «Instrucciones» va primero y las celdas donde trabajar se marcan con color, para que no haya que tener la web abierta al lado.
- **Redundancia**: no leer en voz alta lo que ya está escrito, ni repetir en un `aviso` lo que acaba de decir el `texto`.

### 1.6 Retroalimentación inmediata y explicativa

**Qué dice la evidencia.**
- Wisniewski, Zierer y Hattie (2020), *Frontiers in Psychology* 10:3087. 435 estudios, d = 0,48 global. Según la información que lleva el feedback: refuerzo o castigo d = 0,24, corrección d = 0,46, feedback rico en información d = 0,99. «El feedback es más eficaz cuanto más información contiene». El 86 % de las intervenciones con efecto negativo sobre la motivación eran recompensas o castigos sin información. [VERIFICADO: https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456]
- Van der Kleij, Feskens y Eggen (2015), *Review of Educational Research* 85(4), 475-511. Feedback en entornos informáticos (40 estudios, 70 tamaños del efecto): explicativo 0,49, dar la respuesta correcta 0,32, solo «bien/mal» 0,05. El explicativo destacó sobre todo en aprendizaje de alto nivel. Los datos apuntaban a que el inmediato era mejor para aprendizaje de bajo nivel (y el diferido para el de alto nivel), pero esa interacción no fue significativa. [CORREGIDO: https://doi.org/10.3102/0034654314564881 (resumen del artículo)]
- Tutores «por pasos», que corrigen cada paso y no solo la respuesta final: d = 0,76, casi como un tutor humano (d = 0,79). Se creía que los tutores humanos daban d = 2,0. [VERIFICADO: VanLehn 2011, *Educational Psychologist* 46(4), https://eric.ed.gov/?id=EJ946764]
- Hipercorrección: los errores cometidos con mucha seguridad se corrigen más a menudo tras el feedback que los cometidos con poca seguridad, porque la sorpresa hace prestar más atención a la corrección. [VERIFICADO: Butterfield y Metcalfe 2001, *JEP: LMC* 27(6), 1491-1494; explicación por sorpresa y atención en https://pmc.ncbi.nlm.nih.gov/articles/PMC4084803]

**Cómo se aplica en la guía.**
- **Plantilla de mensaje de error en 4 partes.** La app ya hace las partes 1, 2 y 4. Falta la 3, específica de cada error típico.
  1. *Veredicto breve*: «Casi».
  2. *Qué ha pasado, con datos*: «En B4 tu fórmula da 80 y debería dar 96,80».
  3. *Por qué (el concepto)*: «Al copiarla, E1 se ha movido a E3, que está vacía: tu fórmula en B4 ha quedado `=A4*(1+E3)`».
  4. *Qué hacer*: «Fija la celda del IVA con $ (tecla F4) y vuelve a probar».
- **Mostrar la fórmula copiada.** La parte 3 es fácil con el motor: `hf.getCellFormula()` en la celda copiada. Probado: la fórmula `=A2*(1+E1)` copiada a B4 queda `=A4*(1+E3)`. [VERIFICADO-MOTOR] Es el mejor feedback posible para las referencias relativas y absolutas, porque ella **ve** el desplazamiento.
- **Inmediato en la práctica y diferido en el examen.** En el examen de nivel no se corrige pregunta a pregunta: al final se ve el informe completo, con explicación por pregunta y enlace a la lección.
- **Feedback también en el acierto.** Lo que se ha conseguido y para qué sirve en el trabajo, como ya pide la guía de autores. Si acertó **con poca seguridad**: «Bien. Lo has dudado: este tipo de ejercicio volverá en tu repaso».
- **Nada de feedback de persona** («¡Eres genial!») sin información de la tarea. Poco efecto y, en adultos, puede sonar condescendiente.

### 1.7 Errores, exploración y «fallo productivo»: cómo encajar evidencia que parece contradictoria

- **Entrenamiento con gestión del error** (Keith y Frese 2008, *J. Applied Psychology* 93(1), 59-69). 24 estudios y 2.183 personas. Exploración activa con instrucciones como «Cuantos más errores cometas, más aprendes» o «¿Has cometido un error? ¡Genial! Ahora puedes aprender algo nuevo». d = 0,44 global, 0,56 en transferencia tras el curso y **0,80 en transferencia adaptativa** (tareas estructuralmente distintas). El rendimiento *durante* el curso puede ser peor. 18 de los 24 entrenamientos enseñaban un programa informático nuevo. [VERIFICADO: https://www.humanw.tu-darmstadt.de/media/orgpsy/preversioneffectivenessoferrormanagement.pdf y https://fis.leuphana.de/en/publications/effectiveness-of-error-management-training-a-meta-analysis/]
- **Fallo productivo** (Sinha y Kapur 2021, *Review of Educational Research* 91(5), 761-798). Resolver primero y recibir la explicación después, frente a recibirla primero: g = 0,36 en 53 estudios y 166 comparaciones. Es mayor (g de 0,37 a 0,58) si se aplica con fidelidad a los principios del fallo productivo. **Favorece explicar primero** en niños pequeños (de 2.º a 5.º de primaria) y en habilidades generales, no ligadas a una materia. [VERIFICADO: https://doi.org/10.3102/00346543211019105 (resumen del artículo)]
- **Guía explícita** (Kirschner y otros, §1.4): para novatos, sin guía se aprende menos.

**Síntesis aplicable.**
1. **N0-N1**: guía explícita, ejemplos resueltos y errores «prevenidos» con avisos de `cuidado`. Aun así, la actitud ante el error se enseña desde el primer día: Ctrl+Z existe, nada se rompe y la hoja de práctica es para equivocarse.
2. **N2-N3**: alternar. Una lección de cada tres empieza con un **reto antes de explicar** (2-4 minutos, sin nota). Por ejemplo, «calcula el total por comercial» antes de la lección de SUMAR.SI.CONJUNTO. Después llega la explicación, que conecta con lo que intentó.
3. **N4-N6**: exploración con red. Proyectos con encargo ambiguo y datos sucios, pistas solo bajo demanda y una lección de «aprender una función nueva tú sola»: leer la ayuda de Microsoft, probar con un caso conocido y comparar.
4. **Siempre**: los ejercicios «encuentra el error» son un error **controlado**. Ella analiza el error de otra persona, sin el coste emocional del propio. Joung y otros describen una variante de la gestión del error en la que el formador elige los errores y la persona los analiza. [VERIFICADO: Keith y Frese 2008, PDF, apartado «Discussion»]

### 1.8 Aprendizaje por dominio (*mastery*)

**Qué dice la evidencia.**
- Programas de aprendizaje por dominio: efectos positivos en 108 evaluaciones controladas, con un efecto medio de unas 0,5 desviaciones típicas. [VERIFICADO: Kulik, Kulik y Bangert-Drowns 1990, *Review of Educational Research* 60(2), 265-299, https://eric.ed.gov/?id=EJ415887 (108 evaluaciones con efectos positivos); la media de 0,52 viene de resúmenes secundarios] Los cinco metaanálisis que recoge el Toolkit de la EEF dan efectos de 0,04 a 0,60, así que no hay una cifra estable. [VERIFICADO: https://educaixa.org/es/-/apendice-tecnico-mastery-learning]
- Bloom (1984) hablaba de 2 desviaciones típicas con tutor y dominio. VanLehn (2011) encontró d = 0,79 en tutoría humana, lejos de 2,0. [VERIFICADO: ERIC EJ946764] Conclusión: el dominio ayuda, pero no hay que prometer milagros.

**Cómo se aplica en la guía.**
- **Lección completada**: todos sus ejercicios resueltos, con o sin pistas.
- **Lección dominada**: el 80 % o más de los ejercicios acertados a la primera y sin pistas, y la mayoría del `recuerda` acertado en un repaso posterior (otro día).
- **Nivel aprobado**: examen del nivel con el 80 % a la primera y sin pistas (ya implementado). Si suspende:
  - informe de qué lecciones repasar;
  - nuevo intento con **otras preguntas** del mismo objetivo (hace falta un banco de 2 variantes por pregunta);
  - el reintento no se abre hasta el día siguiente, para forzar el espaciado.
- **Lo crítico** (referencias relativas y absolutas, BUSCARX o BUSCARV exacto, SUMAR.SI.CONJUNTO, SI con Y/O, limpieza básica, tabla dinámica): además, criterio de reaprendizaje sucesivo, que es acertar en 3 días distintos.
- **Sin bloquear a la fuerza**: puede abrir un nivel superior, pero la app le avisa de lo que le falta y la invita a hacer la prueba del módulo.

### 1.9 Práctica deliberada

**Qué dice la evidencia.**
- Ericsson, Krampe y Tesch-Römer (1993, *Psychological Review* 100(3), 363-406). La práctica deliberada es una actividad creada con el objetivo explícito de mejorar el rendimiento. Sus condiciones son motivación y esfuerzo, una tarea diseñada a partir de lo que la persona ya sabe, feedback informativo inmediato y la repetición de tareas iguales o parecidas, a ser posible con un profesor que diagnostica los errores. [CORREGIDO: https://doi.org/10.1037/0033-295X.100.3.363 (pp. 367-368)]
- La práctica deliberada explica bastante menos de lo que se decía: el 26 % de la varianza en juegos, el 21 % en música, el 18 % en deportes, el 4 % en educación y menos del 1 % en profesiones. Son 88 estudios con más de 11.000 participantes. [VERIFICADO: Macnamara, Hambrick y Oswald 2014, *Psychological Science* 25(8), 1608-1618, https://pubmed.ncbi.nlm.nih.gov/24986855/]

**Cómo se aplica en la guía.**
- Su versión útil para Excel es la **práctica dirigida a puntos débiles**. La app sabe qué ejercicios le cuestan (pistas, fallos, poca seguridad) y le ofrece «10 minutos de práctica de lo que más te cuesta», con ejercicios gemelos.
- **Retos cronometrados opcionales** desde N3. Por ejemplo, «limpia este listado en menos de 10 minutos». En una prueba de selección cuentan la exactitud y el tiempo. Ver `curriculo.md`, §3.
- Sin vender la idea de que la práctica lo explica todo. El mensaje debe ser «practicar bien, poco a poco y con corrección», no «10.000 horas».

### 1.10 Aprendizaje basado en problemas y escenarios. Tareas completas

**Qué dice la evidencia.**
- **4C/ID** (van Merriënboer, «Ten Steps to Complex Learning»). Para habilidades complejas, el eje del diseño son las **tareas completas y reales**, ordenadas de simples a complejas y con apoyo que se retira dentro de cada clase de tareas. Se combinan con:
  - información de apoyo (el porqué);
  - información de procedimiento justo a tiempo (cómo, en el momento);
  - práctica de partes para lo que se debe automatizar (atajos, sintaxis).
  [SIN VERIFICAR en esta sesión; marco bien establecido]
- **Minimalismo de Carroll**, nacido de formar a gente en programas de oficina (observó en IBM a personas que aprendían a usar procesadores de texto): orientarse a la acción (que haga tareas reales pronto), anclar en tareas de su trabajo, apoyar el reconocer y recuperarse de errores, y apoyar el «leer para hacer». [VERIFICADO: van der Meij y Carroll 1995, *Technical Communication* 42(2), 243-261; los cuatro principios aparecen recogidos en https://static.aminer.org/pdf/PDF/000/591/907/reconstructing_minimalism.pdf]
- **Currículo de hojas de cálculo** (Tort 2010, EuSpRIG). Propone principios explícitos en vez de «rutinas de botones» y explorar usos raros. Por ejemplo, copiar una fórmula a una celda **no adyacente** y pedir que imagine el resultado, u ordenar direcciones que empiezan por números. También propone enseñar qué errores detecta el programa y cuáles no, y dar hojas con errores para arreglar: espacios en vez de vacías, referencias relativas que debían ser absolutas, constantes dentro de fórmulas, una fórmula distinta en una fila de fórmulas iguales. [VERIFICADO: https://arxiv.org/pdf/1009.2787]

**Cómo se aplica en la guía.**
- **Cada nivel es una «clase de tareas»** con un proyecto de cierre. Dentro del nivel, el apoyo va de más a menos:
  - primer proyecto: plan de trabajo con pistas por paso;
  - segundo: solo los pasos;
  - examen: solo el encargo.
- **Información de procedimiento justo a tiempo**: el botón «Ayuda para este paso» de los proyectos y la tutora IA. Nunca un muro de teoría antes de la tarea.
- **Práctica de partes**: tarjetas de atajos y sintaxis, y retos cortos de velocidad.
- **Escenarios de empresa con personajes estables**, como en Coursera Macquarie (§3): la empresa de la guía, su jefa y los departamentos. Facilita la relevancia y que cada tarea se apoye en la anterior.

### 1.11 Metacognición: ilusiones de competencia y exceso de confianza

**Qué dice la evidencia.**
- Quien relee se cree mejor preparado (Roediger y Karpicke 2006). Quien agrupa la práctica cree aprender más (Kornell y Bjork 2008: 78 % y 83 %). [VERIFICADO: ver §1.1 y §1.3]
- En hojas de cálculo, la sobreconfianza es la norma. Tasa de error por celda en laboratorio del 3,9 % de media (14 estudios, 967 participantes). Errores en el 94 % de 85 hojas reales inspeccionadas a fondo. Detección media del 60 % al revisar, con algunos errores detectados por menos del 10 %. «Somos conscientes de muy pocos de los errores que cometemos». [VERIFICADO: Panko 2015, EuSpRIG, https://arxiv.org/pdf/1602.02601.pdf]
- En principiantes (proyecto francés DidaTab, unos 200 alumnos y 40 grabaciones de pantalla) [VERIFICADO: Tort 2010, https://arxiv.org/pdf/1009.2787; Tort, Blondel y Bruillard 2009, https://www.arxiv.org/pdf/0908.1580]:
  - comprueban que «está bien» porque «no salen # ni ceros»;
  - prefieren `+++` a SUMA porque se fían de su manera;
  - buscan una «orden mágica» recorriendo menús;
  - el ratón no para, sin pausas para pensar.

**Cómo se aplica en la guía.**
- **Pregunta de seguridad** antes de «Comprobar» en `formula`, `predice` y `test`. Es opcional y de un toque. En el perfil se ve su calibración: «Cuando dices "seguro", aciertas el 92 %. Cuando dices "poco", el 61 %: confía un poco más en ti». O al revés.
- **Rutina de comprobación**, enseñada en N1 y exigida desde N2 (está en la rúbrica). Responde a tres preguntas:
  1. ¿Cuadra con un total conocido?
  2. ¿Da lo esperado en un caso que puedo calcular de cabeza?
  3. ¿Qué pasa si cambio un dato?
  Ejercicios: `test` «¿Cómo comprobarías que tu total es correcto?» y `excel` con `controles`.
- **Predecir antes de pulsar Intro** (`predice`). Obliga a tener un modelo mental de lo que hará Excel y deja al descubierto los errores de concepto. Es el «predecir-observar-explicar» clásico. [VERIFICADO: White y Gunstone 1992, *Probing Understanding*, Falmer Press; https://arbs.nzcer.org.nz/node/7187]
- **Avisar de la ilusión**: en la primera lección de cada nivel, una pantalla corta explica que releer o ver vídeos da sensación de saber y que lo que funciona es intentar sin mirar.

### 1.12 Lo que se ha descartado o rebajado

- **Estilos de aprendizaje** (visual, auditivo…): sin respaldo. No hay pruebas adecuadas que justifiquen adaptar la enseñanza al estilo de cada persona. No se usan para personalizar. [VERIFICADO: Pashler, McDaniel, Rohrer y Bjork 2008, *Psychological Science in the Public Interest* 9(3), 105-119, https://pubmed.ncbi.nlm.nih.gov/26162104/]
- **«Cuanto más largo el vídeo, mejor explicado»**: no. Los formadores con más éxito usan vídeos de unos 3 minutos (ExcelJet) o de 2-5 minutos (MyOnlineTrainingHub). Ver §3.
- **Nombres de rango como solución a los errores**: dos estudios con usuarios intermedios encontraron que los nombres **no mejoran** la fiabilidad de fórmulas simples y alargan el tiempo de desarrollo. [VERIFICADO: McKeever y McDaid 2011, ICSOFT, https://www.scitepress.org/PublishedPapers/2011/35102/35102.pdf] En la guía, los nombres se enseñan como herramienta (N4), no como «buena práctica obligatoria». Para que los rangos crezcan solos, se enseñan **tablas** (Ctrl+T).

---

## 2. Receta de diseño con números concretos

### 2.1 Tamaño y ritmo

| Elemento | Valor recomendado | Por qué |
|---|---|---|
| Lección | 10-20 minutos y una idea principal | Segmentación. Encaja en una sesión diaria |
| Pantallas por lección | 10-16, de ellas 6-9 ejercicios | Ritmo explicar → practicar (`GUIA-AUTORES.md`) |
| Texto por pantalla | Una idea, ≤ 70-90 palabras | Carga cognitiva |
| Ejercicios seguidos sin explicación nueva | ≤ 4. Después, una pantalla de «lo que acabas de aprender» con la regla en una frase | Consolidar sin cansar |
| `recuerda` | 2-3 por lección, de producción | Práctica de recuperación |
| `repaso_inicial` | 2-4 por módulo, de módulos anteriores y mezclados | Recuperación e intercalado |
| Repaso diario | 10-15 minutos como máximo, 10-20 elementos | Espaciado sostenible |
| Sesión | 20-30 minutos, 4-5 días por semana | Espaciado y hábito |
| Examen de nivel | 12-15 preguntas, ≥ 80 % a la primera y sin pistas, reintento a las 24 h con otras preguntas | Dominio |
| Duración total N0-N6 | Unas 100-140 h, incluidos proyectos (estimación propia) [NO VERIFICABLE: no enseñarlo como dato] | La especialización de Macquarie son 107 h para 4 cursos y no llega a autonomía en proyectos. [VERIFICADO: https://www.coursera.org/specializations/excel] |

### 2.2 Plantilla de lección (orden de pantallas)

1. **Gancho de trabajo** (`texto` + `aviso empresa`): «Tu jefa te pasa este listado y te pide…». Una frase de **para qué sirve**.
2. *(Opcional, 1 de cada 3 lecciones desde N2)* **Reto antes de explicar** (`formula` o `abierta`) sin nota.
3. **Concepto** con ejemplo visible (`texto` + `hoja` con `resaltar` y `mostrar_formulas`).
4. **Primera práctica muy fácil** (`formula` o `predice`). Que acierte.
5. **Ejemplo resuelto** (`pasos`).
6. **Completar** (`formula` con `inicial` a medio escribir).
7. **Hacer sola** (`formula`).
8. **Encuentra el error** (`formula` con `inicial` errónea) o **predice** con trampa.
9. **Test de concepto** (`test` con `porque` por opción y distractores que son errores reales).
10. **Mini-tarea de oficina** (`formula` con `copiar_a` y `variantes`, o `excel`).
11. **Recuerda** (2-3).
12. **Tarjetas** (2-5) al repaso.

### 2.3 Pistas graduadas

Hay tres niveles, y ya existen en la app como `pistas` (3). Cómo se escriben:

| Nivel | Función | Ejemplo con «total con IVA y referencia fija» |
|---|---|---|
| 1. Orientar | Recordar la meta o el concepto, sin decir cómo | «Primero piensa el importe sin IVA de la fila 2: ¿qué dos celdas multiplicas?» |
| 2. Estrategia | Decir qué estructura o función usar | «Multiplica ese importe por (1 + la celda del IVA). Ojo: tu fórmula se va a copiar hacia abajo.» |
| 3. Casi respuesta | El paso que falta, a falta de escribirlo | «Al copiar, B6 se movería a B7, B8… Fíjala: `$B$6`.» |

**Reglas para la solución:**
- El botón «Ver solución» se activa tras agotar las 3 pistas **o** tras 3 intentos fallidos.
- Al ver la solución, el ejercicio cuenta como «resuelto con ayuda». La app pone en la cola de repaso un **gemelo** para 1-3 días después.
- La tutora IA sigue la misma escala. Su indicación actual ya lo hace: «primero una pista o una pregunta; la solución completa solo si la pide o tras dos intentos».
- **No hay castigo visible por pedir pistas**: nada de restar puntos de forma llamativa. Se registra para el repaso y para las estrellas («a la primera y sin pistas»), que es información, no castigo.

### 2.4 Mensajes de corrección

- **Siempre**: la celda, el valor que da y el que debería dar, con el formato español (`302,50 €`, `14/11/2026`).
- **Por error típico**: ver §4 y la propuesta de «diagnósticos» de §5.15.
- **Tono**: adulto, cercano, sin infantilizar.
  - Sí: «Casi. Tu fórmula suma también la fila del subtotal, así que el total sale doble».
  - No: «¡Ups! ¡Inténtalo de nuevo, campeona!».

### 2.5 Prueba de nivel inicial (para saltar niveles)

- 3-4 preguntas por nivel, de dificultad representativa y autocorregibles. Ya está así en `prueba_nivel.json`.
- **Adaptativa por escalones**. Empieza en N1.
  - Con ≥ 80 % en un nivel, pasa al siguiente.
  - Con 2 fallos en un nivel, se detiene.
  - Se le propone empezar en el nivel más alto aprobado y repasar en cuanto empiece los temas que fallaron.
- Pregunta de seguridad en cada ítem. Si acierta con «poca seguridad», se le recomienda repasar el módulo aunque lo apruebe.
- Lo que se salta no desaparece: se marca «Superado en la prueba». Sus tarjetas entran en el repaso para que no se pierda, y cada módulo tiene «¿Ya lo sabes? Demuéstralo», que es su examen.

---

## 3. Cómo secuencian los mejores formadores de Excel

| Formador o curso | Secuencia y formato | Qué hace especialmente bien | Qué copiar |
|---|---|---|---|
| **ExcelJet** (Dave Bruns), curso *Core Formula* | 11 secciones en este orden: fundamentos de fórmulas, referencias, rangos con nombre, rangos dinámicos, SI, texto, fechas y horas, estadística, búsquedas, trucos de productividad, auditoría y resolución de problemas. Vídeos de 3 minutos o menos, con **una hoja de práctica por vídeo** (más de 100) y la filosofía «less is more». [VERIFICADO: https://exceljet.net/training/core-formula] El catálogo tiene 9 cursos: Excel 101, Core Excel, Pivot, Formula, Dynamic Arrays, Charts, Shortcuts, Tables y Conditional Formatting. [VERIFICADO: https://exceljet.net/training] | Brevedad extrema, **referencias justo después de lo básico**, la auditoría como tema propio y atajos en cada vídeo | Las referencias muy pronto (N1), una lección de «auditar y depurar» por nivel y una práctica por concepto |
| **Coursera** «Excel Skills for Business» (Macquarie University) | 4 cursos en orden: Essentials (26 h), Intermediate I (28 h), Intermediate II (28 h) y Advanced (25 h). **107 h**, 6 módulos semanales de 3-5 h, valoración 4,9 (64.272 reseñas), 728.235 inscritos. Libros descargables con «practice challenges». Escenarios con personajes: la empresa ficticia **PushPin** y su empleada **Uma** (Intermediate I), y el consultor **Alex**, que arregla hojas con problemas (Intermediate II). Intermediate II dedica un bloque a **comprobación y prevención de errores**. [VERIFICADO: https://www.coursera.org/specializations/excel] | Narrativa de empresa continua, ritmo semanal y la prevención de errores como contenido | Personajes estables de empresa, módulos con «reto práctico», y la prevención y comprobación de errores como lección y criterio de rúbrica |
| **Chandoo** (Excel School) | 6 módulos de Excel avanzado más 1 de cuadros de mando. Unos 70 vídeos y más de 50-60 libros de ejemplo. Deberes con soluciones y «class projects». Recomienda seguir el orden. [NO VERIFICABLE: no enseñarlo como dato] | Aprender **desmontando libros reales** y proyectos de cuadro de mando | Libros de solución con fórmulas reales para «desmontar» (el `-solucion.xlsx`) y un proyecto de cuadro de mando en N5 |
| **MyOnlineTrainingHub** (Mynda Treacy) | Curso *Excel Expert* por sesiones numeradas, con «piezas pequeñas de 2-5 minutos», libros y datos de práctica, foro y certificado. [NO VERIFICABLE: no enseñarlo como dato] | Lecciones cortas, foro de dudas y rutas separadas: Excel, Power Query, cuadros de mando y Power BI | Ruta clara después de N4 (Power Query y Power Pivot) y la «Consulta» de la app como foro |
| **Leila Gharani** (XelPlus) | *Excel Essentials for the Real World* para empezar, más un curso aparte de ejercicios. Cubre fórmulas, tablas dinámicas y Power Query, y los últimos temarios incluyen Copilot. [NO VERIFICABLE: no enseñarlo como dato] | «Mundo real»: casos de oficina y ejercicios separados de la teoría | Un banco de ejercicios aparte (la «hoja libre» y los retos) y relevancia laboral explícita |
| **Microsoft** (soporte y Learn) | El centro de Excel en español es un **centro de ayuda con artículos**: empezar, colaboración, fórmulas y funciones, importar y analizar, dar formato, solucionar problemas y Copilot. No se ha encontrado en es-ES una secuencia de vídeo-curso. [VERIFICADO: https://support.microsoft.com/es-es/office/aprendizaje-en-v%C3%ADdeo-de-excel-9bc05390-e94c-46af-a5b3-d7c22f6990bb] | Referencia oficial y actualizada | Enseñar **a usar la ayuda oficial** como habilidad de autonomía (N4-N6), con el aviso de `localizacion.md` sobre las traducciones automáticas erróneas |
| **GCFGlobal / LearnFree** | Tutorial por lecciones: interfaz, celdas, formato, fórmulas, gráficos, tablas… [NO VERIFICABLE: no enseñarlo como dato] | Gratuito y **muy de cero** | El nivel de detalle de N0: abrir, guardar, seleccionar, filas y columnas |
| **Ken Puls** (Excelguru; libro con Miguel Escobar *Master Your Data with Power Query in Excel and Power BI*, 2.ª ed. 2021) | 20 capítulos, de «Power Query Fundamentals» a lógica condicional (cap. 14), fechas y horas (18), optimización (19) y actualización automática (20). [NO VERIFICABLE: no enseñarlo como dato] | Power Query enseñado como **flujo repetible**: importar, transformar, cargar y actualizar el mes siguiente | En N4-N5, que cada práctica de Power Query termine con «llega el mes siguiente: sustituye el archivo y pulsa Actualizar» |
| **CFI** (Corporate Finance Institute) | Cursos de Excel para finanzas, como *Excel Fundamentals: Formulas for Finance* (unas 2 h 14 min: SUMAR.SI.CONJUNTO, INDICE y COINCIDIR, BUSCARX, SI, VNA y TIR). Evaluación final con test, rellenar huecos y preguntas en Excel en los cursos avanzados. Test gratuito de 20 preguntas con un 80 % de referencia. [NO VERIFICABLE: no enseñarlo como dato] | Orientación a puesto (finanzas) y evaluación con preguntas en Excel | Variantes de proyecto por departamento y examen con tareas en el libro |

**Consenso de secuencia** (coincide con `curriculo.md` §5):
1. Interfaz y datos.
2. Fórmulas y **referencias**, muy pronto.
3. Formato.
4. Funciones básicas, SI y condicionales.
5. Tablas, ordenar y filtrar.
6. Búsquedas.
7. Texto y fechas.
8. Tablas dinámicas y gráficos.
9. Auditoría.
10. Power Query.
11. Modelos y cuadros de mando.

**Lo que casi ningún curso comercial hace y la guía sí debe hacer:**
1. Repaso espaciado y recuperación programada.
2. Diagnóstico de errores de concepto con feedback específico.
3. Proyectos con **encargo ambiguo** (preguntas previas y aclaraciones).
4. Comprobación y control de calidad como criterio de nota.
5. Calibración de la seguridad.

---

## 4. Mapa de errores conceptuales de principiante

Formato de cada ficha: **Síntoma** (lo que ve) · **Causa** (el modelo mental equivocado) · **Diagnóstico** (ejercicio que lo destapa, con modo de la app y datos) · **Explicación** (texto para la corrección) · **Motor** (si la hoja de práctica lo reproduce como Excel).

Nivel donde aparece: N0-N1 = E01-E12, N2 = E13-E24, N3 en adelante = E25-E32.

### E01 · Escribir el resultado a mano en lugar de una fórmula
- **Síntoma**: el total no cambia cuando cambian los datos. Hay «números mágicos» pegados encima de fórmulas.
- **Causa**: ve la hoja como un papel, no como un cálculo vivo.
- **Diagnóstico**: `formula` con `variantes` (por ejemplo, `[{"B2":3}]`). Si escribe `=18,15` o `18,15`, falla. Además, `test`: «Tu compañera ha escrito 1.250 en la celda del total. ¿Qué pasará cuando lleguen más ventas?».
- **Explicación**: «Has escrito el resultado, no el cálculo. Si cambia un dato, este total no se entera. Apunta a las celdas: =B2*C2.»
- **Motor**: el corrector lo detecta solo, con el mensaje «Has escrito un número o un texto fijo…» o, en las variantes, «si cambian los datos tu fórmula no se actualiza bien». [VERIFICADO-MOTOR]

### E02 · Fórmula sin «=», o con «+» o espacio delante
- **Síntoma**: la celda muestra `B2*C2` como texto.
- **Causa**: no sabe que «=» es lo que convierte la entrada en cálculo.
- **Diagnóstico**: `formula`. La app ya avisa si no empieza por «=». `test` con las opciones `B2*C2`, `=B2*C2` y `'=B2*C2`.
- **Explicación**: «Todo cálculo empieza con =. Sin él, Excel lo guarda como texto.»

### E03 · Usar SUMA de forma redundante: `SUMA(A1+A2+A3)`, `SUMA(A1*12)`
- **Síntoma**: el resultado es correcto, pero la fórmula es frágil y no se amplía.
- **Causa**: cree que SUMA «activa» el cálculo, o que `+` y SUMA son lo mismo. Observado en DidaTab: `SUM(A1+A2+A3)`, `PRODUCT(A1*12,5)`. [VERIFICADO: Tort et al. 2009, tabla 1]
- **Diagnóstico**: `test` «¿Qué diferencia hay entre `=A1+A2+A3` y `=SUMA(A1:A3)` si insertas una fila entre la 2 y la 3?». Como el valor coincide, hay que detectarlo con regla estática (§5.15: «SUMA con + dentro»).
- **Explicación**: «SUMA ya suma: dale un rango (A1:A3). Si insertas una fila dentro del rango, el rango crece solo; con + tendrías que añadirla a mano.»
- **Motor**: `=SUMA(A1+A3)` da 40, el mismo valor. [VERIFICADO-MOTOR] Insertar una fila dentro amplía `SUMA(A1:A3)` a `SUMA(A1:A4)`. [VERIFICADO-MOTOR, `addRows`]

### E04 · Prioridad de los operadores
- **Síntoma**: medias o incrementos que salen disparatados.
- **Causa**: lee de izquierda a derecha como en una calculadora de bolsillo.
- **Datos oficiales**: orden de Excel = referencias (`:` espacio) → **negación (−)** → `%` → `^` → `*` `/` → `+` `-` → `&` → comparaciones. Los del mismo nivel, de izquierda a derecha. Ejemplos oficiales: `=5+2*3` da 11 y `=(5+2)*3` da 21. [VERIFICADO: https://support.microsoft.com/en-us/office/calculation-operators-and-precedence-in-excel-48be406d-4975-4d31-b2b8-7af9e0e2878a]
- **Diagnóstico**: `predice`.
  1. `=H2-H1/H1` con H1 = 100 y H2 = 120: da **119**, no 20 %. [VERIFICADO-MOTOR]
  2. `=A1+B1/2`.
  3. Avanzado: `=-2^2` da **4** en Excel (la negación va antes que la potencia). En cambio, `=0-2^2` da −4. [VERIFICADO-MOTOR, coincide con el orden oficial]
- **Explicación**: «Excel multiplica y divide antes de sumar y restar. Para el incremento, el paréntesis manda: =(H2-H1)/H1.»

### E05 · Porcentajes
- **Síntomas**:
  - (a) `=A1+10%` para «subir un 10 %» da 100,1, no 110. [VERIFICADO-MOTOR]
  - (b) Al aplicar formato % a una celda que ya tiene 10, aparece **1000,00 %**. [VERIFICADO: https://support.microsoft.com/en-us/excel/format-numbers-as-percentages-in-excel]
  - (c) Escribe 21 en la celda del IVA y multiplica por 21.
- **Causa**: no sabe que 10 % es el número 0,1 con otro aspecto.
- **Diagnóstico**: `predice` «A1 vale 100. ¿Qué da `=A1+10%`?» → 100,1. `formula` «sube un 10 % el precio» con `errores_tipicos` `=A1+10%` y `=A1*10%`. `test` con la opción del 1000 %.
- **Explicación**: «10 % es 0,1. Sumarle 0,1 a 100 da 100,1. Para subir un 10 %: =A1*(1+10%) o =A1*1,1, mejor con el 10 % en una celda.»
- **Regla oficial**: en celdas vacías ya formateadas como %, los números ≥ 1 se toman como porcentaje (10 → 10 %) y los menores que 1 se multiplican por 100. [VERIFICADO: misma página]

### E06 · Referencias relativas frente a absolutas al copiar
- **Síntoma**: la primera fila está bien y las copiadas dan 0, #¡VALOR! o importes absurdos. O, para no fallar, escribe una fórmula distinta en cada fila.
- **Causa**: cree que la fórmula guarda «la celda B6» y no «la celda que está 4 filas más abajo». No conoce el $. Observado en DidaTab: «escribir fórmulas sucesivas con referencias relativas en vez de una con referencia absoluta y copiarla». [VERIFICADO: Tort et al. 2009, tabla 1] Excel **no puede detectar** este error cuando la celda desplazada contiene un número. Tort muestra `=B4*F1` copiada, que da errores en un caso y valores falsos sin aviso en otro. [VERIFICADO: Tort 2010, fig. 5]
- **Diagnóstico**:
  1. `formula` con `copiar_a` (ya en el ejemplo de la app).
  2. `respuesta_corta`: «Copias `=B2*$E$1` de C2 a C5. ¿Qué fórmula queda en C5?» → `=B5*$E$1`.
  3. Uso raro, a lo Tort: copiar a una celda **no adyacente**. «Copias `=A2*B$1` de C2 a E7: ¿qué queda?» → `=C7*D$1`.
  4. N2: tabla de doble entrada (precio × cantidad) con referencias mixtas `$A3*B$2`.
- **Explicación**: mostrar la fórmula tal como quedó en la celda copiada. «En B4 tu fórmula ha quedado =A4*(1+E3): E1 se ha movido dos filas, hasta una celda vacía. Pon $E$1 (F4).»
- **Motor**: el corrector lo detecta con `copiar_a`, con el mensaje «En B2 está bien, pero al copiar la fórmula a B3 da 250 en vez de 302,5…». `getCellFormula` devuelve la fórmula desplazada. [VERIFICADO-MOTOR]

### E07 · Formato frente a valor (el redondeo que se ve)
- **Síntoma**: la suma «no cuadra» con lo que se ve. Tres celdas que muestran 0,33 suman 1,00. O borra decimales a mano para «redondear».
- **Causa**: cree que lo que ve es lo que hay. Observado en DidaTab: «borrar cifras decimales del número en vez de cambiar el formato». [VERIFICADO: Tort et al. 2009, tabla 1]
- **Datos oficiales**: Excel trabaja con 15 cifras significativas. Para que lo visible sea lo calculado hay que usar REDONDEAR o la opción «Establecer precisión según pantalla», que es **irreversible**: «no se puede deshacer y recuperar los datos perdidos». [VERIFICADO: https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/floating-point-arithmetic-inaccurate-result]
- **Diagnóstico**: `predice` con C1:C3 = 1/3 y formato `num2`: «¿Qué muestra =SUMA(C1:C3)?» → 1,00, aunque cada celda muestra 0,33. [VERIFICADO-MOTOR: SUMA = 1] `test`: «Las facturas con IVA no cuadran por 1 céntimo con el total, ¿qué haces?». La buena: REDONDEAR cada línea a 2 decimales.
- **Explicación**: «El formato solo cambia el aspecto. Si necesitas que el importe sea de 2 decimales de verdad, por ejemplo en facturas, usa =REDONDEAR(…;2).»
- **Motor**: el motor no reproduce los artefactos de coma flotante de Excel. `=1*(0,5-0,4-0,1)` da 0 en el motor y −2,78E-17 en Excel. [VERIFICADO-MOTOR y página de Microsoft] No poner ejercicios `predice` de coma flotante. Explicarlo con `texto` o en Excel real.

### E08 · Números guardados como texto
- **Síntoma**: SUMA da menos de lo esperado, CONTAR no cuenta, BUSCARX da #N/D con un código que «está ahí» (1001 frente a "1001"), alineación a la izquierda y triángulo verde. Ordenar da 1, 10, 100, 2…
- **Causa**: no distingue el tipo de dato. Llega así desde ERP, CSV o web, o por escribir sobre celdas con formato Texto.
- **Datos oficiales**: el triángulo verde aparece al importar o al escribir en celdas con formato texto (si se aplica el formato Texto después de escribir los números, no aparece). [VERIFICADO: https://support.microsoft.com/es-es/excel/fix-text-formatted-numbers-by-applying-a-number-format] Al ordenar, los números guardados como texto se colocan mal. [VERIFICADO: https://support.microsoft.com/en-us/office/sort-data-in-a-range-or-table-62d0b95d-2a90-4610-a6ae-2e545c4a4654]
- **Diagnóstico**: `predice` con A1 = 10, A2 = "20" (texto) y A3 = 30.
  - `=SUMA(A1:A3)` → **40**: SUMA ignora el texto.
  - `=A1+A2+A3` → **60**: + lo convierte.
  - `=CONTAR(A1:A3)` → **2**.
  Es un ejercicio excelente: los dos caminos «que dan lo mismo» dan distinto. `formula` «arregla la suma» con `VALOR`, o en Excel real con «Convertir en número» o Texto en columnas.
- **Explicación**: «A2 parece 20, pero es texto. SUMA no suma textos; el + sí intenta convertirlos. Conviértelo en número de verdad y SUMA te dará 60.»
- **Motor**: ⚠️ **hoy no se reproduce con `{"texto":"20"}`**. El motor pasa `"20"` a HyperFormula, que lo convierte en número: SUMA da 60, CONTAR 3 y ESNUMERO VERDADERO. Con `{"texto":"001"}` la celda vale **1**. Con un apóstrofo delante (`"'20"` o `{"v":"'20"}`) sí se comporta como Excel: SUMA 40, A1+A2+A3 60, CONTAR 2, ESTEXTO VERDADERO, y la celda muestra «20». [VERIFICADO-MOTOR] Ver la alerta en §9.

### E09 · Fechas como números de serie
- **Síntoma**: aparece 46340 donde debería salir una fecha, o al revés. La resta de fechas da «un número raro» (son días). Las fechas importadas no ordenan ni filtran por mes. 12/01/2026 se lee como 1 de diciembre porque viene de un CSV en formato de EE. UU.
- **Causa**: no sabe que una fecha es un número con formato.
- **Datos oficiales**: Excel usa el sistema de serie de Lotus 1-2-3 y trata 1900 como bisiesto (hereda el error), así que DIASEM falla antes del 01/03/1900. [VERIFICADO: https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/wrongly-assumes-1900-is-leap-year] Para ordenar, «todas las fechas de una columna deben estar guardadas como número de serie». [VERIFICADO: página de ordenar, arriba]
- **Diagnóstico**:
  - `predice`: G1 = 14/11/2026 y `=G1*1` → 46340. [VERIFICADO-MOTOR]
  - `predice`: `=FECHA(2026;12;25)-FECHA(2026;11;14)` → 41 días.
  - `test`: «Te llega una columna con 03/04/2026 de un sistema americano: ¿qué día es?».
  - `excel` con fechas como texto («2026-11-14», «14.11.2026») que hay que convertir.
- **Explicación**: «Para Excel, una fecha es el número de días desde el 1/1/1900. Por eso puedes restarlas y sumarles días. Si la columna no se deja ordenar, probablemente son textos con forma de fecha.»
- **Motor**: el motor usa como día 0 el 30/12/1899 y no tiene el falso 29/02/1900. Las series coinciden con Excel **desde el 01/03/1900**. `FECHA(1900;2;29)` da 61 en el motor (en Excel, 60). [VERIFICADO-MOTOR] No usar fechas anteriores a marzo de 1900. `="14/11/2026"*1` da 46340, igual que Excel es-ES. [VERIFICADO-MOTOR]

### E10 · Horas como fracción del día
- **Síntoma**: 12:00 es 0,5. Al sumar horas trabajadas, más de 24 h «vuelven a cero» (25:30 sale 1:30). `=B2*15` para pagar horas da céntimos.
- **Causa**: no sabe que 1 = un día.
- **Diagnóstico**: `predice` `=HORA("12:00")`, `="12:00"*24` → 12. `test`: «¿Qué formato muestra 25:30?» → `[h]:mm`. `excel` con un parte de horas.
- **Explicación**: «Una hora es 1/24 de día. Para pagar horas: =B2*24*precio. Para ver más de 24 h, el formato es [h]:mm.»
- **Motor**: `formatear` **no** soporta `[h]:mm`: con 25:30 (25,5/24) devuelve «[1]:30» en lugar de «25:30», y con 12:00 da «[12]:00». [CORREGIDO: prueba del motor (app/motor.js), formatear(25,5/24; "[h]:mm") → «[1]:30»] Hacerlo en Excel real.

### E11 · Celdas combinadas para «que quede bonito»
- **Síntoma**: no deja ordenar («todas las celdas combinadas deben tener el mismo tamaño»), no se puede seleccionar una columna, el filtro falla, se pierden datos al combinar y la tabla dinámica no reconoce cabeceras.
- **Causa**: confunde presentación con estructura de datos.
- **Datos oficiales**: al combinar solo queda el contenido de la celda superior izquierda y el de las demás «se elimina». [VERIFICADO: https://support.microsoft.com/en-us/office/merge-and-unmerge-cells-5cbd15d5-9375-4540-907f-c673a93fcedf] El error al ordenar con celdas combinadas de distinto tamaño está documentado en el artículo KB 813974. [VERIFICADO: https://learn.microsoft.com/es-es/troubleshoot/microsoft-365-apps/excel/error-sort-a-range-merged-cell] La versión es-ES de ese artículo está traducida automáticamente y dice «Esta operación requiere que las celdas combinadas tenga un tamaño idéntico». El texto exacto que muestra Excel en español: [NO VERIFICABLE: no enseñarlo como dato; describir el aviso sin citarlo entre comillas]
- **Alternativa**: Formato de celdas › Alineación › Horizontal: **Centrar en la selección** (nombre en `es-referencia.json`).
- **Diagnóstico**: `test` «Tu jefa quiere el título centrado sobre las columnas A-F y luego ordenar la tabla. ¿Qué usas?». `excel` con un libro que tiene celdas combinadas en la cabecera y el encargo de ordenar.
- **Explicación**: «Combinar es para títulos de informes impresos, nunca dentro de una tabla de datos. Para centrar sin combinar: Centrar en la selección.»
- **Motor**: no se simula. Hacerlo con `test`, `cinta` o `excel`.

### E12 · Ordenar solo una columna
- **Síntoma**: los nombres ya no corresponden a sus importes y los datos quedan «revueltos» sin que se note.
- **Causa**: cree que ordenar es «poner esa columna en orden», no reordenar filas enteras. Observado en DidaTab. [VERIFICADO: Tort et al. 2009, tabla 1]
- **Datos oficiales**: si se ordena un rango dentro de otro mayor, Excel avisa y recomienda **ampliar la selección**. Las filas ocultas no se mueven al ordenar. [VERIFICADO: página de ordenar, arriba] Opciones del aviso en es-ES: «Ampliar la selección» / «Continuar con la selección actual». [VERIFICADO: https://support.microsoft.com/es-es/office/ordenar-datos-en-un-rango-o-tabla-62d0b95d-2a90-4610-a6ae-2e545c4a4654] Título del cuadro («Advertencia antes de ordenar»): [NO VERIFICABLE: no enseñarlo como dato]
- **Diagnóstico**: `test` «Aparece este aviso: ¿qué eliges?». `excel` con un control: «Después de ordenar por importe, ¿qué importe tiene el cliente "Ferretería Ruiz"?». Si ordenó una sola columna, el control falla.
- **Explicación**: «Ordenar mueve filas enteras. Si solo seleccionas una columna, separas los datos de su fila. Haz clic en una celda de la tabla, sin seleccionar la columna, o elige "Ampliar la selección".»

### E13 · Sumar totales dos veces (subtotales dentro del rango)
- **Síntoma**: el total general sale más o menos el doble. El gráfico incluye la barra «Total», enorme.
- **Causa**: mezcla datos y resultados en el mismo rango. Observado en DidaTab: representar en el gráfico una serie que incluye el total. [VERIFICADO: Tort et al. 2009, tabla 1]
- **Diagnóstico**: «encuentra el error» (`formula` con `inicial` `=SUMA(B2:B9)`) en una hoja con un subtotal en la fila 5. Solución en la hoja en vivo: sumar solo las filas de datos (`=SUMA(B2:B4;B6:B8)`) o, mejor, separar datos y resumen (`=SUMAR.SI` sobre una columna «Tipo»). `predice` de la suma con el subtotal dentro: `=SUMA(B2:B8)` da 140 con subtotales de 60 y 10, el doble de 70. [VERIFICADO-MOTOR] La solución con SUBTOTALES anidados se practica **solo en Excel real** (ver Motor).
- **Explicación**: «La fila 5 ya es la suma de las filas 2-4, así que la cuentas dos veces. Saca los subtotales del rango de datos, o usa SUBTOTALES, que ignora otros SUBTOTALES.»
- **Motor**: ⚠️ el motor **no** ignora los SUBTOTALES anidados. `=SUBTOTALES(9;B2:B8)` da 140 en el motor; en Excel daría 70. [VERIFICADO-MOTOR; comportamiento de Excel VERIFICADO en la página de Microsoft] No poner `formula` ni `predice` con SUBTOTALES anidados.
- **Dato oficial**: SUBTOTALES ignora las filas que no salen en un filtro, sea cual sea el número de función. Con 1-11 incluye las filas ocultas a mano y con 101-111 las excluye. Los SUBTOTALES anidados dentro del rango se ignoran «para evitar contar dos veces». [VERIFICADO: https://support.microsoft.com/en-us/office/subtotal-function-7b027003-f060-4ade-9040-e478765b9939]

### E14 · Rangos que no se amplían
- **Síntoma**: llegan ventas nuevas debajo y el total no cambia. La media excluye las últimas filas.
- **Caso real**: en el estudio de Reinhart y Rogoff la media cubría las filas 30-44 en lugar de las 30-49, y dejaba fuera a Australia, Austria, Bélgica, Canadá y Dinamarca. [VERIFICADO: Herndon, Ash y Pollin 2013, «Does High Public Debt Consistently Stifle Economic Growth?», PERI Working Paper 322, nota 5; https://peri.umass.edu/publication/does-high-public-debt-consistently-stifle-economic-growth-a-critique-of-reinhart-and-rogoff/]
- **Causa**: cree que «SUMA de la columna» sigue a los datos.
- **Diagnóstico**: `predice` «Añades 40 en A4 debajo de `=SUMA(A1:A3)`: ¿cambia el total?» → no, sigue en 60. «¿Y si insertas una fila *dentro* del rango?» → el rango pasa a A1:A4. [VERIFICADO-MOTOR] Después, lección de **tablas** (Ctrl+T), cuyas columnas calculadas se rellenan solas. [VERIFICADO: https://support.microsoft.com/en-us/office/overview-of-excel-tables-7ab0bb7d-3a9e-4b56-a3c9-6c94334e492c]
- **Explicación**: «El rango A1:A3 es fijo: lo que escribas debajo queda fuera. Convierte los datos en tabla y los totales crecerán solos.»
- **Motor**: las referencias estructuradas no se calculan (`GUIA-AUTORES.md`). La parte de tablas va con `excel`.

### E15 · BUSCARV con coincidencia aproximada por defecto
- **Síntoma**: un código que no existe devuelve el precio de **otro** producto, sin error. Con la lista desordenada, devuelve valores imprevisibles.
- **Causa**: omite el 4.º argumento sin saber que el valor por defecto es aproximado.
- **Datos oficiales**: «si no especificas nada, el valor predeterminado siempre será VERDADERO o coincidencia aproximada». Con aproximada, la primera columna debe estar ordenada; si no, «el valor devuelto puede ser algo que no esperas». [VERIFICADO: https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1] En cambio, BUSCARX busca la coincidencia exacta por defecto y tiene el argumento `si_no_se_encuentra`. [VERIFICADO: https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929]
- **Diagnóstico**: `predice` con una tarifa **ordenada**: 100 Lápiz, 200 Goma, 300 Regla.
  - `=BUSCARV(250;A1:B3;2)` → «Goma».
  - `=BUSCARV(250;A1:B3;2;FALSO)` → #N/D.
  - `=BUSCARX(250;A1:A3;B1:B3;"No existe")` → «No existe».
  [VERIFICADO-MOTOR] `formula` con `errores_tipicos` `=BUSCARV(F2;$A$2:$C$20;3)`.
- **Uso correcto de la aproximada**: tablas de tramos, como comisiones o descuentos por volumen (`=BUSCARV(3200;tramos;2;VERDADERO)` → 2 %). [VERIFICADO-MOTOR]
- **Explicación**: «Sin el FALSO final, BUSCARV no busca el código exacto, sino el más cercano por debajo, y no te avisa. Pon siempre FALSO, o usa BUSCARX, que busca exacto por defecto.»
- **Motor**: ⚠️ con datos **desordenados** y coincidencia aproximada, el motor puede devolver algo distinto de Excel. En la prueba, `=BUSCARV("Bilbao";…)` sobre Zaragoza, Bilbao, Madrid devolvió el valor de Madrid. [VERIFICADO-MOTOR el resultado del motor] Microsoft solo dice que la aproximada necesita la primera columna ordenada, que si no lo está «el valor devuelto puede ser algo inesperado» y que se comporta como una búsqueda binaria. [CORREGIDO: https://support.microsoft.com/es-es/office/funci%C3%B3n-buscarv-0bbc8083-26fe-4963-8ab8-93a18ad188a1 y https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-tips-for-optimizing-performance-obstructions] Qué daría Excel exactamente en este caso: [NO VERIFICABLE: no enseñarlo como dato] **No hacer `predice` con aproximada sobre datos desordenados.**

### E16 · Rango de búsqueda sin $ al copiar, e índice de columna escrito a mano
- **Síntoma**: las últimas filas dan #N/D porque el rango se desplazó. Al insertar una columna en la tarifa, BUSCARV devuelve otra columna.
- **Causa**: E06 aplicado a búsquedas, más el «3» como número mágico (E19).
- **Diagnóstico**: `formula` con `copiar_a` sobre 6 filas, donde la última busca un código de las primeras filas de la tabla, para que el rango desplazado falle. `test`: «Insertas una columna "Proveedor" entre B y C de la tarifa: ¿qué pasa con `=BUSCARV(F2;$A$2:$D$20;3;FALSO)`?».
- **Explicación**: «Fija la tabla con $ y, si puedes, usa BUSCARX: no depende del número de columna.»

### E17 · Comparar textos con espacios, mayúsculas o caracteres invisibles
- **Síntoma**: «Ana » ≠ «Ana», SUMAR.SI no encuentra a un cliente que «está ahí», BUSCARX da #N/D y salen duplicados que parecen iguales.
- **Causa**: no ve los espacios. Tampoco sabe que «=» no distingue mayúsculas.
- **Datos oficiales**: ESPACIOS (TRIM) quita el espacio normal (32), pero **no** el espacio duro (160) que llega de webs; hay que sustituirlo. [VERIFICADO: https://support.microsoft.com/en-us/office/trim-function-410388fa-c5df-49c6-b16c-9e5630b479f9] Antes de ordenar hay que quitar espacios iniciales. [VERIFICADO: página de ordenar]
- **Diagnóstico** (`predice`):
  - `="Ana "="Ana"` → FALSO.
  - `=ESPACIOS("Ana ")="Ana"` → VERDADERO.
  - `="ana"="Ana"` → **VERDADERO**: «=» no distingue mayúsculas.
  - `=IGUAL("ana";"Ana")` → FALSO.
  - Con espacio duro: `=ESPACIOS(B3)=B2` → FALSO y `=SUSTITUIR(B3;CARACTER(160);"")=B2` → VERDADERO.
  [VERIFICADO-MOTOR, todos] SUMAR.SI tampoco distingue mayúsculas: "norte" suma lo de "Norte". [VERIFICADO-MOTOR]
- **Explicación**: «Para Excel, "Ana " (con espacio) y "Ana" son textos distintos. Limpia con ESPACIOS; si viene de una web, quita también CARACTER(160).»

### E18 · Fiarse de que «no sale error»
- **Síntoma**: entrega resultados falsos con total confianza.
- **Causa**: cree que Excel avisaría si algo estuviera mal. Observado en DidaTab: «está bien si no salen # ni ceros». [VERIFICADO: Tort 2010]
- **Casos reales para motivar**:
  - JPMorgan 2012 (la «Ballena de Londres»): en la hoja de cálculo del nuevo modelo de riesgo (VaR) de la división CIO, una fórmula dividía entre la suma en lugar de entre la media. Según el informe del Task Force (16/01/2013, p. 128), eso «probablemente» redujo la volatilidad a la mitad y rebajó el VaR. Al volver al modelo antiguo, el VaR del primer trimestre pasó de 67 a 129 millones de dólares, el doble. [CORREGIDO: informe del Subcomité Permanente de Investigaciones del Senado de EE. UU. (2013), que cita el Task Force Report p. 128: https://www.hsgac.senate.gov/wp-content/uploads/imo/media/doc/REPORT%20-%20JPMorgan%20Chase%20Whale%20Trades%20(4-12-13).pdf]
  - Salud Pública de Inglaterra (PHE), octubre de 2020: 15.841 positivos de COVID entre el 25 de septiembre y el 2 de octubre quedaron fuera de las cifras diarias y llegaron tarde al rastreo de contactos (se pasaron todos antes de la 1:00 del 3 de octubre). La causa oficial: algunos archivos con resultados superaron el tamaño máximo que admitía el sistema. [VERIFICADO: https://www.gov.uk/government/news/phe-statement-on-delayed-reporting-of-covid-19-cases] Que el problema fuera el formato .xls lo dijo la prensa, no PHE: [NO VERIFICABLE: no enseñarlo como dato]. El límite de 65.536 filas por 256 columnas de Excel 97-2003 (.xls) sí es oficial. [VERIFICADO: https://support.microsoft.com/es-es/office/usar-excel-con-versiones-anteriores-de-excel-2fd9ffcb-6fce-485b-85af-fecfd651a5ac]
- **Diagnóstico**: `test` «¿Cómo sabes que tu total está bien?». La buena combina total de control, caso calculable a mano y cambiar un dato. Proyectos con `controles`.
- **Explicación**: «Excel solo avisa de errores de escritura o imposibles (#¡DIV/0!, #N/D). Si apuntas a la celda equivocada, calcula tan tranquilo. Compruébalo con un total que conozcas.» [VERIFICADO: Tort 2010, §4.3 «qué errores detecta el programa»]

### E19 · Valores escritos dentro de la fórmula
- **Síntoma**: `=B2*1,21`, `=B2*0,21` o `=SI(C2>1000;…)`. Cuando cambia el IVA o el umbral hay que tocar 300 fórmulas, y siempre se escapa alguna.
- **Causa**: no separa supuestos y cálculos. Panko y la ICAEW lo tratan como error «cualitativo»: hoy está bien, mañana falla. [VERIFICADO: Tort et al. 2009, distinción cuantitativo/cualitativo de Panko y Halverson]
- **Diagnóstico**: `formula` con `variantes` que cambian la celda del IVA. Ejemplo de la app: `=B2*C2*1,21` falla con el mensaje de «número escrito a mano». [VERIFICADO-MOTOR] Desde N2, regla estática que avisa de constantes como 0,21, 1,21, 21 % o 0,1 dentro de fórmulas aunque el resultado sea correcto (§5.15).
- **Explicación**: «Si el IVA cambia, tendrás que buscarlo dentro de cada fórmula. Ponlo en una celda (B6) y apunta a ella con $B$6.»

### E20 · CONTAR, CONTARA, CONTAR.SI y los criterios como texto
- **Síntoma**: CONTAR da 0 al contar nombres. El criterio `">A2"` no compara con A2.
- **Causa**: no sabe que CONTAR solo cuenta números, ni que el criterio es un texto que hay que **unir** con `&`.
- **Diagnóstico**: `predice` `=CONTAR(A2:A10)` sobre nombres → 0. `formula` «cuenta los pedidos de más de lo que pone en H1» con solución `=CONTAR.SI(E2:E20;">"&H1)` y error típico `=CONTAR.SI(E2:E20;">H1")`.
- **Explicación**: «El criterio va entre comillas porque es un texto: ">"&H1 une el signo con el valor de H1.»
- **Motor**: ⚠️ `=CONTAR.SI(E1:E3;">A2")` da **#¡VALOR!** en el motor. En Excel el criterio no usa el valor de A2, sino el texto "A2". Para usar el valor de una celda hay que unir el operador con & (">"&A2). Con los datos de la prueba (E1:E3 = 120, 80, 50, todos números) da 0. [VERIFICADO-MOTOR; VERIFICADO: https://support.microsoft.com/es-es/office/funci%C3%B3n-contar-si-e0de10c6-f885-4e71-abb4-1f464816df34 (unión con &); el 0 es deducción, no probado en Excel] Usarlo como `errores_tipicos`, que debe fallar y falla igual, pero **no como `predice`**.

### E21 · SI anidados en mal orden
- **Síntoma**: nunca sale «Alto».
- **Causa**: las condiciones se evalúan en orden y la primera verdadera gana.
- **Diagnóstico**: `predice` con E1 = 120.
  - `=SI(E1>50;"Medio";SI(E1>100;"Alto";"Bajo"))` → «Medio».
  - Bien ordenada → «Alto».
  [VERIFICADO-MOTOR] «Encuentra el error» con `inicial` en el orden malo.
- **Explicación**: «SI se queda con la primera condición que se cumple. Ordena de la más exigente a la menos: >100, luego >50.»

### E22 · «Entre dos valores» escrito como en matemáticas
- **Síntoma**: `=SI(10<A2<20;…)` siempre da lo mismo.
- **Causa**: escribe la notación matemática.
- **Diagnóstico**: `predice` `=10<A2<20` con A2 = 15 → **FALSO**: compara (VERDADERO) < 20. [VERIFICADO-MOTOR] `formula` con `debe_usar: ["Y"]` → `=Y(A2>10;A2<20)`.
- **Explicación**: «Excel no entiende "entre" encadenado. Usa Y: =Y(A2>10;A2<20).»

### E23 · Media con ceros frente a vacíos, y media de porcentajes
- **Síntoma**: la media baja porque se pusieron ceros donde no había dato. La «tasa media» de dos tiendas no coincide con la global.
- **Diagnóstico**: `predice` con 8, vacío, 6 → PROMEDIO 7. Con 8, 0, 6 → 4,67. [VERIFICADO-MOTOR] `test`: «Tienda A, 10 ventas de 1.000 visitas (1 %); tienda B, 9 de 9 (100 %). ¿Cuál es la conversión total?» → 19/1.009 ≈ 1,9 %, no el 50,5 % de promediar.
- **Explicación**: «PROMEDIO ignora las celdas vacías, pero cuenta los ceros. Para una tasa global, divide totales entre totales (o usa SUMAPRODUCTO), no promedies porcentajes.»

### E24 · Esconder errores con SI.ERROR
- **Síntoma**: todo «cuadra», pero faltan clientes: los #N/D se convirtieron en 0.
- **Causa**: SI.ERROR se ve como «quitar los feos #».
- **Diagnóstico**: `test` y «encuentra el error» con `=SI.ERROR(BUSCARV(…;FALSO);0)` en una conciliación. El 0 oculta que «Este» no existe en el maestro. [VERIFICADO-MOTOR: devuelve 0] Solución: `SI.ND(…;"NO ENCONTRADO")` o `BUSCARX(…;"NO ENCONTRADO")`, y contar los no encontrados.
- **Explicación**: «Un #N/D te está diciendo algo: este código no está en el maestro. Sustitúyelo por un aviso visible, no por 0, y cuenta cuántos hay.»

### E25 · Mezclar datos y presentación (tabla «bonita» inservible)
- **Síntoma**: no puede hacer tabla dinámica ni filtros.
- **Causa**: diseña la hoja como un documento impreso: filas vacías, cabecera en 2 filas, totales intercalados, celdas combinadas, un mes por pestaña.
- **Diagnóstico**: `test` «¿Cuál de estas 3 capturas está lista para una tabla dinámica?». `excel` «reestructura este informe en una tabla plana» (despivotar, en N4 con Power Query).
- **Explicación**: «Una tabla de datos: una fila por registro, una columna por campo, cabecera en una sola fila y nada más. El informe bonito se construye después, en otra hoja.»

### E26 · Copiar y pegar con filtros o filas ocultas
- **Síntoma**: al pegar aparecen filas que estaban ocultas, o se sobrescriben filas ocultas al pegar sobre un rango filtrado.
- **Datos oficiales**: «De forma predeterminada, Excel copia las celdas ocultas o filtradas además de las visibles». La solución es Inicio › Buscar y seleccionar › Ir a Especial › **Solo celdas visibles**. En Excel para la web no existe esa opción, salvo si el rango es una tabla con filtro aplicado. [VERIFICADO: https://support.microsoft.com/en-us/office/copy-visible-cells-only-6e3a1f01-2884-4332-b262-8b814412847e] Atajo Alt+; en es-ES: [NO VERIFICABLE: no enseñarlo como dato; enseñar la ruta Ir a Especial › Solo celdas visibles]. Con Autofiltro, Excel de escritorio suele copiar solo lo visible, y las filas ocultas a mano sí se copian. [NO VERIFICABLE: no enseñarlo como dato; comprobarlo en el `.xlsx` de práctica]
- **Diagnóstico**: `excel` con un control: «Copia solo los pedidos de Valencia a la hoja Informe: ¿cuántas filas te han quedado?». `cinta` → Inicio › Edición › Buscar y seleccionar.
- **Explicación**: «Ocultar no es borrar: las filas siguen ahí y pueden viajar al copiar. Para copiar solo lo que ves: Ir a Especial › Solo celdas visibles, y cuenta las filas al pegar.»
- **Relacionado**: SUMA incluye las filas filtradas y SUBTOTALES(109;…) no (E13).

### E27 · Excel cambia los datos al escribirlos o importarlos
- **Síntoma**: códigos con ceros a la izquierda («001» → 1), IBAN o números de tarjeta de más de 15 cifras redondeados, «1-2» convertido en fecha, códigos como «MARCH1» convertidos en fecha.
- **Datos oficiales**: Excel 365 y 2024 tienen en **Archivo › Opciones › Datos › Conversión automática de datos** cuatro conversiones que se pueden desactivar: quitar ceros a la izquierda, quedarse con 15 cifras y mostrar notación científica, convertir dígitos alrededor de «E» y convertir letras y números seguidos en fecha. Se aplican al abrir .csv/.txt, al escribir y al pegar desde fuera. **No afectan a Power Query.** [VERIFICADO: https://support.microsoft.com/en-us/excel/set-automatic-data-conversions; ruta en es-ES VERIFICADA: https://support.microsoft.com/es-es/excel/set-automatic-data-conversions] Excel trabaja con 15 cifras de precisión. [VERIFICADO: artículo de coma flotante]
- **Caso real**: el 30,9 % (3.436 de 11.117) de los artículos científicos que daban listas de genes en Excel como material suplementario tenían nombres de genes convertidos por error en fechas o en números (PubMed Central 2014-2020). [CORREGIDO: Abeysooriya, Soria, Kasu y Ziemann 2021, «Gene name errors: Lessons not learned», *PLoS Comput. Biol.* 17(7): e1008984; https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008984]
- **Diagnóstico**: `test` «¿Cómo guardarías el código postal 08001 sin que pierda el cero?» → formato Texto antes de escribir, o importar con Power Query fijando el tipo. `excel` con un CSV de códigos.
- **Motor**: escribir `{"texto":"001"}` hoy da 1 (ver E08 y la alerta).

### E28 · Tablas dinámicas: «no se actualizan» y «cuentan en vez de sumar»
- **Síntoma**: cambia los datos y la tabla dinámica no cambia. Los datos nuevos debajo no entran. El campo de importe aparece como «Cuenta de Importe».
- **Causa**: cree que la tabla dinámica es una fórmula viva. No sabe que se basa en una caché que se actualiza (Datos › Actualizar todo) ni que el origen debe ser una tabla para crecer. Si Excel interpreta como texto los datos de un campo de valores, lo muestra como recuento («Cuenta») en vez de suma: CONTAR es la función predeterminada para datos no numéricos. [VERIFICADO: https://support.microsoft.com/es-es/Excel/get-started/create-a-pivottable-to-analyze-worksheet-data y https://support.microsoft.com/es-ES/Excel/subtotal-and-total-fields-in-a-pivottable] Que las celdas vacías también lo provoquen: [NO VERIFICABLE: no enseñarlo como dato]
- **Diagnóstico**: `excel` con control antes y después de añadir filas y `test` de «¿por qué no aparece la venta de ayer?».
- **Explicación**: «La tabla dinámica es una foto de los datos: pulsa Actualizar. Y crea el origen como tabla (Ctrl+T) para que las filas nuevas entren solas.»

### E29 · Power Query: rutas fijas, tipos y configuración regional
- **Síntoma**: la consulta falla en el ordenador de la jefa (ruta `C:\Users\…`), o las fechas y decimales se interpretan al revés al importar un CSV con punto decimal.
- **Causa**: no sabe que la consulta guarda una ruta y que el tipo se decide en un paso.
- **Diagnóstico**: `ordenar` los pasos de la consulta, `test` de «¿qué paso cambiarías?» y `excel` con un CSV en formato de EE. UU. y la instrucción «usar Cambiar tipo › Usar configuración regional», que abre el cuadro «Cambiar tipo con configuración regional». [VERIFICADO: https://support.microsoft.com/es-es/Excel/add-or-change-data-types-power-query; otra página de Microsoft en es-ES (https://support.microsoft.com/es-es/Excel/set-a-locale-or-region-for-data-power-query) pone «Cambiar tipo > usando la configuración regional» en el menú del clic derecho, así que conviene nombrar también el cuadro]

### E30 · Referencia circular
- **Síntoma**: aviso de referencia circular, o un 0 que no cambia.
- **Causa**: el total se incluye a sí mismo (`=SUMA(B2:B10)` escrito en B10).
- **Diagnóstico**: «encuentra el error» con la fórmula en la última celda del rango.
- **Motor**: el motor muestra #¡REF! (traducción de #CYCLE!). [VERIFICADO-MOTOR] En Excel sale un **aviso** y la celda puede mostrar 0. [VERIFICADO: `localizacion.md` §8] Advertirlo en el enunciado.

### E31 · «Una fórmula distinta en una fila de fórmulas iguales»
- **Síntoma**: una fila retocada a mano o con otra fórmula. El total es correcto hoy y falso mañana.
- **Causa**: «arreglos» puntuales sin documentar. Es un error estructural de la lista de Tort. [VERIFICADO: Tort 2010, fig. 9]
- **Diagnóstico**: «encuentra el error» con 6 filas en las que una tiene `=B5*1,21` y las demás `=B2*(1+$E$1)`. La pista lleva a Mostrar fórmulas (Ctrl+`) o al triángulo verde de «fórmula incoherente». La regla de Archivo › Opciones › Fórmulas se llama «Fórmulas incoherentes con otras fórmulas de la región», y el botón del aviso ofrece «Copiar fórmula de arriba» y «Omitir error». [VERIFICADO: https://support.microsoft.com/es-ES/Excel/fix-an-inconsistent-formula]
- **Explicación**: «Si todas las filas hacen lo mismo, todas deben tener la misma fórmula. Mostrar fórmulas (Fórmulas › Auditoría de fórmulas) te deja verlas todas a la vez.»

### E32 · Confundir «Ctrl+Z lo arregla todo» con guardar versiones
- **Síntoma**: pierde trabajo al cerrar sin guardar o al pisar el archivo original con datos limpiados.
- **Causa**: no tiene un hábito de versiones.
- **Diagnóstico**: `test` y la rúbrica de proyecto: entregar con nombre de versión y conservar los datos originales intactos en otra hoja.
- **Explicación**: «Nunca trabajes sobre el único original: haz una copia, o deja los datos de partida en su hoja y trabaja en otra.»

**Cómo se usa este mapa.**
1. Cada error tiene **al menos un ejercicio-diagnóstico** en la lección donde se enseña el concepto y otro en el examen del nivel.
2. Los distractores de los `test` se sacan de aquí: cada opción incorrecta es uno de estos errores y su `porque` explica la confusión.
3. Los `errores_tipicos` de cada `formula` son las fórmulas de estos síntomas. Hay que comprobar que **fallan** (el validador ya lo hace).
4. Si una alumna comete el mismo error dos veces, la app propone la mini-lección del error: una pantalla de explicación y dos ejercicios gemelos.

---

## 5. Patrones de ejercicio interactivo

Para cada patrón: para qué sirve, cómo se construye con los campos de la app, cómo se corrige y en qué hay que tener cuidado.

### 5.1 Escribe la fórmula (`formula`)
- **Para qué**: producción, el núcleo de la práctica.
- **Construcción**: `hoja` pequeña con datos creíbles, `objetivo` vacío, `solucion`, `alternativas`, `copiar_a` si hay que copiar, 1-2 `variantes`, `errores_tipicos`, 3 `pistas` y `explicacion`.
- **Corrección**: §5.15.
- **Cuidado**:
  - El enunciado describe **el resultado de negocio**, no la sintaxis («el importe con IVA de cada línea»), como en MOS. [VERIFICADO: `curriculo.md` §1.2]
  - En N0-N1, el enunciado puede nombrar la función. Desde N2, a veces sí y a veces no. En los exámenes, nunca.

### 5.2 Completar la fórmula (desvanecimiento)
- **Para qué**: el paso intermedio entre el ejemplo resuelto y hacerlo sola (§1.4).
- **Construcción**: `formula` con `inicial` = fórmula a medio escribir que **no es válida todavía** (`=BUSCARX(F2;A2:A20;`), para que no pueda pulsar Comprobar sin terminar. Primero se quita el último paso y después los dos últimos (hacia atrás).
- **Corrección**: la misma que en 5.1.
- **Cuidado**: si `inicial` ya es válida y da el resultado correcto, el ejercicio no enseña nada. `validateFormula()` del motor permite comprobarlo al validar: `=SUMA(A1;` da `false`. [VERIFICADO-MOTOR]

### 5.3 Encuentra y arregla el error
- **Para qué**: el error controlado (§1.7), la auditoría y la lectura de fórmulas ajenas, que es lo que más hará en una empresa.
- **Construcción**: `formula` con `inicial` = fórmula errónea **verosímil** (sacada de §4) y un enunciado del tipo «Tu compañero dice que el total no cuadra. Arréglalo».
  - Variante N2+: hoja con 6 filas en la que **una** está mal (E31).
  - Variante N3+: un `.xlsx` con 5 errores sembrados y la tarea «encuéntralos todos» con `controles`. La lista de Tort da los sembrados: un dato mal tecleado, espacios en vez de vacías, relativas que debían ser absolutas, una constante en una fórmula y una fórmula distinta en una fila. [VERIFICADO: Tort 2010]
- **Corrección**: por valor, como en 5.1. Si deja `inicial` tal cual, la app responde «Esa es la fórmula original, que tiene el error».
- **Cuidado**: decir cuántos errores hay. «Encuéntralos» sin número genera frustración y búsqueda sin fin.

### 5.4 Predice antes de pulsar Intro (`predice`)
- **Para qué**: hacer explícito su modelo mental, el que dice qué hará Excel. Ver E04, E05, E08, E09, E17, E21, E22 y E23.
- **Construcción**: `hoja`, `celda` y `formula`. La respuesta la calcula el validador.
- **Mejora propuesta**: pedir la predicción **escrita o eligiendo entre 3-4 valores** antes de mostrar el resultado, y la seguridad. Después, mostrar la hoja calculándolo. Si falla, explicar el porqué del valor real («SUMA ignora textos»).
- **Cuidado**: solo con comportamientos en los que el motor **coincide con Excel** (ver §8). Nunca coma flotante, BUSCARV aproximado sobre datos desordenados, criterios inválidos de CONTAR.SI, referencias circulares, VERDADERO o FALSO sin paréntesis (está resuelto en el motor según `localizacion.md`) ni fechas anteriores al 01/03/1900.

### 5.5 Test con retroalimentación por opción (`test`)
- **Para qué**: conceptos, criterio («¿qué harías?») y lo que el motor no calcula (tablas dinámicas, Power Query, formato…).
- **Construcción**: 3-4 opciones. Cada incorrecta es un error real de §4 y su `porque` explica la confusión y cómo evitarla. La correcta lleva un `porque` que añade algo nuevo. Opción `multiple` para «marca todas las que…».
- **Cuidado**:
  - Que la correcta no sea siempre la más larga.
  - Nada de «todas las anteriores».
  - Evitar las negativas («¿cuál NO…?») en N0-N1.
  - Mejor preguntas de **aplicación** («Tu jefa te pide… ¿qué usas?») que de definición.

### 5.6 Ordena los pasos (estilo Parsons, `ordenar`)
- **Para qué**: procedimientos de la interfaz que el motor no simula (crear una tabla dinámica, una lista desplegable, una consulta de Power Query) y la planificación de un proyecto (recibir → aclarar → limpiar → calcular → comprobar → entregar).
- **Evidencia**: en programación, los problemas de Parsons (ordenar líneas dadas) son **más rápidos** que escribir o arreglar código y dan un aprendizaje similar, también una semana después. En ese estudio los problemas incluían bloques señuelo (distractores). [VERIFICADO: Ericson, Margulieux y Rick 2017, Koli Calling, pp. 20-29, https://doi.org/10.1145/3141880.3141895 (resumen)]
- **Mejora propuesta**: añadir **1-2 pasos señuelo** que no deben usarse, como «Combinar y centrar la cabecera» o «Seleccionar solo la columna». Así no se resuelve por descarte y se trabajan los errores de §4.
- **Cuidado**: 4-7 pasos y cada uno con un verbo de acción. Si dos órdenes son válidos, no usar este formato o aceptar los dos.

### 5.7 ¿Dónde está…? (`cinta`) y partes de la ventana (`senala`)
- **Para qué**: encontrar comandos (preentrenamiento, §1.5). Es el comportamiento «perdida en el menú» de DidaTab. [VERIFICADO: Tort 2010]
- **Construcción**: `ruta` [pestaña, grupo, comando] existente en `app/cinta.json`. Por ejemplo: Inicio › Edición › Buscar y seleccionar, Datos › Herramientas de datos › Quitar duplicados, o Fórmulas › Auditoría de fórmulas › Evaluar fórmula, todos presentes.
- **Cuidado**: no abusar. Saber *qué* comando hace falta importa más que *dónde* está, porque también se puede buscar con «Buscar» (el cuadro de Búsqueda de Microsoft, Alt+Q en Microsoft 365 [VERIFICADO: https://support.microsoft.com/es-es/office/foundations-experiences/find-what-you-need-with-search-in-microsoft-365-apps]). Desde N2, combinar: «¿Qué comando usarías y dónde está?».

### 5.8 Reto con datos sucios
- **Para qué**: la tarea real número uno en una empresa. Practica E08, E09, E17, E25 y E27.
- **Construcción**:
  - **En la hoja en vivo (N2)**: 8-12 filas con «  Juan  Pérez », un código con espacio duro, un número-texto (con apóstrofo, ver la alerta), una fecha como texto y un duplicado. Ejercicios `formula` encadenados: limpiar nombre → convertir número → contar los no encontrados.
  - **En Excel real (N3-N4)**: `.xlsx` de 300-2.000 filas generado con semilla y con los problemas sembrados y documentados en el script, más `controles` calculados con pandas desde los datos limpios según las reglas del encargo (`GUIA-AUTORES.md` §5 y §7).
- **Corrección**: `controles` numéricos, como el total limpio, el número de clientes únicos o las filas eliminadas.
- **Cuidado**: avisar de **qué tipo** de suciedad hay en N3 y no en N4-N6, donde descubrirla es parte de la tarea.

### 5.9 Elige la herramienta (intercalado)
- **Para qué**: discriminar entre problemas (§1.3), que es la decisión que más se falla.
- **Construcción**: `test` con 4 situaciones de oficina y 4-5 herramientas. Por ejemplo: «Total de ventas por comercial y mes, para presentar mañana» → tabla dinámica. «Precio de cada línea de pedido según la tarifa» → BUSCARX. «Importe vendido por Ana en marzo, en una celda que se actualice» → SUMAR.SI.CONJUNTO. «Unir los 12 ficheros mensuales del ERP cada mes» → Power Query.
- **Dónde**: `repaso_inicial`, repaso diario y examen.

### 5.10 Explícalo con tus palabras (`abierta`)
- **Para qué**: autoexplicación (§1.4) y comunicación: correos de entrega y preguntas previas a la jefa.
- **Construcción**: pregunta concreta, `modelo` de respuesta y 3-5 `criterios` comprobables. Por ejemplo: «Explica a tu compañero por qué su BUSCARV da el precio de otro producto», con los criterios: menciona el 4.º argumento, menciona aproximada frente a exacta, propone FALSO o BUSCARX.
- **Corrección**: la tutora IA comenta según los criterios. Si no está, autoevaluación de la alumna con los criterios como lista de comprobación, frente al modelo.
- **Cuidado**: corta (2-4 frases). Una pregunta abierta larga en cada lección cansa: 1 por módulo, o en proyectos.

### 5.11 Autoevaluación con rúbrica (proyectos)
- Ver §7. Antes de ver la solución, marca su nivel en cada criterio. Después, la app compara con los controles automáticos y la rúbrica de la solución, y le muestra su calibración.

### 5.12 Caso con correo (encargo ambiguo)
- **Para qué**: «recibir un encargo y entenderlo», que la guía quiere enseñar y casi ningún curso trabaja (§3).
- **Construcción**: ya previsto en los proyectos (`correo`, `preguntas_previas`, `aclaraciones`). Versión mínima en lecciones de N2-N3: un correo de 3 líneas con una ambigüedad (¿«ventas» con o sin IVA? ¿qué periodo?) y un `test` «¿Qué le preguntarías antes de empezar?».

### 5.13 Respuesta corta (`respuesta_corta`)
- **Para qué**: atajos, nombres exactos de función y valores concretos.
- **Cuidado**: dar todas las variantes aceptadas (`Ctrl+G`, `Control+G`, `Ctrl G`). No usarla para nombres de función con tilde dudosa sin aceptar la variante sin tilde, salvo cuando la tilde sea el objetivo (AÑO).

### 5.14 Práctica en Excel real (`excel`)
- **Para qué**: todo lo que el motor no calcula: tablas, tablas dinámicas, Power Query, gráficos, formato condicional, validación, filtros, macros y el trabajo con libros grandes.
- **Construcción**: libro con hoja «Instrucciones», datos y `controles` numéricos (`GUIA-AUTORES.md` §5).
- **Clave pedagógica**: los controles son **preguntas cuya respuesta solo sale si el procedimiento es correcto** («¿Cuántas filas quedan tras quitar duplicados?», «¿Total de la zona Norte en marzo?»). Así se corrige un procedimiento de interfaz sin poder verlo.

### 5.15 Comprobación automática de fórmulas: qué hay y qué añadir

**Lo que ya hace el corrector** (`app/motor.js`, `comprobar`) [VERIFICADO-MOTOR, código leído y probado]:
1. **Escritura**: detecta que falta «=», funciones en inglés (SUM → SUMA…) y la coma usada como separador de argumentos.
2. **Error de Excel**: si su fórmula devuelve #N/D, #¡VALOR!… y la solución no, explica ese error.
3. **Constante en lugar de fórmula**: si la solución usa celdas y la suya no.
4. **Por valor**: compara con la solución en la celda objetivo y en todas las de `copiar_a` (copia real con `hf.copy` y `hf.paste`, que desplaza las referencias como Excel), con `tolerancia`.
5. **Variantes**: cambia datos de entrada y vuelve a comparar. Así detecta valores escritos a mano, como `=A2*1,21`.
6. **`debe_usar` y `no_usar`**: funciones obligatorias o prohibidas.
7. **Derrame**: compara todas las celdas que ocupa un resultado matricial (FILTRAR, ORDENAR, UNICOS…).

Salida real (encargo: «importe con IVA en B2, copiar a B3:B4; IVA en E1») [VERIFICADO-MOTOR]:

```
=A2*(1+$E$1)   → correcta
=A2*(1+E1)     → "En B2 está bien, pero al copiar la fórmula a B3 da 250 en vez de 302,5. ¿Hay alguna referencia que debería quedarse fija con $ (tecla F4)?"
=A2*1,21       → "Con estos datos da el resultado correcto, pero si cambian los datos tu fórmula no se actualiza bien. ¿Has escrito algún número o resultado a mano…?"
=121           → "Has escrito un número o un texto fijo en lugar de una fórmula que use las celdas…"
=A2*(1+E$1)    → correcta (mixta válida al copiar solo hacia abajo)
=A2+A2*$E$1    → correcta (alternativa equivalente)
```

**Lo que se propone añadir**, por orden de valor:

1. **Mostrar la fórmula desplazada** cuando falla una copia: `hf.getCellFormula()` en la primera celda copiada que falla. «Al copiarla a B4 ha quedado `=A4*(1+E3)`.» Probado: devuelve exactamente eso. [VERIFICADO-MOTOR]
2. **Diagnósticos por error típico.** Hoy `errores_tipicos` es una lista de fórmulas que deben fallar, pero el mensaje es genérico. Propuesta compatible: aceptar también objetos `{"formula": "=B2*C2*(1+B6)", "mensaje": "Al copiar hacia abajo, B6 se mueve a B7…"}`. Si la fórmula de la alumna da **los mismos valores** que un error típico en todas las celdas y variantes, se muestra su mensaje. Así se convierte cada error del §4 en feedback específico sin escribir reglas.
3. **Reglas estáticas («lint»)** sobre los tokens de su fórmula. Se aplican aunque el resultado sea correcto: como aviso amable si el ejercicio es de práctica y como fallo si el objetivo es ese.

   | Regla | Detecta | Mensaje (resumen) |
   |---|---|---|
   | `SUMA(` con `+` dentro o un solo argumento no rango | E03 | «SUMA ya suma: dale un rango» |
   | Constantes de negocio en la fórmula: 0,21 · 1,21 · 0,1 · 0,04 · 21% · 10% · 1,1… | E19 | «Ese número debería estar en una celda» |
   | `BUSCARV(` con 3 argumentos | E15 | «Sin FALSO, BUSCARV busca aproximado» |
   | `BUSCARV(` con rango sin `$` y ejercicio con `copiar_a` | E16 | «Fija la tabla con $» |
   | Índice de columna literal en BUSCARV cuando el ejercicio dice «puede crecer» | E16 | «BUSCARX no depende del número de columna» |
   | `SI.ERROR(…;0)` o `SI.ERROR(…;"")` alrededor de una búsqueda | E24 | «Estás escondiendo los no encontrados» |
   | Comparación encadenada `a<x<b` | E22 | «Usa Y(…)» |
   | Criterio con referencia dentro de las comillas: `">H1"` | E20 | «Une el signo con &: ">"&H1» |
   | `+` entre muchas celdas consecutivas (`=B2+B3+B4+B5+B6`) | E03 | «Con SUMA(B2:B6) es más corto y crece» |
   | `PROMEDIO` de una columna de porcentajes cuando hay totales disponibles | E23 | «Divide totales entre totales» |
   | Referencia a una columna entera dentro de una tabla pequeña (`A:A`) | Rendimiento | Solo aviso, desde N4 |

4. **Precedentes obligatorios**: `hf.getCellPrecedents()` devuelve las celdas de las que depende. Probado: B4 depende de A4 y E3. [VERIFICADO-MOTOR] Sirve para exigir «tu fórmula debe usar la celda del IVA (E1)» aunque haya otra forma de dar el número, y para detectar que apunta a la columna equivocada cuando los valores coinciden por casualidad.
5. **Variantes generadas y no solo escritas a mano**: en el validador, crear de forma automática una variante por **cada celda de entrada** que use la solución (+10 % o +1). Así, ninguna fórmula que ignore un dato pasa por casualidad. Hay que añadir **casos límite** según el tema: 0, celda vacía, texto, negativo, duplicado, código inexistente o fecha de fin de mes.
6. **Robustez estructural** (N2+): para la lección de rangos y tablas, comprobar que el resultado sigue bien tras **insertar una fila dentro del rango** (`hf.addRows`), que sí amplía `SUMA(A1:A3)` a `A1:A4`, y explicar que **añadir debajo** no la amplía. [VERIFICADO-MOTOR]
7. **Equivalencias y falsos negativos**: aceptar paréntesis de más, espacios, minúsculas en el nombre de la función, `;` con espacio, orden distinto de sumandos y referencias mixtas válidas. Por eso la corrección es **por valor**, no por texto. Hay que evitar:
   - `debe_usar` innecesarios, que rechazan soluciones buenas;
   - exigir `$` cuando no se copia;
   - tolerancias de 1e-9 en importes en euros (usar 0,005 si el enunciado dice «a dos decimales»).
8. **Registro para el aprendizaje**: guardar por ejercicio los intentos, las pistas, la seguridad declarada y el tipo de error detectado (regla o error típico). Es la base del repaso dirigido (§1.9) y de la mini-lección del error (§4).

**Comprobación de ejercicios no-fórmula**:
- `test`: por opción, y en `multiple` todas las correctas y ninguna incorrecta.
- `ordenar`: posición exacta. Con pasos señuelo, que no estén.
- `cinta`: la ruta.
- `excel`: controles numéricos con tolerancia.
- `abierta`: criterios (IA o autoevaluación).
- Proyecto: controles más rúbrica (§7).

---

## 6. Motivación y adherencia en adultos que estudian solos

### 6.1 Qué dice la evidencia

- **Abandono**: en los MOOC de Harvard y el MIT (5,63 millones de personas y 12,67 millones de matrículas), el **52 % de quienes se inscriben no llega a entrar al curso**. La finalización «no se ha movido en seis años» y la retención de un año a otro bajó del 38 % al 7 %. [VERIFICADO: Reich y Ruipérez-Valiente 2019, *Science* 363(6423), postprint https://webs.um.es/jruiperez/papers/journals/2019_Science_MOOCPivot_postprint.pdf] Conclusión: el riesgo principal no es que sea difícil, sino **no empezar o dejarlo en la semana 2**.
- **Adultos** (andragogía de Knowles): necesitan saber **para qué**, quieren autodirigirse, traen experiencia y se orientan a problemas de su vida y su trabajo. [VERIFICADO: Clardy 2005, ERIC ED492132, que cita a Knowles 1968-1987, https://cdn.prod.web.uta.edu/-/media/project/website/administration/crtle/documents/ed492132.pdf] Son supuestos de partida del modelo, no resultados experimentales.
- **Autodeterminación**: la motivación de calidad depende de autonomía, competencia y relación con otras personas. [VERIFICADO: Ryan y Deci 2000, *American Psychologist* 55(1), 68-78, https://www.selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf]
- **Gamificación**: efectos pequeños pero positivos. Cognitivo g = 0,49, motivacional g = 0,36 y conductual g = 0,25. Solo el cognitivo es estable en los estudios rigurosos. [VERIFICADO: Sailer y Homner 2020, *Educ. Psych. Review* 32(1), 77-112, https://doi.org/10.1007/s10648-019-09498-w (resumen)] En un estudio de 16 semanas, el curso con **clasificación e insignias** tuvo menos motivación intrínseca, satisfacción y nota final que el curso sin ellas. [VERIFICADO: Hanus y Fox 2015, *Computers & Education* 80, 152-161, https://doi.org/10.1016/j.compedu.2014.08.019 (resumen)] Las recompensas sin información pueden minar la motivación intrínseca. [VERIFICADO: Wisniewski et al. 2020, citando a Hattie y Timperley 2007]
- **Rachas**: ver en el registro una racha intacta aumenta la constancia frente a verla rota. **Ver la racha rota reduce el compromiso posterior**, aunque lo que se hizo en realidad sea lo mismo. El efecto crece si la persona se culpa de la ruptura y se atenúa si la racha se puede «reparar». [CORREGIDO: Silverman y Barasch 2023, *J. Consumer Research* 49(6), 1095-1117, https://doi.org/10.1093/jcr/ucac029 (resumen en https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions): el estudio compara racha intacta con racha rota, no con no haber tenido racha]
- **Gradiente de meta**: cuanto más cerca se ve la meta, más esfuerzo. Una tarjeta de 12 sellos con 2 ya puestos se completa antes que una de 10 vacía. [VERIFICADO: Kivetz, Urminsky y Zheng 2006, *J. Marketing Research* 43(1), 39-58, https://doi.org/10.1509/jmkr.43.1.39 (resumen)]
- **Barras de progreso**: en 32 experimentos aleatorizados de encuestas en línea, una barra constante **no** redujo el abandono. Las que avanzaban rápido al principio sí, y las lentas al principio lo aumentaron. [VERIFICADO: Villar, Callegaro y Yang 2013, *Social Science Computer Review* 31(6), 744-762, https://doi.org/10.1177/0894439313497468 (resumen)]
- **Plan «si-entonces»**: d = 0,65 en 94 estudios. [VERIFICADO: Gollwitzer 2006, citando a Gollwitzer y Sheeran 2006]
- **Hábito**: mediana de 66 días para que un hábito diario sea automático (para llegar al 95 % de su máximo, según un modelo), con mucha variación entre personas, de 18 a 254 días. Saltarse un día suelto no estropeó el proceso. [VERIFICADO: Lally et al. 2010, *Eur. J. Social Psychology* 40(6), 998-1009, https://doi.org/10.1002/ejsp.674; el resumen da 96 voluntarios, 39 con buen ajuste del modelo y el rango de 18 a 254 días; la mediana de 66 días del subgrupo con buen ajuste solo se ha comprobado en reseñas coincidentes]

### 6.2 Qué hacer en la guía

**Al empezar (primeros 10 minutos)**
1. **Meta personal en una frase**, elegida o escrita: «Llevar sola los informes de ventas de mi departamento». Se le recuerda en el panel.
2. **Plan si-entonces**: días y hora («Si es lunes, miércoles o jueves a las 21:00, entonces hago una lección»), con recordatorio opcional.
3. **Prueba de nivel opcional** (§2.5): autonomía y respeto por lo que ya sabe.
4. **Primera victoria antes de 5 minutos**: sumar una columna de facturas en la hoja en vivo.

**Progreso visible y con sentido**
- Barra de progreso por **habilidades de trabajo** («sé cruzar dos listados», «sé limpiar un CSV del ERP», «sé montar una tabla dinámica por mes»), no solo porcentaje de lecciones. Son frases de «sé hacer» como las de DigComp e ICAEW (`curriculo.md` §4).
- Por el gradiente de meta y las barras: mostrar los módulos en **trozos cortos** (4-6 lecciones) para que la barra de cada trozo avance rápido. Mostrar «te faltan 2 lecciones para el examen del nivel».
- **Portafolio**: cada proyecto aprobado queda como pieza descargable (libro y correo de entrega), útil para entrevistas. Es la recompensa con más información y la más «adulta».
- **Certificado por nivel** con la lista de habilidades demostradas, sin presentarlo como título oficial. Ver la recomendación sobre MOS en `curriculo.md` §1.7.

**Gamificación sin infantilizar**
- Sí: puntos de experiencia ligados a acertar **a la primera** y a repasar, estrellas por lección, insignias de hitos reales («primer proyecto entregado», «10 fórmulas a la primera y sin pistas»).
- No: clasificaciones públicas contra otras personas, mascotas o lenguaje infantil, confeti en cada clic, ni castigos visibles por pedir pistas.
- **Rachas**: mejor **meta semanal** (por ejemplo, 3 sesiones a la semana) que diaria, con **1 comodín por semana** y reparación («recupera la racha haciendo 2 lecciones hoy»). Al volver tras una ausencia, nunca «¡Has perdido tu racha de 12 días!». Mejor: «Bienvenida de nuevo. Empezamos con un repaso de 10 minutos de lo último que viste».

**Relevancia laboral constante**
- Cada lección abre con el **para qué en la oficina** y cierra con lo conseguido.
- Empresa y personajes estables (§1.10). Datos españoles creíbles: IVA 21/10/4 %, NIF inventados, provincias…
- «Cómo se hace en una empresa de verdad» (`aviso empresa`): nombres de archivo, versiones, a quién preguntar, qué no tocar del libro de otra persona.

**Dosificar la dificultad**
- Si falla 3 ejercicios seguidos, la app ofrece un descanso o un ejercicio más fácil del mismo concepto, y le recuerda que equivocarse en la práctica es lo esperado (§1.7).
- Si acierta todo a la primera, ofrece saltar a la mini-tarea (§1.4).

**Microcopia de ejemplo**

| Situación | Sí | No |
|---|---|---|
| Fallo | «Casi. En B4 da 80 y debería dar 96,80. Mira cómo ha quedado la fórmula al copiarla.» | «¡Error! Inténtalo otra vez.» |
| Acierto | «Hecho. Con esto ya calculas el IVA de cualquier factura, aunque tenga 500 líneas.» | «¡¡Genial!! ¡Eres una crack!» |
| Vuelta tras 10 días | «Bienvenida. Hoy: 10 minutos de repaso y seguimos donde lo dejaste.» | «Has perdido tu racha.» |
| Examen suspendido | «Te ha faltado BUSCARX (2 de 3) y fechas. Repasa esas dos lecciones; mañana tienes un examen nuevo.» | «Suspendido. 70 %.» |

---

## 7. Rúbrica de proyectos y autoevaluación

**Rúbrica propuesta para todos los proyectos**: 7 criterios y 4 niveles (En desarrollo / Aceptable / Bien / Excelente). Se basa en la rúbrica de `GUIA-AUTORES.md` §7, los errores de §4 y las buenas prácticas de diseño (separar entradas, cálculos y salidas; ver ICAEW en `curriculo.md` §4.2).

| Criterio | Aceptable (mínimo para aprobar) | Excelente |
|---|---|---|
| **1. Exactitud** | Todos los `controles` cuadran con su tolerancia | Además, documenta 2 comprobaciones propias (total cruzado, caso a mano) |
| **2. Comprensión del encargo** | Hace las preguntas previas clave (periodo, nivel de detalle, criterio dudoso) | Señala por escrito los supuestos que tomó ante lo que no se aclaró |
| **3. Estructura** | Datos originales intactos en su hoja; datos en tabla plana; cálculos separados del informe | Entradas, supuestos (IVA, tipos, fechas de corte) y salidas claramente separados y rotulados |
| **4. Robustez** | Sin valores escritos dentro de fórmulas; referencias que sobreviven al copiar; rangos que crecen (tablas) | Validación de datos en las entradas; avisos de «no encontrado» visibles; funciona si llegan datos nuevos |
| **5. Claridad** | Nombres de hojas y cabeceras comprensibles; formato numérico correcto (€, fechas, %) | Una persona ajena entiende el libro sin preguntar: notas breves, colores de entrada/cálculo |
| **6. Comunicación** | Correo de entrega con el resultado principal y el archivo | Resultado, 2-3 conclusiones, supuestos y límites en ≤ 120 palabras, en tono profesional |
| **7. Eficiencia** | Termina en el tiempo orientativo | Usa la herramienta adecuada (tabla dinámica o Power Query en lugar de 200 fórmulas manuales) |

**Lista de autoevaluación antes de entregar** (12 puntos, como `abierta` con `criterios`, o casillas en el proyecto):
1. ¿He contestado exactamente a lo que se pedía (periodo, unidades, con o sin IVA)?
2. ¿Cuadran mis totales con un total conocido?
3. ¿He comprobado una fila calculándola a mano?
4. ¿He cambiado un dato para ver que todo se actualiza?
5. ¿Hay algún número escrito dentro de una fórmula?
6. ¿He mirado todas las fórmulas con Mostrar fórmulas y son coherentes entre filas?
7. ¿Hay #N/D o celdas vacías que estoy escondiendo?
8. ¿Están los datos originales intactos?
9. ¿Funcionará si el mes que viene hay más filas?
10. ¿Formatos correctos: €, fechas DD/MM/AAAA, %?
11. ¿Se entiende sin explicarlo?
12. ¿Mi correo dice el resultado, los supuestos y los límites?

**Calibración**: antes de ver la solución marca su nivel por criterio. La app compara con los controles automáticos (criterio 1) y con la rúbrica de la solución, y le muestra la diferencia («Te habías puesto Excelente en Robustez, pero hay un 1,21 escrito en la fórmula de la columna F»). Así se entrena la desconfianza sana de §1.11.

---

## 8. Comprobado en el motor de la hoja de práctica (salida real)

Scripts en `research/work/ped_probe.cjs` a `ped_probe5.cjs`, con el `app/motor.js` real (configuración esXL, `;`, coma decimal) y HyperFormula 3.5.0. Ejecutados el 14/11/2026.

**Coinciden con Excel** (se pueden usar en `predice`):

```
=SUMA(A1:A3)  [A2 con apóstrofo '20]        → 40        (SUMA ignora texto)
=A1+A2+A3     [A2 con apóstrofo '20]        → 60        (+ convierte)
=CONTAR(A1:A3) [A2 con apóstrofo '20]       → 2
="Ana "="Ana"                                → FALSO
=ESPACIOS("Ana ")="Ana"                      → VERDADERO
=ESPACIOS(B3)=B2   [B3 con CARACTER(160)]    → FALSO
=SUSTITUIR(B3;CARACTER(160);"")=B2           → VERDADERO
="ana"=B2  [B2 = "Ana"]                      → VERDADERO
=IGUAL("ana";B2)                             → FALSO
=SUMA(C1:C3)  [tres 1/3 con 2 decimales]     → 1
=REDONDEAR(2,345;2)                          → 2,35
=-2^2                                        → 4
=0-2^2                                       → -4
=5+2*3                                       → 11
=A1+10%   [A1 = 100]                         → 100,1
=A1*(1+10%)                                  → 110
=H2-H1/H1 [100 y 120]                        → 119
=(H2-H1)/H1                                  → 0,2
=10<A2<20 [A2 = 15]                          → FALSO
=Y(A2>10;A2<20)                              → VERDADERO
=PROMEDIO(8;vacía;6)                         → 7
=PROMEDIO(8;0;6)                             → 4,67
=SUMAR.SI(D1:D3;"norte";E1:E3)               → 170 (no distingue mayúsculas)
=SI(120>50;"Medio";SI(120>100;"Alto";…))     → "Medio"
=BUSCARV(250;tarifa ordenada;2)              → "Goma"  (aproximada: el de debajo)
=BUSCARV(250;tarifa ordenada;2;FALSO)        → #N/D
=BUSCARX(250;…;…;"No existe")                → "No existe"
=BUSCARV(3200;tramos;2;VERDADERO)            → 0,02
=SI.ERROR(BUSCARV("Este";…;FALSO);0)         → 0
=SUMA(B2:B8) con dos subtotales dentro       → 140 (el doble de 70)
=HORA("12:00")  y  ="12:00"*24               → 12  y  12
=FECHA(2026;12;25)-FECHA(2026;11;14)         → 41
=FECHA(2026;11;14)  y  =G1*1                 → 46340
="14/11/2026"*1                              → 46340
Copiar =A2*(1+E1) de B2 a B4                 → queda =A4*(1+E3)   (getCellFormula)
Precedentes de B4                            → A4 y E3            (getCellPrecedents)
Añadir 40 debajo de =SUMA(A1:A3)             → sigue =SUMA(A1:A3) = 60
Insertar fila dentro del rango               → pasa a =SUMA(A1:A4)
validateFormula("=SUMA(A1;")                 → false
```

**No coinciden con Excel o no se reproducen** (no usar en `predice`; ver §9):

```
{"texto":"20"}   → el motor lo convierte en el número 20 (SUMA 60, CONTAR 3, ESNUMERO VERDADERO)
{"texto":"001"}  → el motor lo convierte en 1
=1*(0,5-0,4-0,1) → 0 en el motor; Excel: -2,78E-17 (documentado por Microsoft)
=FECHA(1900;2;29)→ 61 en el motor; Excel: 60 (falso 29/02/1900)
=CONTAR.SI(E1:E3;">A2") → #¡VALOR! en el motor; Excel: 0 con E1:E3 = 120, 80 y 50 [NO VERIFICABLE: no enseñarlo como dato; la forma correcta, ">"&celda, sí está en https://support.microsoft.com/es-es/office/contar-si-función-contar-si-e0de10c6-f885-4e71-abb4-1f464816df34]
BUSCARV aproximado con datos desordenados → resultado del motor no fiable como predicción de Excel
Referencia circular → #¡REF! en el motor; Excel muestra un aviso
=SUBTOTALES(9;B2:B8) con SUBTOTALES dentro → 140 en el motor; Excel: 70 (ignora los anidados)
```

---

## 9. Alertas (lo que el temario no debe olvidar)

1. **Fallo en la hoja de práctica**: `{"texto":"…"}` **no** crea texto que parece número. HyperFormula convierte `"20"` en 20 y `"001"` en 1. Sin arreglarlo, los ejercicios de números guardados como texto (E08), códigos con ceros (E27) y datos sucios (5.8) **dan resultados distintos de Excel**. Arreglo comprobado: en `valorDeEntrada` de `app/motor.js`, devolver `"'" + v.texto` (el apóstrofo hace que HF lo guarde como texto y lo muestre sin apóstrofo, como Excel). Probado: SUMA 40, A1+A2+A3 60, CONTAR 2, ESTEXTO VERDADERO. [VERIFICADO-MOTOR] Mientras tanto, los autores pueden escribir `"'20"` directamente. La `GUIA-AUTORES.md` dice lo contrario y habría que corregirla también.
2. **No usar en `predice` ni en `formula`** lo que el motor no calcula igual que Excel: coma flotante, BUSCARV aproximado con datos desordenados, `CONTAR.SI` con criterio de texto inválido, fechas anteriores al 01/03/1900, referencias circulares y **SUBTOTALES con otros SUBTOTALES dentro** (el motor da 140 donde Excel da 70) (§8).
3. **La sensación de dominio engaña** a la alumna y al diseño. Releer y la práctica agrupada parecen mejores y son peores (Roediger y Karpicke; Kornell y Bjork). La guía debe explicárselo a ella, y quien escribe los contenidos no debe «facilitar» quitando el repaso mezclado.
4. **Kirschner frente a Keith y Frese no es una contradicción**: guía explícita para empezar y exploración con errores para transferir. Si se aplica la gestión del error a una alumna de nivel 0 sin red, se frustra. Si nunca se le deja explorar, no se desenvolverá sola. Ver §1.7.
5. **El repaso actual son solo tarjetas** que ella se puntúa sola, con techo de 35 días. Para una habilidad de trabajo hacen falta repasos de producción (ejercicios gemelos) y una caja de unos 90 días (§1.2).
6. **El examen y los repasos deben ir mezclados** y con preguntas de «elige la herramienta». Es la habilidad que más se pide en una empresa y la que menos se entrena con práctica por bloques (§1.3, §5.9).
7. **El feedback específico por error es la mayor mejora pendiente** del corrector: `errores_tipicos` con mensaje, la fórmula desplazada al copiar y reglas estáticas (§5.15). Son baratos con la API de HyperFormula (`getCellFormula`, `getCellPrecedents`, `addRows`, `validateFormula`), y todos están probados.
8. **No vender los nombres de rango como «buena práctica»**: la evidencia experimental no lo apoya en usuarios intermedios (McKeever y McDaid 2011). Para que los rangos crezcan, tablas.
9. **Hay que enseñar a desconfiar del resultado** y a comprobar: en hojas reales, el 94 % tienen errores y solo se detecta el 60 % al revisar (Panko 2015). Es un criterio de rúbrica, no un consejo opcional.
10. **Rachas**: romperlas desmotiva más que no tenerlas. Mejor meta semanal con comodín y bienvenida sin culpa al volver (§6.2). El mayor riesgo de abandono es la semana 1-2: el 52 % de quienes se inscriben en un MOOC nunca entra (Reich y Ruipérez-Valiente 2019).
11. **Nombres de interfaz en es-ES sin verificar**: «Advertencia antes de ordenar» / «Ampliar la selección», «Conversión automática de datos» (Archivo › Opciones › Datos), el aviso de «fórmula incoherente», Alt+; para celdas visibles y el texto exacto del error al ordenar celdas combinadas. Hay que comprobarlos en `es-referencia.json` o en un Excel en español antes de ponerlos en lecciones.
12. **Las cifras de estudios marcadas [NO VERIFICABLE: no enseñarlo como dato]** (Dunlosky completo, Van der Kleij, Mayer, Kulik…) no deben aparecer como cifras exactas en el texto que lee la alumna. Si se citan, mejor sin número («la investigación muestra que…»). Sailer y Homner, Hanus y Fox y Lally ya se han comprobado en el resumen original (de Lally, el resumen da la variación de 18 a 254 días; la mediana de 66 días solo consta en reseñas).
13. **Casos reales de errores famosos** (JPMorgan, PHE 2020, Reinhart y Rogoff, genes convertidos en fechas) motivan mucho. Comprobado en fuente primaria: PHE dejó fuera de las cifras diarias 15.841 casos entre el 25/09 y el 02/10/2020 porque algunos archivos con resultados positivos superaron el tamaño máximo de archivo, y el comunicado no menciona Excel ni filas [VERIFICADO: https://www.gov.uk/government/news/phe-statement-on-delayed-reporting-of-covid-19-cases]. En genómica, cerca de una de cada cinco publicaciones con listas de genes en Excel tenía nombres convertidos en fechas o números [VERIFICADO: Ziemann, Eren y El-Osta 2016, *Genome Biology* 17, https://doi.org/10.1186/s13059-016-1044-7]. Los detalles de JPMorgan y de Reinhart y Rogoff siguen sin comprobar [NO VERIFICABLE: no enseñarlo como dato]. Si se usan, contarlos con prudencia y sin cifras dudosas (por ejemplo, el límite de 65.536 filas en el caso PHE, que no aparece en el comunicado oficial).

---

## 10. Fuentes consultadas (14/11/2026)

**Leídas en fuente primaria (PDF o página oficial)**
- Roediger, H. L. y Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science*, 17(3), 249-255. https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T. y Pashler, H. (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychological Science*, 19(11), 1095-1102. https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf
- Rohrer, D., Dedrick, R. F. y Stershic, S. (2015). Interleaved practice improves mathematics learning. *J. Educational Psychology*, 107(3), 900-908. https://www.gwern.net/doc/psychology/spaced-repetition/2014-rohrer-2.pdf
- Kornell, N. y Bjork, R. A. (2008). Learning concepts and categories: is spacing the «enemy of induction»? *Psychological Science*, 19(6), 585-592. https://www.gwern.net/docs/spaced-repetition/2008-kornell.pdf
- Renkl, A., Atkinson, R. K., Maier, U. H. y Staley, R. (2002). From example study to problem solving: smooth transitions help learning. *J. Experimental Education*, 70(4), 293-315. https://typeset.io/pdf/from-example-study-to-problem-solving-smooth-transitions-15tfd8h0l4.pdf
- Kalyuga, S., Ayres, P., Chandler, P. y Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist*, 38(1), 23-31. https://typeset.io/pdf/the-expertise-reversal-effect-5y3mqyx7oo.pdf
- Clark, R. E., Kirschner, P. A. y Sweller, J. (2012). Putting students on the path to learning (resumen de Kirschner, Sweller y Clark 2006, *Educational Psychologist*, 41(2), 75-86). https://www.aft.org/sites/default/files/GuidedInstruction.pdf
- Keith, N. y Frese, M. (2008). Effectiveness of error management training: a meta-analysis. *J. Applied Psychology*, 93(1), 59-69. https://www.humanw.tu-darmstadt.de/media/orgpsy/preversioneffectivenessoferrormanagement.pdf · https://fis.leuphana.de/en/publications/effectiveness-of-error-management-training-a-meta-analysis/
- Wisniewski, B., Zierer, K. y Hattie, J. (2020). The power of feedback revisited. *Frontiers in Psychology*, 10:3087. https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456
- VanLehn, K. (2011). The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. *Educational Psychologist*, 46(4), 197-221. https://eric.ed.gov/?id=EJ946764
- Panko, R. R. (2015). What we don't know about spreadsheet errors today. EuSpRIG. https://arxiv.org/pdf/1602.02601.pdf · Panko (2000), EuSpRIG: https://arxiv.org/pdf/0802.3457.pdf
- Tort, F. (2010). Teaching spreadsheets: curriculum design principles. EuSpRIG. https://arxiv.org/pdf/1009.2787
- Tort, F., Blondel, F.-M. y Bruillard, É. (2009). From error detection to behaviour observation. EuSpRIG. https://www.arxiv.org/pdf/0908.1580
- McKeever, R. y McDaid, K. (2011). Range names: a risky practice in spreadsheet development? ICSOFT. https://www.scitepress.org/PublishedPapers/2011/35102/35102.pdf
- Reich, J. y Ruipérez-Valiente, J. A. (2019). The MOOC pivot. *Science*, 363(6423), 130-131. https://webs.um.es/jruiperez/papers/journals/2019_Science_MOOCPivot_postprint.pdf
- Gollwitzer (2006), artículo que cita a Gollwitzer y Sheeran (2006): https://kops.uni-konstanz.de/server/api/core/bitstreams/eb48c8cf-7855-478e-90ec-1ea6d44f8252/content
- Anki Manual, Deck Options (FSRS, retención deseada). https://docs.ankiweb.net/deck-options.html
- Association for Psychological Science (2013). Which study strategies make the grade? https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html
- Microsoft Support y Learn:
  - Operadores y prioridad: https://support.microsoft.com/en-us/office/calculation-operators-and-precedence-in-excel-48be406d-4975-4d31-b2b8-7af9e0e2878a
  - BUSCARV: https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1
  - BUSCARX: https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
  - ESPACIOS: https://support.microsoft.com/en-us/office/trim-function-410388fa-c5df-49c6-b16c-9e5630b479f9
  - Porcentajes: https://support.microsoft.com/en-us/excel/format-numbers-as-percentages-in-excel
  - SUBTOTALES: https://support.microsoft.com/en-us/office/subtotal-function-7b027003-f060-4ade-9040-e478765b9939
  - Combinar celdas: https://support.microsoft.com/en-us/office/merge-and-unmerge-cells-5cbd15d5-9375-4540-907f-c673a93fcedf
  - Copiar solo celdas visibles: https://support.microsoft.com/en-us/office/copy-visible-cells-only-6e3a1f01-2884-4332-b262-8b814412847e
  - Ordenar: https://support.microsoft.com/en-us/office/sort-data-in-a-range-or-table-62d0b95d-2a90-4610-a6ae-2e545c4a4654
  - Tablas: https://support.microsoft.com/en-us/office/overview-of-excel-tables-7ab0bb7d-3a9e-4b56-a3c9-6c94334e492c
  - Conversión automática de datos: https://support.microsoft.com/en-us/excel/set-automatic-data-conversions
  - 1900 bisiesto: https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/wrongly-assumes-1900-is-leap-year
  - Coma flotante: https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/floating-point-arithmetic-inaccurate-result
  - Centro de ayuda de Excel es-ES: https://support.microsoft.com/es-es/office/aprendizaje-en-v%C3%ADdeo-de-excel-9bc05390-e94c-46af-a5b3-d7c22f6990bb
- Formadores:
  - ExcelJet: https://exceljet.net/training/core-formula · https://exceljet.net/training
  - Coursera Macquarie: https://www.coursera.org/specializations/excel

**Solo resúmenes, extractos o fuentes secundarias [NO VERIFICABLE: no enseñarlo como dato]**
- Dunlosky et al. (2013), *PSPI* 14(1), clasificación completa.
- Van der Kleij, Feskens y Eggen (2015), *RER* 85(4).
- Butterfield y Metcalfe (2001), *JEP: LMC* 27(6).
- Richland, Kornell y Kao (2009), *JEP: Applied* 15(3).
- Sinha y Kapur (2021), *RER*.
- Bisra et al. (2018), *EPR* 30(3).
- Kulik, Kulik y Bangert-Drowns (1990), *RER* 60(2).
- Rawson, Dunlosky y Sciartelli (2013), *EPR* 25(4).
- Macnamara, Hambrick y Oswald (2014), *Psych. Science*.
- Chandler y Sweller (1996), *ACP* 10(1).
- van der Meij y Carroll (1995) y van der Meij y van der Meij (2013), *Technical Communication*.
- Mayer (2014), *Cambridge Handbook of Multimedia Learning*.
- Ericson, Margulieux y Rick (2017), Koli Calling.
- Sailer y Homner (2020), *EPR* 32(1).
- Hanus y Fox (2015), *Computers & Education* 80.
- Silverman y Barasch (2023), *JCR* 49(6).
- Kivetz, Urminsky y Zheng (2006), *JMR* 43.
- Villar, Callegaro y Yang (2013), *SSCR* 31(6).
- Lally et al. (2010), *EJSP* 40(6).
- Abeysooriya et al. (2021), *PLoS Comput. Biol.* 17(7).
- Casos JPMorgan (2013), PHE (2020) y Reinhart y Rogoff / Herndon, Ash y Pollin (2013).
- Chandoo, MyOnlineTrainingHub, XelPlus, GCFGlobal, Ken Puls y CFI (páginas comerciales).
- Knowles (andragogía), Ryan y Deci (autodeterminación), 4C/ID (van Merriënboer).
