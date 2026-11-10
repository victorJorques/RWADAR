import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, Polygon, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { cargarNoticias } from '../lib/noticias-sector-remota';
import { etiquetaAmbito, etiquetaCategoria, fechaBreve, fechaCorta, ilustracion, textos } from '../lib/noticias-sector';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Noticias del sector» en Inicio (10/11/2026), como la web
   ---------------------------------------------------------------------
   Lee /datos/noticias.json de rwadar.pages.dev (lib/noticias-sector-remota.js).
   Un carrusel horizontal (FlatList con ajuste) de tarjetas grandes: la
   ilustración propia de su categoría y ámbito (lib/noticias-sector.js, la
   misma que la web), solo el titular encima, en 3 líneas como mucho, y «Hoy»
   si es del día. Cada tarjeta es un botón con el titular entero como
   nombre. Al pulsar, el detalle en un modal: fecha, titular, resumen, «Por
   qué te importa», la fuente y «Leer en la fuente (sales de RWAdar) ↗», que
   abre el enlace con onAbrirEnlace (el de App.js: solo https). Con la red
   caída, la sección lo dice y ofrece reintentar. Los textos de cada noticia
   salen del archivo en el idioma elegido; los de la interfaz, de
   lib/idioma-en.js.
   --------------------------------------------------------------------- */
const COMPONENTES = { rect: Rect, circle: Circle, ellipse: Ellipse, path: Path, line: Line, polyline: Polyline, polygon: Polygon };
const GRADIENTES = { linearGradient: LinearGradient, radialGradient: RadialGradient };
const SEPARACION = 12;

/* El dibujo de una noticia, el mismo que la web (sin texto, solo formas). */
export function Ilustracion({ noticia, ancho, alto, velo = false, encuadre = 'xMidYMid slice' }) {
  const d = ilustracion(noticia, { velo, prefijo: velo ? 'ntt' : 'ntd' });
  return (
    <Svg width={ancho} height={alto} viewBox={`0 0 ${d.ancho} ${d.alto}`} preserveAspectRatio={encuadre}
      accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Defs>
        {d.defs.map((g) => {
          const Gradiente = GRADIENTES[g.el];
          return (
            <Gradiente key={g.a.id} {...g.a}>
              {g.stops.map((s, i) => <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />)}
            </Gradiente>
          );
        })}
      </Defs>
      {d.formas.map((f, i) => {
        const Forma = COMPONENTES[f.el];
        return Forma ? <Forma key={i} {...f.a} /> : null;
      })}
    </Svg>
  );
}

function Tarjeta({ noticia, ancho, idioma, onAbrir }) {
  const t = textos(noticia, idioma);
  const alto = Math.round(ancho * 1.25);
  const hoy = noticia.seccion === 'hoy';
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrir(noticia); }}
      style={({ pressed }) => [e.tarjeta, { width: ancho, height: alto }, pressed && e.tarjetaPulsada]}
      accessibilityRole="button" noTraducir idiomaOriginal={idioma === 'en' ? 'en-US' : 'es-ES'}
      // El nombre es el titular entero (el «…» de la tarjeta es solo visual) y, después, «Hoy».
      accessibilityLabel={hoy ? `${t.titulo}. ${traducir('Hoy')}` : t.titulo}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Ilustracion noticia={noticia} ancho={ancho} alto={alto} velo />
      </View>
      {hoy ? (
        <View style={e.hoy}>
          <View style={e.hoyPunto} />
          <Text style={e.hoyTxt}>Hoy</Text>
        </View>
      ) : null}
      <View style={e.titularCaja}>
        <Text noTraducir style={e.titular} numberOfLines={3} ellipsizeMode="tail">{t.titulo}</Text>
      </View>
    </Pressable>
  );
}

function Detalle({ noticia, idioma, onCerrar, onAbrirEnlace }) {
  const { width } = useWindowDimensions();
  if (!noticia) return null;
  const t = textos(noticia, idioma);
  const lengua = idioma === 'en' ? 'en-US' : 'es-ES';
  const anchoArte = Math.min(width, 640);
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onCerrar}
      statusBarTranslucent={false} navigationBarTranslucent={false}>
      <SafeAreaProvider style={e.modal}>
        <SafeAreaView style={e.modal} edges={['top', 'right', 'bottom', 'left']} accessibilityViewIsModal>
          <View style={e.cab}>
            <Text style={e.cabEtq}>Noticia del sector</Text>
            <Pressable onPress={onCerrar} style={({ pressed }) => [e.cerrar, pressed && pulsado('icono')]} hitSlop={8}
              accessibilityRole="button" accessibilityLabel="Cerrar la noticia">
              <Text style={e.cerrarTxt} accessible={false} importantForAccessibility="no">×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={e.detalle}>
            <View style={e.arte}>
              <Ilustracion noticia={noticia} ancho={anchoArte} alto={Math.round(anchoArte * 0.75)} encuadre="xMidYMin slice" />
            </View>
            <View style={e.texto}>
              <View style={e.meta} accessible noTraducir idiomaOriginal={lengua}
                accessibilityLabel={[fechaCorta(noticia.fecha, idioma), etiquetaCategoria(noticia.categoria, idioma),
                  etiquetaAmbito(noticia.ambito, idioma), noticia.seccion === 'hoy' ? traducir('Hoy') : null].filter(Boolean).join(' · ')}>
                <Text noTraducir style={e.metaTxt}>
                  {`${fechaCorta(noticia.fecha, idioma)} · ${etiquetaCategoria(noticia.categoria, idioma)} · ${etiquetaAmbito(noticia.ambito, idioma)}`}
                </Text>
                {noticia.seccion === 'hoy' ? (
                  <View style={[e.hoy, e.hoyDetalle]}>
                    <View style={e.hoyPunto} />
                    <Text style={e.hoyTxt}>Hoy</Text>
                  </View>
                ) : null}
              </View>
              <Text noTraducir idiomaOriginal={lengua} style={e.dTitulo} accessibilityRole="header">{t.titulo}</Text>
              {t.tituloInformativo ? <Text noTraducir idiomaOriginal={lengua} style={e.entradilla}>{t.tituloInformativo}</Text> : null}
              <Text noTraducir idiomaOriginal={lengua} style={e.resumen}>{t.resumen}</Text>
              <View style={[e.bloque, e.importa]}>
                <Text style={e.importaTit} accessibilityRole="header">Por qué te importa</Text>
                <Text noTraducir idiomaOriginal={lengua} style={e.importaTxt}>{t.porQueImporta}</Text>
              </View>
              <View style={e.bloque}>
                <Text style={e.bloqueTit} accessibilityRole="header">Fuente</Text>
                <Text noTraducir idiomaOriginal="es-ES" style={e.bloqueTxt}>{noticia.fuente.nombre}</Text>
                <Text style={e.consulta}>{'Consultada el'} <Text noTraducir>{fechaCorta(noticia.consultadaEl, idioma)}</Text></Text>
              </View>
              {/* El mismo aviso de salida que el resto de enlaces externos de la app. */}
              <Pressable onPress={() => { tacto.abrir(); onAbrirEnlace?.(noticia.fuente.url); }}
                style={({ pressed }) => [e.ir, pressed && pulsado('b1')]}
                accessibilityRole="link" noTraducir idiomaOriginal={lengua}
                accessibilityLabel={`${traducir('Leer en la fuente (sales de RWAdar)')}: ${noticia.fuente.url}`}>
                <Text style={e.irTxt}>{'Leer en la fuente (sales de RWAdar)'}<Text noTraducir>{' ↗'}</Text></Text>
              </Pressable>
              <Text style={e.aviso}>Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export default function NoticiasSector({ onAbrirEnlace, cargar = cargarNoticias }) {
  const idioma = useIdioma();
  const { width } = useWindowDimensions();
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null });
  const [abierta, setAbierta] = useState(null);
  const vivo = useRef(true);
  const pedir = useCallback(() => {
    setEstado((s) => ({ fase: 'cargando', datos: s.datos }));
    return Promise.resolve().then(() => cargar())
      .then((datos) => { if (vivo.current) setEstado({ fase: 'listo', datos }); })
      .catch(() => { if (vivo.current) setEstado((s) => ({ fase: s.datos ? 'listo' : 'error', datos: s.datos })); });
  }, [cargar]);
  useEffect(() => { vivo.current = true; pedir(); return () => { vivo.current = false; }; }, [pedir]);

  const d = estado.fase === 'listo' ? estado.datos : null;
  // Una tarjeta grande y el borde de la siguiente, que invita a deslizar.
  const ancho = Math.min(340, Math.round((width - UI.margen * 2) * 0.8));
  return (
    <View style={e.seccion}>
      <Text style={e.titulo} accessibilityRole="header">Noticias del sector</Text>
      {d ? <Text style={e.sub}>{'Actualizadas el'} <Text noTraducir>{fechaBreve(d.actualizadoEl, idioma)}</Text></Text> : null}

      {estado.fase === 'cargando' && !d ? <Text style={e.estado}>Cargando las noticias…</Text> : null}
      {estado.fase === 'error' ? (
        <View style={e.estadoCaja}>
          <Text style={e.estadoTxt}>Ahora no podemos mostrar las noticias. Vuelve a intentarlo más tarde.</Text>
          <Pressable onPress={() => { tacto.eleccion(); pedir(); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
            accessibilityRole="button" accessibilityLabel="Reintentar">
            <Text style={e.b3Txt}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {d ? (
        <View>
          <FlatList horizontal data={d.noticias} keyExtractor={(n) => n.id} extraData={idioma}
            renderItem={({ item }) => <Tarjeta noticia={item} ancho={ancho} idioma={idioma} onAbrir={setAbierta} />}
            ItemSeparatorComponent={Separador} showsHorizontalScrollIndicator={false}
            decelerationRate="fast" snapToInterval={ancho + SEPARACION} snapToAlignment="start" disableIntervalMomentum
            style={e.pista} contentContainerStyle={e.pistaContenido}
            accessibilityLabel={traducir('Noticias del sector')} />
          <Text style={e.nota}>Ilustraciones de RWAdar, no fotos de la noticia. Selección editorial con enlace a la fuente; no es una recomendación.</Text>
        </View>
      ) : null}

      <Detalle noticia={abierta} idioma={idioma} onCerrar={() => setAbierta(null)} onAbrirEnlace={onAbrirEnlace} />
    </View>
  );
}

function Separador() { return <View style={{ width: SEPARACION }} />; }

const e = StyleSheet.create({
  seccion: { paddingHorizontal: UI.margen, paddingTop: 32, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.bd },
  titulo: { ...T.seccion, color: C.tx },
  sub: { ...T.menor, color: C.tx2, marginTop: 4 },
  estado: { ...T.menor, color: C.tx2, marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoCaja: { marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoTxt: { ...T.menor, color: C.tx2 },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8, marginTop: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  // De borde a borde, como «Recién añadidas».
  pista: { marginHorizontal: -UI.margen, marginTop: 16 },
  pistaContenido: { paddingHorizontal: UI.margen },
  tarjeta: { borderRadius: R.l, overflow: 'hidden', backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd },
  tarjetaPulsada: { opacity: 0.88 },
  hoy: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingLeft: 8,
    paddingRight: 10, borderRadius: R.p, backgroundColor: 'rgba(11,10,10,0.78)', borderWidth: 1, borderColor: C.senal20 },
  hoyDetalle: { position: 'relative', top: 0, left: 0, marginLeft: 8 },
  hoyPunto: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.senal },
  hoyTxt: { fontFamily: F.semi, fontSize: 12, lineHeight: 15, color: C.senal },
  titularCaja: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 },
  titular: { fontFamily: F.semi, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: C.tx,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 10 },
  modal: { flex: 1, backgroundColor: C.s1 },
  cab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: UI.margen + 2, paddingRight: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.bd },
  cabEtq: { ...T.etiqueta, color: C.tx3 },
  cerrar: { width: 44, height: 44, borderRadius: R.p, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center' },
  cerrarTxt: { fontFamily: F.regular, fontSize: 26, lineHeight: 28, color: C.tx },
  detalle: { paddingBottom: 32, alignItems: 'center' },
  arte: { width: '100%', maxWidth: 640, overflow: 'hidden', backgroundColor: C.s0, alignItems: 'center' },
  texto: { width: '100%', maxWidth: 640, paddingHorizontal: UI.margen + 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 14 },
  metaTxt: { ...T.dato, color: C.tx3 },
  dTitulo: { fontFamily: F.semi, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, color: C.tx, marginTop: 8 },
  entradilla: { fontFamily: F.media, fontSize: 16, lineHeight: 23, color: C.tx2, marginTop: 10 },
  resumen: { ...T.cuerpo, color: C.tx, marginTop: 14 },
  bloque: { marginTop: 18, padding: 14, borderRadius: R.m, backgroundColor: C.ton },
  importa: { backgroundColor: C.senalT },
  importaTit: { fontFamily: F.semi, fontSize: 14, lineHeight: 19, color: C.senal, marginBottom: 6 },
  importaTxt: { ...T.menor, fontSize: 15, lineHeight: 23, color: C.tx },
  bloqueTit: { fontFamily: F.semi, fontSize: 14, lineHeight: 19, color: C.tx, marginBottom: 6 },
  bloqueTxt: { ...T.menor, fontSize: 15, lineHeight: 22, color: C.tx2 },
  consulta: { ...T.dato, color: C.tx3, marginTop: 4 },
  ir: { minHeight: 52, marginTop: 20, paddingHorizontal: 20, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center' },
  irTxt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.enSenal, textAlign: 'center' },
  aviso: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 12 },
});
