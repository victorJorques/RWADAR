import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, ScrollView, Text, View } from './Idioma';
import { C, T, R, F } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* =====================================================================
   ¿Qué es tokenizar?
   ---------------------------------------------------------------------
   La misma narración que el explicador 3D de la web, contada con
   animación nativa en lugar de WebGL. En un teléfono esto va más suelto,
   gasta menos batería y nunca se queda sin arrancar.

   La retícula es uniforme a propósito: si las piezas fueran desiguales
   no serían participaciones, y el dibujo contradiría al texto.
   ===================================================================== */

const COLS = 5, FILAS = 8, LADO = 24, SEP = 6;
const TOTAL = COLS * FILAS;
const ANCHO_JUNTO = COLS * LADO;
const ALTO_JUNTO  = FILAS * LADO;
const ANCHO_SEP   = COLS * LADO + (COLS - 1) * SEP;
const ALTO_SEP    = FILAS * LADO + (FILAS - 1) * SEP;

/* Sale una de cada seis, siempre las mismas. Si saliera un tercio
   parecería que el edificio estalla en vez de que unos pocos venden. */
const vuela = (i) => i % 6 === 2;

export const PASOS = [
  { c: 'Activo', t: 'Empieza por el activo real',
    d: 'Usamos un local de 300.000 € como ejemplo educativo. El edificio permanece entero: lo que vamos a representar son derechos definidos en un contrato.' },
  { c: 'Dividido', t: 'Se divide en participaciones iguales',
    d: 'En este ejemplo, las participaciones representan derechos económicos. En un producto real, el contrato define esos derechos: tener el token no implica automáticamente ser propietario del inmueble.' },
  { c: 'Con dueño', t: 'Cada participación tiene su dueño',
    d: 'Los colores representan titulares. Las participaciones se anotan en un registro digital; la información accesible depende del sistema. Ese registro no garantiza que exista el activo ni que se cumpla el contrato.' },
  { c: 'Negociable', t: 'Se venden sin tocar el resto',
    d: 'Una participación puede cambiar de titular sin vender el edificio entero, si el contrato permite la transferencia y hay comprador. No hay venta inmediata ni liquidez garantizada.' },
];

function Bloque({ i, paso }) {
  const col = i % COLS, fila = Math.floor(i / COLS);

  /* Posiciones: pegadas primero, con junta después. Se centra restando
     medio ancho para que el conjunto no se desplace al separarse. */
  const jx = col * LADO - ANCHO_JUNTO / 2;
  const jy = fila * LADO - ALTO_JUNTO / 2;
  const sx = col * (LADO + SEP) - ANCHO_SEP / 2;
  const sy = fila * (LADO + SEP) - ALTO_SEP / 2;

  const sale = vuela(i);
  const ang = (i * 2.399) % (Math.PI * 2);          /* reparto uniforme */
  const fx = sale ? sx + Math.cos(ang) * 74 : sx;
  const fy = sale ? sy - 24 - (i % 5) * 9 : sy;

  const x = paso.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [jx, sx, sx, fx] });
  const y = paso.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [jy, sy, sy, fy] });
  const giro = paso.interpolate({
    inputRange: [2, 3],
    outputRange: ['0deg', sale ? `${((i % 7) - 3) * 14}deg` : '0deg'],
    extrapolate: 'clamp',
  });
  /* El color de dueño entra por opacidad, no cambiando el color de fondo:
     así toda la animación corre en el hilo nativo y no salta. */
  const opDueno = paso.interpolate({ inputRange: [1, 2], outputRange: [0, 1], extrapolate: 'clamp' });
  const opVuelo = paso.interpolate({ inputRange: [2, 3], outputRange: [1, sale ? 0.9 : 1], extrapolate: 'clamp' });

  return (
    <Animated.View
      style={[e.bloque, {
        opacity: opVuelo,
        transform: [{ translateX: x }, { translateY: y }, { rotate: giro }],
      }]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, {
          backgroundColor: C.duenos[i % C.duenos.length],
          opacity: opDueno,
          borderRadius: 3,
        }]}
      />
    </Animated.View>
  );
}

export default function ExplicadorNativo({ onCerrar }) {
  const [paso, setPaso] = useState(0);
  const [reducirMovimiento, setReducirMovimiento] = useState(true);
  const { height: alto } = useWindowDimensions();
  const texto = useRef(null);
  const valor = useRef(new Animated.Value(0)).current;
  const bloques = useMemo(() => Array.from({ length: TOTAL }, (_, i) => i), []);

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo?.isReduceMotionEnabled?.().then(v => { if (vivo) setReducirMovimiento(v); }).catch(() => {});
    const escucha = AccessibilityInfo?.addEventListener?.('reduceMotionChanged', setReducirMovimiento);
    return () => { vivo = false; escucha?.remove?.(); };
  }, []);

  /* Un solo valor mueve los 40 bloques: cada uno deduce su posición de
     él. Es lo que mantiene la animación fluida sin 40 temporizadores. */
  useEffect(() => {
    const animacion = Animated.timing(valor, {
      toValue: paso, duration: reducirMovimiento ? 0 : 600, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true,
    });
    animacion.start();
    return () => animacion.stop();
  }, [paso, valor, reducirMovimiento]);

  const elegir = (i) => {
    if (!Number.isInteger(i) || i < 0 || i >= PASOS.length) return;
    tacto.eleccion(); setPaso(i); texto.current?.scrollTo({ y: 0, animated: !reducirMovimiento });
  };

  const p = PASOS[paso];

  return (
    <View style={e.pantalla}>
      <View style={e.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={e.arriba}>ACADEMY · TUTORIAL GUIADO</Text>
          <Text style={e.titulo}>¿Qué es tokenizar{'\n'}un activo?</Text>
        </View>
        <Pressable onPress={() => { tacto.eleccion(); onCerrar(); }} style={e.cerrar} hitSlop={10}
          accessibilityRole="button" accessibilityLabel="Cerrar tutorial y volver a Academy">
          <Text style={e.cerrarTxt}>✕</Text>
        </Pressable>
      </View>

      <ScrollView ref={texto} contentContainerStyle={e.tutorial}>
      <View style={[e.escena, { height: Math.max(160, Math.min(260, alto * 0.3)) }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={e.lienzo}>
          {bloques.map((i) => <Bloque key={i} i={i} paso={valor} />)}
        </View>
      </View>

      <View style={e.pasos}>
        {PASOS.map((s, i) => (
          <Pressable key={i} onPress={() => elegir(i)}
            style={[e.pastilla, i === paso && e.pastillaOn]}
            accessibilityRole="button" accessibilityLabel={`Paso ${i + 1}: ${s.c}`}
            accessibilityState={{ selected: i === paso }}>
            <Text style={[e.pastillaTxt, i === paso && e.pastillaTxtOn]}>{i + 1} · {s.c}</Text>
          </Pressable>
        ))}
      </View>

      <View style={e.texto}>
        <Text style={e.pasoNum} accessibilityLiveRegion="polite">PASO {paso + 1} DE {PASOS.length}</Text>
        <Text style={e.pasoTit}>{p.t}</Text>
        <Text style={e.pasoDes}>{p.d}</Text>
        <View style={e.mandos}>
          <Pressable disabled={paso === 0} accessibilityRole="button" accessibilityState={{ disabled: paso === 0 }}
            onPress={() => elegir(paso - 1)} style={[e.mando, paso === 0 && e.deshabilitado]}>
            <Text style={e.mandoTexto}>← Anterior</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => paso === PASOS.length - 1 ? onCerrar() : elegir(paso + 1)} style={e.mando}>
            <Text style={e.mandoTexto}>{paso === PASOS.length - 1 ? 'Volver a Academy' : 'Siguiente →'}</Text>
          </Pressable>
        </View>
        <Text style={e.nota}>
          El token no protege frente a insolvencia, fraude o falta de liquidez.
          Consulta la entidad, el contrato y el alcance de los permisos de cada producto.
          Estar en RWAdar no es una aprobación ni confirma disponibilidad para invertir.
          Si decides invertir, el pago se realiza directamente con la empresa; RWAdar
          no recibe ni custodia ese dinero.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const e = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.noche },
  tutorial: { paddingBottom: 24 },
  mandos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  mando: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: C.sup2, justifyContent: 'center' },
  mandoTexto: { ...T.cuerpo, color: C.senal },
  deshabilitado: { opacity: 0.4 },
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 22, paddingBottom: 8 },
  arriba: { ...T.etiqueta, color: C.tx3, marginBottom: 8 },
  titulo: { ...T.titular, color: C.tx },
  cerrar: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sup2,
  },
  cerrarTxt: { color: C.tx2, fontSize: 15, fontFamily: F.media },

  /* La escena era azul noche porque el edificio era de piedra sobre un
     cielo azul. Ahora el fondo es el mismo cristal negro que en la web,
     y los bloques salen del gris cálido de las superficies: así el único
     color de la pantalla lo pone el dueño de cada participación. */
  escena: {
    height: 330, marginHorizontal: 18, borderRadius: R.xl, overflow: 'hidden',
    backgroundColor: C.noche2, borderWidth: 1, borderColor: C.linea,
    alignItems: 'center', justifyContent: 'center',
  },
  lienzo: { width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  bloque: {
    position: 'absolute', width: LADO, height: LADO, borderRadius: 3,
    backgroundColor: C.sup3, borderWidth: 1,
    borderColor: C.linea2,
  },

  pasos: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 18, paddingTop: 18 },
  pastilla: {
    borderWidth: 1, borderColor: C.linea2, borderRadius: R.p,
    paddingHorizontal: 13, paddingVertical: 7, overflow: 'hidden',
  },
  pastillaOn: { backgroundColor: C.senal, borderColor: C.senal },
  avance: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,10,10,0.22)',
    transformOrigin: 'left',
  },
  pastillaTxt: { ...T.dato, color: C.tx2 },
  pastillaTxtOn: { color: C.noche, fontFamily: F.semi },

  texto: { padding: 22, paddingTop: 18 },
  pasoNum: { ...T.etiqueta, color: C.tx3, marginBottom: 7 },
  pasoTit: { ...T.seccion, color: C.tx, marginBottom: 9 },
  pasoDes: { ...T.cuerpo, color: C.tx2 },
  nota: { ...T.menor, color: C.tx3, marginTop: 22 },
});
