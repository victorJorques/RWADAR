import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import Svg, {
  Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { C, COLOR_CATEGORIA, T, F, R, UI, MOV } from '../lib/tema';
import { etiquetaEstadoVerificacionLocal } from '../lib/verificacion-local';

/* ---------------------------------------------------------------------
   El radar de portada
   ---------------------------------------------------------------------
   Portado de `rwadar-site/index.html` (`function pintarRadar`). El ángulo
   y los anillos tienen significado; el contorno completo del punto se
   mantiene dentro del perímetro incluso al aplicar el escalón radial:

     · la apertura del sector no pasa de 56° o algún punto se sale de su
       sector y parece de otra categoría;
     · el escalón radial no pasa de 0,115 o invade el anillo de al lado y
       se pierde la lectura de «distancia = a quién deja entrar»;
     · el azar sobra: jitter 0 gana a cualquier jitter, porque desordena
       sin separar.

   No es un adorno: sale de la misma lista que las fichas, el ángulo es el
   tipo de activo y el radio es a quién deja entrar. Pulsar un punto abre
   su ficha; pulsar un rótulo filtra la lista de abajo.

   EL BARRIDO VA EN UNA CAPA APARTE. Rotar un grupo dentro del SVG obliga
   a animar una propiedad que no es de transformación, y eso no puede ir
   por el hilo nativo: se mueve a tirones. Encima, girando una vista con
   `transform`, gira a 60 fotogramas sin tocar el hilo de JavaScript.
   --------------------------------------------------------------------- */

const LADO = 340;
const CX = 170, CY = 170, RMAX = 119;
const RADIO_PUNTO = 4.2, RADIO_HALO = 8, TRAZO_HALO = 1, MARGEN_PUNTO = 2;
const RADIO_CENTRO_MAX = RMAX - RADIO_HALO - TRAZO_HALO / 2 - MARGEN_PUNTO;
export const GEOMETRIA_RADAR = Object.freeze({cx:CX,cy:CY,radio:RMAX,
  radioPunto:RADIO_PUNTO,radioHalo:RADIO_HALO,trazoHalo:TRAZO_HALO,margen:MARGEN_PUNTO});
const VUELTA = 8000;              // lo que tarda el barrido en dar la vuelta
const TAMANO_DIANA = 44;           // caja nominal; las cajas se pueden solapar
const RADIO_ACCESO = { Minorista: 0.40, Acreditado: 0.60, Empresas: 0.76, Institucional: 0.90 };
const CORTO = {
  'Inmobiliario': 'Inmuebles', 'Crédito privado': 'Crédito', 'Tesoro y fondos': 'Tesoro',
  'Acciones y capital privado': 'Acciones', 'Materias primas': 'Materias',
};

/* Los nombres cortos de la portada, los mismos que la web (catCorta). */
const CORTO_PORTADA = {
  'Inmobiliario': 'Inmobiliario', 'Crédito privado': 'Crédito', 'Tesoro y fondos': 'Tesoro',
  'Acciones y capital privado': 'Acciones', 'Materias primas': 'Materias primas',
  'Infraestructura': 'Infraestructura',
};

/* ---------------------------------------------------------------------
   La portada: radar a la izquierda y leyenda a la derecha (13/11/2026)
   ---------------------------------------------------------------------
   Antes los nombres iban DENTRO del dibujo. Al encoger el radar a 176 px
   se montaban sobre el aro y los puntos, y en pantallas bajas se quitaban
   y quedaba una bolita de puntos sin sentido. Ahora el dibujo no lleva
   texto y la leyenda es texto de verdad, al lado: seis filas en el orden
   del radar (desde arriba, en el sentido de las agujas), con el punto del
   color de cada tipo, el nombre y cuántas plataformas hay.

   El lienzo de la portada se recorta al aro y sus marcas (VISTA_PORTADA),
   así el círculo aprovecha el lado entero: con 168 px el aro mide 157. */
const MARGEN_VISTA_PORTADA = 8;    // marcas de grado (6) y su trazo
const VISTA_PORTADA = Object.freeze({
  x: CX - RMAX - MARGEN_VISTA_PORTADA, y: CY - RMAX - MARGEN_VISTA_PORTADA,
  lado: 2 * (RMAX + MARGEN_VISTA_PORTADA),
});
const VISTA_COMPLETA = Object.freeze({ x: 0, y: 0, lado: LADO });
const MEDIDAS_PORTADA = Object.freeze({
  // Alto normal: el bloque mide lo de antes (176 con el relleno de Inicio).
  normal: Object.freeze({ ladoMax: 168, letra: 13, linea: 18, punto: 9, huecoFila: 7, hueco: 12 }),
  // Pantalla baja (menos de 700 de alto): como antes, 124 de alto.
  compacta: Object.freeze({ ladoMax: 124, letra: 12, linea: 16, punto: 8, huecoFila: 4, hueco: 10 }),
});
const LADO_PORTADA_MIN = 88;       // por debajo, la leyenda pasa debajo del radar
const LADO_PORTADA_APILADA = 112;  // con la leyenda debajo, un radar pequeño: no sobra alto
const HUECO_PUNTO = 7, HUECO_CIFRA = 10;
const HOLGURA_TEXTO = 1.06;        // margen sobre el ancho medido del texto
/* Ancho de cada nombre en em (Geist Medium, medido en Chromium con la letra
   de la app). Sirve para dejar sitio a la leyenda sin medir en pantalla; un
   texto que no esté aquí cuenta 0,6 em por letra, que es de sobra. */
const ANCHO_EM = Object.freeze({
  'Inmobiliario': 5.44, 'Crédito': 3.42, 'Tesoro': 3.1, 'Acciones': 4.29,
  'Materias primas': 7.5, 'Infraestructura': 7.04,
  'Property': 4.05, 'Credit': 2.85, 'Treasury': 4.05, 'Equities': 3.74,
  'Commodities': 6.16, 'Infrastructure': 6.48,
});
const anchoEm = (texto) => ANCHO_EM[texto] ?? String(texto).length * 0.6;

/* Las seis filas de la leyenda, siempre en el orden del radar. Sin cifras
   (revisión vencida o sin comprobar, o sin plataformas) solo van los nombres;
   un tipo sin plataformas se queda con su «0». */
export function filasLeyendaPortada(datos = [], sinCifras = false) {
  const lista = Array.isArray(datos) ? datos : [];
  const conCifras = !sinCifras && lista.length > 0;
  return Object.keys(COLOR_CATEGORIA).map((categoria) => ({
    categoria,
    nombre: CORTO_PORTADA[categoria] || categoria,
    color: COLOR_CATEGORIA[categoria],
    total: conCifras ? lista.filter((p) => p.categoria === categoria).length : null,
  }));
}

/* Cuánto mide cada cosa de la portada para un ancho de pantalla, un alto
   (compacta) y un tamaño de letra del sistema (fontScale). Primero cabe la
   leyenda entera, sin cortar ni partir nombres; el radar se queda con el
   resto, hasta su máximo. Si no llega al mínimo (letra muy grande en un
   móvil estrecho), la leyenda pasa debajo, con un radar pequeño (112) para
   no gastar alto antes del titular: nada se sale ni se monta. El punto de
   color crece con la letra del sistema (hasta 1,5 veces); el texto lo
   escala el propio sistema. */
export function medidasPortada({ ancho = 360, fontScale = 1, compacta = false, nombres = [], digitos = 0 } = {}) {
  const m = compacta ? MEDIDAS_PORTADA.compacta : MEDIDAS_PORTADA.normal;
  const escala = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const letra = m.letra * escala;
  const nombreMax = Math.max(0, ...nombres.map(anchoEm)) * letra * HOLGURA_TEXTO;
  const cifra = digitos > 0 ? HUECO_CIFRA + digitos * 0.6 * letra * HOLGURA_TEXTO : 0;
  const punto = Math.round(m.punto * Math.min(escala, 1.5));
  const anchoLeyenda = Math.ceil(punto + HUECO_PUNTO + nombreMax + cifra);
  const disponible = Math.max(0, (Number.isFinite(ancho) ? ancho : 360) - 2 * UI.margen);
  const libre = Math.floor(disponible - anchoLeyenda - m.hueco);
  const apilada = libre < LADO_PORTADA_MIN;
  const lado = apilada ? Math.min(m.ladoMax, LADO_PORTADA_APILADA)
    : Math.max(LADO_PORTADA_MIN, Math.min(m.ladoMax, libre));
  const lineaReal = m.linea * escala;
  // Las filas se reparten el alto del radar, sin pasar del hueco máximo.
  const huecoFila = Math.max(0, Math.min(m.huecoFila, (lado - 6 * lineaReal) / 5));
  const altoLeyenda = 6 * lineaReal + 5 * huecoFila;
  return {
    lado, apilada, anchoLeyenda, altoLeyenda, huecoFila,
    letra: m.letra, linea: m.linea, punto, hueco: m.hueco,
    diametro: (lado * 2 * RMAX) / VISTA_PORTADA.lado,
    alto: apilada ? lado + m.hueco + altoLeyenda : Math.max(lado, altoLeyenda),
    ancho: apilada ? Math.max(lado, anchoLeyenda) : lado + m.hueco + anchoLeyenda,
  };
}

/* En el centro de la portada, el hexágono de la marca (como en la web). */
const HEXAGONO = (() => {
  const r = 13;
  return `M${Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`;
  }).join('L')}Z`;
})();
const GIRO_QUIETO = 1 - 38 / 360;  // con «reducir movimiento», el barrido quieto como en la web

/* Los ecos de la portada, como en la web: cuando el barrido pasa por un
   punto, un círculo de su color crece (de 4,4 a 13,1 unidades, lo mismo que
   5 → 15 en el radar de 136 de la web) y se apaga (de 0,8 a 0) durante el
   20 % de la vuelta. No añaden ningún bucle: cada eco sale del mismo `giro`
   que mueve el barrido (interpolaciones por el hilo nativo). Con «reducir
   movimiento», no se pintan. */
const ECO_MIN = 4.4, ECO_MAX = 13.1, ECO_OPACIDAD = 0.8, ECO_TRAMO = 0.2;
const ECO_SALTO = 0.0005;          // 4 ms: el eco se enciende de golpe
/* Cuándo pasa el barrido por un punto, en fracción de vuelta (0 a 1). La
   línea del barrido empieza a la derecha (0°) y gira en el sentido de las
   agujas: pasa por el ángulo del punto en la pantalla. */
export function faseEco(x, y) {
  const ang = (Math.atan2(y - CY, x - CX) * 180) / Math.PI;
  return (((ang % 360) + 360) % 360) / 360;
}
/* Opacidad y escala del eco en función del giro (0 a 1), como tramos
   rectos para `interpolate`: entradas estrictamente crecientes de 0 a 1, sin
   repetir (el driver nativo no admite tramos de ancho cero en todas las
   plataformas). Edad del eco = cuánto ha girado el barrido desde el punto. */
export function rangosEco(fase) {
  const bruta = Number.isFinite(fase) ? (((fase % 1) + 1) % 1) : 0;
  const f = bruta < 1e-6 || bruta > 1 - 1e-6 ? 0 : bruta;
  const edad = (g) => (((g - f) % 1) + 1) % 1;
  const opacidad = (a) => (a < ECO_TRAMO ? ECO_OPACIDAD * (1 - a / ECO_TRAMO) : 0);
  const escala = (a) => (a < ECO_TRAMO ? (ECO_MIN + (ECO_MAX - ECO_MIN) * (a / ECO_TRAMO)) / ECO_MAX : 1);
  // Por dentro: justo antes de que pase el barrido (apagado), cuando pasa y
  // cuando se apaga, cada uno con su edad. Los extremos 0 y 1 van siempre.
  const dentro = [[(f - ECO_SALTO + 1) % 1, 1 - ECO_SALTO], [f, 0], [(f + ECO_TRAMO) % 1, ECO_TRAMO]]
    .filter(([g]) => g > 1e-6 && g < 1 - 1e-6)
    .sort((x, y) => x[0] - y[0]);
  const puntos = [[0, edad(0)], ...dentro, [1, edad(1)]];
  return {
    inputRange: puntos.map(([g]) => g),
    opacidad: puntos.map(([, a]) => opacidad(a)),
    escala: puntos.map(([, a]) => escala(a)),
  };
}

const accesoLegible = (plataforma) => plataforma?.verificacionLocal
  ? etiquetaEstadoVerificacionLocal(plataforma.verificacionLocal.acceso?.estado)
  : plataforma?.acceso;

const pol = (ang, rad) => [
  CX + Math.cos((ang * Math.PI) / 180) * rad,
  CY + Math.sin((ang * Math.PI) / 180) * rad,
];

export function puntosRadar(datos = []) {
  const cats = Object.keys(COLOR_CATEGORIA);
  return datos.map((p) => {
    const ci = Math.max(0, cats.indexOf(p.categoria));
    const mismaCat = datos.filter((x) => x.categoria === p.categoria);
    const k = mismaCat.indexOf(p);
    const ang = -90 + ci * 60 + (((k + 0.5) / Math.max(mismaCat.length, 1)) - 0.5) * 56;
    const accesoRadar = p.verificacionLocal?.acceso?.estado === 'no_verificable' ? '__no_verificable' : p.acceso;
    const base = accesoRadar === '__no_verificable' ? 0.98 : (RADIO_ACCESO[accesoRadar] ?? 0.7);
    const mismos = datos.filter(x => x.categoria === p.categoria &&
      (x.verificacionLocal?.acceso?.estado === 'no_verificable' ? '__no_verificable' : x.acceso) === accesoRadar);
    const kk = mismos.indexOf(p);
    const escalon = mismos.length > 1 ? ((kk / (mismos.length - 1)) - 0.5) * 0.115 : 0;
    // El perímetro incluye el halo y su trazo, no solo el centro. El acceso
    // desconocido permanece fuera de los anillos comprobados, dentro del radar.
    const radio = Math.max(0, Math.min(RADIO_CENTRO_MAX, RMAX * (base + escalon)));
    const [x,y] = pol(ang,radio);
    return {p,x,y,color:COLOR_CATEGORIA[p.categoria] || C.tx3};
  });
}

export function resolverPuntoRadar(puntos, puntoReceptor, evento, escala) {
  const tacto = evento?.nativeEvent;
  // Pressability entrega los clics de accesibilidad/teclado sin una secuencia
  // táctil. En ese caso se abre exactamente el botón que se anunció.
  if (evento?.type === 'click' || !Array.isArray(tacto?.changedTouches) || !tacto.changedTouches.length ||
      !Number.isFinite(tacto.locationX) || !Number.isFinite(tacto.locationY) ||
      !Number.isFinite(escala) || escala <= 0) return puntoReceptor.p;
  // PressEvent.locationX/Y son relativos al Pressable receptor. Recuperamos
  // la posición del toque en el viewBox, aunque lo haya recibido otra caja
  // superpuesta, y elegimos el centro visible más cercano.
  const x = puntoReceptor.x + (tacto.locationX - TAMANO_DIANA / 2) / escala;
  const y = puntoReceptor.y + (tacto.locationY - TAMANO_DIANA / 2) / escala;
  let elegido = puntoReceptor, distancia = Infinity;
  for (const punto of puntos) {
    const d = Math.hypot(punto.x-x,punto.y-y);
    if (d < distancia) { elegido = punto; distancia = d; }
  }
  return elegido.p;
}

/* `portada`: el radar vivo de Inicio (ESPEC-INICIO §2.0). Sin caja ni
   lectura; el dibujo sin texto y, al lado, la leyenda de los seis tipos con
   su recuento (sin recuento con `sinCifras`). `compacta`: pantalla baja, el
   bloque se queda en 124 de alto. Tocar un punto sigue abriendo su ficha. */
export default function Radar({ datos, onAbrir, onFiltrar, categoriaActiva, portada = false, compacta = false, sinCifras = false }) {
  const idiomaActual=useIdioma();
  // «Reducir movimiento» del sistema: en la portada el barrido se queda quieto.
  const [quieto, setQuieto] = useState(() => portada && MOV.reducir === true);
  const giro = useRef(new Animated.Value(quieto ? GIRO_QUIETO : 0)).current;
  const [leido, setLeido] = useState(null);
  const cats = Object.keys(COLOR_CATEGORIA);

  /* EL RADAR SE ENCOGE, NO SE RECORTA.
     LADO era fijo a 340 y la tarjeta que lo envuelve se ajusta a él, así
     que hacían falta 374 px de pantalla para verlo entero: 340 del lienzo,
     32 del relleno de la lista y 2 del borde. Un Android de 360 dp —el
     ancho más vendido en España— se comía el borde derecho. Y el radar no
     es una ilustración, es el producto.

     Las coordenadas siguen calculándose en el espacio de 340 del viewBox
     y solo cambia el tamaño
     al que se pinta. Las cajas nominales conservan 44 dp; al solaparse no
     representan 44 dp exclusivos. El toque se resuelve por centro cercano
     y la lista ofrece una alternativa grande y accesible. */
  const { width: ancho, fontScale } = useWindowDimensions();
  /* La leyenda de la portada: texto real, traducido, y el lector de pantalla
     la lee una sola vez (el dibujo no tiene texto). */
  const filas = portada ? filasLeyendaPortada(datos, sinCifras) : [];
  const conCifras = filas.some((f) => f.total != null);
  const med = portada ? medidasPortada({ ancho, fontScale, compacta,
    nombres: filas.map((f) => traducir(f.nombre)),
    digitos: conCifras ? Math.max(...filas.map((f) => String(f.total).length)) : 0 }) : null;
  const lado = portada ? med.lado : Math.max(240, Math.min(LADO, ancho - 34));
  // La portada se recorta al aro; el radar de Plataformas pinta el viewBox entero.
  const vista = portada ? VISTA_PORTADA : VISTA_COMPLETA;
  const k = lado / vista.lado;
  const caja = `${vista.x} ${vista.y} ${vista.lado} ${vista.lado}`;

  useEffect(() => {
    if (!portada) return undefined;
    let vivo = true;
    try {
      AccessibilityInfo?.isReduceMotionEnabled?.()?.then?.((v) => { if (vivo) setQuieto(Boolean(v)); })?.catch?.(() => {});
    } catch { /* sin accesibilidad: sigue girando */ }
    const escucha = AccessibilityInfo?.addEventListener?.('reduceMotionChanged', (v) => setQuieto(Boolean(v)));
    return () => { vivo = false; escucha?.remove?.(); };
  }, [portada]);

  useEffect(() => {
    if (quieto) { giro.setValue(GIRO_QUIETO); return undefined; }
    /* Desde 0: el bucle nativo repite cada vuelta desde el valor que tenía al
       empezar. Si arrancara en el valor quieto (al quitar «reducir
       movimiento» con la app abierta), solo recorrería 38°. */
    giro.setValue(0);
    const bucle = Animated.loop(
      Animated.timing(giro, {
        toValue: 1, duration: VUELTA, easing: Easing.linear, useNativeDriver: true,
      })
    );
    bucle.start();
    return () => bucle.stop();
  }, [giro, quieto]);

  const puntos = useMemo(() => puntosRadar(datos || []), [datos]);

  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ecos = useMemo(() => (portada ? puntos.map(({ p, x, y, color }) => {
    const r = rangosEco(faseEco(x, y));
    return { p, x, y, color,
      opacidad: giro.interpolate({ inputRange: r.inputRange, outputRange: r.opacidad, extrapolate: 'clamp' }),
      escala: giro.interpolate({ inputRange: r.inputRange, outputRange: r.escala, extrapolate: 'clamp' }) };
  }) : []), [portada, puntos, giro]);
  const tamanoEco = 2 * ECO_MAX * k;

  return (
    <View style={portada ? [e.cajaPortada, med.apilada && e.cajaPortadaApilada, { gap: med.hueco }] : e.caja}>
      <View style={[e.lienzo, { width: lado, height: lado }]}>
        {/* Los ecos, debajo del dibujo (que es transparente): así el punto
            queda encima de su eco, como en la web. Sin toques. */}
        {quieto ? null : ecos.map((eco) => (
          <Animated.View key={'eco-' + eco.p.slug} pointerEvents="none"
            style={[e.eco, {
              left: (eco.x - vista.x) * k - tamanoEco / 2, top: (eco.y - vista.y) * k - tamanoEco / 2,
              width: tamanoEco, height: tamanoEco, borderRadius: tamanoEco / 2, backgroundColor: eco.color,
              opacity: eco.opacidad, transform: [{ scale: eco.escala }],
            }]} />
        ))}
        <Svg width={lado} height={lado} viewBox={caja}>
          {/* Anillos, uno por nivel de acceso. Sin rótulo dentro: los cuatro
              nombres caían justo encima de los puntos del sector de arriba. */}
          {[0.40, 0.60, 0.76, 0.90].map((f) => (
            <Circle key={f} cx={CX} cy={CY} r={RMAX * f}
              stroke={C.linea2} strokeWidth={1} fill="none" opacity={0.55} />
          ))}
          <Circle cx={CX} cy={CY} r={RMAX} stroke={C.linea2} strokeWidth={1.4} fill="none" />

          {/* Marcas de grado. No informan de nada, pero sin ellas el círculo
              parece un gráfico y con ellas parece un aparato. */}
          {Array.from({ length: 36 }, (_, g) => {
            const a = g * 10, largo = g % 3 === 0 ? 6 : 3;
            const [x1, y1] = pol(a, RMAX), [x2, y2] = pol(a, RMAX + largo);
            return <Line key={g} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={C.linea2} strokeWidth={g % 6 === 0 ? 1.4 : 1}
              opacity={g % 6 === 0 ? 0.9 : 0.5} />;
          })}

          {/* Los seis sectores. El rótulo va del color de su categoría, y con
              eso el radar gana la leyenda que le faltaba. */}
          {cats.map((c, i) => {
            const [x, y] = pol(-90 + i * 60 - 30, RMAX);
            return <Line key={c} x1={CX} y1={CY} x2={x} y2={y}
              stroke={C.linea} strokeWidth={1} opacity={0.8} />;
          })}
          {/* En la portada, ningún texto dentro del dibujo: los nombres van
              en la leyenda de al lado. */}
          {portada ? null : cats.map((c, i) => {
            const angulo = -90 + i * 60;
            const opacidad = categoriaActiva && categoriaActiva !== c ? 0.35 : 1;
            const [tx, ty] = pol(angulo, RMAX + 16);
            return (
              <SvgText key={c} x={tx} y={ty} fill={COLOR_CATEGORIA[c]}
                fontSize={11} fontFamily={F.semi} textAnchor="middle" opacity={opacidad}>
                {traducir(CORTO[c] || c)}
              </SvgText>
            );
          })}

          {puntos.map(({ p, x, y, color }) => (
            <G key={p.slug}>
              <Circle cx={x} cy={y} r={RADIO_HALO} fill="none" stroke={color} strokeWidth={TRAZO_HALO} opacity={0.30} />
              {/* El borde oscuro separa dos puntos que se rocen: sin él, dos
                  colores contiguos se funden en una mancha. */}
              <Circle cx={x} cy={y} r={RADIO_PUNTO} fill={color} stroke={C.noche} strokeWidth={1.3}
                opacity={categoriaActiva && categoriaActiva !== p.categoria ? 0.25 : 1} />
            </G>
          ))}

          {portada
            ? <Path d={HEXAGONO} fill={C.senal} stroke={C.noche} strokeWidth={1.4} />
            : <Circle cx={CX} cy={CY} r={2.6} fill={C.senal} />}
        </Svg>

        {/* El barrido, en su propia capa: una cola que se apaga, no una
            porción de tarta. Un radar deja estela de fósforo; el borde duro
            delataba el truco. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotacion }] }]}>
          <Svg width={lado} height={lado} viewBox={caja}>
            <Defs>
              <RadialGradient id="barrido" cx="0" cy="0.5" r="1">
                <Stop offset="0" stopColor={C.senal} stopOpacity="0.26" />
                <Stop offset="0.55" stopColor={C.senal} stopOpacity="0.07" />
                <Stop offset="1" stopColor={C.senal} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* En la portada de Inicio, sin la cola (27/11/2026): sombreaba la parte de arriba. */}
            {portada ? null : (
              <Path
                d={`M${CX} ${CY} L${CX + RMAX} ${CY} A${RMAX} ${RMAX} 0 0 0 ${
                  (CX + RMAX * Math.cos((-88 * Math.PI) / 180)).toFixed(1)} ${
                  (CY + RMAX * Math.sin((-88 * Math.PI) / 180)).toFixed(1)} Z`}
                fill="url(#barrido)" />
            )}
            <Line x1={CX} y1={CY} x2={CX + RMAX} y2={CY}
              stroke={C.senal} strokeWidth={1.3} opacity={0.75} />
          </Svg>
        </Animated.View>

        {/* Las cajas pueden solaparse: el receptor nativo no decide qué
            plataforma abrir. La posición real del toque decide el centro. */}
        {puntos.map((punto) => (
          <Pressable
            key={punto.p.slug}
            onPressIn={(evento) => setLeido(resolverPuntoRadar(puntos,punto,evento,k))}
            onPress={(evento) => {
              const elegido = resolverPuntoRadar(puntos,punto,evento,k);
              // Evidencia nativa local: no posición del usuario ni identificador,
              // solo destinos públicos y forma del evento; no se envía a red.
              console.info('RWADAR_RADAR_TOUCH',JSON.stringify({eventType:evento?.type || 'unknown',
                changedTouches:Array.isArray(evento?.nativeEvent?.changedTouches) ? evento.nativeEvent.changedTouches.length : 0,
                receiverSlug:punto.p.slug,selectedSlug:elegido.slug,selectedName:elegido.nombre}));
              onAbrir(elegido);
            }}
            style={[e.diana, {
              left: punto.x * k - TAMANO_DIANA / 2 - vista.x * k,
              top: punto.y * k - TAMANO_DIANA / 2 - vista.y * k,
            }]}
            accessibilityRole="button"
            noTraducir idiomaOriginal={idiomaActual==='en'?'en-US':'es-ES'}
            accessibilityLabel={`${punto.p.nombre}. ${traducir(punto.p.categoria)}. ${traducir('Estado de acceso:')} ${traducir(accesoLegible(punto.p))}. ${traducir('Abrir ficha.')}`} />
        ))}
      </View>

      {/* Portada: la leyenda, al lado del radar. Texto real, que se traduce;
          el lector de pantalla la lee de una vez, como un solo elemento. */}
      {portada ? (
        <View style={[e.leyendaPortada, { gap: med.huecoFila }]}
          accessible accessibilityRole="text"
          noTraducir idiomaOriginal={idiomaActual === 'en' ? 'en-US' : 'es-ES'}
          accessibilityLabel={`${traducir('Plataformas por tipo de activo')}: ${filas.map((f) =>
            (f.total == null ? traducir(f.nombre) : `${traducir(f.nombre)}, ${f.total}`)).join('; ')}`}>
          {filas.map((f) => (
            <View key={f.categoria} style={e.filaPortada}>
              <View style={[e.puntoPortada, { width: med.punto, height: med.punto, borderRadius: med.punto / 2, backgroundColor: f.color }]} />
              <Text style={[e.nombrePortada, { fontSize: med.letra, lineHeight: med.linea }]}>{f.nombre}</Text>
              {f.total == null ? null : (
                <Text noTraducir style={[e.cifraPortada, { fontSize: med.letra, lineHeight: med.linea }, f.total === 0 && e.cifraCero]}>
                  {String(f.total)}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : null}

      {/* La lectura. Sin esto el radar es bonito y mudo, y hay que abrir
          puntos al azar para saber qué son. */}
      {portada ? null : <>
      <View style={e.lectura}>
        {leido ? (
          <>
            <View style={[e.chincheta, { backgroundColor: COLOR_CATEGORIA[leido.categoria] }]} />
            <Text style={e.lecturaNom} numberOfLines={1}>{leido.nombre}</Text>
            <Text style={e.lecturaSub} numberOfLines={1}>
              {leido.categoria} · Acceso: {accesoLegible(leido)}
            </Text>
          </>
        ) : (
          <Text style={e.lecturaVacia}>
            Toca un punto para ver qué plataforma es. El ángulo es el tipo de activo;
            la distancia al centro, a quién deja entrar. El perímetro no confirma acceso.
            También puedes elegir una plataforma en la lista que sigue.
          </Text>
        )}
      </View>

      <View style={e.leyenda}>
        {Object.keys(COLOR_CATEGORIA).map((c) => (
          <Pressable key={c} onPress={() => onFiltrar(categoriaActiva === c ? '' : c)}
            style={({ pressed }) => [e.leyendaItem, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityState={{ selected: categoriaActiva === c }}
            accessibilityLabel={categoriaActiva === c
              ? `${c}. Filtro activo. Quitar filtro.`
              : `${c}. Filtrar plataformas de esta categoría.`}>
            <View style={[e.chincheta, { backgroundColor: COLOR_CATEGORIA[c] }]} />
            <Text style={[e.leyendaTxt, categoriaActiva === c && { color: C.tx }]}>
              {CORTO[c] || c}
            </Text>
          </Pressable>
        ))}
      </View>
      </>}
    </View>
  );
}

const e = StyleSheet.create({
  caja: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, paddingVertical: 16, marginBottom: 14, alignItems: 'center',
  },
  /* Portada: radar y leyenda lado a lado, centrados como un bloque. */
  cajaPortada: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' },
  cajaPortadaApilada: { flexDirection: 'column' },
  leyendaPortada: { flexShrink: 1, justifyContent: 'center' },
  filaPortada: { flexDirection: 'row', alignItems: 'center' },
  puntoPortada: { marginRight: HUECO_PUNTO },
  /* El color va en el punto; el nombre, en el gris de lectura (AA de sobra
     sobre el fondo) y la cifra, en mono, alineada a la derecha. */
  nombrePortada: { fontFamily: F.media, color: C.tx2, flexGrow: 1, flexShrink: 1 },
  cifraPortada: { ...T.instrumento, color: C.tx, marginLeft: HUECO_CIFRA, textAlign: 'right' },
  cifraCero: { color: C.tx3 },
  /* El tamaño va inline: depende del ancho de la pantalla. Aquí solo lo
     que no cambia. */
  lienzo: {},
  eco: { position: 'absolute' },
  diana: {
    position: 'absolute', width: TAMANO_DIANA, height: TAMANO_DIANA,
    borderRadius: TAMANO_DIANA / 2,
  },

  lectura: {
    minHeight: 46, width: '100%', paddingHorizontal: 20, paddingTop: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  chincheta: { width: 8, height: 8, borderRadius: 4 },
  lecturaNom: { ...T.ficha, fontSize: 16, color: C.tx, marginTop: 4 },
  lecturaSub: { ...T.dato, fontSize: 12, color: C.tx2, marginTop: 2 },
  lecturaVacia: { ...T.menor, fontSize: 12, color: C.tx3, textAlign: 'center', lineHeight: 17 },

  // Cada nombre de la leyenda filtra: diana de 44 px de alto (antes medía
  // 18 px; prueba en móvil, 04/11/2026). Sin hueco entre filas para que la
  // leyenda no crezca más de lo necesario.
  leyenda: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    columnGap: 6, rowGap: 0, paddingHorizontal: 16, paddingTop: 2,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingHorizontal: 4 },
  leyendaTxt: { ...T.dato, fontSize: 12, color: C.tx3 },
});
