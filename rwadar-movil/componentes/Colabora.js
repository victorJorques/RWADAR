import React, { useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Pressable, Text, View } from './Idioma';
import { Icono } from './Navegacion';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «¿Quieres colaborar con nosotros?» (12/11/2026)
   ---------------------------------------------------------------------
   El encargo: «un apartado al final de Inicio y Perfil tipo ¿Quieres
   colaborar con nosotros? y el correo de contacto». Un solo componente para
   las dos pantallas, con los mismos textos que la web (#colaboraPlantilla de
   rwadar-site/index.html); el inglés sale del diccionario común
   (lib/idioma-en.js). Desde el 12/11/2026, rwadares@gmail.com es el único
   correo de contacto de RWAdar (también para privacidad, derechos y avisos
   legales). El enlace a la transparencia comercial explica de qué vive RWAdar.
   Si el móvil no tiene con qué abrir el correo, se dice y la dirección
   queda escrita para copiarla (texto seleccionable).
   --------------------------------------------------------------------- */

export const CORREO_COLABORA = 'rwadares@gmail.com';
export const MAILTO_COLABORA = `mailto:${CORREO_COLABORA}`;
export const URL_TRANSPARENCIA = 'https://rwadar.pages.dev/transparencia-comercial';
export const TEXTOS_COLABORA = Object.freeze({
  titulo: '¿Quieres colaborar con nosotros?',
  texto: 'Si eres una plataforma o un emisor, trabajas en el sector o quieres proponer una mejora, escríbenos.',
  nota: 'Colaborar no compra un puesto en el catálogo: las ofertas se eligen con criterios editoriales y hoy RWAdar no cobra comisiones por las inversiones.',
  boton: `Escríbenos: ${CORREO_COLABORA}`,
  pista: 'Abre tu aplicación de correo',
  fallo: 'No se pudo abrir tu aplicación de correo. Copia la dirección:',
  transparencia: 'Transparencia comercial',
});

export default function Colabora({ enPerfil = false, abrirCorreo = (url) => Linking.openURL(url), abrirWeb = (url) => Linking.openURL(url) }) {
  const [fallo, setFallo] = useState(false);
  async function escribir() {
    tacto.abrir();
    try {
      await abrirCorreo(MAILTO_COLABORA);
      setFallo(false);
    } catch {
      setFallo(true);
    }
  }
  const t = TEXTOS_COLABORA;
  return (
    <View style={[e.bloque, enPerfil && e.bloquePerfil]} testID="colabora">
      <Text style={[e.titulo, enPerfil && e.tituloPerfil]} accessibilityRole="header">{t.titulo}</Text>
      <Text style={e.texto}>{t.texto}</Text>
      <Text style={e.nota}>{t.nota}</Text>
      <Pressable testID="colaboraCorreo" onPress={escribir} accessibilityRole="link"
        accessibilityLabel={t.boton} accessibilityHint={t.pista}
        style={({ pressed, focused }) => [e.boton, focused && e.botonFoco, pressed && pulsado('b1')]}>
        <Icono nombre="correo" color={C.enSenal} tamano={20} />
        <Text style={e.botonTxt}>{t.boton}</Text>
      </Pressable>
      {fallo ? (
        <View style={e.fallo} testID="colaboraFallo">
          <Text style={e.falloTxt} accessibilityRole="alert">{t.fallo}</Text>
          <Text noTraducir selectable style={e.correo}>{CORREO_COLABORA}</Text>
        </View>
      ) : null}
      <Pressable testID="colaboraTransparencia" accessibilityRole="link" hitSlop={8}
        onPress={() => { Promise.resolve().then(() => abrirWeb(URL_TRANSPARENCIA)).catch(() => {}); }}
        style={({ pressed, focused }) => [e.enlace, focused && e.enlaceFoco, pressed && { opacity: 0.7 }]}>
        <Text style={e.enlaceTxt}>{t.transparencia}</Text>
      </Pressable>
    </View>
  );
}

const e = StyleSheet.create({
  /* El mismo ritmo que los bloques de Inicio: raya, título y aire. */
  bloque: { marginTop: 36, paddingTop: 32, borderTopWidth: 1, borderTopColor: C.bd },
  bloquePerfil: { marginTop: 28, paddingTop: 24 },
  titulo: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx },
  tituloPerfil: { fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  texto: { ...T.menor, fontSize: 16, lineHeight: 23, color: C.tx2, marginTop: 6 },
  nota: { ...T.menor, fontSize: 15, lineHeight: 22, color: C.tx2, marginTop: 10 },
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'flex-start', maxWidth: '100%',
    minHeight: UI.boton, marginTop: 18, paddingHorizontal: 20, paddingVertical: 12, borderRadius: R.m, backgroundColor: C.senal },
  botonFoco: { borderWidth: 2, borderColor: C.tx },
  botonTxt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.enSenal, flexShrink: 1 },
  fallo: { marginTop: 12, gap: 4 },
  falloTxt: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx2 },
  correo: { fontFamily: F.semi, fontSize: 16, lineHeight: 22, color: C.tx },
  enlace: { alignSelf: 'flex-start', minHeight: 24, justifyContent: 'center', marginTop: 14, borderRadius: R.s },
  enlaceFoco: { borderWidth: 2, borderColor: C.senal },
  enlaceTxt: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx2, textDecorationLine: 'underline' },
});
