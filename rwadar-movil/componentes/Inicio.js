import React, { useRef, useState } from 'react';
import { Modal, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';

import { Icono } from './Navegacion';
import Radar from './Radar';
import RecienAnadidas from './RecienAnadidas';
import TokenizacionMundo from './TokenizacionMundo';
import NoticiasSector from './NoticiasSector';
import AprendeInicio, { enlaceCorto } from './AprendeInicio';
import { ofertasDestacadas, recienAnadidas } from '../lib/recien-anadidas';
import { textosInicio } from '../lib/inicio-contenido';
import { cifrasInicio } from '../lib/inicio-cifras';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

export { enlaceCorto };

/* ---------------------------------------------------------------------
   Inicio por bloques (rediseño del 10/11/2026, el mismo orden que la web)
   ---------------------------------------------------------------------
   Víctor: «mucho lío en Inicio». Inicio es ahora una portada por bloques
   cortos, cada uno con su enlace «Ver …» a su sección, donde está el
   detalle; nada se repite:
   1. Cabecera: el radar compacto, la frase de marca, tres cifras (ofertas,
      plataformas y fecha de revisión), «Ver las ofertas» y un solo aviso
      de riesgo, corto, pegado al botón (si se ve el botón, se ve el aviso).
   2. Ofertas: un solo carrusel con las recién añadidas y las que pasan las
      5 comprobaciones, sin duplicados (RecienAnadidas).
   3. El mercado hoy: la tarjeta compacta (TokenizacionMundo compacta) y
      «Ver el mercado →», que abre su pantalla con todo lo demás.
   4. Noticias: tres tarjetas grandes con foto y solo el titular, y «Todas
      las noticias →» (pantalla con las 8 y su detalle).
   5. Aprende: una tarjeta que abre la pantalla con los seis capítulos
      (AprendeInicio), tal como estaban, con sus fuentes y la nota legal.
   6. Pie: una línea legal y «Nota legal completa →».
   Las pantallas se abren encima de Inicio, como las fichas (un Modal a
   pantalla completa; el botón atrás de Android vuelve a Inicio). Las
   novedades de RWAdar salen de Inicio: están en Perfil (y en /cambios).
   --------------------------------------------------------------------- */

/* Una pantalla de Inicio (Mercado, Noticias o Aprende), encima de Inicio. */
function PantallaInicio({ visible, titulo, volver, onCerrar, children }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCerrar}
      statusBarTranslucent={false} navigationBarTranslucent={false}>
      <SafeAreaProvider style={e.pantalla}>
        <SafeAreaView style={e.pantalla} edges={['top', 'right', 'bottom', 'left']} accessibilityViewIsModal>
          <View style={e.pantallaCab}>
            <Pressable onPress={() => { tacto.eleccion(); onCerrar(); }} style={({ pressed }) => [e.volver, pressed && pulsado('icono')]}
              hitSlop={6} accessibilityRole="button" noTraducir accessibilityLabel={volver}>
              <View style={{ transform: [{ rotate: '180deg' }] }}><Icono nombre="flecha" color={C.tx} tamano={20} /></View>
            </Pressable>
            <Text noTraducir style={e.pantallaTit} accessibilityRole="header" numberOfLines={1}>{titulo}</Text>
          </View>
          {children}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export default function Inicio({
  refrescando, onActualizar, onDestino, onExplicar, fuera = [], cambios = [], renderCambio,
  plataformas = [], ofertas = [], fechaCatalogo = null, onAbrirPlataforma, onAbrirOferta, onAbrirEnlace,
  tarjetaAvisos = null,
}) {
  const idioma = useIdioma();
  const t = textosInicio(idioma);
  const b = t.bloques;
  // Si se ve el botón, se ve el aviso (ESPEC-INICIO §3, juez de normas). Por
  // debajo de 700 px de alto el radar se encoge sin rótulos. Y el aviso va
  // antes del botón si, después, quedaría bajo la barra: se decide midiendo.
  const { height: altoPantalla } = useWindowDimensions();
  const compacta = altoPantalla < 700;
  const [altoVisible, setAltoVisible] = useState(0);
  const [finAccion, setFinAccion] = useState(0);
  const avisoPrimero = compacta || (altoVisible > 0 && finAccion > altoVisible);
  const cifras = cifrasInicio({ ofertas, plataformas, descartadas: fuera, fechaCatalogo,
    orden: Object.keys(t.seleccion.letraPequena) });
  const nuevas = recienAnadidas(ofertas, { catalogoCaducado: !cifras.vigente });
  const destacadas = cifras.vigente ? ofertasDestacadas(nuevas, cifras.seleccion) : [];
  const enSeleccion = new Set(cifras.seleccion.map((o) => o.slug));
  // La pantalla abierta encima de Inicio: 'mercado', 'noticias' o 'aprende'.
  const [seccion, setSeccion] = useState(null);
  const [noticiaId, setNoticiaId] = useState(null);
  const [irALegal, setIrALegal] = useState(false);
  const abrir = (cual, extra = {}) => { setNoticiaId(extra.noticia || null); setIrALegal(!!extra.legal); setSeccion(cual); };
  const cerrar = () => setSeccion(null);
  // Desde una pantalla a otra parte de la app: primero se cierra la pantalla.
  const ir = (destino, url) => { setSeccion(null); onDestino?.(destino, url); };

  const portadaY = useRef(null);
  const accion = useRef(null);
  const calcularFin = () => {
    if (!accion.current || portadaY.current == null) return;
    const fin = Math.round(portadaY.current + accion.current.y + accion.current.height);
    setFinAccion((x) => (x === fin ? x : fin));
  };
  const medirAccion = (ev) => { accion.current = ev.nativeEvent.layout; calcularFin(); };
  const cifra = (valor, rotulo, fecha = false) => (
    <View style={e.cifra} accessible noTraducir accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text noTraducir style={e.cifraRotulo}>{rotulo}</Text>
      <Text noTraducir style={[e.cifraValor, fecha && e.cifraFecha]}>{valor}</Text>
    </View>
  );

  return (
    <>
    <ScrollView
      onLayout={(ev) => setAltoVisible(Math.round(ev.nativeEvent.layout.height))}
      contentContainerStyle={e.cuerpo}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onActualizar} tintColor={C.senal} />}
    >
      {/* 1 · Cabecera: cabe entera en la primera pantalla, con el botón a la vista. */}
      <View style={e.portada} onLayout={(ev) => { portadaY.current = ev.nativeEvent.layout.y; calcularFin(); }}>
        <View style={[e.radarCaja, compacta && e.radarCajaBaja]}>
          <Radar datos={plataformas} portada tamano={compacta ? 120 : 176} sinRotulos={compacta}
            onAbrir={(p) => onAbrirPlataforma?.(p)} onFiltrar={() => {}} />
        </View>
        <Text noTraducir style={[e.antetitulo, compacta && e.antetituloBaja]}>{t.portada.antetitulo}</Text>
        <Text noTraducir style={e.titularPortada} accessibilityRole="header">{b.titular}</Text>
        <View style={e.cifras}>
          {cifras.vigente ? <>
            {cifra(String(cifras.ofertas), b.cifras.ofertas)}
            {cifra(String(cifras.plataformas), b.cifras.plataformas)}
            {cifra(cifras.revisado, b.cifras.revisado, true)}
          </> : cifra(b.cifras.pendiente, b.cifras.ultima, true)}
        </View>
        {/* El aviso va pegado al botón: si se ve el botón, se ve el aviso. */}
        <View style={[e.accionPortada, compacta && e.accionPortadaBaja]} onLayout={medirAccion}>
          {avisoPrimero ? <Text noTraducir style={e.avisoPortada}>{t.portada.aviso}</Text> : null}
          <Pressable onPress={() => { tacto.abrir(); onDestino('ofertas'); }}
            style={({ pressed }) => [e.b1, pressed && pulsado('b1')]} accessibilityRole="button" noTraducir
            accessibilityLabel={t.portada.boton(0)}>
            {/* Sin cifra: el número de ofertas ya está justo encima, en las cifras (que no se repita). */}
            <Text noTraducir style={e.b1Txt}>{t.portada.boton(0)}</Text>
          </Pressable>
          {avisoPrimero ? null : <Text noTraducir style={e.avisoPortada}>{t.portada.aviso}</Text>}
        </View>
      </View>

      {/* Avisos de la cuenta y cambios en lo que sigues: solo si los hay. */}
      {tarjetaAvisos}
      {cambios.length ? (
        <View style={e.seccion}>
          <Text style={e.seccionTit}>Cambios en lo que sigues</Text>
          {cambios.map((c) => <View key={String(c.id)}>{renderCambio(c)}</View>)}
        </View>
      ) : null}

      {/* 2 · Ofertas: recién añadidas y Selección, sin duplicados. */}
      <RecienAnadidas ofertas={destacadas} seleccion={enSeleccion}
        onAbrirOferta={onAbrirOferta} onVerTodas={() => onDestino('ofertas')} />

      {/* 3 · El mercado hoy: la tarjeta compacta; el resto, en su pantalla. */}
      <TokenizacionMundo compacta textos={b.mercado} onAbrirEnlace={onAbrirEnlace} onVerMas={() => abrir('mercado')} />

      {/* 4 · Noticias: tres con foto; las 8 y su detalle, en su pantalla. */}
      <NoticiasSector modo="portada" textosBloque={b.noticias} onAbrirEnlace={onAbrirEnlace}
        onAbrir={(noticia) => abrir('noticias', { noticia: noticia?.id || null })} />

      {/* 5 · Aprende: una sola tarjeta. */}
      <View style={e.bloque}>
        <Text noTraducir style={e.bloqueTit} accessibilityRole="header">{b.aprende.titulo}</Text>
        <Pressable onPress={() => { tacto.abrir(); abrir('aprende'); }} style={({ pressed }) => [e.aprende, pressed && e.aprendePulsada]}
          accessibilityRole="button" noTraducir accessibilityLabel={`${b.aprende.tarjeta}. ${b.aprende.sub}`}>
          <View style={e.pasos} accessible={false}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[e.paso, i === 1 && e.pasoOn]}>
                <Text noTraducir style={[e.pasoTxt, i === 1 && e.pasoTxtOn]}>{`0${i}`}</Text>
              </View>
            ))}
          </View>
          <Text noTraducir style={e.aprendeTit}>{b.aprende.tarjeta}</Text>
          <Text noTraducir style={e.aprendeSub}>{b.aprende.sub}</Text>
          <Text noTraducir style={e.verTxt}>{b.aprende.empezar}{' →'}</Text>
        </Pressable>
      </View>

      {/* 6 · Pie: una línea legal y la nota completa (en «Aprende»). */}
      <View style={e.pie}>
        <Text noTraducir style={e.pieTxt}>{b.pie}</Text>
        <Pressable onPress={() => { tacto.eleccion(); abrir('aprende', { legal: true }); }} style={({ pressed }) => [e.ver, pressed && pulsado('b3')]}
          accessibilityRole="link" noTraducir accessibilityLabel={b.notaLegal}>
          <Text noTraducir style={e.verTxtPie}>{b.notaLegal}{' →'}</Text>
        </Pressable>
      </View>
    </ScrollView>

    <PantallaInicio visible={seccion === 'mercado'} titulo={b.mercado.titulo} volver={b.volver} onCerrar={cerrar}>
      <ScrollView contentContainerStyle={e.pantallaCuerpo}>
        <TokenizacionMundo pantalla onAbrirEnlace={onAbrirEnlace} />
      </ScrollView>
    </PantallaInicio>
    <PantallaInicio visible={seccion === 'noticias'} titulo={b.noticias.titulo} volver={b.volver} onCerrar={cerrar}>
      <ScrollView contentContainerStyle={e.pantallaCuerpo}>
        <NoticiasSector modo="lista" abrirId={noticiaId} onAbrirEnlace={onAbrirEnlace} />
      </ScrollView>
    </PantallaInicio>
    <PantallaInicio visible={seccion === 'aprende'} titulo={b.aprende.titulo} volver={b.volver} onCerrar={cerrar}>
      <AprendeInicio onDestino={ir} onExplicar={() => { setSeccion(null); onExplicar?.(); }} onAbrirEnlace={onAbrirEnlace}
        onMercado={() => abrir('mercado')} fuera={fuera} plataformas={plataformas} ofertas={ofertas} fechaCatalogo={fechaCatalogo}
        irALegal={irALegal} />
    </PantallaInicio>
    </>
  );
}

const e = StyleSheet.create({
  cuerpo: { paddingHorizontal: UI.margen, paddingTop: 8, paddingBottom: 40 },

  /* Botones de la guía (GUIA-ACABADOS §4). */
  b1: { minHeight: UI.boton, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  b1Txt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.enSenal },

  /* 1 · Cabecera */
  portada: { paddingBottom: 8 },
  antetitulo: { ...T.etiqueta, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 10 },
  antetituloBaja: { marginTop: 4 },
  accionPortada: { marginTop: 18, gap: 10 },
  accionPortadaBaja: { marginTop: 12, gap: 8 },
  radarCaja: { position: 'relative', alignItems: 'center', justifyContent: 'center', minHeight: 184, paddingVertical: 4 },
  radarCajaBaja: { minHeight: 124, paddingVertical: 0 },
  titularPortada: { ...T.titular, color: C.tx, marginTop: 6 },
  cifras: { flexDirection: 'row', gap: 22, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.bd },
  cifra: { gap: 2 },
  cifraRotulo: { ...T.menor, fontSize: 12, lineHeight: 16, color: C.tx3 },
  cifraValor: { ...T.instrumento, fontSize: 26, lineHeight: 30, color: C.tx },
  cifraFecha: { fontSize: 17, lineHeight: 30 },
  avisoPortada: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3 },

  /* Bloques: el mismo título y el mismo espacio en todos. */
  bloque: { marginTop: 36, paddingTop: 32, borderTopWidth: 1, borderTopColor: C.bd },
  bloqueTit: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx },
  ver: { minHeight: UI.tactil, justifyContent: 'center', alignSelf: 'flex-start', marginLeft: -8, marginTop: 4, paddingHorizontal: 8, borderRadius: R.m },
  verTxt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.senal, marginTop: 4 },
  verTxtPie: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  aprende: { marginTop: 16, padding: 18, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, gap: 8 },
  aprendePulsada: { backgroundColor: C.s2 },
  pasos: { flexDirection: 'row', gap: 6 },
  paso: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.bd, alignItems: 'center', justifyContent: 'center' },
  pasoOn: { backgroundColor: C.senal, borderColor: C.senal },
  pasoTxt: { ...T.instrumento, fontSize: 11, lineHeight: 14, color: C.tx3 },
  pasoTxtOn: { color: C.enSenal },
  aprendeTit: { fontFamily: F.negrita, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: C.tx },
  aprendeSub: { ...T.menor, fontSize: 16, lineHeight: 23, color: C.tx2 },
  pie: { marginTop: 36, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.bd },
  pieTxt: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3 },
  seccion: { marginTop: 26 },
  seccionTit: { ...T.seccion, color: C.tx, marginBottom: 10 },

  /* Pantallas de Inicio */
  pantalla: { flex: 1, backgroundColor: C.noche },
  pantallaCab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.bd },
  volver: { width: 44, height: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center' },
  pantallaTit: { ...T.seccion, color: C.tx, flex: 1 },
  pantallaCuerpo: { paddingHorizontal: UI.margen, paddingTop: 8, paddingBottom: 48 },
});
