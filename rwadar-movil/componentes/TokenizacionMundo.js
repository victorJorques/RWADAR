import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { cargarTokenizacion } from '../lib/tokenizacion-remota';
import { FUENTE, cuota, direccion, fechaCorta, horaDato, millones, porcentaje } from '../lib/tokenizacion';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «La tokenización en el mundo» en Inicio (10/11/2026), como la web
   ---------------------------------------------------------------------
   Lee /api/tokenizacion de rwadar.pages.dev (nuestro servidor lee
   CoinGecko). Cifra grande del total, una cápsula por periodo (24 h · 7 días
   · 30 días · 1 año · Total) con flecha, signo y palabra —el color nunca va
   solo—, una barra por tipo con su cuota y su cambio en 24 h y la línea de
   evolución con las fotos diarias guardadas (con dos o más). Los periodos
   sin fotos reales dicen «aún sin datos». Si la red falla, la sección lo
   dice y ofrece reintentar; el resto de Inicio no se entera. La atribución
   «Datos: CoinGecko» se ve siempre. El inglés va en lib/idioma-en.js.
   --------------------------------------------------------------------- */
const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
const PALABRA = { sube: 'sube', baja: 'baja', igual: 'sin cambios' };

function colorDe(dir) { return dir === 'sube' ? C.senal : dir === 'baja' ? C.alarma : C.tx2; }

/* La línea de evolución, medida al ancho real de la caja. */
function Linea({ serie, idioma }) {
  const [ancho, setAncho] = useState(0);
  const alto = 112, m = 8;
  if (serie.length < 2) {
    return <Text style={e.nota}>La línea de evolución aparecerá cuando haya dos fotos diarias guardadas.</Text>;
  }
  const t = serie.map((p) => Date.parse(p.fecha + 'T00:00:00Z')), v = serie.map((p) => p.valor);
  const t0 = t[0], t1 = t[t.length - 1], min = Math.min(...v), max = Math.max(...v);
  const x = (i) => m + (t1 > t0 ? (t[i] - t0) / (t1 - t0) : 0) * (ancho - 2 * m);
  const y = (i) => alto - m - (max > min ? (v[i] - min) / (max - min) : 0.5) * (alto - 2 * m);
  const puntos = serie.map((_, i) => `${x(i).toFixed(1)},${y(i).toFixed(1)}`);
  const ini = fechaCorta(serie[0].fecha), fin = fechaCorta(serie[serie.length - 1].fecha);
  const v0 = millones(v[0], idioma), v1 = millones(v[v.length - 1], idioma);
  const etiqueta = idioma === 'en'
    ? `Total value from ${ini} to ${fin}: from ${v0} to ${v1}, ${serie.length} daily snapshots`
    : `Valor total del ${ini} al ${fin}: de ${v0} a ${v1}, ${serie.length} fotos diarias`;
  return (
    <View onLayout={(ev) => setAncho(Math.round(ev.nativeEvent.layout.width))} accessible accessibilityRole="image"
      noTraducir idiomaOriginal={idioma === 'en' ? 'en-US' : 'es-ES'} accessibilityLabel={etiqueta}>
      {ancho > 40 ? (
        <Svg width={ancho} height={alto}>
          <Path d={`M${x(0).toFixed(1)},${alto - m} L${puntos.join(' L')} L${x(serie.length - 1).toFixed(1)},${alto - m} Z`} fill={C.senalT} />
          <Polyline points={puntos.join(' ')} fill="none" stroke={C.senal} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(serie.length - 1)} cy={y(serie.length - 1)} r={4} fill={C.senal} stroke={C.s0} strokeWidth={2} />
        </Svg>
      ) : <View style={{ height: alto }} />}
      <View style={e.eje}>
        <Text noTraducir style={e.ejeTxt}>{ini}</Text>
        <Text noTraducir style={e.ejeTxt}>{fin}</Text>
      </View>
    </View>
  );
}

export default function TokenizacionMundo({ onAbrirEnlace, cargar = cargarTokenizacion }) {
  const idioma = useIdioma();
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null });
  const vivo = useRef(true);
  const pedir = useCallback(() => {
    setEstado((s) => ({ fase: 'cargando', datos: s.datos }));
    return Promise.resolve().then(() => cargar())
      .then((datos) => { if (vivo.current) setEstado({ fase: datos.fuente === 'sin-datos' ? 'vacio' : 'listo', datos }); })
      .catch(() => { if (vivo.current) setEstado((s) => ({ fase: s.datos ? 'listo' : 'error', datos: s.datos })); });
  }, [cargar]);
  useEffect(() => { vivo.current = true; pedir(); return () => { vivo.current = false; }; }, [pedir]);

  const d = estado.fase === 'listo' ? estado.datos : null;
  // Etiquetas accesibles ya montadas en el idioma elegido (llevan cifras).
  const a11y = { noTraducir: true, idiomaOriginal: idioma === 'en' ? 'en-US' : 'es-ES' };
  const total = d ? millones(d.total.valor, idioma) : '';
  const [cifraTotal, unidad] = total.split(' ');
  const conDatosPendientes = d && d.periodos.some((p) => p.clave !== '24h' && p.estado !== 'ok');
  return (
    <View style={e.seccion}>
      <Text style={e.ante}>Datos de mercado</Text>
      <Text style={e.titulo} accessibilityRole="header">La tokenización en el mundo</Text>
      <Text style={e.sub}>Valor de mercado de los tokens que representan activos reales (deuda, fondos, materias primas, acciones, inmuebles). Las categorías pueden solaparse. No es una recomendación.</Text>

      {estado.fase === 'cargando' ? <Text style={e.estado}>Cargando los datos de CoinGecko…</Text> : null}
      {estado.fase === 'error' || estado.fase === 'vacio' ? (
        <View style={e.estadoCaja}>
          <Text style={e.estadoTxt}>Ahora no podemos mostrar los datos de CoinGecko. Vuelve a intentarlo más tarde.</Text>
          <Pressable onPress={() => { tacto.eleccion(); pedir(); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
            accessibilityRole="button" accessibilityLabel="Reintentar">
            <Text style={e.b3Txt}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {d ? (
        <View>
          {d.fuente === 'foto-guardada' ? (
            <Text style={e.aviso}>{'CoinGecko no responde ahora. Enseñamos la última foto guardada, del'} <Text noTraducir style={e.avisoFecha}>{horaDato(d.actualizado)}</Text></Text>
          ) : null}
          <View accessible {...a11y} accessibilityLabel={`${traducir('Valor total de los activos tokenizados')}: ${total}`}>
            <Text noTraducir style={e.cifra} numberOfLines={1} adjustsFontSizeToFit>
              {cifraTotal}{unidad ? <Text style={e.unidad}>{' ' + unidad}</Text> : null}
            </Text>
            <Text style={e.cifraEtq}>Valor total de los activos tokenizados</Text>
          </View>

          <View style={e.periodos}>
            {d.periodos.map((p) => {
              const dir = p.estado === 'ok' ? direccion(p.cambio) : 'sin-datos';
              const color = colorDe(dir);
              const texto = dir === 'sin-datos' ? traducir('aún sin datos') : `${traducir(PALABRA[dir])} ${porcentaje(p.cambio, idioma)}`;
              return (
                <View key={p.clave} style={[e.periodo, dir === 'sube' && e.periodoSube, dir === 'baja' && e.periodoBaja]}
                  accessible {...a11y} accessibilityLabel={`${traducir(p.nombre)}: ${texto}`}>
                  <Text style={e.periodoNom} numberOfLines={1}>{p.nombre}</Text>
                  <Text noTraducir style={[e.periodoCifra, { color: dir === 'sin-datos' ? C.tx3 : color }]} numberOfLines={1} adjustsFontSizeToFit>
                    {dir === 'sin-datos' ? '—' : porcentaje(p.cambio, idioma)}
                  </Text>
                  {dir === 'sin-datos'
                    ? <Text style={e.periodoNota} numberOfLines={2}>aún sin datos</Text>
                    : <Text noTraducir style={[e.periodoNota, { color }]} numberOfLines={1}>{FLECHA[dir]} {traducir(PALABRA[dir])}</Text>}
                </View>
              );
            })}
          </View>
          {conDatosPendientes ? (
            <Text style={e.nota}>{'Los periodos sin datos se rellenarán solos con las fotos diarias que guarda RWAdar desde el'} <Text noTraducir style={e.notaFecha}>{fechaCorta(d.guardadoDesde || d.fecha)}</Text></Text>
          ) : null}

          <Text style={e.h3} accessibilityRole="header">Por tipo de activo</Text>
          {d.tipos.map((t) => {
            const dir = direccion(t.cambio24h);
            const cambio = dir === 'sin-datos' ? '—' : `${FLECHA[dir]} ${porcentaje(t.cambio24h, idioma)}`;
            const oro = t.clave === 'materias-primas' && d.oro ? millones(d.oro.valor, idioma) : null;
            const etiqueta = [`${traducir(t.nombre)}: ${millones(t.valor, idioma)}`, `${cuota(t.cuota, idioma)} ${traducir('del total')}`,
              dir === 'sin-datos' ? null : `${traducir(PALABRA[dir])} ${porcentaje(t.cambio24h, idioma)} ${traducir('en 24 h')}`,
              oro ? `${traducir('De ello, oro:')} ${oro}` : null].filter(Boolean).join(', ');
            return (
              <View key={t.clave} style={e.tipo} accessible {...a11y} accessibilityLabel={etiqueta}>
                <View style={e.tipoCab}>
                  <Text style={e.tipoNom}>{t.nombre}</Text>
                  <Text noTraducir style={e.tipoValor}>{millones(t.valor, idioma)}</Text>
                </View>
                <View style={e.barra}>
                  <View style={[e.relleno, { width: `${Math.max(1.5, Math.min(100, t.cuota)).toFixed(2)}%` }]} />
                </View>
                <View style={e.tipoPie}>
                  <Text style={e.tipoPieTxt}><Text noTraducir style={e.tipoCuota}>{cuota(t.cuota, idioma)}</Text> {'del total'}</Text>
                  <Text style={e.tipoPieTxt}><Text noTraducir style={[e.tipoCambio, { color: colorDe(dir) }]}>{cambio}</Text> {'en 24 h'}</Text>
                </View>
                {oro ? <Text style={e.tipoPieTxt}>{'De ello, oro:'} <Text noTraducir style={e.tipoCuota}>{oro}</Text></Text> : null}
              </View>
            );
          })}

          <Text style={e.h3} accessibilityRole="header">Evolución del valor total</Text>
          <View style={e.lineaCaja}><Linea serie={d.serie} idioma={idioma} /></View>
        </View>
      ) : null}

      <Pressable onPress={() => { tacto.abrir(); onAbrirEnlace?.(FUENTE.url); }} style={({ pressed }) => [e.fuente, pressed && pulsado('b3')]}
        accessibilityRole="link" {...a11y} accessibilityLabel={`${traducir('Datos:')} CoinGecko${d ? ` · ${traducir(d.fuente === 'coingecko' ? 'Dato del' : 'Foto guardada del')} ${horaDato(d.actualizado)}` : ''}`}>
        <Text style={e.fuenteTxt}>
          {'Datos:'} <Text noTraducir style={e.fuenteEnlace}>CoinGecko</Text>
          {d ? <Text style={e.fuenteTxt}>{' · '}{d.fuente === 'coingecko' ? 'Dato del' : 'Foto guardada del'} <Text noTraducir>{horaDato(d.actualizado)}</Text></Text> : null}
        </Text>
      </Pressable>
    </View>
  );
}

const e = StyleSheet.create({
  seccion: { paddingHorizontal: UI.margen, paddingTop: 32, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.bd },
  ante: { ...T.etiqueta, color: C.tx3, marginBottom: 4 },
  titulo: { ...T.seccion, color: C.tx },
  sub: { ...T.menor, color: C.tx2, marginTop: 4 },
  estado: { ...T.menor, color: C.tx2, marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoCaja: { marginTop: 16, padding: 16, borderRadius: R.m, backgroundColor: C.ton },
  estadoTxt: { ...T.menor, color: C.tx2 },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8, marginTop: 4, alignSelf: 'flex-start', justifyContent: 'center' },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  aviso: { ...T.menor, marginTop: 16, padding: 12, borderRadius: R.m, backgroundColor: C.avisoT, color: C.aviso },
  avisoFecha: { fontFamily: F.semi },
  cifra: { ...T.instrumento, marginTop: 16, fontSize: 40, lineHeight: 46, color: C.tx },
  unidad: { fontFamily: F.media, fontSize: 20, color: C.tx2 },
  cifraEtq: { fontFamily: F.media, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 2 },
  periodos: { flexDirection: 'row', gap: 6, marginTop: 16 },
  periodo: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2, borderRadius: R.m, backgroundColor: C.ton, gap: 3 },
  periodoSube: { backgroundColor: C.senalT },
  periodoBaja: { backgroundColor: C.alarmaT },
  periodoNom: { fontFamily: F.media, fontSize: 12, lineHeight: 15, color: C.tx2 },
  periodoCifra: { ...T.instrumento, fontSize: 14, lineHeight: 18, color: C.tx },
  periodoNota: { fontFamily: F.media, fontSize: 11, lineHeight: 14, color: C.tx3, textAlign: 'center' },
  nota: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 10 },
  notaFecha: { fontFamily: F.media, color: C.tx2 },
  h3: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx, marginTop: 24, marginBottom: 12 },
  tipo: { marginBottom: 14 },
  tipoCab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  tipoNom: { flexShrink: 1, fontFamily: F.media, fontSize: 15, lineHeight: 20, color: C.tx },
  tipoValor: { ...T.instrumento, fontSize: 14, lineHeight: 20, color: C.tx },
  barra: { height: 10, marginTop: 6, borderRadius: R.p, backgroundColor: C.ton, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: R.p, backgroundColor: C.tx2 },
  tipoPie: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 5 },
  tipoPieTxt: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  tipoCuota: { ...T.instrumento, fontSize: 13, color: C.tx2 },
  tipoCambio: { ...T.instrumento, fontSize: 13 },
  lineaCaja: { padding: 12, borderRadius: R.m, backgroundColor: C.ton },
  eje: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  ejeTxt: { ...T.instrumento, fontSize: 12, color: C.tx3 },
  fuente: { minHeight: 44, justifyContent: 'center', marginTop: 12, marginLeft: -8, paddingHorizontal: 8, borderRadius: R.m, alignSelf: 'flex-start' },
  fuenteTxt: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  fuenteEnlace: { fontFamily: F.media, color: C.senal, textDecorationLine: 'underline' },
});
