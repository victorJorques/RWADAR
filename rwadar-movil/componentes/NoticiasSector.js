import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, PixelRatio, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FuenteOriginal, Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { cargarCreditosFotos, cargarNoticias } from '../lib/noticias-sector-remota';
import { CATEGORIAS, EN_INICIO, URL_FOTOS, anchoFoto, creditoFoto, etiquetaAmbito, etiquetaCategoria, etiquetaReciente, fechaBreve, fechaCorta, fechaLocal,
  fuenteCorta as fuenteCortaModelo, notaFotos, rutaFoto, textos } from '../lib/noticias-sector';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día;
   noticias que entran por los ojos, 14/11/2026), como la web
   ---------------------------------------------------------------------
   Lee /datos/noticias-v2.json de rwadar.pages.dev (lib/noticias-sector-remota.js).
   La primera noticia es una portada: la foto ocupa toda la tarjeta y, abajo,
   la categoría, «fuente · fecha» y el titular sobre un velo que detrás de
   cualquier letra nunca baja de 0,72 (contraste ≥ 7:1 con cualquier foto).
   La tarjeta crece con la letra (minHeight, nunca height) y ningún titular se
   corta. Las demás, tarjetas con su foto 3:2 en dos columnas; con la letra
   grande (si la caja no llega a 320 puntos de letra normal), filas con la
   foto a la izquierda. Dos modos («Mercado y noticias», 11/11/2026):
   - `compacta` (Inicio): la portada y dos tarjetas, con «Hoy» o «Ayer»
     según el día de quien mira. Al tocar una, onAbrir(noticia) abre
     «Mercado y noticias» con su detalle.
   - `lista` (debajo del gráfico, en «Mercado y noticias»): la portada,
     «Por qué te importa» debajo y todas las demás. Al tocar, el detalle en
     un modal: fecha, titular, resumen, «Por qué te importa», la fuente y
     «Leer en la fuente (sales de RWAdar) ↗», que abre el enlace con
     onAbrirEnlace (el de App.js: solo https). `abrirId` abre esa al entrar.
   Las fotos ilustran el tema, no son de la noticia: unas son fotos reales
   con licencia libre de Wikimedia Commons y otras, escenas generadas con IA
   (22/11/2026). Su origen y su crédito salen de /datos/fotos-noticias.json
   (cargarCreditosFotos, aparte de las noticias): en cada tarjeta, «Foto:
   autor · licencia · Wikimedia Commons» o «Ilustración generada con IA»; en
   el detalle, la foto real se lee con su descripción y su crédito lleva dos
   enlaces (la licencia, a su texto; «Wikimedia Commons», a la página del
   archivo) y «recortada». Sin ese archivo, una foto real va sin
   crédito (nunca con uno falso) y las de IA siguen diciendo que lo son. La
   línea de debajo dice la verdad de las fotos que se ven (notaFotos). Se
   cargan de https://rwadar.pages.dev/noticias-editoriales/ en el tamaño que pide la
   pantalla (480, 960 o 1200 píxeles: modelo.anchoFoto); si la variante no
   carga, se prueba la de 1200 y, si tampoco, queda el fondo oscuro. Con la
   red caída, la sección lo dice y ofrece reintentar. Los textos de cada
   noticia salen del archivo en el idioma elegido; los de la interfaz, de
   lib/idioma-en.js.
   --------------------------------------------------------------------- */
// El velo: de 0 a 0,72 en los primeros RAMPA puntos y de 0,72 a 0,92 hasta
// abajo; el texto empieza RAMPA + 8 más abajo.
const RAMPA = 48;
const VELO = '#0B0A0A';
// Por debajo de este ancho (en puntos de letra normal), las tarjetas van en filas.
const ANCHO_DOS_COLUMNAS = 320;
const HUECO = 12;

/* La foto de una noticia, decorativa (el titular ya lo dice todo) salvo
   que traiga «descripcion» (una foto real en el detalle: se lee lo que se
   ve). «ancho»: los puntos que ocupa en la pantalla, para pedir el tamaño justo. */
export function FotoNoticia({ noticia, estilo, ancho = 0, descripcion = null }) {
  // 0: el tamaño elegido; 1: la de 1200 (si la variante falló); 2: sin foto.
  const [intento, setIntento] = useState(0);
  const elegido = ancho > 0 ? anchoFoto(PixelRatio.getPixelSizeForLayoutSize(ancho)) : 1200;
  const tamano = intento === 0 ? elegido : 1200;
  const uri = intento < 2 ? rutaFoto(noticia, { base: URL_FOTOS, ancho: tamano }) : null;
  if (descripcion && uri) {
    return (
      <View style={[e.foto, estilo]} accessible accessibilityRole="image" accessibilityLabel={descripcion} noTraducir idiomaOriginal="es-ES">
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setIntento(tamano === 1200 ? 2 : 1)}
          accessible={false} importantForAccessibility="no" />
      </View>
    );
  }
  return (
    <View style={[e.foto, estilo]} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setIntento(tamano === 1200 ? 2 : 1)}
          accessible={false} importantForAccessibility="no" />
      ) : null}
    </View>
  );
}

/* El velo de la portada, detrás del texto: crece con él. */
function Velo() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" accessible={false} importantForAccessibility="no">
      <Defs>
        <LinearGradient id="ntRampa" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={VELO} stopOpacity="0" />
          <Stop offset="1" stopColor={VELO} stopOpacity="0.72" />
        </LinearGradient>
        <LinearGradient id="ntVelo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={VELO} stopOpacity="0.72" />
          <Stop offset="1" stopColor={VELO} stopOpacity="0.92" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height={RAMPA} fill="url(#ntRampa)" />
      <Rect x="0" y={RAMPA} width="100%" height="100%" fill="url(#ntVelo)" />
    </Svg>
  );
}

function Etiqueta({ cual, enDetalle = false, primero = false }) {
  if (!cual) return null;
  const ayer = cual === 'Ayer';
  return (
    <View style={[e.hoy, ayer && e.ayer, enDetalle && e.hoyDetalle, primero && e.hoyPrimero]}>
      <View style={[e.hoyPunto, ayer && e.ayerPunto]} />
      <Text style={[e.hoyTxt, ayer && e.ayerTxt]}>{cual}</Text>
    </View>
  );
}

/* El crédito corto de la foto en una tarjeta (texto; el enlace, en el detalle). */
function CreditoTarjeta({ noticia, creditos, idioma, estilo }) {
  const c = creditoFoto(noticia, creditos, idioma);
  if (!c) return null;
  return <Text noTraducir style={[e.credito, estilo]} testID={`credito-${c.origen}`}>{c.texto}</Text>;
}

/* La fuente, como en una app de bolsa: lo que va antes de la primera coma de
   su nombre, tal como lo escribe RWAdar («CNMV», «ESMA»…); en inglés, los
   organismos traducidos («Council of the EU»). Lo decide el modelo, como en la web. */
export function fuenteCorta(noticia, idioma = 'es') { return fuenteCortaModelo(noticia, idioma); }

/* Lo común de la portada y las tarjetas: lo que se lee en voz alta empieza
   por el titular, como antes. */
function datosTarjeta(noticia, idioma, hoyISO) {
  const t = textos(noticia, idioma);
  const reciente = etiquetaReciente(noticia, hoyISO);
  const meta = `${fuenteCorta(noticia, idioma)} · ${fechaCorta(noticia.fecha, idioma)}`;
  return { t, reciente, meta, etiqueta: [t.titulo, meta, reciente ? traducir(reciente) : null].filter(Boolean).join('. '),
    lengua: idioma === 'en' ? 'en-US' : 'es-ES' };
}

/* La portada: la foto a sangre y, abajo, la categoría, la fuente y la fecha y el titular. */
function Portada({ noticia, idioma, hoyISO, onAbrir, ancho, creditos }) {
  const { t, reciente, meta, etiqueta, lengua } = datosTarjeta(noticia, idioma, hoyISO);
  const color = CATEGORIAS[noticia.categoria]?.color || C.tx;
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrir(noticia); }} style={({ pressed }) => [e.portada, { minHeight: Math.round(ancho * 3 / 4) }, pressed && e.pulsada]}
      accessibilityRole="button" noTraducir idiomaOriginal={lengua} accessibilityLabel={etiqueta} testID="noticia-portada">
      <FotoNoticia noticia={noticia} estilo={StyleSheet.absoluteFill} ancho={ancho} />
      <View style={e.portadaTexto}>
        <Velo />
        <View style={e.pildora} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <View style={[e.pildoraPunto, { backgroundColor: color }]} />
          <Text noTraducir style={[e.pildoraTxt, { color }]}>{etiquetaCategoria(noticia.categoria, idioma)}</Text>
        </View>
        <View style={[e.meta, e.metaPortada]}>
          <Text noTraducir style={e.metaPortadaTxt}>{meta}</Text>
          <Etiqueta cual={reciente} enDetalle />
        </View>
        <Text noTraducir style={e.portadaTit}>{t.titulo}</Text>
        <CreditoTarjeta noticia={noticia} creditos={creditos} idioma={idioma} estilo={e.creditoPortada} />
      </View>
    </Pressable>
  );
}

/* Una tarjeta: foto 3:2 arriba y titular debajo; «ancha», la que queda sola
   en su fila (foto 2:1); «enFila», con la letra grande: foto pequeña a la izquierda. */
function Tarjeta({ noticia, idioma, hoyISO, onAbrir, ancho, ancha = false, enFila = false, creditos }) {
  const { t, reciente, meta, etiqueta, lengua } = datosTarjeta(noticia, idioma, hoyISO);
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrir(noticia); }}
      style={({ pressed }) => [enFila ? e.tarjetaFila : e.tarjeta, !enFila && { width: ancho }, pressed && e.pulsada]}
      accessibilityRole="button" noTraducir idiomaOriginal={lengua} accessibilityLabel={etiqueta}>
      <FotoNoticia noticia={noticia} estilo={enFila ? e.fotoFila : [e.fotoTarjeta, ancha && e.fotoAncha]} ancho={enFila ? 96 : ancho} />
      <View style={enFila ? e.textoFila : e.textoTarjeta}>
        <Text noTraducir style={e.tarjetaTit}>{t.titulo}</Text>
        <View style={[e.meta, e.metaTarjeta]}>
          <Text noTraducir style={e.metaPeq}>{meta}</Text>
          <Etiqueta cual={reciente} enDetalle />
        </View>
        <CreditoTarjeta noticia={noticia} creditos={creditos} idioma={idioma} />
      </View>
    </Pressable>
  );
}

/* Las tarjetas, en filas de dos (la última, sola y ancha si sobra una) o,
   con la letra grande, una debajo de otra. */
function Tarjetas({ noticias, ancho, fontScale, ...resto }) {
  if (!noticias.length) return null;
  const dos = ancho / (fontScale || 1) >= ANCHO_DOS_COLUMNAS;
  if (!dos) return <View style={e.filas}>{noticias.map((n) => <Tarjeta key={n.id} noticia={n} ancho={ancho} enFila {...resto} />)}</View>;
  const mitad = Math.floor((ancho - HUECO) / 2);
  const pares = [];
  for (let i = 0; i < noticias.length; i += 2) pares.push(noticias.slice(i, i + 2));
  return (
    <View style={e.rejilla} testID="noticias-dos-columnas">
      {pares.map((par) => (
        <View key={par[0].id} style={e.par}>
          {par.map((n) => <Tarjeta key={n.id} noticia={n} ancho={par.length === 1 ? ancho : mitad} ancha={par.length === 1} {...resto} />)}
        </View>
      ))}
    </View>
  );
}

function Detalle({ noticia, idioma, onCerrar, onAbrirEnlace, hoyISO, creditos }) {
  const { width } = useWindowDimensions();
  if (!noticia) return null;
  const t = textos(noticia, idioma);
  const lengua = idioma === 'en' ? 'en-US' : 'es-ES';
  const anchoArte = Math.min(width, 640);
  const reciente = etiquetaReciente(noticia, hoyISO);
  const credito = creditoFoto(noticia, creditos, idioma);
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
            <FotoNoticia noticia={noticia} estilo={[e.arte, { width: anchoArte, height: Math.round(anchoArte / 1.6) }]} ancho={anchoArte}
              descripcion={credito?.origen === 'foto' ? credito.alt : null} />
            <View style={e.texto}>
              {credito?.origen === 'foto' ? (
                /* «Foto: autor · licencia · Wikimedia Commons · recortada»: la
                   licencia abre su texto (si tiene dirección) y «Wikimedia
                   Commons», la página del archivo, como el resto de enlaces externos. */
                <View style={e.creditoDetalleCaja} testID="credito-detalle">
                  {credito.partes.map((parte, i) => (parte.enlace ? (
                    <Pressable key={i} onPress={() => { tacto.abrir(); onAbrirEnlace?.(parte.enlace); }} style={({ pressed }) => [e.creditoEnlace, pressed && e.pulsada]}
                      accessibilityRole="link" noTraducir idiomaOriginal={lengua} accessibilityLabel={`${parte.texto}: ${parte.enlace}`}
                      testID={parte.enlace === credito.enlace ? 'credito-enlace' : 'credito-licencia'}>
                      <Text noTraducir style={[e.credito, e.creditoDetalle, e.creditoSubrayado]}>{parte.texto}<Text noTraducir>{'\u00a0↗'}</Text></Text>
                    </Pressable>
                  ) : <Text key={i} noTraducir style={[e.credito, e.creditoDetalle]}>{parte.texto}</Text>))}
                  <Text noTraducir style={[e.credito, e.creditoDetalle]}>{` · ${credito.recorte}`}</Text>
                </View>
              ) : credito ? <Text noTraducir style={[e.credito, e.creditoDetalle]} testID="credito-ia">{credito.texto}</Text> : null}
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

export default function NoticiasSector({ onAbrirEnlace, cargar = cargarNoticias, cargarCreditos = cargarCreditosFotos, ahora = () => new Date(), modo = 'compacta',
  onAbrir, abrirId = null }) {
  const idioma = useIdioma();
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null });
  // Los créditos de las fotos: null hasta que llegan (o si fallan: entonces, sin crédito).
  const [creditos, setCreditos] = useState(null);
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
  useEffect(() => {
    let sigue = true;
    Promise.resolve().then(() => cargarCreditos()).then((c) => { if (sigue && c) setCreditos(c); }, () => {});
    return () => { sigue = false; };
  }, [cargarCreditos]);

  const d = estado.fase === 'listo' ? estado.datos : null;
  // El ancho de la sección (medido; al principio, la pantalla menos los márgenes) y la letra del sistema.
  const { width, fontScale = 1 } = useWindowDimensions();
  const [anchoMedido, setAnchoMedido] = useState(0);
  const anchoCaja = anchoMedido || Math.max(0, Math.round(width - 2 * UI.margen));
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
  const alAbrir = lista ? setAbierta : (x) => onAbrir?.(x);
  const noticias = d ? (lista ? d.noticias : d.noticias.slice(0, EN_INICIO)) : [];
  // La verdad de las fotos que se ven: todas reales, todas de IA, de las dos o sin crédito.
  const nota = <Text noTraducir style={e.nota} testID="noticias-nota">{notaFotos(noticias, creditos, idioma)}</Text>;
  const rejilla = d && noticias.length ? (
    <View style={e.cuerpo}>
      <Portada noticia={noticias[0]} idioma={idioma} hoyISO={hoyISO} onAbrir={alAbrir} ancho={anchoCaja} creditos={creditos} />
      {lista ? (
        <Text noTraducir style={e.importaPortada} testID="noticia-importa">
          <Text style={e.importaRot}>{'Por qué te importa'}</Text>{': '}{textos(noticias[0], idioma).porQueImporta}
        </Text>
      ) : null}
      <Tarjetas noticias={noticias.slice(1)} ancho={anchoCaja} fontScale={fontScale} idioma={idioma} hoyISO={hoyISO} onAbrir={alAbrir} creditos={creditos} />
    </View>
  ) : null;

  return (
    <View onLayout={(ev) => { const w = Math.round(ev?.nativeEvent?.layout?.width || 0); if (w > 0 && w !== anchoMedido) setAnchoMedido(w); }}>
      {lista ? fecha : null}
      {estados}
      {rejilla}
      {d ? nota : null}
      {lista ? <Detalle noticia={abierta} idioma={idioma} onCerrar={() => setAbierta(null)} onAbrirEnlace={onAbrirEnlace} hoyISO={hoyISO}
        creditos={creditos} /> : null}
    </View>
  );
}

const e = StyleSheet.create({
  foto: { overflow: 'hidden', backgroundColor: C.s2 },
  cuerpo: { marginTop: 12 },
  pulsada: { opacity: 0.85 },
  portada: { borderRadius: R.l, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: C.s2 },
  portadaTexto: { paddingTop: RAMPA + 8, paddingHorizontal: 16, paddingBottom: 16 },
  pildora: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginBottom: 8, paddingVertical: 4, paddingLeft: 8,
    paddingRight: 10, borderRadius: R.p, backgroundColor: 'rgba(11,10,10,0.88)' },
  pildoraPunto: { width: 6, height: 6, borderRadius: 3 },
  pildoraTxt: { fontFamily: F.semi, fontSize: 12, lineHeight: 15, letterSpacing: 0.2 },
  metaPortada: { marginTop: 0 },
  metaPortadaTxt: { fontFamily: F.media, fontSize: 13, lineHeight: 18, color: C.tx },
  portadaTit: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx, marginTop: 6 },
  importaPortada: { ...T.menor, fontSize: 16, lineHeight: 24, color: C.tx2, marginTop: 10 },
  rejilla: { marginTop: 20, gap: 20 },
  par: { flexDirection: 'row', gap: HUECO },
  tarjeta: { gap: 8 },
  fotoTarjeta: { width: '100%', aspectRatio: 3 / 2, borderRadius: R.m },
  fotoAncha: { aspectRatio: 2 },
  textoTarjeta: { gap: 6 },
  tarjetaTit: { fontFamily: F.negrita, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: C.tx },
  filas: { marginTop: 16, gap: 16 },
  tarjetaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  fotoFila: { width: 96, height: 96, borderRadius: R.m },
  textoFila: { flex: 1, minWidth: 0, gap: 6 },
  metaPeq: { fontFamily: F.media, fontSize: 12, lineHeight: 16, color: C.tx3 },
  metaTarjeta: { marginTop: 0 },
  sub: { ...T.menor, color: C.tx2, marginTop: 4 },
  estado: { ...T.menor, color: C.tx2, marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoCaja: { marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoTxt: { ...T.menor, color: C.tx2 },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8, marginTop: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  hoy: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingLeft: 8,
    paddingRight: 10, borderRadius: R.p, backgroundColor: 'rgba(11,10,10,0.78)', borderWidth: 1, borderColor: C.senal20 },
  hoyDetalle: { position: 'relative', top: 0, left: 0, marginLeft: 8 },
  hoyPrimero: { marginLeft: 0, marginRight: 8 },
  importaRot: { fontFamily: F.semi, color: C.senal },
  hoyPunto: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.senal },
  hoyTxt: { fontFamily: F.semi, fontSize: 12, lineHeight: 15, color: C.senal },
  // «Ayer», más discreta que «Hoy».
  ayer: { borderColor: C.bd },
  ayerPunto: { backgroundColor: C.tx2 },
  ayerTxt: { color: C.tx },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 10 },
  credito: { fontFamily: F.regular, fontSize: 11, lineHeight: 15, color: C.tx3 },
  creditoPortada: { marginTop: 8, color: C.tx2 },
  creditoDetalleCaja: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  creditoEnlace: { minHeight: 44, justifyContent: 'center' },
  creditoDetalle: { fontSize: 12, lineHeight: 17 },
  creditoSubrayado: { textDecorationLine: 'underline' },
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
