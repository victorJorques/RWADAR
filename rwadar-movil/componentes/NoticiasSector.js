import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FuenteOriginal, Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { cargarNoticias } from '../lib/noticias-sector-remota';
import { URL_FOTOS, etiquetaAmbito, etiquetaCategoria, etiquetaReciente, fechaBreve, fechaCorta, fechaLocal, rutaFoto, textos }
  from '../lib/noticias-sector';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día),
   como la web
   ---------------------------------------------------------------------
   Lee /datos/noticias-v2.json de rwadar.pages.dev (lib/noticias-sector-remota.js).
   Dos modos («Mercado y noticias», 11/11/2026, como en una app de bolsa):
   - `compacta` (Inicio): las 3 primeras, en filas con una foto pequeña, el
     titular, la fuente y la fecha, y «Hoy» o «Ayer» según el día de quien
     mira. Al tocar una, onAbrir(noticia) abre «Mercado y noticias» con su
     detalle.
   - `lista` (debajo del gráfico, en «Mercado y noticias»): las 8, cada una
     con la fuente y la fecha en pequeño, el titular grande, una línea de
     resumen y la foto a la derecha (la primera, arriba). Al tocar, el detalle
     en un modal: fecha, titular, resumen, «Por qué te importa», la fuente y
     «Leer en la fuente (sales de RWAdar) ↗», que abre el enlace con
     onAbrirEnlace (el de App.js: solo https). `abrirId` abre esa al entrar.
   Las fotos son ilustrativas, generadas con IA, y se cargan de
   https://rwadar.pages.dev/noticias-editoriales/<clave>.webp (el campo
   «imagen»), como las de las ofertas. Si una no carga, queda el fondo oscuro.
   Con la red caída, la sección lo dice y ofrece reintentar. Los textos de
   cada noticia salen del archivo en el idioma elegido; los de la interfaz,
   de lib/idioma-en.js.
   --------------------------------------------------------------------- */
const EN_PORTADA = 3;

/* La foto de una noticia, decorativa (el titular ya lo dice todo). */
export function FotoNoticia({ noticia, estilo, velo = false }) {
  const [fallo, setFallo] = useState(false);
  const uri = rutaFoto(noticia, { base: URL_FOTOS });
  return (
    <View style={[e.foto, estilo]} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {uri && !fallo ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFallo(true)}
          accessible={false} importantForAccessibility="no" />
      ) : null}
      {velo ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
          <Defs>
            <LinearGradient id="ntVelo" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.3" stopColor="#0B0A0A" stopOpacity="0" />
              <Stop offset="0.55" stopColor="#0B0A0A" stopOpacity="0.55" />
              <Stop offset="1" stopColor="#0B0A0A" stopOpacity="0.94" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="10" height="10" fill="url(#ntVelo)" />
        </Svg>
      ) : null}
    </View>
  );
}

function Etiqueta({ cual, enDetalle = false }) {
  if (!cual) return null;
  const ayer = cual === 'Ayer';
  return (
    <View style={[e.hoy, ayer && e.ayer, enDetalle && e.hoyDetalle]}>
      <View style={[e.hoyPunto, ayer && e.ayerPunto]} />
      <Text style={[e.hoyTxt, ayer && e.ayerTxt]}>{cual}</Text>
    </View>
  );
}

/* La fuente, como en una app de bolsa: lo que va antes de la primera coma de
   su nombre, tal como lo escribe RWAdar («CNMV», «ESMA»…). */
export function fuenteCorta(noticia) { return String(noticia?.fuente?.nombre || '').split(',')[0].trim(); }

/* Inicio: una fila compacta con foto pequeña, titular, fuente y fecha. */
function Compacta({ noticia, idioma, onAbrir, hoyISO, ultima }) {
  const t = textos(noticia, idioma);
  const reciente = etiquetaReciente(noticia, hoyISO);
  const meta = `${fuenteCorta(noticia)} · ${fechaCorta(noticia.fecha, idioma)}`;
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrir(noticia); }} style={({ pressed }) => [e.compacta, ultima && e.sinRaya, pressed && e.filaPulsada]}
      accessibilityRole="button" noTraducir idiomaOriginal={idioma === 'en' ? 'en-US' : 'es-ES'}
      accessibilityLabel={[t.titulo, meta, reciente ? traducir(reciente) : null].filter(Boolean).join('. ')}>
      <FotoNoticia noticia={noticia} estilo={e.compactaFoto} />
      <View style={e.compactaTexto}>
        <Text noTraducir style={e.compactaTit} numberOfLines={3}>{t.titulo}</Text>
        <View style={e.meta}>
          <Text noTraducir style={e.metaPeq}>{meta}</Text>
          <Etiqueta cual={reciente} enDetalle />
        </View>
      </View>
    </Pressable>
  );
}

/* Debajo del gráfico: la fuente y la fecha en pequeño, el titular grande, una
   línea de resumen y la foto a la derecha; la primera, con la foto arriba. */
function Fila({ noticia, idioma, onAbrir, hoyISO, primera }) {
  const t = textos(noticia, idioma);
  const reciente = etiquetaReciente(noticia, hoyISO);
  const lengua = idioma === 'en' ? 'en-US' : 'es-ES';
  const meta = `${fuenteCorta(noticia)} · ${fechaCorta(noticia.fecha, idioma)}`;
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrir(noticia); }} style={({ pressed }) => [e.fila, primera && e.filaPrimera, pressed && e.filaPulsada]}
      accessibilityRole="button" noTraducir idiomaOriginal={lengua}
      accessibilityLabel={[t.titulo, meta, reciente ? traducir(reciente) : null].filter(Boolean).join('. ')}>
      {primera ? <FotoNoticia noticia={noticia} estilo={e.filaFotoArriba} /> : null}
      <View style={e.filaTexto}>
        <View style={[e.meta, e.metaFila]}>
          <Text noTraducir style={e.metaPeq}>{meta}</Text>
          <Etiqueta cual={reciente} enDetalle />
        </View>
        <Text noTraducir style={[e.filaTit, primera && e.filaTitPrimera]}>{t.titulo}</Text>
        <Text noTraducir style={e.filaResumen} numberOfLines={primera ? 2 : 1}>{t.resumen}</Text>
      </View>
      {primera ? null : <FotoNoticia noticia={noticia} estilo={e.filaFoto} />}
    </Pressable>
  );
}

function Detalle({ noticia, idioma, onCerrar, onAbrirEnlace, hoyISO }) {
  const { width } = useWindowDimensions();
  if (!noticia) return null;
  const t = textos(noticia, idioma);
  const lengua = idioma === 'en' ? 'en-US' : 'es-ES';
  const anchoArte = Math.min(width, 640);
  const reciente = etiquetaReciente(noticia, hoyISO);
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
            <FotoNoticia noticia={noticia} estilo={[e.arte, { width: anchoArte, height: Math.round(anchoArte / 1.6) }]} />
            <View style={e.texto}>
              <View style={e.meta} accessible noTraducir idiomaOriginal={lengua}
                accessibilityLabel={[fechaCorta(noticia.fecha, idioma), etiquetaCategoria(noticia.categoria, idioma),
                  etiquetaAmbito(noticia.ambito, idioma), reciente ? traducir(reciente) : null].filter(Boolean).join(' · ')}>
                <Text noTraducir style={e.metaTxt}>
                  {`${fechaCorta(noticia.fecha, idioma)} · ${etiquetaCategoria(noticia.categoria, idioma)} · ${etiquetaAmbito(noticia.ambito, idioma)}`}
                </Text>
                <Etiqueta cual={reciente} enDetalle />
              </View>
              <Text noTraducir idiomaOriginal={lengua} style={e.dTitulo} accessibilityRole="header">{t.titulo}</Text>
              <Text noTraducir idiomaOriginal={lengua} style={e.resumen}>{t.resumen}</Text>
              <View style={[e.bloque, e.importa]}>
                <Text style={e.importaTit} accessibilityRole="header">Por qué te importa</Text>
                <Text noTraducir idiomaOriginal={lengua} style={e.importaTxt}>{t.porQueImporta}</Text>
              </View>
              <View style={e.bloque}>
                <Text style={e.bloqueTit} accessibilityRole="header">Fuente</Text>
                {/* El nombre de la fuente está en castellano; en inglés, FuenteOriginal lo avisa. */}
                <FuenteOriginal idiomaOriginal="es-ES" style={e.bloqueTxt}>{noticia.fuente.nombre}</FuenteOriginal>
                <Text style={e.consulta}>{'Consultada el'} <Text noTraducir>{fechaCorta(noticia.consultadaEl, idioma)}</Text></Text>
              </View>
              {/* El mismo aviso de salida que el resto de enlaces externos de la app. */}
              <Pressable onPress={() => { tacto.abrir(); onAbrirEnlace?.(noticia.fuente.url); }}
                style={({ pressed }) => [e.ir, pressed && pulsado('b1')]}
                accessibilityRole="link" noTraducir idiomaOriginal={lengua}
                accessibilityLabel={`${traducir('Leer en la fuente (sales de RWAdar)')}: ${noticia.fuente.url}`}>
                <Text style={e.irTxt}>{'Leer en la fuente (sales de RWAdar)'}<Text noTraducir>{'\u00a0↗'}</Text></Text>
              </Pressable>
              <Text style={e.aviso}>Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export default function NoticiasSector({ onAbrirEnlace, cargar = cargarNoticias, ahora = () => new Date(), modo = 'compacta', onAbrir, abrirId = null }) {
  const idioma = useIdioma();
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null });
  const [abierta, setAbierta] = useState(null);
  const vivo = useRef(true);
  const pendiente = useRef(abrirId);
  const pedir = useCallback(() => {
    setEstado((s) => ({ fase: 'cargando', datos: s.datos }));
    return Promise.resolve().then(() => cargar())
      .then((datos) => {
        if (!vivo.current) return;
        setEstado({ fase: 'listo', datos });
        // Llegando desde una tarjeta de Inicio: se abre esa noticia en cuanto hay datos.
        if (modo === 'lista' && pendiente.current) {
          const n = datos.noticias.find((x) => x.id === pendiente.current);
          pendiente.current = null;
          if (n) setAbierta(n);
        }
      })
      .catch(() => { if (vivo.current) setEstado((s) => ({ fase: s.datos ? 'listo' : 'error', datos: s.datos })); });
  }, [cargar, modo]);
  useEffect(() => { vivo.current = true; pedir(); return () => { vivo.current = false; }; }, [pedir]);

  const d = estado.fase === 'listo' ? estado.datos : null;
  // «Hoy» y «Ayer» con el día local del móvil.
  const hoyISO = fechaLocal(ahora());
  const lista = modo === 'lista';
  const estados = (
    <>
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
    </>
  );
  const fecha = d ? <Text style={e.sub}>{'Actualizadas el'} <Text noTraducir>{fechaBreve(d.actualizadoEl, idioma)}</Text></Text> : null;
  const nota = <Text style={e.nota}>Imágenes ilustrativas generadas con IA, no fotos de la noticia.</Text>;

  if (lista) {
    return (
      <View>
        {fecha}
        {estados}
        {d ? (
          <View style={e.listaFilas}>
            {d.noticias.map((n, i) => <Fila key={n.id} noticia={n} idioma={idioma} onAbrir={setAbierta} hoyISO={hoyISO} primera={i === 0} />)}
          </View>
        ) : null}
        {d ? nota : null}
        <Detalle noticia={abierta} idioma={idioma} onCerrar={() => setAbierta(null)} onAbrirEnlace={onAbrirEnlace} hoyISO={hoyISO} />
      </View>
    );
  }
  // Inicio («Mercado y noticias»): las 3 primeras, compactas.
  return (
    <View style={e.compactas}>
      {estados}
      {d ? d.noticias.slice(0, EN_PORTADA).map((n, i) => (
        <Compacta key={n.id} noticia={n} idioma={idioma} onAbrir={(x) => onAbrir?.(x)} hoyISO={hoyISO} ultima={i === EN_PORTADA - 1} />
      )) : null}
      {d ? nota : null}
    </View>
  );
}

const e = StyleSheet.create({
  foto: { overflow: 'hidden', backgroundColor: C.s2 },
  listaFilas: { marginTop: 8 },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.bd },
  filaPrimera: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  filaPulsada: { backgroundColor: C.ton },
  filaFoto: { width: 88, height: 88, borderRadius: R.m },
  filaFotoArriba: { width: '100%', aspectRatio: 16 / 9, borderRadius: R.l },
  filaTexto: { flex: 1, minWidth: 0 },
  metaFila: { marginTop: 0 },
  metaPeq: { fontFamily: F.media, fontSize: 12, lineHeight: 16, color: C.tx3 },
  filaTit: { fontFamily: F.negrita, fontSize: 18, lineHeight: 23, letterSpacing: -0.2, color: C.tx, marginTop: 4 },
  filaTitPrimera: { fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  filaResumen: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx2, marginTop: 6 },
  compactas: { marginTop: 8 },
  compacta: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.bd },
  sinRaya: { borderBottomWidth: 0 },
  compactaFoto: { width: 72, height: 72, borderRadius: R.m },
  compactaTexto: { flex: 1, minWidth: 0, gap: 4 },
  compactaTit: { fontFamily: F.negrita, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: C.tx },
  sub: { ...T.menor, color: C.tx2, marginTop: 4 },
  estado: { ...T.menor, color: C.tx2, marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoCaja: { marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoTxt: { ...T.menor, color: C.tx2 },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8, marginTop: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  hoy: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingLeft: 8,
    paddingRight: 10, borderRadius: R.p, backgroundColor: 'rgba(11,10,10,0.78)', borderWidth: 1, borderColor: C.senal20 },
  hoyDetalle: { position: 'relative', top: 0, left: 0, marginLeft: 8 },
  hoyPunto: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.senal },
  hoyTxt: { fontFamily: F.semi, fontSize: 12, lineHeight: 15, color: C.senal },
  // «Ayer», más discreta que «Hoy».
  ayer: { borderColor: C.bd },
  ayerPunto: { backgroundColor: C.tx2 },
  ayerTxt: { color: C.tx },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 10 },
  modal: { flex: 1, backgroundColor: C.s1 },
  cab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: UI.margen + 2, paddingRight: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.bd },
  cabEtq: { ...T.etiqueta, color: C.tx3 },
  cerrar: { width: 44, height: 44, borderRadius: R.p, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center' },
  cerrarTxt: { fontFamily: F.regular, fontSize: 26, lineHeight: 28, color: C.tx },
  detalle: { paddingBottom: 32, alignItems: 'center' },
  arte: { maxWidth: 640 },
  texto: { width: '100%', maxWidth: 640, paddingHorizontal: UI.margen + 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 14 },
  metaTxt: { ...T.dato, color: C.tx3 },
  dTitulo: { fontFamily: F.semi, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, color: C.tx, marginTop: 8 },
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
