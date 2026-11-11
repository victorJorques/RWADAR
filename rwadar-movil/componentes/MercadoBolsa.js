import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { cargarTokenizacion } from '../lib/tokenizacion-remota';
import { cargarSerie } from '../lib/tokenizacion-serie-remota';
import { FUENTE, PESTANAS, PESTANA_INICIAL, cambioPct, colorTipo, coordenadas, cuota, direccion, fechaCorta, graficoPestana, horaDato,
  indiceCercano, millones, millonesHablados, notaSerie, porcentaje, tramo, tramosSeguidos, trazosSvg } from '../lib/tokenizacion';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Mercado y noticias» al estilo de una app de bolsa (11/11/2026), como la web
   ---------------------------------------------------------------------
   Dos lecturas de rwadar.pages.dev: /api/tokenizacion (el dato de hoy, en
   vivo, y los tipos) y /datos/tokenizacion-serie.json (la serie diaria de
   un año: la suma de los 40 mayores tokens de CoinGecko). Todos los
   cálculos, en lib/tokenizacion.js (el mismo motor que la web): aquí solo
   se dibuja.
   - MercadoPantalla: el nombre, la cifra grande y el cambio del periodo
     (signo, flecha y texto: el color nunca va solo), las pestañas 1 S · 1 M ·
     3 M · 6 M · YTD · 1 A (1 M por defecto), el gráfico de área (verde si
     sube, rojo si baja; eje de valores a la derecha, fechas abajo, rejilla
     suave y una línea de puntos en el valor de partida) con una cruz que
     sigue al dedo (gesto de arrastre) o a los gestos de accesibilidad
     (subir y bajar), los datos clave, las barras por tipo y, debajo
     (children), las noticias relacionadas.
   - MercadoCotizacion: la tarjeta de Inicio (nombre, cifra, cambio del mes
     y un minigráfico del mes), que abre la pantalla.
   Los textos van ya en el idioma elegido (noTraducir): llevan cifras.
   --------------------------------------------------------------------- */
const VERDE = C.senal;
const ROJO = '#FF6B5E';
const ROJO_TEXTO = C.alarma;
const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
const CORTO_EN = { '1s': '1W', '1m': '1M', '3m': '3M', '6m': '6M', ytd: 'YTD', '1a': '1Y' };
const NOMBRE_EN = { '1s': '1 week', '1m': '1 month', '3m': '3 months', '6m': '6 months', ytd: 'Year to date', '1a': '1 year' };
const TIPOS_EN = { 'Crédito privado': 'Private credit', 'Letras del Tesoro': 'Treasury bills', 'Materias primas': 'Commodities', Acciones: 'Stocks',
  'Fondos monetarios': 'Money market funds', 'Otros créditos': 'Other credit', ETF: 'ETFs', Inmuebles: 'Real estate' };

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

function valorHoy(vivo, serie) {
  if (vivo?.total) return vivo.total.valor;
  const p = serie?.puntos?.[serie.puntos.length - 1];
  return p ? p.valor : null;
}

/* ---- El gráfico de área, con su cruz ---- */
export function GraficoBolsa({ g, idioma, alto = 240 }) {
  const [ancho, setAncho] = useState(0);
  const [indice, setIndice] = useState(null);
  const EJE = 54, ARRIBA = 10, ABAJO = 28;
  const PW = Math.max(0, ancho - EJE), PH = alto - ARRIBA - ABAJO;
  const coords = useMemo(() => (ancho > 0 ? coordenadas(g, PW, PH).map((c) => ({ x: c.x, y: c.y + ARRIBA })) : []), [g, ancho, PW, PH]);
  const ref = useRef({ coords, n: g.puntos.length });
  ref.current = { coords, n: g.puntos.length };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    // Solo el arrastre horizontal mueve la cruz; el vertical sigue desplazando la pantalla.
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderTerminationRequest: () => true,
    onPanResponderGrant: (ev) => { setIndice(indiceCercano(ref.current.coords, ev.nativeEvent.locationX)); tacto.eleccion?.(); },
    onPanResponderMove: (ev) => setIndice(indiceCercano(ref.current.coords, ev.nativeEvent.locationX)),
    onPanResponderRelease: () => setIndice(null),
    onPanResponderTerminate: () => setIndice(null),
  }), []);
  // Al cambiar de pestaña, la cruz se quita.
  useEffect(() => { setIndice(null); }, [g]);

  const dir = g.direccion, color = colorLinea(dir);
  const yDe = (v) => ARRIBA + PH - ((v - g.escala.lo) / (g.escala.hi - g.escala.lo)) * PH;
  // Tramo a tramo: donde falta un día, la línea se corta (no se une con una recta).
  const { linea: trazo, area } = coords.length ? trazosSvg(coords, tramosSeguidos(g), ARRIBA + PH) : { linea: '', area: '' };
  const k = indice === null ? null : Math.max(0, Math.min(g.puntos.length - 1, indice));
  const activo = k === null ? null : { c: coords[k], p: g.puntos[k] };
  const ultimo = g.puntos[g.puntos.length - 1];
  const valorTexto = (p) => `${fechaCorta(p.fecha, idioma)}: ${millonesHablados(p.valor, idioma)}`;
  const anchoBurbuja = 150;
  const xBurbuja = activo ? Math.max(0, Math.min(Math.max(0, PW - anchoBurbuja), activo.c.x - anchoBurbuja / 2)) : 0;
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
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {g.marcasValores.map((m) => (
            <Line key={'v' + m.valor} x1={0} x2={PW} y1={yDe(m.valor)} y2={yDe(m.valor)} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          ))}
          {g.marcasFechas.map((m) => (
            <Line key={'f' + m.fecha} x1={coords[m.indice].x} x2={coords[m.indice].x} y1={ARRIBA} y2={ARRIBA + PH} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          ))}
          <Line x1={0} x2={ancho} y1={ARRIBA + PH} y2={ARRIBA + PH} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          <Path d={area} fill="url(#mkDeg)" />
          <Line x1={0} x2={PW} y1={yDe(g.estadisticas.inicio)} y2={yDe(g.estadisticas.inicio)} stroke={C.tx3} strokeWidth={1} strokeDasharray="2 4" />
          <Path d={trazo} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {g.marcasValores.map((m) => (
            <SvgText key={'tv' + m.valor} x={PW + 8} y={yDe(m.valor) + 4} fill={C.tx2} fontSize={12} fontFamily={F.media}>{m.texto}</SvgText>
          ))}
          <SvgText x={ancho - 2} y={alto - 9} fill={C.tx3} fontSize={11} fontFamily={F.media} textAnchor="end">{idioma === 'en' ? '$M' : 'M$'}</SvgText>
          {g.marcasFechas.map((m) => {
            const x = coords[m.indice].x;
            return (
              <SvgText key={'tf' + m.fecha} x={x} y={alto - 9} fill={C.tx2} fontSize={12} fontFamily={F.media}
                textAnchor={x < 24 ? 'start' : x > PW - 24 ? 'end' : 'middle'}>{m.texto}</SvgText>
            );
          })}
          {activo ? (
            <>
              <Line x1={activo.c.x} x2={activo.c.x} y1={ARRIBA} y2={ARRIBA + PH} stroke={C.tx2} strokeWidth={1} strokeDasharray="3 3" />
              <Line x1={0} x2={PW} y1={activo.c.y} y2={activo.c.y} stroke={C.tx2} strokeWidth={1} strokeDasharray="3 3" />
              <Circle cx={activo.c.x} cy={activo.c.y} r={5} fill={color} stroke={C.s0} strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      ) : null}
      {activo ? (
        <View pointerEvents="none" style={[e.burbuja, { width: anchoBurbuja, transform: [{ translateX: xBurbuja }] }]} accessible={false}
          importantForAccessibility="no-hide-descendants">
          <Text noTraducir style={e.burbujaFecha}>{fechaCorta(activo.p.fecha, idioma)}</Text>
          <Text noTraducir style={e.burbujaValor}>{millones(activo.p.valor, idioma)}</Text>
          <Text noTraducir style={e.burbujaCambio}>
            {`${porcentaje(cambioPct(activo.p.valor, g.estadisticas.inicio), idioma)} ${idioma === 'en' ? 'since start' : 'desde el inicio'}`}
          </Text>
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

function Fuente({ vivo, serie, idioma, onAbrirEnlace }) {
  const en = idioma === 'en';
  const partes = [];
  if (vivo) partes.push(`${vivo.fuente === 'coingecko' ? (en ? "today's figure from" : 'dato de hoy del') : (en ? 'last saved snapshot, from' : 'última foto guardada, del')} ${horaDato(vivo.actualizado, idioma)}`);
  if (serie) partes.push(`${en ? 'daily series to' : 'serie diaria hasta el'} ${fechaCorta(serie.puntos[serie.puntos.length - 1].fecha, idioma)}`);
  return (
    <Pressable onPress={() => { tacto.abrir(); onAbrirEnlace?.(FUENTE.url); }} style={({ pressed }) => [e.fuente, pressed && pulsado('b3')]}
      accessibilityRole="link" noTraducir accessibilityLabel={[`${en ? 'Data:' : 'Datos:'} CoinGecko`, ...partes].join(' · ')}>
      <Text noTraducir style={e.fuenteTxt}>
        {en ? 'Data: ' : 'Datos: '}<Text noTraducir style={e.fuenteEnlace}>CoinGecko</Text>{partes.length ? ' · ' + partes.join(' · ') : ''}
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
  const disponible = (clave) => !!(serie && tramo(serie.puntos, clave));
  const elegida = serie && !disponible(pestana) ? (PESTANAS.find((p) => disponible(p.clave))?.clave || pestana) : pestana;
  const g = serie ? graficoPestana(serie, elegida, idioma) : null;
  const hoy = valorHoy(vivo, serie);
  const [cifra, unidad] = hoy === null ? ['', ''] : millones(hoy, idioma).split(' ');
  const clave = (rotulo, valor, extra = null, color = null) => (
    <View key={rotulo} style={e.claveItem} accessible noTraducir accessibilityLabel={[rotulo, valor, extra].filter(Boolean).join(': ')}>
      <Text noTraducir style={e.claveRotulo}>{rotulo}</Text>
      <Text noTraducir style={[e.claveValor, color && { color }]}>{valor}</Text>
      {extra ? <Text noTraducir style={e.claveExtra}>{extra}</Text> : null}
    </View>
  );
  const d24 = vivo ? direccion(vivo.total.cambio24h) : 'sin-datos';
  const mayor = vivo?.tipos?.[0];
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
          <View accessible noTraducir accessibilityLabel={`${millonesHablados(hoy, idioma)}${g ? `, ${g.direccion === 'sube' ? (en ? 'up' : 'sube') : g.direccion === 'baja' ? (en ? 'down' : 'baja') : (en ? 'unchanged' : 'sin cambios')} ${g.cambioTexto}, ${g.periodoTexto}` : ''}`}>
            <Text noTraducir style={e.cifra} numberOfLines={1} adjustsFontSizeToFit>
              {cifra}{unidad ? <Text noTraducir style={e.unidad}>{' ' + unidad}</Text> : null}
            </Text>
            {g ? (
              <View style={e.lineaCambio}>
                <Cambio g={g} grande />
                <Text noTraducir style={e.periodo}>{g.periodoTexto}</Text>
              </View>
            ) : <Text noTraducir style={e.periodo}>{en ? 'Total value, in millions of dollars' : 'Valor total, en millones de dólares'}</Text>}
          </View>
          {!vivo ? <Text noTraducir style={e.aviso}>{en ? "Without today's figure: this is the sum of the largest tokens on the series' last day." : 'Sin el dato de hoy: la cifra es la suma de los mayores tokens del último día de la serie.'}</Text> : null}
          {vivo?.fuente === 'foto-guardada' ? <Text noTraducir style={e.aviso}>{`${en ? "Figure from RWAdar's last daily snapshot, " : 'Cifra de la última foto diaria de RWAdar, del '}${horaDato(vivo.actualizado, idioma)}`}</Text> : null}
        </View>
      ) : null}
      {hoy !== null ? (
        <View style={e.pestanas} accessibilityRole="tablist">
          {PESTANAS.map((p) => {
            const sel = p.clave === elegida, ok = disponible(p.clave);
            return (
              <Pressable key={p.clave} disabled={!ok} onPress={() => { tacto.eleccion(); setPestana(p.clave); }}
                style={({ pressed }) => [e.pestana, sel && e.pestanaSel, !ok && e.pestanaNo, pressed && !sel && e.pestanaPulsada]}
                accessibilityRole="tab" accessibilityState={{ selected: sel, disabled: !ok }} noTraducir accessibilityLabel={en ? NOMBRE_EN[p.clave] : p.nombre}
                testID={'pestana-' + p.clave}>
                <Text noTraducir style={[e.pestanaTxt, sel && e.pestanaTxtSel]}>{en ? CORTO_EN[p.clave] : p.corto}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {g ? (
        <View style={e.grafico}>
          <GraficoBolsa g={g} idioma={idioma} />
          <Text noTraducir style={e.nota}>{notaSerie(serie, idioma)}</Text>
        </View>
      ) : hoy !== null && fase !== 'cargando' ? (
        <Text noTraducir style={e.estado}>{en ? "The chart isn't available right now. Today's figure is." : 'El gráfico no está disponible ahora. La cifra de hoy sí.'}</Text>
      ) : null}
      {hoy !== null ? (
        <View style={e.clave}>
          {clave(en ? 'Total value today' : 'Valor total hoy', millones(hoy, idioma))}
          {clave(en ? '24 h change' : 'Cambio en 24 h', d24 === 'sin-datos' ? '—' : `${FLECHA[d24]} ${porcentaje(vivo.total.cambio24h, idioma)}`, null, d24 === 'sin-datos' ? null : colorTexto(d24))}
          {g ? clave(en ? 'Period high' : 'Máximo del periodo', millones(g.estadisticas.max.valor, idioma), fechaCorta(g.estadisticas.max.fecha, idioma)) : null}
          {g ? clave(en ? 'Period low' : 'Mínimo del periodo', millones(g.estadisticas.min.valor, idioma), fechaCorta(g.estadisticas.min.fecha, idioma)) : null}
          {serie ? clave(en ? 'Tokens in the chart' : 'Tokens en el gráfico', String(serie.incluidos), `${cuota(serie.cobertura, idioma)} ${en ? 'of the total' : 'del total'}`) : null}
          {mayor ? clave(en ? 'Largest type' : 'Tipo mayor', en ? TIPOS_EN[mayor.nombre] || mayor.nombre : mayor.nombre, `${cuota(mayor.cuota, idioma)} ${en ? 'of the total' : 'del total'}`) : null}
        </View>
      ) : null}
      {hoy !== null ? <Fuente vivo={vivo} serie={serie} idioma={idioma} onAbrirEnlace={onAbrirEnlace} /> : null}

      {vivo?.tipos?.length ? (
        <View style={e.tipos}>
          <Text noTraducir style={e.h2} accessibilityRole="header">{en ? 'By asset type' : 'Por tipo de activo'}</Text>
          <Text noTraducir style={e.h2Sub}>{en ? "Today. CoinGecko's categories can overlap." : 'Hoy. Las categorías de CoinGecko pueden solaparse.'}</Text>
          {vivo.tipos.map((t) => {
            const dir = direccion(t.cambio24h);
            const nombre = en ? TIPOS_EN[t.nombre] || t.nombre : t.nombre;
            const cambio = dir === 'sin-datos' ? '—' : `${FLECHA[dir]} ${porcentaje(t.cambio24h, idioma)} ${en ? 'in 24 h' : 'en 24 h'}`;
            return (
              <View key={t.clave} style={e.tipo} accessible noTraducir
                accessibilityLabel={`${nombre}: ${millones(t.valor, idioma)}, ${cuota(t.cuota, idioma)} ${en ? 'of the total' : 'del total'}, ${cambio}`}>
                <View style={e.tipoFila}>
                  <Text noTraducir style={e.tipoNom}>{nombre}</Text>
                  <Text noTraducir style={e.tipoValor}>{millones(t.valor, idioma)}</Text>
                </View>
                <View style={e.barra}>
                  <View style={[e.relleno, { width: `${Math.max(1.5, Math.min(100, t.cuota)).toFixed(2)}%`, backgroundColor: colorTipo(vivo, t.clave) }]} />
                </View>
                <View style={e.tipoFila}>
                  <Text noTraducir style={e.tipoPie}>{`${cuota(t.cuota, idioma)} ${en ? 'of the total' : 'del total'}`}</Text>
                  <Text noTraducir style={[e.tipoPie, { color: colorTexto(dir) }]}>{cambio}</Text>
                </View>
              </View>
            );
          })}
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
  const { linea: d, area } = trazosSvg(coords, tramosSeguidos(g), H);
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
      <Path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function MercadoCotizacion({ onAbrir, onAbrirEnlace, cargarVivo, cargarLaSerie }) {
  const idioma = useIdioma();
  const en = idioma === 'en';
  const { fase, vivo, serie, reintentar } = useMercado({ cargarVivo, cargarLaSerie });
  const hoy = valorHoy(vivo, serie);
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
        accessibilityLabel={`${en ? 'Tokenised asset market' : 'Mercado de activos tokenizados'}: ${millonesHablados(hoy, idioma)}${g ? `, ${palabra} ${g.cambioTexto} ${en ? 'over the' : 'en el'} ${g.periodoTexto}` : ''}. ${en ? 'See the chart' : 'Ver el gráfico'}`}
        testID="mercado-cotizacion">
        <View style={e.ctIzq}>
          <Text noTraducir style={e.ctNom}>{en ? 'Tokenised assets' : 'Activos tokenizados'}</Text>
          <Text noTraducir style={e.ctSub}>{en ? 'Global market' : 'Mercado mundial'}</Text>
        </View>
        {g ? <Minigrafico g={g} /> : null}
        <View style={e.ctDer}>
          <Text noTraducir style={e.ctCifra} numberOfLines={1}>{millones(hoy, idioma)}</Text>
          {g ? <Cambio g={g} /> : null}
          {g ? <Text noTraducir style={e.ctPeriodo}>{g.periodoTexto}</Text> : null}
        </View>
      </Pressable>
      <Fuente vivo={vivo} serie={null} idioma={idioma} onAbrirEnlace={onAbrirEnlace} />
    </View>
  );
}

const e = StyleSheet.create({
  pantalla: { paddingTop: 12 },
  ante: { ...T.etiqueta, color: C.tx3 },
  titulo: { fontFamily: F.negrita, fontSize: 26, lineHeight: 31, letterSpacing: -0.5, color: C.tx, marginTop: 4 },
  estado: { ...T.menor, color: C.tx2, marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoCaja: { marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoTxt: { ...T.menor, color: C.tx2 },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8, marginTop: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  cab: { paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.bd },
  cifra: { fontFamily: F.semi, fontVariant: ['tabular-nums'], letterSpacing: -1, fontSize: 40, lineHeight: 46, color: C.tx },
  unidad: { fontFamily: F.media, fontSize: 20, color: C.tx2, letterSpacing: 0 },
  lineaCambio: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10, rowGap: 2, marginTop: 4 },
  cambio: { ...T.instrumento, fontSize: 14, lineHeight: 19 },
  cambioGrande: { fontSize: 18, lineHeight: 24 },
  periodo: { fontFamily: F.media, fontSize: 16, lineHeight: 21, color: C.tx2 },
  aviso: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 8 },
  pestanas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginHorizontal: -4 },
  pestana: { flex: 1, minHeight: 40, minWidth: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 },
  pestanaSel: { backgroundColor: C.s3 },
  pestanaNo: { opacity: 0.45 },
  pestanaPulsada: { backgroundColor: C.ton },
  pestanaTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 19, color: C.tx2 },
  pestanaTxtSel: { color: C.tx },
  grafico: { marginTop: 8 },
  burbuja: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.s || 8, backgroundColor: 'rgba(23,22,20,0.95)',
    borderWidth: 1, borderColor: C.bd },
  burbujaFecha: { fontFamily: F.media, fontSize: 12, lineHeight: 16, color: C.tx2 },
  burbujaValor: { ...T.instrumento, fontSize: 16, lineHeight: 20, color: C.tx },
  burbujaCambio: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.tx3 },
  nota: { fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 10 },
  clave: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, borderTopWidth: 1, borderTopColor: C.bd, columnGap: 16 },
  claveItem: { width: '47%', flexGrow: 1, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bd, gap: 2 },
  claveRotulo: { fontFamily: F.media, fontSize: 13, lineHeight: 17, color: C.tx3 },
  claveValor: { ...T.instrumento, fontSize: 16, lineHeight: 21, color: C.tx },
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
  tipoValor: { ...T.instrumento, fontSize: 14, lineHeight: 20, color: C.tx },
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
});

export const _pruebas = { valorHoy, colorLinea, colorTexto, UI };
