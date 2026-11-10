import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { ImagenOferta, avisosCriticos, lugarConPais } from './Ofertas';
import { imagenEditorialOferta } from '../fixtures/imagenes-editoriales';
import { esNueva, fechaAlta } from '../lib/recien-anadidas';
import { textosInicio } from '../lib/inicio-contenido';
import { fechaES } from '../lib/transparencia';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Ofertas» de Inicio (rediseño del 10/11/2026), como la web
   ---------------------------------------------------------------------
   Un solo carrusel que une «Recién añadidas» y las de la Selección (las que
   pasan las 5 comprobaciones), sin duplicados y 6 como mucho
   (`ofertasDestacadas` de lib/recien-anadidas.js). Cada tarjeta lleva la
   foto, el título en 2 líneas, el proveedor y el lugar, su nota propia si la
   tiene (la de la Selección), el aviso crítico entero si lo hay (como la
   tarjeta de Ofertas desde el 05/11/2026: los demás avisos, en la ficha),
   «Nueva» y «Pasa las 5 comprobaciones» si toca y «Añadida el dd/mm/aaaa»,
   y abre su ficha. Debajo, qué son las 5 comprobaciones (plegado: el
   superlativo solo vale con ellas delante) y «Ver las N ofertas ›». Sin
   ninguna oferta no se pinta nada.
   --------------------------------------------------------------------- */
export default function RecienAnadidas({ ofertas = [], seleccion = new Set(), total = 0, onAbrirOferta, onVerTodas }) {
  const { width } = useWindowDimensions();
  const idioma = useIdioma();
  const t = textosInicio(idioma);
  const b = t.bloques.ofertas;
  const [cincoAbierto, setCincoAbierto] = useState(false);
  if (!ofertas.length) return null;
  const ancho = Math.round((width - UI.margen * 2) * 0.78);
  const conSeleccion = ofertas.some((o) => seleccion.has(o.slug));
  return (
    <View style={e.seccion}>
      <Text noTraducir style={e.titulo} accessibilityRole="header">{b.titulo}</Text>
      <Text noTraducir style={e.sub}>{b.sub}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToInterval={ancho + 12} snapToAlignment="start" style={e.pista} contentContainerStyle={e.pistaContenido}>
        {ofertas.map((o) => {
          const lugar = lugarConPais(imagenEditorialOferta(o)?.lugar);
          const fecha = fechaES(fechaAlta(o));
          const procedencia = [o.plataformaNombre, lugar].filter(Boolean).join(' · ');
          const letra = t.seleccion.letraPequena[o.slug] || '';
          const critico = avisosCriticos(o)[0];
          const bloqueo = critico?.tono === 'stop' ? critico : null;
          const nueva = esNueva(o, { dias: 30 });
          const cinco = seleccion.has(o.slug);
          return (
            <Pressable key={o.slug} onPress={() => { tacto.abrir(); onAbrirOferta?.(o); }}
              style={({ pressed }) => [e.tarjeta, { width: ancho }, pressed && e.tarjetaPulsada]}
              accessibilityRole="button" noTraducir
              accessibilityLabel={[`${b.verFicha} ${String(o.titulo || '').replace(/\.$/, '')}`, procedencia, letra ? letra.replace(/\.$/, '') : null,
                // Como FichaOferta: el lector de pantalla oye lo que se ve, el aviso crítico entero.
                bloqueo ? `${traducir('Aviso bloqueante')}: ${String(bloqueo.texto).replace(/\.$/, '')}` : null,
                nueva ? b.nueva : null, cinco ? b.etiquetaCinco : null,
                nueva && fecha ? `${b.anadida} ${fecha}` : null].filter(Boolean).join('. ')}>
              <ImagenOferta oferta={o} decorativa estilo={e.imagen} />
              <View style={e.cuerpo}>
                {nueva || cinco ? (
                  <View style={e.etiquetas}>
                    {nueva ? <Text noTraducir style={e.etiqueta}>{b.nueva}</Text> : null}
                    {cinco ? <Text noTraducir style={e.etiqueta}>{b.etiquetaCinco}</Text> : null}
                  </View>
                ) : null}
                <Text noTraducir idiomaOriginal="es-ES" style={e.tarjetaTit} numberOfLines={2}>{o.titulo}</Text>
                {procedencia ? <Text noTraducir idiomaOriginal="es-ES" style={e.procedencia}>{procedencia}</Text> : null}
                {letra ? <Text noTraducir style={e.letra}>{letra}</Text> : null}
                {bloqueo ? (
                  <Text style={e.aviso}>
                    <Text style={e.avisoStopMarca}>Importante</Text> · <Text noTraducir idiomaOriginal="es-ES">{bloqueo.texto}</Text>
                  </Text>
                ) : null}
                {nueva && fecha ? (
                  <View style={e.meta}>
                    <Text noTraducir style={e.fecha}>{b.anadida} {fecha}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {conSeleccion ? (
        <View style={e.cinco}>
          <Pressable onPress={() => { tacto.eleccion(); setCincoAbierto((v) => !v); }}
            style={({ pressed }) => [e.cincoBoton, pressed && pulsado('b3')]} accessibilityRole="button"
            accessibilityState={{ expanded: cincoAbierto }} noTraducir accessibilityLabel={b.cinco}>
            <Text noTraducir style={e.cincoTxt}>{b.cinco}</Text>
            <Text noTraducir style={e.cincoTxt} accessible={false}>{cincoAbierto ? '−' : '+'}</Text>
          </Pressable>
          {cincoAbierto ? (
            <View>
              {t.seleccion.criterios.map((c, i) => (
                <View key={c} style={e.criterio}>
                  <Text noTraducir style={e.criterioNum}>{i + 1}</Text>
                  <Text noTraducir style={e.criterioTxt}>{c}</Text>
                </View>
              ))}
              <Text noTraducir style={e.nota}>{b.cincoNota}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text noTraducir style={e.nota}>{t.seleccion.imagenes}</Text>
      <Pressable onPress={() => { tacto.abrir(); onVerTodas?.(); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
        accessibilityRole="button" noTraducir accessibilityLabel={b.ver(total)}>
        <Text noTraducir style={e.b3Txt}>{b.ver(total)}{' →'}</Text>
      </Pressable>
    </View>
  );
}

const e = StyleSheet.create({
  // Los bloques de Inicio: el mismo título y el mismo espacio (BLOQUE de Inicio.js).
  seccion: { marginTop: 36, paddingTop: 32, borderTopWidth: 1, borderTopColor: C.bd },
  titulo: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx },
  sub: { ...T.menor, fontSize: 15, lineHeight: 22, color: C.tx2, marginTop: 4 },
  // De borde a borde, como el carrusel de la web.
  pista: { marginHorizontal: -UI.margen, marginTop: 16 },
  pistaContenido: { paddingHorizontal: UI.margen, gap: 12 },
  // La tarjeta de la Selección (Inicio.js, tarjetaSel).
  tarjeta: { borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, overflow: 'hidden' },
  tarjetaPulsada: { backgroundColor: C.s2 },
  imagen: { width: '100%', aspectRatio: 1.6 },
  cuerpo: { flex: 1, padding: 14 },
  tarjetaTit: { ...T.ficha, fontSize: 18, lineHeight: 23, color: C.tx },
  procedencia: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.semi, color: C.tx3, marginTop: 4 },
  // La línea de riesgo, como tarjetaSelLetra de Inicio.js.
  letra: { ...T.menor, color: C.tx2, marginTop: 8 },
  // Como la web (.rel-nueva-bloqueo): raya roja a la izquierda; solo el aviso crítico.
  aviso: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx2, marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: C.alarma },
  avisoStopMarca: { fontFamily: F.semi, color: C.alarma },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 12 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  cinco: { marginTop: 12 },
  cincoBoton: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: R.m, paddingHorizontal: 8, marginHorizontal: -8 },
  cincoTxt: { fontFamily: F.media, fontSize: 15, lineHeight: 20, color: C.tx2 },
  criterio: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.bd },
  criterioNum: { ...T.dato, fontFamily: F.semi, color: C.senal, width: 16 },
  criterioTxt: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx, flex: 1 },
  // Etiqueta de estado (GUIA-ACABADOS §5): rectángulo de 8, verde suave, sin borde.
  etiqueta: { ...T.etiqueta, color: C.senal, backgroundColor: C.senalT, borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  fecha: { ...T.dato, color: C.tx2 },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 12 },
  b3: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, marginHorizontal: -8, marginTop: 4 },
  b3Txt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.senal },
});
