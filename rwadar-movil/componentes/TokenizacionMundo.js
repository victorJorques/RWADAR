import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { cargarTokenizacion } from '../lib/tokenizacion-remota';
import { FUENTE, alturasLinea, cuota, direccion, fechaBreve, fechaCorta, fechaLlegada, horaDato, millones, millonesHablados, porcentaje,
  textosLinea } from '../lib/tokenizacion';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «La tokenización en el mundo» en Inicio (10/11/2026), como la web
   ---------------------------------------------------------------------
   Lee /api/tokenizacion de rwadar.pages.dev (nuestro servidor lee
   CoinGecko). Cifra grande del total, una cápsula por periodo (24 h · 7 días
   · 30 días · 1 año · Histórico) con flecha, signo y palabra —el color nunca
   va solo— y la fecha de la foto con la que se compara, una barra por tipo
   con su cuota y su cambio en 24 h y la línea de evolución con las fotos
   diarias guardadas (con dos o más), con su escala escrita debajo. Los
   periodos sin fotos reales dicen cuándo llegarán («disponible el 15/11») o
   «aún sin datos». Si la red falla, la sección lo
   dice y ofrece reintentar; el resto de Inicio no se entera. La atribución
   «Datos: CoinGecko» se ve siempre. El inglés va en lib/idioma-en.js.
   --------------------------------------------------------------------- */
const FLECHA = { sube: '▲', baja: '▼', igual: '=' };
const PALABRA = { sube: 'sube', baja: 'baja', igual: 'sin cambios' };

function colorDe(dir) { return dir === 'sube' ? C.senal : dir === 'baja' ? C.alarma : C.tx2; }

/* La línea de evolución, medida al ancho real de la caja. La escala abarca
   como poco un 4 % del valor y no se rellena hasta el suelo (el suelo no es
   cero): un cambio pequeño se ve pequeño. Debajo, la escala en cifras. */
function Linea({ serie, idioma }) {
  const [ancho, setAncho] = useState(0);
  const alto = 112, m = 8;
  if (serie.length < 2) {
    return <Text style={e.nota}>La línea de evolución aparecerá cuando haya dos fotos diarias guardadas.</Text>;
  }
  const t = serie.map((p) => Date.parse(p.fecha + 'T00:00:00Z'));
  const t0 = t[0], t1 = t[t.length - 1];
  const x = (i) => m + (t1 > t0 ? (t[i] - t0) / (t1 - t0) : 0) * (ancho - 2 * m);
  const alturas = alturasLinea(serie.map((p) => p.valor), alto, m);
  const puntos = serie.map((_, i) => `${x(i).toFixed(1)},${alturas[i].toFixed(1)}`);
  const ini = fechaCorta(serie[0].fecha, idioma), fin = fechaCorta(serie[serie.length - 1].fecha, idioma);
  const textos = textosLinea(serie, idioma);
  return (
    <View onLayout={(ev) => setAncho(Math.round(ev.nativeEvent.layout.width))} accessible accessibilityRole="image"
      noTraducir idiomaOriginal={idioma === 'en' ? 'en-US' : 'es-ES'} accessibilityLabel={textos.etiqueta}>
      {ancho > 40 ? (
        <Svg width={ancho} height={alto}>
          <Polyline points={puntos.join(' ')} fill="none" stroke={C.senal} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(serie.length - 1)} cy={alturas[serie.length - 1]} r={4} fill={C.senal} stroke={C.s0} strokeWidth={2} />
        </Svg>
      ) : <View style={{ height: alto }} />}
      <View style={e.eje}>
        <Text noTraducir style={e.ejeTxt}>{ini}</Text>
        <Text noTraducir style={e.ejeTxt}>{fin}</Text>
      </View>
      <Text noTraducir style={e.lineaNota}>{textos.nota}</Text>
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
  const breve = (fecha) => fechaBreve(fecha, idioma, d?.fecha || null);
  const hoyUTC = new Date().toISOString().slice(0, 10);
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
            <Text style={e.aviso}>{'CoinGecko no responde ahora. Enseñamos la última foto guardada, del'} <Text noTraducir style={e.avisoFecha}>{horaDato(d.actualizado, idioma)}</Text></Text>
          ) : null}
          <View accessible {...a11y} accessibilityLabel={`${traducir('Valor total de los activos tokenizados')}: ${millonesHablados(d.total.valor, idioma)}`}>
            <Text noTraducir style={e.cifra} numberOfLines={1} adjustsFontSizeToFit>
              {cifraTotal}{unidad ? <Text style={e.unidad}>{' ' + unidad}</Text> : null}
            </Text>
            <Text style={e.cifraEtq}>Valor total de los activos tokenizados, en millones de dólares (M$)</Text>
          </View>

          <View style={e.periodos}>
            {d.periodos.map((p) => {
              const dir = p.estado === 'ok' ? direccion(p.cambio) : 'sin-datos';
              const color = colorDe(dir);
              // Sin foto: cuándo llegará. Con ella: con qué foto se compara (±2 días).
              const llega = dir === 'sin-datos' ? fechaLlegada(d.guardadoDesde, p.clave, d.fecha) : null;
              const fotoDel = dir !== 'sin-datos' && !p.desde && p.clave === '24h' && d.fuente === 'foto-guardada' && d.fecha !== hoyUTC ? d.fecha : null;
              const pie = p.desde ? ['desde', p.desde] : fotoDel ? ['foto del', fotoDel] : null;
              const texto = [dir === 'sin-datos' ? (llega ? `${traducir('disponible el')} ${fechaCorta(llega, idioma)}` : traducir('aún sin datos'))
                : `${traducir(PALABRA[dir])} ${porcentaje(p.cambio, idioma)}`,
              pie ? `${traducir(pie[0])} ${fechaCorta(pie[1], idioma)}` : null].filter(Boolean).join(', ');
              return (
                <View key={p.clave} style={[e.periodo, dir === 'sube' && e.periodoSube, dir === 'baja' && e.periodoBaja]}
                  accessible {...a11y} accessibilityLabel={`${traducir(p.nombre)}: ${texto}`}>
                  <Text style={e.periodoNom} numberOfLines={1}>{p.nombre}</Text>
                  <Text noTraducir style={[e.periodoCifra, { color: dir === 'sin-datos' ? C.tx3 : color }]} numberOfLines={1} adjustsFontSizeToFit>
                    {dir === 'sin-datos' ? '—' : porcentaje(p.cambio, idioma)}
                  </Text>
                  {dir === 'sin-datos'
                    ? (llega
                      ? <Text style={e.periodoNota} numberOfLines={3}>{'disponible el'} <Text noTraducir>{breve(llega)}</Text></Text>
                      : <Text style={e.periodoNota} numberOfLines={2}>aún sin datos</Text>)
                    : <Text noTraducir style={[e.periodoNota, { color }]} numberOfLines={1}>{FLECHA[dir]} {traducir(PALABRA[dir])}</Text>}
                  {pie ? <Text style={e.periodoDesde} numberOfLines={3}>{pie[0]} <Text noTraducir>{breve(pie[1])}</Text></Text> : null}
                </View>
              );
            })}
          </View>
          {conDatosPendientes ? (
            <Text style={e.nota}>{'Los periodos sin datos se rellenarán solos con las fotos diarias que guarda RWAdar desde el'} <Text noTraducir style={e.notaFecha}>{fechaCorta(d.guardadoDesde || d.fecha, idioma)}</Text></Text>
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
        accessibilityRole="link" {...a11y} accessibilityLabel={`${traducir('Datos:')} CoinGecko${d ? ` · ${traducir(d.fuente === 'coingecko' ? 'Dato del' : 'Foto guardada del')} ${horaDato(d.actualizado, idioma)}` : ''}`}>
        <Text style={e.fuenteTxt}>
          {'Datos:'} <Text noTraducir style={e.fuenteEnlace}>CoinGecko</Text>
          {d ? <Text style={e.fuenteTxt}>{' · '}{d.fuente === 'coingecko' ? 'Dato del' : 'Foto guardada del'} <Text noTraducir>{horaDato(d.actualizado, idioma)}</Text></Text> : null}
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
  // Sin fuente monoespaciada: el punto de los miles no parece un hueco.
  cifra: { fontFamily: F.semi, fontVariant: ['tabular-nums'], letterSpacing: -0.8, marginTop: 16, fontSize: 40, lineHeight: 46, color: C.tx },
  unidad: { fontFamily: F.media, fontSize: 20, color: C.tx2 },
  cifraEtq: { fontFamily: F.media, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 2 },
  periodos: { flexDirection: 'row', gap: 6, marginTop: 16 },
  periodo: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2, borderRadius: R.m, backgroundColor: C.ton, gap: 3 },
  periodoSube: { backgroundColor: C.senalT },
  periodoBaja: { backgroundColor: C.alarmaT },
  periodoNom: { fontFamily: F.media, fontSize: 12, lineHeight: 15, color: C.tx2 },
  periodoCifra: { ...T.instrumento, fontSize: 14, lineHeight: 18, color: C.tx },
  periodoNota: { fontFamily: F.media, fontSize: 11, lineHeight: 14, color: C.tx3, textAlign: 'center' },
  periodoDesde: { fontFamily: F.regular, fontSize: 11, lineHeight: 14, color: C.tx3, textAlign: 'center' },
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
  lineaNota: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx2, marginTop: 8 },
  fuente: { minHeight: 44, justifyContent: 'center', marginTop: 12, marginLeft: -8, paddingHorizontal: 8, borderRadius: R.m, alignSelf: 'flex-start' },
  fuenteTxt: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.tx3 },
  fuenteEnlace: { fontFamily: F.media, color: C.senal, textDecorationLine: 'underline' },
});
