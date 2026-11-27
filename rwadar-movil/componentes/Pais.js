/* ---------------------------------------------------------------------
   País de residencia en la app (27/11/2026), como la web: el selector de
   Ofertas («Tu país de residencia» y «Solo las disponibles en tu país») y el
   hook que repinta al cambiar. El estado vive en lib/pais-usuario.js.
   --------------------------------------------------------------------- */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, ScrollView, Text, TextInput, View, useIdioma } from './Idioma';
import { C, R, T, UI } from '../lib/tema';
import { estadoEnPais, listaPaises, nombrePais } from '../lib/disponibilidad-pais';
import { cargarPais, elegirPais, obtenerPais, origenPais, ponerSoloAccesibles, soloAccesibles, suscribirPais } from '../lib/pais-usuario';

/* {codigo, nombre, origen, solo, version}: cambia cuando cambia el país o el filtro. */
export function usePais() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const quitar = suscribirPais(() => setVersion((v) => v + 1));
    cargarPais(AsyncStorage, typeof fetch === 'function' ? fetch : null);
    return quitar;
  }, []);
  const codigo = obtenerPais();
  return { codigo, nombre: nombrePais(codigo, 'es'), origen: origenPais(), solo: soloAccesibles(), version };
}

const sinTildes = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function SelectorPais({ pais, sinFiltro = false, textoBoton = 'Tu país de residencia', compacto = false }) {
  const idioma = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const paises = useMemo(() => listaPaises(idioma), [idioma]);
  const q = sinTildes(busqueda.trim());
  const visibles = q ? paises.filter((p) => sinTildes(p.nombre).includes(q) || p.codigo.toLowerCase() === q) : paises;
  const elegir = (codigo) => { elegirPais(codigo, AsyncStorage); setAbierto(false); setBusqueda(''); };
  return (
    <View style={compacto ? null : e.caja}>
      {/* Compacto (Inicio, 27/11/2026): solo «Cambiar ▾». */}
      {compacto ? (
        <Pressable onPress={() => setAbierto(true)} style={({ pressed }) => [e.cambiar, pressed && e.pulsado]} hitSlop={4}
          accessibilityRole="button" accessibilityLabel={`Cambiar país de residencia: ${pais.nombre}`}>
          <Text style={e.cambiarTxt}>Cambiar</Text>
          <Text noTraducir style={e.cambiarFlecha}>▾</Text>
        </Pressable>
      ) : null}
      {compacto ? null : <View style={e.fila}>
        <Pressable onPress={() => setAbierto(true)} style={({ pressed }) => [e.boton, pressed && e.pulsado]}
          accessibilityRole="button" accessibilityLabel={`Tu país de residencia: ${pais.nombre}`} accessibilityHint="Cambia el país para ver la disponibilidad de cada oferta">
          <Text style={e.etiqueta}>{textoBoton}</Text>
          <Text style={e.valor} numberOfLines={1}>{pais.nombre} ▾</Text>
        </Pressable>
        {sinFiltro ? null : <Pressable onPress={() => ponerSoloAccesibles(!pais.solo)} style={({ pressed }) => [e.chip, pais.solo && e.chipOn, pressed && e.pulsado]}
          accessibilityRole="switch" accessibilityState={{ checked: pais.solo }} accessibilityLabel="Solo las disponibles en tu país">
          <Text style={[e.chipTxt, pais.solo && e.chipTxtOn]}>{pais.solo ? '✓ ' : ''}Solo las disponibles en tu país</Text>
        </Pressable>}
      </View>}
      {!compacto && pais.origen === 'detectado' ? <Text style={e.nota}>Detectado por tu conexión. Si resides en otro país, cámbialo.</Text> : null}
      <Modal visible={abierto} animationType="slide" transparent onRequestClose={() => setAbierto(false)}>
        <View style={e.fondo}>
          <View style={e.hoja}>
            <View style={e.cabecera}>
              <Text style={e.titulo} accessibilityRole="header">Tu país de residencia</Text>
              <Pressable onPress={() => setAbierto(false)} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]}
                accessibilityRole="button" accessibilityLabel="Cerrar"><Text style={e.cerrarTxt}>×</Text></Pressable>
            </View>
            <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar país" placeholderTextColor={C.tx3 || C.tx2}
              style={e.buscar} autoCorrect={false} accessibilityLabel="Buscar país" />
            <ScrollView keyboardShouldPersistTaps="handled" style={e.lista}>
              {visibles.map((p) => (
                <Pressable key={p.codigo} onPress={() => elegir(p.codigo)} style={({ pressed }) => [e.opcion, p.codigo === pais.codigo && e.opcionOn, pressed && e.pulsado]}
                  accessibilityRole="radio" accessibilityState={{ checked: p.codigo === pais.codigo }} accessibilityLabel={p.nombre} noTraducir>
                  <Text noTraducir style={[e.opcionTxt, p.codigo === pais.codigo && e.opcionTxtOn]}>{p.nombre}</Text>
                  {p.codigo === pais.codigo ? <Text style={e.marca}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Text style={e.nota}>La disponibilidad depende de tu país de residencia, no de dónde te conectes.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* Inicio, lo primero (27/11/2026): el país de residencia. Sin elegir, la pregunta con el detectado y «Confirmar»;
   elegido, cuántas ofertas están a su alcance y «Cambiar». Se ven todas las ofertas igual, como la web. */
const bandera = (c) => (/^[A-Z]{2}$/.test(c || '') ? String.fromCodePoint(...[...c].map((x) => 0x1F1E6 + x.charCodeAt(0) - 65)) : '');

/* Inicio (27/11/2026, versión compacta, como la web): una fila con la bandera, el país y «Cambiar ▾», y las cifras en una línea. */
export function PaisInicio({ ofertas = [] }) {
  const pais = usePais();
  const cuenta = (estado) => ofertas.filter((o) => estadoEnPais(o, pais.codigo).estado === estado).length;
  if (pais.origen !== 'elegido') {
    return (
      <View style={e.iniCaja}>
        <Text style={e.iniPregunta} accessibilityRole="header">¿Cuál es tu país de residencia?</Text>
        <Text style={e.iniSub}>Así te decimos qué ofertas están a tu alcance. Verás todas las ofertas del mundo igualmente.</Text>
        <SelectorPais pais={pais} sinFiltro />
        <Pressable onPress={() => elegirPais(pais.codigo, AsyncStorage)} style={({ pressed }) => [e.iniOk, pressed && e.pulsado]}
          accessibilityRole="button" accessibilityLabel="Confirmar"><Text style={e.iniOkTxt}>Confirmar</Text></Pressable>
      </View>
    );
  }
  return (
    <View style={e.iniCaja}>
      <View style={e.iniFila}>
        <View style={e.iniBandera} accessible={false}><Text noTraducir style={e.iniBanderaTxt}>{bandera(pais.codigo)}</Text></View>
        <View style={e.iniCab}>
          <Text style={e.iniAnte}>Tu país de residencia</Text>
          <Text style={e.iniNombre} accessibilityRole="header" numberOfLines={1}>{pais.nombre}</Text>
        </View>
        <SelectorPais pais={pais} sinFiltro compacto />
      </View>
      <View style={e.iniCifras}>
        {[[cuenta('disponible'), 'Disponibles', C.senal], [cuenta('con_requisitos'), 'Con requisitos', C.aviso], [ofertas.length, 'En el radar', C.tx]].map(([n, t, color]) => (
          <View key={t} style={e.iniCifra}><Text noTraducir style={[e.iniNum, { color }]}>{String(n)}</Text><Text style={e.iniCifraTxt}>{t}</Text></View>
        ))}
      </View>
    </View>
  );
}

/* Ofertas por país (27/11/2026, compacto): chips de bandera y nombre en una fila que se desliza; el país del usuario, el primero. */
export function OfertasPorPais({ ofertas = [] }) {
  const pais = usePais();
  const filas = useMemo(() => {
    const cuenta = new Map();
    for (const o of ofertas) { const c = String(o && o.pais || '').toUpperCase(); if (nombrePais(c, 'es')) cuenta.set(c, (cuenta.get(c) || 0) + 1); }
    const todas = [...cuenta.keys()].sort((a, b) => nombrePais(a, 'es').localeCompare(nombrePais(b, 'es'), 'es'));
    return [...todas.filter((c) => c === pais.codigo), ...todas.filter((c) => c !== pais.codigo)];
  }, [ofertas, pais.codigo]);
  if (!filas.length) return null;
  return (
    <View style={e.porPais}>
      <Text style={e.porPaisTit} accessibilityRole="header">Ofertas por país</Text>
      <Text style={e.porPaisSub}>Países donde se emiten u ofrecen las ofertas del radar.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={e.porPaisLista}>
        {filas.map((c) => (
          <View key={c} style={[e.porPaisChip, c === pais.codigo && e.porPaisChipTuyo]} accessible accessibilityLabel={nombrePais(c, 'es')}>
            <Text noTraducir style={e.porPaisBandera} accessible={false}>{bandera(c)}</Text>
            <Text style={[e.porPaisNombre, c === pais.codigo && e.porPaisNombreTuyo]} numberOfLines={1}>{nombrePais(c, 'es')}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const e = StyleSheet.create({
  iniCaja: { marginTop: 18, marginHorizontal: UI.margen || 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: R.l, backgroundColor: C.sup, borderWidth: 1, borderColor: C.senalT },
  iniPregunta: { ...T.seccion, fontSize: 17, lineHeight: 22, color: C.tx },
  iniSub: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx2, marginTop: 4 },
  iniOk: { marginTop: 10, minHeight: 44, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center' },
  iniOkTxt: { fontSize: 15, fontWeight: '700', color: C.noche || '#0B0A0A' },
  iniFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iniBandera: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.noche || '#0B0A0A', alignItems: 'center', justifyContent: 'center' },
  iniBanderaTxt: { fontSize: 22, lineHeight: 26 },
  iniCab: { flex: 1, minWidth: 0 },
  iniAnte: { ...T.menor, fontSize: 11, lineHeight: 14, color: C.tx3 || C.tx2 },
  iniNombre: { ...T.seccion, fontSize: 18, lineHeight: 22, color: C.tx },
  iniCifras: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.linea },
  iniCifra: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  iniNum: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  iniCifraTxt: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3 || C.tx2 },
  porPais: { marginTop: 18 },
  porPaisTit: { ...T.menor, fontSize: 15, lineHeight: 20, fontWeight: '600', color: C.tx, paddingHorizontal: UI.margen || 16 },
  porPaisSub: { ...T.menor, fontSize: 12, lineHeight: 16, color: C.tx3 || C.tx2, marginTop: 2, marginBottom: 10, paddingHorizontal: UI.margen || 16 },
  porPaisLista: { flexDirection: 'row', gap: 8, paddingHorizontal: UI.margen || 16 },
  porPaisChip: { height: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: C.linea, backgroundColor: C.sup },
  porPaisChipTuyo: { borderColor: C.senal, backgroundColor: C.senalT },
  porPaisBandera: { fontSize: 15, lineHeight: 18 },
  porPaisNombre: { ...T.menor, fontSize: 13, lineHeight: 17, color: C.tx2 },
  porPaisNombreTuyo: { color: C.tx },
  cambiar: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: C.ton },
  cambiarTxt: { fontSize: 13, lineHeight: 17, fontWeight: '600', color: C.tx },
  cambiarFlecha: { fontSize: 12, lineHeight: 17, color: C.senal },
  caja: { marginTop: 10 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'stretch' },
  boton: { flexGrow: 1, minHeight: 48, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.m, borderWidth: 1, borderColor: C.linea, backgroundColor: C.sup || 'transparent', justifyContent: 'center' },
  etiqueta: { ...T.menor, fontSize: 12, lineHeight: 16, color: C.tx2 },
  valor: { ...T.menor, fontSize: 16, lineHeight: 22, color: C.tx },
  chip: { minHeight: 48, paddingHorizontal: 14, borderRadius: R.p, borderWidth: 1, borderColor: C.linea, justifyContent: 'center' },
  chipOn: { backgroundColor: C.senalT, borderColor: C.senal },
  chipTxt: { ...T.menor, fontSize: 14, lineHeight: 18, color: C.tx },
  chipTxtOn: { color: C.senal },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx2, marginTop: 6 },
  pulsado: { opacity: 0.7 },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  hoja: { maxHeight: '85%', backgroundColor: C.noche || C.fondo || '#0B0D10', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: UI.margen || 16, paddingBottom: 24 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titulo: { ...T.seccion, color: C.tx },
  cerrar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  cerrarTxt: { fontSize: 28, color: C.tx },
  buscar: { minHeight: 48, borderRadius: R.m, borderWidth: 1, borderColor: C.linea, paddingHorizontal: 14, color: C.tx, fontSize: 16, marginBottom: 8 },
  lista: { flexGrow: 0 },
  opcion: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.linea },
  opcionOn: { backgroundColor: C.senalT },
  opcionTxt: { ...T.menor, fontSize: 16, lineHeight: 22, color: C.tx },
  opcionTxtOn: { color: C.senal },
  marca: { color: C.senal, fontSize: 18 },
});
