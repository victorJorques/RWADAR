/* ---------------------------------------------------------------------
   País de residencia en la app (27/11/2026), como la web: el selector de
   Ofertas («Tu país de residencia» y «Solo las disponibles en tu país») y el
   hook que repinta al cambiar. El estado vive en lib/pais-usuario.js.
   --------------------------------------------------------------------- */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, ScrollView, SelectorIdioma, Text, TextInput, View, useIdioma } from './Idioma';
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

export function SelectorPais({ pais, sinFiltro = false, textoBoton = 'Tu país de residencia' }) {
  const idioma = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const paises = useMemo(() => listaPaises(idioma), [idioma]);
  const q = sinTildes(busqueda.trim());
  const visibles = q ? paises.filter((p) => sinTildes(p.nombre).includes(q) || p.codigo.toLowerCase() === q) : paises;
  const elegir = (codigo) => { elegirPais(codigo, AsyncStorage); setAbierto(false); setBusqueda(''); };
  return (
    <View style={e.caja}>
      <View style={e.fila}>
        <Pressable onPress={() => setAbierto(true)} style={({ pressed }) => [e.boton, pressed && e.pulsado]}
          accessibilityRole="button" accessibilityLabel={`Tu país de residencia: ${pais.nombre}`} accessibilityHint="Cambia el país para ver la disponibilidad de cada oferta">
          <Text style={e.etiqueta}>{textoBoton}</Text>
          <Text style={e.valor} numberOfLines={1}>{pais.nombre} ▾</Text>
        </Pressable>
        {sinFiltro ? null : <Pressable onPress={() => ponerSoloAccesibles(!pais.solo)} style={({ pressed }) => [e.chip, pais.solo && e.chipOn, pressed && e.pulsado]}
          accessibilityRole="switch" accessibilityState={{ checked: pais.solo }} accessibilityLabel="Solo las disponibles en tu país">
          <Text style={[e.chipTxt, pais.solo && e.chipTxtOn]}>{pais.solo ? '✓ ' : ''}Solo las disponibles en tu país</Text>
        </Pressable>}
      </View>
      {pais.origen === 'detectado' ? <Text style={e.nota}>Detectado por tu conexión. Si resides en otro país, cámbialo.</Text> : null}
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
        <IdiomaInicio />
      </View>
    );
  }
  return (
    <View style={e.iniCaja}>
      <Text style={e.iniAnte}>Tu país de residencia</Text>
      <Text style={e.iniNombre} accessibilityRole="header">{pais.nombre}</Text>
      <View style={e.iniCifras}>
        {[[cuenta('disponible'), 'Disponibles', C.senal], [cuenta('con_requisitos'), 'Con requisitos', C.aviso], [ofertas.length, 'En el radar', C.tx]].map(([n, t, color]) => (
          <View key={t} style={e.iniCifra}><Text noTraducir style={[e.iniNum, { color }]}>{String(n)}</Text><Text style={e.iniCifraTxt}>{t}</Text></View>
        ))}
      </View>
      <SelectorPais pais={pais} sinFiltro textoBoton="Cambiar país" />
      <IdiomaInicio />
    </View>
  );
}

/* Idioma en Inicio (27/11/2026), junto al país: el mismo selector de Perfil. */
function IdiomaInicio() {
  return (
    <View style={e.iniIdioma}>
      <Text style={e.iniIdiomaTit}>Idioma</Text>
      <SelectorIdioma estilo={e.iniIdiomaSel} />
    </View>
  );
}

/* Inicio (27/11/2026): cuántas ofertas hay de cada país (el de la oferta), arriba, con el radar y las ofertas. */
export function OfertasPorPais({ ofertas = [] }) {
  const filas = useMemo(() => {
    const cuenta = new Map();
    for (const o of ofertas) { const c = String(o && o.pais || '').toUpperCase(); if (nombrePais(c, 'es')) cuenta.set(c, (cuenta.get(c) || 0) + 1); }
    return [...cuenta.keys()].sort((a, b) => nombrePais(a, 'es').localeCompare(nombrePais(b, 'es'), 'es'));
  }, [ofertas]);
  if (!filas.length) return null;
  return (
    <View style={e.porPais}>
      <Text style={e.porPaisTit} accessibilityRole="header">Ofertas por país</Text>
      <Text style={e.porPaisSub}>Países donde se emiten u ofrecen las ofertas del radar.</Text>
      <View style={e.porPaisLista}>
        {filas.map((c) => (
          <View key={c} style={e.porPaisCelda} accessible accessibilityLabel={nombrePais(c, 'es')}>
            <Text noTraducir style={e.porPaisBandera} accessible={false}>{String.fromCodePoint(...[...c].map((x) => 0x1F1E6 + x.charCodeAt(0) - 65))}</Text>
            <Text style={e.porPaisNombre} numberOfLines={1}>{nombrePais(c, 'es')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  iniIdioma: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.linea },
  iniIdiomaTit: { ...T.menor, fontSize: 13, color: C.tx2 },
  iniIdiomaSel: { paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' },
  iniCaja: { marginTop: 20, marginHorizontal: UI.margen || 16, padding: 16, borderRadius: R.l, backgroundColor: C.sup, borderWidth: 1, borderColor: C.senalT },
  iniPregunta: { ...T.seccion, color: C.tx },
  iniSub: { ...T.menor, fontSize: 14, lineHeight: 20, color: C.tx2, marginTop: 4 },
  iniOk: { marginTop: 12, minHeight: 48, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center' },
  iniOkTxt: { fontSize: 16, fontWeight: '700', color: C.noche || '#0B0A0A' },
  iniAnte: { ...T.menor, fontSize: 12, lineHeight: 16, color: C.tx3 || C.tx2 },
  iniNombre: { ...T.seccion, color: C.tx, marginTop: 2 },
  iniCifras: { flexDirection: 'row', gap: 8, marginTop: 12 },
  iniCifra: { flex: 1, padding: 10, borderRadius: R.m, backgroundColor: C.noche || '#0B0A0A' },
  iniNum: { fontSize: 22, fontVariant: ['tabular-nums'] },
  iniCifraTxt: { ...T.menor, fontSize: 12, lineHeight: 16, color: C.tx2, marginTop: 2 },
  porPais: { marginTop: 24, paddingHorizontal: UI.margen || 16 },
  porPaisTit: { ...T.seccion, color: C.tx },
  porPaisSub: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx2, marginTop: 2, marginBottom: 10 },
  porPaisLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  porPaisCelda: { flexBasis: '47%', flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, borderRadius: R.m, borderWidth: 1, borderColor: C.linea, backgroundColor: C.sup },
  porPaisNombre: { ...T.menor, fontSize: 14, lineHeight: 18, color: C.tx, flexShrink: 1 },
  porPaisBandera: { fontSize: 20 },
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
