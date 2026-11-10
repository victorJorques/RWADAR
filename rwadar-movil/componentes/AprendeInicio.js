import React, { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';

import { Icono } from './Navegacion';
import { LECCIONES } from '../lib/academy-contenido';
import { textosInicio } from '../lib/inicio-contenido';
import { FUENTES_INICIO, GRUPOS_FUENTES_INICIO } from '../lib/inicio-fuentes';
import { cifrasInicio } from '../lib/inicio-cifras';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Aprende»: la pantalla con los seis capítulos (rediseño de Inicio del
   10/11/2026, como /aprende/ en la web)
   ---------------------------------------------------------------------
   Los seis capítulos que hasta el 10/11/2026 contaban Inicio como una
   historia (ESPEC-INICIO.md, la misma que la web), tal como estaban: cada uno
   con su «Saber más» y «Fuentes de este apartado», que abre la lista del
   final en su grupo. Solo cambian de sitio. El 03 ya no lleva cifras de
   mercado: un enlace abre «El mercado hoy». Al final, la Academy, la
   explicación animada, las fuentes y la nota legal (que se abre sola si se
   llega desde «Nota legal completa» de Inicio).

   DECISIÓN DE VÍCTOR (04/11/2026): sin llamadas [n] en el texto. Los «Saber
   más» empiezan cerrados.
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

/* Un bloque plegado, como los <details> de la web: empieza cerrado. */
function Plegable({ titulo, children, estilo }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={[e.saberMas, estilo]}>
      <Pressable onPress={() => { tacto.eleccion(); setAbierto((v) => !v); }}
        style={({ pressed }) => [e.saberMasBoton, pressed && pulsado('b3')]}
        accessibilityRole="button" accessibilityState={{ expanded: abierto }} noTraducir accessibilityLabel={titulo}>
        <Text noTraducir style={e.b3Txt}>{titulo}</Text>
        <Text noTraducir style={e.b3Txt} accessible={false}>{abierto ? '−' : '+'}</Text>
      </Pressable>
      {abierto ? children : null}
    </View>
  );
}

function SaberMas({ t, puntos, extra = null }) {
  return (
    <Plegable titulo={t.saberMas}>
      {extra}
      {puntos.filter(Boolean).map((p) => (
        <View key={p} style={e.saberMasFila}>
          <Text noTraducir style={e.saberMasPunto} accessible={false}>·</Text>
          <Text noTraducir style={e.saberMasTxt}>{p}</Text>
        </View>
      ))}
    </Plegable>
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

/* «Quién más se ha movido»: cinco hechos con su cifra, como la web (las
   opiniones y las previsiones van rotuladas en el «Saber más»). */
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
  const ultima = c.tarjetas.length - 1;
  return (
    <View style={e.carrusel}>
      {/* Como la web: el título, «1 de 5» y las dos flechas en la misma fila. */}
      <View style={e.carruselCab}>
        <Text noTraducir style={e.carruselTit} accessibilityRole="header">{c.carrusel}</Text>
        <Text noTraducir style={e.carruselPos} accessibilityLiveRegion="polite">{c.posicion(indice + 1, c.tarjetas.length)}</Text>
        <Pressable onPress={() => ir(indice - 1)} disabled={indice === 0}
          style={({ pressed }) => [e.bi, e.biSuave, pressed && pulsado('icono')]}
          accessibilityRole="button" noTraducir accessibilityLabel={c.anterior} accessibilityState={{ disabled: indice === 0 }}>
          <View style={{ transform: [{ rotate: '180deg' }] }}><Icono nombre="flecha" color={indice === 0 ? C.tx3 : C.tx} tamano={18} /></View>
        </Pressable>
        <Pressable onPress={() => ir(indice + 1)} disabled={indice === ultima}
          style={({ pressed }) => [e.bi, indice === ultima && e.biSuave, pressed && pulsado('icono')]}
          accessibilityRole="button" noTraducir accessibilityLabel={c.siguiente}
          accessibilityState={{ disabled: indice === ultima }}>
          <Icono nombre="flecha" color={indice === ultima ? C.tx3 : C.tx} tamano={18} />
        </Pressable>
      </View>
      <Text noTraducir style={e.carruselNota}>{c.carruselNota}</Text>
      <ScrollView ref={lista} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToInterval={paso} snapToAlignment="start" contentContainerStyle={e.carruselPista}
        onMomentumScrollEnd={(ev) => setIndice(Math.round(ev.nativeEvent.contentOffset.x / paso))}
        onScroll={(ev) => { const i = Math.round(ev.nativeEvent.contentOffset.x / paso); if (i !== indice) setIndice(i); }}
        scrollEventThrottle={64}>
        {c.tarjetas.map((t) => (
          <View key={t.nombre} style={[e.tarjetaTexto, { width: ancho }]} accessible>
            <View style={e.tarjetaCab}>
              <Text noTraducir style={e.tarjetaNombre}>{t.nombre}</Text>
              <Text noTraducir style={e.tarjetaFecha}>{t.fecha}</Text>
            </View>
            <Text noTraducir style={e.tarjetaCifra}>{t.cifra}</Text>
            <Text noTraducir style={e.tarjetaPie}>{t.pie}</Text>
            <Text noTraducir style={e.tarjetaTxt}>{t.texto}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Bloque({ n, c, t, onFuentes, onLayout, children, pie = null, extraSaberMas = null }) {
  return (
    <View style={e.capitulo} onLayout={onLayout}>
      <Rotulo n={n} texto={c.rotulo} />
      {children}
      {c.saberMas ? <SaberMas t={t} puntos={c.saberMas} extra={extraSaberMas} /> : null}
      <Pressable onPress={onFuentes} style={({ pressed }) => [e.fuentesApartado, pressed && pulsado('b3')]}
        accessibilityRole="link" noTraducir accessibilityLabel={`${t.fuentesApartado}: ${c.rotulo}`}>
        <Text noTraducir style={e.fuentesApartadoTxt}>{t.fuentesApartado} ›</Text>
      </Pressable>
      {pie}
    </View>
  );
}

// Las lecciones que de verdad se pueden leer (las demás salen como «Próximamente»).
const LECCIONES_PUBLICADAS = LECCIONES.filter((l) => l.publicado).length;

export default function AprendeInicio({
  onDestino, onExplicar, onAbrirEnlace, onMercado, fuera = [], plataformas = [], ofertas = [], fechaCatalogo = null, irALegal = false,
}) {
  const idioma = useIdioma();
  const t = textosInicio(idioma);
  const b = t.bloques;
  const cifras = cifrasInicio({ ofertas, plataformas, descartadas: fuera, fechaCatalogo,
    orden: Object.keys(t.seleccion.letraPequena) });
  const n = cifras.vigente ? cifras.ofertas : 0;
  const desplazamiento = useRef(null);
  const posiciones = useRef({});
  const pendiente = useRef(null);
  const legalPendiente = useRef(irALegal);
  const [fuentesAbiertas, setFuentesAbiertas] = useState(false);
  const cap = t.capitulos;

  const bajarA = (y) => desplazamiento.current?.scrollTo?.({ y: Math.max(0, y - 8), animated: true });
  const guardar = (clave) => (ev) => { posiciones.current[clave] = ev.nativeEvent.layout.y; };
  // Desde «Nota legal completa» de Inicio: se baja a la nota en cuanto se sabe dónde está.
  const guardarLegal = (ev) => {
    posiciones.current.legal = ev.nativeEvent.layout.y;
    if (legalPendiente.current) { legalPendiente.current = false; setTimeout(() => bajarA(posiciones.current.legal), 60); }
  };
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
    <ScrollView ref={desplazamiento} contentContainerStyle={e.cuerpo}>
      {/* La entrada: el titular de la antigua portada, con sus fuentes. */}
      <View style={e.entrada} onLayout={guardar('portada')}>
        <Text noTraducir style={e.antetitulo}>{b.aprendeAnte}</Text>
        <Text noTraducir style={e.titularPortada} accessibilityRole="header">{b.aprende.tarjeta}</Text>
        <Text noTraducir style={e.subtitulo}>{b.aprendeIntro}</Text>
        <Pressable onPress={() => irAFuentes('portada')} style={({ pressed }) => [e.fuentesApartado, pressed && pulsado('b3')]}
          accessibilityRole="link" noTraducir accessibilityLabel={`${t.portada.fuentes}: ${GRUPOS_FUENTES_INICIO[0][idioma === 'en' ? 'en' : 'es']}`}>
          <Text noTraducir style={e.fuentesApartadoTxt}>{t.portada.fuentes} ›</Text>
        </Pressable>
      </View>

      {/* 01 · De dónde viene: el titular y, justo debajo, qué es. */}
      <Bloque n={1} c={cap.cap1} t={t} onFuentes={() => irAFuentes('cap1')} onLayout={guardar('cap1')}>
        <Text noTraducir style={[e.titular, e.titularPrimero]} accessibilityRole="header">{cap.cap1.titular}</Text>
        <Text noTraducir style={e.rotuloPequeno}>{cap.cap1.queEsRotulo}</Text>
        <Text noTraducir style={e.queEs}>{cap.cap1.queEs}</Text>
        <Text noTraducir style={e.texto}>{cap.cap1.texto}</Text>
        <View style={e.genesis}>
          <View style={e.cadena} accessible={false}>
            {[0, 1, 2, 3, 4].map((i) => <View key={i} style={[e.cubo, i === 0 && e.cuboOn]} />)}
          </View>
          <View style={e.genesisCab}>
            <Text noTraducir style={e.genesisTit}>{cap.cap1.genesis}</Text>
            <Text noTraducir style={e.genesisTit}>{cap.cap1.genesisFecha}</Text>
          </View>
          <Text noTraducir idiomaOriginal="en-GB" style={e.genesisOriginal}>«The Times 03/Jan/2009 Chancellor on brink of second bailout for banks»</Text>
          <Text noTraducir style={e.genesisPie}>{cap.cap1.genesisPie}</Text>
        </View>
      </Bloque>

      {/* 02 · Qué cambia: el esquema; la cita de Fink, en «Saber más». */}
      <Bloque n={2} c={cap.cap2} t={t} onFuentes={() => irAFuentes('cap2')} onLayout={guardar('cap2')}>
        <Text noTraducir style={[e.titular, e.titularPrimero]} accessibilityRole="header">{cap.cap2.titular}</Text>
        <Diagrama c={cap.cap2} />
      </Bloque>

      {/* 03 · Quién lo usa ya: dos frases y un solo carrusel; los demás datos,
          en «Saber más». Las cifras de mercado ya no van aquí: un enlace lleva
          a «El mercado hoy», donde están al día y con su fuente. */}
      <Bloque n={3} c={cap.cap3} t={t} onFuentes={() => irAFuentes('cap3')} onLayout={guardar('cap3')}
        extraSaberMas={(
          <Pressable onPress={() => { tacto.abrir(); onMercado?.(); }} style={({ pressed }) => [e.saberMasFila, e.enlaceMercado, pressed && pulsado('b3')]}
            accessibilityRole="link" noTraducir accessibilityLabel={b.enlaceMercado}>
            <Text noTraducir style={e.saberMasPunto} accessible={false}>·</Text>
            <Text noTraducir style={[e.saberMasTxt, e.enlaceMercadoTxt]}>{b.enlaceMercado} ›</Text>
          </Pressable>
        )}>
        <Text noTraducir style={[e.titular, e.titularPrimero]} accessibilityRole="header">{cap.cap3.titular}</Text>
        <Text noTraducir style={e.texto}>{cap.cap3.texto1}</Text>
        <Text noTraducir style={e.texto}>{cap.cap3.texto2}</Text>
        <Carrusel c={cap.cap3} />
      </Bloque>

      {/* 04 · Por qué te importa: el gráfico primero. */}
      <Bloque n={4} c={cap.cap4} t={t} onFuentes={() => irAFuentes('cap4')} onLayout={guardar('cap4')}>
        <Text noTraducir style={[e.titular, e.titularPrimero]} accessibilityRole="header">{cap.cap4.titular}</Text>
        <View style={e.cifraBloque}>
          {cap.cap4.cifras.map(([cifra, grupo, v], i) => (
            <View key={cifra} style={e.brecha}>
              <Text noTraducir style={e.cifra36}>{cifra}</Text>
              <Text noTraducir style={e.texto}>{grupo}</Text>
              <View style={e.barraPista}><View style={[e.barraRelleno, i === 0 && e.barraRellenoOn, { width: `${v}%` }]} /></View>
            </View>
          ))}
          <Text noTraducir style={e.nota}>{cap.cap4.cifrasPie}</Text>
        </View>
        <Text noTraducir style={e.texto}>{cap.cap4.texto}</Text>
        {/* Los mínimos y su aviso, solo con catálogo vigente (como /aprende/ en la web). */}
        {cifras.vigente && cifras.minimos ? <>
          <Text noTraducir style={e.texto}>{cap.cap4.minimos(cifras.minimos, cifras.ofertas, cifras.usd)}</Text>
          <Text noTraducir style={e.aviso}>{cap.cap4.aviso}</Text>
        </> : null}
      </Bloque>

      {/* 05 · Los riesgos: la cifra en una frase y el caso corto. */}
      <Bloque n={5} c={cap.cap5} t={t} onFuentes={() => irAFuentes('cap5')} onLayout={guardar('cap5')}
        pie={<Text noTraducir style={e.puente} accessibilityRole="header">{cap.cap5.puente}</Text>}>
        <Text noTraducir style={[e.titular, e.titularPrimero]} accessibilityRole="header">{cap.cap5.titular}</Text>
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
        <Text noTraducir style={e.texto}>{cap.cap5.cnmv}</Text>
        <Text noTraducir style={e.texto}><Text noTraducir style={e.casoEtiqueta}>{` ${cap.cap5.caso} `}</Text>{` ${cap.cap5.casoTexto}`}</Text>
        <Pressable onPress={() => { tacto.eleccion(); onDestino('fuera'); }} style={({ pressed }) => [e.b3, e.b3Tras, pressed && pulsado('b3')]}
          accessibilityRole="link" noTraducir accessibilityLabel={cap.cap5.casoEnlace}>
          <Text noTraducir style={e.b3Txt}>{cap.cap5.casoEnlace}</Text>
        </Pressable>
      </Bloque>

      {/* 06 · Para qué sirve: el dato que frena, la línea de riesgo y, junto a
          ella, el radar y las ofertas. El único tren es el titular. */}
      <Bloque n={6} c={cap.cap6} t={t} onFuentes={() => irAFuentes('cap6')} onLayout={guardar('cap6')}>
        <Text noTraducir style={[e.titular, e.titularPrimero]} accessibilityRole="header">{cap.cap6.titular}</Text>
        <Text noTraducir style={e.texto}>{cap.cap6.texto}</Text>
        <View style={e.cifraBloque}>
          <Text noTraducir style={e.cifra64}>{cap.cap6.cifra}</Text>
          <Text noTraducir style={e.texto}>{cap.cap6.cifraPie}</Text>
        </View>
        <Text noTraducir style={e.texto}>
          {cifras.vigente && cifras.hasta ? `${cap.cap6.vigencia(cifras.revisado, cifras.hasta)} ` : ''}{cap.cap6.riesgo}
        </Text>
        <View style={e.pie6}>
          <Pressable onPress={() => { tacto.eleccion(); onDestino('plataformas'); }}
            style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button" noTraducir
            accessibilityLabel={t.portada.explorar}>
            <Text noTraducir style={e.b3Txt}>{t.portada.explorar} ›</Text>
          </Pressable>
          <Pressable onPress={() => { tacto.abrir(); onDestino('ofertas'); }}
            style={({ pressed }) => [e.b3, pressed && pulsado('b3')]} accessibilityRole="button" noTraducir
            accessibilityLabel={t.portada.boton(n)}>
            <Text noTraducir style={e.b3Txt}>{t.portada.boton(n)} ›</Text>
          </Pressable>
        </View>
      </Bloque>

      {/* El paso siguiente: la Academy y la explicación animada. */}
      <View style={e.academy}>
        <Text noTraducir style={e.academyTit} accessibilityRole="header">{b.academy.titulo}</Text>
        <Text noTraducir style={e.texto}>{b.academy.texto(LECCIONES_PUBLICADAS)}</Text>
        <Pressable onPress={() => { tacto.abrir(); onDestino('academy'); }} style={({ pressed }) => [e.b1, e.b1Seguir, pressed && pulsado('b1')]}
          accessibilityRole="button" noTraducir accessibilityLabel={b.academy.boton}>
          <Text noTraducir style={e.b1Txt}>{b.academy.boton}</Text>
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

      {/* Fuentes, agrupadas por apartado y con enlace. */}
      <View style={e.fuentes} onLayout={guardar('fuentes')}>
        <Pressable onPress={() => { tacto.eleccion(); setFuentesAbiertas((v) => !v); }}
          style={({ pressed }) => [e.fuentesCab, pressed && pulsado('b3')]} accessibilityRole="button"
          accessibilityState={{ expanded: fuentesAbiertas }} noTraducir accessibilityLabel={t.fuentes.titulo}>
          <Text noTraducir style={e.fuentesTit}>{t.fuentes.titulo}</Text>
          <Text noTraducir style={e.fuentesTit} accessible={false}>{fuentesAbiertas ? '−' : '+'}</Text>
        </Pressable>
        {fuentesAbiertas ? (
          <>
            <Text noTraducir style={e.nota}>{t.fuentes.nota}</Text>
            {GRUPOS_FUENTES_INICIO.map((g) => (
              <View key={g.id} style={e.grupoFuentes} onLayout={guardarGrupo(g.id)}>
                <Text noTraducir style={e.grupoFuentesTit} accessibilityRole="header">{idioma === 'en' ? g.en : g.es}</Text>
                {g.fuentes.map((num) => porNumero.get(num)).filter(Boolean).map((f) => {
                  // La descripción en el idioma elegido (fuentes.json trae las dos).
                  const descripcion = idioma === 'en' && f.texto_en ? f.texto_en : f.texto;
                  return (
                  <View key={`${g.id}-${f.n}`} style={e.fuenteFila}>
                    <Text noTraducir idiomaOriginal={descripcion === f.texto ? 'es-ES' : 'en-US'} style={e.fuenteTxt}>{descripcion}</Text>
                    <View style={e.fuenteEnlaces}>
                    {f.urls.map((url) => (
                      <Pressable key={url} onPress={() => onAbrirEnlace?.(url)} style={({ pressed }) => [e.fuenteEnlace, pressed && pulsado('b3')]}
                        accessibilityRole="link" noTraducir accessibilityLabel={`${descripcion}: ${url}`}>
                        <Text noTraducir style={e.fuenteEnlaceTxt} numberOfLines={1}>{enlaceCorto(url)} ↗</Text>
                      </Pressable>
                    ))}
                    </View>
                  </View>
                  );
                })}
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

      {/* Nota legal y advertencia de riesgo: la corta a la vista y la completa
          plegada, con la letra del texto y sus fuentes (como la web). */}
      <View style={e.legal} onLayout={guardarLegal}>
        <Text noTraducir style={e.legalTit} accessibilityRole="header">{t.legal.titulo}</Text>
        <Text noTraducir style={e.texto}>{t.legal.corta}</Text>
        <Plegable titulo={t.legal.completa}>
          {t.legal.parrafos.map((p) => <Text key={p.slice(0, 24)} noTraducir style={e.texto}>{p}</Text>)}
        </Plegable>
        <Pressable onPress={() => irAFuentes('legal')} style={({ pressed }) => [e.fuentesApartado, pressed && pulsado('b3')]}
          accessibilityRole="link" noTraducir accessibilityLabel={`${t.fuentesApartado}: ${t.legal.titulo}`}>
          <Text noTraducir style={e.fuentesApartadoTxt}>{t.fuentesApartado} ›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  cuerpo: { paddingHorizontal: UI.margen, paddingTop: 8, paddingBottom: 48 },
  entrada: { paddingTop: 8, paddingBottom: 4 },
  enlaceMercado: { minHeight: UI.tactil, alignItems: 'center', borderRadius: R.m },
  enlaceMercadoTxt: { fontFamily: F.semi, color: C.senal },
  academy: { marginTop: 36, padding: 18, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  academyTit: { fontFamily: F.negrita, fontSize: 22, lineHeight: 27, letterSpacing: -0.3, color: C.tx },

  /* Botones de la guía (GUIA-ACABADOS §4). */
  b1: { minHeight: UI.boton, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  b1Seguir: { marginTop: 16 },
  b1Txt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.enSenal },
  b2: { minHeight: UI.boton, borderRadius: R.m, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 10 },
  b2Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  b3: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, marginHorizontal: -8 },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  b3Tras: { marginTop: 6 },
  bi: { width: 44, height: 44, borderRadius: R.p, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center' },
  biSuave: { backgroundColor: 'transparent' },

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
  titularPrimero: { marginTop: 0, marginBottom: 12 },
  texto: { ...T.cuerpo, color: C.tx2, marginTop: 10 },
  aviso: { ...T.cuerpo, color: C.tx2, marginTop: 12 },
  nota: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 10 },
  genesis: { marginTop: 16, padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  cadena: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  cubo: { width: 22, height: 22, borderRadius: R.s / 2, backgroundColor: C.ton2 },
  cuboOn: { backgroundColor: C.tx },
  genesisCab: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  genesisTit: { ...T.etiqueta, color: C.tx3 },
  genesisOriginal: { fontFamily: F.media, fontSize: 16, lineHeight: 23, color: C.tx, marginTop: 8 },
  genesisPie: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx3, marginTop: 10 },
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
  barraPista: { height: 8, borderRadius: R.p, backgroundColor: C.ton, overflow: 'hidden', marginTop: 6 },
  barraRelleno: { height: 8, borderRadius: R.p, backgroundColor: C.tx3 },
  barraRellenoOn: { backgroundColor: C.senal },
  brecha: { marginBottom: 14 },

  /* Carrusel «Quién más se ha movido»: tarjetas de texto, sin foto ni logotipo. */
  carrusel: { marginTop: 30 },
  carruselCab: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  carruselTit: { ...T.seccion, color: C.tx, flex: 1 },
  carruselNota: { ...T.menor, color: C.tx2, marginTop: 6, marginBottom: 12 },
  carruselPista: { gap: 12, paddingRight: 24 },
  tarjetaTexto: { padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  tarjetaCab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  tarjetaNombre: { ...T.menor, fontFamily: F.semi, fontSize: 14, lineHeight: 19, color: C.tx, flexShrink: 1 },
  tarjetaFecha: { ...T.dato, fontSize: 12, lineHeight: 17, color: C.tx3 },
  tarjetaCifra: { fontFamily: F.negrita, fontSize: 28, lineHeight: 33, letterSpacing: -0.56, color: C.tx, marginTop: 12 },
  tarjetaPie: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 2, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.bd },
  tarjetaTxt: { ...T.menor, fontSize: 15, lineHeight: 22, color: C.tx2, marginTop: 12 },
  carruselPos: { ...T.dato, color: C.tx3, minWidth: 40, textAlign: 'center' },

  /* 05 */
  tablaRiesgos: { marginTop: 18, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, overflow: 'hidden' },
  tablaFila: { flexDirection: 'row' },
  tablaFilaLinea: { borderTopWidth: 1, borderTopColor: C.bd },
  tablaCelda: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  tablaCab: { ...T.etiqueta, fontSize: 13, color: C.tx3 },
  tablaTxt: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx },
  casoEtiqueta: { fontFamily: F.semi, fontSize: 13, color: C.tx2, backgroundColor: C.ton },
  puente: { ...T.titular, color: C.tx, marginTop: 28 },
  /* 06: «Explorar el radar» y «Ver las N ofertas» en la misma fila, si caben. */
  pie6: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 16, marginTop: 10 },

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
