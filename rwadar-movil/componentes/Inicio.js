import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import Marca from './Marca';
import { Icono } from './Navegacion';
import { DESTINOS_NOTICIAS, NOTICIAS } from '../lib/noticias-contenido';
import { C, E, F, R, T, UI } from '../lib/tema';
import { tacto } from '../lib/tacto';

const COMUNIDAD_ABIERTA = false;

/* ---------------------------------------------------------------------
   Inicio: lo que cuenta RWAdar (rwadar-noticias/noticias.json, el mismo
   archivo que la web), los cambios de lo que sigues cuando existan, los
   últimos descartes y por dónde empezar. Las publicaciones de la
   comunidad llegarán con las cuentas: hoy se anuncian, no se simulan.
   --------------------------------------------------------------------- */
export default function Inicio({
  refrescando, onActualizar, onDestino, onExplicar, fuera = [], cambios = [], renderCambio,
}) {
  const descartes = fuera.slice(0, 3);
  return (
    <ScrollView
      contentContainerStyle={e.cuerpo}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onActualizar} tintColor={C.senal} />}
    >
      <View style={e.bienvenida}>
        <Marca tamano={46} />
        <View style={{ flex: 1 }}>
          <Text style={e.etiqueta}>REGISTRO INDEPENDIENTE</Text>
          <Text style={e.bienvenidaTit}>Plataformas de tokenización, con la fuente al lado</Text>
          <Text style={e.bienvenidaTxt}>
            Quién está en el radar, qué ofertas documentamos y quién se ha quedado fuera, y por qué.
          </Text>
        </View>
      </View>

      <Pressable onPress={() => onDestino('buscar')} style={({ pressed }) => [e.cta, pressed && e.pulsado]}
        accessibilityRole="button">
        <Text style={e.ctaTxt}>Buscar empresas y ofertas</Text>
      </Pressable>
      <Pressable onPress={() => onDestino('academy')} style={({ pressed }) => [e.ctaBorde, pressed && e.pulsado]}
        accessibilityRole="button">
        <Text style={e.ctaBordeTxt}>Aprender en la Academy</Text>
      </Pressable>

      {cambios.length ? (
        <View style={e.seccion}>
          <Text style={e.seccionTit}>Cambios en lo que sigues</Text>
          {cambios.map((c) => <View key={String(c.id)}>{renderCambio(c)}</View>)}
        </View>
      ) : null}

      <View style={e.seccion}>
        <Text style={e.seccionTit} accessibilityRole="header">Noticias de RWAdar</Text>
        {NOTICIAS.map((n) => {
          const destino = n.destino && DESTINOS_NOTICIAS[n.destino];
          return (
            <View key={n.id} style={e.noticia} accessible accessibilityLabel={`${n.etiqueta}, ${n.fechaTexto}. ${n.titulo}. ${n.texto}`}>
              <View style={e.noticiaMeta}>
                <Text style={e.noticiaEtiqueta}>{n.etiqueta.toUpperCase()}</Text>
                <Text style={e.noticiaFecha}>{n.fechaTexto}</Text>
              </View>
              <Text style={e.noticiaTit}>{n.titulo}</Text>
              <Text style={e.noticiaTxt}>{n.texto}</Text>
              {destino ? (
                <Pressable onPress={() => { tacto.abrir(); onDestino(destino.app); }}
                  style={({ pressed }) => [e.noticiaEnlace, pressed && e.pulsadoSuave]}
                  accessibilityRole="button" accessibilityLabel={destino.texto} hitSlop={6}>
                  <Text style={e.noticiaEnlaceTxt}>{destino.texto} →</Text>
                </Pressable>
              ) : null}
              {n.red ? (
                <Pressable onPress={() => onDestino('web', n.red.url)}
                  style={({ pressed }) => [e.noticiaEnlace, pressed && e.pulsadoSuave]}
                  accessibilityRole="link" accessibilityLabel={`Ver en ${n.red.nombre}`} hitSlop={6}>
                  <Text style={e.noticiaEnlaceTxt}>Ver en {n.red.nombre} ↗</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Sin cuentas no hay comunidad: el bloque no se enseña hasta que se
          encienda, para no llenar Inicio de «próximamente». */}
      {COMUNIDAD_ABIERTA ? (
      <View style={e.seccion}>
        <Text style={e.seccionTit} accessibilityRole="header">Comunidad</Text>
        <View style={e.proximamente}>
          <View style={e.proximamenteIcono}><Icono nombre="comunidad" color={C.senal} tamano={22} /></View>
          <View style={{ flex: 1 }}>
            <Text style={e.etiqueta}>PRÓXIMAMENTE</Text>
            <Text style={e.proximamenteTit}>Publicaciones de la comunidad</Text>
            <Text style={e.proximamenteTxt}>
              Cuando se abran las cuentas, cada cuenta podrá compartir aquí una publicación al día.
              Antes publicaremos las normas de la comunidad.
            </Text>
          </View>
        </View>
      </View>
      ) : null}

      {descartes.length ? (
        <View style={e.seccion}>
          <Text style={e.seccionTit} accessibilityRole="header">Fuera del radar</Text>
          {descartes.map((f) => (
            <View key={f.slug} style={e.descarte}>
              <View style={e.descarteCab}>
                <Text style={e.descarteNombre}>{f.nombre}</Text>
                {f.etiqueta_descarte ? <Text style={e.descarteEtiqueta}>{f.etiqueta_descarte}</Text> : null}
              </View>
              <Text style={e.descarteTxt} numberOfLines={3}>{f.motivo_descarte}</Text>
            </View>
          ))}
          <Pressable onPress={() => onDestino('fuera')} style={({ pressed }) => [e.noticiaEnlace, pressed && e.pulsadoSuave]}
            accessibilityRole="button" hitSlop={6}>
            <Text style={e.noticiaEnlaceTxt}>Ver todos los descartes y sus fuentes →</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable onPress={onExplicar} style={({ pressed }) => [e.banner, pressed && e.pulsado]}
        accessibilityRole="button" accessibilityLabel="Abrir explicación animada sobre tokenización">
        <View style={e.bannerMarca}><Icono nombre="ayuda" color={C.noche} tamano={22} /></View>
        <View style={{ flex: 1 }}>
          <Text style={e.bannerTit}>¿Qué es tokenizar un activo?</Text>
          <Text style={e.bannerSub}>Explicado con una animación 3D, paso a paso</Text>
        </View>
        <Icono nombre="flecha" color={C.tx3} tamano={20} />
      </Pressable>

      <Text style={e.nota}>
        RWAdar no pide datos bancarios, claves de monedero ni frases de recuperación. No es asesoramiento financiero.
      </Text>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  cuerpo: { padding: UI.margen, paddingBottom: 32 },
  pulsado: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  pulsadoSuave: { opacity: 0.7 },
  etiqueta: { ...T.etiqueta, fontSize: 9.5, color: C.senal, marginBottom: 4 },
  bienvenida: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 14,
    backgroundColor: C.sup, borderWidth: StyleSheet.hairlineWidth, borderColor: C.linea, borderRadius: R.ficha, ...E.e1,
  },
  bienvenidaTit: { ...T.ficha, color: C.tx },
  bienvenidaTxt: { ...T.menor, color: C.tx2, marginTop: 4 },
  cta: {
    minHeight: UI.boton, borderRadius: R.s, backgroundColor: C.senal,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18,
  },
  ctaTxt: { ...T.cuerpoFte, fontFamily: F.negrita, fontSize: 15.5, color: C.noche },
  ctaBorde: {
    minHeight: UI.boton, borderRadius: R.s, borderWidth: 1, borderColor: C.linea2, backgroundColor: C.sup2,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 9,
  },
  ctaBordeTxt: { ...T.cuerpoFte, fontFamily: F.negrita, fontSize: 15, color: C.tx },
  seccion: { marginTop: 26 },
  seccionTit: { ...T.seccion, fontSize: 19, color: C.tx, marginBottom: 10 },
  noticia: {
    padding: 15, marginBottom: 10, backgroundColor: C.sup, borderRadius: R.m,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.linea, ...E.e1,
  },
  noticiaMeta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  noticiaEtiqueta: {
    ...T.etiqueta, fontSize: 9.5, color: C.senal, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: R.pastilla, borderWidth: 1, borderColor: C.senal34, backgroundColor: C.senal10, overflow: 'hidden',
  },
  noticiaFecha: { ...T.dato, fontSize: 10.5, color: C.tx3 },
  noticiaTit: { ...T.ficha, fontSize: 16, color: C.tx },
  noticiaTxt: { ...T.cuerpo, fontSize: 14, color: C.tx2, marginTop: 5 },
  noticiaEnlace: { minHeight: UI.tactil - 4, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 2 },
  noticiaEnlaceTxt: { ...T.cuerpoFte, fontFamily: F.negrita, fontSize: 14, color: C.senal },
  proximamente: {
    flexDirection: 'row', gap: 12, padding: 15, backgroundColor: C.sup, borderRadius: R.m,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.linea,
  },
  proximamenteIcono: {
    width: 44, height: 44, borderRadius: R.s, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34,
  },
  proximamenteTit: { ...T.ficha, fontSize: 15.5, color: C.tx },
  proximamenteTxt: { ...T.menor, color: C.tx2, marginTop: 4 },
  descarte: {
    padding: 13, marginBottom: 8, backgroundColor: C.sup, borderRadius: R.m,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.linea,
  },
  descarteCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  descarteNombre: { ...T.ficha, fontSize: 15, color: C.tx, flex: 1 },
  descarteEtiqueta: {
    ...T.etiqueta, fontSize: 9, color: C.coral, paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: R.pastilla, borderWidth: 1, borderColor: C.coral32, backgroundColor: C.coral10, overflow: 'hidden',
  },
  descarteTxt: { ...T.menor, color: C.tx2, marginTop: 5 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 26,
    backgroundColor: C.sup, borderRadius: R.m, borderWidth: StyleSheet.hairlineWidth, borderColor: C.linea,
  },
  bannerMarca: {
    width: 40, height: 40, borderRadius: R.s, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center',
  },
  bannerTit: { ...T.ficha, fontSize: 15.5, color: C.tx },
  bannerSub: { ...T.menor, fontSize: 12, color: C.tx2, marginTop: 2 },
  nota: { ...T.menor, fontSize: 12, color: C.tx3, textAlign: 'center', marginTop: 26, paddingHorizontal: 12 },
});
