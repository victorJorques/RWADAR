# -*- coding: utf-8 -*-
"""
P1 · Escribe proyectos/p1.json y los .meta.json de los dos libros.

Todas las cifras salen de libros/src/p1-controles.json, que calcula p1_solucion.py
con pandas a partir de los datos de partida (nunca se escriben a ojo).
Orden: python3 p1_datos.py && python3 p1_solucion.py && python3 p1_proyecto.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
BASE = os.path.dirname(LIBROS)
C = json.load(open(os.path.join(AQUI, "p1-controles.json"), encoding="utf-8"))


def es(x, d=2):
    """Número en formato español: 73.831,07"""
    s = f"{x:,.{d}f}"
    return s.replace(",", "_").replace(".", ",").replace("_", ".")


T, CB, REP, ERR = C["total"], C["coste_base"], C["reparto"], C["errores"]
PUN, CAM, AMP, POR = C["puntuacion"], C["cambio_inesperado"], C["ampliaciones"], C["porque_reparto"]
r2 = lambda x: round(x + 1e-9, 2)

# Comprobaciones de diseño (research/proyectos.md, ficha P1): si el generador cambia, hay que revisar los textos
assert C["precios_numericos"] == 38 and C["mejor_unico"] == "Elecvía" and C["mejor_puntuacion"] == "Arnedo"
assert es(T["Elecvía"]) == "73.831,07" and es(REP["total"]) == "73.135,79" and es(C["ahorro_reparto"]) == "695,28"
assert es(PUN["Arnedo"]) == "92,38" and es(CAM["elecvia_unico"]) == "72.276,73" and es(CAM["reparto_mismo"]) == "72.545,99"

controles = [
    {"pregunta": "Precios que quedan como número en la columna de precios de «Normalizado» (lo que da CONTAR)",
     "respuesta": C["precios_numericos"], "tolerancia": 0,
     "pista": "Hay 40 líneas, pero Tormes no da precio del tubo («consultar») ni de las bridas (vacío): deben quedar 38 números. "
              "Si te sale 20, no has convertido nada; 30, solo los de Elecvía; 28, solo los de Tormes. Los textos se quedan "
              "alineados a la izquierda."},
    {"pregunta": "Precio base 2027 de Elecvía para la canaleta 40×60, en € por tramo y sin IVA (con 4 decimales)",
     "respuesta": round(C["base_elecvia_can40"], 4), "tolerancia": 0.00005,
     "pista": "2,36 € es el precio de un metro con IVA. Un tramo mide 2 m (factor 0,5) y después hay que quitar el IVA. "
              f"Si te sale {es(2.36 / 1.21, 4)}, has tomado el metro como si fuera un tramo; si {es(2.36 / 0.5, 4)}, falta quitar el IVA."},
    {"pregunta": "Coste base anual de Elecvía: cantidad × precio base de los 10 artículos, sin descuento ni portes (€)",
     "respuesta": r2(CB["Elecvía"]), "tolerancia": 0.05,
     "pista": f"Si te sale {es(ERR['elecvia_con_iva_base'])}, no has quitado el IVA; si {es(ERR['elecvia_redondeo2_base'])}, has "
              f"redondeado los precios a 2 decimales antes de multiplicar; si "
              f"{es(CB['Elecvía'] - ERR['canaleta_elecvia_bien'] + ERR['canaleta_elecvia_metro_como_tramo'])}, la canaleta va por metro y no por tramo."},
    {"pregunta": "Total anual de Elecvía como proveedor único, con descuento y portes (€)",
     "respuesta": r2(T["Elecvía"]), "tolerancia": 0.05,
     "pista": f"Descuento del 5 % porque la base supera 15.000 €, y portes del 2 % sobre el importe ya descontado. Si te sale "
              f"{es(ERR['elecvia_sin_descuento'])}, falta el descuento; si {es(ERR['elecvia_con_iva_total'])}, no has quitado el IVA; "
              f"si {es(ERR['elecvia_redondeo2_total'])}, has redondeado los precios antes de multiplicar."},
    {"pregunta": "Total anual de Yesa (€)",
     "respuesta": r2(T["Yesa"]), "tolerancia": 0.05,
     "pista": f"Su tarifa es de 2026: hay que subirla un 3 %. Si te sale {es(ERR['yesa_sin_subida'])}, falta la subida. "
              "El cable está en €/km: un kilómetro son 1.000 m."},
    {"pregunta": "Coste total del reparto: los 5 cables a Tormes y el resto a Elecvía, con portes y descuentos (€)",
     "respuesta": r2(REP["total"]), "tolerancia": 0.05,
     "pista": f"Tormes: {es(REP['tormes_base'])} € de cable + 12 envíos × 90 € = {es(REP['tormes_total'])} €. Elecvía: el resto "
              f"({es(REP['elecvia_base'])} €) sigue superando 15.000 €, así que mantiene el 5 % de descuento y paga el 2 % de portes."},
    {"pregunta": "Ahorro del reparto frente a comprar todo a Elecvía (€)",
     "respuesta": r2(C["ahorro_reparto"]), "tolerancia": 0.05,
     "pista": "Es la resta de los dos totales anteriores (Elecvía sola menos reparto). Si te sale negativo, revisa los "
              "portes de Tormes (son por envío, 12 al año) y el descuento de Elecvía en el reparto."},
    {"pregunta": "Puntuación ponderada de Arnedo (sobre 100, con 2 decimales)",
     "respuesta": r2(PUN["Arnedo"]), "tolerancia": 0.01,
     "pista": "Solo puntúan las ofertas completas (Tormes no). Precio = coste mínimo de las completas / su coste × 100; "
              "plazo = plazo mínimo de las completas / su plazo × 100; calidad = nota / 5 × 100; y después 60/25/15 %. "
              f"Si te sale {es(ERR['arnedo_puntuacion_con_tormes'])}, has metido a Tormes en los mínimos."},
]

pasos = [
    {"titulo": "1. Preguntar antes de empezar",
     "md": "Lee el correo de Andrés y escribe (arriba, en «Antes de abrir Excel») lo que le preguntarías. Después abre «Lo que te contestan»: "
           "esas respuestas son las reglas del cálculo. Tiempo orientativo: 10 minutos.",
     "pista": "¿Qué te haría falta para poder sumar? «Más barato», ¿con o sin IVA? ¿Con portes? ¿Qué cantidades? ¿Cuenta algo más que el "
              "precio? ¿Repartir entre cuántos? ¿Siguen valiendo los precios en 2027?"},
    {"titulo": "2. No tocar el original",
     "md": "Guarda el libro como `P1_Ofertas_2027_v01.xlsx`. Copia la hoja «Ofertas» y llama a la copia «Normalizado». A partir de aquí "
           "trabajas solo en la copia: si te equivocas, el original sigue ahí.",
     "pista": "Clic derecho en la pestaña «Ofertas» > **Mover o copiar** > marca **Crear una copia** > Aceptar. Doble clic en la pestaña "
              "nueva para cambiarle el nombre."},
    {"titulo": "3. Poner el código a cada línea",
     "md": "En «Normalizado», inserta una columna C con el título «Código» (a la derecha de la descripción). Escribe en cada una de las 40 "
           "líneas el código de «Consumo 2027» que le corresponde. Cada proveedor llama a lo mismo de una forma distinta y en otro orden. "
           "Quita también las filas de condiciones de debajo de la tabla: no son datos (sus cifras irán a «Parámetros»).",
     "pista": "Clic derecho en la letra de la columna C > **Insertar**. Son 40 filas: a mano está bien. Para comprobarlo, en una celda "
              "libre: `=CONTAR.SI(C2:C41;\"CAJ-100\")` debe dar 4, y lo mismo con cada código."},
    {"titulo": "4. Convertir los precios en números",
     "md": "La columna D (precios) mezcla números, textos con «€» (Elecvía) y textos con punto decimal (Tormes). Conviértelos en números "
           "**solo en esa columna**. «consultar» y la celda vacía no son precios: déjalos como están.",
     "pista": "Selecciona la columna D > [[Ctrl]]+[[L]] (Reemplazar): busca ` €` (espacio y euro) y reemplaza por nada > **Reemplazar todos**. "
              "Repite buscando `.` y reemplazando por `,`. Un número se alinea a la derecha; un texto, a la izquierda. "
              "Comprueba: `=CONTAR(D2:D41)` debe dar 38."},
    {"titulo": "5. Hoja «Parámetros» con nombres",
     "md": "Crea la hoja «Parámetros» y escribe cada cifra que puede cambiar, en su celda: IVA 21 %, descuento de Elecvía 5 %, umbral "
           "15.000 €, portes de Elecvía 2 %, portes de Tormes 90 €, 12 envíos al año, subida de Yesa 3 %, pesos 60/25/15 %, mínimo por "
           "proveedor 3.000 € y máximo 2 proveedores. Ponle **nombre** a cada celda (por ejemplo `TipoIVA`, `DtoElecvia`) y rellénalas de "
           "amarillo claro: es el color de «esto se puede cambiar».",
     "pista": "Selecciona la celda, escribe el nombre en el **cuadro de nombres** (a la izquierda de la barra de fórmulas) y pulsa [[Intro]]. "
              "O bien Fórmulas > Nombres definidos > **Asignar nombre**. Los ves todos con [[Ctrl]]+[[F3]]. Los nombres no llevan espacios."},
    {"titulo": "6. Precio por unidad base y sin IVA",
     "md": "En «Normalizado», añade columnas: **Factor** (cuántas unidades base hay en la unidad de la oferta), **IVA incluido** (Sí/No), "
           "**Subida 2027** y **Precio base**. Factores: rollo de 100 m = 100; bobina de 500 m = 500; km = 1.000; caja de 25 = 25; "
           "metro de canaleta = 0,5 (un tramo son 2 m); el resto, 1. Una sola fórmula por columna, copiada hacia abajo.",
     "pista": "Antes de la fórmula, dilo en llano: «precio entre factor; si lleva IVA, entre 1,21; si es Yesa, por 1,03». Con los factores "
              "en una tablita «Unidades» de Parámetros: `=BUSCARV(E2;Unidades;2;FALSO)`. Precio base: "
              "`=SI(ESNUMERO(D2);D2/G2/SI(H2=\"Sí\";1+TipoIVA;1)*(1+I2);\"\")`. Comprueba: Elecvía, cable RZ1-K 3G2,5 → 1,06 €/m."},
    {"titulo": "7. Matriz artículos × proveedores",
     "md": "Crea la hoja «Comparativa»: los 10 artículos en filas (código, descripción, unidad y cantidad, enlazados a «Consumo 2027») y los "
           "4 proveedores en columnas (F a I, con el nombre en la fila 4); la columna E, para contar cuántas ofertas tiene cada artículo. En cada cruce, el precio base. Si un proveedor no oferta un "
           "artículo, la celda debe quedar **vacía**, no a 0.",
     "pista": "`=SI(CONTAR.SI.CONJUNTO(Normalizado!$C$2:$C$41;$A5;Normalizado!$A$2:$A$41;F$4;Normalizado!$J$2:$J$41;\">0\")=0;\"\";"
              "SUMAR.SI.CONJUNTO(Normalizado!$J$2:$J$41;Normalizado!$C$2:$C$41;$A5;Normalizado!$A$2:$A$41;F$4))`. Fíjate en los $: la "
              "columna A y la fila 4 quedan fijas para poder copiarla en las dos direcciones. Muestra 4 decimales."},
    {"titulo": "8. Coste anual con referencias mixtas",
     "md": "Al lado de la matriz de precios (columnas N a Q), calcula el coste anual de cada artículo con cada proveedor: cantidad × precio "
           "base. Escribe la fórmula una vez y cópiala a todo el bloque. Suma cada columna.",
     "pista": "En N5: `=SI(F5=\"\";\"\";$D5*F5)`. El $ delante de la D fija la columna de cantidades; la fila queda libre. Cópiala a N5:Q14 "
              "y comprueba una celda al azar a mano."},
    {"titulo": "9. Totales por proveedor",
     "md": "Debajo, para cada proveedor: artículos ofertados, artículos sin oferta, estado («Completa» u «Oferta incompleta»), coste base, "
           "descuento, portes y total anual. Usa los nombres de «Parámetros», nunca 15000 ni 1,21 dentro de una fórmula.",
     "pista": "En la solución, la fila 19 cuenta los artículos sin oferta y la 21 es el coste base. Sin oferta: `=CONTAR.BLANCO(F5:F14)`. Estado: `=SI(F19>0;\"Oferta incompleta\";\"Completa\")`. Descuento de Elecvía: "
              "`=SI(G21>UmbralElecvia;-G21*DtoElecvia;0)`. Portes de Elecvía: `=(G21+G22)*PortesElecvia`. Tormes: "
              "`=SI(H21>0;PortesTormes*EnviosTormes;0)`. Arnedo y Yesa: portes pagados (0)."},
    {"titulo": "10. El más barato de cada artículo",
     "md": "Añade el precio mínimo de cada fila, el proveedor que lo da y una marca si hay empate. Resalta el mínimo de cada fila con "
           "formato condicional (verde y negrita, para que no dependa solo del color). Mira con lupa la caja CAJ-100 y la canaleta 40×60.",
     "pista": "`=MIN(F5:I5)` y `=INDICE($F$4:$I$4;COINCIDIR(J5;F5:I5;0))`. Empate: `=SI(CONTAR.SI(F5:I5;J5)>1;\"Empate\";\"\")`. "
              "Formato: selecciona F5:I14 > Inicio > Formato condicional > Nueva regla > «Utilice una fórmula que determine las celdas "
              "para aplicar formato» > `=F5=MIN($F5:$I5)`. El $ delante de las letras fija las columnas F a I; la fila va sin $ para que cada fila se compare consigo misma."},
    {"titulo": "11. Escenario de reparto",
     "md": "Prueba el reparto «cables a Tormes y el resto a Elecvía»: una columna «Asignado a» (celdas amarillas, con una lista desplegable "
           "de proveedores) y el coste de cada artículo con el proveedor elegido. Resume por proveedor: base, descuento, portes y total. "
           "Comprueba las condiciones de Andrés: como máximo 2 proveedores, al menos 3.000 € a cada uno y que Elecvía mantiene el descuento.",
     "pista": "Coste asignado: `=SI.ERROR(INDICE($N5:$Q5;COINCIDIR(D31;$N$4:$Q$4;0));\"\")`. Base de cada proveedor: "
              "`=SUMAR.SI($D$31:$D$40;F$42;$E$31:$E$40)`. Lista: Datos > Validación de datos > Lista, origen `=$F$4:$I$4`."},
    {"titulo": "12. Puntuación ponderada",
     "md": "Puntúa solo a los proveedores con oferta completa. Precio = coste mínimo / su coste × 100; plazo = plazo mínimo / su plazo × 100; "
           "calidad = nota / 5 × 100 (de «Incidencias 2026»). Los mínimos, también solo entre las ofertas completas. Total con los pesos.",
     "pista": "Pon los tres pesos en celdas seguidas de «Parámetros» y dales un nombre al rango (`Pesos`). Total: "
              "`=SUMAPRODUCTO(Pesos;F62:F64)`, con los tres puntos en la misma columna y en el mismo orden que los pesos."},
    {"titulo": "13. Gráfico",
     "md": "Gráfico de barras horizontales con el coste anual de cada opción (reparto, Elecvía, Arnedo y Yesa), ordenado de la más barata "
           "(arriba) a la más cara, con etiquetas en € y el eje desde 0. Nada de 3D ni de gráfico circular.",
     "pista": "Ordena antes la tabla de opciones (o hazla con K.ESIMO.MENOR). Insertar > Gráficos > Insertar gráfico de columnas o de "
              "barras > Barra agrupada. Para que la más barata salga arriba: formato del eje vertical > «Categorías en orden inverso». "
              "Añade texto alternativo (clic derecho > Ver texto alternativo)."},
    {"titulo": "14. Informe de una página y PDF",
     "md": "Hoja «Informe»: tabla resumen, gráfico, conclusiones en 3 líneas, propuesta y supuestos al pie. Una sola página en horizontal, con "
           "encabezado «Compras · Ofertas 2027» y la fecha en el pie. Expórtala a `P1_Ofertas_2027.pdf`.",
     "pista": "Disposición de página (en la ayuda de Microsoft a veces sale como «Diseño de página») > Orientación > Horizontal; grupo "
              "Ajustar área de impresión: Ancho 1 página y Alto 1 página. Archivo > Exportar > Crear documento PDF/XPS, con la hoja "
              "«Informe» activa. Mira la vista previa antes de enviar."},
    {"titulo": "15. Controles, Léame y correo",
     "md": "Hoja «Controles»: cada comprobación con valor esperado, obtenido, diferencia, tolerancia y estado (VERDADERO/FALSO), y un control "
           "maestro que diga si todo cuadra; repítelo arriba del Informe. Hoja «Léame»: para qué sirve, de dónde salen los datos, supuestos y "
           "cómo se actualiza. Por último, escribe el correo de entrega.",
     "pista": "Controles útiles: 40 líneas en Normalizado; 38 precios numéricos; cada código 4 veces; misma suma de cantidades que «Consumo "
              "2027»; coste por dos caminos (`=SUMAPRODUCTO(D5:D14;F5:F14)` frente a la suma de la matriz). Estado: "
              "`=ABS(E5)<=F5`. Maestro: `=Y(G5:G18)`."},
]

rubrica = [
    {"criterio": "Exactitud", "niveles": [
        "En desarrollo: compara precios en unidades distintas o con el IVA mezclado; los totales no cuadran.",
        "Aceptable: normaliza las unidades, pero se le escapa el IVA de Elecvía, el descuento o la subida de Yesa.",
        "Bien: los tres totales de proveedor único, el reparto y la puntuación coinciden con los totales de control.",
        "Excelente: además, explica el empate de CAJ-100 y el casi empate de la canaleta 40×60, y comprueba que el reparto es el mejor posible."]},
    {"criterio": "Estructura", "niveles": [
        "En desarrollo: todo en una hoja, original modificado y números escritos dentro de las fórmulas.",
        "Aceptable: hay hoja de parámetros, pero algún valor fijo (15000, 1,21) sigue dentro de las fórmulas.",
        "Bien: parámetros con nombre, original intacto, una fórmula por columna y matriz con referencias mixtas.",
        "Excelente: además, Léame claro, colores con significado (amarillo = entrada) y una hoja de controles que se entiende sola."]},
    {"criterio": "Automatización y mantenimiento", "niveles": [
        "En desarrollo: cambiar un descuento obliga a rehacer fórmulas a mano.",
        "Aceptable: cambiar una condición exige tocar varias celdas repartidas por el libro.",
        "Bien: un cambio de condiciones se hace solo en «Parámetros» y todo (también el informe) se recalcula.",
        "Excelente: además, el libro avisa solo si una oferta está incompleta, si un reparto incumple el mínimo o si un control falla."]},
    {"criterio": "Presentación", "niveles": [
        "En desarrollo: tabla sin formato de €, gráfico 3D o circular, o el informe no cabe.",
        "Aceptable: legible, pero en 2 páginas, sin ordenar o con el eje del gráfico cortado.",
        "Bien: una página con tabla, gráfico de barras ordenado, conclusiones y supuestos; formatos de € correctos.",
        "Excelente: además, mínimos resaltados de forma accesible (color y negrita o símbolo), texto alternativo en el gráfico y lo importante primero."]},
    {"criterio": "Comunicación", "niveles": [
        "En desarrollo: entrega sin preguntar nada ni explicar las cifras.",
        "Aceptable: pregunta solo por el IVA; el correo da cifras sin interpretarlas.",
        "Bien: pregunta por el criterio, las cantidades, el reparto y la validez; correo breve con cifras clave, conclusiones y supuestos.",
        "Excelente: además, plantea la decisión (ahorro frente a sencillez, plazo y calidad), avisa de los límites (Tormes incompleta) y deja decidir a Andrés."]},
]

d_ahorro = es(C["ahorro_reparto"])
solucion = f"""### 1. Lo que se pacta antes de empezar
Coste **anual** de 2027, **sin IVA**, con descuentos y portes (sin pronto pago); cantidades de «Consumo 2027»; Yesa sube un 3 %; Tormes hace 12 envíos; reparto con 2 proveedores como máximo y 3.000 € como mínimo a cada uno; puntuación 60/25/15 %.

### 2. Limpieza (hoja «Normalizado»)
- Copia de «Ofertas» con una columna **Código** puesta a mano (cada código, 4 veces) y sin las filas de condiciones.
- Precios: [[Ctrl]]+[[L]] solo en la columna D: ` €` → nada y `.` → `,`. Quedan **38 números**: Tormes no oferta el tubo («consultar») ni las bridas (vacío).
- **Factor** con `=BUSCARV(E2;Unidades;2;FALSO)` (rollo 100, bobina 500, km 1.000, caja 25, metro de canaleta 0,5, resto 1).
- **Precio base**: `=SI(ESNUMERO(D2);D2/G2/SI(H2="Sí";1+TipoIVA;1)*(1+I2);"")`.

| Comprobación | Elecvía | Tormes | Yesa |
|---|---|---|---|
| Cable RZ1-K 3G2,5 (€/m) | {es(C['base_elecvia_cab_rz1k_3g25'], 4)} | {es(C['base_tormes_cab_rz1k_3g25'], 4)} | {es(C['base_yesa_cab_rz1k_3g25'], 4)} |

### 3. Comparativa
- Matriz 10 × 4 de precios base con `SUMAR.SI.CONJUNTO` y celda vacía si no hay oferta (`CONTAR.SI.CONJUNTO(...)=0`); costes con `=SI(F5="";"";$D5*F5)`.
- Más barato por artículo: Tormes en los 5 cables y en la canaleta 40×60; Elecvía en la canaleta 60×100, el tubo y las bridas; **empate** Elecvía-Tormes en CAJ-100 (0,84 € los dos: `COINCIDIR` devuelve el primero, por eso hace falta la columna «Empate»).
- **Casi empate** en CAN-40X60: Tormes 3,9000 € y Elecvía 3,9008 €. Con 2 decimales los dos se ven «3,90 €», pero no es un empate: muestra 4 decimales.

| Proveedor único | Coste base | Descuento | Portes | **Total anual** |
|---|---|---|---|---|
| Elecvía | {es(CB['Elecvía'])} € | {es(C['elecvia_descuento'])} € | {es(C['elecvia_portes'])} € | **{es(T['Elecvía'])} €** |
| Arnedo | {es(CB['Arnedo'])} € | 0,00 € | 0,00 € | **{es(T['Arnedo'])} €** |
| Yesa | {es(CB['Yesa'])} € | 0,00 € | 0,00 € | **{es(T['Yesa'])} €** |
| Tormes (incompleta: 8 de 10) | {es(CB['Tormes'])} € | 0,00 € | {es(C['tormes_portes'])} € | {es(T['Tormes'])} € (no comparable) |

### 4. Reparto
Cables a Tormes: {es(REP['tormes_base'])} € + {es(REP['tormes_portes'])} € de portes = {es(REP['tormes_total'])} €. Resto a Elecvía: {es(REP['elecvia_base'])} € − {es(-REP['elecvia_dto'])} € de descuento (sigue por encima de 15.000 €) + {es(REP['elecvia_portes'])} € de portes = {es(REP['elecvia_total'])} €. **Total {es(REP['total'])} €**: ahorra **{d_ahorro} €** ({es(C['ahorro_pct'], 1)} %) frente a Elecvía sola. Cumple las condiciones: 2 proveedores y más de 3.000 € cada uno.

¿Por qué es el mejor reparto? Con descuento y portes, cada euro de Elecvía cuesta 0,95 × 1,02 = {es(POR['coef_elecvia'], 3)} €. Los cables de Elecvía saldrían por {es(POR['cables_elecvia_efectivo'])} €; en Tormes, {es(POR['cables_tormes_con_portes'])} € con portes. En los demás artículos gana Elecvía. Una búsqueda de todas las combinaciones posibles lo confirma.

### 5. Puntuación (solo ofertas completas)
Precio = coste mínimo / coste × 100; plazo = plazo mínimo (3 días, Arnedo) / plazo × 100; calidad = nota / 5 × 100; total `=SUMAPRODUCTO(Pesos;F62:F64)`. Resultado: **Arnedo {es(PUN['Arnedo'])}** · Elecvía {es(PUN['Elecvía'])} · Yesa {es(PUN['Yesa'])}. Tormes no puntúa.

### 6. Informe, controles y conclusión
- Informe de una página: tabla ordenada con `K.ESIMO.MENOR`, gráfico de barras ordenado desde 0, conclusiones con fórmulas (cambian solas si cambian los parámetros) y supuestos. Encima, «Controles: OK».
- Controles: 14 comprobaciones (líneas, precios numéricos, códigos, factores, cuadre por dos caminos, reparto, pesos) y control maestro `=Y(G5:G18)`.
- Conclusión defendible: Elecvía es la más barata como proveedor único; repartir con Tormes ahorra solo {d_ahorro} € al año a cambio de llevar dos proveedores, aunque Tormes tiene el mejor plazo (2 días) y la mejor calidad (5); si se pondera plazo y calidad, gana Arnedo. Decide Andrés conociendo el ahorro y el riesgo.

El libro resuelto tiene además la hoja «Cómo se hizo» con los pasos manuales (copiar la hoja, reemplazar, formato condicional, gráfico, página y PDF)."""

proyecto = {
    "id": "p1",
    "titulo": "Comparativa de ofertas de proveedores",
    "departamento": "Compras y almacén",
    "nivel_requerido": "n2",
    "horas": 4,
    "resumen": "Normalizar cuatro ofertas que llegan cada una a su manera, calcular el coste anual de 2027 y recomendar un proveedor o un reparto en una página.",
    "habilidades": ["Limpieza de datos", "Conversión de unidades", "Nombres definidos", "Referencias mixtas", "SUMAR.SI.CONJUNTO",
                    "INDICE + COINCIDIR", "SI", "CONTAR.BLANCO", "SUMAPRODUCTO", "Formato condicional con fórmula",
                    "Gráfico de barras", "Configurar página y PDF"],
    "correo": {
        "de": "Andrés Molina (Jefe de compras y almacén)",
        "para": "ti",
        "asunto": "Ofertas cable y canaleta 2027",
        "cuerpo": "Hola:\n\nTe paso las cuatro ofertas que nos han mandado para el pedido anual de cable, canaleta y pequeño material de 2027. "
                  "Las he copiado en una hoja tal cual venían (PDF, correo y lo que me dictó por teléfono el comercial de Tormes).\n\n"
                  "Necesito saber quién nos sale más barato y si merece la pena repartir el pedido entre dos. Cada uno lo pone a su manera, "
                  "así que ojo.\n\nEl jueves tengo reunión con Carmen y quiero llevar algo claro, de una página.\n\nGracias,\nAndrés\n\n"
                  "Lunes 16/11/2026"},
    "preguntas_previas": {
        "pregunta": "Antes de abrir Excel, escribe el correo con las preguntas que le harías a Andrés. ¿Qué te falta saber para poder comparar y sumar?",
        "modelo": "Hola, Andrés:\n\nAntes de empezar, unas dudas para no comparar cosas distintas:\n"
                  "1. «Más barato»: ¿precio unitario o coste total del año? ¿Con o sin IVA? ¿Cuento portes, descuentos y pronto pago?\n"
                  "2. ¿Qué cantidades uso para el año?\n"
                  "3. ¿Cuenta solo el precio o también el plazo de entrega y la calidad? Si cuentan, ¿con qué peso?\n"
                  "4. Repartir: ¿entre cuántos proveedores como máximo y con alguna condición (un mínimo por proveedor)?\n"
                  "5. La oferta de Yesa vale hasta el 31/12/2026: ¿sabemos el precio para 2027?\n"
                  "6. Tormes no da precio del tubo ni de las bridas: ¿lo pedimos o lo trato como «sin oferta»? ¿Cuántos envíos al año nos haría?\n"
                  "7. ¿Qué te entrego (PDF, Excel) y para cuándo exactamente?\n\nGracias.",
        "criterios": ["Pregunta qué significa «más barato»: coste anual, con o sin IVA, con portes y descuentos",
                      "Pregunta qué cantidades usar",
                      "Pregunta si cuentan el plazo y la calidad, y con qué peso",
                      "Pregunta las condiciones del reparto (cuántos proveedores y mínimo por proveedor)",
                      "Detecta la validez de Yesa y los precios que faltan de Tormes, y pregunta qué entregar y cuándo"]},
    "aclaraciones": [
        {"pregunta": "¿«Más barato» es el precio unitario o el coste total del año? ¿Con o sin IVA? ¿Con portes y descuentos?",
         "respuesta": "Coste total anual sin IVA (el IVA lo recuperamos), con portes y descuentos. El pronto pago no cuenta: pagamos siempre a 60 días."},
        {"pregunta": "¿Qué cantidades uso?", "respuesta": "Las de la hoja «Consumo 2027», que ha preparado el almacén."},
        {"pregunta": "¿Cuenta solo el precio o también el plazo y la calidad? ¿Con qué peso?",
         "respuesta": "Precio 60 %, plazo de entrega 25 % y calidad 15 % (la nota de 1 a 5 de la hoja «Incidencias 2026»)."},
        {"pregunta": "«Repartir»: ¿entre cuántos y con qué condiciones?",
         "respuesta": "Como máximo dos proveedores, y al menos 3.000 € al año a cada uno."},
        {"pregunta": "La oferta de Yesa dice «válidos hasta el 31/12/2026».",
         "respuesta": "Yesa ha confirmado que en 2027 sube un 3 %. Las demás mantienen precio."},
        {"pregunta": "Tormes pone «consultar» en el tubo y no dice nada de las bridas. ¿Se lo pido?",
         "respuesta": "No hay tiempo: trátalo como sin oferta y que se vea en el informe."},
        {"pregunta": "¿Cuántos envíos al año hace Tormes?", "respuesta": "12 (uno al mes)."},
        {"pregunta": "Los portes del 2 % de Elecvía, ¿sobre qué importe?",
         "respuesta": "Sobre el importe ya con el descuento, sin IVA: así nos lo factura."},
        {"pregunta": "¿Qué entrego y cuándo?",
         "respuesta": "Un PDF de una página para la reunión y el Excel para mí, el miércoles 18/11 antes de las 14:00."},
    ],
    "datos_md": "El libro **p1-datos.xlsx** tiene cuatro hojas:\n"
                "- **Instrucciones**: el encargo resumido y cómo comprobar tu trabajo.\n"
                "- **Ofertas**: 40 líneas (4 proveedores × 10 artículos) copiadas por Andrés tal como llegaron: proveedor, texto del "
                "artículo, precio, unidad de la oferta y observaciones. **No traen código.** Debajo, separadas por una fila vacía, las "
                "condiciones de cada proveedor en texto libre.\n"
                "- **Consumo 2027**: los 10 artículos con código, unidad base y cantidad prevista (está limpia).\n"
                "- **Incidencias 2026**: pedidos, incidencias, nota de calidad y plazo de entrega de cada proveedor.\n\n"
                "Ojo: cada proveedor da el precio en su unidad (metro, rollo, bobina, kilómetro, caja…), no todos con la misma base fiscal, "
                "hay precios que Excel no reconoce como números y falta algún precio. Los encontrarás al perfilar los datos.",
    "archivos": [{"archivo": "p1-datos.xlsx", "titulo": "Datos de partida",
                  "descripcion": "Ofertas de 4 proveedores tal como llegaron, consumo previsto para 2027 e incidencias de 2026."}],
    "pasos": pasos,
    "controles": controles,
    "entregables": ["P1_Ofertas_2027_v01.xlsx con las hojas Léame, Parámetros, Normalizado, Comparativa, Informe y Controles (y las originales sin tocar).",
                    "P1_Ofertas_2027.pdf: la hoja «Informe» en una sola página.",
                    "Correo de entrega a Andrés con las cifras clave, las conclusiones y los supuestos."],
    "rubrica": rubrica,
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas el trabajo a Andrés (máximo 12 líneas). Las cifras tienen que ser las del libro.",
        "modelo": f"Asunto: Ofertas cable y canaleta 2027: comparativa (adjunto PDF y Excel)\n\nHola, Andrés:\n\n"
                  f"Te adjunto el PDF de una página para la reunión con Carmen y el Excel. Todo es coste anual de 2027 sin IVA, con descuentos y portes.\n\n"
                  f"1. Proveedor único más barato: Elecvía, {es(T['Elecvía'])} €. Arnedo, {es(T['Arnedo'])} €; Yesa, {es(T['Yesa'])} € (con su subida del 3 %).\n"
                  f"2. Repartir (cables a Tormes, el resto a Elecvía) cuesta {es(REP['total'])} €: ahorra {d_ahorro} € al año ({es(C['ahorro_pct'], 1)} %). "
                  f"Tormes es la más rápida (2 días) y la de mejor calidad, pero son dos proveedores que gestionar.\n"
                  f"3. Si pesamos precio, plazo y calidad (60/25/15), gana Arnedo ({es(PUN['Arnedo'])} sobre 100).\n\n"
                  f"Mi propuesta: el reparto si el ahorro te compensa llevar dos proveedores; si prefieres sencillez, Elecvía sola. Decides tú.\n\n"
                  f"Ojo: Tormes no ha dado precio del tubo ni de las bridas, así que no puede ser proveedor único. Si Elecvía cambia sus "
                  f"condiciones, el libro se recalcula cambiando «Parámetros».\n\nUn saludo.",
        "criterios": ["Las cifras coinciden con las del libro y con los totales de control",
                      "Da la respuesta primero: proveedor único más barato y lo que ahorra el reparto",
                      "Plantea la decisión (ahorro frente a sencillez, plazo y calidad) y deja decidir a Andrés",
                      "Menciona los supuestos y los límites (sin IVA, subida de Yesa, Tormes incompleta)",
                      "Es breve y dice qué adjunta"]},
    "solucion_md": solucion,
    "archivo_solucion": "p1-solucion.xlsx",
    "errores_tipicos": [
        "Comparar «128,26 €» con «1,12 €»: uno es un rollo de 100 m con IVA y el otro un metro sin IVA. Primero, misma unidad y sin IVA.",
        f"No quitar el IVA de Elecvía: su total sube a {es(ERR['elecvia_con_iva_total'])} € y pasa a ser la más cara.",
        f"Redondear los precios base a 2 decimales antes de multiplicar: Elecvía sale {es(ERR['elecvia_redondeo2_total'])} € ({es(ERR['elecvia_redondeo2_total'] - T['Elecvía'])} € de más). Redondea solo al presentar.",
        f"Tomar el precio por metro de la canaleta de Elecvía como precio por tramo: la canaleta sale por {es(ERR['canaleta_elecvia_metro_como_tramo'])} € en lugar de {es(ERR['canaleta_elecvia_bien'])} €.",
        f"Olvidar la subida de Yesa ({es(ERR['yesa_sin_subida'])} €) o el descuento de Elecvía ({es(ERR['elecvia_sin_descuento'])} €).",
        "Reemplazar el punto por la coma en toda la hoja en lugar de solo en la columna de precios: cambia descripciones y condiciones que no había que tocar.",
        "Escribir 15000 o 1,21 dentro de las fórmulas: cuando cambie la condición, nadie sabrá dónde está.",
        "Formato condicional con el rango fijo del todo (`$F$5:$I$14`) o sin ningún $: resalta el mínimo de toda la tabla o compara con columnas que no tocan. Lo correcto es `=F5=MIN($F5:$I5)`.",
        f"Recomendar Tormes por su total ({es(ERR['tormes_total_8_articulos'])} €) sin ver que solo oferta 8 de los 10 artículos.",
        "Promediar precios unitarios en lugar de calcular el coste anual con las cantidades de cada artículo.",
        "Combinar celdas dentro de la matriz: luego no se puede copiar, ordenar ni filtrar.",
    ],
    "ampliaciones": [
        f"Buscar objetivo (Datos > Análisis de hipótesis): ¿qué descuento tendría que ofrecer Arnedo para igualar a Elecvía? Solución: {es(AMP['dto_arnedo_para_igualar'] * 100)} %.",
        f"¿Hasta cuántos envíos al año compensa el reparto con Tormes? Haz una tabla de datos de una variable (de 6 a 24 envíos). El punto de equilibrio está en {es(AMP['envios_equilibrio'])} envíos: con 19 compensa, con 20 ya no.",
        f"Cambio inesperado (el viernes llega un correo): Elecvía mejora la oferta a «dto. 7 % si el pedido supera 20.000 €». Con un libro bien hecho basta con cambiar 2 celdas de «Parámetros». Elecvía sola pasa a {es(CAM['elecvia_unico'])} € y el reparto a {es(CAM['reparto_mismo'])} €: ahora conviene Elecvía sola. Escribe a Andrés para avisarle de que la recomendación cambia.",
        "Reparto como matriz de asignación: una lista desplegable por artículo y un control que avise si se usan más de 2 proveedores o alguno no llega a 3.000 €.",
    ],
}

ruta = os.path.join(BASE, "proyectos", "p1.json")
with open(ruta, "w", encoding="utf-8") as fh:
    json.dump(proyecto, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

metas = {
    "p1-datos.meta.json": {"titulo": "P1 · Ofertas de proveedores 2027 (datos de partida)",
                           "descripcion": "Cuatro ofertas de cable, canaleta y pequeño material tal como llegaron, con el consumo previsto para 2027 y las incidencias de 2026.",
                           "nivel": "n6"},
    "p1-solucion.meta.json": {"titulo": "P1 · Ofertas de proveedores 2027 (solución)",
                              "descripcion": "Comparativa resuelta con fórmulas: parámetros con nombre, ofertas normalizadas, matriz de costes, reparto, puntuación, informe de una página y controles.",
                              "nivel": "n6"},
}
for nombre, m in metas.items():
    with open(os.path.join(LIBROS, nombre), "w", encoding="utf-8") as fh:
        json.dump(m, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
print("Escrito", ruta, "y los .meta.json")
