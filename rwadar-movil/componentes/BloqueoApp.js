import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text } from './Idioma';
import { C, F, T } from '../lib/tema';
import * as idioma from '../lib/idioma';

export default function BloqueoApp({ preparando = false, ocupado = false,
  mensaje = '', onDesbloquear, onSalir }) {
  const esperando = preparando || ocupado;
  return <SafeAreaView style={s.pagina} edges={['top', 'right', 'bottom', 'left']}>
    <ScrollView contentContainerStyle={s.contenido}>
      <Text style={s.marca}>RWAdar</Text>
      <Text accessibilityRole="header" style={s.titulo}>Tu radar está protegido</Text>
      <Text style={s.texto}>Desbloquea con la huella, la cara o el PIN que tengas configurado en este móvil.</Text>
      <Text style={s.detalle}>Tu sesión sigue abierta. RWAdar no conoce ni guarda el código del dispositivo.</Text>
      {mensaje ? <Text accessibilityRole="alert" style={s.mensaje}>{mensaje}</Text> : null}
      {esperando ? <ActivityIndicator size="small" color={C.senal}
        accessibilityLabel={idioma.traducir(preparando ? 'Comprobando el bloqueo' : 'Comprobando tu identidad')} /> : null}
      <Pressable onPress={onDesbloquear} disabled={esperando}
        accessibilityRole="button" accessibilityLabel="Desbloquear RWAdar"
        accessibilityState={{ disabled: esperando, busy: esperando }}
        style={({ pressed }) => [s.boton, esperando && s.espera, pressed && s.pulsado]}>
        <Text style={s.botonTexto}>{preparando ? 'Comprobando…' : ocupado ? 'Espera un momento…' : 'Desbloquear RWAdar'}</Text>
      </Pressable>
      <Pressable onPress={onSalir} disabled={ocupado} accessibilityRole="button"
        accessibilityLabel="Cerrar sesión" accessibilityState={{ disabled: ocupado }}
        style={({ pressed }) => [s.salir, pressed && s.pulsado]}>
        <Text style={s.salirTexto}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: C.noche },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18,
    maxWidth: 560, width: '100%', alignSelf: 'center', paddingVertical: 36 },
  marca: { fontFamily: F.negrita, fontSize: 22, color: C.senal, marginBottom: 14 },
  titulo: { ...T.titular, color: C.tx },
  texto: { ...T.cuerpo, color: C.tx2 },
  detalle: { ...T.menor, color: C.tx2 },
  mensaje: { ...T.menor, color: C.tx, borderLeftWidth: 2, borderLeftColor: C.senal,
    paddingLeft: 12 },
  boton: { backgroundColor: C.senal, borderRadius: 14, minHeight: 52,
    paddingHorizontal: 18, paddingVertical: 15, justifyContent: 'center', alignItems: 'center' },
  botonTexto: { ...T.cuerpoFte, color: C.noche, textAlign: 'center' },
  salir: { minHeight: 48, padding: 12, justifyContent: 'center', alignItems: 'center' },
  salirTexto: { ...T.cuerpoFte, color: C.tx2, textAlign: 'center' },
  espera: { opacity: .6 }, pulsado: { opacity: .75 },
});
