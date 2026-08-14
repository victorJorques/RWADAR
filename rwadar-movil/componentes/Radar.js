import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { C, COLOR_CATEGORIA, T, F, R } from '../lib/tema';

/* ---------------------------------------------------------------------
   El radar de portada
   ---------------------------------------------------------------------
   Portado de `rwadar-site/index.html` (`function pintarRadar`), con LAS
   MISMAS CIFRAS. No son decorativas y no se tocan sin volver a medir:

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
const VUELTA = 8000;              // lo que tarda el barrido en dar la vuelta
const RADIO_ACCESO = { Minorista: 0.40, Acreditado: 0.60, Empresas: 0.76, Institucional: 0.90 };
const CORTO = {
  'Inmobiliario': 'Inmuebles', 'Crédito privado': 'Crédito', 'Tesoro y fondos': 'Tesoro',
  'Acciones y capital privado': 'Acciones', 'Materias primas': 'Materias',
};

const pol = (ang, rad) => [
  CX + Math.cos((ang * Math.PI) / 180) * rad,
  CY + Math.sin((ang * Math.PI) / 180) * rad,
];

export default function Radar({ datos, onAbrir, onFiltrar, categoriaActiva }) {
  const giro = useRef(new Animated.Value(0)).current;
  const [leido, setLeido] = useState(null);
  const cats = Object.keys(COLOR_CATEGORIA);

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.timing(giro, {
        toValue: 1, duration: VUELTA, easing: Easing.linear, useNativeDriver: true,
      })
    );
    bucle.start();
    return () => bucle.stop();
  }, [giro]);

  /* Colocación de los puntos: mismo cálculo que la web, punto por punto. */
  const puntos = useMemo(() => (datos || []).map((p) => {
    const ci = Math.max(0, cats.indexOf(p.categoria));
    const mismaCat = datos.filter((x) => x.categoria === p.categoria);
    const k = mismaCat.indexOf(p);
    const ang = -90 + ci * 60 + (((k + 0.5) / Math.max(mismaCat.length, 1)) - 0.5) * 56;

    const base = RADIO_ACCESO[p.acceso] != null ? RADIO_ACCESO[p.acceso] : 0.7;
    const mismos = datos.filter((x) => x.categoria === p.categoria && x.acceso === p.acceso);
    const kk = mismos.indexOf(p);
    const escalon = mismos.length > 1 ? ((kk / (mismos.length - 1)) - 0.5) * 0.115 : 0;

    const [x, y] = pol(ang, RMAX * (base + escalon));
    return { p, x, y, color: COLOR_CATEGORIA[p.categoria] || C.tx3 };
  }), [datos]);

  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={e.caja}>
      <View style={e.lienzo}>
        <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`}>
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
          {cats.map((c, i) => {
            const [tx, ty] = pol(-90 + i * 60, RMAX + 16);
            return (
              <SvgText key={c} x={tx} y={ty} fill={COLOR_CATEGORIA[c]}
                fontSize={9.5} fontFamily={F.mono} textAnchor="middle"
                opacity={categoriaActiva && categoriaActiva !== c ? 0.35 : 1}>
                {(CORTO[c] || c).toUpperCase()}
              </SvgText>
            );
          })}

          {puntos.map(({ p, x, y, color }) => (
            <G key={p.slug}>
              <Circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={1} opacity={0.30} />
              {/* El borde oscuro separa dos puntos que se rocen: sin él, dos
                  colores contiguos se funden en una mancha. */}
              <Circle cx={x} cy={y} r={4.2} fill={color} stroke={C.noche} strokeWidth={1.3}
                opacity={categoriaActiva && categoriaActiva !== p.categoria ? 0.25 : 1} />
            </G>
          ))}

          <Circle cx={CX} cy={CY} r={2.6} fill={C.senal} />
        </Svg>

        {/* El barrido, en su propia capa: una cola que se apaga, no una
            porción de tarta. Un radar deja estela de fósforo; el borde duro
            delataba el truco. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotacion }] }]}>
          <Svg width={LADO} height={LADO} viewBox={`0 0 ${LADO} ${LADO}`}>
            <Defs>
              <RadialGradient id="barrido" cx="0" cy="0.5" r="1">
                <Stop offset="0" stopColor={C.senal} stopOpacity="0.26" />
                <Stop offset="0.55" stopColor={C.senal} stopOpacity="0.07" />
                <Stop offset="1" stopColor={C.senal} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Path
              d={`M${CX} ${CY} L${CX + RMAX} ${CY} A${RMAX} ${RMAX} 0 0 0 ${
                (CX + RMAX * Math.cos((-88 * Math.PI) / 180)).toFixed(1)} ${
                (CY + RMAX * Math.sin((-88 * Math.PI) / 180)).toFixed(1)} Z`}
              fill="url(#barrido)" />
            <Line x1={CX} y1={CY} x2={CX + RMAX} y2={CY}
              stroke={C.senal} strokeWidth={1.3} opacity={0.75} />
          </Svg>
        </Animated.View>

        {/* Las zonas pulsables van encima, como vistas: en un móvil el dedo
            necesita 44 px de diana y el punto mide 8. */}
        {puntos.map(({ p, x, y }) => (
          <Pressable
            key={p.slug}
            onPressIn={() => setLeido(p)}
            onPress={() => onAbrir(p)}
            hitSlop={4}
            style={[e.diana, { left: x - 17, top: y - 17 }]}
            accessibilityRole="button"
            accessibilityLabel={`${p.nombre}. ${p.categoria}. Acceso: ${p.acceso}. Abrir ficha.`} />
        ))}
      </View>

      {/* La lectura. Sin esto el radar es bonito y mudo, y hay que abrir
          puntos al azar para saber qué son. */}
      <View style={e.lectura}>
        {leido ? (
          <>
            <View style={[e.chincheta, { backgroundColor: COLOR_CATEGORIA[leido.categoria] }]} />
            <Text style={e.lecturaNom} numberOfLines={1}>{leido.nombre}</Text>
            <Text style={e.lecturaSub} numberOfLines={1}>{leido.categoria} · {leido.acceso}</Text>
          </>
        ) : (
          <Text style={e.lecturaVacia}>
            Toca un punto para ver qué plataforma es. El ángulo es el tipo de activo;
            la distancia al centro, a quién deja entrar.
          </Text>
        )}
      </View>

      <View style={e.leyenda}>
        {Object.keys(COLOR_CATEGORIA).map((c) => (
          <Pressable key={c} onPress={() => onFiltrar(categoriaActiva === c ? '' : c)}
            style={({ pressed }) => [e.leyendaItem, pressed && { opacity: 0.6 }]}>
            <View style={[e.chincheta, { backgroundColor: COLOR_CATEGORIA[c] }]} />
            <Text style={[e.leyendaTxt, categoriaActiva === c && { color: C.tx }]}>
              {CORTO[c] || c}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  caja: {
    backgroundColor: C.noche2, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.panel, paddingVertical: 16, marginBottom: 14, alignItems: 'center',
  },
  lienzo: { width: LADO, height: LADO },
  diana: { position: 'absolute', width: 34, height: 34, borderRadius: 17 },

  lectura: {
    minHeight: 46, width: '100%', paddingHorizontal: 20, paddingTop: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  chincheta: { width: 8, height: 8, borderRadius: 4 },
  lecturaNom: { ...T.ficha, fontSize: 16, color: C.tx, marginTop: 4 },
  lecturaSub: { ...T.dato, fontSize: 11, color: C.tx2, marginTop: 2 },
  lecturaVacia: { ...T.menor, fontSize: 12, color: C.tx3, textAlign: 'center', lineHeight: 17 },

  leyenda: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 10, paddingHorizontal: 16, paddingTop: 12,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaTxt: { ...T.dato, fontSize: 10.5, color: C.tx3 },
});
