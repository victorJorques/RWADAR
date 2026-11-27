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
import { listaPaises, nombrePais } from '../lib/disponibilidad-pais';
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

export function SelectorPais({ pais }) {
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
          <Text style={e.etiqueta}>Tu país de residencia</Text>
          <Text style={e.valor} numberOfLines={1}>{pais.nombre} ▾</Text>
        </Pressable>
        <Pressable onPress={() => ponerSoloAccesibles(!pais.solo)} style={({ pressed }) => [e.chip, pais.solo && e.chipOn, pressed && e.pulsado]}
          accessibilityRole="switch" accessibilityState={{ checked: pais.solo }} accessibilityLabel="Solo las disponibles en tu país">
          <Text style={[e.chipTxt, pais.solo && e.chipTxtOn]}>{pais.solo ? '✓ ' : ''}Solo las disponibles en tu país</Text>
        </Pressable>
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

/* Inicio (27/11/2026): cuántas ofertas hay de cada país (el de la oferta), arriba, con el radar y las ofertas. */
export function OfertasPorPais({ ofertas = [] }) {
  const filas = useMemo(() => {
    const cuenta = new Map();
    for (const o of ofertas) { const c = String(o && o.pais || '').toUpperCase(); if (nombrePais(c, 'es')) cuenta.set(c, (cuenta.get(c) || 0) + 1); }
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || nombrePais(a[0], 'es').localeCompare(nombrePais(b[0], 'es'), 'es'));
  }, [ofertas]);
  if (!filas.length) return null;
  const total = filas.reduce((n, f) => n + f[1], 0);
  return (
    <View style={e.porPais}>
      <Text style={e.porPaisTit} accessibilityRole="header">Ofertas por país</Text>
      <Text style={e.porPaisSub}>{`${total} ofertas de ${filas.length} países, según dónde se emiten u ofrecen.`}</Text>
      <View style={e.porPaisLista}>
        {filas.map(([c, n]) => (
          <View key={c} style={e.porPaisCelda} accessible accessibilityLabel={`${nombrePais(c, 'es')}: ${n}`}>
            <Text style={e.porPaisNombre} numberOfLines={1}>{nombrePais(c, 'es')}</Text>
            <Text noTraducir style={e.porPaisNum}>{n}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  porPais: { marginTop: 24, paddingHorizontal: UI.margen || 16 },
  porPaisTit: { ...T.seccion, color: C.tx },
  porPaisSub: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx2, marginTop: 2, marginBottom: 10 },
  porPaisLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  porPaisCelda: { flexBasis: '47%', flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    paddingHorizontal: 12, borderRadius: R.m, borderWidth: 1, borderColor: C.linea, backgroundColor: C.sup },
  porPaisNombre: { ...T.menor, fontSize: 14, lineHeight: 18, color: C.tx, flexShrink: 1 },
  porPaisNum: { fontSize: 16, color: C.senal, fontVariant: ['tabular-nums'] },
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
