import React from 'react';
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
   «Recién añadidas» de Inicio (04/11/2026), como la web
   ---------------------------------------------------------------------
   Justo bajo la portada: las altas de los últimos 30 días (las elige
   `recienAnadidas` de lib/recien-anadidas.js), con las tarjetas de la
   Selección. Cada tarjeta lleva la foto, el título en 2 líneas, el
   proveedor y el lugar, su línea de riesgo (la de la Selección), el aviso
   crítico entero si lo hay (como la tarjeta de Ofertas desde el 05/11/2026:
   los demás avisos, en la ficha), «Nueva» si tiene menos de 14 días y
   «Añadida el dd/mm/aaaa», y abre su ficha. Sin ninguna no se pinta nada.
   El inglés va en lib/idioma-en.js («Recién añadidas (04/11)»).
   --------------------------------------------------------------------- */
export default function RecienAnadidas({ ofertas = [], onAbrirOferta, onVerTodas }) {
  const { width } = useWindowDimensions();
  const t = textosInicio(useIdioma());
  if (!ofertas.length) return null;
  const ancho = Math.round((width - UI.margen * 2) * 0.72);
  return (
    <View style={e.seccion}>
      <Text style={e.titulo} accessibilityRole="header">Recién añadidas</Text>
      <Text style={e.sub}>Las últimas ofertas que hemos revisado y añadido al radar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToInterval={ancho + 12} snapToAlignment="start" style={e.pista} contentContainerStyle={e.pistaContenido}>
        {ofertas.map((o) => {
          const lugar = lugarConPais(imagenEditorialOferta(o)?.lugar);
          const fecha = fechaES(fechaAlta(o));
          const procedencia = [o.plataformaNombre, lugar].filter(Boolean).join(' · ');
          const letra = t.seleccion.letraPequena[o.slug] || t.seleccion.letraRespaldo;
          const critico = avisosCriticos(o)[0];
          const bloqueo = critico?.tono === 'stop' ? critico : null;
          const nueva = esNueva(o);
          return (
            <Pressable key={o.slug} onPress={() => { tacto.abrir(); onAbrirOferta?.(o); }}
              style={({ pressed }) => [e.tarjeta, { width: ancho }, pressed && e.tarjetaPulsada]}
              accessibilityRole="button" noTraducir
              accessibilityLabel={[`${traducir('Ver ficha de')} ${String(o.titulo || '').replace(/\.$/, '')}`, procedencia, letra.replace(/\.$/, ''),
                // Como FichaOferta: el lector de pantalla oye lo que se ve, el aviso crítico entero.
                bloqueo ? `${traducir('Aviso bloqueante')}: ${String(bloqueo.texto).replace(/\.$/, '')}` : null,
                nueva ? traducir('Nueva') : null,
                `${traducir('Añadida el')} ${fecha}`].filter(Boolean).join('. ')}>
              <ImagenOferta oferta={o} decorativa estilo={e.imagen} />
              <View style={e.cuerpo}>
                <Text noTraducir idiomaOriginal="es-ES" style={e.tarjetaTit} numberOfLines={2}>{o.titulo}</Text>
                {procedencia ? <Text noTraducir idiomaOriginal="es-ES" style={e.procedencia}>{procedencia}</Text> : null}
                <Text noTraducir style={e.letra}>{letra}</Text>
                {bloqueo ? (
                  <Text style={e.aviso}>
                    <Text style={e.avisoStopMarca}>Importante</Text> · <Text noTraducir idiomaOriginal="es-ES">{bloqueo.texto}</Text>
                  </Text>
                ) : null}
                <View style={e.meta}>
                  {nueva ? <Text style={e.etiqueta}>Nueva</Text> : null}
                  {fecha ? <Text style={e.fecha}>{'Añadida el'} <Text noTraducir>{fecha}</Text></Text> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={e.nota}>Imágenes ilustrativas, no fotos del activo</Text>
      <Pressable onPress={() => { tacto.abrir(); onVerTodas?.(); }} style={({ pressed }) => [e.b3, pressed && pulsado('b3')]}
        accessibilityRole="button" accessibilityLabel="Ver todas las ofertas nuevas">
        <Text style={e.b3Txt}>{'Ver todas las ofertas nuevas'}{' ›'}</Text>
      </Pressable>
    </View>
  );
}

const e = StyleSheet.create({
  seccion: { marginTop: 28, paddingTop: 28, borderTopWidth: 1, borderTopColor: C.bd },
  titulo: { ...T.seccion, color: C.tx },
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
  // Etiqueta de estado (GUIA-ACABADOS §5): rectángulo de 8, verde suave, sin borde.
  etiqueta: { ...T.etiqueta, color: C.senal, backgroundColor: C.senalT, borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  fecha: { ...T.dato, color: C.tx2 },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 12 },
  b3: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, marginHorizontal: -8, marginTop: 4 },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
});
