import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { textosActualizacion } from '../lib/actualizaciones-app';
import { C, F, R, T } from '../lib/tema';

// Aviso fijo bajo la cabecera cuando hay algo que aplicar: una mejora ya
// descargada o una versión Android nueva. Ocultarlo no cancela nada; la
// misma acción sigue en Perfil.
export default function AvisoActualizacion({ resumen, onActualizar, onOcultar }) {
  const idioma = useIdioma();
  if (resumen?.tipo !== 'mejora' && resumen?.tipo !== 'version') return null;
  const textos = textosActualizacion(resumen, { idioma });
  const lengua = idioma === 'en' ? 'en' : 'es-ES';
  return (
    <View style={s.aviso} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={s.textos}>
        <Text noTraducir idiomaOriginal={lengua} style={s.titulo}>{textos.aviso}</Text>
        <Text noTraducir idiomaOriginal={lengua} style={s.detalle}>{textos.detalle}</Text>
      </View>
      <Pressable onPress={onActualizar} accessibilityRole="button" accessibilityLabel={textos.titulo}
        style={({ pressed }) => [s.boton, pressed && s.pulsado]}>
        <Text noTraducir idiomaOriginal={lengua} style={s.botonTxt}>{textos.boton}</Text>
      </Pressable>
      <Pressable onPress={onOcultar} accessibilityRole="button" hitSlop={10}
        accessibilityLabel={idioma === 'en' ? 'Hide notice' : 'Ocultar aviso'}
        style={({ pressed }) => [s.cerrar, pressed && s.pulsado]}>
        <Text noTraducir style={s.cerrarTxt}>×</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  aviso: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingLeft: 16, paddingRight: 8, paddingVertical: 10,
    backgroundColor: C.senal10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.senal34,
  },
  textos: { flex: 1, minWidth: 0 },
  titulo: { ...T.menor, fontFamily: F.semi, color: C.senal },
  detalle: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx2 },
  boton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: R.pastilla, backgroundColor: C.senal },
  botonTxt: { ...T.menor, fontFamily: F.semi, color: C.noche },
  cerrar: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  cerrarTxt: { fontSize: 22, lineHeight: 24, color: C.tx2 },
  pulsado: { opacity: 0.7 },
});
