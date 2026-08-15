import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator, FlatList, Linking, Modal, Pressable, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold,
  Geist_700Bold, Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';

import { C, COLOR_CATEGORIA, iniciales, T, E, R, F } from './lib/tema';
import { tacto } from './lib/tacto';
import { cargarRadar, cargarFuera, siguiendo, alternarSeguimiento, novedades } from './lib/datos';
import { registrarParaAvisos } from './lib/avisos';
import Explicador from './componentes/Explicador';
import Radar from './componentes/Radar';
import Marca from './componentes/Marca';

export default function App() {
  const [fuentesListas] = useFonts({
    Geist_400Regular, Geist_500Medium, Geist_600SemiBold,
    Geist_700Bold, Geist_800ExtraBold, GeistMono_500Medium,
  });

  const [pestana, setPestana] = useState('radar');
  const [radar, setRadar] = useState([]);
  const [fuera, setFuera] = useState([]);
  const [sigo, setSigo] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [explicando, setExplicando] = useState(false);

  /* El `finally` no es adorno: si cualquiera de estas llamadas rechazara,
     `cargando` se quedaría en true y la pantalla de "Sintonizando el
     radar…" no se iría nunca. Cada carga ya trae su respaldo desde la
     copia local, así que salir de la pantalla de carga es SIEMPRE lo
     correcto: peor que una lista corta es una app que no arranca. */
  const traer = useCallback(async () => {
    try {
      const [r, f, s] = await Promise.all([cargarRadar(), cargarFuera(), siguiendo()]);
      setRadar(r.datos); setFuera(f.datos); setSigo(s);
      setSinConexion(!!r.deCache);
      setAvisos(await novedades(s));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { traer(); }, [traer]);
  useEffect(() => { registrarParaAvisos(); }, []);

  const refrescar = async () => {
    setRefrescando(true);
    await traer();
    tacto.novedad();
    setRefrescando(false);
  };

  const categorias = useMemo(() => {
    const m = new Map();
    radar.forEach((p) => m.set(p.categoria, (m.get(p.categoria) || 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [radar]);

  /* Lista vacía sin ningún dato NO es "no hay resultados": es que no hubo
     forma de traerlos y todavía no hay copia guardada. Decirle a alguien
     que su búsqueda no encontró nada cuando lo que falla es la red le
     manda a cambiar el filtro en vez de a mirar la cobertura. */
  const nadaQueVer = radar.length === 0
    ? 'No se ha podido traer el radar y todavía no hay copia guardada. Desliza hacia abajo para reintentar cuando tengas cobertura.'
    : 'El radar no detecta nada con esos filtros.';

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return radar.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (!q) return true;
      return [p.nombre, p.nota, p.aval, p.categoria, p.region, p.cadenas]
        .join(' ').toLowerCase().includes(q);
    });
  }, [radar, busqueda, categoria]);

  const seguidas = useMemo(() => radar.filter((p) => sigo.includes(p.slug)), [radar, sigo]);

  const alternar = async (p) => {
    const yaSigo = sigo.includes(p.slug);
    yaSigo ? tacto.soltar() : tacto.seguir();
    setSigo(await alternarSeguimiento(p.slug, p.plataforma_id));
  };

  const abrir = (p) => { tacto.abrir(); setAbierta(p); };
  const filtrar = (c) => { tacto.eleccion(); setCategoria(c); };
  const cambiarPestana = (id) => { tacto.eleccion(); setPestana(id); };

  if (!fuentesListas || cargando) {
    return (
      <SafeAreaProvider>
        <View style={[e.pantalla, e.centro]}>
          <ActivityIndicator size="large" color={C.senal} />
          <Text style={e.cargandoTxt}>Sintonizando el radar…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.noche2} />
      <SafeAreaView style={e.pantalla} edges={['top']}>
        <View style={e.cabecera}>
          <View style={e.marcaFila}>
            <Marca tamano={30} />
            <View>
              <Text style={e.marca}>RWA<Text style={{ color: C.senal }}>dar</Text></Text>
              <Text style={e.marcaSub}>
                {radar.length} plataformas verificadas{sinConexion ? ' · sin conexión' : ''}
              </Text>
            </View>
          </View>
          <View style={e.pestanas}>
            {[['radar', 'Radar'], ['sigo', `Sigo${sigo.length ? ` ${sigo.length}` : ''}`]].map(([id, txt]) => (
              <Pressable key={id} onPress={() => cambiarPestana(id)}
                style={({ pressed }) => [e.pestana, pestana === id && e.pestanaOn, pressed && e.pulsado]}>
                <Text style={[e.pestanaTxt, pestana === id && e.pestanaTxtOn]}>{txt}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {pestana === 'radar' ? (
          <FlatList
            data={visibles}
            keyExtractor={(p) => p.slug}
            contentContainerStyle={e.lista}
            refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
            ListHeaderComponent={
              <View>
                {/* El radar va lo primero, igual que en la web: es el
                    producto, no una ilustración. Sale de la misma lista que
                    las fichas de abajo y cada punto abre la suya. */}
                <Radar
                  datos={radar}
                  categoriaActiva={categoria}
                  onAbrir={(p) => abrir(p)}
                  onFiltrar={(c) => filtrar(c)} />

                <Pressable onPress={() => { tacto.abrir(); setExplicando(true); }}
                  style={({ pressed }) => [e.banner, pressed && e.pulsado]}>
                  <View style={e.bannerMarca}><Text style={e.bannerMarcaTxt}>?</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={e.bannerTit}>¿Qué es tokenizar un activo?</Text>
                    <Text style={e.bannerSub}>Explicado en 30 segundos, paso a paso</Text>
                  </View>
                  <Text style={e.bannerFlecha}>›</Text>
                </Pressable>

                <TextInput
                  style={e.buscador}
                  placeholder="Buscar plataforma o palabra clave…"
                  placeholderTextColor={C.tx2}
                  value={busqueda} onChangeText={setBusqueda}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={e.chips}>
                  <Chip texto={`Todas ${radar.length}`} activo={!categoria} onPress={() => filtrar('')} />
                  {categorias.map(([c, n]) => (
                    <Chip key={c} texto={`${c} ${n}`} color={COLOR_CATEGORIA[c]}
                      activo={categoria === c} onPress={() => filtrar(categoria === c ? '' : c)} />
                  ))}
                </ScrollView>
                <Text style={e.contador}>{visibles.length} de {radar.length} plataformas</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Ficha p={item} sigue={sigo.includes(item.slug)}
                onAbrir={() => abrir(item)} onSeguir={() => alternar(item)} />
            )}
            ListEmptyComponent={<Text style={e.vacio}>{nadaQueVer}</Text>}
            ListFooterComponent={<Descartadas fuera={fuera} />}
          />
        ) : (
          <FlatList
            data={seguidas}
            keyExtractor={(p) => p.slug}
            contentContainerStyle={e.lista}
            refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
            ListHeaderComponent={<Avisos avisos={avisos} />}
            renderItem={({ item }) => (
              <Ficha p={item} sigue onAbrir={() => abrir(item)} onSeguir={() => alternar(item)} />
            )}
            ListEmptyComponent={
              <View style={e.vacioCaja}>
                <Text style={e.vacioTitulo}>Todavía no sigues ninguna</Text>
                <Text style={e.vacio}>
                  Marca una plataforma en el radar y te avisamos si cambia de estado.
                  RealT y Goldfinch se hundieron con gente dentro: enterarse el mismo
                  día es la diferencia.
                </Text>
              </View>
            }
          />
        )}

        <Detalle p={abierta} sigue={abierta && sigo.includes(abierta.slug)}
          onCerrar={() => { tacto.eleccion(); setAbierta(null); }}
          onSeguir={() => abierta && alternar(abierta)} />

        <Modal visible={explicando} animationType="slide" onRequestClose={() => setExplicando(false)}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: C.noche }} edges={['top', 'bottom']}>
              <Explicador onCerrar={() => setExplicando(false)} />
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Chip({ texto, color, activo, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [e.chip, activo && e.chipOn, pressed && e.pulsado]}>
      {color ? <View style={[e.punto, { backgroundColor: color }]} /> : null}
      <Text style={[e.chipTxt, activo && e.chipTxtOn]} numberOfLines={1}>{texto}</Text>
    </Pressable>
  );
}

function Ficha({ p, sigue, onAbrir, onSeguir }) {
  return (
    <View style={e.ficha}>
      <Pressable onPress={onAbrir} style={({ pressed }) => [e.fichaTop, pressed && e.pulsadoSuave]}>
        <View style={[e.mono, { backgroundColor: COLOR_CATEGORIA[p.categoria] || C.sup3 }]}>
          <Text style={e.monoTxt}>{iniciales(p.nombre)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={e.fichaNombre}>{p.nombre}</Text>
          <Text style={e.fichaSub}>{p.actor} · {p.region}</Text>
        </View>
      </Pressable>
      <Text style={e.fichaNota} numberOfLines={3}>{p.nota}</Text>
      <View style={e.etiquetas}>
        <Text style={[e.etiqueta, e.etiquetaAcento]}>{p.acceso}</Text>
        <Text style={e.etiqueta}>Entrada: {(p.ticket || '').toLowerCase()}</Text>
      </View>
      <Pressable onPress={onSeguir} style={({ pressed }) => [e.seguir, sigue && e.seguirOn, pressed && e.pulsado]}>
        <Text style={[e.seguirTxt, sigue && e.seguirTxtOn]}>{sigue ? '✓ Siguiendo' : '+ Seguir'}</Text>
      </Pressable>
    </View>
  );
}

function Avisos({ avisos }) {
  if (!avisos.length) return null;
  return (
    <View style={e.avisos}>
      <Text style={e.avisosTitulo}>NOVEDADES</Text>
      {avisos.map((a) => (
        <View key={a.id} style={e.aviso}>
          <Text style={e.avisoTitular}>{a.titular}</Text>
          {a.detalle ? <Text style={e.avisoDetalle} numberOfLines={3}>{a.detalle}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function Descartadas({ fuera }) {
  if (!fuera.length) return null;
  return (
    <View style={e.fueraCaja}>
      <Text style={e.fueraTitulo}>Fuera del radar</Text>
      <Text style={e.fueraSub}>
        Solo aparecen aquí los descartes cuyo motivo podemos respaldar con una
        fuente comprobable. Señalar a una empresa sin poder demostrarlo vale
        menos que no decir nada.
      </Text>
      {fuera.map((f) => (
        <View key={f.slug} style={e.fueraFila}>
          <View style={e.fueraCab}>
            <Text style={e.fueraNombre}>{f.nombre}</Text>
            <Text style={e.insignia}>{f.etiqueta_descarte}</Text>
          </View>
          <Text style={e.fueraPor}>{f.motivo_descarte}</Text>
          {(f.fuentes || []).length > 0 && (
            <View style={e.fuentes}>
              <Text style={e.fuentesTitulo}>COMPROBADO EN</Text>
              {f.fuentes.map((s) => (
                <Pressable key={s.url} onPress={() => { tacto.eleccion(); Linking.openURL(s.url); }}>
                  <Text style={e.fuente} numberOfLines={2}>{s.titulo} ↗</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function Detalle({ p, sigue, onCerrar, onSeguir }) {
  if (!p) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaProvider>
        <SafeAreaView style={e.pantalla} edges={['top', 'bottom']}>
          <View style={e.detCab}>
            <View style={[e.mono, e.monoGrande, { backgroundColor: COLOR_CATEGORIA[p.categoria] || C.sup3 }]}>
              <Text style={[e.monoTxt, { fontSize: 18 }]}>{iniciales(p.nombre)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={e.detNombre}>{p.nombre}</Text>
              <Text style={e.fichaSub}>{p.categoria}</Text>
            </View>
            <Pressable onPress={onCerrar} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]} hitSlop={10}>
              <Text style={e.cerrarTxt}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={e.detCuerpo}>
            <Text style={e.detEtiqueta}>POR QUÉ ESTÁ EN EL RADAR</Text>
            <View style={e.aval}><Text style={e.avalTxt}>{p.aval}</Text></View>
            <Text style={e.detEtiqueta}>QUÉ HACE</Text>
            <Text style={e.detParrafo}>{p.nota}</Text>
            <Text style={e.detEtiqueta}>FICHA</Text>
            <View style={e.tabla}>
              {[['Tipo de actor', p.actor], ['Región / marco', p.region],
                ['Quién puede entrar', p.acceso], ['Importe de entrada', p.ticket],
                ['Cadenas', p.cadenas]].map(([k, v]) => (
                <View key={k} style={e.filaTabla}>
                  <Text style={e.filaClave}>{k}</Text>
                  <Text style={e.filaValor}>{v}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={onSeguir}
              style={({ pressed }) => [e.botonPrincipal, sigue && e.botonSecundario, pressed && e.pulsado]}>
              <Text style={[e.botonTxt, sigue && { color: C.senal }]}>
                {sigue ? '✓ Siguiendo esta plataforma' : 'Seguir y recibir avisos'}
              </Text>
            </Pressable>
            <Pressable onPress={() => { tacto.eleccion(); p.web && Linking.openURL(p.web); }}
              style={({ pressed }) => [e.botonBorde, pressed && e.pulsado]}>
              <Text style={e.botonBordeTxt}>Abrir la web oficial ↗</Text>
            </Pressable>
            <Text style={e.nota}>
              Esto no es asesoramiento financiero. Que una plataforma esté supervisada
              no significa que la inversión sea segura.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const e = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.noche },
  centro: { alignItems: 'center', justifyContent: 'center' },
  cargandoTxt: { ...T.cuerpo, marginTop: 14, color: C.tx2 },

  /* Todo lo pulsable cede al pulsarlo, igual que en la web. */
  pulsado: { transform: [{ scale: 0.955 }], opacity: 0.92 },
  pulsadoSuave: { opacity: 0.68 },

  /* La cabecera ya no es un bloque de color sobre papel: sobre fondo de
     noche lo que la separa es una línea y medio tono de superficie. */
  cabecera: {
    backgroundColor: C.noche2, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.linea,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  marca: { fontFamily: F.extra, fontSize: 24, letterSpacing: -0.8, color: C.tx },
  marcaSub: { ...T.dato, fontSize: 10.5, color: C.tx3, marginTop: 3 },
  pestanas: { flexDirection: 'row', backgroundColor: C.sup2, borderRadius: R.pastilla, padding: 3 },
  pestana: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.pastilla },
  pestanaOn: { backgroundColor: C.senal },
  pestanaTxt: { ...T.menor, fontFamily: F.semi, color: C.tx2 },
  pestanaTxtOn: { color: C.noche },

  lista: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.ficha, padding: 15, marginBottom: 14, ...E.e2,
  },
  bannerMarca: {
    width: 38, height: 38, borderRadius: R.s, backgroundColor: C.senal,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerMarcaTxt: { fontFamily: F.extra, fontSize: 19, color: C.noche },
  bannerTit: { ...T.ficha, fontSize: 15.5, color: C.tx },
  bannerSub: { ...T.menor, fontSize: 12, color: C.tx2, marginTop: 2 },
  bannerFlecha: { fontFamily: F.media, fontSize: 24, color: C.tx3 },

  buscador: {
    ...T.cuerpo, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.pastilla, paddingHorizontal: 18, paddingVertical: 12,
    color: C.tx, marginBottom: 12,
  },
  chips: { marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sup,
    borderWidth: 1, borderColor: C.linea, borderRadius: R.pastilla,
    paddingHorizontal: 13, paddingVertical: 8, marginRight: 8,
  },
  chipOn: { backgroundColor: C.senal, borderColor: C.senal },
  chipTxt: { ...T.menor, fontFamily: F.media, color: C.tx2 },
  chipTxtOn: { color: C.noche },
  punto: { width: 8, height: 8, borderRadius: 4 },
  contador: { ...T.dato, color: C.tx2, marginBottom: 12 },

  ficha: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.ficha, padding: 16, marginBottom: 12, gap: 10, ...E.e1,
  },
  fichaTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mono: { width: 44, height: 44, borderRadius: R.m, alignItems: 'center', justifyContent: 'center' },
  monoGrande: { width: 52, height: 52, borderRadius: 16 },
  /* Las iniciales van sobre el color de la categoría, que es claro:
     encima tiene que ir tinta oscura, no blanca. */
  monoTxt: { fontFamily: F.extra, fontSize: 15, color: C.noche },
  fichaNombre: { ...T.ficha, color: C.tx },
  fichaSub: { ...T.dato, color: C.tx2, marginTop: 3 },
  fichaNota: { ...T.cuerpo, color: C.tx2 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  etiqueta: {
    ...T.dato, fontSize: 11, color: C.tx2, backgroundColor: C.sup2,
    borderWidth: 1, borderColor: C.linea, borderRadius: R.pastilla,
    paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden',
  },
  etiquetaAcento: { backgroundColor: C.senal10, borderColor: C.senal34, color: C.senal },
  seguir: { borderWidth: 1, borderColor: C.linea, borderRadius: R.pastilla, paddingVertical: 10, alignItems: 'center' },
  seguirOn: { backgroundColor: C.senal10, borderColor: C.senal },
  seguirTxt: { ...T.menor, fontFamily: F.semi, color: C.tx2 },
  seguirTxtOn: { color: C.senal },

  vacio: { ...T.cuerpo, color: C.tx2, textAlign: 'center' },
  vacioCaja: { padding: 28, alignItems: 'center', gap: 8 },
  vacioTitulo: { ...T.ficha, color: C.tx },

  avisos: { marginBottom: 16 },
  avisosTitulo: { ...T.etiqueta, color: C.tx2, marginBottom: 8 },
  aviso: {
    backgroundColor: C.coral10, borderWidth: 1, borderColor: C.coral32,
    borderRadius: R.s, padding: 13, marginBottom: 8,
  },
  avisoTitular: { ...T.cuerpoFte, fontFamily: F.negrita, color: C.coral },
  avisoDetalle: { ...T.menor, color: C.tx2, marginTop: 4 },

  fueraCaja: { marginTop: 28 },
  fueraTitulo: { ...T.seccion, color: C.tx, marginBottom: 6 },
  fueraSub: { ...T.menor, color: C.tx2, marginBottom: 14 },
  fueraFila: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.s, padding: 14, marginBottom: 8, ...E.e1,
  },
  fueraCab: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  fueraNombre: { ...T.ficha, fontSize: 15, color: C.tx },
  insignia: {
    ...T.etiqueta, fontSize: 9.5, backgroundColor: C.coral, color: C.tx,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pastilla, overflow: 'hidden',
  },
  fueraPor: { ...T.menor, color: C.tx2 },
  fuentes: { marginTop: 11, paddingTop: 11, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea },
  fuentesTitulo: { ...T.etiqueta, fontSize: 9.5, color: C.tx2 },
  fuente: { ...T.menor, fontSize: 12, fontFamily: F.semi, color: C.senal },

  detCab: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18,
    borderBottomWidth: 1, borderBottomColor: C.linea, backgroundColor: C.noche2,
  },
  detNombre: { ...T.seccion, color: C.tx },
  cerrar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.sup2,
    borderWidth: 1, borderColor: C.linea, alignItems: 'center', justifyContent: 'center',
  },
  cerrarTxt: { fontFamily: F.media, fontSize: 15, color: C.tx2 },
  detCuerpo: { padding: 18, paddingBottom: 40 },
  detEtiqueta: { ...T.etiqueta, color: C.tx2, marginTop: 20, marginBottom: 8 },
  detParrafo: { ...T.cuerpo, fontSize: 15, lineHeight: 23, color: C.tx },
  aval: { backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34, borderRadius: R.s, padding: 13 },
  avalTxt: { ...T.cuerpoFte, color: C.senal },
  tabla: { backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.s },
  filaTabla: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.linea,
  },
  filaClave: { ...T.menor, color: C.tx2 },
  filaValor: { ...T.menor, fontFamily: F.semi, color: C.tx, flexShrink: 1, textAlign: 'right' },

  /* La acción principal es el único sitio, con el logotipo y los
     rótulos, donde la señal se usa como fondo. */
  botonPrincipal: {
    backgroundColor: C.senal, borderRadius: R.pastilla, paddingVertical: 15,
    alignItems: 'center', marginTop: 24, ...E.e2,
  },
  botonSecundario: { backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal },
  botonTxt: { ...T.cuerpoFte, fontFamily: F.negrita, fontSize: 15, color: C.noche },
  botonBorde: {
    borderWidth: 1, borderColor: C.linea, borderRadius: R.pastilla,
    paddingVertical: 14, alignItems: 'center', marginTop: 10, backgroundColor: C.sup,
  },
  botonBordeTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
  nota: { ...T.menor, fontSize: 12, color: C.tx2, textAlign: 'center', marginTop: 16 },
});
