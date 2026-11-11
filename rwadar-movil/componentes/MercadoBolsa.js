import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { cargarTokenizacion } from '../lib/tokenizacion-remota';
import { cargarSerie } from '../lib/tokenizacion-serie-remota';
import { FUENTE, PESTANAS, PESTANA_INICIAL, cambio24h, cambioPct, cifraGrande, coberturaTexto, colorTipo, coordenadas, cuandoDato, cuota, direccion,
  etiquetaPestana, explicacionCambio, fechaCorta, graficoPestana, indiceCercano, lineaTotalCategoria, marcaValor, millones, millonesHablados, notaCorta,
  notaSerie, porcentaje, serieAtrasada, subtituloCifra, tramo, tramosSeguidos, trazosSvg } from '../lib/tokenizacion';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Mercado y noticias» al estilo de una app de bolsa (11/11/2026), como la web
   ---------------------------------------------------------------------
   Dos lecturas de rwadar.pages.dev: /api/tokenizacion (el total de la
   categoría, en vivo, y los tipos) y /datos/tokenizacion-serie.json (la
   serie diaria de un año: la suma de los mayores tokens con historia
   completa en CoinGecko, hoy 29 de los 40 mayores). Todos los cálculos, en
   lib/tokenizacion.js (el mismo motor que la web): aquí solo se dibuja.
   La cifra grande es el último punto de la serie (QA del 11/11/2026): la
   misma que el final de la línea, la cruz en el último día, el cambio, el
   máximo y el mínimo; el total de la categoría va debajo, en gris.
   - MercadoPantalla: el nombre, la cifra grande y el cambio del periodo
     (signo, flecha y texto: el color nunca va solo) con lo que mide, las
     pestañas 1 S · 1 M · 3 M · 6 M · 2026 · 1 A (1 M por defecto; en inglés,
     «YTD»), el gráfico de área (verde si sube, rojo si baja; eje de valores
     a la derecha con el último valor marcado, fechas abajo, rejilla suave y
     una línea de puntos en el valor de partida) con una cruz que sigue al
     dedo (gesto de arrastre) o a los gestos de accesibilidad (subir y
     bajar), los datos clave, las barras por tipo y, debajo (children), las
     noticias relacionadas.
   - MercadoCotizacion: la tarjeta de Inicio (nombre, cifra, cambio del mes
     y un minigráfico del mes: la misma cifra que su final), que abre la
     pantalla.
   Los textos van ya en el idioma elegido (noTraducir): llevan cifras.
   --------------------------------------------------------------------- */
const VERDE = C.senal;
// Un solo rojo para la línea y las cifras: #FF6B5E pasa AA como texto sobre s0 y s1.
const ROJO = '#FF6B5E';
const ROJO_TEXTO = ROJO;
const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
const TIPOS_EN = { 'Crédito privado': 'Private credit', 'Letras del Tesoro': 'Treasury bills', 'Materias primas': 'Commodities', Acciones: 'Stocks',
  'Fondos monetarios': 'Money market funds', 'Otros créditos': 'Other credit', ETF: 'ETFs', Inmuebles: 'Real estate' };

// Tras soltar el dedo, la cruz se queda este tiempo para poder leerla.
const CRUZ_FIJA_MS = 3000;

const colorLinea = (dir) => (dir === 'sube' ? VERDE : dir === 'baja' ? ROJO : C.tx2);
const colorTexto = (dir) => (dir === 'sube' ? VERDE : dir === 'baja' ? ROJO_TEXTO : C.tx2);

/* Las dos lecturas, juntas. Un fallo de una no tumba la otra. */
export function useMercado({ cargarVivo = cargarTokenizacion, cargarLaSerie = cargarSerie } = {}) {
  const [estado, setEstado] = useState({ fase: 'cargando', vivo: null, serie: null });
  const vivoRef = useRef(true);
  const pedir = useCallback(() => {
    setEstado((s) => ({ ...s, fase: 'cargando' }));
    const a = Promise.resolve().then(() => cargarVivo()).then((d) => (d && d.fuente !== 'sin-datos' ? d : null)).catch(() => null);
    const b = Promise.resolve().then(() => cargarLaSerie()).catch(() => null);
    return Promise.all([a, b]).then(([vivo, serie]) => {
      if (!vivoRef.current) return;
      setEstado((s) => {
        const v = vivo || s.vivo, se = serie || s.serie;
        return { fase: v || se ? 'listo' : 'error', vivo: v, serie: se };
      });
    });
  }, [cargarVivo, cargarLaSerie]);
  useEffect(() => { vivoRef.current = true; pedir(); return () => { vivoRef.current = false; }; }, [pedir]);
  return { ...estado, reintentar: pedir };
}

/* La serie vieja (más de 3 días antes del dato de hoy): la cifra grande y el
   gráfico son de su último día, y se dice. */
const atrasada = (vivo, serie) => !!(vivo && serie && serieAtrasada(serie, vivo.actualizado));
const fechaFinSerie = (serie, idioma) => fechaCorta(serie.puntos[serie.puntos.length - 1].fecha, idioma);
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/* La cifra grande: el último punto de la serie; sin serie, el total de la categoría. */
function valorHoy(vivo, serie) {
  const c = cifraGrande(serie, vivo);
  return c ? c.valor : null;
}

/* ---- El gráfico de área, con su cruz ---- */
export function GraficoBolsa({ g, idioma, alto = 270 }) {
  const [ancho, setAncho] = useState(0);
  const [indice, setIndice] = useState(null);
  const reloj = useRef(null);
  const parar = () => { clearTimeout(reloj.current); reloj.current = null; };
  // ARRIBA: una franja libre de 40 px para la burbuja de la cruz, que así no tapa la línea.
  const EJE = 54, ARRIBA = 40, ABAJO = 28;
  const PW = Math.max(0, ancho - EJE), PH = alto - ARRIBA - ABAJO;
  const coords = useMemo(() => (ancho > 0 ? coordenadas(g, PW, PH).map((c) => ({ x: c.x, y: c.y + ARRIBA })) : []), [g, ancho, PW, PH]);
  const ref = useRef({ coords, n: g.puntos.length });
  ref.current = { coords, n: g.puntos.length };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    // Solo el arrastre horizontal mueve la cruz; el vertical sigue desplazando la pantalla.
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderTerminationRequest: () => true,
    onPanResponderGrant: (ev) => { parar(); setIndice(indiceCercano(ref.current.coords, ev.nativeEvent.locationX)); tacto.eleccion?.(); },
    onPanResponderMove: (ev) => setIndice(indiceCercano(ref.current.coords, ev.nativeEvent.locationX)),
    // Un toque corto no se perdía: la cruz se queda 3 s después de soltar.
    onPanResponderRelease: () => { parar(); reloj.current = setTimeout(() => { reloj.current = null; setIndice(null); }, CRUZ_FIJA_MS); },
    onPanResponderTerminate: () => { parar(); setIndice(null); },
  }), []);
  // Al cambiar de pestaña, la cruz se quita; al desmontar, el reloj se para.
  useEffect(() => { parar(); setIndice(null); }, [g]);
  useEffect(() => parar, []);

  const dir = g.direccion, color = colorLinea(dir);
  const yDe = (v) => ARRIBA + PH - ((v - g.escala.lo) / (g.escala.hi - g.escala.lo)) * PH;
  // Tramo a tramo: donde falta un día, la línea se corta (no se une con una recta).
  // El área de fondo no se corta; el hueco se une con un trazo de puntos tenue.
  const { linea: trazo, area, puentes } = coords.length ? trazosSvg(coords, tramosSeguidos(g), ARRIBA + PH) : { linea: '', area: '', puentes: '' };
  const k = indice === null ? null : Math.max(0, Math.min(g.puntos.length - 1, indice));
  const activo = k === null ? null : { c: coords[k], p: g.puntos[k] };
  const ultimo = g.puntos[g.puntos.length - 1];
  const yUltimo = coords.length ? coords[coords.length - 1].y : 0;
  const valorTexto = (p) => `${fechaCorta(p.fecha, idioma)}: ${millonesHablados(p.valor, idioma)}`;
  // Lo que ocupa «11/11/2026 · 42.947 M$ · +82,0 %» en una línea, con su aire (sin salirse del gráfico).
  const anchoBurbuja = Math.min(244, ancho);
  const xBurbuja = activo ? Math.max(0, Math.min(Math.max(0, ancho - anchoBurbuja), activo.c.x - anchoBurbuja / 2)) : 0;
  const densa = g.puntos.length > 120;
  const lector = (paso) => {
    const actual = k === null ? g.puntos.length - 1 : k;
    setIndice(Math.max(0, Math.min(g.puntos.length - 1, actual + paso)));
  };
  return (
    <View onLayout={(ev) => setAncho(Math.round(ev.nativeEvent.layout.width))} style={{ height: alto }}
      accessible accessibilityRole="adjustable" noTraducir idiomaOriginal={idioma === 'en' ? 'en-US' : 'es-ES'}
      accessibilityLabel={`${idioma === 'en' ? 'Market chart' : 'Gráfico del mercado'}. ${g.etiqueta}`}
      accessibilityHint={idioma === 'en' ? 'Swipe up or down to move through the days.' : 'Desliza arriba o abajo para recorrer los días.'}
      accessibilityValue={{ text: valorTexto(activo ? activo.p : ultimo) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(ev) => lector(ev.nativeEvent.actionName === 'increment' ? 1 : -1)}
      {...responder.panHandlers} testID="mercado-grafico">
      {ancho > 120 ? (
        <Svg width={ancho} height={alto} accessible={false} importantForAccessibility="no-hide-descendants">
          <Defs>
            <LinearGradient id="mkDeg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.34} />
              <Stop offset="0.6" stopColor={color} stopOpacity={0.08} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {g.marcasValores.map((m) => (
            <Line key={'v' + m.valor} x1={0} x2={PW} y1={yDe(m.valor)} y2={yDe(m.valor)} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          ))}
          {g.marcasFechas.map((m) => (
            <Line key={'f' + m.fecha} x1={coords[m.indice].x} x2={coords[m.indice].x} y1={ARRIBA} y2={ARRIBA + PH} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          ))}
          {/* El suelo acaba donde el dibujo: no tacha la marca más baja del eje. */}
          <Line x1={0} x2={PW} y1={ARRIBA + PH} y2={ARRIBA + PH} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          <Path d={area} fill="url(#mkDeg)" />
          <Line x1={0} x2={PW} y1={yDe(g.estadisticas.inicio)} y2={yDe(g.estadisticas.inicio)} stroke={C.tx3} strokeWidth={1} strokeDasharray="2 4" />
          {puentes ? <Path d={puentes} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="2 3" testID="mercado-puente" /> : null}
          {/* Con muchos puntos (6 M, 2026 y 1 A), algo más fina: a 2 px parecía peluda. */}
          <Path d={trazo} fill="none" stroke={color} strokeWidth={densa ? 1.5 : 2} strokeLinejoin="round" strokeLinecap="round" />
          {g.marcasValores.filter((m) => Math.abs(yDe(m.valor) - yUltimo) >= 15).map((m) => (
            <SvgText key={'tv' + m.valor} x={PW + 8} y={yDe(m.valor) + 4} fill={C.tx2} fontSize={12} fontFamily={F.media}>{m.texto}</SvgText>
          ))}
          {/* El último valor (la cifra grande), en una píldora del color de la línea. */}
          {coords.length ? (
            <>
              <Rect x={PW + 3} y={yUltimo - 9} width={EJE - 6} height={18} rx={9} fill={color} testID="mercado-ultimo" />
              <SvgText x={PW + 3 + (EJE - 6) / 2} y={yUltimo + 4} fill={C.s0} fontSize={12} fontFamily={F.semi} textAnchor="middle">
                {marcaValor(g.estadisticas.fin, g.estadisticas.fin >= 1e8 ? 1e6 : 1e5, idioma)}
              </SvgText>
            </>
          ) : null}
          <SvgText x={ancho - 2} y={alto - 9} fill={C.tx3} fontSize={11} fontFamily={F.media} textAnchor="end">{idioma === 'en' ? '$M' : 'M$'}</SvgText>
          {g.marcasFechas.map((m) => {
            const x = coords[m.indice].x;
            return (
              <SvgText key={'tf' + m.fecha} x={x} y={alto - 9} fill={C.tx2} fontSize={12} fontFamily={F.media}
                textAnchor={x < 24 ? 'start' : x > PW - 24 ? 'end' : 'middle'}>{m.texto}</SvgText>
            );
          })}
          {/* La cruz: solo la raya vertical (dos rayas discontinuas se confundían con la línea de partida) y el punto. */}
          {activo ? (
            <>
              <Line x1={activo.c.x} x2={activo.c.x} y1={ARRIBA - 10} y2={ARRIBA + PH} stroke="rgba(247,245,240,0.45)" strokeWidth={1} />
              <Circle cx={activo.c.x} cy={activo.c.y} r={5} fill={color} stroke={C.s0} strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      ) : null}
      {/* En una línea, en la franja de arriba: fecha · valor · cambio desde el primer día del periodo. */}
      {activo ? (
        <View pointerEvents="none" style={[e.burbuja, { width: anchoBurbuja, transform: [{ translateX: xBurbuja }] }]} accessible={false}
          importantForAccessibility="no-hide-descendants">
          <Text noTraducir style={e.burbujaFecha}>{fechaCorta(activo.p.fecha, idioma)}</Text>
          <Text noTraducir style={e.burbujaValor}>{millones(activo.p.valor, idioma)}</Text>
          <Text noTraducir style={e.burbujaCambio}>{porcentaje(cambioPct(activo.p.valor, g.estadisticas.inicio), idioma)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Cambio({ g, grande = false }) {
  return (
    <Text noTraducir style={[e.cambio, grande && e.cambioGrande, { color: colorTexto(g.direccion) }]}>
      {`${FLECHA[g.direccion] || ''} ${g.cambioTexto}`}
    </Text>
  );
}

/* La fuente: CoinGecko, hasta qué día llega la serie y, en la pantalla, de
   cuándo es el total de la categoría («hoy, …» solo si es de hoy). Los mismos
   textos que la web. */
function Fuente({ vivo, serie, idioma, onAbrirEnlace, conTotal = true }) {
  const en = idioma === 'en';
  const partes = [];
  if (serie) partes.push(`${en ? 'daily series to' : 'serie diaria hasta el'} ${fechaCorta(serie.puntos[serie.puntos.length - 1].fecha, idioma)}`);
  if (vivo && conTotal) partes.push(`${en ? 'category total:' : 'total de la categoría:'} ${cuandoDato(vivo, idioma)}`);
  const antes = conTotal ? (en ? 'In millions of dollars ($M). ' : 'En millones de dólares (M$). ') : '';
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrirEnlace?.(FUENTE.url); }} style={({ pressed }) => [e.fuente, pressed && pulsado('b3')]}
      accessibilityRole="link" noTraducir accessibilityLabel={antes + [`${en ? 'Data:' : 'Datos:'} CoinGecko`, ...partes].join(' · ')}>
      <Text noTraducir style={e.fuenteTxt}>
        {antes}{en ? 'Data: ' : 'Datos: '}<Text noTraducir style={e.fuenteEnlace}>CoinGecko</Text>{partes.length ? ' · ' + partes.join(' · ') : ''}
      </Text>
    </Pressable>
  );
}

/* ---- La pantalla «Mercado y noticias» ---- */
export function MercadoPantalla({ onAbrirEnlace, cargarVivo, cargarLaSerie, children = null }) {
  const idioma = useIdioma();
  const en = idioma === 'en';
  const { fase, vivo, serie, reintentar } = useMercado({ cargarVivo, cargarLaSerie });
  const [pestana, setPestana] = useState(PESTANA_INICIAL);
  const [como, setComo] = useState(false);
  // Por tipo de activo, plegado (en el móvil, las noticias quedan más arriba).
  const [tiposAbiertos, setTiposAbiertos] = useState(false);
  const vieja = atrasada(vivo, serie);
  const disponible = (clave) => !!(serie && tramo(serie.puntos, clave));
  const elegida = serie && !disponible(pestana) ? (PESTANAS.find((p) => disponible(p.clave))?.clave || pestana) : pestana;
  const g = serie ? graficoPestana(serie, elegida, idioma) : null;
  const cifraHoy = cifraGrande(serie, vivo);
  const hoy = cifraHoy ? cifraHoy.valor : null;
  const [cifra, unidad] = hoy === null ? ['', ''] : millones(hoy, idioma).split(/\s/);
  const clave = (rotulo, valor, extra = null, color = null, texto = false) => (
    <View key={rotulo} style={[e.claveItem, texto && e.claveItemTexto]} accessible noTraducir accessibilityLabel={[rotulo, valor, extra].filter(Boolean).join(': ')}>
      <Text noTraducir style={e.claveRotulo}>{rotulo}</Text>
      <Text noTraducir style={[e.claveValor, texto && e.claveValorTexto, color && { color }]}>{valor}</Text>
      {extra ? <Text noTraducir style={e.claveExtra}>{extra}</Text> : null}
    </View>
  );
  const c24 = cambio24h(serie, vivo);
  const d24 = direccion(c24.cambio);
  const mayor = vivo?.tipos?.[0];
  const total = lineaTotalCategoria(serie, vivo, idioma);
  const palabra = g ? (g.direccion === 'sube' ? (en ? 'up' : 'sube') : g.direccion === 'baja' ? (en ? 'down' : 'baja') : (en ? 'unchanged' : 'sin cambios')) : '';
  return (
    <View style={e.pantalla}>
      <Text noTraducir style={e.ante}>{en ? 'Market and news' : 'Mercado y noticias'}</Text>
      <Text noTraducir style={e.titulo} accessibilityRole="header">{en ? 'Tokenised asset market' : 'Mercado de activos tokenizados'}</Text>
      {fase === 'cargando' && hoy === null ? <Text noTraducir style={e.estado}>{en ? 'Loading CoinGecko data…' : 'Cargando los datos de CoinGecko…'}</Text> : null}
      {fase === 'error' ? (
        <View style={e.estadoCaja}>
          <Text noTraducir style={e.estadoTxt}>{en ? "We can't show CoinGecko's data right now. Please try again later." : 'Ahora no podemos mostrar los datos de CoinGecko. Vuelve a intentarlo más tarde.'}</Text>
          <Pressable onPress={() => { tacto.eleccion(); reintentar(); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
            accessibilityRole="button" noTraducir accessibilityLabel={en ? 'Try again' : 'Reintentar'}>
            <Text noTraducir style={e.b3Txt}>{en ? 'Try again' : 'Reintentar'}</Text>
          </Pressable>
        </View>
      ) : null}
      {hoy !== null ? (
        <View style={e.cab}>
          {/* Qué suma la cifra grande y de qué día; la cifra es el último punto de la línea. */}
          <View accessible noTraducir accessibilityLabel={`${subtituloCifra(serie, idioma)}: ${millonesHablados(hoy, idioma)}${g ? `, ${palabra} ${g.cambioTexto} ${g.cambioFrase}${g.avisoTokens ? `. ${mayuscula(g.avisoTokens)}` : ''}` : ''}`}>
            <Text noTraducir style={e.sub} testID="mercado-subtitulo">{subtituloCifra(serie, idioma)}</Text>
            <Text noTraducir style={e.cifra} numberOfLines={1} adjustsFontSizeToFit testID="mercado-cifra">
              {cifra}{unidad ? <Text noTraducir style={e.unidad}>{' ' + unidad}</Text> : null}
            </Text>
            {g ? (
              <View style={e.lineaCambio}>
                <Cambio g={g} grande />
                <Text noTraducir style={e.periodo}>{g.cambioFrase}</Text>
              </View>
            ) : null}
          </View>
          {/* Qué mide ese % (no es una rentabilidad) y, si entran tokens en el periodo, que parte de la subida es eso. */}
          {g ? <Text noTraducir style={e.explica} testID="mercado-explica">{explicacionCambio(idioma)}</Text> : null}
          {g && g.avisoTokens ? <Text noTraducir style={[e.aviso, e.avisoTokens]} testID="mercado-aviso-tokens">{mayuscula(g.avisoTokens) + '.'}</Text> : null}
          {vieja ? <Text noTraducir style={e.aviso} testID="mercado-serie-vieja">{`${en ? 'The series ends on ' : 'La serie llega hasta el '}${fechaFinSerie(serie, idioma)}${en ? ': the large figure and the chart are from that day.' : ': la cifra grande y el gráfico son de ese día.'}`}</Text> : null}
          {total ? <Text noTraducir style={e.totalCat} testID="mercado-total-categoria">{total}</Text> : null}
          {!serie && vivo ? <Text noTraducir style={e.aviso}>{`${en ? "Without the daily series, the figure is CoinGecko's category total (" : 'Sin la serie diaria, la cifra es el total de la categoría en CoinGecko ('}${cuandoDato(vivo, idioma)}).`}</Text> : null}
        </View>
      ) : null}
      {hoy !== null ? (
        <View style={e.pestanas} accessibilityRole="tablist">
          {PESTANAS.map((p) => {
            const sel = p.clave === elegida, ok = disponible(p.clave);
            // Lo que se ve y su nombre accesible (que lo contiene): «2026» y «En 2026»; en inglés, «YTD».
            const et = etiquetaPestana(p.clave, idioma, serie);
            return (
              <Pressable key={p.clave} disabled={!ok} onPress={() => { tacto.eleccion(); setPestana(p.clave); }}
                style={({ pressed }) => [e.pestana, sel && e.pestanaSel, !ok && e.pestanaNo, pressed && !sel && e.pestanaPulsada]}
                accessibilityRole="tab" accessibilityState={{ selected: sel, disabled: !ok }} noTraducir accessibilityLabel={et.nombre}
                testID={'pestana-' + p.clave}>
                <Text noTraducir style={[e.pestanaTxt, sel && e.pestanaTxtSel]}>{et.corto}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {g ? (
        <View style={e.grafico}>
          <GraficoBolsa g={g} idioma={idioma} />
          {/* Una línea corta a la vista; el resto, en «Cómo se calcula». */}
          <Text noTraducir style={e.nota}>{notaCorta(serie, idioma)}</Text>
          <Pressable onPress={() => { tacto.eleccion(); setComo((v) => !v); }} style={({ pressed }) => [e.como, pressed && pulsado('b3')]}
            accessibilityRole="button" accessibilityState={{ expanded: como }} noTraducir accessibilityLabel={en ? 'How it is calculated' : 'Cómo se calcula'}
            testID="mercado-como">
            <Text noTraducir style={e.comoTxt}>{`${en ? 'How it is calculated' : 'Cómo se calcula'} ${como ? '▴' : '▾'}`}</Text>
          </Pressable>
          {como ? <Text noTraducir style={e.nota}>{notaSerie(serie, idioma, elegida)}</Text> : null}
        </View>
      ) : hoy !== null && fase !== 'cargando' ? (
        <Text noTraducir style={e.estado}>{en ? "The chart isn't available right now. Today's figure is." : 'El gráfico no está disponible ahora. La cifra de hoy sí.'}</Text>
      ) : null}
      {hoy !== null ? (
        <View style={e.clave}>
          {/* Dos cifras distintas, cada una con su nombre: la de la serie (la cifra grande) y la de toda la categoría. */}
          {serie && cifraHoy.fuente === 'serie' ? clave(en ? `Value today (${serie.incluidos} largest)` : `Valor hoy (${serie.incluidos} mayores)`, millones(hoy, idioma), fechaCorta(cifraHoy.fecha, idioma)) : null}
          {clave(en ? 'Category total today' : 'Total de la categoría hoy', vivo ? millones(vivo.total.valor, idioma) : '—', vivo ? (en ? 'all tokens · CoinGecko' : 'todos los tokens · CoinGecko') : null)}
          {/* 24 h: el de la serie si sus dos últimos días son seguidos; si no, el de CoinGecko si es creíble; si no, «—». */}
          {clave(en ? '24 h change' : 'Cambio en 24 h', d24 === 'sin-datos' ? '—' : `${FLECHA[d24]} ${porcentaje(c24.cambio, idioma)}`,
            c24.fuente === 'serie' ? (en ? `${serie.incluidos} largest` : `${serie.incluidos} mayores`) : c24.fuente === 'coingecko' ? (en ? 'whole category' : 'toda la categoría') : null,
            d24 === 'sin-datos' ? null : colorTexto(d24))}
          {g ? clave(en ? 'Period high' : 'Máximo del periodo', millones(g.estadisticas.max.valor, idioma), fechaCorta(g.estadisticas.max.fecha, idioma)) : null}
          {g ? clave(en ? 'Period low' : 'Mínimo del periodo', millones(g.estadisticas.min.valor, idioma), fechaCorta(g.estadisticas.min.fecha, idioma)) : null}
          {/* La misma cuota y con el mismo redondeo que la nota del gráfico. */}
          {serie ? clave(en ? 'Tokens in the chart' : 'Tokens en el gráfico', String(serie.incluidos), `${coberturaTexto(serie, idioma)} ${en ? 'of the total' : 'del total'}`) : null}
          {mayor ? clave(en ? 'Largest asset type' : 'El tipo que más pesa', en ? TIPOS_EN[mayor.nombre] || mayor.nombre : mayor.nombre, `${cuota(mayor.cuota, idioma)} ${en ? 'of the total' : 'del total'}`, null, true) : null}
        </View>
      ) : null}
      {hoy !== null ? <Fuente vivo={vivo} serie={serie} idioma={idioma} onAbrirEnlace={onAbrirEnlace} /> : null}

      {vivo?.tipos?.length ? (
        <View style={e.tipos}>
          <Text noTraducir style={e.h2} accessibilityRole="header">{en ? 'By asset type' : 'Por tipo de activo'}</Text>
          <Text noTraducir style={e.h2Sub}>{en ? "Today. A token can count in two types, so the figures don't add up to the total." : 'Hoy. Un mismo token puede contar en dos tipos, así que las cifras no suman el total.'}</Text>
          <Pressable onPress={() => { tacto.eleccion(); setTiposAbiertos((v) => !v); }} style={({ pressed }) => [e.como, pressed && pulsado('b3')]}
            accessibilityRole="button" accessibilityState={{ expanded: tiposAbiertos }} noTraducir testID="mercado-tipos"
            accessibilityLabel={`${en ? `See the ${vivo.tipos.length} types` : `Ver los ${vivo.tipos.length} tipos`}`}>
            <Text noTraducir style={e.comoTxt}>
              {`${en ? `See the ${vivo.tipos.length} types` : `Ver los ${vivo.tipos.length} tipos`} ${tiposAbiertos ? '▴' : '▾'}`}
              {tiposAbiertos ? null : <Text noTraducir style={e.avance}>{`  ${en ? TIPOS_EN[mayor.nombre] || mayor.nombre : mayor.nombre} ${cuota(mayor.cuota, idioma)}…`}</Text>}
            </Text>
          </Pressable>
          {tiposAbiertos ? vivo.tipos.map((t) => {
            const dir = direccion(t.cambio24h);
            const nombre = en ? TIPOS_EN[t.nombre] || t.nombre : t.nombre;
            const cifra24 = dir === 'sin-datos' ? '—' : `${FLECHA[dir]} ${porcentaje(t.cambio24h, idioma)}`;
            return (
              <View key={t.clave} style={e.tipo} accessible noTraducir
                accessibilityLabel={`${nombre}: ${millones(t.valor, idioma)}, ${cuota(t.cuota, idioma)} ${en ? 'of the total' : 'del total'}, ${cifra24}${dir === 'sin-datos' ? '' : en ? ' in 24 h' : ' en 24 h'}`}>
                <View style={e.tipoFila}>
                  <Text noTraducir style={e.tipoNom}>{nombre}</Text>
                  <Text noTraducir style={e.tipoValor}>{millones(t.valor, idioma)}</Text>
                </View>
                <View style={e.barra}>
                  <View style={[e.relleno, { width: `${Math.max(1.5, Math.min(100, t.cuota)).toFixed(2)}%`, backgroundColor: colorTipo(vivo, t.clave) }]} />
                </View>
                <View style={e.tipoFila}>
                  <Text noTraducir style={e.tipoPie}>{`${cuota(t.cuota, idioma)} ${en ? 'of the total' : 'del total'}`}</Text>
                  {/* Solo la cifra va en color. */}
                  <Text noTraducir style={e.tipoPie}>
                    <Text noTraducir style={{ color: colorTexto(dir) }}>{cifra24}</Text>{dir === 'sin-datos' ? '' : en ? ' in 24 h' : ' en 24 h'}
                  </Text>
                </View>
              </View>
            );
          }) : null}
        </View>
      ) : null}

      {children ? (
        <View style={e.noticias}>
          <Text noTraducir style={e.h2} accessibilityRole="header">{en ? 'Related news' : 'Noticias relacionadas'}</Text>
          {children}
        </View>
      ) : null}
    </View>
  );
}

/* ---- Inicio: la tarjeta tipo cotización ---- */
function Minigrafico({ g }) {
  const W = 96, H = 40, M = 3;
  const coords = coordenadas(g, W - 2 * M, H - 2 * M).map((c) => ({ x: c.x + M, y: c.y + M }));
  const { linea: d, area, puentes } = trazosSvg(coords, tramosSeguidos(g), H);
  const color = colorLinea(g.direccion);
  return (
    <Svg width={W} height={H} accessible={false} importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id="mkMini" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.3} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#mkMini)" />
      <Line x1={M} x2={W - M} y1={coords[0].y} y2={coords[0].y} stroke={C.tx3} strokeWidth={1} strokeDasharray="2 4" />
      {puentes ? <Path d={puentes} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="2 3" /> : null}
      <Path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function MercadoCotizacion({ onAbrir, onAbrirEnlace, cargarVivo, cargarLaSerie }) {
  const idioma = useIdioma();
  const en = idioma === 'en';
  const { fase, vivo, serie, reintentar } = useMercado({ cargarVivo, cargarLaSerie });
  // La misma cifra que el final del minigráfico: el último punto de la serie.
  const hoy = valorHoy(vivo, serie);
  const vieja = atrasada(vivo, serie);
  const g = serie ? graficoPestana(serie, '1m', idioma) : null;
  if (hoy === null) {
    if (fase === 'cargando') return <Text noTraducir style={e.estado}>{en ? 'Loading CoinGecko data…' : 'Cargando los datos de CoinGecko…'}</Text>;
    return (
      <View style={e.estadoCaja}>
        <Text noTraducir style={e.estadoTxt}>{en ? "We can't show CoinGecko's data right now. Please try again later." : 'Ahora no podemos mostrar los datos de CoinGecko. Vuelve a intentarlo más tarde.'}</Text>
        <Pressable onPress={() => { tacto.eleccion(); reintentar(); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
          accessibilityRole="button" noTraducir accessibilityLabel={en ? 'Try again' : 'Reintentar'}>
          <Text noTraducir style={e.b3Txt}>{en ? 'Try again' : 'Reintentar'}</Text>
        </Pressable>
      </View>
    );
  }
  const palabra = g ? (g.direccion === 'sube' ? (en ? 'up' : 'sube') : g.direccion === 'baja' ? (en ? 'down' : 'baja') : (en ? 'unchanged' : 'sin cambios')) : '';
  return (
    <View>
      <Pressable onPress={() => { tacto.abrir(); onAbrir?.(); }} style={({ pressed }) => [e.ct, pressed && e.ctPulsada]}
        accessibilityRole="button" noTraducir
        accessibilityLabel={`${en ? 'Tokenised asset market' : 'Mercado de activos tokenizados'}, ${serie ? (en ? `sum of the ${serie.incluidos} largest tokens` : `suma de los ${serie.incluidos} mayores tokens`) : (en ? 'category total' : 'total de la categoría')}: ${millonesHablados(hoy, idioma)}${g ? `, ${palabra} ${g.cambioTexto} ${g.cambioFrase}${g.avisoTokens ? `; ${g.avisoTokens}` : ''}` : ''}${vieja ? `; ${en ? 'series to ' : 'serie hasta el '}${fechaFinSerie(serie, idioma)}` : ''}. ${en ? 'See the chart' : 'Ver el gráfico'}`}
        testID="mercado-cotizacion">
        <View style={e.ctIzq}>
          <Text noTraducir style={e.ctNom}>{en ? 'Tokenised assets' : 'Activos tokenizados'}</Text>
          <Text noTraducir style={e.ctSub}>{serie ? (en ? `${serie.incluidos} largest · CoinGecko` : `Los ${serie.incluidos} mayores · CoinGecko`) : (en ? 'Whole category · CoinGecko' : 'Toda la categoría · CoinGecko')}</Text>
        </View>
        {g ? <Minigrafico g={g} /> : null}
        <View style={e.ctDer}>
          <Text noTraducir style={e.ctCifra} numberOfLines={1}>{millones(hoy, idioma)}</Text>
          {g ? <Cambio g={g} /> : null}
          {g ? <Text noTraducir style={e.ctPeriodo}>{g.periodoTexto}</Text> : null}
          {vieja ? <Text noTraducir style={e.ctPeriodo}>{`${en ? 'series to ' : 'serie hasta el '}${fechaFinSerie(serie, idioma)}`}</Text> : null}
        </View>
      </Pressable>
      {/* El % del mes es del tamaño del mercado, no una rentabilidad: también aquí. */}
      {g ? <Text noTraducir style={[e.explica, e.ctExplica]}>{explicacionCambio(idioma)}</Text> : null}
      <Fuente vivo={vivo} serie={serie} idioma={idioma} onAbrirEnlace={onAbrirEnlace} conTotal={false} />
    </View>
  );
}

const e = StyleSheet.create({
  pantalla: { paddingTop: 12 },
  ante: { ...T.etiqueta, color: C.tx3 },
  // En una línea a 390 (a 26 px se partía y competía con la cifra grande), como en la web del móvil.
  titulo: { fontFamily: F.negrita, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: C.tx, marginTop: 4 },
  estado: { ...T.menor, color: C.tx2, marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoCaja: { marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoTxt: { ...T.menor, color: C.tx2 },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8, marginTop: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  cab: { paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.bd },
  sub: { fontFamily: F.media, fontSize: 14, lineHeight: 19, color: C.tx2, marginBottom: 4 },
  cifra: { fontFamily: F.semi, fontVariant: ['tabular-nums'], letterSpacing: -1, fontSize: 40, lineHeight: 46, color: C.tx },
  unidad: { fontFamily: F.media, fontSize: 20, color: C.tx2, letterSpacing: 0 },
  lineaCambio: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10, rowGap: 2, marginTop: 4 },
  // El cambio, en la misma letra que la cifra (en Mono, «+8 , 3  %»).
  cambio: { fontFamily: F.semi, fontVariant: ['tabular-nums'], fontSize: 14, lineHeight: 19 },
  cambioGrande: { fontSize: 18, lineHeight: 24 },
  periodo: { fontFamily: F.media, fontSize: 16, lineHeight: 21, color: C.tx2 },
  explica: { fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.tx2, marginTop: 6 },
  aviso: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 8 },
  avisoTokens: { color: C.tx2 },
  totalCat: { fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 8 },
  pestanas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  pestana: { flex: 1, minHeight: 40, minWidth: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 },
  pestanaSel: { backgroundColor: C.s3 },
  pestanaNo: { opacity: 0.45 },
  pestanaPulsada: { backgroundColor: C.ton },
  pestanaTxt: { fontFamily: F.media, fontSize: 15, lineHeight: 19, color: C.tx2 },
  pestanaTxtSel: { fontFamily: F.negrita, color: C.tx },
  grafico: { marginTop: 8 },
  // En una línea, en la franja de arriba del gráfico (no tapa la línea).
  burbuja: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.p, backgroundColor: C.s3 },
  burbujaFecha: { fontFamily: F.media, fontSize: 12, lineHeight: 16, color: C.tx2, fontVariant: ['tabular-nums'] },
  burbujaValor: { fontFamily: F.semi, fontSize: 15, lineHeight: 18, color: C.tx, fontVariant: ['tabular-nums'] },
  burbujaCambio: { fontFamily: F.media, fontSize: 12, lineHeight: 16, color: C.tx2, fontVariant: ['tabular-nums'] },
  nota: { fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 10 },
  como: { minHeight: 44, justifyContent: 'center', marginLeft: -8, paddingHorizontal: 8, borderRadius: R.m, alignSelf: 'flex-start' },
  comoTxt: { fontFamily: F.media, fontSize: 13, lineHeight: 18, color: C.tx2 },
  clave: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, borderTopWidth: 1, borderTopColor: C.bd, columnGap: 16 },
  claveItem: { width: '47%', flexGrow: 1, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bd, gap: 2 },
  // El último dato (un texto, no una cifra) ocupa la fila entera.
  claveItemTexto: { width: '100%' },
  claveRotulo: { fontFamily: F.media, fontSize: 13, lineHeight: 17, color: C.tx3 },
  claveValor: { ...T.instrumento, fontSize: 16, lineHeight: 21, color: C.tx },
  claveValorTexto: { fontFamily: F.semi },
  claveExtra: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.tx3 },
  fuente: { minHeight: 44, justifyContent: 'center', marginTop: 8, marginLeft: -8, paddingHorizontal: 8, borderRadius: R.m, alignSelf: 'flex-start' },
  fuenteTxt: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  fuenteEnlace: { fontFamily: F.media, color: C.senal, textDecorationLine: 'underline' },
  h2: { fontFamily: F.negrita, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: C.tx },
  h2Sub: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx3, marginTop: 4, marginBottom: 12 },
  tipos: { marginTop: 28 },
  tipo: { marginBottom: 12, gap: 4 },
  tipoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  tipoNom: { flexShrink: 1, fontFamily: F.media, fontSize: 15, lineHeight: 20, color: C.tx },
  // Las cifras, alineadas a la derecha como en una tabla financiera.
  tipoValor: { ...T.instrumento, fontSize: 14, lineHeight: 20, color: C.tx, textAlign: 'right' },
  avance: { fontFamily: F.regular, fontSize: 13, color: C.tx3 },
  barra: { height: 6, borderRadius: R.p, backgroundColor: C.ton, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: R.p },
  tipoPie: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  noticias: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: C.bd },
  ct: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  ctPulsada: { backgroundColor: C.s2 },
  ctIzq: { flex: 1, minWidth: 0, gap: 2 },
  ctNom: { fontFamily: F.negrita, fontSize: 17, lineHeight: 21, color: C.tx },
  ctSub: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: C.tx3 },
  ctDer: { alignItems: 'flex-end', gap: 1 },
  ctCifra: { ...T.instrumento, fontSize: 17, lineHeight: 22, color: C.tx },
  ctPeriodo: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.tx3 },
  ctExplica: { marginTop: 10 },
});

export const _pruebas = { valorHoy, colorLinea, colorTexto, atrasada, CRUZ_FIJA_MS, UI };
