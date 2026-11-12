import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { Icono } from './Navegacion';
import { C, E, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';
import {
  RESPALDO, cargarNovedadesProducto, compararVersiones, hayNovedadesSinVer, textosNovedades, versionValida,
} from '../lib/novedades-rwadar';

/* ---------------------------------------------------------------------
   «Novedades de RWAdar» al abrir la app (12/11/2026)
   ---------------------------------------------------------------------
   Encargo: «que salga al abrir la app y como las novedades, tipo un texto
   informativo muy fácil de leer con las novedades y si clickan que salga en
   detalle». Tres piezas, con el contenido de lib/novedades-rwadar.js (el
   mismo JSON que la web):
   1. VentanaNovedades: una ventana encima de Inicio con el título, los 4-5
      puntos (icono y una línea) y dos botones, «Ver en detalle» y
      «Entendido». Sale una vez por versión, cuando ya se ve Inicio.
   2. PantallaNovedades: el detalle, a pantalla completa como «Mercado y
      noticias», con un botón a Perfil › Avisos para activar las
      notificaciones y el historial de la web.
   3. useNovedadesRwadar: decide cuándo sale. App le dice si la pantalla
      está libre («listo»: Inicio a la vista, sin acceso, bloqueo, carga ni
      otra ficha, explicador, privacidad o notificación abriéndose); espera
      a la descarga (6 s como mucho) y a saber qué versión se vio. «Entendido»,
      «Ver en detalle», el botón atrás y abrirlas desde Perfil cuentan como
      vistas. Si no se puede leer qué se vio, no sale sola (no se repite en
      cada arranque): sigue en Perfil › «Novedades de RWAdar».
   El contenido llega ya en su idioma («en» del JSON): se pinta con
   noTraducir; los botones y avisos de la interfaz, con el diccionario común.
   --------------------------------------------------------------------- */

export const SECCION_AVISOS = 'avisos-movil';
export const ESPERA_MS = 700;

export function useNovedadesRwadar({ listo = false, leerVista, marcarVista, cargar = cargarNovedadesProducto, esperaMs = ESPERA_MS } = {}) {
  const [datos, setDatos] = useState(RESPALDO);
  const [descargadas, setDescargadas] = useState(false);
  const [vista, setVista] = useState(null); // null: leyendo; { ok, version }
  const [ventana, setVentana] = useState(false);
  const [detalle, setDetalle] = useState(false);
  const ensenada = useRef(false);
  useEffect(() => {
    let vivo = true;
    Promise.resolve().then(() => cargar())
      .then((r) => { if (vivo && r?.datos && versionValida(r.datos.version)) setDatos(r.datos); })
      .catch(() => {})
      .finally(() => { if (vivo) setDescargadas(true); });
    Promise.resolve().then(() => (typeof leerVista === 'function' ? leerVista() : { ok: false }))
      .then((v) => { if (vivo) setVista(v && v.ok === true ? { ok: true, version: v.version ?? null } : { ok: false }); })
      .catch(() => { if (vivo) setVista({ ok: false }); });
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pendiente = descargadas && vista?.ok === true && hayNovedadesSinVer(datos, vista.version);
  useEffect(() => {
    if (!listo || !pendiente || ensenada.current || ventana || detalle) return undefined;
    // Un momento después de verse Inicio, para no salir de golpe al cargar.
    const reloj = setTimeout(() => { ensenada.current = true; setVentana(true); }, esperaMs);
    return () => clearTimeout(reloj);
  }, [listo, pendiente, ventana, detalle]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardarVista = () => {
    const version = datos.version;
    ensenada.current = true;
    setVista((v) => ({ ok: v?.ok === true, version: versionValida(v?.version) && compararVersiones(v.version, version) > 0 ? v.version : version }));
    Promise.resolve().then(() => marcarVista?.(version)).catch(() => {});
  };
  // Desde la ventana o desde Perfil: abre el detalle y cuenta como vistas.
  const verDetalle = () => { setVentana(false); setDetalle(true); guardarVista(); };
  return {
    datos, ventana, detalle, verDetalle,
    entendido() { setVentana(false); guardarVista(); },
    cerrarDetalle() { setDetalle(false); },
  };
}

/* Iconos: los mismos dibujos de 24 × 24 que la web (ICONOS de
   rwadar-site/assets/novedades-producto-modelo-20261112.js), con el trazo de
   la barra (1,75, redondeado). Una clave desconocida se pinta con la chispa
   genérica: el archivo sigue valiendo. */
export const ICONOS = Object.freeze({
  // Un móvil con un mensaje: los avisos que llegan al móvil.
  notificacion: ['M8 2.8h8a1.6 1.6 0 0 1 1.6 1.6v15.2a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6V4.4A1.6 1.6 0 0 1 8 2.8z',
    'M11 18.3h2', 'M9.4 8h5.2', 'M9.4 11h3.6'],
  // La campana con su globo: el número de avisos sin leer.
  contador: ['M5.2 10.6a5 5 0 0 1 9.9-1', 'M15.1 13.4c.3 2.6 1.9 2.8 1.9 3.6H3.3c0-.9 1.9-1.1 1.9-6.4',
    'M8.1 20.4h3.9', 'M16 6.6a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0'],
  // El candado: la sesión que se mantiene.
  sesion: ['M7.5 11V8a4.5 4.5 0 0 1 9 0v3', 'M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-6.5A1.5 1.5 0 0 1 6.5 11z',
    'M12 14.6v2.2'],
  // El sobre: el correo de contacto.
  correo: ['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'm3 7 9 6 9-6'],
  // La calculadora: «Calcula tus números».
  calculadora: ['M6.5 2.8h11a1.6 1.6 0 0 1 1.6 1.6v15.2a1.6 1.6 0 0 1-1.6 1.6h-11a1.6 1.6 0 0 1-1.6-1.6V4.4a1.6 1.6 0 0 1 1.6-1.6z',
    'M8.4 6.4h7.2v3.2H8.4z', 'M8.6 13.4h.01', 'M12 13.4h.01', 'M15.4 13.4h.01', 'M8.6 17h.01', 'M12 17h.01', 'M15.4 17h.01'],
});
export const ICONO_GENERICO = ['M12 3.5v4', 'M12 16.5v4', 'M3.5 12h4', 'M16.5 12h4', 'M6.3 6.3l2.6 2.6', 'M15.1 15.1l2.6 2.6',
  'M6.3 17.7l2.6-2.6', 'M15.1 8.9l2.6-2.6'];
export function IconoNovedad({ nombre, color = C.senal, tamano = 22 }) {
  const trazos = Object.hasOwn(ICONOS, nombre) ? ICONOS[nombre] : ICONO_GENERICO;
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {trazos.map((d) => <Path key={d} d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>
  );
}

/* El fondo de la ventana respeta las barras del móvil: el Modal dibuja bajo
   la barra de estado y la de navegación (statusBarTranslucent y
   navigationBarTranslucent), así que la tarjeta se separa 16 de cada una
   (con la barra de 3 botones, «Entendido» no queda pegado a ella). */
function FondoSeguro({ children }) {
  const zona = useSafeAreaInsets();
  return (
    <View testID="novedadesFondo" style={[s.fondo, {
      paddingTop: zona.top + 16, paddingBottom: zona.bottom + 16,
      paddingLeft: Math.max(zona.left, UI.margen), paddingRight: Math.max(zona.right, UI.margen) }]}>
      {children}
    </View>
  );
}

/* 1 · La ventana: título, los puntos y dos botones. */
export function VentanaNovedades({ visible, datos, onDetalle, onEntendido }) {
  const idioma = useIdioma();
  const t = textosNovedades(datos, idioma);
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onEntendido}
      statusBarTranslucent navigationBarTranslucent>
      {visible ? (
        <SafeAreaProvider>
        <FondoSeguro>
          <View style={s.tarjeta} testID="novedadesVentana" role="dialog" aria-modal accessibilityViewIsModal
            noTraducir idiomaOriginal={t.lengua} accessibilityLabel={t.titulo}>
            <ScrollView style={s.desplazable} contentContainerStyle={s.ventanaCuerpo} bounces={false}>
              <Text noTraducir idiomaOriginal={t.lengua} style={s.titulo} accessibilityRole="header">{t.titulo}</Text>
              <Text noTraducir idiomaOriginal={t.lengua} style={s.fecha}>{t.fecha}</Text>
              <View style={s.puntos}>
                {t.resumen.map((p) => (
                  <View key={p.id} style={s.punto} testID={`novedadPunto-${p.id}`} accessible
                    noTraducir idiomaOriginal={t.lengua} accessibilityLabel={`${p.titulo}. ${p.texto}`}>
                    <View style={s.puntoIcono}><IconoNovedad nombre={p.icono} /></View>
                    <View style={s.puntoTextos}>
                      <Text noTraducir idiomaOriginal={t.lengua} style={s.puntoTit}>{p.titulo}</Text>
                      <Text noTraducir idiomaOriginal={t.lengua} style={s.puntoTxt}>{p.texto}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={s.botones}>
              <Pressable testID="novedadesVerDetalle" onPress={() => { tacto.abrir(); onDetalle?.(); }}
                accessibilityRole="button" accessibilityLabel="Ver en detalle"
                accessibilityHint="Abre las novedades explicadas paso a paso"
                style={({ pressed, focused }) => [s.boton, s.botonTonal, focused && s.foco, pressed && pulsado('b2')]}>
                <Text style={s.botonTonalTxt}>Ver en detalle</Text>
              </Pressable>
              <Pressable testID="novedadesEntendido" onPress={() => { tacto.eleccion(); onEntendido?.(); }}
                accessibilityRole="button" accessibilityLabel="Entendido"
                accessibilityHint="Cierra esta ventana. Puedes volver a verla en Perfil."
                style={({ pressed, focused }) => [s.boton, s.botonVerde, focused && s.foco, pressed && pulsado('b1')]}>
                <Text style={s.botonVerdeTxt}>Entendido</Text>
              </Pressable>
            </View>
          </View>
        </FondoSeguro>
        </SafeAreaProvider>
      ) : null}
    </Modal>
  );
}

/* El botón a Perfil › Avisos, dentro de la sección de los avisos (vibra en
   irAAvisosPerfil de App.js, que es adonde lleva). */
function IrAvisos({ onPress }) {
  return (
    <View style={s.irAvisos} testID="novedadesIrAvisos">
      <Text style={s.irAvisosTxt}>Para recibir los avisos en el móvil, actívalos en Perfil › Avisos.</Text>
      <Pressable testID="novedadesBotonAvisos" onPress={() => onPress?.()}
        accessibilityRole="button" accessibilityLabel="Ir a Perfil › Avisos"
        style={({ pressed, focused }) => [s.boton, s.botonVerde, s.botonSolo, focused && s.foco, pressed && pulsado('b1')]}>
        <Text style={s.botonVerdeTxt}>Ir a Perfil › Avisos</Text>
      </Pressable>
    </View>
  );
}

/* 2 · El detalle, a pantalla completa. */
export function PantallaNovedades({ visible, datos, onCerrar, onIrAvisos, onHistorial }) {
  const idioma = useIdioma();
  const t = textosNovedades(datos, idioma);
  const conAvisos = t.detalle.some((d) => d.id === SECCION_AVISOS);
  const paso = idioma === 'en' ? 'Step' : 'Paso';
  return (
    <Modal visible={!!visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCerrar}
      statusBarTranslucent={false} navigationBarTranslucent={false}>
      {visible ? (
        <SafeAreaProvider style={s.pantalla}>
          <SafeAreaView style={s.pantalla} edges={['top', 'right', 'bottom', 'left']} accessibilityViewIsModal testID="novedadesDetalle">
            <View style={s.cab}>
              <Pressable onPress={() => { tacto.eleccion(); onCerrar?.(); }} style={({ pressed }) => [s.volver, pressed && pulsado('icono')]}
                hitSlop={6} accessibilityRole="button" accessibilityLabel="Volver" testID="novedadesVolver">
                <View style={{ transform: [{ rotate: '180deg' }] }}><Icono nombre="flecha" color={C.tx} tamano={20} /></View>
              </Pressable>
              <Text noTraducir idiomaOriginal={t.lengua} style={s.cabTit} accessibilityRole="header" numberOfLines={1}>{t.titulo}</Text>
            </View>
            <ScrollView contentContainerStyle={s.detalleCuerpo}>
              <Text noTraducir idiomaOriginal={t.lengua} style={s.fecha}>{t.fecha}</Text>
              {t.detalle.map((d, i) => (
                <View key={d.id} style={[s.seccion, i > 0 && s.seccionRaya]} testID={`novedadSeccion-${d.id}`}>
                  <Text noTraducir idiomaOriginal={t.lengua} style={s.seccionTit} accessibilityRole="header">{d.titulo}</Text>
                  {d.parrafos.map((p, j) => (
                    <Text key={j} noTraducir idiomaOriginal={t.lengua} style={s.parrafo}>{p}</Text>
                  ))}
                  {d.pasos.length ? (
                    <View style={s.pasos}>
                      {d.pasos.map((p, j) => (
                        <View key={j} style={s.paso} accessible noTraducir idiomaOriginal={t.lengua}
                          accessibilityLabel={`${paso} ${j + 1}: ${p}`}>
                          <View style={s.pasoNum}><Text noTraducir style={s.pasoNumTxt}>{j + 1}</Text></View>
                          <Text noTraducir idiomaOriginal={t.lengua} style={s.pasoTxt}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {d.id === SECCION_AVISOS ? <IrAvisos onPress={onIrAvisos} /> : null}
                </View>
              ))}
              {conAvisos ? null : <IrAvisos onPress={onIrAvisos} />}
              <Pressable testID="novedadesHistorial" onPress={() => { tacto.eleccion(); onHistorial?.(); }} accessibilityRole="link"
                hitSlop={8} style={({ pressed, focused }) => [s.enlace, focused && s.foco, pressed && { opacity: 0.7 }]}>
                <Text style={s.enlaceTxt}>Todas las novedades anteriores, en la web</Text>
              </Pressable>
              <Pressable testID="novedadesCerrar" onPress={() => { tacto.eleccion(); onCerrar?.(); }} accessibilityRole="button"
                accessibilityLabel="Entendido"
                style={({ pressed, focused }) => [s.boton, s.botonTonal, s.botonSolo, s.botonFinal, focused && s.foco, pressed && pulsado('b2')]}>
                <Text style={s.botonTonalTxt}>Entendido</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      ) : null}
    </Modal>
  );
}

const s = StyleSheet.create({
  /* Ventana: el fondo se oscurece y la tarjeta queda en medio, legible de
     320 px en adelante (con letra grande, el texto se desplaza y los botones
     siguen a la vista). Los márgenes del fondo, en FondoSeguro. */
  fondo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)' },
  tarjeta: { width: '100%', maxWidth: 440, maxHeight: '100%', backgroundColor: C.s2, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.bd, paddingTop: 22, paddingBottom: 18, ...E.e2 },
  desplazable: { flexGrow: 0, flexShrink: 1 },
  ventanaCuerpo: { paddingHorizontal: 20 },
  titulo: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx },
  fecha: { ...T.dato, color: C.tx3, marginTop: 4 },
  puntos: { marginTop: 16, gap: 14 },
  punto: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  puntoIcono: { width: 40, height: 40, borderRadius: R.m, backgroundColor: C.senalT, alignItems: 'center', justifyContent: 'center' },
  puntoTextos: { flex: 1, minWidth: 0 },
  puntoTit: { fontFamily: F.semi, fontSize: 16, lineHeight: 22, color: C.tx },
  puntoTxt: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx2, marginTop: 2 },
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18, paddingHorizontal: 20 },
  boton: { flexGrow: 1, flexBasis: 140, minHeight: UI.boton, borderRadius: R.m, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center' },
  botonSolo: { flexGrow: 0, flexBasis: 'auto', alignSelf: 'flex-start', maxWidth: '100%' },
  botonFinal: { marginTop: 24 },
  botonTonal: { backgroundColor: C.ton },
  botonTonalTxt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.tx, textAlign: 'center' },
  botonVerde: { backgroundColor: C.senal },
  botonVerdeTxt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.enSenal, textAlign: 'center' },
  foco: { borderWidth: 2, borderColor: C.tx },

  /* Detalle: como las pantallas de Inicio («Mercado y noticias»). */
  pantalla: { flex: 1, backgroundColor: C.noche },
  cab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.bd },
  volver: { width: 44, height: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center' },
  cabTit: { ...T.seccion, color: C.tx, flex: 1 },
  detalleCuerpo: { paddingHorizontal: UI.margen, paddingTop: 14, paddingBottom: 48, maxWidth: 680, width: '100%', alignSelf: 'center' },
  seccion: { paddingVertical: 20 },
  seccionRaya: { borderTopWidth: 1, borderTopColor: C.bd },
  seccionTit: { fontFamily: F.negrita, fontSize: 20, lineHeight: 26, letterSpacing: -0.2, color: C.tx, marginBottom: 6 },
  parrafo: { ...T.cuerpo, color: C.tx2, marginTop: 8 },
  pasos: { marginTop: 14, gap: 10 },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pasoNum: { width: 28, height: 28, borderRadius: R.p, backgroundColor: C.ton2, alignItems: 'center', justifyContent: 'center', marginTop: -1 },
  pasoNumTxt: { fontFamily: F.semi, fontSize: 14, lineHeight: 18, color: C.tx },
  pasoTxt: { ...T.cuerpo, color: C.tx, flex: 1, minWidth: 0 },
  irAvisos: { marginTop: 18, padding: 16, borderRadius: R.l, backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd, gap: 12 },
  irAvisosTxt: { ...T.cuerpo, color: C.tx },
  enlace: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 20, borderRadius: R.s },
  enlaceTxt: { ...T.menor, fontSize: 15, color: C.tx2, textDecorationLine: 'underline' },
});
