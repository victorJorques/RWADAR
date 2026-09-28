import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { C, F, UI } from '../lib/tema';

/* Iconos geométricos propios de RWAdar. Comparten el lenguaje de línea
   del logotipo, pero no reproducen el juego de iconos de ninguna app de
   referencia. Al estar en SVG se ven igual de nítidos en Android e iOS. */
export function Icono({ nombre, color = C.tx2, tamano = UI.icono }) {
  const comun = {
    fill: 'none', stroke: color, strokeWidth: 1.9,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      {nombre === 'radar' ? (
        <>
          <Circle cx="12" cy="12" r="8" {...comun} />
          <Circle cx="12" cy="12" r="3" {...comun} />
          <Line x1="12" y1="12" x2="18" y2="7" {...comun} />
          <Circle cx="16.8" cy="14.8" r="1" fill={color} stroke="none" />
        </>
      ) : null}
      {nombre === 'siguiendo' ? (
        <>
          <Path d="M6.5 3.5h11v17l-5.5-3.4-5.5 3.4z" {...comun} />
          <Path d="m9.3 10.8 1.8 1.8 3.8-4" {...comun} />
        </>
      ) : null}
      {nombre === 'ofertas' ? (
        <>
          <Path d="M4 8.5h16v10.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" {...comun} />
          <Path d="M8.5 8.5V6.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2.3M4 12.5c4.8 2 11.2 2 16 0" {...comun} />
          <Circle cx="12" cy="13.4" r="1.1" fill={color} stroke="none" />
        </>
      ) : null}
      {nombre === 'avisos' ? (
        <>
          <Path d="M6.7 9.8a5.3 5.3 0 0 1 10.6 0c0 6 2.2 6.2 2.2 7.2h-15c0-1 2.2-1.2 2.2-7.2z" {...comun} />
          <Path d="M9.7 20h4.6" {...comun} />
          <Circle cx="18.2" cy="5.2" r="2.2" fill={C.coral} stroke={C.noche2} strokeWidth="1.2" />
        </>
      ) : null}
      {nombre === 'mas' ? (
        <>
          <Circle cx="5" cy="12" r="1.4" fill={color} stroke="none" />
          <Circle cx="12" cy="12" r="1.4" fill={color} stroke="none" />
          <Circle cx="19" cy="12" r="1.4" fill={color} stroke="none" />
          <Circle cx="12" cy="12" r="9" {...comun} opacity="0.48" />
        </>
      ) : null}
      {nombre === 'ayuda' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...comun} />
          <Path d="M9.8 9a2.4 2.4 0 1 1 3.2 2.3c-.8.35-1 1-1 1.7" {...comun} />
          <Circle cx="12" cy="17" r="1" fill={color} stroke="none" />
        </>
      ) : null}
      {nombre === 'actualizar' ? (
        <>
          <Path d="M19 8a7.5 7.5 0 1 0 .2 7.5" {...comun} />
          <Path d="M19 3.8V8h-4.2" {...comun} />
        </>
      ) : null}
      {nombre === 'privacidad' ? (
        <>
          <Path d="M12 3 19 6v5.2c0 4.5-2.8 7.7-7 9.8-4.2-2.1-7-5.3-7-9.8V6z" {...comun} />
          <Path d="m9.2 12 1.8 1.8 3.9-4" {...comun} />
        </>
      ) : null}
      {nombre === 'enlace' ? (
        <>
          <Path d="M10 7H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" {...comun} />
          <Path d="M13 3h8v8M21 3l-10 10" {...comun} />
        </>
      ) : null}
      {nombre === 'correo' ? (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="2.5" {...comun} />
          <Path d="m4.5 7 7.5 6 7.5-6" {...comun} />
        </>
      ) : null}
      {nombre === 'borrar' ? (
        <>
          <Path d="M5.5 7h13M9 7V4h6v3M7.5 7l.8 13h7.4l.8-13" {...comun} />
          <Line x1="10.5" y1="10.5" x2="10.8" y2="17" {...comun} />
          <Line x1="13.5" y1="10.5" x2="13.2" y2="17" {...comun} />
        </>
      ) : null}
      {nombre === 'buscar' ? (
        <>
          <Circle cx="10.5" cy="10.5" r="6.5" {...comun} />
          <Line x1="15.5" y1="15.5" x2="21" y2="21" {...comun} />
        </>
      ) : null}
      {nombre === 'flecha' ? <Path d="m9 5 7 7-7 7" {...comun} /> : null}
    </Svg>
  );
}

const DESTINOS = [
  ['radar', 'Radar', 'radar'],
  ['ofertas', 'Ofertas', 'ofertas'],
  ['sigo', 'Siguiendo', 'siguiendo'],
  ['avisos', 'Avisos', 'avisos'],
  ['mas', 'Más', 'mas'],
];

export default function Navegacion({ activa, seguimientos, novedades, onCambiar, mostrarOfertas = false }) {
  const insets = useSafeAreaInsets();
  const destinos = mostrarOfertas ? DESTINOS : DESTINOS.filter(([id]) => id !== 'ofertas');
  return (
    <View
      style={[e.barra, { paddingBottom: Math.max(insets.bottom, 7) }]}
      accessibilityRole="tablist"
      accessibilityLabel="Navegación principal"
    >
      {destinos.map(([id, etiqueta, icono]) => {
        const seleccionada = activa === id;
        const insignia = id === 'sigo' ? seguimientos : id === 'avisos' ? novedades : 0;
        const color = seleccionada ? C.senal : C.tx3;
        return (
          <Pressable
            key={id}
            onPress={() => onCambiar(id)}
            style={({ pressed }) => [e.destino, pressed && e.pulsado]}
            accessibilityRole="tab"
            accessibilityLabel={`${etiqueta}${insignia ? `, ${insignia}` : ''}`}
            accessibilityState={{ selected: seleccionada }}
            hitSlop={4}
          >
            <View style={e.iconoCaja}>
              <Icono nombre={icono} color={color} />
              {insignia ? (
                <View style={e.insignia}>
                  <Text style={e.insigniaTxt}>{insignia > 99 ? '99+' : insignia}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[e.etiqueta, seleccionada && e.etiquetaOn]} numberOfLines={1}>
              {etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const e = StyleSheet.create({
  barra: {
    minHeight: UI.nav, flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.noche2, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.linea2, paddingTop: 8,
  },
  destino: {
    flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  pulsado: { opacity: 0.66, transform: [{ scale: 0.98 }] },
  iconoCaja: { width: 32, height: 27, alignItems: 'center', justifyContent: 'center' },
  insignia: {
    position: 'absolute', right: -5, top: -4, minWidth: 17, height: 17,
    paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.coral,
    borderWidth: 1.5, borderColor: C.noche2, alignItems: 'center', justifyContent: 'center',
  },
  insigniaTxt: { color: C.tx, fontFamily: F.negrita, fontSize: 8.5, lineHeight: 11 },
  etiqueta: { color: C.tx3, fontFamily: F.media, fontSize: 11.5, lineHeight: 15 },
  etiquetaOn: { color: C.senal, fontFamily: F.semi },
});
