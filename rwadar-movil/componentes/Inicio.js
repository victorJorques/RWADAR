import React, { useRef, useState } from 'react';
import { RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import Svg, { Circle } from 'react-native-svg';

import { Icono } from './Navegacion';
import Radar from './Radar';
import { ImagenOferta } from './Ofertas';
import { DESTINOS_NOTICIAS, NOTICIAS } from '../lib/noticias-contenido';
import { CAPITULOS_INICIO, CIFRAS_MERCADO_EL, textosInicio } from '../lib/inicio-contenido';
import { FUENTES_INICIO, GRUPOS_FUENTES_INICIO } from '../lib/inicio-fuentes';
import { cifrasInicio, mercadoAlDia } from '../lib/inicio-cifras';
import { datosCortosOferta } from '../lib/transparencia';
import { resumenOferta } from '../lib/ficha-editorial';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

const COMUNIDAD_ABIERTA = false;

/* ---------------------------------------------------------------------
   Inicio como historia (ESPEC-INICIO.md, la misma que la web)
   ---------------------------------------------------------------------
   Portada con el radar vivo y sus cuatro cifras del catálogo, el titular
   n.º 1 de HISTORIA-v2, «Ver las N ofertas» con el aviso de riesgo pegado
   y «Explorar el radar». Después, seis capítulos, la novedad, la Selección
   RWAdar con sus cinco comprobaciones a la vista, «Mira, compara y decide
   tú», las fuentes agrupadas por apartado y la nota legal.

   DECISIÓN DE VÍCTOR (04/11/2026): sin llamadas [n] en el texto. Cada
   capítulo acaba en un enlace discreto «Fuentes de este apartado», que abre
   la lista del final y baja a su grupo. Los «Saber más» empiezan cerrados.
   Las comunicaciones de la comunidad llegarán con las cuentas: hoy no se
   enseñan ni se simulan.
   --------------------------------------------------------------------- */

/* «dominio/…/final», como la web: corto y sin perder de dónde viene. */
export function enlaceCorto(url) {
  try {
    const u = new URL(url);
    const trozos = u.pathname.split('/').filter(Boolean).map((t) => { try { return decodeURIComponent(t); } catch { return t; } });
    const host = u.hostname.replace(/^www\./, '');
    if (!trozos.length) return host;
    const final = trozos[trozos.length - 1];
    return trozos.length === 1 ? `${host}/${final}` : `${host}/…/${final}`;
  } catch { return 'fuente'; }
}

function SaberMas({ t, puntos }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={e.saberMas}>
      <Pressable onPress={() => { tacto.eleccion(); setAbierto((v) => !v); }}
        style={({ pressed }) => [e.saberMasBoton, pressed && pulsado('b3')]}
        accessibilityRole="button" accessibilityState={{ expanded: abierto }} noTraducir accessibilityLabel={t.saberMas}>
        <Text noTraducir style={e.b3Txt}>{t.saberMas}</Text>
        <Text noTraducir style={e.b3Txt} accessible={false}>{abierto ? '−' : '+'}</Text>
      </Pressable>
      {abierto ? puntos.map((p) => (
        <View key={p} style={e.saberMasFila}>
          <Text noTraducir style={e.saberMasPunto} accessible={false}>·</Text>
          <Text noTraducir style={e.saberMasTxt}>{p}</Text>
        </View>
      )) : null}
    </View>
  );
}

function Rotulo({ n, texto }) {
  return (
    <View style={e.rotuloFila}>
      <Text noTraducir style={e.rotuloNum}>{String(n).padStart(2, '0')}</Text>
      <View style={e.rotuloRaya} />
      <Text noTraducir style={e.rotuloTxt}>{texto}</Text>
    </View>
  );
}

function Diagrama({ c }) {
  const Ruta = ({ titulo, nodos, nueva }) => (
    <View style={e.ruta}>
      <Text noTraducir style={[e.rutaTit, nueva && e.rutaTitNueva]}>{titulo}</Text>
      {nodos.map((nodo, i) => {
        const extremo = i === 0 || i === nodos.length - 1;
        const registro = nueva && i === 2;
        return (
          <View key={nodo}>
            {i ? <View style={e.rutaUnion} /> : null}
            <View style={[e.nodo, extremo && e.nodoExtremo, registro && e.nodoRegistro]}>
              <Text noTraducir style={[e.nodoTxt, extremo && e.nodoTxtExtremo, registro && e.nodoTxtRegistro]}>{nodo}</Text>
              {registro ? <Text noTraducir style={e.nodoPie}>{c.registroPie}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
  return (
    <View style={e.diagrama}>
      <View style={e.diagramaRutas}>
        <Ruta titulo={c.hoy} nodos={c.rutaHoy} />
        <Ruta titulo={c.nuevo} nodos={c.rutaNueva} nueva />
      </View>
      {c.filas.map(([rotulo, hoy, nuevo]) => (
        <View key={rotulo} style={e.diagramaFila}>
          <View style={e.diagramaCelda}>
            <Text noTraducir style={e.diagramaRotulo}>{rotulo}</Text>
            <Text noTraducir style={e.diagramaHoy}>{hoy}</Text>
          </View>
          <View style={e.diagramaCelda}>
            <Text noTraducir style={e.diagramaRotulo}>{rotulo}</Text>
            <Text noTraducir style={e.diagramaNuevo}>{nuevo}</Text>
          </View>
        </View>
      ))}
      <Text noTraducir style={e.diagramaPie}>{c.pie}</Text>
    </View>
  );
}

function Barra({ etiqueta, valor, fraccion, destacada }) {
  return (
    <View style={e.barraFila}>
      <View style={e.barraTextos}>
        <Text noTraducir style={e.barraEtiqueta}>{etiqueta}</Text>
        <Text noTraducir style={e.barraValor}>{valor}</Text>
      </View>
      <View style={e.barraPista}>
        <View style={[e.barraRelleno, destacada && e.barraRellenoOn, { width: `${Math.max(0.8, fraccion * 100)}%` }]} />
      </View>
    </View>
  );
}

function Carrusel({ c }) {
  const { width } = useWindowDimensions();
  const ancho = Math.min(320, width - UI.margen * 2 - 36);
  const paso = ancho + 12;
  const lista = useRef(null);
  const [indice, setIndice] = useState(0);
  const ir = (i) => {
    const destino = Math.max(0, Math.min(c.tarjetas.length - 1, i));
    setIndice(destino);
    lista.current?.scrollTo?.({ x: destino * paso, animated: true });
  };
  return (
    <View style={e.carrusel}>
      <Text noTraducir style={e.carruselTit} accessibilityRole="header">{c.carrusel}</Text>
      <Text noTraducir style={e.carruselNota}>{c.carruselNota}</Text>
      <ScrollView ref={lista} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToInterval={paso} snapToAlignment="start" contentContainerStyle={e.carruselPista}
        onMomentumScrollEnd={(ev) => setIndice(Math.round(ev.nativeEvent.contentOffset.x / paso))}
        onScroll={(ev) => { const i = Math.round(ev.nativeEvent.contentOffset.x / paso); if (i !== indice) setIndice(i); }}
        scrollEventThrottle={64}>
        {c.tarjetas.map((t) => (
          <View key={t.cab} style={[e.tarjetaTexto, { width: ancho }]} accessible>
            <Text noTraducir style={e.tarjetaCab}>{t.cab}</Text>
            {t.cifra ? <>
              <Text noTraducir style={e.tarjetaCifra}>{t.cifra}</Text>
              <Text noTraducir style={e.tarjetaPie}>{t.pie}</Text>
            </> : <Text noTraducir style={e.tarjetaEtiqueta}>{t.etiqueta}</Text>}
            <Text noTraducir style={e.tarjetaTxt}>{t.texto}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={e.carruselMando}>
        <Pressable onPress={() => ir(indice - 1)} disabled={indice === 0}
          style={({ pressed }) => [e.bi, indice === 0 && e.biApagado, pressed && pulsado('icono')]}
          accessibilityRole="button" noTraducir accessibilityLabel={c.anterior} accessibilityState={{ disabled: indice === 0 }}>
          <View style={{ transform: [{ rotate: '180deg' }] }}><Icono nombre="flecha" color={indice === 0 ? C.tx3 : C.tx} tamano={18} /></View>
        </Pressable>
        <Text noTraducir style={e.carruselPos} accessibilityLiveRegion="polite">{`${indice + 1} / ${c.tarjetas.length}`}</Text>
        <Pressable onPress={() => ir(indice + 1)} disabled={indice === c.tarjetas.length - 1}
          style={({ pressed }) => [e.bi, indice === c.tarjetas.length - 1 && e.biApagado, pressed && pulsado('icono')]}
          accessibilityRole="button" noTraducir accessibilityLabel={c.siguiente}
          accessibilityState={{ disabled: indice === c.tarjetas.length - 1 }}>
          <Icono nombre="flecha" color={indice === c.tarjetas.length - 1 ? C.tx3 : C.tx} tamano={18} />
        </Pressable>
      </View>
    </View>
  );
}

/* 458 puntos, uno por advertencia de la CNMV en 2025. */
function CampoPuntos({ n = 458 }) {
  const { width } = useWindowDimensions();
  const ancho = Math.min(width - UI.margen * 2, 420);
  const columnas = 23, paso = ancho / columnas, filas = Math.ceil(n / columnas);
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={e.campo}>
      <Svg width={ancho} height={filas * paso}>
        {Array.from({ length: n }, (_, i) => (
          <Circle key={i} cx={(i % columnas) * paso + paso / 2} cy={Math.floor(i / columnas) * paso + paso / 2}
            r={Math.min(3.2, paso * 0.22)} fill={C.aviso} opacity={0.85} />
        ))}
      </Svg>
    </View>
  );
}

function Bloque({ n, c, t, onFuentes, onLayout, children, pie = null }) {
  return (
    <View style={e.capitulo} onLayout={onLayout}>
      <Rotulo n={n} texto={c.rotulo} />
      {children}
      {c.saberMas ? <SaberMas t={t} puntos={c.saberMas} /> : null}
      <Pressable onPress={onFuentes} style={({ pressed }) => [e.fuentesApartado, pressed && pulsado('b3')]}
        accessibilityRole="link" noTraducir accessibilityLabel={`${t.fuentesApartado}: ${c.rotulo}`}>
        <Text noTraducir style={e.fuentesApartadoTxt}>{t.fuentesApartado} ›</Text>
      </Pressable>
      {pie}
    </View>
  );
}

export default function Inicio({
  refrescando, onActualizar, onDestino, onExplicar, fuera = [], cambios = [], renderCambio,
  plataformas = [], ofertas = [], fechaCatalogo = null, onAbrirPlataforma, onAbrirOferta, onAbrirEnlace,
}) {
  const idioma = useIdioma();
  const t = textosInicio(idioma);
  // Si se ve el botón, se ve el aviso (ESPEC-INICIO §3, juez de normas). Por
  // debajo de 700 px de alto el radar se encoge sin rótulos. Y el aviso va
  // antes del botón si, después, quedaría bajo la barra: se decide midiendo
  // (letra grande de Android, «Revisión pendiente» arriba, 360 × 780…). El
  // bloque mide lo mismo en los dos órdenes, así que no oscila.
  const { height: altoPantalla } = useWindowDimensions();
  const compacta = altoPantalla < 700;
  const [altoVisible, setAltoVisible] = useState(0);
  const [finAccion, setFinAccion] = useState(0);
  const avisoPrimero = compacta || (altoVisible > 0 && finAccion > altoVisible);
  const lengua = idioma === 'en' ? 'en-US' : 'es-ES';
  const cifras = cifrasInicio({ ofertas, plataformas, descartadas: fuera, fechaCatalogo,
    orden: Object.keys(t.seleccion.letraPequena) });
  // Las cifras de mercado del 03 caducan a los 7 días aunque no haya OTA (§9).
  const mercado = mercadoAlDia(CIFRAS_MERCADO_EL);
  const n = cifras.vigente ? cifras.ofertas : 0;
  const desplazamiento = useRef(null);
  const posiciones = useRef({});
  const pendiente = useRef(null);
  const [fuentesAbiertas, setFuentesAbiertas] = useState(false);
  const [novedadesAbiertas, setNovedadesAbiertas] = useState(false);
  const cap = t.capitulos;
  const ultima = NOTICIAS[0];

  const bajarA = (y) => desplazamiento.current?.scrollTo?.({ y: Math.max(0, y - 8), animated: true });
  const guardar = (clave) => (ev) => { posiciones.current[clave] = ev.nativeEvent.layout.y; };
  // El fin del bloque botón + aviso, en el contenido (portada + bloque).
  const accion = useRef(null);
  const calcularFin = () => {
    if (!accion.current || posiciones.current.portada == null) return;
    const fin = Math.round(posiciones.current.portada + accion.current.y + accion.current.height);
    setFinAccion((antes) => (antes === fin ? antes : fin));
  };
  const medirAccion = (ev) => { accion.current = ev.nativeEvent.layout; calcularFin(); };
  const guardarGrupo = (id) => (ev) => {
    posiciones.current[`grupo:${id}`] = ev.nativeEvent.layout.y;
    if (pendiente.current === id && posiciones.current.fuentes != null) {
      pendiente.current = null;
      bajarA(posiciones.current.fuentes + ev.nativeEvent.layout.y);
    }
  };
  const irAFuentes = (id) => {
    tacto.eleccion();
    const y = posiciones.current[`grupo:${id}`];
    if (fuentesAbiertas && y != null && posiciones.current.fuentes != null) { bajarA(posiciones.current.fuentes + y); return; }
    pendiente.current = id;
    setFuentesAbiertas(true);
  };
  const porNumero = new Map(FUENTES_INICIO.map((f) => [f.n, f]));

  return (
    <ScrollView
      ref={desplazamiento}
      onLayout={(ev) => setAltoVisible(Math.round(ev.nativeEvent.layout.height))}
      contentContainerStyle={e.cuerpo}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onActualizar} tintColor={C.senal} />}
    >
      {/* 0 · Portada: el radar vivo, sin caja de búsqueda. */}
      <View style={e.portada} onLayout={(ev) => { guardar('portada')(ev); calcularFin(); }}>
        <View style={[e.radarCaja, compacta && e.radarCajaBaja]}>
          {/* En pantallas bajas (iPhone SE) el dibujo se encoge sin rótulos, como la web. */}
          <Radar datos={plataformas} portada tamano={compacta ? 132 : 264} sinRotulos={compacta}
            onAbrir={(p) => onAbrirPlataforma?.(p)} onFiltrar={() => {}} />
          <View style={[e.esquina, e.esquinaSupIzq]} pointerEvents="none">
            <Text noTraducir style={e.esquinaCifra}>{cifras.vigente ? cifras.ofertas : '—'}</Text>
            <Text noTraducir style={e.esquinaTxt}>{t.portada.radar.ofertas}</Text>
          </View>
          <View style={[e.esquina, e.esquinaSupDer]} pointerEvents="none">
            <Text noTraducir style={[e.esquinaCifra, e.derecha]}>{cifras.vigente ? cifras.plataformas : '—'}</Text>
            <Text noTraducir style={[e.esquinaTxt, e.derecha]}>{t.portada.radar.plataformas}</Text>
          </View>
          <View style={[e.esquina, e.esquinaInfIzq]} pointerEvents="none">
            <Text noTraducir style={[e.esquinaCifra, e.esquinaCifraDescartadas]}>{cifras.vigente ? cifras.descartadas : '—'}</Text>
            <Text noTraducir style={e.esquinaTxt}>{t.portada.radar.descartadas}</Text>
          </View>
          <View style={[e.esquina, e.esquinaInfDer]} pointerEvents="none">
            <Text noTraducir style={[e.esquinaTxt, e.derecha]}>{cifras.vigente ? t.portada.radar.revisado : ''}</Text>
            <Text noTraducir style={[e.esquinaFecha, !cifras.vigente && e.esquinaPendiente, e.derecha]}>{cifras.vigente ? cifras.revisado : (idioma === 'en' ? 'Review pending' : 'Revisión pendiente')}</Text>
          </View>
        </View>
        <Text noTraducir style={[e.antetitulo, compacta && e.antetituloBaja]}>{t.portada.antetitulo}</Text>
        <Text noTraducir idiomaOriginal={lengua} style={e.titularPortada} accessibilityRole="header">{t.portada.titular}</Text>
        <Text noTraducir style={[e.subtitulo, compacta && e.subtituloBaja]}>{t.portada.subtitulo(n)}</Text>
        {/* El aviso va pegado al botón: si se ve el botón, se ve el aviso. */}
        <View style={[e.accionPortada, compacta && e.accionPortadaBaja]} onLayout={medirAccion}>
          {avisoPrimero ? <Text noTraducir style={e.avisoPortada}>{t.portada.aviso}</Text> : null}
          <Pressable onPress={() => { tacto.abrir(); onDestino('ofertas'); }}
            style={({ pressed }) => [e.b1, pressed && pulsado('b1')]} accessibilityRole="button" noTraducir
            accessibilityLabel={t.portada.boton(n)}>
            <Text noTraducir style={e.b1Txt}>{t.portada.boton(n)}</Text>
          </Pressable>
          {avisoPrimero ? null : <Text noTraducir style={e.avisoPortada}>{t.portada.aviso}</Text>}
        </View>
        <Pressable onPress={() => { tacto.eleccion(); onDestino('plataformas'); }}
          style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button" noTraducir
          accessibilityLabel={t.portada.explorar}>
          <Text noTraducir style={e.b3Txt}>{t.portada.explorar} ›</Text>
        </Pressable>
        <Pressable onPress={() => irAFuentes('portada')} style={({ pressed }) => [e.fuentesApartado, pressed && pulsado('b3')]}
          accessibilityRole="link" noTraducir accessibilityLabel={`${t.fuentesApartado}: ${GRUPOS_FUENTES_INICIO[0][idioma === 'en' ? 'en' : 'es']}`}>
          <Text noTraducir style={e.fuentesApartadoTxt}>{t.fuentesApartado} ›</Text>
        </Pressable>
      </View>

      {cambios.length ? (
        <View style={e.seccion}>
          <Text style={e.seccionTit}>Cambios en lo que sigues</Text>
          {cambios.map((c) => <View key={String(c.id)}>{renderCambio(c)}</View>)}
        </View>
      ) : null}

      {/* 01 · De dónde viene */}
      <Bloque n={1} c={cap.cap1} t={t} onFuentes={() => irAFuentes('cap1')} onLayout={guardar('cap1')}>
        <Text noTraducir style={e.rotuloPequeno}>{cap.cap1.queEsRotulo}</Text>
        <Text noTraducir style={e.queEs}>{cap.cap1.queEs}</Text>
        <Text noTraducir style={e.texto}>{cap.cap1.queEsMas}</Text>
        <Text noTraducir style={e.titular} accessibilityRole="header">{cap.cap1.titular}</Text>
        <Text noTraducir style={e.texto}>{cap.cap1.texto}</Text>
        <View style={e.genesis}>
          <View style={e.cadena} accessible={false}>
            {[0, 1, 2, 3, 4].map((i) => <View key={i} style={[e.cubo, i === 0 && e.cuboOn]} />)}
          </View>
          <Text noTraducir style={e.genesisTit}>{cap.cap1.genesis}</Text>
          <Text noTraducir idiomaOriginal="en-GB" style={e.genesisOriginal}>The Times 03/Jan/2009 Chancellor on brink of second bailout for banks</Text>
          <Text noTraducir style={e.genesisPie}>{cap.cap1.genesisPie}</Text>
        </View>
        <Text noTraducir style={e.cita20}>{cap.cap1.cita}</Text>
        <Text noTraducir style={e.citaAutor}>{cap.cap1.citaAutor}</Text>
        <Text noTraducir style={e.cita20}>{cap.cap1.contrapunto}</Text>
      </Bloque>

      {/* 02 · Qué cambia */}
      <Bloque n={2} c={cap.cap2} t={t} onFuentes={() => irAFuentes('cap2')} onLayout={guardar('cap2')}>
        <Text noTraducir style={e.titular} accessibilityRole="header">{cap.cap2.titular}</Text>
        <Diagrama c={cap.cap2} />
        <Text noTraducir style={e.cita28}>{cap.cap2.cita}</Text>
        <Text noTraducir style={e.citaAutor}>{cap.cap2.citaAutor}</Text>
        <Text noTraducir style={e.texto}>{cap.cap2.debajo}</Text>
      </Bloque>

      {/* 03 · Quién lo usa ya */}
      <Bloque n={3} c={cap.cap3} t={t} onFuentes={() => irAFuentes('cap3')} onLayout={guardar('cap3')}>
        <Text noTraducir style={e.titular} accessibilityRole="header">{cap.cap3.titular}</Text>
        <Text noTraducir style={e.texto}>{cap.cap3.texto1}</Text>
        <Text noTraducir style={e.texto}>{cap.cap3.texto2}</Text>
        {mercado ? (
          <View style={e.cifraBloque}>
            <Text noTraducir style={e.cifra64}>{cap.cap3.cifra}</Text>
            <Text noTraducir style={e.cifra36}>{cap.cap3.cifraUnidad}</Text>
            <Text noTraducir style={e.texto}>{cap.cap3.cifraPie}</Text>
            {cap.cap3.barras.map(([etiqueta, valor, v], i) => (
              <Barra key={etiqueta} etiqueta={etiqueta} valor={valor} fraccion={v / cap.cap3.barras[1][2]} destacada={i === 1} />
            ))}
          </View>
        ) : <Text noTraducir style={e.texto}>{cap.cap3.sinCifra}</Text>}
        <Text noTraducir style={e.nota}>{cap.cap3.nota}</Text>
        <Carrusel c={cap.cap3} />
      </Bloque>

      {/* 04 · Por qué te importa */}
      <Bloque n={4} c={cap.cap4} t={t} onFuentes={() => irAFuentes('cap4')} onLayout={guardar('cap4')}>
        <Text noTraducir style={e.titular} accessibilityRole="header">{cap.cap4.titular}</Text>
        <Text noTraducir style={e.texto}>{cap.cap4.texto}</Text>
        <View style={e.cifraBloque}>
          {cap.cap4.cifras.map(([cifra, grupo, v], i) => (
            <View key={cifra} style={e.brecha}>
              <Text noTraducir style={e.cifra36}>{cifra}</Text>
              <Text noTraducir style={e.texto}>{grupo}</Text>
              <View style={e.barraPista}><View style={[e.barraRelleno, i === 0 && e.barraRellenoOn, { width: `${v}%` }]} /></View>
            </View>
          ))}
          <Text noTraducir style={e.texto}>{cap.cap4.cifrasPie}</Text>
        </View>
        {cifras.vigente && cifras.minimos ? (
          <Text noTraducir style={e.texto}>{cap.cap4.minimos(cifras.minimos, cifras.ofertas, cifras.usd)}</Text>
        ) : null}
        <Text noTraducir style={e.texto}>{cap.cap4.aviso}</Text>
      </Bloque>

      {/* 05 · Los riesgos */}
      <Bloque n={5} c={{ ...cap.cap5, saberMas: null }} t={t} onFuentes={() => irAFuentes('cap5')} onLayout={guardar('cap5')}
        pie={<Text noTraducir style={e.puente} accessibilityRole="header">{cap.cap5.puente}</Text>}>
        <Text noTraducir style={e.titular} accessibilityRole="header">{cap.cap5.titular}</Text>
        <View style={e.tablaRiesgos}>
          <View style={e.tablaFila}>
            <Text noTraducir style={[e.tablaCab, e.tablaCelda]}>{cap.cap5.ventajas}</Text>
            <Text noTraducir style={[e.tablaCab, e.tablaCelda]}>{cap.cap5.riesgos}</Text>
          </View>
          {cap.cap5.tabla.map(([ventaja, riesgo]) => (
            <View key={ventaja} style={[e.tablaFila, e.tablaFilaLinea]}>
              <Text noTraducir style={[e.tablaTxt, e.tablaCelda]}>{ventaja}</Text>
              <Text noTraducir style={[e.tablaTxt, e.tablaCelda]}>{riesgo}</Text>
            </View>
          ))}
        </View>
        <View style={e.cifraBloque}>
          <Text noTraducir style={e.cifra64}>{cap.cap5.cifra}</Text>
          <Text noTraducir style={e.texto}>{cap.cap5.cifraPie}</Text>
          <CampoPuntos n={458} />
        </View>
        <View style={e.caso}>
          <Text noTraducir style={e.casoEtiqueta}>{cap.cap5.caso}</Text>
          <Text noTraducir style={e.texto}>{cap.cap5.casoTexto}</Text>
          <Pressable onPress={() => { tacto.eleccion(); onDestino('fuera'); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
            accessibilityRole="link" noTraducir accessibilityLabel={cap.cap5.casoEnlace}>
            <Text noTraducir style={e.b3Txt}>{cap.cap5.casoEnlace}</Text>
          </Pressable>
        </View>
        <SaberMas t={t} puntos={cap.cap5.saberMas} />
      </Bloque>

      {/* 06 · Para qué sirve: el único tren, como titular. */}
      <Bloque n={6} c={cap.cap6} t={t} onFuentes={() => irAFuentes('cap6')} onLayout={guardar('cap6')}>
        <Text noTraducir style={e.titular} accessibilityRole="header">{cap.cap6.titular}</Text>
        <Text noTraducir style={e.texto}>{cap.cap6.texto}</Text>
        <View style={e.cifraBloque}>
          <Text noTraducir style={e.cifra64}>{cap.cap6.cifra}</Text>
          <Text noTraducir style={e.texto}>{cap.cap6.cifraPie}</Text>
        </View>
        <Text noTraducir style={e.texto}>
          {cifras.vigente && cifras.hasta ? `${cap.cap6.vigencia(cifras.revisado, cifras.hasta)} ` : ''}{cap.cap6.riesgo}
        </Text>
        <Pressable onPress={() => { tacto.eleccion(); onDestino('plataformas'); }}
          style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button" noTraducir
          accessibilityLabel={t.portada.explorar}>
          <Text noTraducir style={e.b3Txt}>{t.portada.explorar} ›</Text>
        </Pressable>
      </Bloque>

      {/* Novedades: una línea con la última y, al tocar, todas. */}
      {ultima ? (
        <View style={e.novedades}>
          <Text style={e.novedadTxt}><Text style={e.novedadFecha}>{ultima.fechaTexto}</Text> · {ultima.titulo}</Text>
          <Pressable onPress={() => { tacto.eleccion(); setNovedadesAbiertas((v) => !v); }}
            style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button"
            accessibilityState={{ expanded: novedadesAbiertas }} noTraducir accessibilityLabel={t.novedades}>
            <Text noTraducir style={e.b3Txt}>{t.novedades} {novedadesAbiertas ? '−' : '›'}</Text>
          </Pressable>
          {novedadesAbiertas ? NOTICIAS.map((noticia) => {
            const destino = noticia.destino && DESTINOS_NOTICIAS[noticia.destino];
            return (
              <View key={noticia.id} style={e.noticia} accessible
                accessibilityLabel={`${noticia.etiqueta}, ${noticia.fechaTexto}. ${noticia.titulo}. ${noticia.texto}`}>
                <Text style={e.noticiaMeta}>{noticia.etiqueta} · {noticia.fechaTexto}</Text>
                <Text style={e.noticiaTit}>{noticia.titulo}</Text>
                <Text style={e.noticiaTxt}>{noticia.texto}</Text>
                {destino ? (
                  <Pressable onPress={() => { tacto.abrir(); onDestino(destino.app); }}
                    style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button"
                    accessibilityLabel={destino.texto}>
                    <Text style={e.b3Txt}>{destino.texto} ›</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }) : null}
        </View>
      ) : null}

      {/* Selección RWAdar: las 5 comprobaciones a la vista (el superlativo
          solo vale con ellas delante). Sin catálogo vigente no se enseña. */}
      {cifras.vigente && cifras.seleccion.length ? (
        <View style={e.seleccion} onLayout={guardar('seleccion')}>
          <Text noTraducir style={e.antetituloVerde}>{t.seleccion.antetitulo}</Text>
          <Text noTraducir style={e.titular} accessibilityRole="header">{t.seleccion.titular(cifras.seleccion.length)}</Text>
          <Text noTraducir style={e.texto}>{t.seleccion.texto(cifras.ofertas, cifras.revisado)}</Text>
          <View style={e.criterios}>
            {t.seleccion.criterios.map((c, i) => (
              <View key={c} style={e.criterio}>
                <Text noTraducir style={e.criterioNum}>{i + 1}</Text>
                <Text noTraducir style={e.criterioTxt}>{c}</Text>
              </View>
            ))}
          </View>
          {cifras.seleccion.map((o) => {
            const minimo = String(datosCortosOferta(o, resumenOferta(o, [], new Date()))[0][1] || '')
              .replace(/^(\d+(?:,\d+)?) USD$/, '$1 $');
            const letra = t.seleccion.letraPequena[o.slug] || t.seleccion.letraRespaldo;
            return (
              <View key={o.slug} style={e.tarjetaSel}>
                <ImagenOferta oferta={o} decorativa estilo={e.tarjetaSelImagen} />
                <View style={e.tarjetaSelCuerpo}>
                  <Text noTraducir style={e.tarjetaSelProveedor}>{o.plataformaNombre}</Text>
                  <Text noTraducir idiomaOriginal="es-ES" style={e.tarjetaSelTit}>{o.titulo}</Text>
                  <Text noTraducir style={e.tarjetaSelLetra}>{letra}</Text>
                  {minimo ? <Text noTraducir style={e.tarjetaSelMinimo}>{t.seleccion.minimo} <Text noTraducir style={e.tarjetaSelMinimoDato}>{minimo}</Text></Text> : null}
                  <Pressable onPress={() => { tacto.abrir(); onAbrirOferta?.(o); }}
                    style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button" noTraducir
                    accessibilityLabel={`${t.seleccion.verFicha}: ${o.titulo}`}>
                    <Text noTraducir style={e.b3Txt}>{t.seleccion.verFicha} ›</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          <Text noTraducir style={e.texto}>{t.seleccion.aviso}</Text>
          <Text noTraducir style={e.nota}>{t.seleccion.imagenes}</Text>
          <Pressable onPress={() => irAFuentes('seleccion')} style={({ pressed }) => [e.fuentesApartado, pressed && pulsado('b3')]}
            accessibilityRole="link" noTraducir accessibilityLabel={`${t.fuentesApartado}: ${t.seleccion.antetitulo}`}>
            <Text noTraducir style={e.fuentesApartadoTxt}>{t.fuentesApartado} ›</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Por dónde seguir */}
      <View style={e.seguir}>
        <Text noTraducir style={e.titular} accessibilityRole="header">{t.seguir.titular}</Text>
        <Pressable onPress={() => { tacto.abrir(); onDestino('ofertas'); }} style={({ pressed }) => [e.b1, e.b1Seguir, pressed && pulsado('b1')]}
          accessibilityRole="button" noTraducir accessibilityLabel={t.seguir.ofertas(n)}>
          <Text noTraducir style={e.b1Txt}>{t.seguir.ofertas(n)}</Text>
        </Pressable>
        <Pressable onPress={() => { tacto.abrir(); onDestino('plataformas'); }} style={({ pressed }) => [e.b2, pressed && pulsado('b2')]}
          accessibilityRole="button" noTraducir accessibilityLabel={t.seguir.plataformas(cifras.vigente ? cifras.plataformas : 0)}>
          <Text noTraducir style={e.b2Txt}>{t.seguir.plataformas(cifras.vigente ? cifras.plataformas : 0)}</Text>
        </Pressable>
        <Pressable onPress={onExplicar} style={({ pressed }) => [e.banner, pressed && pulsado('b2')]}
          accessibilityRole="button" accessibilityLabel="Abrir explicación animada sobre tokenización">
          <View style={e.bannerMarca}><Icono nombre="ayuda" color={C.senal} tamano={20} /></View>
          <View style={{ flex: 1 }}>
            <Text style={e.bannerTit}>¿Qué es tokenizar un activo?</Text>
            <Text style={e.bannerSub}>Explicado con una animación 3D, paso a paso</Text>
          </View>
          <Icono nombre="flecha" color={C.tx3} tamano={18} />
        </Pressable>
      </View>

      {/* Sin cuentas no hay comunidad: el bloque no se enseña hasta que se
          encienda, para no llenar Inicio de «próximamente». */}
      {COMUNIDAD_ABIERTA ? (
      <View style={e.seccion}>
        <Text style={e.seccionTit} accessibilityRole="header">Comunidad</Text>
        <Text style={e.texto}>
          Cuando se abran las cuentas, cada cuenta podrá compartir aquí una publicación al día.
          Antes publicaremos las normas de la comunidad.
        </Text>
      </View>
      ) : null}

      {/* Fuentes, agrupadas por apartado y con enlace. */}
      <View style={e.fuentes} onLayout={guardar('fuentes')}>
        <Pressable onPress={() => { tacto.eleccion(); setFuentesAbiertas((v) => !v); }}
          style={({ pressed }) => [e.fuentesCab, pressed && pulsado('b3')]} accessibilityRole="button"
          accessibilityState={{ expanded: fuentesAbiertas }} noTraducir accessibilityLabel={t.fuentes.titulo(FUENTES_INICIO.length)}>
          <Text noTraducir style={e.fuentesTit}>{t.fuentes.titulo(FUENTES_INICIO.length)}</Text>
          <Text noTraducir style={e.fuentesTit} accessible={false}>{fuentesAbiertas ? '−' : '+'}</Text>
        </Pressable>
        {fuentesAbiertas ? (
          <>
            <Text noTraducir style={e.nota}>{t.fuentes.nota}</Text>
            {GRUPOS_FUENTES_INICIO.map((g) => (
              <View key={g.id} style={e.grupoFuentes} onLayout={guardarGrupo(g.id)}>
                <Text noTraducir style={e.grupoFuentesTit} accessibilityRole="header">{idioma === 'en' ? g.en : g.es}</Text>
                {g.fuentes.map((num) => porNumero.get(num)).filter(Boolean).map((f) => (
                  <View key={`${g.id}-${f.n}`} style={e.fuenteFila}>
                    <Text noTraducir idiomaOriginal="es-ES" style={e.fuenteTxt}>{f.texto}</Text>
                    <View style={e.fuenteEnlaces}>
                    {f.urls.map((url) => (
                      <Pressable key={url} onPress={() => onAbrirEnlace?.(url)} style={({ pressed }) => [e.fuenteEnlace, pressed && pulsado('b3')]}
                        accessibilityRole="link" noTraducir accessibilityLabel={`${f.texto}: ${url}`}>
                        <Text noTraducir style={e.fuenteEnlaceTxt} numberOfLines={1}>{enlaceCorto(url)} ↗</Text>
                      </Pressable>
                    ))}
                    </View>
                  </View>
                ))}
                {posiciones.current[g.id] != null ? (
                  <Pressable onPress={() => { tacto.eleccion(); bajarA(posiciones.current[g.id]); }}
                    style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button" noTraducir
                    accessibilityLabel={t.fuentes.volver}>
                    <Text noTraducir style={e.b3Txt}>↑ {t.fuentes.volver}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </View>

      {/* Nota legal y advertencia de riesgo, con la letra del texto. */}
      <View style={e.legal}>
        <Text noTraducir style={e.legalTit} accessibilityRole="header">{t.legal.titulo}</Text>
        {t.legal.parrafos.map((p) => <Text key={p.slice(0, 24)} noTraducir style={e.texto}>{p}</Text>)}
      </View>
      <Text noTraducir style={e.pie}>{t.legal.pie}</Text>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  cuerpo: { paddingHorizontal: UI.margen, paddingTop: 8, paddingBottom: 40 },

  /* Botones de la guía (GUIA-ACABADOS §4). */
  b1: { minHeight: UI.boton, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  b1Seguir: { marginTop: 16 },
  b1Txt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.enSenal },
  b2: { minHeight: UI.boton, borderRadius: R.m, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 10 },
  b2Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  b3: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, marginHorizontal: -8 },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  bi: { width: 44, height: 44, borderRadius: R.p, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center' },
  biApagado: { opacity: 0.5 },

  /* Portada */
  portada: { paddingBottom: 8 },
  radarCaja: { position: 'relative', alignItems: 'center', justifyContent: 'center', minHeight: 290, paddingVertical: 4 },
  radarCajaBaja: { minHeight: 136, paddingVertical: 0 },
  esquina: { position: 'absolute', maxWidth: 120 },
  esquinaSupIzq: { left: 0, top: 0 },
  esquinaSupDer: { right: 0, top: 0, alignItems: 'flex-end' },
  esquinaInfIzq: { left: 0, bottom: 0 },
  esquinaInfDer: { right: 0, bottom: 0, alignItems: 'flex-end' },
  derecha: { textAlign: 'right' },
  esquinaCifra: { ...T.instrumento, fontSize: 30, lineHeight: 34, color: C.tx },
  esquinaCifraDescartadas: { color: C.alarma },
  esquinaTxt: { ...T.menor, fontSize: 13, lineHeight: 17, color: C.tx3 },
  esquinaFecha: { ...T.instrumento, fontSize: 15, lineHeight: 20, color: C.tx },
  esquinaPendiente: { ...T.dato, fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  antetitulo: { ...T.etiqueta, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 10 },
  antetituloBaja: { marginTop: 4 },
  titularPortada: { ...T.titular, color: C.tx, marginTop: 6 },
  subtitulo: { ...T.cuerpo, color: C.tx2, marginTop: 10 },
  subtituloBaja: { marginTop: 6 },
  accionPortada: { marginTop: 16, gap: 10 },
  accionPortadaBaja: { marginTop: 10, gap: 8 },
  avisoPortada: { ...T.cuerpo, color: C.tx2 },

  /* Capítulos */
  capitulo: { paddingTop: 36, marginTop: 28, borderTopWidth: 1, borderTopColor: C.bd },
  rotuloFila: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  rotuloNum: { ...T.dato, fontFamily: F.semi, color: C.tx },
  rotuloRaya: { width: 24, height: 1, backgroundColor: C.tx3 },
  rotuloTxt: { ...T.etiqueta, fontSize: 13, color: C.tx3 },
  rotuloPequeno: { ...T.etiqueta, color: C.tx3, marginBottom: 6 },
  queEs: { ...T.seccion, fontFamily: F.media, color: C.tx, lineHeight: 27 },
  titular: { ...T.titular, color: C.tx, marginTop: 22, marginBottom: 4 },
  texto: { ...T.cuerpo, color: C.tx2, marginTop: 10 },
  nota: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 10 },
  cita20: { fontFamily: F.media, fontSize: 20, lineHeight: 28, letterSpacing: -0.2, color: C.tx, marginTop: 20 },
  cita28: { fontFamily: F.semi, fontSize: 28, lineHeight: 35, letterSpacing: -0.56, color: C.tx, marginTop: 24 },
  citaAutor: { ...T.menor, color: C.tx3, marginTop: 8 },
  genesis: { marginTop: 16, padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  cadena: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  cubo: { width: 22, height: 22, borderRadius: R.s / 2, backgroundColor: C.ton2 },
  cuboOn: { backgroundColor: C.senal },
  genesisTit: { ...T.etiqueta, color: C.tx3 },
  genesisOriginal: { ...T.instrumento, fontSize: 14, lineHeight: 21, color: C.tx, marginTop: 6 },
  genesisPie: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 8 },
  saberMas: { marginTop: 14 },
  saberMasBoton: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: R.m, paddingHorizontal: 8, marginHorizontal: -8 },
  saberMasFila: { flexDirection: 'row', gap: 8, marginTop: 8 },
  saberMasPunto: { ...T.cuerpo, color: C.tx3 },
  saberMasTxt: { ...T.cuerpo, fontSize: 15, lineHeight: 23, color: C.tx2, flex: 1 },
  fuentesApartado: { minHeight: UI.tactil, justifyContent: 'center', alignSelf: 'flex-start', borderRadius: R.m, paddingHorizontal: 8, marginHorizontal: -8, marginTop: 6 },
  fuentesApartadoTxt: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.media, color: C.tx3 },

  /* Diagrama del 02 */
  diagrama: { marginTop: 18, padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  diagramaRutas: { flexDirection: 'row', gap: 14 },
  ruta: { flex: 1 },
  rutaTit: { ...T.etiqueta, fontSize: 13, lineHeight: 18, color: C.tx3, marginBottom: 12, minHeight: 36 },
  rutaTitNueva: { color: C.tx },
  rutaUnion: { width: 2, height: 12, marginLeft: 14, backgroundColor: C.ton2 },
  nodo: { alignSelf: 'flex-start', borderRadius: R.m, backgroundColor: C.ton, paddingHorizontal: 12, paddingVertical: 8 },
  nodoExtremo: { backgroundColor: C.tx },
  nodoRegistro: { alignSelf: 'stretch', backgroundColor: C.senalT },
  nodoTxt: { ...T.menor, fontSize: 14, lineHeight: 19, color: C.tx2 },
  nodoTxtExtremo: { fontFamily: F.semi, color: C.s0 },
  nodoTxtRegistro: { fontFamily: F.semi, color: C.senal },
  nodoPie: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx2, marginTop: 3 },
  diagramaFila: { flexDirection: 'row', gap: 14, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.bd },
  diagramaCelda: { flex: 1 },
  diagramaRotulo: { ...T.etiqueta, color: C.tx3 },
  diagramaHoy: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx2, marginTop: 4 },
  diagramaNuevo: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx, marginTop: 4 },
  diagramaPie: { ...T.menor, color: C.tx2, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.bd },

  /* Cifras */
  cifraBloque: { marginTop: 22 },
  cifra64: { fontFamily: F.negrita, fontSize: 64, lineHeight: 68, letterSpacing: -1.3, color: C.tx, fontVariant: ['tabular-nums'] },
  cifra36: { fontFamily: F.negrita, fontSize: 36, lineHeight: 42, letterSpacing: -0.72, color: C.tx, fontVariant: ['tabular-nums'] },
  barraFila: { marginTop: 14 },
  barraTextos: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  barraEtiqueta: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3 },
  barraValor: { ...T.dato, color: C.tx },
  barraPista: { height: 8, borderRadius: R.p, backgroundColor: C.ton, overflow: 'hidden', marginTop: 6 },
  barraRelleno: { height: 8, borderRadius: R.p, backgroundColor: C.tx3 },
  barraRellenoOn: { backgroundColor: C.senal },
  brecha: { marginBottom: 14 },

  /* Carrusel «Quién más se ha movido»: tarjetas de texto, sin foto ni logotipo. */
  carrusel: { marginTop: 26 },
  carruselTit: { ...T.seccion, color: C.tx },
  carruselNota: { ...T.menor, color: C.tx2, marginTop: 6, marginBottom: 12 },
  carruselPista: { gap: 12, paddingRight: 24 },
  tarjetaTexto: { padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  tarjetaCab: { ...T.etiqueta, color: C.tx3 },
  tarjetaCifra: { fontFamily: F.negrita, fontSize: 28, lineHeight: 33, letterSpacing: -0.56, color: C.tx, marginTop: 10 },
  tarjetaPie: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 2 },
  tarjetaEtiqueta: { ...T.etiqueta, alignSelf: 'flex-start', color: C.tx2, backgroundColor: C.ton, borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, marginTop: 10, overflow: 'hidden' },
  tarjetaTxt: { ...T.menor, fontSize: 15, lineHeight: 22, color: C.tx2, marginTop: 10 },
  carruselMando: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  carruselPos: { ...T.dato, color: C.tx3, minWidth: 44, textAlign: 'center' },

  /* 05 */
  tablaRiesgos: { marginTop: 18, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, overflow: 'hidden' },
  tablaFila: { flexDirection: 'row' },
  tablaFilaLinea: { borderTopWidth: 1, borderTopColor: C.bd },
  tablaCelda: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  tablaCab: { ...T.etiqueta, fontSize: 13, color: C.tx3 },
  tablaTxt: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx },
  campo: { marginTop: 14 },
  caso: { marginTop: 22 },
  casoEtiqueta: { ...T.etiqueta, alignSelf: 'flex-start', color: C.tx2, backgroundColor: C.ton, borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  puente: { ...T.titular, color: C.tx, marginTop: 28 },

  /* Novedades */
  novedades: { marginTop: 32, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.bd },
  novedadTxt: { ...T.menor, fontSize: 15, lineHeight: 22, color: C.tx2 },
  novedadFecha: { fontFamily: F.semi, color: C.tx },
  noticia: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.bd },
  noticiaMeta: { ...T.etiqueta, color: C.tx3 },
  noticiaTit: { ...T.ficha, fontSize: 16, lineHeight: 22, color: C.tx, marginTop: 4 },
  noticiaTxt: { ...T.menor, color: C.tx2, marginTop: 4 },

  /* Selección */
  seleccion: { marginTop: 32, paddingTop: 28, borderTopWidth: 1, borderTopColor: C.bd },
  antetituloVerde: { ...T.etiqueta, fontSize: 13, color: C.senal },
  criterios: { marginTop: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, paddingHorizontal: 14, paddingVertical: 6 },
  criterio: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  criterioNum: { ...T.dato, fontFamily: F.semi, color: C.senal, width: 16 },
  criterioTxt: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx, flex: 1 },
  tarjetaSel: { marginTop: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, overflow: 'hidden' },
  tarjetaSelImagen: { width: '100%', aspectRatio: 1.6 },
  tarjetaSelCuerpo: { padding: 14 },
  tarjetaSelProveedor: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.semi, color: C.tx3 },
  tarjetaSelTit: { ...T.ficha, fontSize: 18, lineHeight: 23, color: C.tx, marginTop: 4 },
  tarjetaSelLetra: { ...T.menor, color: C.tx2, marginTop: 8 },
  tarjetaSelMinimo: { ...T.menor, color: C.tx3, marginTop: 8 },
  tarjetaSelMinimoDato: { fontFamily: F.semi, color: C.tx },

  /* Por dónde seguir */
  seguir: { marginTop: 32, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.bd, gap: 0 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 18, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  bannerMarca: { width: 40, height: 40, borderRadius: R.m, backgroundColor: C.senalT, alignItems: 'center', justifyContent: 'center' },
  bannerTit: { ...T.ficha, fontSize: 15, lineHeight: 20, color: C.tx },
  bannerSub: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx2, marginTop: 2 },
  seccion: { marginTop: 26 },
  seccionTit: { ...T.seccion, color: C.tx, marginBottom: 10 },

  /* Fuentes */
  fuentes: { marginTop: 32, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.bd },
  fuentesCab: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: R.m },
  fuentesTit: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
  grupoFuentes: { marginTop: 18 },
  grupoFuentesTit: { ...T.etiqueta, fontSize: 13, color: C.tx3, marginBottom: 4 },
  fuenteFila: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.bd },
  fuenteTxt: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx2 },
  fuenteEnlaces: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: -8 },
  fuenteEnlace: { minHeight: UI.tactil, justifyContent: 'center', borderRadius: R.m, paddingHorizontal: 8, maxWidth: '100%' },
  fuenteEnlaceTxt: { ...T.menor, fontSize: 14, lineHeight: 20, fontFamily: F.semi, color: C.senal },

  /* Nota legal */
  legal: { marginTop: 32, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.bd },
  legalTit: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
  pie: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
});
