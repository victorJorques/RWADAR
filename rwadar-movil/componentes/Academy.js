import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable, ScrollView, Text, View } from './Idioma';
import { C, F, R, T, UI } from '../lib/tema';
import { tacto } from '../lib/tacto';
import { Icono } from './Navegacion';
import { AVISO_COMUN, DESTINOS, LECCIONES, NIVELES } from '../lib/academy-contenido';
import { leerProgresoAcademy, guardarProgresoAcademy } from '../lib/datos';
import { alternarLeida, progresoVacio, registrarTest } from '../lib/academy-progreso';

/* ---------------------------------------------------------------------
   RWAdar Academy, nativa
   ---------------------------------------------------------------------
   Las lecciones NO se escriben aquí: lib/academy-contenido.js lo genera
   rwadar-academy.js a partir de los mismos Markdown que la web. Este
   componente solo sabe pintar sus bloques (párrafos, listas, tablas,
   recuadros, test…), así que una lección nueva no exige tocar código.

   El progreso (leídas y aciertos del test) se queda en el dispositivo.
   Los botones de cada lección llevan al radar de la app o, si el destino
   solo existe en la web (el comparador), abren la web. Un destino que
   todavía no existe se muestra como «Próximamente», nunca como un botón
   que no lleva a ninguna parte.
   --------------------------------------------------------------------- */

const LETRAS = 'ABCD';
const SLUGS = LECCIONES.map((l) => l.slug);
const PUBLICADAS = LECCIONES.filter((l) => l.publicado);
const nivelDe = (id) => NIVELES.find((n) => n.id === id);
const numeroNivel = (id) => NIVELES.findIndex((n) => n.id === id) + 1;

/* Un botón puede llevar a otra lección («leccion:slug») o a un destino
   del producto definido en academy.json. */
export function resolverDestino(clave) {
  const leccion = String(clave).match(/^leccion:(.+)$/);
  if (leccion) {
    const l = LECCIONES.find((x) => x.slug === leccion[1]);
    if (!l) return { estado: 'proximamente', etiqueta: 'Lección' };
    return l.publicado
      ? { estado: 'disponible', etiqueta: `Lección ${l.modulo}`, app: 'leccion', slug: l.slug }
      : { estado: 'proximamente', etiqueta: `Lección ${l.modulo}` };
  }
  return DESTINOS[clave] || { estado: 'proximamente', etiqueta: 'Próximamente' };
}

const soloAcciones = (tramos) => tramos.some((t) => t.a) &&
  tramos.every((t) => t.a || t.br || (t.v !== undefined && /^[\s·—–-]*$/.test(t.v)));

export default function Academy({ slug, onAbrirLeccion, onVolver, onCerrar, onAccion, onExplicar }) {
  const [progreso, setProgreso] = useState(progresoVacio);
  const [guardadoFallido, setGuardadoFallido] = useState(false);
  const desplazamiento = useRef(null);

  useEffect(() => {
    let vivo = true;
    leerProgresoAcademy(SLUGS).then((leido) => { if (vivo) setProgreso(leido); });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    desplazamiento.current?.scrollTo?.({ y: 0, animated: false });
  }, [slug]);

  const actualizar = async (siguiente) => {
    setProgreso(siguiente);
    try {
      await guardarProgresoAcademy(siguiente);
      setGuardadoFallido(false);
    } catch {
      setGuardadoFallido(true);
    }
  };

  const leccion = slug ? LECCIONES.find((l) => l.slug === slug && l.publicado) : null;

  const accion = (clave) => {
    const destino = resolverDestino(clave);
    if (destino.estado === 'proximamente') return;
    tacto.abrir();
    if (destino.app === 'leccion') onAbrirLeccion(destino.slug);
    else onAccion(destino);
  };

  return (
    <View style={e.pantalla}>
      <View style={e.cab}>
        {leccion ? (
          <Pressable onPress={onVolver} style={({ pressed }) => [e.boton, pressed && e.pulsado]} hitSlop={8}
            accessibilityRole="button" accessibilityLabel="Volver a las lecciones">
            <Text style={e.botonTxt}>‹</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={e.cabEtiqueta}>RWAdar Academy</Text>
          <Text style={e.cabTitulo} numberOfLines={1} accessibilityRole="header">
            {leccion ? `Lección ${leccion.modulo} de ${LECCIONES.length}` : 'Lecciones'}
          </Text>
        </View>
        {/* Como pestaña no se cierra: se cambia de pestaña. */}
        {onCerrar ? (
          <Pressable onPress={onCerrar} style={({ pressed }) => [e.boton, pressed && e.pulsado]} hitSlop={8}
            accessibilityRole="button" accessibilityLabel="Cerrar RWAdar Academy">
            <Text style={e.cerrarTxt}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView ref={desplazamiento} contentContainerStyle={e.cuerpo}>
        {guardadoFallido ? (
          <Text style={e.aviso} accessibilityRole="alert">
            No se pudo guardar el progreso en este dispositivo. La lección se puede leer igual.
          </Text>
        ) : null}
        {leccion ? (
          <Leccion
            l={leccion}
            progreso={progreso}
            onAccion={accion}
            onMarcar={() => { tacto.seguir(); actualizar(alternarLeida(progreso, leccion.slug)); }}
            onTest={(aciertos, total) => actualizar(registrarTest(progreso, leccion.slug, aciertos, total))}
            onAbrirLeccion={onAbrirLeccion}
            onWeb={() => onAccion({ app: 'web', url: leccion.url })}
          />
        ) : (
          <Indice progreso={progreso} onAbrirLeccion={onAbrirLeccion} onExplicar={onExplicar} />
        )}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Índice                                                               */
/* ------------------------------------------------------------------ */
function Indice({ progreso, onAbrirLeccion, onExplicar }) {
  const leidas = PUBLICADAS.filter((l) => progreso.leidas.includes(l.slug)).length;
  return (
    <View>
      <Text style={e.sobrelinea}>{LECCIONES.length} LECCIONES · {NIVELES.length} NIVELES</Text>
      <Text style={e.titular}>Entiende la tokenización antes de decidir</Text>
      <Text style={e.entradilla}>
        Empieza viéndolo. Después, aprende qué compras, quién responde y qué condiciones tiene la salida.
      </Text>

      <Pressable onPress={() => { tacto.abrir(); onExplicar(); }}
        style={({ pressed }) => [e.extra, pressed && e.pulsado]}
        accessibilityRole="button" accessibilityLabel="Empezar tutorial 3D"
        accessibilityHint="Tutorial de Academy en cuatro pasos, también explicados en texto">
        <View style={e.extraCab}>
          <View style={e.extraIcono}><Text style={e.extraIconoTxt}>3D</Text></View>
          <Text style={e.extraEtiqueta}>Academy · tutorial guiado</Text>
        </View>
        <Text style={e.extraTit}>Mira cómo se tokeniza un edificio</Text>
        <Text style={e.extraSub}>El edificio sigue entero. Sus derechos se representan en participaciones que pueden cambiar de titular.</Text>
        <Text style={e.extraPasos}>Activo → Participaciones → Titulares → Transmisión</Text>
        <View style={e.extraAccion}>
          <Text style={e.extraAccionTxt}>Empezar tutorial 3D</Text>
          <Icono nombre="flecha" color={C.noche} tamano={18} />
        </View>
        <Text style={e.extraAlternativa}>Cuatro pasos, también en texto. A tu ritmo.</Text>
      </Pressable>

      <View style={e.progreso} accessible accessibilityLabel={`${leidas} de ${PUBLICADAS.length} lecciones leídas en este dispositivo`}>
        <View style={e.progresoBarra}>
          <View style={[e.progresoRelleno, { flex: leidas }]} />
          <View style={{ flex: Math.max(PUBLICADAS.length - leidas, 0) }} />
        </View>
        <Text style={e.progresoTxt}><Text style={e.negrita}>{leidas}</Text> de {PUBLICADAS.length} leídas en este dispositivo</Text>
      </View>

      {NIVELES.map((n, k) => {
        const lecciones = LECCIONES.filter((l) => l.nivel === n.id);
        return (
          <View key={n.id} style={e.nivel}>
            <Text style={e.sobrelinea}>Nivel {k + 1} · {n.lema}</Text>
            <Text style={e.nivelTit} accessibilityRole="header">{n.nombre}</Text>
            <Text style={e.nivelPregunta}>{n.pregunta}</Text>
            {lecciones.map((l) => (
              <Tarjeta key={l.slug} l={l} progreso={progreso} onPress={() => { tacto.abrir(); onAbrirLeccion(l.slug); }} />
            ))}
          </View>
        );
      })}

      <Text style={e.nota}>
        Accedes con tu cuenta. Tu progreso se guarda solo en este dispositivo, separado por cuenta; no se sincroniza. «Borrar datos del dispositivo» también lo borra.
      </Text>
      <AvisoLegal />
    </View>
  );
}

function Tarjeta({ l, progreso, onPress }) {
  const leida = progreso.leidas.includes(l.slug);
  const test = progreso.tests[l.slug];
  const estado = !l.publicado ? 'Próximamente'
    : [leida ? '✓ Leída' : '', test ? `Test ${test.aciertos}/${test.total}` : ''].filter(Boolean).join(' · ');
  const contenido = (
    <>
      <View style={e.tarjetaFila}>
        <Text style={[e.tarjetaNum, !l.publicado && e.apagado]}>{String(l.modulo).padStart(2, '0')}</Text>
        <Text style={e.tarjetaMeta}>{l.categoria} · {l.minutos} min</Text>
      </View>
      <Text style={[e.tarjetaTit, !l.publicado && e.tarjetaTitPronto]}>{l.titulo}</Text>
      {l.publicado ? <Text style={e.tarjetaResumen} numberOfLines={3}>{l.resumen}</Text> : null}
      {estado ? <Text style={[e.tarjetaEstado, !l.publicado && e.tarjetaEstadoPronto]}>{estado}</Text> : null}
    </>
  );
  if (!l.publicado) {
    return <View style={[e.tarjeta, e.tarjetaPronto]} accessible accessibilityLabel={`Lección ${l.modulo}: ${l.titulo}. Próximamente`}>{contenido}</View>;
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [e.tarjeta, pressed && e.pulsado]}
      accessibilityRole="button"
      accessibilityLabel={`Lección ${l.modulo}: ${l.titulo}. ${l.minutos} minutos.${estado ? ` ${estado}.` : ''}`}>
      {contenido}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Lección                                                              */
/* ------------------------------------------------------------------ */
function Leccion({ l, progreso, onAccion, onMarcar, onTest, onAbrirLeccion, onWeb }) {
  const nivel = nivelDe(l.nivel);
  const leida = progreso.leidas.includes(l.slug);
  const indice = LECCIONES.findIndex((x) => x.slug === l.slug);
  const anterior = LECCIONES[indice - 1];
  const siguiente = LECCIONES[indice + 1];

  return (
    <View>
      <Text style={e.sobrelinea}>Nivel {numeroNivel(l.nivel)} · {nivel.nombre} · {nivel.lema}</Text>
      <Text style={e.titular} accessibilityRole="header">{l.titulo}</Text>
      <View style={e.meta}>
        <Dato etiqueta="Lectura" valor={`${l.minutos} min`} />
        <Dato etiqueta="Categoría" valor={l.categoria} />
        <Dato etiqueta="Revisión legal" valor={l.revisionLegalTexto} />
        <Dato etiqueta="Jurisdicción" valor={l.jurisdiccion} />
      </View>
      {leida ? <Text style={e.leidaAviso}>✓ Marcaste esta lección como leída.</Text> : null}

      <Bloques bloques={l.preambulo} onAccion={onAccion} />

      <View style={e.tldr}>
        <Text style={e.tldrTit}>En 30 segundos</Text>
        {l.tldr.map((tramos, k) => (
          <View key={k} style={e.tldrFila}>
            <View style={e.tldrNum}><Text style={e.tldrNumTxt}>{k + 1}</Text></View>
            <Texto tramos={tramos} estilo={e.tldrTxt} onAccion={onAccion} />
          </View>
        ))}
      </View>

      <Bloques bloques={l.cuerpo} onAccion={onAccion} />

      <Text style={e.seccion} accessibilityRole="header">Glosario</Text>
      {l.glosario.map((g) => (
        <View key={g.termino} style={e.glosario}>
          <Text style={e.glosarioTermino}>{g.termino}</Text>
          <Texto tramos={g.definicion} estilo={e.parrafoMenor} onAccion={onAccion} />
        </View>
      ))}

      <Test key={l.slug} preguntas={l.quiz} onAccion={onAccion} onTerminar={onTest} />

      <View style={e.paso}>
        <Text style={e.sobrelinea}>Da el siguiente paso</Text>
        <Text style={e.pasoTit}>{l.siguientePaso.titulo}</Text>
        <Bloques bloques={l.siguientePaso.bloques} onAccion={onAccion} />
      </View>

      <Pressable onPress={onMarcar}
        style={({ pressed }) => [e.marcar, leida && e.marcarOn, pressed && e.pulsado]}
        accessibilityRole="button" accessibilityState={{ selected: leida }}>
        <Text style={[e.marcarTxt, leida && e.marcarTxtOn]}>{leida ? '✓ Leída · quitar la marca' : 'Marcar como leída'}</Text>
      </Pressable>

      <View style={e.vecinas}>
        {anterior ? <Vecina l={anterior} lado="anterior" onPress={() => onAbrirLeccion(anterior.slug)} /> : <View style={{ flex: 1 }} />}
        {siguiente ? <Vecina l={siguiente} lado="siguiente" onPress={() => onAbrirLeccion(siguiente.slug)} /> : <View style={{ flex: 1 }} />}
      </View>

      <AvisoLegal leccion={l} onAccion={onAccion} />
      <Text style={e.revision}>
        Contenido revisado el {l.revisionLegalTexto}. Jurisdicción de referencia: {l.jurisdiccion}.
      </Text>
      <Pressable onPress={onWeb} style={({ pressed }) => [e.web, pressed && e.pulsado]} accessibilityRole="link">
        <Text style={e.webTxt}>Abrir esta lección en la web ↗</Text>
      </Pressable>
    </View>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <View style={e.dato}>
      <Text style={e.datoEtiqueta}>{etiqueta}</Text>
      <Text style={e.datoValor}>{valor}</Text>
    </View>
  );
}

function Vecina({ l, lado, onPress }) {
  const etiqueta = lado === 'anterior' ? `← LECCIÓN ${l.modulo}` : `LECCIÓN ${l.modulo} →`;
  if (!l.publicado) {
    return (
      <View style={[e.vecina, e.vecinaPronto]}>
        <Text style={[e.vecinaEtiqueta, e.apagado]}>{etiqueta}</Text>
        <Text style={[e.vecinaEtiqueta, e.vecinaPronta]}>Próximamente</Text>
        <Text style={e.vecinaTit} numberOfLines={3}>{l.titulo}</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={() => { tacto.abrir(); onPress(); }} style={({ pressed }) => [e.vecina, pressed && e.pulsado]}
      accessibilityRole="button" accessibilityLabel={`${lado === 'anterior' ? 'Anterior' : 'Siguiente'}: lección ${l.modulo}, ${l.titulo}`}>
      <Text style={e.vecinaEtiqueta}>{etiqueta}</Text>
      <Text style={e.vecinaTit} numberOfLines={3}>{l.titulo}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Test                                                                 */
/* ------------------------------------------------------------------ */
function Test({ preguntas, onAccion, onTerminar }) {
  const [respuestas, setRespuestas] = useState({});
  const [abiertas, setAbiertas] = useState({});
  const contestadas = Object.keys(respuestas).length;
  const aciertos = preguntas.filter((p, k) => respuestas[k] === p.correcta).length;

  const responder = (k, opcion) => {
    if (respuestas[k] !== undefined) return;
    const siguiente = { ...respuestas, [k]: opcion };
    setRespuestas(siguiente);
    if (opcion === preguntas[k].correcta) tacto.seguir(); else tacto.soltar();
    if (Object.keys(siguiente).length === preguntas.length) {
      onTerminar(preguntas.filter((p, i) => siguiente[i] === p.correcta).length, preguntas.length);
    }
  };

  return (
    <View>
      <Text style={e.seccion} accessibilityRole="header">Comprueba lo que has aprendido</Text>
      <Text style={e.parrafoMenor}>
        {preguntas.length} preguntas. No hay nota ni se envía nada: al responder verás si has acertado y por qué.
      </Text>
      {preguntas.map((p, k) => {
        const elegida = respuestas[k];
        const respondida = elegida !== undefined;
        const acierto = elegida === p.correcta;
        const mostrar = respondida || abiertas[k];
        return (
          <View key={k} style={e.pregunta}>
            <Text style={e.preguntaNum}>Pregunta {k + 1} de {preguntas.length}</Text>
            <Texto tramos={p.enunciado} estilo={e.preguntaTxt} onAccion={onAccion} />
            {p.opciones.map((o, i) => {
              const esCorrecta = respondida && i === p.correcta;
              const esFallo = respondida && i === elegida && !acierto;
              return (
                <Pressable key={i} onPress={() => responder(k, i)} disabled={respondida}
                  style={({ pressed }) => [e.opcion, esCorrecta && e.opcionBien, esFallo && e.opcionMal, pressed && !respondida && e.pulsado]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: elegida === i, disabled: respondida }}
                  accessibilityLabel={`${LETRAS[i]}. ${o.map((t) => t.v || '').join('')}${esCorrecta ? '. Respuesta correcta' : esFallo ? '. Respuesta incorrecta' : ''}`}>
                  <View style={[e.letra, esCorrecta && e.letraBien, esFallo && e.letraMal]}>
                    <Text style={[e.letraTxt, (esCorrecta || esFallo) && e.letraTxtMarcada]}>{LETRAS[i]}</Text>
                  </View>
                  <Texto tramos={o} estilo={[e.opcionTxt, esCorrecta && e.opcionTxtBien]} onAccion={onAccion} />
                </Pressable>
              );
            })}
            {respondida ? (
              <Text style={[e.veredicto, acierto ? e.veredictoBien : e.veredictoMal]} accessibilityLiveRegion="polite">
                {acierto ? '✓ Correcto. Lee la explicación para fijarlo.' : `✕ No es esa. La correcta es la ${LETRAS[p.correcta]}: aquí tienes por qué.`}
              </Text>
            ) : null}
            {mostrar ? (
              <View style={e.explicacion}>
                <Text style={e.explicacionTit}>Respuesta correcta: {LETRAS[p.correcta]}.</Text>
                <Bloques bloques={p.explicacion} onAccion={onAccion} />
              </View>
            ) : (
              <Pressable onPress={() => setAbiertas({ ...abiertas, [k]: true })} style={e.verRespuesta}
                accessibilityRole="button" hitSlop={6}>
                <Text style={e.verRespuestaTxt}>Ver respuesta</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {contestadas === preguntas.length ? (
        <View style={e.resumen} accessibilityLiveRegion="polite">
          <Text style={e.resumenTxt}>
            Has acertado {aciertos} de {preguntas.length}.{aciertos === preguntas.length ? ' Lección dominada.' : ' Repasa las explicaciones de las que fallaste.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Aviso legal: el común sale de una sola fuente (aviso-legal.md)        */
/* ------------------------------------------------------------------ */
function AvisoLegal({ leccion, onAccion }) {
  return (
    <View style={e.legal}>
      <Text style={e.legalTit}>Aviso importante</Text>
      {AVISO_COMUN.map((tramos, k) => <Texto key={k} tramos={tramos} estilo={e.legalTxt} onAccion={onAccion} />)}
      {leccion && leccion.notaLegal.length ? (
        <View style={[e.legalPropio, leccion.avisoReforzado && e.legalReforzado]}>
          <Text style={[e.legalEtiqueta, leccion.avisoReforzado && e.legalEtiquetaReforzada]}>
            {leccion.avisoReforzado ? 'Aviso reforzado para esta lección' : 'Sobre esta lección'}
          </Text>
          {leccion.notaLegal.map((b, k) => (
            <Texto key={k} tramos={b.texto} estilo={[e.legalTxt, leccion.avisoReforzado && e.legalTxtReforzado]} onAccion={onAccion} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Bloques y texto                                                      */
/* ------------------------------------------------------------------ */
function Bloques({ bloques, onAccion }) {
  return bloques.map((b, k) => <Bloque key={k} b={b} onAccion={onAccion} />);
}

function Bloque({ b, onAccion }) {
  switch (b.t) {
    case 'p': {
      if (soloAcciones(b.texto)) {
        return <Acciones tramos={b.texto.filter((t) => t.a)} onAccion={onAccion} />;
      }
      const notas = [...new Set(b.texto.filter((t) => t.a).map((t) => resolverDestino(t.a).nota).filter(Boolean))];
      return (
        <View>
          <Texto tramos={b.texto} estilo={e.parrafo} onAccion={onAccion} />
          {notas.map((n) => <Text key={n} style={e.nota}>{n}</Text>)}
        </View>
      );
    }
    case 'h3': return <Text style={e.seccion} accessibilityRole="header">{b.texto.map((t) => t.v || '').join('')}</Text>;
    case 'h4': return <Text style={e.subseccion} accessibilityRole="header">{b.texto.map((t) => t.v || '').join('')}</Text>;
    case 'ul':
    case 'ol':
      return (
        <View style={e.lista}>
          {b.items.map((item, k) => (
            <View key={k} style={e.listaFila}>
              <Text style={e.listaMarca}>{b.t === 'ol' ? `${(b.inicio || 1) + k}.` : '•'}</Text>
              <Texto tramos={item} estilo={[e.parrafo, e.listaTxt]} onAccion={onAccion} />
            </View>
          ))}
        </View>
      );
    case 'tabla': return <Tabla b={b} onAccion={onAccion} />;
    case 'recuadro':
      return (
        <View style={[e.recuadro, b.tipo === 'aviso' ? e.recuadroAviso : e.recuadroIdea]}
          accessible={false}>
          <Text style={[e.recuadroTit, b.tipo === 'aviso' ? e.recuadroTitAviso : e.recuadroTitIdea]}>
            {b.tipo === 'aviso' ? '!  ' : '◆  '}{b.titulo}
          </Text>
          <Bloques bloques={b.bloques} onAccion={onAccion} />
        </View>
      );
    case 'cita': return <View style={e.cita}><Bloques bloques={b.bloques} onAccion={onAccion} /></View>;
    default: return null;
  }
}

function Tabla({ b, onAccion }) {
  const columnas = b.cabecera.length;
  const ancho = columnas <= 2 ? 160 : columnas === 3 ? 170 : 190;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={e.tabla} contentContainerStyle={e.tablaContenido}>
      <View>
        <View style={[e.tablaFila, e.tablaCab]}>
          {b.cabecera.map((c, k) => (
            <View key={k} style={[e.tablaCelda, { width: ancho }]}>
              <Text style={e.tablaCabTxt}>{c.map((t) => t.v || '').join('')}</Text>
            </View>
          ))}
        </View>
        {b.filas.map((fila, i) => (
          <View key={i} style={[e.tablaFila, i === b.filas.length - 1 && e.tablaFilaUltima]}>
            {fila.map((c, k) => (
              <View key={k} style={[e.tablaCelda, { width: ancho }]}>
                <Texto tramos={c} estilo={[e.tablaTxt, k === 0 && e.tablaTxtPrimera]} onAccion={onAccion} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Acciones({ tramos, onAccion }) {
  return (
    <View style={e.acciones}>
      {tramos.map((t, k) => {
        const destino = resolverDestino(t.a);
        if (destino.estado === 'proximamente') {
          return (
            <View key={k} style={e.accionPronto} accessible accessibilityLabel={`${destino.etiqueta}: próximamente`}>
              <Text style={e.accionProntoTxt}>{destino.etiqueta}</Text>
              <Text style={e.pronto} numberOfLines={1}>Próximamente</Text>
            </View>
          );
        }
        const texto = destino.estado === 'parcial' ? destino.etiqueta : t.v;
        return (
          <View key={k}>
            <Pressable onPress={() => onAccion(t.a)} style={({ pressed }) => [e.accion, pressed && e.pulsado]}
              accessibilityRole={destino.app === 'web' ? 'link' : 'button'}>
              <Text style={e.accionTxt}>{texto}{destino.app === 'web' ? ' ↗' : ' →'}</Text>
            </Pressable>
            {destino.nota ? <Text style={e.nota}>{destino.nota}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

/* Texto con negrita, cursiva, saltos de línea y enlaces de acción. */
function Texto({ tramos, estilo, onAccion }) {
  const partes = useMemo(() => tramos.map((t, k) => {
    if (t.br) return '\n';
    if (t.a) {
      const destino = resolverDestino(t.a);
      if (destino.estado === 'proximamente') {
        return <Text key={k} style={e.enlineaPronto}>{destino.etiqueta} (próximamente)</Text>;
      }
      const texto = destino.estado === 'parcial' ? destino.etiqueta : t.v;
      return (
        <Text key={k} style={e.enlinea} onPress={() => onAccion(t.a)} accessibilityRole="link">
          {texto}{destino.app === 'web' ? ' ↗' : ' →'}
        </Text>
      );
    }
    if (!t.b && !t.i) return t.v;
    // Si un tramo es negrita y cursiva a la vez, manda la negrita.
    return <Text key={k} style={[t.i && e.cursiva, t.b && e.negrita]}>{t.v}</Text>;
  }), [tramos, onAccion]);
  return <Text style={estilo}>{partes}</Text>;
}

/* ------------------------------------------------------------------ */
const e = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.noche },
  pulsado: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  cab: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: UI.margen, paddingVertical: 12,
    backgroundColor: C.noche2, borderBottomWidth: 1, borderBottomColor: C.linea2,
  },
  cabEtiqueta: { ...T.etiqueta, color: C.tx3 },
  cabTitulo: { ...T.ficha, color: C.tx, marginTop: 2 },
  boton: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sup2, borderWidth: 1, borderColor: C.linea2,
  },
  botonTxt: { fontFamily: F.media, fontSize: 26, lineHeight: 30, color: C.tx, marginTop: -2 },
  cerrarTxt: { fontFamily: F.media, fontSize: 15, color: C.tx2 },
  /* En tabletas el texto no se estira de lado a lado: columna de lectura. */
  cuerpo: { padding: UI.margen, paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' },
  aviso: { ...T.menor, color: C.aviso, backgroundColor: C.avisoT, padding: 10, borderRadius: R.m, marginBottom: 14 },

  sobrelinea: { ...T.etiqueta, color: C.tx3, marginBottom: 8 },
  titular: { ...T.titular, color: C.tx, marginBottom: 12 },
  entradilla: { ...T.cuerpo, fontSize: 15.5, lineHeight: 23, color: C.tx2, marginBottom: 16 },
  negrita: { fontFamily: F.semi, color: C.tx },
  /* Cursiva de verdad (Geist Italic), no la inclinada que fabrica el sistema. */
  cursiva: { fontFamily: F.cursiva },
  apagado: { color: C.tx3 },

  progreso: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.l, padding: 14, marginBottom: 12,
  },
  progresoBarra: { flexDirection: 'row', height: 8, borderRadius: 4, backgroundColor: C.sup3, overflow: 'hidden', marginBottom: 9 },
  progresoRelleno: { backgroundColor: C.senal },
  progresoTxt: { ...T.menor, color: C.tx2 },

  extra: {
    backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34,
    borderRadius: R.l, padding: 18, marginBottom: 18,
  },
  extraCab: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  extraIcono: { width: 44, height: 44, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center' },
  extraIconoTxt: { fontFamily: F.mono, fontSize: 13, color: C.noche },
  extraEtiqueta: { ...T.etiqueta, flex: 1, color: C.tx3 },
  extraTit: { ...T.seccion, color: C.tx, marginBottom: 8 },
  extraSub: { ...T.cuerpo, color: C.tx2 },
  extraPasos: { ...T.menor, color: C.senalCl, marginTop: 14, marginBottom: 16 },
  extraAccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, padding: 12, backgroundColor: C.senal, borderRadius: R.m },
  extraAccionTxt: { ...T.cuerpoFte, color: C.noche, flexShrink: 1 },
  extraAlternativa: { ...T.menor, color: C.tx2, marginTop: 10 },

  nivel: { marginTop: 26 },
  nivelTit: { ...T.seccion, color: C.tx },
  nivelPregunta: { ...T.cuerpoFte, color: C.tx2, marginTop: 3, marginBottom: 12 },
  tarjeta: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.l, padding: 15, marginBottom: 10,
  },
  tarjetaPronto: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: C.linea2 },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  tarjetaNum: { fontFamily: F.mono, fontSize: 18, color: C.senal },
  tarjetaMeta: { ...T.dato, fontSize: 12, color: C.tx3, flex: 1 },
  tarjetaTit: { ...T.ficha, fontSize: 16, color: C.tx },
  tarjetaTitPronto: { color: C.tx2 },
  tarjetaResumen: { ...T.menor, color: C.tx3, marginTop: 5 },
  tarjetaEstado: { ...T.menor, fontFamily: F.semi, color: C.senal, marginTop: 8 },
  tarjetaEstadoPronto: { color: C.aviso },

  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  dato: { backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.s, paddingHorizontal: 10, paddingVertical: 7 },
  datoEtiqueta: { ...T.etiqueta, color: C.tx3, marginBottom: 2 },
  datoValor: { ...T.menor, color: C.tx },
  leidaAviso: { ...T.menor, color: C.senal, marginBottom: 6 },

  tldr: {
    backgroundColor: '#0F1F18', borderWidth: 1, borderColor: C.senal34, borderRadius: R.l,
    padding: 16, marginTop: 8, marginBottom: 18,
  },
  tldrTit: { ...T.etiqueta, color: C.tx3, marginBottom: 12 },
  tldrFila: { flexDirection: 'row', gap: 11, marginBottom: 12 },
  tldrNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tldrNumTxt: { fontFamily: F.extra, fontSize: 13, color: C.noche },
  tldrTxt: { ...T.cuerpo, fontSize: 16, lineHeight: 25, color: '#D2CCC2', flex: 1 },

  seccion: { ...T.seccion, fontSize: 21, lineHeight: 26, color: C.tx, marginTop: 32, marginBottom: 12 },
  subseccion: { ...T.ficha, color: C.tx, marginTop: 14, marginBottom: 6 },
  /* Lectura larga: letra mayor, más interlineado y un gris más claro. */
  parrafo: { ...T.cuerpo, fontSize: 16.5, lineHeight: 27, letterSpacing: -0.05, color: '#D2CCC2', marginBottom: 15 },
  parrafoMenor: { ...T.cuerpo, color: C.tx2, marginBottom: 12 },
  nota: { ...T.menor, fontSize: 12, color: C.tx3, marginTop: -6, marginBottom: 12 },
  lista: { marginBottom: 6 },
  listaFila: { flexDirection: 'row', gap: 8 },
  listaMarca: { ...T.cuerpo, fontSize: 16.5, lineHeight: 27, color: C.senal, minWidth: 18 },
  listaTxt: { flex: 1, marginBottom: 8 },

  recuadro: { borderRadius: R.l, borderWidth: 1, padding: 14, paddingBottom: 2, marginBottom: 16 },
  recuadroIdea: { backgroundColor: C.senal10, borderColor: C.senal34 },
  recuadroAviso: { backgroundColor: 'rgba(255,170,64,0.09)', borderColor: 'rgba(255,170,64,0.34)' },
  recuadroTit: { fontFamily: F.negrita, fontSize: 15, lineHeight: 20, marginBottom: 9 },
  recuadroTitIdea: { color: C.senal },
  recuadroTitAviso: { color: '#FFAA40' },
  cita: { borderLeftWidth: 2, borderLeftColor: C.linea2, paddingLeft: 12, marginBottom: 12 },

  tabla: { marginBottom: 16, borderWidth: 1, borderColor: C.linea, borderRadius: R.m, backgroundColor: C.noche2 },
  tablaContenido: { flexGrow: 1 },
  tablaFila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.linea2 },
  tablaFilaUltima: { borderBottomWidth: 0 },
  tablaCab: { backgroundColor: C.sup },
  tablaCelda: { padding: 10 },
  tablaCabTxt: { ...T.etiqueta, color: C.tx3 },
  tablaTxt: { ...T.menor, color: C.tx2 },
  tablaTxtPrimera: { fontFamily: F.semi, color: C.tx },

  glosario: { backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.m, padding: 13, marginBottom: 8 },
  glosarioTermino: { ...T.cuerpoFte, fontFamily: F.negrita, color: C.tx, marginBottom: 4 },

  pregunta: { backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.l, padding: 14, marginBottom: 12 },
  preguntaNum: { ...T.etiqueta, color: C.tx3, marginBottom: 6 },
  preguntaTxt: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 15.5, lineHeight: 22, color: C.tx, marginBottom: 6 },
  opcion: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 11, minHeight: UI.tactil, marginTop: 8,
    borderRadius: R.m, borderWidth: 1, borderColor: C.linea, backgroundColor: C.noche2,
  },
  opcionBien: { borderColor: C.senal, backgroundColor: C.senal10 },
  opcionMal: { borderColor: C.coral, backgroundColor: C.coral10 },
  letra: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: C.linea2, alignItems: 'center', justifyContent: 'center' },
  letraBien: { backgroundColor: C.senal, borderColor: C.senal },
  letraMal: { backgroundColor: C.coral, borderColor: C.coral },
  letraTxt: { fontFamily: F.mono, fontSize: 12, color: C.tx2 },
  letraTxtMarcada: { color: C.noche },
  opcionTxt: { ...T.cuerpo, color: C.tx2, flex: 1 },
  opcionTxtBien: { color: C.tx },
  veredicto: { ...T.cuerpoFte, fontFamily: F.semi, marginTop: 12 },
  veredictoBien: { color: C.senal },
  veredictoMal: { color: C.coral },
  explicacion: { borderTopWidth: 1, borderTopColor: C.linea2, marginTop: 12, paddingTop: 10 },
  explicacionTit: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx, marginBottom: 6 },
  verRespuesta: { marginTop: 10, paddingVertical: 8, alignSelf: 'flex-start' },
  verRespuestaTxt: { ...T.menor, color: C.tx3, textDecorationLine: 'underline' },
  resumen: { backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34, borderRadius: R.l, padding: 14, marginBottom: 6 },
  resumenTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },

  paso: {
    backgroundColor: '#0F1F18', borderWidth: 1, borderColor: C.senal34, borderRadius: R.l,
    padding: 16, paddingBottom: 6, marginTop: 22, marginBottom: 16,
  },
  pasoTit: { ...T.seccion, fontSize: 19, lineHeight: 24, color: C.tx, marginBottom: 12 },
  acciones: { gap: 10, marginBottom: 14 },
  accion: {
    minHeight: UI.boton, borderRadius: R.m, backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  accionTxt: { fontFamily: F.negrita, fontSize: 15, color: C.noche, textAlign: 'center' },
  accionPronto: {
    minHeight: UI.tactil, borderRadius: R.m, borderWidth: 1, borderStyle: 'dashed', borderColor: C.linea2,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  accionProntoTxt: { fontFamily: F.semi, fontSize: 14.5, color: C.tx2, flexShrink: 1, textAlign: 'center' },
  pronto: {
    ...T.etiqueta, color: '#FFAA40', borderWidth: 1, borderColor: 'rgba(255,170,64,0.34)',
    borderRadius: R.p, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden', flexShrink: 0,
  },
  enlinea: { fontFamily: F.negrita, color: C.senal, textDecorationLine: 'underline' },
  enlineaPronto: { fontFamily: F.semi, color: C.tx },

  marcar: {
    minHeight: UI.boton, borderRadius: R.m, borderWidth: 1, borderColor: C.linea2, backgroundColor: C.sup,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  marcarOn: { borderColor: C.senal, backgroundColor: C.senal10 },
  marcarTxt: { fontFamily: F.semi, fontSize: 15, color: C.tx },
  marcarTxtOn: { color: C.senal },
  vecinas: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  vecina: { flex: 1, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.l, padding: 12, minHeight: 88 },
  vecinaPronto: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: C.linea2 },
  vecinaEtiqueta: { ...T.etiqueta, color: C.tx3, marginBottom: 6 },
  vecinaPronta: { color: C.aviso, marginTop: -3 },
  vecinaTit: { ...T.menor, fontFamily: F.semi, color: C.tx },

  legal: { borderTopWidth: 1, borderTopColor: C.linea2, paddingTop: 16, marginTop: 8 },
  legalTit: { ...T.etiqueta, color: C.tx3, marginBottom: 10 },
  legalTxt: { ...T.menor, fontSize: 12.5, lineHeight: 18.5, color: C.tx3, marginBottom: 9 },
  legalPropio: { borderWidth: 1, borderColor: C.linea, borderRadius: R.m, padding: 12, paddingBottom: 3, marginTop: 4, marginBottom: 6 },
  legalReforzado: { borderColor: 'rgba(255,170,64,0.34)', backgroundColor: 'rgba(255,170,64,0.08)' },
  legalEtiqueta: { ...T.etiqueta, color: C.tx2, marginBottom: 8 },
  legalEtiquetaReforzada: { color: '#FFAA40' },
  legalTxtReforzado: { color: '#F2CB94' },
  revision: { ...T.dato, fontSize: 12, lineHeight: 16, color: C.tx3, marginTop: 10, marginBottom: 14 },
  web: {
    minHeight: UI.tactil, borderRadius: R.m, borderWidth: 1, borderColor: C.linea2,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
  },
  webTxt: { fontFamily: F.semi, fontSize: 14, color: C.tx2 },
});
