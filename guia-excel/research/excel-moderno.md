# Excel moderno a finales de 2026 y versiones reales en las empresas

Línea de investigación: **Excel moderno (noviembre de 2026) y versiones que se encuentran en las empresas españolas**.
Fecha de la investigación: **14/11/2026**. Configuración objetivo de la guía: Excel en español (es-ES), separador `;`, decimal `,`, fechas DD/MM/AAAA, euros.

Leyenda: **[VERIFICADO: url]** = leído en fuente primaria (Microsoft Learn, support.microsoft.com, blog oficial de Excel en techcommunity, Centro de mensajes de Microsoft 365 a través del espejo mc.merill.net, BOE, INE, AEPD, Comisión Europea) el 14/11/2026. **[CORREGIDO: url]** = dato corregido tras contrastarlo en fuente primaria. **[NO VERIFICABLE: no enseñarlo como dato]** = no se ha podido confirmar en fuente primaria y no se enseña como dato.

Nombres de funciones en español: salvo que se indique otra cosa, salen de `work/funciones.json` (línea de funciones de esta misma investigación), que los cruzó con support.microsoft.com/es-es.

---

## 0. Lo esencial en 20 puntos (para quien diseña el temario)

1. **El Excel «normal» en una empresa con Microsoft 365, en noviembre de 2026, es la versión 26xx de Microsoft 365 Apps.** Desde julio de 2026 (versión 2606), el Canal semestral para empresas (SAEC) se ha unificado con el Canal mensual para empresas (MEC): los equipos SAEC reciben ya funciones nuevas **cada mes**. Se acaba el desfase de 6–12 meses que tenían las grandes empresas. [VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365-apps/updates/unified-update-channels (actualizada 18/08/2026)]
2. **Excepción importante: los PC con Windows 10.** Microsoft 365 Apps en Windows 10 recibe funciones nuevas y Copilot **solo hasta la versión 2608**; después se queda en 2608 y recibe solo parches de seguridad hasta el **10/10/2028**. [VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365-apps/end-of-support/windows-10-support (27/07/2026)]. En España, Windows 10 seguía en torno al 27–31 % del uso web de los PC con Windows a mediados de 2026 (StatCounter: 31,2 % en mayo, 31,3 % en junio, 26,7 % en julio y 30,5 % en agosto; 27,1 % en octubre) [VERIFICADO: https://gs.statcounter.com/windows-version-market-share/desktop/spain].
3. **Office 2016 y 2019 sin soporte desde el 14/10/2025. Office 2021 y Office LTSC 2021 sin soporte desde el 13/10/2026** (hace un mes). Siguen abriéndose y funcionando, pero sin parches de seguridad. Office LTSC 2024 tiene soporte hasta el **09/10/2029**. [VERIFICADO: https://support.microsoft.com/KB/5002369 · https://learn.microsoft.com/en-us/lifecycle/announcements/office-ltsc-2021-end-of-support · https://learn.microsoft.com/en-us/lifecycle/products/office-ltsc-2024]
4. **Copilot en Excel ya no es un botón suelto ni una función: es un panel con tres modos (editar, planificar y chat).** El antiguo «Agent Mode» se lanzó en septiembre de 2025, fue GA en la web en diciembre de 2025 y en Windows y Mac el 27/01/2026, llegó a la UE en febrero de 2026 y en marzo pasó a llamarse **«Editar con Copilot»** (Edit with Copilot). [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/agent-mode-in-excel-is-now-generally-available-on-desktop/4457408 · https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-february-2026/4496014 · https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-march-2026/4474247]
5. **La función `=COPILOT()` se retiró el 14/09/2026** (MC1454373). Nunca llegó a GA. Los resultados ya calculados se quedan en caché; al recalcular devuelve **#¿NOMBRE?**. **No hay que enseñarla.** [VERIFICADO: https://mc.merill.net/message/MC1454373 y https://support.microsoft.com/es-es/excel/functions/copilot-function]
6. **El propio Microsoft avisa de que Copilot se equivoca.** Su página de preguntas frecuentes dice: «Review, edit, and verify anything Copilot creates before you rely on it» y «Avoid using Copilot for decisions in sensitive areas such as finance, legal, or medical topics». [VERIFICADO: https://support.microsoft.com/en-us/Excel/copilot/frequently-asked-questions-about-copilot-in-excel]. En SpreadsheetBench (912 tareas), Agent Mode acertó el **57,2 %** [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/building-agent-mode-in-excel/4457320]. En el artículo original del banco de pruebas, cuatro expertos en Excel acertaron el **71,3 %**, pero en una muestra de 50 de esas tareas (no en las 912), así que la comparación es solo orientativa [CORREGIDO: https://arxiv.org/abs/2406.14991 (Ma et al., «SpreadsheetBench», NeurIPS 2024 Datasets and Benchmarks, tabla 2, «Human Performance»: 71,33 % global con restricción suave)].
7. **No todo el mundo tiene Copilot dentro de Excel.** Depende de la etiqueta que aparece bajo tu nombre. Con «Copilot Chat (Basic)» no hay Copilot dentro de Word, Excel, PowerPoint ni OneNote. Con «Microsoft 365 Copilot (Basic)», sin licencia de pago, hay «acceso estándar»: su disponibilidad depende de la capacidad del servicio, puede variar a lo largo del día y puede ir limitada en horas punta. Con «Microsoft 365 Copilot (Premium)», la licencia de pago, el acceso es prioritario. [VERIFICADO: https://learn.microsoft.com/en-us/copilot/overview y https://support.microsoft.com/en-us/microsoft-365-copilot/what-copilot-license-do-i-have]. Que este corte empezara el 15/04/2026 y solo en organizaciones de más de 2.000 puestos [NO VERIFICABLE: no enseñarlo como dato; solo lo cuentan Computerworld, Office Watch y blogs citando MC1253858 y MC1253863, y esos avisos no se pudieron leer en fuente primaria (el espejo mc.merill.net devuelve 404)].
8. **En empresas de la UE, los modelos Claude de Anthropic dentro de Copilot vienen desactivados por defecto** y están **fuera del Límite de datos de la UE (EU Data Boundary)**. Las búsquedas web de Copilot (Bing) también quedan fuera. Esto importa para el RGPD. [VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365/copilot/connect-to-ai-subprocessor (04/11/2026) y https://learn.microsoft.com/en-us/microsoft-365/copilot/enterprise-data-protection]
9. **Python en Excel es GA para empresas (Windows, Mac y web) y no está en móvil.** El cálculo estándar va incluido; el «premium», con límite mensual o con un complemento de pago. No funciona con licencias por dispositivo ni con activación en equipo compartido. El código se ejecuta en la nube de Microsoft (contenedores en la UE para clientes de la UE), sin acceso a la red. [VERIFICADO: https://support.microsoft.com/en-us/office/python-in-excel-availability-781383e6-86b9-4156-84fb-93e786f7cab0 y https://support.microsoft.com/en-us/excel/python/data-security-and-python-in-excel]
10. **Solo en Microsoft 365 (no en Excel 2024 de compra única):** AGRUPARPOR, PIVOTARPOR, PERCENTOF, RECORTARRANGO y las referencias recortadas (`A:.A`), REGEXPRUEBA, REGEXEXTRACCION, REGEXREEMPLAZAR, TRADUCIR, DETECTARIDIOMA, casillas de verificación en celda, Python, Copilot, tipos de datos vinculados e HISTORIALCOTIZACIONES. **Excel 2024 sí trae** IMAGEN, LAMBDA y sus auxiliares, y 14 funciones nuevas de texto y matrices (DIVIDIRTEXTO, APILARV, TOMAR…). **Excel 2021 trae** BUSCARX, FILTRAR, ORDENAR, UNICOS, SECUENCIA, COINCIDIRX y LET. [VERIFICADO: https://support.microsoft.com/office/faee26b6-ad74-40a8-9304-aa6db716553f · https://support.microsoft.com/en-US/Excel/what-s-new-in-excel-2021-for-windows · páginas de cada función en `work/funciones.json`]
11. **Un archivo con BUSCARX abierto en Excel 2016 o 2019** puede enseñar la fórmula como `=_xlfn.XLOOKUP(...)` y mantiene el último resultado guardado, pero en cuanto se recalcula da **#¿NOMBRE?**. Borrar el prefijo `_xlfn.` no lo arregla, porque la función no existe en esa versión. Las fórmulas de matriz dinámica compatibles pueden verse como fórmulas matriciales antiguas `{=...}`, que no se redimensionan. [VERIFICADO (CSE): https://support.microsoft.com/en-us/excel/dynamic-array-formulas-in-non-dynamic-aware-excel · VERIFICADO (`_xlfn.` y #¿NOMBRE? al recalcular): https://support.microsoft.com/en-us/office/formula-compatibility-issues-in-excel-37224100-8f79-45de-b43a-7fa28c6c15c4]
12. **Los archivos guardan las fórmulas en inglés.** El Excel en español las traduce al abrirlas. Por eso un libro hecho en español funciona en un Excel en inglés, pero una fórmula copiada de internet o de ChatGPT en inglés y con comas no funciona si se pega tal cual en un Excel es-ES. [VERIFICADO: https://learn.microsoft.com/en-us/javascript/api/excel/excel.range (propiedades formulas y formulasLocal: la fórmula inglesa «=SUM(A1, 1.5)» se convierte en «=SUMME(A1; 1,5)» en un Excel alemán) y https://learn.microsoft.com/en-us/visualstudio/vsto/globalization-and-localization-of-excel-solutions («Worksheet function names are translated internally for most language versions of Excel»)]
13. **Power Query ya funciona entero en Excel para la web** (asistente de importación y editor, GA en enero de 2026). En Mac hay editor, pero muchos conectores solo actualizan y no hay Modelo de datos. En iOS y Android no hay Power Query. [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-january-2026/4474246 · https://support.microsoft.com/en-US/excel/power-query-data-sources-in-excel-versions]
14. **Power Pivot (Modelo de datos y DAX) sigue siendo solo de Excel para Windows.** [VERIFICADO de forma parcial: https://support.microsoft.com/en-us/excel/where-is-power-pivot solo lista versiones de Windows; la página de Power Query para Mac dice que el Modelo de datos y Power Pivot no tienen fecha en Mac]
15. **La coautoría exige** suscripción a Microsoft 365, el archivo en OneDrive o SharePoint Online, formato `.xlsx`, `.xlsm` o `.xlsb` (no «Strict Open XML») y Autoguardado activado. Basta con que una persona abra el archivo con un Excel antiguo para que a los demás les salga «archivo bloqueado». [VERIFICADO: https://support.microsoft.com/en-us/office/collaborate-on-excel-workbooks-at-the-same-time-with-co-authoring-7152aa8b-b791-414c-a3bb-3024e46fb104]
16. **Lo que hay en vista previa (Insider) en noviembre de 2026 y no debe enseñarse como disponible:** listas, matrices dentro de una celda y matrices anidadas (con FLATTEN, HAS, HASANY y HASALL), IMPORTCSV e IMPORTTEXT, tarjetas de error descriptivas, «Centrar en la selección» en el menú de Combinar, lienzo interactivo y grabadora de habilidades en escritorio, y reglas del libro (hoja `.Rules`). [VERIFICADO: entradas del blog de Excel de enero, junio, septiembre y octubre de 2026]
17. **No consta ningún «editor de fórmulas nuevo» GA en Excel** [NO VERIFICABLE: no enseñarlo como dato; búsquedas en el blog oficial de Excel y en la web sin resultado el 14/11/2026]. Lo que sí hay es el autocompletado de fórmulas con Copilot (desde septiembre de 2025, al principio solo en la web y en inglés de EE. UU.) [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/introducing-formula-completion---a-new-way-to-write-formulas-in-excel-using-copi/4452196], el complemento gratuito Excel Labs (Advanced Formula Environment) [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/advanced-formula-environment-is-becoming-excel-labs-a-microsoft-garage-project/3736518] y las tarjetas de error descriptivas (en Insider).
18. **Empresas españolas (INE, primer trimestre de 2026, empresas de 10 o más empleados):** el **39,4 %** compra servicios en la nube de pago y el **33,6 %** usa inteligencia artificial. En las de menos de 10 empleados, el **21,4 %** usa IA. [VERIFICADO: https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm (22/10/2026)]. **No hay ningún dato público fiable sobre la cuota de Microsoft 365 frente a Google Workspace en España.**
19. **En la administración pública conviven Microsoft 365 y el software libre.** La Junta de Andalucía está extendiendo Microsoft 365 con Copilot Chat a los 44.500 empleados de su Administración General (antes de julio de 2027; en marzo de 2026 lo usaban 8.500) [CORREGIDO: https://www.juntadeandalucia.es/organismos/industriaenergiayminas/servicios/actualidad/noticias/detalle/649726.html (13/03/2026) y https://news.microsoft.com/source/emea/features/la-junta-de-andalucia-adoptara-microsoft-365-como-plataforma-de-trabajo-con-el-fin-de-impulsar-una-administracion-mas-colaborativa-segura-e-innovadora/?lang=es]. La Xunta de Galicia mantiene un «Plan de Migración do Posto de Traballo a Software Libre» y forma a su personal en LibreOffice en 2026 [VERIFICADO: https://egap.xunta.gal/fichacurso/pdf/FC26158]. La norma estatal de interoperabilidad admite `.ods`, `.xlsx` (ISO/IEC 29500 Strict) y `.csv` [VERIFICADO: BOE-A-2012-13501].
20. **Desde el 02/02/2025, la empresa está obligada a promover la alfabetización en IA de su plantilla** (art. 4 del Reglamento de IA). Las autoridades supervisan su cumplimiento desde el 02/08/2026. El «Digital Omnibus» (julio de 2026) suavizó el texto: la obligación sigue, pero ya no exige un nivel «suficiente». [VERIFICADO: https://digital-strategy.ec.europa.eu/es/policies/ai-talent-skills-and-literacy (13/10/2026)]. La AEPD publicó en octubre de 2026 un decálogo para delegar en asistentes y agentes de IA; uno de sus puntos es **usar solo los asistentes autorizados por la organización**. [VERIFICADO: https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-aepd-publica-un-decalogo-para-delegar-tareas-en-asistentes]

---

## 1. Qué hay en Excel para Microsoft 365 en noviembre de 2026

### 1.0 Cómo saber qué Excel tienes (primera lección práctica)

- **Archivo > Cuenta.** En «Información del producto» aparece el producto (por ejemplo, «Microsoft 365 Apps para empresas»), el **canal** y la **versión y compilación** (por ejemplo, «Versión 2610»). La versión se escribe AAMM: 2609 es septiembre de 2026. [VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365-apps/updates/overview-update-channels («File > Account… The name of the update channel appears… The version and build number…»)]
- Pista sin menús: si `=BUSCARX(1;{1};{1})` da 1, la versión es 2021 o posterior. Si `=APILARV(1;2)` funciona, es 2024 o Microsoft 365. Si `=AGRUPARPOR(...)` o `=REGEXPRUEBA("a";"a")` funcionan, es Microsoft 365 al día. [Deducción propia a partir de la disponibilidad de cada función]
- Los canales de Microsoft 365 Apps (Windows):

| Canal | Funciones nuevas | Soporte de cada versión | Nota |
|---|---|---|---|
| Canal actual (Current Channel) | Cuando están listas, unas 1 vez al mes | Hasta la siguiente versión | **Canal por defecto** de Microsoft 365 Apps para empresas y para grandes empresas |
| Canal mensual para empresas (MEC) | El segundo martes de cada mes | 3 meses | Copilot puede llegar antes |
| Canal semestral para empresas (SAEC) | Era en enero y julio; **desde la versión 2606 (julio de 2026) recibe lo mismo que MEC** | — | La unificación es MC1274325 |
| Beta / Canal actual (vista previa) = Insider | Antes que nadie | Beta: sin soporte | Lo que el blog de Excel marca «Insiders» |

[VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365-apps/updates/overview-update-channels (27/05/2026) · https://learn.microsoft.com/en-us/microsoft-365-apps/updates/unified-update-channels]

> **Para la guía:** «Lo que veas en un vídeo puede no estar en tu Excel». Una función nueva llega primero a Insider, después se despliega poco a poco en el Canal actual («some users may not see the feature yet») y luego en el MEC. Lo correcto es enseñar a comprobarlo en Archivo > Cuenta, no prometer que todo el mundo tenga lo mismo.

### 1.1 Copilot en Excel

**Cronología**

| Fecha | Hecho | Fuente |
|---|---|---|
| Sep. 2025 | Llega Agent Mode en el programa Frontier. El 29/09/2025, Microsoft publica su resultado en SpreadsheetBench: 57,2 % | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/building-agent-mode-in-excel/4457320] |
| Sep. 2025 | **Autocompletado de fórmulas con Copilot** al escribir «=», al principio solo en Excel para la web y en inglés de EE. UU. | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/introducing-formula-completion---a-new-way-to-write-formulas-in-excel-using-copi/4452196 (08/09/2025, actualizado el 08/10/2025; también lo cita en Insider Beta de Excel para Windows)] |
| Ago. 2025 – sep. 2026 | La función `=COPILOT()`, solo en Insider y Frontier, se retira el **14/09/2026** | [VERIFICADO: MC1454373] |
| 10/11/2025 | Aviso MC1184407: «App Skills» (el Copilot antiguo de Excel) se sustituye por Agent Mode y Copilot Chat. El punto de entrada desaparece a finales de febrero de 2026 | [VERIFICADO: https://techcommunity.microsoft.com/blog/ExcelBlog/app-skills-is-evolving-with-copilot-in-excel/4496577] |
| Dic. 2025 | Agent Mode, GA en Excel para la web | [VERIFICADO: entrada del 27/01/2026] |
| 27/01/2026 | Agent Mode, GA en Windows y, en los días siguientes, en Mac, para licencias comerciales de Microsoft 365 Copilot y para Personal, Familia y Premium (con créditos de IA). Todavía **no en la UE ni en el Reino Unido**. Selector de modelos: GPT 5.2 y Claude Opus 4.5 | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/agent-mode-in-excel-is-now-generally-available-on-desktop/4457408] |
| Feb. 2026 | Agent Mode, disponible **en la UE** (Canal actual y MEC). Copilot Chat empieza a consultar libros **locales** (.xlsx, .xlsb, .xlsm, .ods) | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-february-2026/4496014] |
| Mar. 2026 | Pasa a llamarse **«Editar con Copilot»**, en todos los idiomas estándar de Copilot. Llega el contexto «Work IQ» (correos, reuniones y archivos) para quien tiene licencia | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-march-2026/4474247] |
| Mar. 2026 | Agent Mode con archivos locales en escritorio y Mac: anunciado en la hoja de ruta (RM557564, GA prevista para marzo de 2026) y disponible con carácter general desde el 09/03/2026 en Excel para Windows, web y Mac para usuarios de Microsoft 365 Copilot | [VERIFICADO el anuncio: https://mc.merill.net/message/RM557564 · VERIFICADO el estado final: https://techcommunity.microsoft.com/blog/microsoft365copilotblog/from-draft-to-done-agentic-copilot-in-excel-word-and-powerpoint/4500196] |
| 15/04/2026 (según prensa) | En organizaciones de más de 2.000 puestos, los usuarios sin licencia pierden Copilot dentro de Excel. En las más pequeñas queda el «acceso estándar» | [NO VERIFICABLE: no enseñarlo como dato; solo Computerworld y Office Watch, que citan MC1253858 y MC1253863. Sí está verificado que con la etiqueta «Copilot Chat (Basic)» no hay Copilot dentro de Excel y con «Microsoft 365 Copilot (Basic)» hay acceso estándar: https://learn.microsoft.com/en-us/copilot/overview] |
| Abr. 2026 | Selector **Chat / Editar** («Permitir edición», activado por defecto para muchos), **modo Planificar** (enseña el plan antes de tocar el libro), resaltado de los cambios de Copilot con **pestaña de hoja en verde** y **Python** dentro de «Editar con Copilot» | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-april-2026/4502696] |
| Abr. – jun. 2026 | MC1282571: desaparecen los accesos a Copilot del clic derecho y de la selección de celdas. Queda un único acceso en una esquina y el panel lateral derecho pasa a ser la interfaz principal | [VERIFICADO: https://mc.merill.net/message/MC1282571] |
| Jun. 2026 | Preferencias personales, enlaces navegables en las respuestas, más contexto (personas, correos, Teams, Loop), más de 30 tipos de archivo de hasta 50 MB, **habilidades personalizadas** (Insider; GA en julio) y **reglas del libro** en una hoja `.Rules` (Insider) | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-june-2026/4523402] |
| Jul. 2026 | Citas en línea, Power BI como fuente, habilidades @brand-kit y @theme-design, y libros con Autoguardado desactivado | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-july-2026/4523403 (28/07/2026; lo de Autoguardado desactivado, solo en Windows y Mac)] |
| 01/09/2026 | **Habilidad de historial de cambios**, GA: resume quién cambió qué, colorea las ediciones de Copilot y permite deshacer selectivamente | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/copilot-in-excel-bringing-clarity-to-collaborative-workbooks/4552007] |
| Sep. 2026 | «Editar con Copilot» llega al iPad | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-september-2026/4549755] |
| Oct. 2026 | **Habilidad de limpiar datos** (@clean-data) y **creador de habilidades**: se despliegan a GA en Windows, Mac y web. **Grabadora de habilidades:** GA en la web, Insider en escritorio. **Lienzo interactivo** (informe dinámico): Insider en Windows. **Habilidad de obtener datos**: crea una consulta de Power Query hablando, en la web | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-october-2026/4549758 · https://techcommunity.microsoft.com/blog/excelblog/beyond-analysis-copilot-gets-to-work-in-excel/4517581] |

**Situación en noviembre de 2026**

- **Modos:** editar (cambia el libro), planificar (propone un plan antes de editar) y chat (responde sin tocar el libro). En Windows, Mac y la web están los tres. En iPad hay chat y planificar, y la edición se está desplegando. En iPhone y Android, solo chat. [VERIFICADO: FAQ https://support.microsoft.com/en-us/Excel/copilot/frequently-asked-questions-about-copilot-in-excel]
- **Licencias válidas:** Microsoft 365 Personal o Familia con plan de créditos de IA; Microsoft 365 Premium; licencia comercial de Copilot; o un plan de empresa con derecho a Copilot Chat. Etiquetas que se ven: **«M365 Copilot (Premium)»** (con licencia y acceso prioritario) y **«M365 Copilot (Basic)»** (acceso estándar). El administrador no puede desactivar Copilot en Excel por separado: se gestiona desde la configuración de Copilot Chat. [VERIFICADO: FAQ]. MC1282571 dice que el nuevo acceso requiere licencia «Premium», lo que choca con la FAQ. **Conclusión: depende del inquilino (tenant) de cada empresa.**
- **Requisitos que fallan a menudo:**
  - Cálculo en **Automático**: «Copilot editing is only supported when Calculation Options are set to Automatic».
  - El formato **Strict Open XML no sirve**: hay que guardar como `.xlsx` normal.
  - En sitios de SharePoint que obligan a **desproteger** (check-out) el archivo, Copilot no funciona en Windows ni en Mac, pero sí en la web.
  [VERIFICADO: FAQ]
- **Idioma:** el español está entre los idiomas admitidos, pero Microsoft avisa de que Copilot «was trained on sources predominantly in English and may not perform as well when prompts or data are in other languages». [VERIFICADO: FAQ]
- **Modelos:** Claude (Anthropic), GPT (OpenAI) o «Auto». La elección vale solo para la sesión. En empresas, **el administrador tiene que habilitar Anthropic** como subencargado; en la UE, la EFTA y el Reino Unido viene **apagado** («No users») por defecto. [VERIFICADO: FAQ y https://learn.microsoft.com/en-us/microsoft-365/copilot/connect-to-ai-subprocessor]. Las versiones de modelo cambian casi cada mes (las entradas del blog citan GPT 5.2, 5.5 y 5.6, Claude Opus 4.5, 4.6, 4.7, 4.8 y 5, Sonnet 5.5, GPT-6.1 Sol): **la guía no debe nombrar modelos concretos.**
- **Historial:** se pueden ver las conversaciones, pero no borrar una sola: se borra todo el historial de actividad. Los cambios que Copilot guarda los ve cualquiera con acceso al archivo, también quien esté coeditando. [VERIFICADO: FAQ]
- **Precio en España (orientativo):** Microsoft 365 Copilot Business, complemento para pymes de hasta 300 usuarios, unos **18,20 €/usuario/mes** sin IVA con pago anual (promoción de 15,60 € del 01/07/2026 al 31/12/2026; 21,84 € con pago mensual). Para grandes empresas, unos 26 € sin IVA con pago anual [VERIFICADO: https://www.microsoft.com/es-es/microsoft-365-copilot/pricing, https://www.microsoft.com/es-es/microsoft-365-copilot/pricing/enterprise y https://learn.microsoft.com/en-us/copilot/microsoft-365/copilot-business-faq (límite de 300 usuarios), consultados el 14/11/2026].

**Qué hace bien Copilot en Excel (según Microsoft y la evidencia que hay)**

- Crear tablas, gráficos y tablas dinámicas, aplicar formato, ordenar y filtrar, generar fórmulas y columnas calculadas, explicar fórmulas, y resumir o clasificar texto. [VERIFICADO: FAQ, «Capabilities»]
- Tareas de varios pasos con un plan que se puede revisar (modo Planificar), y cálculos que deja **en la cuadrícula como fórmulas**, no como valores pegados, para poder auditarlos. Antes de cada acción genera pruebas ligeras de lo que debería salir. [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/building-agent-mode-in-excel/4457320]
- Limpieza de datos: texto incoherente (mayúsculas, puntuación, tildes), números guardados como texto y espacios de más. Funciona mejor con datos en **Tabla** y con hasta unas 100 columnas y 50.000 filas. **No detecta duplicados ni fechas** según la página de soporte. [VERIFICADO: https://support.microsoft.com/en-us/excel/copilot/clean-up-your-data-with-copilot-in-excel]
- Revisar lo que ha cambiado en un libro compartido (habilidad de historial de cambios). [VERIFICADO]

**Qué no hace bien o qué riesgos tiene**

- Acierta más o menos 6 de cada 10 tareas de referencia (57,2 % en SpreadsheetBench), y Microsoft reconoce que esa prueba no mide matrices dinámicas, tablas dinámicas, gráficos ni formato. Es decir, no mide lo que más se usa en una oficina. Admite «plenty of room for improvement», sobre todo en formato y presentación. [VERIFICADO: blog «Building Agent Mode»]
- **Errores silenciosos:** el propio equipo de Excel escribe que muchos errores de hoja de cálculo son silenciosos, porque una fórmula puede devolver un valor y aun así estar mal. [VERIFICADO: mismo blog]
- Funciona peor en español que en inglés [VERIFICADO: https://support.microsoft.com/en-us/Excel/copilot/frequently-asked-questions-about-copilot-in-excel]. Que Copilot devuelva fórmulas con **coma en vez de punto y coma** en configuraciones regionales europeas [NO VERIFICABLE: no enseñarlo como dato; solo lo cuenta el blog wisechecker]. Lo que sí está documentado es que una fórmula cuyo separador no coincide con el separador de lista configurado da error [VERIFICADO: https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/formula-errors]; conviene probarlo en un Excel es-ES real antes de afirmarlo en la guía.
- No sirve para decisiones financieras, legales o médicas sin revisión (FAQ). Esto afecta de lleno a puestos de contabilidad, nóminas y finanzas.
- Puede ver contenido de la empresa (correos, Teams, archivos) si la licencia incluye ese contexto. Por eso, lo que se le pide y lo que se pega en la petición ya es un tratamiento de datos.

**Qué no enseñar:** la función `=COPILOT()` (retirada), el botón «Copilot» del clic derecho (eliminado por MC1282571), «App Skills» (retirado en febrero de 2026), los nombres de modelos concretos y la «Analizar datos» antigua como si fuera la vía principal (sigue documentada en Inicio > Analizar datos, sin aviso de retirada ni de sustitución por Copilot, para suscriptores de Microsoft 365 en inglés, francés, español, alemán, chino simplificado y japonés [VERIFICADO: https://support.microsoft.com/es-es/office/analizar-datos-en-excel-3223aab8-f543-4fda-85ed-76bb0295ffc4]).

### 1.2 Python en Excel

- **Qué es:** se escribe `=PY` (o Ctrl+Alt+Mayús+P) y se abre el editor. El código se ejecuta en la nube de Microsoft con bibliotecas de Anaconda (pandas, matplotlib…). [VERIFICADO (nube y Anaconda): https://support.microsoft.com/en-us/excel/python/data-security-and-python-in-excel · atajo según `work/funciones.json`]
- **Disponibilidad:**

| Plataforma | Empresa | Familia/Personal | Educación |
|---|---|---|---|
| Windows | GA: Canal actual 2408+, MEC 2408+, SAEC 2502+ | Vista previa (CC 2405+) | Vista previa (Insider) |
| Web | GA | Vista previa | — |
| Mac | GA: Canal actual 16.96+ | Vista previa (Beta) | Vista previa (Beta) |
| iPad, iPhone, Android | **No**: el libro se abre, pero las celdas de Python dan error al recalcular | | |

  **Excluidos:** licencias gratuitas, de compra única, por dispositivo y con activación en equipo compartido (muy habitual en escritorios remotos y Citrix). **Cálculo estándar incluido** (recálculo automático). **Cálculo premium:** un cupo mensual, o completo con el complemento de pago «Python in Excel». [VERIFICADO: https://support.microsoft.com/en-us/office/python-in-excel-availability-781383e6-86b9-4156-84fb-93e786f7cab0]
- **Seguridad:** contenedor aislado por libro, **sin acceso a la red** ni al equipo. Solo lee las celdas que se le pasan con `xl()` y solo devuelve valores o imágenes. Los contenedores se destruyen y no guardan datos entre sesiones. Cumple el RGPD y el EU Data Boundary, y los contenedores de clientes de la UE se ejecutan en la UE. En Vista protegida, las fórmulas de Python no se ejecutan por defecto. [VERIFICADO: página de seguridad]. El 9/06/2026 Microsoft publicó y corrigió una vulnerabilidad de Excel (CVE-2026-45459, «omisión de una característica de seguridad», gravedad «Importante», sin explotación conocida) [VERIFICADO: https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-45459]; que tenga que ver con Python en Excel (una imagen generada que podía forzar una petición de red) solo lo dice un blog secundario [NO VERIFICABLE: no enseñarlo como dato].
- **Python con Copilot:** desde abril de 2026, «Editar con Copilot» puede ejecutar análisis con Python «cuando Python está habilitado». [VERIFICADO: blog de abril de 2026]. El modo «Advanced Analysis» del Copilot antiguo había desaparecido en febrero de 2026. [VERIFICADO: blog de App Skills]
- **Para la guía:** Python en Excel es un tema de nivel alto y opcional. Casi ninguna oferta española lo pide (ver `curriculo.md`). Basta con saber que existe, qué licencia necesita, que se ejecuta en la nube y que no se debe usar con datos sensibles sin permiso de la empresa.

### 1.3 Funciones y herramientas «modernas»: estado y plataformas

| Herramienta (nombre en es-ES) | Estado en nov. 2026 | Plataformas | ¿En Excel 2024 de compra única? | Fuente |
|---|---|---|---|---|
| **Casillas de verificación en celda** (Insertar > Casilla; espacio para marcar; guardan VERDADERO/FALSO) | **GA**. Producción desde junio de 2024. Despliegue completo en Canal actual, MEC y SAEC según la actualización de enero de 2026. Web y móvil en producción | Windows, Mac, web, iPad, iOS, Android | **No** (en versiones antiguas se usan controles de formulario de la pestaña Programador) | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/introducing-checkboxes-in-excel/4173561 (nota del 29/01/2026)] · [VERIFICADO (ausencia en 2024): https://support.microsoft.com/en-us/office/what-s-new-in-excel-2024-for-windows-and-mac-faee26b6-ad74-40a8-9304-aa6db716553f no las incluye, y Microsoft dice que no lleva funciones nuevas a las versiones de compra única (respuesta del equipo de Excel en https://techcommunity.microsoft.com/blog/excelblog/new-aggregation-functions-groupby-and-pivotby/3965765)] |
| **AGRUPARPOR / PIVOTARPOR / PERCENTOF** | **GA** en el Canal actual desde el 25/09/2024. El blog de octubre de 2024 la da por GA en Windows, Mac y web | Windows, Mac, web | **No** | [VERIFICADO (fecha 25/09/2024): https://techcommunity.microsoft.com/blog/excelblog/new-aggregation-functions-groupby-and-pivotby/3965765 · VERIFICADO que no figura en las novedades de Excel 2024] |
| **RECORTARRANGO** y **referencias recortadas** (`A1:.E10` quita las filas vacías del final; `A1.:E10`, las del principio; `A1.:.E10`, ambas; `A:.A`, una columna entera recortada) | **GA** (desplegada en el Canal actual y el MEC de Windows en marzo de 2025). No admite rangos 3D. En tablas dinámicas se elimina el punto | Microsoft 365 | **No** | [VERIFICADO (sintaxis): https://support.microsoft.com/en-us/excel/functions/trimrange-function · VERIFICADO (fecha): https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-march-2025/4387484 · NO VERIFICABLE (límites con rangos 3D y tablas dinámicas; solo blogs y el foro de usuarios): no enseñarlo como dato] |
| **REGEXPRUEBA / REGEXEXTRACCION / REGEXREEMPLAZAR** (motor PCRE2) | **GA** en Microsoft 365. Vista previa en mayo de 2024; en el Canal actual desde principios de 2025. La opción regex en BUSCARX y COINCIDIRX se anunció «próximamente» (en noviembre de 2026 la página de BUSCARX aún no la recoge entre sus modos de coincidencia) | Windows, Mac, web | **No** | [VERIFICADO (vista previa): https://techcommunity.microsoft.com/blog/microsoft365insiderblog/new-regular-expression-regex-functions-in-excel/4226334 · VERIFICADO (Canal actual entre diciembre de 2024 y febrero de 2025): https://www.icaew.com/technical/technology/excel-community/excel-community-articles/2025/new-tech-features-dec-2024-feb-2025 · BUSCARX: https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929] |
| **IMAGEN** (imagen desde una URL https) e imagen en celda | **GA** | Windows, Mac, web | **Sí** | [VERIFICADO: https://support.microsoft.com/office/faee26b6-ad74-40a8-9304-aa6db716553f] |
| **TRADUCIR / DETECTARIDIOMA** (servicio en línea Microsoft Translator) | **GA** (incluidas en las novedades de enero de 2025 para Windows y Mac) | Windows, Mac, web | **No** | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-january-2025/4357005] |
| **IMPORTCSV / IMPORTTEXT** (importan un CSV o un texto como matriz dinámica que se puede actualizar) | **Insider Beta** (Windows), anunciadas en enero de 2026. Sin fecha de GA | Windows Insider | No | [VERIFICADO: blog de enero de 2026 · página IMPORTCSV] |
| **Listas, matrices en celdas y matrices anidadas**, con **FLATTEN, HAS, HASANY y HASALL** (Ctrl+J o Insertar > Lista) | **Insider Beta**, opcional (24/09/2026) | Windows, Mac Insider | No | [VERIFICADO: https://techcommunity.microsoft.com/blog/excelblog/excel-now-supports-multiple-values-in-a-single-cell/4549756] |
| **Dar nombre a la tabla al crearla** (cuadro de Ctrl+T) | **GA** en octubre de 2026 | Windows, Mac | No | [VERIFICADO: blog de octubre de 2026] |
| **«Centrar en la selección»** en el menú de Combinar y centrar | Insider (septiembre de 2026). La opción en sí existe desde siempre en Formato de celdas > Alineación | Windows, Mac Insider | — | [VERIFICADO: blog de septiembre de 2026] |
| **Tarjetas de error descriptivas** (explican el error) | Insider (enero de 2026) | Windows | No | [VERIFICADO: blog de enero de 2026] |
| **Tabla dinámica que no cabe → #¡DESBORDAMIENTO!** con pasos para resolverlo | Anunciada en junio de 2026, sin estado | Windows, Mac, web | No | [VERIFICADO: blog de junio de 2026] |
| **Celda de enfoque** (Focus Cell, resalta la fila y la columna activas) | GA en escritorio (enero de 2025) | Windows, Mac | No | [VERIFICADO: blog de enero de 2025 (la URL enlazada dice «generally-available-on-desktop»)] |
| **Modo oscuro de la cuadrícula** | Insider (enero de 2025); en despliegue para el Canal actual de Windows desde abril de 2025. Necesita el tema de Office «Negro» y se activa con un botón de la pestaña Vista [CORREGIDO: https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-april-2025/4399237 · https://support.microsoft.com/en-us/office/dark-mode-in-excel-c0014bf6-c20e-41eb-8363-75b9c5759d7f] | Windows | No | [VERIFICADO: blog de enero de 2025] |
| **Office Scripts: guardar y enviar por correo como PDF** | Anunciado en enero de 2026 | Windows, Mac, web | No | [VERIFICADO: blog de enero de 2026] |
| **Gráficos que leen matrices dinámicas** | GA | Microsoft 365 | **Sí** (2024) | [VERIFICADO: novedades de 2024] |

> **Para la guía:** las casillas sustituyen a la vieja «lista desplegable Sí/No» en registros de tareas, pero **solo si todo el equipo tiene Microsoft 365**. Hay que enseñar siempre la alternativa: Validación de datos con la lista `Sí;No`, o una columna con VERDADERO/FALSO.

### 1.4 «Editor de fórmulas nuevo», Relleno rápido, sugerencias y duplicados

- **No he encontrado un editor de fórmulas nuevo con disponibilidad general** en 2025–2026 [NO VERIFICABLE: no enseñarlo como dato]. Lo que hay:
  - **Autocompletado de fórmulas con Copilot** (formula completion): propone una fórmula entera al escribir «=». Empezó en septiembre de 2025 en la web y en inglés de EE. UU.; al principio no proponía fórmulas que miraran otras hojas. Ya está en Excel para Windows (versión 2510 o posterior) con licencia de Microsoft 365 Copilot, y se desactiva en Archivo > Opciones > Copilot [VERIFICADO: https://techcommunity.microsoft.com/blog/microsoft365insiderblog/faster-formula-writing-with-formula-completion-in-excel-for-windows/4456984 · https://support.microsoft.com/en-us/excel/copilot/copilot-formula-suggestions-turn-on-off]; si funciona en otros idiomas, incluido el español [NO VERIFICABLE: no enseñarlo como dato].
  - **Excel Labs**, complemento gratuito de Microsoft Garage con el «Advanced Formula Environment» (editor con sangrías y nombres); en 2026 sigue figurando como función del complemento, que Microsoft presenta como vista previa que puede cambiar o retirarse [VERIFICADO: https://github.com/microsoft/Excel-Labs].
  - La **barra de fórmulas** se puede ampliar (Ctrl+Mayús+U) y escribir en varias líneas con Alt+Entrar [conocimiento previo; comprobar con el inventario de atajos].
- **Relleno rápido** (Datos > Relleno rápido) existe desde Excel 2013 en todas las versiones de escritorio. Los atajos documentados en es-ES se contradicen (`work/atajos_es.txt` recoge Ctrl+E y también Ctrl+Mayús+E). **Comprobarlo en un Excel es-ES real antes de publicarlo.**
- **Duplicados:** no existe una función nueva de «detección automática de duplicados» [NO VERIFICABLE: no enseñarlo como dato]. Lo de siempre: Inicio > Formato condicional > Reglas para resaltar celdas > Valores duplicados; Datos > Quitar duplicados; UNICOS (2021 o posterior); CONTAR.SI para marcar repetidos; y Power Query > Quitar duplicados. La habilidad de limpiar datos de Copilot **no menciona duplicados**.

### 1.5 Tipos de datos vinculados

- **Cotizaciones** (Stocks), **Geografía** y **Monedas**, en Datos > Tipos de datos. Solo Excel para Microsoft 365 y Excel para la web; en otras versiones dan **#¡VALOR!**. Para Cotizaciones y Geografía, el español está entre los idiomas admitidos (inglés, español, francés, alemán, italiano y portugués). Los tipos de Wolfram dejaron de funcionar en junio de 2023: ya no se pueden crear ni actualizar, y los que había quedan sin conexión. [VERIFICADO: https://support.microsoft.com/en-us/excel/linked-data-types-faq-and-tips · CORREGIDO (Wolfram): https://support.microsoft.com/es-ES/Excel/excel-data-types-with-wolfram-end-of-support-faq]. HISTORIALCOTIZACIONES necesita conexión y puede dar #¡CONECTAR! u #OCUPADO (`work/funciones.json`).
- **Para la guía:** es un tema menor. Útil para una demostración (país → población), pero no para un trabajo serio de empresa: los datos son de un tercero y no son auditables.

### 1.6 Office Scripts y Power Automate (automatización «moderna»)

- **Requisitos para empresas:** Excel para la web, Windows (versión 2210 o posterior) o Mac. **OneDrive para la Empresa** con los vínculos «Personas de su organización» habilitados. Licencias Business, Business Premium, E1, E3, E5, A3, A5, F3 o ProPlus. Conexión a internet con las experiencias conectadas activadas. **En cuentas Personal y Familia, solo vista previa (Insider).** [VERIFICADO: https://learn.microsoft.com/en-us/office/dev/scripts/testing/platform-limits]
- **Límites:** 5 MB por petición y 5 millones de celdas por rango en la web. En Power Automate, 1.600 ejecuciones de «Ejecutar script» por usuario y día, 120 s de tiempo máximo y parámetros de hasta 28,6 MB. Desde Power Automate no se puede llamar a servicios externos (`fetch`). No admite libros Strict Open XML. En Teams solo funciona en la versión web. El administrador puede desactivarlo; se ve en la pestaña **Automatizar**. [VERIFICADO: misma página]
- **Novedades de 2026:** guardar y enviar como PDF (enero) y una interfaz rediseñada para encontrar, crear y compartir scripts (marzo). [VERIFICADO: blogs de enero y marzo de 2026]
- **Office Scripts frente a VBA:** VBA solo funciona en escritorio (Windows y Mac); en Excel para la web **no se pueden crear, ejecutar ni editar macros VBA**, aunque el libro se puede abrir y las macros se conservan [VERIFICADO: https://support.microsoft.com/en-us/office/work-with-vba-macros-in-excel-for-the-web-98784ad0-898c-43aa-a1da-4f0fb5014343]. Office Scripts (TypeScript) funciona en web y escritorio con libros en la nube, y se puede programar con Power Automate.
- **Para la guía (nivel alto):** grabar un script con «Grabar acciones», ejecutarlo y entender que vive en OneDrive, no dentro del libro. En Excel para Windows, las macros VBA de archivos descargados de internet o recibidos por correo se **bloquean por defecto**: en Microsoft 365, desde julio de 2022 en el Canal actual (versión 2206) y desde enero de 2023 en el Canal semestral. Sale un aviso de «riesgo de seguridad» sin botón para habilitar el contenido, y el archivo se desbloquea en Propiedades > General > Desbloquear. Esto no pasa en Mac, en la web ni en el móvil [CORREGIDO: https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked]. Los .xlsx de práctica de la guía **no deben llevar macros**.

### 1.7 Power Query por plataforma (Obtener y transformar datos)

| Capacidad | Windows (M365 y 2016+) | Mac (solo M365) | Web | iOS / Android |
|---|---|---|---|---|
| Editor de Power Query | Sí | Sí (Datos > Obtener datos (Power Query) > Iniciar el Editor de Power Query) | **Sí, GA desde enero de 2026** | **No** |
| Texto/CSV, libro de Excel, XML, JSON | Sí (JSON no en 2016) | Importar y actualizar | Desde archivos de SharePoint y OneDrive (organización) | — |
| PDF | Sí (M365) | No figura | Desde archivos de SharePoint | — |
| Carpeta local | Sí | Solo actualizar | No figura | — |
| Carpeta o lista de SharePoint | Sí (según edición) | Carpeta: solo actualizar · Lista: importar y actualizar | Sí (organización) | — |
| SQL Server | Sí | Solo actualizar | Usuario y contraseña | — |
| Web / API web | Sí | No figura | API web (usuario y contraseña) | — |
| Tabla o rango | Sí | Solo actualizar | Sí | — |
| Modelo de datos | Sí | No | **No se actualizan** las consultas cargadas en el Modelo de datos | — |
| Puerta de enlace local | Sí | — | **No** | — |

[VERIFICADO: https://support.microsoft.com/en-US/excel/power-query-data-sources-in-excel-versions · https://support.microsoft.com/en-us/excel/use-power-query-in-excel-for-the-web · blog de enero de 2026]. En la web hay que **activar las cookies de terceros**, y se admiten hasta 1.000 conexiones por usuario al actualizar. Ver y actualizar consultas está al alcance de cualquier suscriptor; editar tiene más funciones en los planes Business y Enterprise.

**Novedad de octubre de 2026:** la habilidad de Copilot «obtener datos» (web) crea la consulta de Power Query a partir de una descripción, y la consulta se puede revisar y actualizar. [VERIFICADO: blog de octubre de 2026]

> **Para la guía:** Power Query es la herramienta más rentable para quien lleva proyectos (limpiar exportaciones del ERP cada mes). Se enseña en **Windows**, que es la referencia. Hay que avisar de que en Mac faltan conectores y no hay Modelo de datos, y de que en la web funciona pero sin puerta de enlace ni Modelo de datos.

### 1.8 Power Pivot y Modelo de datos

- La página «Where is Power Pivot» se aplica a Excel para Microsoft 365, 2024, 2021, 2019 y 2016, **todas de Windows**. [VERIFICADO: https://support.microsoft.com/en-us/excel/where-is-power-pivot]. En Excel 2016 solo venía en algunas ediciones (Office Professional Plus 2016, que solo se vendía por licencias por volumen, y Excel 2016 independiente) [VERIFICADO: https://learn.microsoft.com/en-us/answers/questions/1209705/how-to-get-power-pivot-on-excel-2016]; en Microsoft 365 viene en todos los planes con aplicaciones de escritorio (Apps for business, Business Standard y Premium, Apps for enterprise, E3/E5) [VERIFICADO: https://learn.microsoft.com/en-us/office365/servicedescriptions/office-applications-service-description/office-applications-service-description]; que en 2019 venga en todas las ediciones de Windows [NO VERIFICABLE: no enseñarlo como dato].
- **En Mac no hay Power Pivot ni Modelo de datos** [VERIFICADO: https://support.microsoft.com/en-us/office/get-transform-and-power-pivot-in-excel-42d895c2-d1d7-41d0-88da-d1ed7ecc102d (solo la app de Windows tiene Power Query y Power Pivot completos) · https://learn.microsoft.com/en-us/answers/questions/5445256/excel-on-mac-data-model-features-are-not-supported], y Microsoft no ha dado fecha para traerlos [NO VERIFICABLE: no enseñarlo como dato]. Excel para la web puede usar libros con Modelo de datos, pero no crearlo ni actualizar consultas cargadas en él. [VERIFICADO (actualización): tabla de orígenes de datos]
- «Publicar en Power BI» desaparece de Excel en Office LTSC 2024. Ahora se importa el libro desde OneDrive o SharePoint al servicio de Power BI. [VERIFICADO: https://learn.microsoft.com/en-us/office/ltsc/2024/overview]

### 1.9 Compartir y coautoría (OneDrive y SharePoint)

- **Requisitos:** suscripción a Microsoft 365 («This feature is only available if you have a Microsoft 365 subscription»); formato `.xlsx`, `.xlsm` o `.xlsb` (**no** Strict Open XML); archivo en OneDrive, OneDrive para la Empresa o SharePoint Online (SharePoint local no sirve); **Autoguardado activado**. [VERIFICADO: página de coautoría]
- **Versiones que coeditan:** Microsoft 365 (Windows y Mac), web, Android, iOS y Excel Mobile. Office LTSC 2024 no incluye «real-time collaboration». [VERIFICADO: página de coautoría · https://learn.microsoft.com/en-us/office/ltsc/2024/overview]
- **Problemas habituales:** «archivo bloqueado» porque alguien lo ha abierto con un Excel que no coedita (basta con una persona); «Se recomienda actualizar» o «Error al cargar» cuando se usa una función que no admite coautoría; archivo de solo lectura; OneDrive en pausa; Vista protegida (hay que pulsar «Habilitar edición»). **Si dos personas cambian la misma celda, gana el último cambio guardado.** Revisar > **Mostrar cambios** (en la web) y **Historial de versiones** para recuperar una versión anterior. [VERIFICADO: misma página]
- Los «libros compartidos» antiguos son una función obsoleta: la UF0321 todavía la menciona, pero **no hay que enseñarla** (ver `curriculo.md`).

### 1.10 Excel para la web y para móvil

- **Web:** gratis con una cuenta Microsoft (con limitaciones) y completo con cualquier plan Microsoft 365. **Business Basic solo incluye la web y el móvil**, sin aplicaciones de escritorio [VERIFICADO: https://learn.microsoft.com/en-us/office365/servicedescriptions/office-applications-service-description/office-applications-service-description]. En la web hay Power Query completo (desde enero de 2026), Office Scripts, Python (empresas), Copilot (los tres modos) y matrices dinámicas. No hay Power Pivot (se pueden ver tablas y gráficos de Power Pivot, pero no crear modelos de datos), ni ejecución de VBA, ni creación de conexiones a datos externos fuera de Power Query, y las firmas digitales impiden abrir el libro. [VERIFICADO: https://support.microsoft.com/en-us/office/differences-between-using-a-workbook-in-the-browser-and-in-excel-f0dc28ed-b85d-4e1d-be6d-5878005db3b6 · https://learn.microsoft.com/en-us/office365/servicedescriptions/office-online-service-description/excel-online]
- **Móvil:** Copilot solo en modo chat en iPhone y Android; en iPad, edición en despliegue. No hay Power Query ni Python. Las casillas funcionan. [VERIFICADO: FAQ de Copilot, tabla de Power Query, disponibilidad de Python, blog de casillas]

---

## 2. Versiones: qué tiene cada una y qué se rompe

### 2.1 Tabla de funciones y herramientas por versión (Windows)

✓ = incluida · ✗ = no incluida · (M365) = solo con suscripción y al día

| Función o herramienta | 2016 | 2019 | 2021 / LTSC 2021 | 2024 / LTSC 2024 | Microsoft 365 (nov. 2026) |
|---|---|---|---|---|---|
| Tablas (Ctrl+T), tablas dinámicas, segmentaciones, formato condicional | ✓ | ✓ | ✓ | ✓ | ✓ |
| Power Query integrado (Obtener y transformar) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Power Pivot | según edición | ✓ | ✓ | ✓ | ✓ |
| BUSCARV, INDICE, COINCIDIR, SUMAR.SI.CONJUNTO, SI.ERROR | ✓ | ✓ | ✓ | ✓ | ✓ |
| SI.CONJUNTO, CAMBIAR, MAX.SI.CONJUNTO, MIN.SI.CONJUNTO, CONCAT, UNIRCADENAS | ✗ | ✓ | ✓ | ✓ | ✓ |
| **BUSCARX, COINCIDIRX, FILTRAR, ORDENAR, ORDENARPOR, UNICOS, SECUENCIA, MATRIZALEAT, LET**, matrices dinámicas | ✗ | ✗ | ✓ | ✓ | ✓ |
| LAMBDA, MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY, ISOMITTED | ✗ | ✗ | ✗ | ✓ | ✓ |
| DIVIDIRTEXTO, TEXTOANTES, TEXTODESPUES, APILARV, APILARH, ENCOL, ENFILA, AJUSTARFILAS, AJUSTARCOLS, TOMAR, EXCLUIR, ELEGIRCOLS, ELEGIRFILAS, EXPANDIR (las «14 de texto y matrices») | ✗ | ✗ | ✗ | ✓ | ✓ |
| IMAGEN, gráficos con matrices dinámicas | ✗ | ✗ | ✗ | ✓ | ✓ |
| Vistas de hoja | ✗ | ✗ | ✓ retail / ✗ LTSC 2021 | ✓ 2024 [VERIFICADO: https://support.microsoft.com/en-us/excel/create-and-manage-sheet-views-in-excel] / LTSC 2024 [NO VERIFICABLE: no enseñarlo como dato] | ✓ |
| AGRUPARPOR, PIVOTARPOR, PERCENTOF | ✗ | ✗ | ✗ | ✗ | ✓ |
| RECORTARRANGO, referencias `A:.A` | ✗ | ✗ | ✗ | ✗ | ✓ |
| REGEXPRUEBA, REGEXEXTRACCION, REGEXREEMPLAZAR | ✗ | ✗ | ✗ | ✗ | ✓ |
| TRADUCIR, DETECTARIDIOMA | ✗ | ✗ | ✗ | ✗ | ✓ |
| Casillas en celda | ✗ | ✗ | ✗ | ✗ | ✓ |
| Tipos de datos vinculados, HISTORIALCOTIZACIONES | ✗ | ✗ | ✗ | ✗ | ✓ |
| Python (PY), Copilot | ✗ | ✗ | ✗ | ✗ | ✓ (con licencia) |
| Coautoría en tiempo real | ✗ | ✗ | ✓ retail [VERIFICADO: https://support.microsoft.com/en-US/Excel/what-s-new-in-excel-2021-for-windows] / ✗ LTSC | ✗ LTSC («no real-time collaboration») | ✓ |
| Compatible con ODF | ODF 1.2 | 1.2 [CORREGIDO: https://support.microsoft.com/en-US/Excel/what-s-new-in-excel-2021-for-windows] | 1.3 [VERIFICADO: https://learn.microsoft.com/en-us/office/ltsc/2021/overview] | **ODF 1.4** | 1.4 |

Fuentes: [VERIFICADO: https://support.microsoft.com/office/faee26b6-ad74-40a8-9304-aa6db716553f (Excel 2024: matrices dinámicas en gráficos, 14 funciones de texto y matrices, IMAGEN, LAMBDA, ODF 1.4) · https://support.microsoft.com/en-US/Excel/what-s-new-in-excel-2021-for-windows (BUSCARX, matrices dinámicas, LET, COINCIDIRX, vistas de hoja no en LTSC 2021) · https://learn.microsoft.com/en-us/office/ltsc/2024/overview · versiones de cada función en `work/funciones.json`]. Los nombres ENFILA, AJUSTARCOLS y ELEGIRFILAS siguen el patrón de sus funciones gemelas: [VERIFICADO: https://support.microsoft.com/es-es/office/funciones-de-excel-por-orden-alfab%C3%A9tico-b3944572-255d-4efb-bb96-c6d90033e188] en es-ES (ENFILA = TOROW, AJUSTARCOLS = WRAPCOLS, ELEGIRFILAS = CHOOSEROWS).

**Mac:** Excel para Mac con Microsoft 365 tiene las mismas funciones de hoja, pero **no tiene Power Pivot ni Modelo de datos**, y Power Query va con menos conectores. Excel 2021 y 2024 para Mac siguen el mismo corte de funciones que en Windows [VERIFICADO: https://support.microsoft.com/en-us/excel/what-s-new-in-excel-2021-for-mac · https://support.microsoft.com/office/faee26b6-ad74-40a8-9304-aa6db716553f].

### 2.2 Qué pasa si un archivo moderno se abre en un Excel antiguo

| Situación | Lo que ve la persona con Excel 2016 o 2019 | Fuente |
|---|---|---|
| Celda con `=BUSCARX(...)` | La barra de fórmulas enseña `=_xlfn.XLOOKUP(...)` y la celda sigue mostrando el último valor guardado, incluso si se recalcula la hoja. **Al editar la celda y confirmarla** aparece **#¿NOMBRE?**. Quitar el `_xlfn.` no sirve: esa versión no conoce la función | [CORREGIDO: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/3d025add-118d-4413-9856-ab65712ec1b0 (las funciones nuevas se guardan con el prefijo `_xlfn.`) · https://techcommunity.microsoft.com/t5/excel/what-happens-to-new-formulae-let-ifs-etc-when-the-workbook-is/m-p/2135516 (conserva el resultado al recalcular y pasa a #¿NOMBRE? al editarla)] |
| `=FILTRAR(...)` o `=ORDENAR(...)` | Prefijo `_xlfn._xlws.`; el resto, igual | [VERIFICADO: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/3d025add-118d-4413-9856-ab65712ec1b0] |
| `=LET(x;...)` | `_xlfn.LET` y nombres internos con el prefijo `_xlpm.` | [VERIFICADO: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/3d025add-118d-4413-9856-ab65712ec1b0] |
| Una fórmula que se desborda con funciones clásicas, como `=A2:A10*2` | Se ve como una **fórmula matricial antigua `{=...}`** fija: no se redimensiona ni tiene borde de desbordamiento | [VERIFICADO: https://support.microsoft.com/en-us/excel/dynamic-array-formulas-in-non-dynamic-aware-excel] |
| Fórmulas antiguas abiertas en Microsoft 365 | A veces aparece un `@` (intersección implícita) delante de un rango o una función | [VERIFICADO de forma parcial: la misma página remite a «Implicit intersection operator: @»] |
| Tipos de datos vinculados | **#¡VALOR!** en esas celdas, y **#¿NOMBRE?** en las fórmulas que hacen referencia a ellos | [VERIFICADO: https://support.microsoft.com/es-es/excel/linked-data-types-faq-and-tips] |
| Casillas en celda | En versiones antiguas no se ven como casillas (se ve VERDADERO/FALSO) [NO VERIFICABLE: no enseñarlo como dato] | — |
| Python | Las celdas `PY` dan error al recalcular (también en móvil) | [VERIFICADO para móvil: página de disponibilidad de Python] |
| Libro abierto en un Excel que no coedita | Bloquea la coautoría de todos los demás | [VERIFICADO: página de coautoría] |

**Herramienta oficial:** Archivo > Información > Comprobar si hay problemas > **Comprobar compatibilidad**. Microsoft recomienda usarla antes de compartir y «avoid using functions and features that aren't available in that version». [VERIFICADO (recomendación): página de matrices dinámicas] [VERIFICADO: https://support.microsoft.com/es-ES/Office/collab-files/check-file-compatibility-with-earlier-versions]

### 2.3 Fin de soporte: calendario y qué significa

| Producto | Fin de soporte | Estado a 14/11/2026 | Fuente |
|---|---|---|---|
| Office 2016 y Office 2019 (todas las ediciones) | **14/10/2025** | Sin parches desde hace 13 meses | [VERIFICADO: https://support.microsoft.com/KB/5002369] |
| Windows 10 | 14/10/2025 | Sin soporte salvo ESU | [VERIFICADO: página de Windows 10 y Microsoft 365 Apps] |
| **Office 2021 y Office LTSC 2021** (también Visio y Project 2021) | **13/10/2026** | Sin parches desde hace un mes. Sin ESU [VERIFICADO: https://support.microsoft.com/en-us/office/system-requirements/end-of-support-for-office-2021] | [VERIFICADO: https://learn.microsoft.com/en-us/lifecycle/announcements/office-ltsc-2021-end-of-support (22/04/2026)] |
| Publisher (todas las versiones) | Octubre de 2026 | Retirado | [VERIFICADO: overview de LTSC 2024] |
| Microsoft 365 Apps en Windows 10 | Funciones nuevas hasta la **versión 2608**; seguridad hasta el **10/10/2028** | Congelado en 2608 | [VERIFICADO] |
| Office 2024 y Office LTSC 2024 | **09/10/2029** (5 años, sin soporte extendido) | Con soporte; **no recibe funciones nuevas** | [VERIFICADO: https://learn.microsoft.com/en-us/lifecycle/products/office-ltsc-2024 (extracto) y overview] |

**Qué implica para la alumna:**
1. Las aplicaciones sin soporte **siguen funcionando** («may continue to function»), pero sin parches de seguridad y, con el tiempo, con peor rendimiento. Microsoft también retira la mayor parte de la ayuda en línea de esas versiones. [VERIFICADO: KB5002369]
2. En una empresa que todavía use Office 2016, 2019 o 2021 en noviembre de 2026, lo más probable es que haya un cambio pendiente a Microsoft 365 o a LTSC 2024. Saber explicar qué se gana (BUSCARX, matrices dinámicas, coautoría) y qué se rompe es una habilidad con valor.
3. **Tamaño del problema (dato indirecto):** en la encuesta alemana de Intra2net de septiembre de 2026 a 103 empresas de 10 a 49 empleados **sin** Microsoft 365 Business ni Exchange Online (1.592 puestos), el 34 % usaba Office 2016, el 26 % Office 2019, el 15 % Office 2021 y el 7 % Office 2010 o 2013. Office 2024, la última versión de compra única, pasó del 8 % al 18 %. Desde el 13/10/2026, el 82 % se queda sin parches. Un año antes (septiembre de 2025, 104 empresas) las cifras eran 36 % (2016), 29 % (2019) y 12 % (2010/2013), y el 77 % se quedó sin parches. [CORREGIDO: https://www.intra2net.com/en/company/press/press-release.php_id=64.html (13/10/2026, con el gráfico «Statistik Microsoft Office Marktanteile 2026»); 2025: https://www.intra2net.com/en/company/press/press-release.php_id=61.html]. **No hay un dato equivalente para España**, pero sirve como aviso: en la pequeña empresa sin suscripción, Office 2016 y 2019 abundan.

---

## 3. Qué usan de verdad las empresas españolas

### 3.1 Datos oficiales (INE y Eurostat)

**INE, Encuesta TIC en empresas, año 2025 – primer trimestre de 2026 (datos definitivos, 22/10/2026)** [VERIFICADO: https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm, PDF leído]

| Indicador (empresas de 10 o más empleados) | Total | Industria | Construcción | Servicios |
|---|---|---|---|---|
| Compran cloud computing de pago | **39,4 %** | 37,5 | 32,9 | 41,9 |
| Usan inteligencia artificial | **33,6 %** | 29,1 | 22,6 | 38,2 |
| Tienen especialistas TIC | 15,4 % | 15,2 | 4,9 | 18,2 |
| Permiten el teletrabajo | 37,7 % (77,3 % en las de 250 o más) | | | |
| Usan ERP | 60,9 % | | | |
| Usan CRM | 33,9 % | | | |
| Hacen analítica de datos | 34,3 % | | | |

- Por comunidades, nube de pago: Cataluña 48,7 %, Madrid 48,0 %, Comunitat Valenciana 39,3 %, Andalucía 32,6 % y Galicia 29,9 %. IA: Cataluña 40,5 % y Madrid 40,1 %.
- **Empresas de menos de 10 empleados:** el 81,2 % tiene internet; de ellas, el **21,4 % usa IA** y el 25,1 % permite el teletrabajo.
- **Aviso metodológico:** desde 2025 se usa la CNAE-2025 y se incluyen la división 56 (hostelería y restauración) y el grupo 95.1, así que los datos **no son estrictamente comparables** con años anteriores. Eso explica el aparente descenso de la nube: **44,3 %** en el primer trimestre de 2025 [VERIFICADO: https://www.ine.es/dyngs/Prensa/ETICCE20241T2025.htm] frente a 39,4 % en 2026. El uso de IA casi se ha duplicado en un año (21,1 % → 33,6 %).
- **Eurostat 2025:** el 52,7 % de las empresas de la UE compra nube de pago. Entre ellas, el 71,7 % la usa para software de oficina (procesador de textos, hojas de cálculo). España, 41,7 %. [VERIFICADO: https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Cloud_computing_-_statistics_on_the_use_by_enterprises (datos extraídos en enero de 2026)]. En España, el 82,8 % de las empresas que compran nube la usan para software de oficina según Eurostat 2025; en la encuesta más reciente del INE (primer trimestre de 2026), el 80,3 % [CORREGIDO: el 82,8 % es de Eurostat (tabla isoc_cicce_use, España 2025), no del INE; dato del INE de 2026: https://www.ine.es/jaxi/Tabla.htm?tpx=82383&L=0].

**Lectura para la guía:** el ERP (61 %) es tan habitual como Excel, y Excel suele ser **donde acaban las exportaciones del ERP**. Eso refuerza Power Query y la limpieza de datos. Un tercio de las empresas ya usa IA, así que la alumna se encontrará con Copilot o ChatGPT en la oficina y hay que enseñarle a usarlos bien.

### 3.2 Microsoft 365 frente a Google Workspace y LibreOffice

- **No existe un dato público fiable** sobre la cuota de Microsoft 365 frente a Google Workspace en las empresas españolas (busqué en INE, ONTSI, CNMC y prensa). El estudio de la CNMC sobre la nube (aprobado el 21/07/2026 y publicado el 16/09/2026) se centra en IaaS y PaaS, no en SaaS: no mide suites ofimáticas. [VERIFICADO: https://www.cnmc.es/expedientes/ecnmc00123 y https://www.cnmc.es/sites/default/files/6794008.pdf]. Las cifras tipo «Google 50 %, Microsoft 45 %» que circulan no citan fuente ni país: **no usarlas.**
- **Lo que sí se puede afirmar:** en las ofertas de empleo españolas se pide «Excel», casi nunca «Google Sheets» (ver `curriculo.md`, muestra de Jooble). En startups y en algunas pymes de servicios se usa Google Workspace, y ahí la alumna tendrá Google Sheets [NO VERIFICABLE: no enseñarlo como dato].
- **Administración pública:**
  - **Junta de Andalucía:** protocolo con Microsoft (firmado el 13/03/2026 por la ADA y Microsoft Ibérica) para extender Microsoft 365 (Teams, SharePoint, OneDrive y **Copilot Chat**) a sus **44.500 empleados** de la Administración General antes de julio de 2027. En marzo de 2026 ya lo usaban 8.500. En julio de 2025 la ADA licitó un acuerdo marco de servicios y productos Microsoft (53,2 M€ según la prensa). [VERIFICADO: https://news.microsoft.com/source/emea/features/la-junta-de-andalucia-adoptara-microsoft-365-como-plataforma-de-trabajo-con-el-fin-de-impulsar-una-administracion-mas-colaborativa-segura-e-innovadora/?lang=es ; Europa Press en Última Hora, 13/03/2026 y 25/07/2025; anuncio oficial TED 449331-2025: https://ted.europa.eu/es/notice/-/detail/449331-2025]
  - **Xunta de Galicia:** «Plan de Migración do Posto de Traballo a Software Libre». La EGAP imparte en 2026 cursos de LibreOffice para personal autonómico, local, de justicia y universitario, por ejemplo el curso FC26158 de LibreOffice Writer (30 h, ediciones en mayo–junio y octubre–noviembre de 2026). [VERIFICADO: https://egap.xunta.gal/fichacurso/pdf/FC26158]
  - **Norma Técnica de Interoperabilidad, Catálogo de estándares** (BOE-A-2012-13501, sin modificaciones en el texto consolidado): formatos de ficheros «Admitidos»: **ODF** ISO/IEC 26300 (`.ods`), **Strict Open XML** ISO/IEC 29500 (`.xlsx`) y **CSV** (RFC 4180). [VERIFICADO: https://www.boe.es/buscar/pdf/2012/BOE-A-2012-13501-consolidado.pdf]. Ojo: la norma habla del Open XML **Strict**, que precisamente **no admite coautoría ni Copilot ni Office Scripts en Power Automate**.
- **Tendencia europea de «soberanía digital»:** Schleswig-Holstein (Alemania) decidió en abril de 2024 pasar a LibreOffice a unos 30.000 empleados de su administración; a finales de 2025 casi el 80 % de los puestos (sin contar Hacienda) ya estaban migrados, y no hay fecha oficial de cierre [CORREGIDO: https://heise.de/-11105459 (cita al Gobierno del Land, 04/12/2025)]; Euro-Office (Nextcloud, IONOS y otros socios europeos), primera versión estable el 09/06/2026 [VERIFICADO: https://nextcloud.com/blog/euro-office-general-availability-set-for-june-9/ y https://heise.de/-11322160]; Francia: la DINUM deja Windows por Linux en sus propios puestos, y cada ministerio debe presentar antes del otoño de 2026 un plan para reducir sus dependencias de fuera de Europa [CORREGIDO: https://www.numerique.gouv.fr/documents/261/CP_SouveraineteNumeriqueEtat.pdf (08/04/2026)]. LibreOffice 26.8 (26/08/2026) se presenta como suite «sin IA generativa» [VERIFICADO: https://blog.documentfoundation.org/blog/2026/08/26/libreoffice-26-8/]. **LibreOffice Calc tiene BUSCARX (XLOOKUP), COINCIDIRX (XMATCH) y LET desde la versión 24.8**, y también FILTRAR, ORDENAR, ORDENARPOR, UNICOS, SECUENCIA y MATRIZALEAT [VERIFICADO: https://help.libreoffice.org/latest/es/text/scalc/01/func_xlookup.html y https://wiki.documentfoundation.org/ReleaseNotes/24.8].

### 3.3 Escenarios que la alumna se va a encontrar (síntesis propia)

| Tipo de empresa | Excel probable en nov. 2026 | Consecuencia para la guía |
|---|---|---|
| Mediana o grande con Microsoft 365 (E3/E5, Business Standard o Premium) | Microsoft 365 Apps, MEC o Canal actual, versión 2606 o posterior | Camino moderno completo. Copilot según licencia (Basic o Premium) |
| Gran empresa con PC aún en Windows 10 | Microsoft 365 congelado en 2608 | Moderno, pero sin lo que salga después de agosto de 2026 |
| Pyme con licencias de compra única antiguas | Office 2016, 2019 o 2021 (sin soporte) | **Alternativas compatibles imprescindibles.** Nada de BUSCARX en 2016/2019 |
| Entorno regulado (banca, sanidad, industria) | Office LTSC 2024 (o 2021) | Sin coautoría ni Copilot. Sí BUSCARX, LAMBDA y DIVIDIRTEXTO |
| Microempresa o autónomo | Microsoft 365 Personal o Familia, Business Basic (solo web) o Google Sheets | Excel para la web, o equivalencias en Sheets |
| Administración autonómica en migración | LibreOffice Calc o Microsoft 365 | Formatos `.ods`/`.xlsx`, funciones clásicas |
| Escritorio remoto o Citrix (activación en equipo compartido) | Microsoft 365 sin Python | Sin Python en Excel |

---

## 4. Recomendaciones para la guía

### 4.1 Principio: «camino moderno + plan B compatible»

- **Camino principal:** Excel para Microsoft 365 en Windows, al día (Canal actual o MEC, versión 2606 o posterior). Es lo que tienen la mayoría de las empresas con suscripción y lo que se pide en las ofertas.
- **Siempre al lado, un «plan B»** para cuando el archivo va a otra versión o a otro programa. Regla que hay que enseñar desde el nivel 2: **«Antes de usar una función moderna, pregúntate quién va a abrir el archivo»**, y comprobarlo con Archivo > Cuenta y con Comprobar compatibilidad.
- **La estructura que sirve en todas las versiones es la Tabla de Excel (Ctrl+T)**, desde 2007. Sus referencias estructuradas (`Tabla1[Importe]`) crecen solas y sustituyen a casi todos los usos de RECORTARRANGO y de `A:.A`.

| Moderno (Microsoft 365 / 2021+) | Plan B compatible (2016 y otros programas) | Nota para la lección |
|---|---|---|
| `=BUSCARX(C2;Tarifa[Código];Tarifa[Precio];"No existe")` | `=SI.ERROR(INDICE(Tarifa[Precio];COINCIDIR(C2;Tarifa[Código];0));"No existe")` y `=BUSCARV(C2;Tarifa;3;FALSO)` | Enseñar las tres. INDICE+COINCIDIR funciona en todas las versiones, en LibreOffice y en Google Sheets |
| `=FILTRAR(Ventas;Ventas[Zona]="Norte";"Sin datos")` | Autofiltro, filtro avanzado o tabla dinámica con filtro | FILTRAR sin `si_vacío` y sin resultados da #¡CALC! |
| `=UNICOS(Ventas[Cliente])` | Datos > Quitar duplicados (sobre una copia) o tabla dinámica con el campo en filas | |
| `=ORDENAR(...)` / `=ORDENARPOR(...)` | Datos > Ordenar | |
| `=SI.CONJUNTO(...)` (2019+) | SI anidados, o BUSCARV aproximado con una tabla de tramos | Para tramos, lo mejor es una tabla de tramos con búsqueda aproximada |
| `=CAMBIAR(...)` (2019+) | BUSCARV exacto en una tabla auxiliar | |
| `=UNIRCADENAS(", ";VERDADERO;...)` (2019+) | `&` o CONCATENAR | |
| `=MAX.SI.CONJUNTO(...)` (2019+) | AGREGAR, o MAX(SI()) introducida como matriz con Ctrl+Mayús+Entrar | |
| `=AGRUPARPOR(...)` / `=PIVOTARPOR(...)` (solo M365) | **Tabla dinámica** + SUMAR.SI.CONJUNTO | La tabla dinámica es obligatoria en N3. AGRUPARPOR, como extra |
| `RECORTARRANGO` / `A:.A` (solo M365) | **Tabla (Ctrl+T)** con referencias estructuradas | |
| `REGEXEXTRACCION(...)` (solo M365) | Relleno rápido, Texto en columnas, Power Query (dividir columna, extraer) o EXTRAE+HALLAR | |
| `DIVIDIRTEXTO(...)` (2024+) | Datos > Texto en columnas o Power Query > Dividir columna | |
| `APILARV(...)` (2024+) | Power Query > Anexar consultas | |
| `LET(...)` (2021+) | Columnas auxiliares con nombre claro | Las columnas auxiliares también son más fáciles de revisar |
| `LAMBDA` (2024+) | Sin equivalente: fórmula repetida o macro | Nivel alto y opcional |
| Casillas en celda (solo M365) | Validación de datos con la lista `Sí;No` | |
| `TRADUCIR(...)` (solo M365) | Sin equivalente en Excel | Solo como curiosidad |
| `IMAGEN(...)` (2024+) | Insertar > Imágenes | |
| Copilot | Hacerlo a mano. Pedir ayuda a un chatbot **autorizado**, con datos ficticios | Ver 4.3 |

### 4.2 Detalles de idioma que la guía tiene que enseñar sí o sí

1. **El archivo guarda las fórmulas en inglés** y cada Excel las enseña en su idioma. Un libro hecho en es-ES funciona en un Excel en inglés. Lo que no funciona es **pegar** como texto una fórmula en inglés en un Excel en español. [VERIFICADO: https://learn.microsoft.com/en-us/office/vba/api/excel.range.formulalocal (una =SUM escrita en Excel en inglés se ve como =SUMME en el Excel alemán) y https://learn.microsoft.com/en-us/javascript/api/excel/excel.range (formulas, siempre en inglés, frente a formulasLocal, en el idioma y separadores del usuario)]
2. **Las fórmulas de internet y de ChatGPT o Claude suelen venir en inglés y con comas.** Hay que traducir los nombres (VLOOKUP → BUSCARV, XLOOKUP → BUSCARX, IF → SI, SUMIFS → SUMAR.SI.CONJUNTO) y cambiar `,` por `;` y `.` por `,` en los decimales. Herramienta: el complemento oficial **Traductor de funciones de Excel** (Functions Translator). [VERIFICADO que existe: https://support.microsoft.com/en-gb/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889]. Petición recomendada: «Dame la fórmula para Excel en español de España, con punto y coma como separador».
3. **Los errores, en español:** #¿NOMBRE?, #N/D, #¡VALOR!, #¡REF!, #¡DIV/0!, #¡NUM!, #¡NULO!, #¡DESBORDAMIENTO!, #¡CALC!, #¡CONECTAR!, #OCUPADO. Las páginas es-ES de Microsoft a veces los dejan en inglés (por ejemplo, la de COPILOT escribe `#NAME?`): **no copiarlos de ahí**. [Observación propia sobre la página es-ES de COPILOT; los nombres de los errores, según el corpus es-ES de la línea de funciones]
4. **Fechas:** un CSV con fechas MM/DD (de EE. UU.) se interpreta mal en es-ES. Power Query > Tipo de datos > «Usando configuración regional…». Esto es el origen de errores muy frecuentes con exportaciones de SaaS estadounidenses [conocimiento general].

### 4.3 Cómo enseñar la IA (Copilot, ChatGPT, Claude) de forma segura y comprobable

**A. El marco: qué dice la norma y qué dice la empresa**

- **Reglamento de IA, art. 4:** quien despliega IA (la empresa) debe adoptar medidas de alfabetización en IA para su personal. Aplica desde el 02/02/2025 y lo vigilan las autoridades nacionales desde el 02/08/2026. Desde el Digital Omnibus (julio de 2026) no se exige un nivel «suficiente», pero la obligación sigue. No hay certificado obligatorio. [VERIFICADO: https://digital-strategy.ec.europa.eu/es/policies/ai-talent-skills-and-literacy · preguntas frecuentes: https://digital-strategy.ec.europa.eu/es/faqs/ai-literacy-questions-answers]. **Para la guía:** un módulo de «IA en Excel» puede servir a la alumna como formación documentable dentro de esa obligación.
- **AEPD, decálogo para delegar en asistentes y agentes (27/10/2026):** permisos mínimos; confirmar antes de enviar, compartir o pagar; «el agente prepara y la persona aprueba»; desconfiar de las **instrucciones ocultas** en webs, correos y documentos; borrar la memoria con los controles del servicio; proteger los datos de terceros; **en el trabajo, usar solo los asistentes autorizados por la organización** y no conectar el correo o los documentos de trabajo a una cuenta personal de IA. [VERIFICADO: nota de prensa de la AEPD]
- **Política interna de IA generativa de la propia AEPD** (noviembre de 2025, resumen de enero de 2026), útil como modelo de política de empresa: prohibido usar IA no registrada en el inventario corporativo; **obligación de revisar y validar manualmente los resultados antes de usarlos o publicarlos**; no introducir información confidencial, no pública ni datos personales; contratar la versión empresarial; formar a los usuarios para analizar críticamente las respuestas y «no asumir que la información es correcta sin comprobarla»; no depender de la IA en decisiones críticas o urgentes. [VERIFICADO: https://www.aepd.es/guias/sumario-recomendaciones-iag-aepd.pdf]
- **Recomendaciones de la AEPD para usuarios de chatbots:** limitar los datos personales que se exponen, no dar datos de terceros y tener en cuenta que «no hay garantías de que la información proporcionada por el chatbot sea correcta». [VERIFICADO: https://www.aepd.es/documento/info-recomendaciones-chatbots-ia.pdf]
- **Microsoft, protección de datos empresariales (EDP):** con cuenta de trabajo, las peticiones y respuestas de Copilot y Copilot Chat se rigen por el DPA, **no se usan para entrenar los modelos base**, respetan permisos, etiquetas de confidencialidad, retención y auditoría. **Excepciones:** las búsquedas web (Bing) quedan fuera del DPA y del EU Data Boundary, y los modelos **Claude** están **fuera del EU Data Boundary**. [VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365/copilot/enterprise-data-protection (actualizada 04/11/2026)]. Los modelos de Anthropic «con retención de datos» (clase Mythos y algunos Fable) los guarda Anthropic hasta 30 días, y hasta 2 años si saltan sus filtros. Vienen apagados para todos. [VERIFICADO: https://learn.microsoft.com/en-us/microsoft-365/copilot/connect-to-ai-subprocessor]
- **Dato español de contexto:** según el Work Trend Index 2026 de Microsoft (2.000 encuestados en España que ya usan IA), el **86 % usa las respuestas de la IA como punto de partida, no como solución final**, y solo el **22 %** cree que su dirección tiene una estrategia clara de IA. [VERIFICADO: https://news.microsoft.com/source/emea/2026/07/ia-capacidades-profesionales-espanoles-2026/?lang=es (23/07/2026). Es un estudio de Microsoft]

**B. Semáforo de datos: qué se puede pegar en una IA (propuesta para la guía)**

| Color | Ejemplos | Dónde se puede usar |
|---|---|---|
| Verde | Datos inventados, datos públicos, la estructura de una tabla sin valores («tengo las columnas Fecha, Cliente e Importe») | Cualquier IA |
| Ámbar | Datos internos sin personas identificables: ventas por zona, costes, stock | **Solo en la herramienta corporativa autorizada**, con cuenta de trabajo y protección empresarial (Copilot con cuenta de la empresa) |
| Rojo | Datos personales (nombres, DNI/NIE, nóminas, salud, direcciones, IBAN), datos de clientes, contraseñas, información de cotizadas o fusiones | **Nunca** en una IA no autorizada. Ni siquiera en la autorizada sin permiso expreso. Seudonimizar (Cliente_001) o usar solo la estructura |

Base: RGPD art. 5.1.c (minimización) y las pautas de la AEPD citadas. [El semáforo es una propuesta propia; sus fundamentos están VERIFICADOS]

**C. Cinco riesgos concretos de la IA con fórmulas (para enseñar con ejemplos)**

1. **Nombres y separadores en inglés:** `=VLOOKUP(A2,B:C,2,FALSE)` en vez de `=BUSCARV(A2;B:C;2;FALSO)`.
2. **Funciones que tu Excel no tiene:** propone AGRUPARPOR o BUSCARX a quien tiene Excel 2016, o se inventa funciones que no existen.
3. **Rangos mal puestos:** referencias relativas que se desplazan al copiar (falta un `$`), rangos que no llegan a la última fila, encabezados incluidos en la suma.
4. **Errores silenciosos:** la fórmula devuelve un número verosímil pero equivocado (Microsoft lo reconoce). Por ejemplo, BUSCARV con coincidencia aproximada sobre datos sin ordenar, o un SUMAR.SI que no cuenta «Madrid » con un espacio al final.
5. **Valores pegados en lugar de fórmulas, o cambios no pedidos.** En modo editar, Copilot cambia el libro. Por eso: modo **Planificar** antes, revisar las celdas resaltadas y la pestaña verde, y deshacer o usar el Historial de versiones si algo sale mal. [VERIFICADO: blogs de abril y septiembre de 2026]
6. (Extra, nivel alto) **Instrucciones ocultas** en un archivo recibido (texto blanco, comentarios) que intentan dirigir al agente. Es la «inyección de instrucciones» de la que avisa la AEPD. [VERIFICADO el aviso: decálogo de la AEPD]

**D. Protocolo de verificación en 5 pasos (propuesta: «Pide, Lee, Prueba, Compara, Anota»)**

1. **Pide bien:** di la versión de Excel («Excel para Microsoft 365 en español de España» o «Excel 2016»), los nombres de las columnas, un ejemplo del resultado esperado y «con punto y coma». Pide la fórmula **y la explicación**.
2. **Lee:** ¿entiendes cada parte? Si no, pide que te la explique por partes o usa Fórmulas > **Evaluar fórmula**. Si no la puedes explicar, no la entregues.
3. **Prueba:** con 3–5 filas calculadas a mano o con calculadora, incluidos los casos raros: celda vacía, texto donde va un número, un duplicado, un código que no existe (#N/D).
4. **Compara:** cuadra el total por otro camino (una tabla dinámica frente a SUMAR.SI.CONJUNTO, o SUMA de la columna frente al total del ERP). Usa Rastrear precedentes y la Ventana Inspección.
5. **Anota:** en una hoja «Notas» o «Control», escribe qué se hizo con IA, qué herramienta, la fecha y cómo se comprobó. Eso facilita la auditoría y la alfabetización documentada.

**E. Plantillas de petición en español (para la guía)**

- Fórmula: «Trabajo con Excel para Microsoft 365 en español de España (separador punto y coma). Tengo una tabla llamada Ventas con las columnas Fecha, Comercial, Zona e Importe. Quiero el total de Importe del comercial de la celda H2 en el mes de la celda H3. Dame la fórmula, explícame cada parte y dime en qué casos podría fallar».
- Compatibilidad: «Esta fórmula la va a abrir una persona con Excel 2016. Dame una alternativa que funcione en esa versión: [fórmula]».
- Revisión: «Explícame qué hace esta fórmula paso a paso y dime si ves algún error: [fórmula]». Esta petición es útil **sin pegar datos**.
- Copilot (modo Planificar): «Antes de cambiar nada, dime el plan: quiero quitar espacios sobrantes en la columna Cliente y convertir a número la columna Importe. No borres nada».

**F. Qué enseñar en cada nivel (encaje con `curriculo.md`)**

- **N0–N1:** la IA como profesora particular. «Explícame qué es una referencia absoluta» o «ponme 3 ejercicios», con datos inventados. Nunca para hacer el ejercicio por ella.
- **N2:** pedir fórmulas y **comprobarlas** con el protocolo. Traducir fórmulas en inglés. Semáforo de datos.
- **N3:** Copilot en modo chat para explicar libros heredados; modo Planificar y Editar en tareas de limpieza; revisar los cambios (pestaña verde, historial de cambios); cuadrar totales.
- **N4 (autonomía en empresa):** saber qué permite la política de su empresa y qué licencia tiene (Basic o Premium). Reglas del libro y habilidades (cuando lleguen a GA). Riesgos de los agentes (instrucciones ocultas, permisos). Explicar a un jefe por qué un resultado de IA está comprobado.

### 4.4 Qué no prometer en la guía (cosas que cambian rápido)

- Nombres de botones de Copilot y nombres de modelos: en 2026 cambiaron cada 1–3 meses. Mejor capturas genéricas con «el icono de Copilot en la esquina inferior derecha» [VERIFICADO: la página es-ES de COPILOT describe ahí el icono].
- Funciones en Insider: listas y matrices en celda, IMPORTCSV, lienzo interactivo, tarjetas de error, reglas del libro.
- Precios y condiciones de licencias de Copilot.
- Que «Copilot está en Excel para todos»: depende de la licencia, del tamaño del inquilino, del país (Claude en la UE) y de la versión (Windows 10 congelado en 2608).

### 4.5 Implicaciones para la hoja de práctica en vivo (HyperFormula 3.5.0 esES)

Según la línea de funciones (`work/funciones.json`), HyperFormula 3.5.0 **no admite** casi ninguna función moderna: BUSCARX sí, pero COINCIDIRX, LET, LAMBDA, DIVIDIRTEXTO, AGRUPARPOR, REGEX, RECORTARRANGO e IMAGEN no. FILTRAR existe con el nombre FILTER. **Conclusión práctica:** la hoja en vivo sirve para la base compatible (lo que funciona en todas las versiones), y lo moderno se practica con los `.xlsx` descargables en Excel real, cada uno con una nota de la versión mínima que necesita.

---

## 5. Alertas (lo que no se puede olvidar)

1. **`=COPILOT()` está retirada** (14/09/2026). Si una fuente o un curso de 2025 la enseña, está desfasado.
2. **«Agent Mode» ya no se llama así:** ahora es «Editar con Copilot», con los modos Editar, Planificar y Chat. «App Skills» desapareció en febrero de 2026.
3. **El SAEC ya no va 6–12 meses por detrás** (unificación con el MEC en julio de 2026). Pero **Windows 10 congela Microsoft 365 en la versión 2608.**
4. **Office 2021 y LTSC 2021 sin soporte desde el 13/10/2026.** Muchos materiales hablan aún de 2016 y 2019 como si fueran actuales.
5. **Claude en Copilot viene apagado en las empresas de la UE y está fuera del EU Data Boundary.** Una alumna en España puede no ver el selector de Claude. Es normal, no un fallo.
6. **Microsoft desaconseja usar Copilot para decisiones financieras, legales o médicas** sin revisión. Hay que citarlo en la guía.
7. **El formato Strict Open XML** (el que menciona la norma estatal de interoperabilidad) **rompe la coautoría, Copilot y Office Scripts en Power Automate**. En la empresa se guarda como «Libro de Excel (.xlsx)» normal.
8. **Contradicción sobre la licencia de Copilot en Excel:** la FAQ dice que basta con un plan de empresa con Copilot Chat (acceso «Basic»), y MC1282571 habla de licencia «Premium». Depende de cada inquilino. La guía debe decir «puede que tu empresa lo tenga o no».
9. **Las páginas es-ES de Microsoft tienen erratas en nombres de funciones y errores** (por ejemplo, `#NAME?` en una página en español, o «PRUEBA DE REGEX»). Comprobar siempre en un Excel es-ES real antes de publicar.
10. **Atajo de Relleno rápido en es-ES sin aclarar** (las fuentes dan Ctrl+E y Ctrl+Mayús+E, y Ctrl+E también aparece como «seleccionar todo»). No publicarlo sin probarlo.
11. **No hay datos de cuota Microsoft 365 / Google Workspace en España.** Cualquier porcentaje que circule sin fuente, fuera.
12. **Los datos del INE de 2026 no son comparables con los de 2025** por el cambio a la CNAE-2025: no presentar la caída de la nube (44,3 % → 39,4 %) como una tendencia real.
13. **Python en Excel no funciona con activación en equipo compartido** (escritorios remotos y Citrix, habituales en empresas) ni en móvil.
14. **Power Pivot sigue sin existir en Mac.** Si la alumna usa Mac, el nivel de Modelo de datos y DAX necesita un PC con Windows o una máquina virtual.
15. **Una sola persona con un Excel antiguo bloquea la coautoría** de todos los demás.
16. **Fórmulas de IA en inglés y con comas** = el error número uno de las principiantes que usan ChatGPT con un Excel en español.

---

## 6. Fuentes consultadas (14/11/2026)

**Microsoft Learn / soporte (primarias)**
- Canales de actualización: https://learn.microsoft.com/en-us/microsoft-365-apps/updates/overview-update-channels (ms.date 27/05/2026)
- Unificación SAEC → MEC (MC1274325): https://learn.microsoft.com/en-us/microsoft-365-apps/updates/unified-update-channels (actualizada 18/08/2026)
- Windows 10 y Microsoft 365 Apps: https://learn.microsoft.com/en-us/microsoft-365-apps/end-of-support/windows-10-support (27/07/2026)
- Fin de soporte de Office 2016/2019: https://support.microsoft.com/KB/5002369
- Fin de soporte de Office LTSC 2021: https://learn.microsoft.com/en-us/lifecycle/announcements/office-ltsc-2021-end-of-support (22/04/2026)
- Ciclo de vida de Office LTSC 2024: https://learn.microsoft.com/en-us/lifecycle/products/office-ltsc-2024
- Overview de Office LTSC 2024: https://learn.microsoft.com/en-us/office/ltsc/2024/overview (22/01/2026)
- Novedades de Office 2024 y LTSC 2024: https://support.microsoft.com/topic/baadecbe-a8fc-4435-8cb8-70e93fd08b56
- Novedades de Excel 2024: https://support.microsoft.com/office/faee26b6-ad74-40a8-9304-aa6db716553f
- Novedades de Excel 2021: https://support.microsoft.com/en-US/Excel/what-s-new-in-excel-2021-for-windows
- Matrices dinámicas en Excel antiguo: https://support.microsoft.com/en-us/excel/dynamic-array-formulas-in-non-dynamic-aware-excel
- FAQ de Copilot en Excel: https://support.microsoft.com/en-us/Excel/copilot/frequently-asked-questions-about-copilot-in-excel
- FAQ de edición con Copilot: https://support.microsoft.com/en-gb/office/frequently-asked-questions-about-editing-with-copilot-in-excel-1cfd906d-40b4-46be-8e2d-65b893e28a02
- Limpiar datos con Copilot: https://support.microsoft.com/en-us/excel/copilot/clean-up-your-data-with-copilot-in-excel
- Función COPILOT (es-ES): https://support.microsoft.com/es-es/excel/functions/copilot-function
- Protección de datos empresariales: https://learn.microsoft.com/en-us/microsoft-365/copilot/enterprise-data-protection (actualizada 04/11/2026)
- Claude/Anthropic en Microsoft Online Services: https://learn.microsoft.com/en-us/microsoft-365/copilot/connect-to-ai-subprocessor (04/11/2026)
- Disponibilidad de Python en Excel: https://support.microsoft.com/en-us/office/python-in-excel-availability-781383e6-86b9-4156-84fb-93e786f7cab0
- Seguridad de Python en Excel: https://support.microsoft.com/en-us/excel/python/data-security-and-python-in-excel
- RECORTARRANGO: https://support.microsoft.com/en-us/excel/functions/trimrange-function
- Orígenes de Power Query por versión: https://support.microsoft.com/en-US/excel/power-query-data-sources-in-excel-versions
- Power Query en la web: https://support.microsoft.com/en-us/excel/use-power-query-in-excel-for-the-web
- Power Pivot: https://support.microsoft.com/en-us/excel/where-is-power-pivot
- Coautoría: https://support.microsoft.com/en-us/office/collaborate-on-excel-workbooks-at-the-same-time-with-co-authoring-7152aa8b-b791-414c-a3bb-3024e46fb104
- Límites de Office Scripts: https://learn.microsoft.com/en-us/office/dev/scripts/testing/platform-limits (actualizada 29/10/2025)
- Traductor de funciones: https://support.microsoft.com/en-gb/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889

**Blog oficial de Excel y Centro de mensajes**
- Novedades: ene. 2025 https://techcommunity.microsoft.com/blog/excelblog/whats-new-in-excel-january-2025/4357005 · ene. 2026 …/whats-new-in-excel-january-2026/4474246 · feb. 2026 …/whats-new-in-excel-february-2026/4496014 · mar. 2026 …/whats-new-in-excel-march-2026/4474247 · abr. 2026 …/whats-new-in-excel-april-2026/4502696 · jun. 2026 …/whats-new-in-excel-june-2026/4523402 · sep. 2026 …/whats-new-in-excel-september-2026/4549755 · oct. 2026 …/whats-new-in-excel-october-2026/4549758
- Agent Mode GA en escritorio (27/01/2026): https://techcommunity.microsoft.com/blog/excelblog/agent-mode-in-excel-is-now-generally-available-on-desktop/4457408
- Building Agent Mode / SpreadsheetBench (29/09/2025): https://techcommunity.microsoft.com/blog/excelblog/building-agent-mode-in-excel/4457320
- App Skills evoluciona (24/02/2026): https://techcommunity.microsoft.com/blog/ExcelBlog/app-skills-is-evolving-with-copilot-in-excel/4496577
- Historial de cambios (01/09/2026): https://techcommunity.microsoft.com/blog/excelblog/copilot-in-excel-bringing-clarity-to-collaborative-workbooks/4552007
- Beyond Analysis (12/10/2026): https://techcommunity.microsoft.com/blog/excelblog/beyond-analysis-copilot-gets-to-work-in-excel/4517581
- Varios valores en una celda (24/09/2026): https://techcommunity.microsoft.com/blog/excelblog/excel-now-supports-multiple-values-in-a-single-cell/4549756
- Casillas (actualizado 29/01/2026): https://techcommunity.microsoft.com/blog/excelblog/introducing-checkboxes-in-excel/4173561
- TRIMRANGE (28/08/2024): https://techcommunity.microsoft.com/blog/excelblog/announcing-trimrange-and-accompanying-trim-references/4230202
- REGEX (Insider): https://techcommunity.microsoft.com/blog/microsoft365insiderblog/new-regular-expression-regex-functions-in-excel/4226334
- MC1454373 (retirada de COPILOT): https://mc.merill.net/message/MC1454373 · MC1282571 (accesos a Copilot): https://mc.merill.net/message/MC1282571 · RM557564 (archivos locales): https://mc.merill.net/message/RM557564

**Organismos oficiales**
- INE, TIC en empresas 2025–T1 2026 (22/10/2026): https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm (PDF en `raw/ine/eticce2025.pdf`)
- INE, TIC en empresas 2024–T1 2025 (22/10/2025): https://www.ine.es/dyngs/Prensa/ETICCE20241T2025.htm
- BOE, NTI Catálogo de estándares: https://www.boe.es/buscar/pdf/2012/BOE-A-2012-13501-consolidado.pdf (en `raw/boe/`)
- Xunta / EGAP, curso FC26158: https://egap.xunta.gal/fichacurso/pdf/FC26158 (en `raw/xunta/`)
- AEPD, decálogo de agentes (27/10/2026): https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-aepd-publica-un-decalogo-para-delegar-tareas-en-asistentes
- AEPD, resumen de la política de IAG (enero de 2026): https://www.aepd.es/guias/sumario-recomendaciones-iag-aepd.pdf (en `raw/aepd/`)
- AEPD, chatbots: https://www.aepd.es/documento/info-recomendaciones-chatbots-ia.pdf
- Comisión Europea, alfabetización en IA (13/10/2026): https://digital-strategy.ec.europa.eu/es/policies/ai-talent-skills-and-literacy

**Secundarias (marcadas como SIN VERIFICAR en el texto)**
- Computerworld, Copilot Chat y el umbral de 2.000 puestos: https://www.computerworld.com/?p=4150022
- Office Watch, retirada de Copilot Chat de las apps (27/03/2026): https://office-watch.com/2026/microsoft-removes-copilot-chat-word-excel-powerpoint-april-2026/
- Europa Press / Última Hora, Junta de Andalucía (13/03/2026): https://www.ultimahora.es/noticias/comunidades/2026/03/13/2588301/junta-andalucia-extendera-microsoft-365-brindara-empleados-publicos-acceso-herramientas-ia.html
- ppc.land, CNMC y Eurostat: https://ppc.land/cnmc-finds-only-2-3-of-spanish-cloud-customers-switched-provider-in-three-years/
- Intra2net (vía heise y euro-security), Office en pymes alemanas: https://euro-security.de/en/77-of-small-businesses-will-no-longer-receive-security-updates-for-their-office-package/
- Microsoft Work Trend Index 2026, España: https://news.microsoft.com/source/emea/2026/07/ia-capacidades-profesionales-espanoles-2026/?lang=es
- StatCounter, Windows en España: https://gs.statcounter.com/windows-version-market-share/all/spain
