import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, SelectorIdioma, Text, View } from './Idioma';
import Cuenta from './Cuenta';
import AvisosSinCuenta from './AvisosSinCuenta';
import { C, F } from '../lib/tema';

/* `sinCuenta` (14/11/2026): las notificaciones sin cuenta, encima del
   formulario de la cuenta ({ desdeNotificacion } si se ha abierto desde una
   notificación). Sin él (interruptor apagado), la pantalla de siempre. */
export default function AccesoObligatorio({ controlador, estado, onAbrirEnlace, aviso = null, avisosNovedades = false, sinCuenta = null }) {
  // «aviso»: una versión nueva puede ser justo la que arregla el acceso.
  return <SafeAreaView style={s.pagina} edges={['top', 'right', 'bottom', 'left']}>
    {aviso}
    {/* Sin cuenta no se llega a Perfil: el idioma se elige también aquí
        (prueba en móvil, 04/11/2026). */}
    <SelectorIdioma />
    <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
      <Text style={s.marca}>RWAdar</Text>
      <Text accessibilityRole="header" style={s.titulo}>Tu radar, con tu cuenta</Text>
      <Text style={s.descripcion}>Entra o crea una cuenta gratuita. En «Mis inversiones» puedes registrar lo que compraste, sus valoraciones y lo cobrado, y ver tu resultado en la web y la app con tu cuenta. El registro es manual. Confirma tu correo antes de entrar.</Text>
      {sinCuenta ? <AvisosSinCuenta desdeNotificacion={sinCuenta.desdeNotificacion === true} onAbrirEnlace={onAbrirEnlace}
        gestor={sinCuenta.gestor || null} /> : null}
      {controlador && estado ? <Cuenta controlador={controlador} estado={estado}
        plataformas={[]} onAbrirEnlace={onAbrirEnlace} avisosNovedades={avisosNovedades === true} /> :
        <View accessibilityRole="progressbar"><ActivityIndicator color={C.tx} /><Text style={s.descripcion}>Preparando el acceso…</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: C.noche },
  contenido: { flexGrow: 1, padding: 20, paddingBottom: 40, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  marca: { fontFamily: F.negrita, color: C.tx, fontSize: 24 },
  titulo: { fontFamily: F.negrita, color: C.tx, fontSize: 28, lineHeight: 36 },
  descripcion: { fontFamily: F.regular, color: C.tx2, fontSize: 16, lineHeight: 24 },
});
