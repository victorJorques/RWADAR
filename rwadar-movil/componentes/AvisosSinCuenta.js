import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet } from 'react-native';
import { Pressable, Text, View, useIdioma } from './Idioma';
import { C, F, R, T, UI } from '../lib/tema';
import { crearAvisosSinCuenta } from '../lib/avisos-sin-cuenta';
import { capacidadPushNovedades, consultarPushNovedades, obtenerTokenNovedades } from '../lib/avisos';
import { avisosSinCuenta, guardarAvisosSinCuenta, borrarAvisosSinCuenta } from '../lib/datos';

/* ---------------------------------------------------------------------
   Notificaciones sin cuenta en la app (14/11/2026)
   ---------------------------------------------------------------------
   Encargo de la dirección: «muy importante que funcionen las notificaciones
   y los avisos aunque no tengan cuenta o no hayan iniciado sesión: que
   puedan activarlas». Va DENTRO de la pantalla de acceso (AccesoObligatorio,
   la única sin sesión), encima del formulario de la cuenta. Contrato:
   docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md; la lógica, sin React, en
   lib/avisos-sin-cuenta.js.
   - El texto del permiso lo da el servidor (GET /api/avisos/texto),
     versionado, y se enseña tal cual en el idioma de la app; con él, qué se
     guarda, quién interviene (el «latido» de Firebase, condición C5 del
     anexo legal) y la información básica.
   - «Activar notificaciones en este móvil»: permiso del sistema, token de
     Expo y alta en /api/avisos/movil con la versión y el idioma del texto.
   - Base apagada o sin la migración 36: «todavía no está disponible», sin
     pedir nada. Con la 1.4.1 (sin el componente nativo): llega con la 1.4.2.
   - Abierta desde una notificación sin sesión (`desdeNotificacion`): arriba,
     «¿No quieres estos avisos? Desactívalos aquí o en los ajustes del
     móvil.» con su botón (LSSI, art. 21.2; condición C7).
   - La renovación diaria la lanza App.js al abrir (gestorSinCuenta().renovar()).
   --------------------------------------------------------------------- */

const ALMACEN = { leer: avisosSinCuenta, guardar: guardarAvisosSinCuenta, borrar: borrarAvisosSinCuenta };
let compartido = null;
/* Uno para toda la app: activar, desactivar y renovar van de uno en uno. */
export function gestorSinCuenta() {
  if (!compartido) {
    compartido = crearAvisosSinCuenta({ almacen: ALMACEN, plataforma: Platform.OS,
      push: { capacidad: capacidadPushNovedades(), consultar: consultarPushNovedades, obtenerToken: obtenerTokenNovedades } });
  }
  return compartido;
}

export const TEXTOS_SIN_CUENTA = Object.freeze({
  etiqueta: 'Sin cuenta',
  titulo: 'Notificaciones en este móvil',
  baja: '¿No quieres estos avisos? Desactívalos aquí o en los ajustes del móvil.',
  // Qué se guarda, quién lo recibe y cuándo se borra (como TEXTO_MOVIL de la cuenta).
  movil: 'Al activarlas, el sistema te pedirá permiso. No hace falta cuenta: guardamos solo un identificador de entrega de este móvil (lo reciben Expo y Google), sin tu nombre ni tu correo. Se borra al desactivarlas o tras 180 días sin abrir la app.',
  // El «latido» de Firebase: el texto del anexo legal (2.4, condición C5) en su versión sin cuenta (2.6): sin «Inicio».
  quien: 'Con ellas activadas, el componente de notificaciones de Google (Firebase) envía también a Google las fechas en que abres la app (hasta 30) y datos técnicos del móvil, que usa para sus estadísticas. Si no las activas, no le llega nada.',
  // Primera capa de información (RGPD, art. 13), fuera del texto versionado.
  info: 'Información básica sobre tus datos (sin cuenta). Responsable: el titular de RWAdar, identificado en el aviso legal. Para qué: enviarte a este móvil las notificaciones de RWAdar (fichas nuevas y novedades). Base: tu consentimiento, que retiras cuando quieras. Datos: un identificador de entrega de este móvil, con la versión del texto, la fecha, el idioma y dónde las activaste; sin nombre ni correo. Proveedores: Supabase, Cloudflare, Expo y Google (Firebase); algunos tratan datos fuera de la UE con garantías. Plazos: hasta que las desactives o 180 días sin abrir la app. Derechos: como no sabemos quién eres, se ejercen desactivándolas aquí (RGPD, art. 11); también puedes escribir a rwadares@gmail.com o reclamar ante la AEPD. Más información en Privacidad.',
  activar: 'Activar notificaciones en este móvil',
  desactivar: 'Desactivar las notificaciones de este móvil',
  reintentar: 'Reintentar',
  ajustes: 'Abrir ajustes',
  privacidad: 'Leer privacidad',
  estados: Object.freeze({
    'requiere-version': 'Llegan con la versión 1.4.2 de la app. Mientras tanto, las novedades siguen en la web.',
    'no-disponible': 'Este dispositivo no puede recibir notificaciones de RWAdar.',
    comprobando: 'Comprobando las notificaciones de este móvil…',
    error: 'No hemos podido comprobar las notificaciones de este móvil. Revisa la conexión y pulsa Reintentar.',
    apagado: 'Las notificaciones sin cuenta todavía no están disponibles. Pronto podrás activarlas aquí.',
    activo: 'Activadas en este móvil, sin cuenta. Puedes desactivarlas aquí cuando quieras.',
    // Activadas con un texto anterior: no llegan hasta aceptar el nuevo (arriba).
    'texto-nuevo': 'Hemos cambiado el texto de las notificaciones. Léelo y vuelve a pulsar «Activar notificaciones en este móvil».',
    'sin-permiso': 'El sistema no permite notificaciones de RWAdar. Actívalas en los ajustes del móvil.',
    denegado: 'El sistema no permite notificaciones de RWAdar. Actívalas en los ajustes del móvil.',
  }),
  mensajes: Object.freeze({
    activadas: 'Notificaciones activadas en este móvil.',
    desactivadas: 'Notificaciones desactivadas en este móvil.',
    denegado: 'El sistema no permite notificaciones de RWAdar. Actívalas en los ajustes del móvil.',
    'sin-red': 'No hemos podido conectar para activarlas. Revisa la conexión y vuelve a intentarlo.',
    apagado: 'Las notificaciones sin cuenta todavía no están disponibles. Pronto podrás activarlas aquí.',
    version: 'Hemos cambiado el texto de las notificaciones. Léelo y vuelve a pulsar «Activar notificaciones en este móvil».',
    lleno: 'Ahora no se pueden activar más notificaciones. Vuelve a intentarlo más adelante.',
    cupo: 'Mucha gente está activándolas a la vez. Vuelve a intentarlo dentro de un rato.',
    error: 'No se pudieron activar las notificaciones en este móvil. Inténtalo más tarde.',
    bajaSinRed: 'No hemos podido confirmar la baja. Revisa la conexión y vuelve a intentarlo.',
  }),
});
const ENLACE_PRIVACIDAD = 'https://rwadar.pages.dev/privacidad#avisos-sin-cuenta';

function Boton({ texto, onPress, principal = false, deshabilitado = false }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={texto} disabled={deshabilitado}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [s.boton, principal && s.botonPrincipal, deshabilitado && s.deshabilitado, pressed && s.pulsado]}>
      <Text style={[s.botonTexto, principal && s.botonPrincipalTexto]}>{texto}</Text>
    </Pressable>
  );
}

/* `gestor` se inyecta en las pruebas; en la app, gestorSinCuenta(). */
export default function AvisosSinCuenta({ gestor = null, desdeNotificacion = false, onAbrirEnlace }) {
  const idioma = useIdioma() === 'en' ? 'en' : 'es';
  const g = useRef(null);
  if (!g.current) g.current = gestor || gestorSinCuenta();
  const [texto, setTexto] = useState(undefined);
  const [movil, setMovil] = useState({ estado: 'comprobando', activo: false });
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);

  async function cargar() {
    const gestorActual = g.current;
    let t = null;
    try { setMovil(await gestorActual.estado(undefined)); } catch { /* sigue */ }
    try { t = await gestorActual.texto(); } catch { t = null; }
    if (!vivo.current) return;
    setTexto(t);
    try { const m = await gestorActual.estado(t); if (vivo.current) setMovil(m); } catch { /* el último conocido */ }
  }
  useEffect(() => { cargar(); }, []);

  async function activar() {
    if (procesando || !texto) return;
    setProcesando(true); setMensaje(''); setError('');
    let r;
    // origen 'perfil': en la app (canal «movil» del historial) es el sitio fijo, esta primera pantalla sin sesión;
    // así lo dicen la privacidad (§6) y el registro de actividades (A5).
    try { r = await g.current.activar(texto, { idioma, origen: 'perfil' }); } catch { r = { ok: false, estado: 'error' }; }
    if (!vivo.current) return;
    if (r.ok) setMensaje(TEXTOS_SIN_CUENTA.mensajes.activadas);
    else setError(TEXTOS_SIN_CUENTA.mensajes[r.estado] || TEXTOS_SIN_CUENTA.mensajes.error);
    if (r.estado === 'version' || r.estado === 'apagado') {
      try { const t = await g.current.texto(); if (vivo.current) setTexto(t); } catch { /* sigue */ }
    }
    try { const m = await g.current.estado(texto); if (vivo.current) setMovil(m); } catch { /* sigue */ }
    if (vivo.current) setProcesando(false);
  }
  async function desactivar() {
    if (procesando) return;
    setProcesando(true); setMensaje(''); setError('');
    let r;
    try { r = await g.current.desactivar(); } catch { r = { ok: false }; }
    if (!vivo.current) return;
    if (r.ok) setMensaje(TEXTOS_SIN_CUENTA.mensajes.desactivadas);
    else setError(TEXTOS_SIN_CUENTA.mensajes.bajaSinRed);
    try { const m = await g.current.estado(texto); if (vivo.current) setMovil(m); } catch { /* sigue */ }
    if (vivo.current) setProcesando(false);
  }

  const estado = movil?.estado || 'comprobando';
  const permiso = texto && texto.texto ? texto.texto[idioma] : '';
  const puedeActivar = (estado === 'disponible' || estado === 'texto-nuevo') && !!texto?.activo;
  const conQuien = Platform.OS === 'android' && !['requiere-version', 'no-disponible'].includes(estado);
  const nota = estado === 'disponible' ? TEXTOS_SIN_CUENTA.movil : TEXTOS_SIN_CUENTA.estados[estado] || '';
  return (
    <View style={s.panel} testID="avisosSinCuenta" accessibilityLiveRegion="polite">
      {desdeNotificacion && movil?.activo ? (
        <Text style={s.baja} accessibilityRole="alert" testID="avisosSinCuentaBaja">{TEXTOS_SIN_CUENTA.baja}</Text>
      ) : null}
      <Text style={s.etiqueta}>{TEXTOS_SIN_CUENTA.etiqueta}</Text>
      <Text style={s.titulo} accessibilityRole="header">{TEXTOS_SIN_CUENTA.titulo}</Text>
      {permiso ? <Text noTraducir idiomaOriginal={idioma} style={s.permiso} testID="avisosSinCuentaTexto">{permiso}</Text> : null}
      {estado === 'comprobando' ? <ActivityIndicator color={C.senal} accessibilityLabel={TEXTOS_SIN_CUENTA.estados.comprobando} /> : null}
      {nota ? <Text style={s.nota}>{nota}</Text> : null}
      {puedeActivar ? <Boton principal texto={TEXTOS_SIN_CUENTA.activar} onPress={activar} deshabilitado={procesando} /> : null}
      {movil?.activo ? <Boton texto={TEXTOS_SIN_CUENTA.desactivar} onPress={desactivar} deshabilitado={procesando} /> : null}
      {estado === 'error' ? <Boton principal texto={TEXTOS_SIN_CUENTA.reintentar} onPress={cargar} deshabilitado={procesando} /> : null}
      {(estado === 'denegado' || estado === 'sin-permiso') ? (
        <Boton texto={TEXTOS_SIN_CUENTA.ajustes} onPress={() => { Linking.openSettings?.().catch?.(() => {}); }} />
      ) : null}
      {procesando ? <ActivityIndicator size="small" color={C.senal} /> : null}
      {mensaje ? <Text style={s.mensaje}>{mensaje}</Text> : null}
      {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
      {conQuien ? <Text style={s.nota}>{TEXTOS_SIN_CUENTA.quien}</Text> : null}
      <Text style={s.info}>{TEXTOS_SIN_CUENTA.info}</Text>
      {typeof onAbrirEnlace === 'function' ? (
        <Boton texto={TEXTOS_SIN_CUENTA.privacidad} onPress={() => onAbrirEnlace(ENLACE_PRIVACIDAD)} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  panel: { borderRadius: R.l, backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd, padding: 16, gap: 10 },
  baja: { ...T.menor, color: C.tx, backgroundColor: C.senal10, borderRadius: R.m, padding: 12 },
  etiqueta: { ...T.etiqueta, color: C.tx3 },
  titulo: { fontFamily: F.negrita, fontSize: 18, lineHeight: 24, color: C.tx },
  permiso: { ...T.cuerpo, fontSize: 15, lineHeight: 22, color: C.tx },
  nota: { ...T.menor, color: C.tx2 },
  info: { ...T.menor, fontSize: 12, lineHeight: 18, color: C.tx3 },
  mensaje: { ...T.menor, color: C.senalCl, backgroundColor: C.senal10, borderRadius: R.m, padding: 12 },
  error: { ...T.menor, color: C.alarma, backgroundColor: C.alarmaT, borderRadius: R.m, padding: 12 },
  boton: { minHeight: UI.tactil, borderRadius: R.m, backgroundColor: C.ton, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center' },
  botonPrincipal: { backgroundColor: C.senal },
  botonTexto: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx, textAlign: 'center' },
  botonPrincipalTexto: { color: C.enSenal },
  deshabilitado: { opacity: 0.6 },
  pulsado: { opacity: 0.8 },
});
