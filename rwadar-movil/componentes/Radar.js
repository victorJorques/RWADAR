import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import Svg, {
  Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { C, COLOR_CATEGORIA, T, F, R } from '../lib/tema';
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
const MARGEN_PORTADA = 62;         // sitio a cada lado para los rótulos de la portada
const RADIO_ACCESO = { Minorista: 0.40, Acreditado: 0.60, Empresas: 0.76, Institucional: 0.90 };
const CORTO = {
  'Inmobiliario': 'Inmuebles', 'Crédito privado': 'Crédito', 'Tesoro y fondos': 'Tesoro',
  'Acciones y capital privado': 'Acciones', 'Materias primas': 'Materias',
};

/* Los nombres cortos de la portada, los mismos que la web. */
const CORTO_PORTADA = {
  'Inmobiliario': 'Inmobiliario', 'Crédito privado': 'Crédito', 'Tesoro y fondos': 'Tesoro',
  'Acciones y capital privado': 'Acciones', 'Materias primas': 'Materias primas',
};

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

/* `portada`: el radar vivo de Inicio (ESPEC-INICIO §2.0). Sin caja, sin
   lectura ni leyenda y con el recuento de cada tipo junto a su nombre; el
   dibujo no pasa de `tamano` para dejar sitio al titular. Tocar un punto
   sigue abriendo su ficha. */
export default function Radar({ datos, onAbrir, onFiltrar, categoriaActiva, portada = false, tamano = LADO, sinRotulos = false }) {
  const idiomaActual=useIdioma();
  const giro = useRef(new Animated.Value(0)).current;
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
  const { width: ancho } = useWindowDimensions();
  const lado = portada ? Math.max(120, Math.min(tamano, ((ancho - 32) * LADO) / (LADO + 2 * (sinRotulos ? 0 : MARGEN_PORTADA))))
    : Math.max(240, Math.min(LADO, ancho - 34));
  const k = lado / LADO;
  /* En la portada los rótulos van fuera del círculo, en dos líneas (nombre y
     recuento): el lienzo se ensancha a los lados sin mover el dibujo. */
  const margen = portada && !sinRotulos ? MARGEN_PORTADA : 0;
  const ANCHO_VISTA = LADO + 2 * margen;
  const ox = margen;
  const anchoLienzo = ANCHO_VISTA * k;

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.timing(giro, {
        toValue: 1, duration: VUELTA, easing: Easing.linear, useNativeDriver: true,
      })
    );
    bucle.start();
    return () => bucle.stop();
  }, [giro]);

  const puntos = useMemo(() => puntosRadar(datos || []), [datos]);

  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={portada ? e.cajaPortada : e.caja}>
      <View style={[e.lienzo, { width: anchoLienzo, height: lado }]}>
        <Svg width={anchoLienzo} height={lado} viewBox={`${-ox} 0 ${ANCHO_VISTA} ${LADO}`}>
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
            const angulo = -90 + i * 60;
            const opacidad = categoriaActiva && categoriaActiva !== c ? 0.35 : 1;
            if (portada && sinRotulos) return null;
            if (!portada) {
              const [tx, ty] = pol(angulo, RMAX + 16);
              return (
                <SvgText key={c} x={tx} y={ty} fill={COLOR_CATEGORIA[c]}
                  fontSize={11} fontFamily={F.semi} textAnchor="middle" opacity={opacidad}>
                  {traducir(CORTO[c] || c)}
                </SvgText>
              );
            }
            // Portada: nombre del tipo y, debajo, cuántas plataformas hay.
            const [tx, ty] = pol(angulo, RMAX + 12);
            const ancla = Math.abs(Math.cos((angulo * Math.PI) / 180)) < 0.1 ? 'middle' : Math.cos((angulo * Math.PI) / 180) > 0 ? 'start' : 'end';
            const arriba = angulo === -90, abajo = angulo === 90;
            const y0 = arriba ? ty - 20 : abajo ? ty + 12 : ty - 4;
            const total = (datos || []).filter((p) => p.categoria === c).length;
            return (
              <G key={c} opacity={opacidad}>
                <SvgText x={tx} y={y0} fill={COLOR_CATEGORIA[c]} fontSize={13} fontFamily={F.semi} textAnchor={ancla}>
                  {traducir(CORTO_PORTADA[c] || c)}
                </SvgText>
                <SvgText x={tx} y={y0 + 15} fill={C.tx2} fontSize={13} fontFamily={F.media} textAnchor={ancla}>
                  {String(total)}
                </SvgText>
              </G>
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

          <Circle cx={CX} cy={CY} r={2.6} fill={C.senal} />
        </Svg>

        {/* El barrido, en su propia capa: una cola que se apaga, no una
            porción de tarta. Un radar deja estela de fósforo; el borde duro
            delataba el truco. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotacion }] }]}>
          <Svg width={anchoLienzo} height={lado} viewBox={`${-ox} 0 ${ANCHO_VISTA} ${LADO}`}>
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
              left: punto.x * k - TAMANO_DIANA / 2 + ox * k,
              top: punto.y * k - TAMANO_DIANA / 2,
            }]}
            accessibilityRole="button"
            noTraducir idiomaOriginal={idiomaActual==='en'?'en-US':'es-ES'}
            accessibilityLabel={`${punto.p.nombre}. ${traducir(punto.p.categoria)}. ${traducir('Estado de acceso:')} ${traducir(accesoLegible(punto.p))}. ${traducir('Abrir ficha.')}`} />
        ))}
      </View>

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
  cajaPortada: { alignItems: 'center' },
  /* El tamaño va inline: depende del ancho de la pantalla. Aquí solo lo
     que no cambia. */
  lienzo: {},
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

  leyenda: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 10, paddingHorizontal: 16, paddingTop: 12,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaTxt: { ...T.dato, fontSize: 12, color: C.tx3 },
});
