import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { cargarTokenizacion } from '../lib/tokenizacion-remota';
import { cargarSerieConDirecto } from '../lib/tokenizacion-serie-remota';
import { FUENTE, PESTANAS, PESTANA_INICIAL, avisoDirecto, cambio24h, cambioPct, cifraGrande, coberturaTexto, colorTipo, coordenadas, cuandoDato, cuota, direccion,
  etiquetaPestana, explicacionCambio, fechaCorta, finaAtrasada, graficoPestana, horaEspana, indiceCercano, lineaTotalCategoria, marcaValor, millones, millonesHablados,
  msMinuto, notaCorta, notaSerie, pestanaDisponible, porcentaje, rotuloDato, serieAtrasada, seriePestana, subtituloCifra, textoCategoria, textoInstante,
  tramosSeguidos, trazosSvg } from '../lib/tokenizacion';
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
     pestañas 24 h · 1 S · 1 M · 3 M · 6 M · 2026 · 1 A (1 M por defecto; en
     inglés, «24H» y «YTD»), el gráfico de área (verde si sube, rojo si
     baja; eje de valores a la derecha con el último valor marcado, horas o
     fechas abajo, rejilla suave y una línea de puntos en el valor de
     partida) con una cruz que sigue al dedo (gesto de arrastre) o a los
     gestos de accesibilidad (subir y bajar), los datos clave, las barras
     por tipo y, debajo (children), las noticias relacionadas.
   - MercadoCotizacion: la tarjeta de Inicio (nombre, cifra, cambio del mes
     y un minigráfico del mes: la misma cifra que su final), que abre la
     pantalla.
   Los textos van ya en el idioma elegido (noTraducir): llevan cifras.
   Más detalle en el tiempo (13/11/2026): la app lee también las series
   finas (/datos/tokenizacion-serie-fina.json, cargarSerieConFina) y cada
   pestaña usa la más fina que la cubre (seriePestana): 24 h, un punto cada
   5 minutos; 1 S y 1 M, cada hora; las demás, cada día. Sin la fina (una web
   sin publicar o una lectura que falla), todo sigue con la diaria y «24 h»
   sale desactivada. El eje y la cruz dicen la hora de España en las finas.
   En directo (14/11/2026): la serie sale de /api/tokenizacion/directo
   (cargarSerieConDirecto: Supabase pide a CoinGecko cada 5 minutos); si no
   vale, la fina publicada, como antes. Con la app a la vista se vuelve a
   pedir cuando toca el dato siguiente, sin cambiar de pestaña y esperando a
   que se quite la cruz. Si el directo está encendido y falla, una línea lo
   dice (y en Inicio, «copia de las 16:05», o «copia del 14/11, 15:00» si no
   es de hoy); apagado, nada. «Hoy» solo con datos de hoy (rotuloDato, 20/11/2026).
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

/* Las dos lecturas, juntas. Un fallo de una no tumba la otra. La serie, del
   directo si vale; si no, con sus finas publicadas si las hay y casan con
   ella (si no, la diaria sola). cargarLaSerie puede devolver la serie sola
   (las pruebas de antes) o { serie, origen, motivo, proximo }.
   El refresco (14/11/2026): con la app activa (AppState) se vuelve a pedir
   la serie (no el total) cuando toca; con la cruz a la vista («ocupado»), 3 s
   después; al volver a primer plano, enseguida si ya tocaba o si han pasado
   más de 4 minutos (con Date.now(), que no se para cuando el móvil duerme). */
const MAX_ESPERA_MS = 30 * 60000;
const comoResultado = (r) => (r && typeof r === 'object' && 'origen' in r && 'serie' in r ? r : { serie: r || null, origen: null, motivo: null, proximo: 0 });
export function useMercado({ cargarVivo = cargarTokenizacion, cargarLaSerie = cargarSerieConDirecto, ocupado = null } = {}) {
  const [estado, setEstado] = useState({ fase: 'cargando', vivo: null, serie: null, origen: null, motivo: null });
  const vivoRef = useRef(true);
  const reloj = useRef({ temporizador: null, proximo: 0, pedido: 0 });
  const acciones = useRef({});
  const pedir = useCallback(({ soloSerie = false } = {}) => {
    if (!soloSerie) setEstado((s) => ({ ...s, fase: 'cargando' }));
    reloj.current.pedido = Date.now();
    const a = soloSerie ? Promise.resolve(null) : Promise.resolve().then(() => cargarVivo()).then((d) => (d && d.fuente !== 'sin-datos' ? d : null)).catch(() => null);
    const b = Promise.resolve().then(() => cargarLaSerie()).then(comoResultado).catch(() => null);
    return Promise.all([a, b]).then(([vivo, r]) => {
      if (!vivoRef.current) return;
      reloj.current.proximo = r && r.proximo ? r.proximo : 0;
      setEstado((s) => {
        const v = vivo || s.vivo, se = (r && r.serie) || s.serie;
        const origen = r && r.serie ? r.origen : s.origen, motivo = r && r.serie ? r.motivo : s.motivo;
        return { fase: v || se ? 'listo' : 'error', vivo: v, serie: se, origen, motivo };
      });
      acciones.current.programar?.();
    });
  }, [cargarVivo, cargarLaSerie]);
  acciones.current.pedir = pedir;
  acciones.current.programar = () => {
    const r = reloj.current;
    clearTimeout(r.temporizador);
    r.temporizador = null;
    const activa = !AppState || !AppState.currentState || AppState.currentState === 'active';
    if (!vivoRef.current || !r.proximo || !activa) return;
    r.temporizador = setTimeout(() => acciones.current.tic(), Math.min(MAX_ESPERA_MS, Math.max(1000, r.proximo - Date.now())));
  };
  acciones.current.tic = () => {
    reloj.current.temporizador = null;
    if (!vivoRef.current) return;
    if (ocupado && ocupado.current) { reloj.current.temporizador = setTimeout(() => acciones.current.tic(), 3000); return; }
    acciones.current.pedir({ soloSerie: true });
  };
  useEffect(() => {
    vivoRef.current = true;
    pedir();
    const escucha = AppState && typeof AppState.addEventListener === 'function' ? AppState.addEventListener('change', (e) => {
      const r = reloj.current;
      if (e !== 'active') { clearTimeout(r.temporizador); r.temporizador = null; return; }
      if (r.proximo && (Date.now() >= r.proximo || Date.now() - r.pedido > 4 * 60000)) acciones.current.tic(); else acciones.current.programar();
    }) : null;
    return () => { vivoRef.current = false; clearTimeout(reloj.current.temporizador); escucha?.remove?.(); };
  }, [pedir]);
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

/* ---- Cuándo es cada punto (13/11/2026) ----
   De la diaria, su fecha («08/11/2026»). De las finas, en hora de España
   (textoInstante): en 24 h, la hora («16:05»), y si el punto es del día
   anterior al último, también el día («12 nov, 16:05»: el primer y el último
   punto de 24 h tienen la misma hora y no se distinguirían); en las horarias
   (1 S y 1 M), el día y la hora («8 nov, 18:00»). */
function cuandoCorto(p, g, idioma) {
  if (g.resolucion === '1d' || typeof p.ms !== 'number') return fechaCorta(p.fecha, idioma);
  if (g.resolucion === '5m' && horaEspana(p.ms).fecha === horaEspana(g.puntos[g.puntos.length - 1].ms).fecha) return textoInstante(p, idioma, '5m');
  return textoInstante(p, idioma, '1h');
}
/* Con la fecha entera, para el lector de pantalla: «13/11/2026, 16:05 (hora de España)». */
function cuandoLargo(p, g, idioma) {
  return g.resolucion === '1d' || typeof p.ms !== 'number' ? fechaCorta(p.fecha, idioma) : textoInstante(p, idioma, g.resolucion, { largo: true });
}
/* Para los datos clave: «13/11/2026, 16:05» (hora de España) si el punto es de una fina; si no, su fecha. */
function cuandoMedio(p, idioma) {
  if (!p || typeof p.ms !== 'number') return fechaCorta(p?.fecha, idioma);
  const h = horaEspana(p.ms);
  return `${fechaCorta(h.fecha, idioma)}, ${h.hora}`;
}
/* El lector de pantalla recorre la línea a saltos que se pueden escuchar
   (288 puntos de uno en uno no hay quien los oiga): de hora en hora en 24 h,
   de 6 en 6 horas en 1 S y de día en día en 1 M y en las diarias. */
function pasoLector(g) {
  if (g.resolucion === '5m') return { paso: Math.max(1, Math.round(3600000 / g.pasoMs)), es: 'una hora', en: 'an hour' };
  if (g.resolucion === '1h') return g.clave === '1s' ? { paso: 6, es: '6 horas', en: '6 hours' } : { paso: 24, es: 'un día', en: 'a day' };
  return { paso: 1, es: 'un día', en: 'a day' };
}
/* Las medidas del gráfico con la letra del sistema (fontScale). Las cifras
   del eje crecen con ella hasta 1,5 veces (más no caben a lo ancho). La
   franja de arriba, donde va la burbuja de la cruz, crece con la letra entera
   y con las líneas que ocupará la burbuja en ese ancho («lineas»: con la
   letra al 200 %, la burbuja va en dos líneas y tapaba el principio de la
   línea y la píldora). Con la letra normal, las de siempre: eje de 54 px,
   franja de 40 y 28 abajo; el dibujo mide siempre alto − 68. */
function medidasGrafico(fontScale = 1, lineas = 1) {
  const fs = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const f = Math.min(1.5, Math.max(1, fs));
  const letra = Math.round(12 * f);
  return { letra, EJE: Math.round(54 * f), ARRIBA: Math.max(40, Math.ceil(lineas * 18 * Math.max(1, fs) + 22)), ABAJO: 16 + letra, HOLGURA: 8,
    PILDORA: Math.round(18 * f) };
}
/* Cuántas líneas ocupará la burbuja en un gráfico de ancho «ancho»: lo que
   miden su fecha más larga (la del primer punto), el máximo del periodo y un
   cambio de 6 caracteres, con su letra (12, 15 en seminegrita y 12 px, por la
   del sistema), sus 8 px entre ellas y sus 10 a cada lado. De 1 a 3. */
function lineasBurbuja(g, idioma, ancho, fontScale = 1) {
  if (!(ancho > 0)) return 1;
  const fs = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const textos = [anchoTexto(cuandoCorto(g.puntos[0], g, idioma), 12 * fs), anchoTexto(millones(g.estadisticas.max.valor, idioma), 15 * fs) * 1.08,
    anchoTexto('+00,0 %', 12 * fs)];
  if (textos.reduce((s, w) => s + w, 0) + 16 + 20 <= ancho) return 1;
  return textos[0] + textos[1] + 8 + 20 <= ancho ? 2 : 3;
}
/* Las fechas de abajo que caben sin pisarse: cada una ocupa lo que su texto
   (en Geist, unos 0,58 em cada cifra, 0,28 un espacio y 0,52 lo demás; medido
   en la captura: «15 oct» a 12 px son 34 px) y se salta la que tocaría a la
   anterior (con la letra grande, «dic 2025» y «mar» se montaban). Con la
   letra normal caben todas las que da el modelo. */
const anchoTexto = (texto, letra) => [...texto].reduce((s, c) => s + (/\d/.test(c) ? 0.58 : c === ' ' ? 0.28 : 0.52), 0) * letra;
function fechasQueCaben(marcas, coords, PW, letra) {
  const salida = [];
  let fin = -Infinity;
  for (const m of marcas) {
    const x = coords[m.indice]?.x;
    if (typeof x !== 'number') continue;
    const w = anchoTexto(m.texto, letra);
    // Centrada en su raya («xt»); junto a los bordes, lo justo hacia dentro para no salirse
    // (empezar en la raya empujaba la siguiente: con la letra al 130 % se perdía «00:00»).
    // Junto a los bordes, anclada al borde (no centrada con un ancho estimado, que se queda corto con «Dec 2025»
    // y la letra grande: el SVG recorta lo que sale de su caja y se perdía media «D»).
    const ancla = x - w / 2 < 4 ? 'start' : x + w / 2 > PW - 4 ? 'end' : 'middle';
    const xt = ancla === 'start' ? 0 : ancla === 'end' ? PW : x;
    const ini = ancla === 'start' ? 0 : ancla === 'end' ? PW - w : x - w / 2;
    if (ini < fin + 6) continue;
    salida.push({ ...m, x, xt, ancla });
    fin = ini + w;
  }
  return salida;
}

/* ---- El gráfico de área, con su cruz ----
   Con 721 puntos (1 M, cada hora) el dedo tiene que ir fluido: el dibujo que
   no cambia al mover la cruz (rejilla, área, línea, eje, fechas y píldora)
   se calcula una vez por pestaña y tamaño (useMemo) y React no lo vuelve a
   recorrer; al arrastrar solo cambian la raya, el punto y la burbuja. La
   línea se pinta simplificada sin perder máximos ni mínimos (trazosSvg con
   indicesPintar) y la cruz busca el punto con búsqueda binaria
   (indiceCercano), entre todos los puntos. */
export function GraficoBolsa({ g, idioma, alto = 270, ocupado = null }) {
  const { fontScale } = useWindowDimensions();
  const [ancho, setAncho] = useState(0);
  const lineas = useMemo(() => lineasBurbuja(g, idioma, ancho, fontScale), [g, idioma, ancho, fontScale]);
  const { letra, EJE, ARRIBA, ABAJO, HOLGURA, PILDORA } = useMemo(() => medidasGrafico(fontScale, lineas), [fontScale, lineas]);
  const [indice, setIndice] = useState(null);
  // Lo que mide la burbuja (su texto cambia de largo con el idioma y la letra): así no se sale por los lados.
  const [anchoBurbuja, setAnchoBurbuja] = useState(0);
  const reloj = useRef(null);
  const parar = () => { clearTimeout(reloj.current); reloj.current = null; };
  // ARRIBA: una franja libre para la burbuja de la cruz, que así no tapa la línea.
  // HOLGURA: la línea acaba 8 px antes del eje, así el punto de la cruz en el
  // último punto no toca la píldora del último valor (revisión del 11/11/2026).
  const PH = alto - 68, altoTotal = ARRIBA + PH + ABAJO;
  const PW = Math.max(0, ancho - EJE);
  const coords = useMemo(() => (ancho > 0 ? coordenadas(g, Math.max(0, PW - HOLGURA), PH).map((c) => ({ x: c.x, y: c.y + ARRIBA })) : []),
    [g, ancho, PW, PH, ARRIBA, HOLGURA]);
  const ref = useRef({ coords, n: g.puntos.length });
  ref.current = { coords, n: g.puntos.length };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    // Solo el arrastre horizontal mueve la cruz; el vertical sigue desplazando la pantalla.
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderTerminationRequest: () => true,
    onPanResponderGrant: (ev) => { parar(); setIndice(indiceCercano(ref.current.coords, ev.nativeEvent.locationX)); tacto.eleccion?.(); },
    // Si el dedo sigue en el mismo punto, el índice no cambia y React no vuelve a pintar.
    onPanResponderMove: (ev) => setIndice(indiceCercano(ref.current.coords, ev.nativeEvent.locationX)),
    // Un toque corto no se perdía: la cruz se queda 3 s después de soltar.
    onPanResponderRelease: () => { parar(); reloj.current = setTimeout(() => { reloj.current = null; setIndice(null); }, CRUZ_FIJA_MS); },
    onPanResponderTerminate: () => { parar(); setIndice(null); },
  }), []);
  // Al cambiar de pestaña, la cruz se quita; al desmontar, el reloj se para.
  useEffect(() => { parar(); setIndice(null); }, [g]);
  useEffect(() => parar, []);

  const dir = g.direccion, color = colorLinea(dir);
  // Lo que no cambia al mover la cruz, una vez por pestaña, tamaño, letra e idioma.
  const fondo = useMemo(() => {
    if (!coords.length) return null;
    const yDe = (v) => ARRIBA + PH - ((v - g.escala.lo) / (g.escala.hi - g.escala.lo)) * PH;
    // Tramo a tramo: donde falta un día, la línea se corta (no se une con una recta).
    // El área de fondo no se corta; el hueco se une con un trazo de puntos tenue.
    const { linea: trazo, area, puentes } = trazosSvg(coords, tramosSeguidos(g), ARRIBA + PH);
    const yUltimo = coords[coords.length - 1].y;
    // Con muchos puntos (24 h, 1 S, 1 M, 6 M, 2026 y 1 A), algo más fina: a 2 px parecía peluda.
    const densa = g.puntos.length > 120;
    const fechas = fechasQueCaben(g.marcasFechas, coords, PW, letra);
    return (
      <>
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
        {/* Por índice: en 24 h, varias marcas («06:00», «12:00») son del mismo día. */}
        {fechas.map((m) => (
          <Line key={'f' + m.indice} x1={m.x} x2={m.x} y1={ARRIBA} y2={ARRIBA + PH} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        ))}
        {/* El suelo acaba donde el dibujo: no tacha la marca más baja del eje. */}
        <Line x1={0} x2={PW} y1={ARRIBA + PH} y2={ARRIBA + PH} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
        <Path d={area} fill="url(#mkDeg)" />
        <Line x1={0} x2={PW} y1={yDe(g.estadisticas.inicio)} y2={yDe(g.estadisticas.inicio)} stroke={C.tx3} strokeWidth={1} strokeDasharray="2 4" />
        {puentes ? <Path d={puentes} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="2 3" testID="mercado-puente" /> : null}
        <Path d={trazo} fill="none" stroke={color} strokeWidth={densa ? 1.5 : 2} strokeLinejoin="round" strokeLinecap="round" />
        {g.marcasValores.filter((m) => Math.abs(yDe(m.valor) - yUltimo) >= PILDORA - 3).map((m) => (
          <SvgText key={'tv' + m.valor} x={PW + 8} y={yDe(m.valor) + letra / 3} fill={C.tx2} fontSize={letra} fontFamily={F.media}>{m.texto}</SvgText>
        ))}
        {/* El último valor (la cifra grande), en una píldora del color de la línea. */}
        <Rect x={PW + 3} y={yUltimo - PILDORA / 2} width={EJE - 6} height={PILDORA} rx={PILDORA / 2} fill={color} testID="mercado-ultimo" />
        <SvgText x={PW + 3 + (EJE - 6) / 2} y={yUltimo + letra / 3} fill={C.s0} fontSize={letra} fontFamily={F.semi} textAnchor="middle">
          {marcaValor(g.estadisticas.fin, g.estadisticas.fin >= 1e8 ? 1e6 : 1e5, idioma)}
        </SvgText>
        <SvgText x={ancho - 2} y={altoTotal - 9} fill={C.tx3} fontSize={letra - 1} fontFamily={F.media} textAnchor="end">{idioma === 'en' ? '$M' : 'M$'}</SvgText>
        {fechas.map((m) => (
          <SvgText key={'tf' + m.indice} x={m.xt} y={altoTotal - 9} fill={C.tx2} fontSize={letra} fontFamily={F.media} textAnchor={m.ancla}>{m.texto}</SvgText>
        ))}
      </>
    );
  }, [g, coords, color, PW, PH, ARRIBA, letra, EJE, PILDORA, ancho, altoTotal, idioma]);

  const k = indice === null ? null : Math.max(0, Math.min(g.puntos.length - 1, indice));
  // Con la cruz a la vista, el refresco del directo espera (si no, la cruz se iría con la serie nueva).
  if (ocupado) ocupado.current = k !== null;
  const ultimo = g.puntos[g.puntos.length - 1];
  const pk = k === null ? null : g.puntos[k];
  const ck = k === null ? null : coords[k] || null;
  const lect = pasoLector(g);
  // Hasta medirla, lo que ocupa «12 nov, 16:05 · 42.947 M$ · +82,0 %» con su aire; nunca más ancha que el gráfico.
  // Para colocarla, nunca menos que lo que ocupa el texto más largo (como antes, 244 px por la letra): al pasar de «9» a «10» el
  // texto crece antes de volver a medirlo y, con solo lo medido, la burbuja se salía hasta 8 px por la derecha un fotograma.
  const wB = Math.min(ancho, Math.max(anchoBurbuja, Math.round(244 * Math.max(1, fontScale || 1))));
  const xBurbuja = ck ? Math.max(0, Math.min(Math.max(0, ancho - wB), ck.x - wB / 2)) : 0;
  const lector = (paso) => {
    const actual = k === null ? g.puntos.length - 1 : k;
    setIndice(Math.max(0, Math.min(g.puntos.length - 1, actual + paso * lect.paso)));
  };
  return (
    <View onLayout={(ev) => setAncho(Math.round(ev.nativeEvent.layout.width))} style={{ height: altoTotal }}
      accessible accessibilityRole="adjustable" noTraducir idiomaOriginal={idioma === 'en' ? 'en-US' : 'es-ES'}
      accessibilityLabel={`${idioma === 'en' ? 'Market chart' : 'Gráfico del mercado'}. ${g.etiqueta}`}
      accessibilityHint={idioma === 'en' ? `Swipe up or down to move forward or back ${lect.en}.` : `Desliza arriba o abajo para avanzar o retroceder ${lect.es}.`}
      accessibilityValue={{ text: `${cuandoLargo(pk || ultimo, g, idioma)}: ${millonesHablados((pk || ultimo).valor, idioma)}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(ev) => lector(ev.nativeEvent.actionName === 'increment' ? 1 : -1)}
      {...responder.panHandlers} testID="mercado-grafico">
      {ancho > 120 ? (
        <Svg width={ancho} height={altoTotal} accessible={false} importantForAccessibility="no-hide-descendants">
          {fondo}
          {/* La cruz: solo la raya vertical (dos rayas discontinuas se confundían con la línea de partida) y el punto. */}
          {ck ? (
            <>
              <Line x1={ck.x} x2={ck.x} y1={ARRIBA - 10} y2={ARRIBA + PH} stroke="rgba(247,245,240,0.45)" strokeWidth={1} />
              <Circle cx={ck.x} cy={ck.y} r={5} fill={color} stroke={C.s0} strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      ) : null}
      {/* En una línea, en la franja de arriba: cuándo (hora de España en 24 h, 1 S y 1 M) · valor · cambio desde el principio del periodo. */}
      {ck ? (
        <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
          onLayout={(ev) => { const w = Math.ceil(ev.nativeEvent.layout.width); setAnchoBurbuja((a) => (a === w ? a : w)); }}
          style={[e.burbuja, { maxWidth: ancho, transform: [{ translateX: xBurbuja }] }]}>
          <Text noTraducir style={e.burbujaFecha}>{cuandoCorto(pk, g, idioma)}</Text>
          <Text noTraducir style={e.burbujaValor}>{millones(pk.valor, idioma)}</Text>
          <Text noTraducir style={e.burbujaCambio}>{porcentaje(cambioPct(pk.valor, g.estadisticas.inicio), idioma)}</Text>
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

/* La fuente: CoinGecko, hasta cuándo llega la serie y, en la pantalla, de
   cuándo es el total de la categoría («hoy, …» solo si es de hoy). Los mismos
   textos que la web. Con las series finas, también la hora (de España, y se
   dice; el total de la categoría también va en hora de España) de su último punto. */
function Fuente({ vivo, serie, idioma, onAbrirEnlace, conTotal = true }) {
  const en = idioma === 'en';
  // Qué categoría de CoinGecko: «Tokenized Assets» (tokenized-products), no «Real World Assets (RWA)».
  const partes = [textoCategoria(idioma)];
  const fin = serie ? cifraGrande(serie, null) : null;
  const ms = fin && fin.t ? msMinuto(fin.t) : null;
  if (serie && ms !== null) partes.push(`${en ? 'series to' : 'serie hasta el'} ${cuandoMedio({ ms }, idioma)} ${en ? '(Spain time)' : '(hora de España)'}`);
  else if (serie) partes.push(`${en ? 'daily series to' : 'serie diaria hasta el'} ${fechaCorta(serie.puntos[serie.puntos.length - 1].fecha, idioma)}`);
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

/* ¿Van las 7 pestañas en dos filas (4 y 3)? Cada una necesita lo que ocupa
   «2026» (unos 2,5 em de su letra de 15 px, que crece con la del sistema)
   y 4 px de aire. Con la letra normal caben en una fila desde 360 px; con la
   letra grande no: «24 h» y «3 M» se partían en dos líneas y «2026» pisaba
   «1 A» (captura con la letra al 200 %, 13/11/2026). */
function pestanasEnDosFilas(ancho, fontScale = 1, n = PESTANAS.length) {
  const fs = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  return ancho > 0 && ancho / n - 2 < 2.5 * 15 * fs + 4;
}

/* ---- La pantalla «Mercado y noticias» ---- */
export function MercadoPantalla({ onAbrirEnlace, cargarVivo, cargarLaSerie, children = null }) {
  const idioma = useIdioma();
  const en = idioma === 'en';
  const cruzVisible = useRef(false);
  const { fase, vivo, serie, origen, motivo, reintentar } = useMercado({ cargarVivo, cargarLaSerie, ocupado: cruzVisible });
  // El directo encendido que no se puede usar: el gráfico es la copia publicada y se dice ('' si va bien o está apagado).
  const avisoDelDirecto = serie && origen && origen !== 'directo' ? avisoDirecto(motivo, serie, idioma) : '';
  const [pestana, setPestana] = useState(PESTANA_INICIAL);
  const [como, setComo] = useState(false);
  // Por tipo de activo, plegado (en el móvil, las noticias quedan más arriba).
  const [tiposAbiertos, setTiposAbiertos] = useState(false);
  const { width: anchoVentana, fontScale } = useWindowDimensions();
  const [anchoPestanas, setAnchoPestanas] = useState(0);
  const dosFilas = pestanasEnDosFilas(anchoPestanas || anchoVentana - 2 * UI.margen, fontScale);
  const vieja = atrasada(vivo, serie);
  // Cada pestaña con la serie más fina que la cubre; «24 h» solo con una serie fina.
  const disponible = (clave) => !!(serie && pestanaDisponible(serie, clave));
  const elegida = serie && !disponible(pestana) ? (PESTANAS.find((p) => disponible(p.clave))?.clave || pestana) : pestana;
  // Una vez por serie, pestaña e idioma: si no, cualquier otro cambio de la pantalla (abrir «Cómo se
  // calcula») daría un «g» nuevo, el gráfico volvería a calcular su dibujo y la cruz se iría.
  const g = useMemo(() => (serie ? graficoPestana(serie, elegida, idioma) : null), [serie, elegida, idioma]);
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
  // «Cambio en 24 h»: con una serie fina, el de la pestaña 24 h (cambio24h); si en ella queda algún token fuera, se dice cuántos suma.
  const c24 = cambio24h(serie, vivo);
  const d24 = direccion(c24.cambio);
  const fuera24 = c24.resolucion ? seriePestana(serie, '1d')?.fuera?.length || 0 : 0;
  const alcance24 = c24.fuente !== 'serie' ? (c24.fuente === 'coingecko' ? (en ? 'whole category' : 'toda la categoría') : null)
    : fuera24 ? (en ? `${serie.incluidos - fuera24} of the ${serie.incluidos} largest` : `${serie.incluidos - fuera24} de los ${serie.incluidos} mayores`)
      : (en ? `${serie.incluidos} largest` : `${serie.incluidos} mayores`);
  // «Valor hoy»: con las finas, del día y la hora (de España) de su último punto.
  const cuandoHoy = cifraHoy?.t ? cuandoMedio({ ms: msMinuto(cifraHoy.t), fecha: cifraHoy.fecha }, idioma) : fechaCorta(cifraHoy?.fecha, idioma);
  const mayor = vivo?.tipos?.[0];
  const total = lineaTotalCategoria(serie, vivo, idioma);
  const palabra = g ? (g.direccion === 'sube' ? (en ? 'up' : 'sube') : g.direccion === 'baja' ? (en ? 'down' : 'baja') : (en ? 'unchanged' : 'sin cambios')) : '';
  // Los avisos del periodo, para el lector (con mayúscula y punto): tokens que entran y, en una fina, tokens que quedan fuera.
  const avisos = g ? [g.avisoTokens, g.avisoFuera].filter(Boolean).map((a) => `. ${mayuscula(a)}`).join('') : '';
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
          <View accessible noTraducir accessibilityLabel={`${subtituloCifra(serie, idioma)}: ${millonesHablados(hoy, idioma)}${g ? `, ${palabra} ${g.cambioTexto} ${g.cambioFrase}${avisos}` : ''}`}>
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
          {/* En una pestaña fina con tokens sin datos, su línea acaba por debajo de la cifra grande: se dice cuánto y por qué. */}
          {g && g.avisoFuera ? <Text noTraducir style={[e.aviso, e.avisoTokens]} testID="mercado-aviso-fuera">{mayuscula(g.avisoFuera) + '.'}</Text> : null}
          {avisoDelDirecto ? <Text noTraducir style={[e.aviso, e.avisoTokens]} testID="mercado-aviso-directo">{avisoDelDirecto}</Text> : null}
          {/* Una pestaña fina con la serie fina de más de 26 horas antes del dato de hoy: hasta cuándo llega
              (se hace una vez al día y la web se publica a mano; sin esto, «24 h» seguía en el día de la publicación). */}
          {!vieja && g && g.resolucion !== '1d' && vivo && finaAtrasada(serie, vivo.actualizado) ? (
            <Text noTraducir style={e.aviso} testID="mercado-fina-vieja">{`${en ? 'The 5-minute and hourly data end on ' : 'Los datos cada 5 minutos y cada hora llegan hasta el '}${cuandoHoy}${en ? ' (Spain time).' : ' (hora de España).'}`}</Text>
          ) : null}
          {vieja ? <Text noTraducir style={e.aviso} testID="mercado-serie-vieja">{`${en ? 'The series ends on ' : 'La serie llega hasta el '}${fechaFinSerie(serie, idioma)}${en ? ': the large figure and the chart are from that day.' : ': la cifra grande y el gráfico son de ese día.'}`}</Text> : null}
          {/* El total de la categoría va bajo el gráfico, tras la nota (aquí empujaba el gráfico fuera de la primera pantalla). */}
          {!serie && vivo ? <Text noTraducir style={e.aviso}>{`${en ? "Without the daily series, the figure is CoinGecko's category total (" : 'Sin la serie diaria, la cifra es el total de la categoría en CoinGecko ('}${cuandoDato(vivo, idioma)}).`}</Text> : null}
        </View>
      ) : null}
      {hoy !== null ? (
        <View style={[e.pestanas, dosFilas && e.pestanasDosFilas]} accessibilityRole="tablist"
          onLayout={(ev) => { const w = Math.round(ev.nativeEvent.layout.width); setAnchoPestanas((a) => (a === w ? a : w)); }}>
          {PESTANAS.map((p) => {
            const sel = p.clave === elegida, ok = disponible(p.clave);
            // Lo que se ve y su nombre accesible (que lo contiene): «2026» y «En 2026»; en inglés, «YTD».
            const et = etiquetaPestana(p.clave, idioma, serie);
            return (
              <Pressable key={p.clave} disabled={!ok} onPress={() => { tacto.eleccion(); setPestana(p.clave); }}
                style={({ pressed }) => [e.pestana, dosFilas && e.pestanaDosFilas, sel && e.pestanaSel, !ok && e.pestanaNo, pressed && !sel && e.pestanaPulsada]}
                accessibilityRole="tab" accessibilityState={{ selected: sel, disabled: !ok }} noTraducir accessibilityLabel={et.nombre}
                testID={'pestana-' + p.clave}>
                <Text noTraducir numberOfLines={1} style={[e.pestanaTxt, sel && e.pestanaTxtSel]}>{et.corto}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {g ? (
        <View style={e.grafico}>
          <GraficoBolsa g={g} idioma={idioma} ocupado={cruzVisible} />
          {/* Una línea corta a la vista; el resto, en «Cómo se calcula». */}
          {/* Con la misma coletilla que el subtítulo y, en gris, el total de la categoría con su hora. */}
          <Text noTraducir style={e.nota} testID="mercado-nota">
            {notaCorta(serie, idioma)}
            {total ? <Text noTraducir style={e.totalCat} testID="mercado-total-categoria">{' ' + total}</Text> : null}
          </Text>
          <Pressable onPress={() => { tacto.eleccion(); setComo((v) => !v); }} style={({ pressed }) => [e.como, pressed && pulsado('b3')]}
            accessibilityRole="button" accessibilityState={{ expanded: como }} noTraducir accessibilityLabel={en ? 'How it is calculated' : 'Cómo se calcula'}
            testID="mercado-como">
            <Text noTraducir style={e.comoTxt}>{`${en ? 'How it is calculated' : 'Cómo se calcula'} ${como ? '▴' : '▾'}`}</Text>
          </Pressable>
          {como ? <Text noTraducir style={e.nota}>{notaSerie(serie, idioma, elegida)}</Text> : null}
        </View>
      ) : hoy !== null && fase !== 'cargando' ? (
        <Text noTraducir style={e.estado}>{en ? "The chart isn't available right now. The figure is." : 'El gráfico no está disponible ahora. La cifra sí.'}</Text>
      ) : null}
      {hoy !== null ? (
        <View style={e.clave}>
          {/* Dos cifras distintas, cada una con su nombre: la de la serie (la cifra grande) y la de toda la categoría. */}
          {/* «hoy» solo si el dato es de hoy en España y no de una foto guardada; si no, el rótulo lleva el día (rotuloDato). */}
          {serie && cifraHoy.fuente === 'serie' ? clave(rotuloDato('valor', cifraHoy, { idioma, incluidos: serie.incluidos }), millones(hoy, idioma), cuandoHoy) : null}
          {clave(rotuloDato('total', vivo, { idioma }), vivo ? millones(vivo.total.valor, idioma) : '—', vivo ? (en ? 'all tokens · CoinGecko' : 'todos los tokens · CoinGecko') : null)}
          {/* 24 h: con una serie fina, el de la pestaña 24 h; si no, el de la diaria si sus dos últimos días son seguidos;
              si no, el de CoinGecko si es creíble; si no, «—». */}
          {clave(en ? '24 h change' : 'Cambio en 24 h', d24 === 'sin-datos' ? '—' : `${FLECHA[d24]} ${porcentaje(c24.cambio, idioma)}`,
            alcance24, d24 === 'sin-datos' ? null : colorTexto(d24))}
          {/* En las pestañas finas, con la hora (de España) del máximo y del mínimo. */}
          {g ? clave(en ? 'Period high' : 'Máximo del periodo', millones(g.estadisticas.max.valor, idioma), cuandoMedio(g.estadisticas.max, idioma)) : null}
          {g ? clave(en ? 'Period low' : 'Mínimo del periodo', millones(g.estadisticas.min.valor, idioma), cuandoMedio(g.estadisticas.min, idioma)) : null}
          {/* La misma cuota y con el mismo redondeo que la nota del gráfico. */}
          {serie ? clave(en ? 'Tokens in the chart' : 'Tokens en el gráfico', String(serie.incluidos), `${coberturaTexto(serie, idioma)} ${en ? 'of the total' : 'del total'}`) : null}
          {mayor ? clave(en ? 'Largest asset type' : 'El tipo que más pesa', en ? TIPOS_EN[mayor.nombre] || mayor.nombre : mayor.nombre, `${cuota(mayor.cuota, idioma)} ${en ? 'of the total' : 'del total'}`, null, true) : null}
        </View>
      ) : null}
      {hoy !== null ? <Fuente vivo={vivo} serie={serie} idioma={idioma} onAbrirEnlace={onAbrirEnlace} /> : null}

      {vivo?.tipos?.length ? (
        <View style={e.tipos}>
          <Text noTraducir style={e.h2} accessibilityRole="header">{en ? 'By asset type' : 'Por tipo de activo'}</Text>
          <Text noTraducir style={e.h2Sub}>{rotuloDato('tipos', vivo, { idioma })}</Text>
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
            // Sin cambio, se dice con palabras: un «—» suelto no se entendía.
            const cifra24 = dir === 'sin-datos' ? (en ? 'No 24 h data' : 'Sin dato en 24 h') : `${FLECHA[dir]} ${porcentaje(t.cambio24h, idioma)}`;
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
  const { fase, vivo, serie, origen, motivo, reintentar } = useMercado({ cargarVivo, cargarLaSerie });
  // La misma cifra que el final del minigráfico: el último punto de la serie.
  const hoy = valorHoy(vivo, serie);
  // Sin el directo (encendido y fallando): «copia de las 16:05» si es de hoy; si no, «copia del 14/11, 15:00» (rotuloDato).
  const cifraHoy = cifraGrande(serie, vivo);
  const copia = serie && origen && origen !== 'directo' && avisoDirecto(motivo, serie, idioma)
    ? rotuloDato('copia', cifraHoy, { idioma }) : '';
  const vieja = atrasada(vivo, serie);
  // El minigráfico del mes: con la serie horaria si la hay (721 puntos; se pinta simplificado, sin perder máximos ni mínimos).
  const g = useMemo(() => (serie ? graficoPestana(serie, '1m', idioma) : null), [serie, idioma]);
  // Con la letra del sistema grande, el minigráfico baja a su propia fila: en una sola, «Activos tokenizados» se partía a media palabra.
  const { fontScale: escalaLetra } = useWindowDimensions();
  const apilada = escalaLetra > 1.1;
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
      <Pressable onPress={() => { tacto.abrir(); onAbrir?.(); }} style={({ pressed }) => [e.ct, apilada && e.ctApilada, pressed && e.ctPulsada]}
        accessibilityRole="button" noTraducir
        accessibilityLabel={`${en ? 'Tokenised asset market' : 'Mercado de activos tokenizados'}, ${serie ? (en ? `sum of the ${serie.incluidos} largest tokens` : `suma de los ${serie.incluidos} mayores tokens`) : (en ? 'category total' : 'total de la categoría')}: ${millonesHablados(hoy, idioma)}${g ? `, ${palabra} ${g.cambioTexto} ${g.cambioFrase}${g.avisoTokens ? `; ${g.avisoTokens}` : ''}${g.avisoFuera ? `; ${g.avisoFuera}` : ''}` : ''}${vieja ? `; ${en ? 'series to ' : 'serie hasta el '}${fechaFinSerie(serie, idioma)}` : ''}. ${en ? 'See the chart' : 'Ver el gráfico'}`}
        testID="mercado-cotizacion">
        <View style={e.ctIzq}>
          <Text noTraducir style={e.ctNom}>{en ? 'Tokenised assets' : 'Activos tokenizados'}</Text>
          <Text noTraducir style={e.ctSub}>{serie ? (en ? `${serie.incluidos} largest · CoinGecko` : `Los ${serie.incluidos} mayores · CoinGecko`) : (en ? 'Whole category · CoinGecko' : 'Toda la categoría · CoinGecko')}</Text>
        </View>
        {g && !apilada ? <Minigrafico g={g} /> : null}
        <View style={e.ctDer}>
          <Text noTraducir style={e.ctCifra} numberOfLines={1}>{millones(hoy, idioma)}</Text>
          {g ? <Cambio g={g} /> : null}
          {g ? <Text noTraducir style={e.ctPeriodo}>{g.periodoTexto}</Text> : null}
          {vieja ? <Text noTraducir style={e.ctPeriodo}>{`${en ? 'series to ' : 'serie hasta el '}${fechaFinSerie(serie, idioma)}`}</Text> : null}
          {!vieja && copia ? <Text noTraducir style={e.ctPeriodo} testID="mercado-cotizacion-copia">{copia}</Text> : null}
        </View>
        {g && apilada ? <View style={e.ctMiniFila}><Minigrafico g={g} /></View> : null}
      </Pressable>
      {/* El % del mes es del tamaño del mercado, no una rentabilidad: también aquí. */}
      {g ? <Text noTraducir style={[e.explica, e.ctExplica]}>{explicacionCambio(idioma)}</Text> : null}
      {/* Con la serie horaria del mes, si queda algún token fuera, el minigráfico acaba por debajo de la cifra: se dice. */}
      {g && g.avisoFuera ? <Text noTraducir style={e.aviso} testID="mercado-cotizacion-fuera">{mayuscula(g.avisoFuera) + '.'}</Text> : null}
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
  totalCat: { color: C.tx3 },
  pestanas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  // Con la letra grande, en dos filas de 4 y 3 (pestanasEnDosFilas).
  pestanasDosFilas: { flexWrap: 'wrap', rowGap: 4 },
  pestana: { flex: 1, minHeight: 40, minWidth: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 },
  pestanaDosFilas: { flexGrow: 1, flexShrink: 0, flexBasis: '24%', paddingHorizontal: 4 },
  pestanaSel: { backgroundColor: C.s3 },
  pestanaNo: { opacity: 0.45 },
  pestanaPulsada: { backgroundColor: C.ton },
  pestanaTxt: { fontFamily: F.media, fontSize: 15, lineHeight: 19, color: C.tx2 },
  pestanaTxtSel: { fontFamily: F.negrita, color: C.tx },
  grafico: { marginTop: 8 },
  // En una línea, en la franja de arriba del gráfico (no tapa la línea). Mide lo que su texto
  // (GraficoBolsa la coloca con ese ancho); con la letra muy grande, parte la línea antes que salirse.
  burbuja: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'center',
    columnGap: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.p, backgroundColor: C.s3 },
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
  // En la misma letra que la cabecera: en Mono, «−0,1 %» se leía espaciado.
  claveValor: { fontFamily: F.semi, fontVariant: ['tabular-nums'], fontSize: 16, lineHeight: 21, color: C.tx },
  claveValorTexto: { fontFamily: F.semi },
  claveExtra: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.tx3 },
  fuente: { minHeight: 44, justifyContent: 'center', marginTop: 8, marginLeft: -8, paddingHorizontal: 8, borderRadius: R.m, alignSelf: 'flex-start' },
  fuenteTxt: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  fuenteEnlace: { fontFamily: F.media, color: C.senal, textDecorationLine: 'underline' },
  h2: { fontFamily: F.negrita, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: C.tx },
  // El botón «Ver los 8 tipos» ya trae su aire (44 px de alto): sin más margen debajo del subtítulo.
  h2Sub: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx3, marginTop: 4, marginBottom: 4 },
  tipos: { marginTop: 28 },
  tipo: { marginBottom: 12, gap: 4 },
  tipoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  tipoNom: { flexShrink: 1, fontFamily: F.media, fontSize: 15, lineHeight: 20, color: C.tx },
  // Las cifras, alineadas a la derecha como en una tabla financiera.
  tipoValor: { fontFamily: F.semi, fontVariant: ['tabular-nums'], fontSize: 14, lineHeight: 20, color: C.tx, textAlign: 'right' },
  avance: { fontFamily: F.regular, fontSize: 13, color: C.tx3 },
  barra: { height: 6, borderRadius: R.p, backgroundColor: C.ton, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: R.p },
  tipoPie: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  // Con los tipos plegados quedaba un hueco de unos 100 px bajo «Ver los 8 tipos» (revisión del 11/11/2026).
  noticias: { marginTop: 16, paddingTop: 24, borderTopWidth: 1, borderTopColor: C.bd },
  ct: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  ctPulsada: { backgroundColor: C.s2 },
  ctApilada: { flexWrap: 'wrap', rowGap: 12 },
  ctMiniFila: { width: '100%' },
  ctIzq: { flex: 1, minWidth: 0, gap: 2 },
  ctNom: { fontFamily: F.negrita, fontSize: 17, lineHeight: 21, color: C.tx },
  ctSub: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: C.tx3 },
  ctDer: { alignItems: 'flex-end', gap: 1 },
  ctCifra: { ...T.instrumento, fontSize: 17, lineHeight: 22, color: C.tx },
  ctPeriodo: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.tx3 },
  ctExplica: { marginTop: 10 },
});

export const _pruebas = { valorHoy, colorLinea, colorTexto, atrasada, CRUZ_FIJA_MS, UI, cuandoCorto, cuandoLargo, cuandoMedio, pasoLector, medidasGrafico,
  lineasBurbuja, fechasQueCaben, anchoTexto, pestanasEnDosFilas };
