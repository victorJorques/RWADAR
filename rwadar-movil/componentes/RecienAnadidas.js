import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { ImagenOferta, PieFotoTarjeta, avisosCriticos, lugarConPais, ofertaParaResumen, pieImagenOferta } from './Ofertas';
import { resumenOferta } from '../lib/ficha-editorial';
import { imagenEditorialOferta } from '../fixtures/imagenes-editoriales';
import { esNueva, fechaTarjeta } from '../lib/recien-anadidas';
import { textosInicio } from '../lib/inicio-contenido';
import { datosTarjetaOferta, fechaES } from '../lib/transparencia';
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
   «Nueva» y «Pasa las 5 comprobaciones» si toca y su fecha más reciente
   («Añadida el», «Verificada el» o «Actualizada el dd/mm/aaaa», fechaTarjeta),
   y abre su ficha. Debajo, qué son las 5 comprobaciones (plegado: el
   superlativo solo vale con ellas delante) y «Ver todas las ofertas ›». Sin
   ninguna oferta no se pinta nada.
   --------------------------------------------------------------------- */
export default function RecienAnadidas({ ofertas = [], seleccion = new Set(), onAbrirOferta, onVerTodas }) {
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
          const cuando = fechaTarjeta(o);
          const fecha = cuando ? `${b[cuando.tipo]} ${fechaES(cuando.fecha)}` : '';
          const procedencia = [o.plataformaNombre, lugar].filter(Boolean).join(' · ');
          const letra = t.seleccion.letraPequena[o.slug] || '';
          const critico = avisosCriticos(o)[0];
          const bloqueo = critico?.tono === 'stop' ? critico : null;
          const nueva = esNueva(o, { dias: 30 });
          const cinco = seleccion.has(o.slug);
          // Una foto real dice qué muestra (lib/fotos-ofertas.js); las ilustraciones, como siempre.
          const pie = pieImagenOferta(o, idioma);
          // Todas con los mismos dos datos que la lista de Ofertas (21/11/2026): el mínimo y España.
          const resumen = resumenOferta(ofertaParaResumen(o), [], new Date());
          const datos = datosTarjetaOferta(o, resumen, { noEspana: !!resumen.cifrasVigentes && o.disponibleEs === false });
          return (
            <Pressable key={o.slug} onPress={() => { tacto.abrir(); onAbrirOferta?.(o); }}
              style={({ pressed }) => [e.tarjeta, { width: ancho }, pressed && e.tarjetaPulsada]}
              accessibilityRole="button" noTraducir
              accessibilityLabel={[`${b.verFicha} ${String(o.titulo || '').replace(/\.$/, '')}`, procedencia, pie ? pie.texto : null, letra ? letra.replace(/\.$/, '') : null,
                // Como FichaOferta: el lector de pantalla oye lo que se ve, el aviso crítico entero.
                bloqueo ? `${traducir('Aviso bloqueante')}: ${String(bloqueo.texto).replace(/\.$/, '')}` : null,
                ...datos.map(([etiqueta, valor]) => `${traducir(etiqueta)}: ${traducir(valor)}`),
                nueva ? b.nueva : null, cinco ? b.etiquetaCinco : null,
                fecha || null].filter(Boolean).join('. ')}>
              {/* «Nueva» y «Pasa las 5 comprobaciones», sobre la foto en su píldora oscura, como en
                  la lista de Ofertas: los títulos de las tarjetas empiezan a la misma altura. */}
              <View style={e.foto}>
                <ImagenOferta oferta={o} decorativa estilo={e.imagen} />
                {nueva || cinco ? (
                  <View style={e.etiquetas}>
                    {nueva ? <Text noTraducir style={e.etiqueta}>{b.nueva}</Text> : null}
                    {cinco ? <Text noTraducir style={e.etiqueta}>{b.etiquetaCinco}</Text> : null}
                  </View>
                ) : null}
              </View>
              <View style={e.cuerpo}>
                <Text noTraducir idiomaOriginal="es-ES" style={e.tarjetaTit} numberOfLines={4}>{o.titulo}</Text>
                {procedencia ? <Text noTraducir idiomaOriginal="es-ES" style={e.procedencia}>{procedencia}</Text> : null}
                <PieFotoTarjeta oferta={o} />
                <View style={e.datos}>
                  {datos.map(([etiqueta, valor], i) => (
                    <View key={etiqueta} style={e.dato}>
                      {i ? <Text style={e.datoPunto} accessible={false} importantForAccessibility="no">·</Text> : null}
                      <Text style={e.datoEtiqueta}>{etiqueta}</Text>
                      <Text style={e.datoValor}>{valor}</Text>
                    </View>
                  ))}
                </View>
                {letra ? <Text noTraducir style={e.letra}>{letra}</Text> : null}
                {bloqueo ? (
                  <Text style={e.aviso}>
                    <Text style={e.avisoStopMarca}>Importante</Text> · <Text noTraducir idiomaOriginal="es-ES">{bloqueo.texto}</Text>
                  </Text>
                ) : null}
                {fecha ? (
                  <View style={e.meta}>
                    <Text noTraducir style={e.fecha}>{fecha}</Text>
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
        accessibilityRole="button" noTraducir accessibilityLabel={b.ver()}>
        <Text noTraducir style={e.b3Txt}>{b.ver()}{' →'}</Text>
      </Pressable>
    </View>
  );
}

const e = StyleSheet.create({
  // Los bloques de Inicio: el mismo título y el mismo espacio (BLOQUE de Inicio.js).
  seccion: { marginTop: 36, paddingTop: 32, borderTopWidth: 1, borderTopColor: C.bd },
  titulo: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx },
  sub: { ...T.menor, fontSize: 16, lineHeight: 23, color: C.tx2, marginTop: 4 },
  // De borde a borde, como el carrusel de la web.
  pista: { marginHorizontal: -UI.margen, marginTop: 16 },
  // Como la lista de Ofertas: las tarjetas miden lo mismo y «Añadida el …» baja al pie (meta, marginTop 'auto').
  pistaContenido: { paddingHorizontal: UI.margen, gap: 12 },
  // La tarjeta de la Selección (Inicio.js, tarjetaSel).
  tarjeta: { borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, overflow: 'hidden' },
  tarjetaPulsada: { backgroundColor: C.s2 },
  imagen: { width: '100%', aspectRatio: 1.6 },
  foto: { position: 'relative' },
  cuerpo: { flex: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  tarjetaTit: { ...T.ficha, fontSize: 18, lineHeight: 23, color: C.tx },
  procedencia: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.semi, color: C.tx3, marginTop: 4 },
  datos: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 8 },
  dato: { flexDirection: 'row', alignItems: 'baseline' },
  datoPunto: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx3, marginHorizontal: 6 },
  datoEtiqueta: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx2, marginRight: 4 },
  datoValor: { ...T.menor, fontSize: 15, lineHeight: 21, fontFamily: F.semi, color: C.tx },
  // La línea de riesgo, como tarjetaSelLetra de Inicio.js.
  letra: { ...T.menor, fontSize: 16, lineHeight: 23, color: C.tx2, marginTop: 10 },
  // Como la web (.rel-nueva-bloqueo): raya roja a la izquierda; solo el aviso crítico.
  aviso: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx2, marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: C.alarma },
  avisoStopMarca: { fontFamily: F.semi, color: C.alarma },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 12 },
  etiquetas: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, pointerEvents: 'none' },
  cinco: { marginTop: 12 },
  cincoBoton: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: R.m, paddingHorizontal: 8, marginHorizontal: -8 },
  cincoTxt: { fontFamily: F.media, fontSize: 15, lineHeight: 20, color: C.tx2 },
  criterio: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.bd },
  criterioNum: { ...T.dato, fontFamily: F.semi, color: C.senal, width: 16 },
  criterioTxt: { ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx, flex: 1 },
  // Sobre la foto: píldora oscura y texto verde (las marcas de las tarjetas de Ofertas en la web).
  etiqueta: { ...T.etiqueta, color: C.senal, backgroundColor: 'rgba(11,10,10,0.72)', borderRadius: R.p, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  fecha: { ...T.dato, color: C.tx2 },
  nota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 12 },
  b3: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, marginHorizontal: -8, marginTop: 4 },
  b3Txt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.senal },
});
