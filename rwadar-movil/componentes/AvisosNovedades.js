import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Pressable, Text, View } from './Idioma';
import { C, F, R, T, UI } from '../lib/tema';
import {
  INFO_BASICA_ES, TEXTO_AVISOS_ES, crearAvisosCuenta, crearGestorAvisosNovedades, quitarPushConCliente,
} from '../lib/avisos-cuenta';
import { capacidadPushNovedades, consultarPushNovedades, obtenerTokenNovedades } from '../lib/avisos';
import { obtenerIdioma } from '../lib/idioma';
import {
  avisosLeidos, marcarAvisosLeidos, tokenPushNovedades, guardarTokenPushNovedades, borrarTokenPushNovedades,
  renovacionPushNovedades, marcarRenovacionPushNovedades,
} from '../lib/datos';

/* ---------------------------------------------------------------------
   Avisos de novedades de la cuenta (contrato del 05/11/2026)
   ---------------------------------------------------------------------
   Solo se usa con AVISOS_NOVEDADES_REMOTOS encendido: App no llama al hook
   con una cuenta ni pinta estas piezas si está apagado.
   - Perfil › Avisos: «Avisos de novedades (correo y móvil)», que es el
     permiso, y «Notificaciones en este móvil», que pide permiso al sistema y
     registra este móvil. En binarios por debajo del código 24 (la 1.4.1) el
     segundo explica que llega con la 1.4.2 y no toca el SDK.
   - Inicio: tarjeta «Avisos» con los últimos y un punto de no leído,
     guardado en este dispositivo y por cuenta. Enseña los 3 primeros y
     «Ver todos (N)» despliega los demás cargados en la misma tarjeta. Debajo,
     «¿No quieres estos avisos?…» lleva a Perfil › Avisos.
   - Al cargar, si este móvil está activo, renueva su registro en la base
     como mucho una vez al día, sin pedir permiso (la base borra los que no
     se renuevan en 180 días).
   --------------------------------------------------------------------- */

const ALMACEN = {
  leidos: avisosLeidos, marcarLeidos: marcarAvisosLeidos, token: tokenPushNovedades,
  guardarToken: guardarTokenPushNovedades, borrarToken: borrarTokenPushNovedades,
  renovadoEl: renovacionPushNovedades, marcarRenovado: marcarRenovacionPushNovedades,
};

const MENSAJES = {
  novedadesOn: 'Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.',
  novedadesOff: 'Avisos de novedades desactivados. Ya no recibirás correos ni notificaciones de novedades.',
  desfasado: 'Para activarlos, actualiza la app: el texto del permiso ha cambiado.',
  error: 'No se pudo guardar el cambio. Comprueba la conexión e inténtalo de nuevo.',
  carga: 'No se pudieron cargar tus avisos. Desliza hacia abajo para reintentar.',
  movilOn: 'Notificaciones activadas en este móvil.',
  movilOff: 'Notificaciones desactivadas en este móvil.',
  denegado: 'El sistema no permite notificaciones de RWAdar. Actívalas en los ajustes del móvil.',
  movilError: 'No se pudieron activar las notificaciones en este móvil. Inténtalo más tarde.',
  noRegistrado: 'Este móvil ha dejado de recibir las notificaciones de RWAdar. Vuelve a activarlas para recibirlas.',
};

// Qué se guarda al activar «Notificaciones en este móvil», quién lo recibe y
// cuándo se borra (revisión legal del 06/11/2026).
const TEXTO_MOVIL = 'Al activarlas, el sistema te pedirá permiso. Guardamos en tu cuenta un identificador de este móvil para entregarte las notificaciones (lo reciben Expo y Google). Se borra al desactivarlas, al cerrar sesión con conexión, al borrar la cuenta o tras 180 días sin usar la app.';
// Enlace de baja de la tarjeta «Avisos» de Inicio.
const TEXTO_DESACTIVAR = '¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.';

const INICIAL = Object.freeze({ servidor: null, movil: null, avisos: [], leidos: [], cargando: false,
  errorCarga: '', procesando: '', mensaje: '', error: '' });

/* Quita este móvil de los avisos al cerrar sesión, con la sesión que se
   cierra. La llama el controlador de cuentas con plazo; si falla (sin
   conexión, plazo vencido), la salida sigue y el token se conserva bajo la
   clave de esa cuenta: se vuelve a intentar en la próxima salida de esa
   misma cuenta, al desactivarlas o al «Borrar datos del dispositivo» con ella
   dentro. Mientras tanto la base lo sigue teniendo a nombre de esa cuenta.
   Si entra otra, no puede quitarlo (quitar_aviso_push solo quita tokens
   propios) y la clave ajena no se toca: queda en la base hasta que la otra
   cuenta registre este mismo móvil (el último que lo registra se lo queda),
   hasta la limpieza de 180 días sin renovar o hasta que la primera vuelva,
   vea el móvil activo, como lo está en la base, y salga con conexión. */
export async function quitarPushAlSalir({ cliente, usuarioId }) {
  const token = await tokenPushNovedades(usuarioId);
  if (!token) return false;
  await quitarPushConCliente(cliente, token);
  await borrarTokenPushNovedades(usuarioId);
  return true;
}

export function useAvisosNovedades({ cuenta, usuarioId }) {
  const [vista, setVista] = useState(INICIAL);
  const gestor = useRef(null);
  const turno = useRef(0);
  function actualizar(vuelta, cambios) {
    if (vuelta !== turno.current) return;
    setVista((antes) => ({ ...antes, ...(typeof cambios === 'function' ? cambios(antes) : cambios) }));
  }
  async function cargar(g, vuelta) {
    actualizar(vuelta, { cargando: true, errorCarga: '' });
    const [perfil, recientes] = await Promise.allSettled([g.cargarPerfil(), g.cargarRecientes(10)]);
    // Renovación en segundo plano, sin tocar la pantalla. Si falla, ya se
    // intentará en otra carga u otro día.
    if (perfil.status === 'fulfilled' && perfil.value.movil?.estado === 'activo' && vuelta === turno.current) {
      g.renovarMovil(perfil.value.servidor, perfil.value.movil).catch(() => {});
    }
    actualizar(vuelta, {
      cargando: false,
      ...(perfil.status === 'fulfilled' ? perfil.value : {}),
      ...(recientes.status === 'fulfilled' ? recientes.value : {}),
      errorCarga: perfil.status === 'rejected' || recientes.status === 'rejected' ? MENSAJES.carga : '',
    });
  }

  useEffect(() => {
    const vuelta = ++turno.current;
    setVista(INICIAL);
    gestor.current = null;
    if (!cuenta || !usuarioId) return undefined;
    let avisosCuenta;
    try {
      avisosCuenta = crearAvisosCuenta({ cuenta, usuarioId });
      gestor.current = crearGestorAvisosNovedades({ avisosCuenta, usuarioId, almacen: ALMACEN,
        push: { capacidad: capacidadPushNovedades(), consultar: consultarPushNovedades, obtenerToken: obtenerTokenNovedades } });
    } catch {
      avisosCuenta?.destruir();
      return undefined;
    }
    const g = gestor.current;
    cargar(g, vuelta);
    return () => {
      turno.current += 1;
      if (gestor.current === g) gestor.current = null;
      avisosCuenta.destruir();
    };
  }, [cuenta, usuarioId]);

  async function alternarNovedades() {
    const g = gestor.current, vuelta = turno.current, servidor = vista.servidor;
    if (!g || vista.procesando || !servidor) return;
    const activar = !servidor.novedades;
    actualizar(vuelta, { procesando: 'novedades', mensaje: '', error: '' });
    try {
      // Con el permiso se guarda el idioma en que se ha visto su texto.
      const nuevo = await g.alternarNovedades(activar, servidor, obtenerIdioma());
      actualizar(vuelta, { servidor: nuevo, procesando: '', mensaje: activar ? MENSAJES.novedadesOn : MENSAJES.novedadesOff });
    } catch (error) {
      actualizar(vuelta, { procesando: '', error: error?.code === 'avisos_texto_desfasado' ? MENSAJES.desfasado : MENSAJES.error });
    }
  }

  async function alternarMovil() {
    const g = gestor.current, vuelta = turno.current, { servidor, movil } = vista;
    if (!g || vista.procesando || !servidor || !movil) return;
    actualizar(vuelta, { procesando: 'movil', mensaje: '', error: '' });
    let mensaje = '', error = '';
    try {
      if (movil.activo) {
        await g.desactivarMovil();
        mensaje = MENSAJES.movilOff;
      } else {
        const resultado = await g.activarMovil(servidor);
        if (resultado.ok) mensaje = MENSAJES.movilOn;
        else error = resultado.estado === 'denegado' ? MENSAJES.denegado : MENSAJES.movilError;
      }
    } catch {
      error = MENSAJES.error;
    }
    let nuevo = movil;
    try { nuevo = await g.estadoMovil(servidor); } catch { /* Se conserva el último estado conocido. */ }
    actualizar(vuelta, { movil: nuevo, procesando: '', mensaje, error });
  }

  async function marcarLeidos(ids) {
    const g = gestor.current, vuelta = turno.current;
    if (!g || !Array.isArray(ids) || !ids.length) return;
    // Se marca en pantalla aunque no se pueda guardar en el dispositivo.
    actualizar(vuelta, (antes) => ({ leidos: [...new Set([...ids, ...antes.leidos])] }));
    try {
      const leidos = await g.marcarLeidos(ids);
      actualizar(vuelta, { leidos });
    } catch { /* El punto volverá a salir la próxima vez. */ }
  }

  function recargar() {
    const g = gestor.current;
    if (g) cargar(g, turno.current);
  }

  /* Los avisos cargados (hasta 10) cuentan para la insignia de Inicio. La
     tarjeta enseña los primeros y «Ver todos (N)» despliega el resto, así que
     todo lo que cuenta la insignia se puede ver. «Marcar como leídos» los
     marca todos, para que la insignia siempre se pueda vaciar. */
  const idsNoLeidos = vista.avisos.filter((aviso) => !vista.leidos.includes(aviso.id)).map((aviso) => aviso.id);
  function marcarTodosLeidos() {
    return marcarLeidos(idsNoLeidos);
  }
  return { ...vista, activo: Boolean(cuenta && usuarioId), idsNoLeidos, noLeidos: idsNoLeidos.length,
    alternarNovedades, alternarMovil, marcarLeidos, marcarTodosLeidos, recargar };
}

function textoMovil(movil, servidor) {
  switch (movil?.estado) {
    case 'requiere-version':
      return 'Llegan con la versión 1.4.2 de la app. Mientras tanto, verás los avisos en Inicio.';
    case 'servicio-pendiente':
      return movil.activo
        ? 'Las notificaciones en el móvil están en pausa. Puedes desactivarlas aquí.'
        : 'Las notificaciones en el móvil todavía no están activas. Mientras tanto, verás los avisos en Inicio.';
    case 'no-disponible':
      return 'Este dispositivo no puede recibir notificaciones de RWAdar.';
    case 'no-registrado':
      return MENSAJES.noRegistrado;
    case 'disponible':
      return TEXTO_MOVIL;
    case 'activo':
      return servidor?.novedades
        ? 'Este móvil recibe las notificaciones de RWAdar.'
        : 'Este móvil solo recibe avisos de servicio, como la bienvenida. Activa «Avisos de novedades» para recibir también las novedades.';
    case 'sin-permiso':
    case 'denegado':
      return MENSAJES.denegado;
    default:
      return '';
  }
}

function Interruptor({ etiqueta, activo, deshabilitado, ocupado, onPress }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={etiqueta}
      accessibilityState={{ checked: activo === true, disabled: deshabilitado === true, busy: ocupado === true }}
      disabled={deshabilitado === true} onPress={onPress}
      style={({ pressed }) => [s.interruptor, deshabilitado && s.deshabilitado, pressed && s.pulsado]}>
      <View style={[s.casilla, activo && s.casillaMarcada]}>
        {activo ? <Text style={s.marca}>✓</Text> : null}
      </View>
      <Text style={s.interruptorTexto}>{etiqueta}</Text>
      {ocupado ? <ActivityIndicator size="small" color={C.senal} /> : null}
    </Pressable>
  );
}

function Boton({ texto, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={texto}
      style={({ pressed }) => [s.boton, pressed && s.pulsado]}>
      <Text style={s.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

/* Perfil › Avisos. `estado` es lo que devuelve useAvisosNovedades.
   `onPrivacidad`, si llega, abre la privacidad (segunda capa de la
   información básica). */
export function PanelAvisosNovedades({ estado, onAlternarNovedades, onAlternarMovil, onAjustes, onReintentar, onPrivacidad }) {
  const servidor = estado?.servidor, movil = estado?.movil;
  const procesando = estado?.procesando || '';
  if (!servidor) {
    return (
      <View style={s.panel} accessibilityLiveRegion="polite">
        <Text style={s.panelEtiqueta}>Tu cuenta</Text>
        <Text style={s.panelTitulo}>Avisos de novedades</Text>
        {estado?.errorCarga ? <>
          <Text style={s.error} accessibilityRole="alert">{estado.errorCarga}</Text>
          {onReintentar ? <Boton texto="Reintentar" onPress={onReintentar} /> : null}
        </> : <ActivityIndicator color={C.senal} accessibilityLabel="Cargando tus avisos" />}
      </View>
    );
  }
  const puedeMovil = movil ? (movil.activo ? movil.puedeDesactivar : movil.puedeActivar) : false;
  const notaMovil = textoMovil(movil, servidor);
  return (
    <View style={s.panel} accessibilityLiveRegion="polite">
      <Text style={s.panelEtiqueta}>Tu cuenta</Text>
      <Interruptor etiqueta="Avisos de novedades (correo y móvil)" activo={servidor.novedades}
        deshabilitado={!!procesando || (!servidor.novedades && !servidor.textoVigente)}
        ocupado={procesando === 'novedades'} onPress={onAlternarNovedades} />
      <Text style={s.permiso}>{TEXTO_AVISOS_ES}</Text>
      {!servidor.novedades && !servidor.textoVigente ? <Text style={s.nota}>{MENSAJES.desfasado}</Text> : null}
      {/* Primera capa de información, fuera del texto versionado del permiso. */}
      <Text style={s.nota}>{INFO_BASICA_ES}</Text>
      {onPrivacidad ? <Boton texto="Leer privacidad" onPress={onPrivacidad} /> : null}
      {!servidor.correoActivo && !servidor.pushActivo
        ? <Text style={s.nota}>El envío por correo y al móvil todavía no está activo. Mientras tanto, los avisos se ven en Inicio.</Text>
        : !servidor.correoActivo ? <Text style={s.nota}>El envío por correo todavía no está activo.</Text> : null}
      <View style={s.divisor} />
      <Interruptor etiqueta="Notificaciones en este móvil" activo={movil?.activo === true}
        deshabilitado={!!procesando || !puedeMovil} ocupado={procesando === 'movil'} onPress={onAlternarMovil} />
      {notaMovil ? <Text style={s.nota}>{notaMovil}</Text> : null}
      {/* Volver a activarlas vuelve a guardar el identificador: se explica igual. */}
      {movil?.estado === 'no-registrado' ? <Text style={s.nota}>{TEXTO_MOVIL}</Text> : null}
      {(movil?.estado === 'denegado' || movil?.estado === 'sin-permiso') && onAjustes
        ? <Boton texto="Abrir ajustes" onPress={onAjustes} /> : null}
      {estado.mensaje ? <Text style={s.mensaje}>{estado.mensaje}</Text> : null}
      {estado.error ? <Text style={s.error} accessibilityRole="alert">{estado.error}</Text> : null}
    </View>
  );
}

function fechaCorta(iso) {
  const fecha = new Date(iso);
  if (!Number.isFinite(fecha.getTime())) return '';
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/* Inicio › Avisos: los últimos, con un punto en los que no has abierto.
   Plegada enseña los `maximo` primeros; «Ver todos (N)» despliega todos los
   cargados dentro de la misma tarjeta y «Ver menos» la vuelve a plegar. El
   punto de la cabecera y «Marcar como leídos» cuentan todos los cargados,
   igual que la insignia de Inicio (`idsNoLeidos` de useAvisosNovedades):
   todo lo que cuenta se puede ver, y marcar deja la insignia a cero.
   `onDesactivar` (Perfil › Avisos) pinta debajo de la lista cómo dejar de
   recibirlos. */
export function TarjetaAvisosInicio({ avisos = [], leidos = [], cargando = false, error = '', maximo = 3,
  onAbrir, onMarcarLeidos, onDesactivar }) {
  const [verTodos, setVerTodos] = useState(false);
  const plegable = avisos.length > maximo;
  const plegada = plegable && !verTodos;
  const visibles = plegada ? avisos.slice(0, maximo) : avisos;
  const sinLeer = avisos.filter((aviso) => !leidos.includes(aviso.id));
  const ocultosSinLeer = plegada ? avisos.slice(maximo).filter((aviso) => !leidos.includes(aviso.id)).length : 0;
  const textoVer = plegada ? `Ver todos (${avisos.length})` : 'Ver menos';
  return (
    <View style={s.seccion}>
      <View style={s.cabecera}>
        <Text style={s.titulo} accessibilityRole="header">Avisos</Text>
        {sinLeer.length ? <View style={s.punto} accessible={false} /> : null}
      </View>
      {visibles.map((aviso) => {
        const nuevo = !leidos.includes(aviso.id);
        return (
          <Pressable key={aviso.id} onPress={() => onAbrir?.(aviso)} accessibilityRole="button"
            accessibilityLabel={aviso.titulo} accessibilityHint={nuevo ? 'Sin leer' : undefined}
            style={({ pressed }) => [s.aviso, pressed && s.avisoPulsado]}>
            <View style={[s.punto, s.puntoAviso, !nuevo && s.puntoLeido]} accessible={false} />
            <View style={s.avisoCuerpo}>
              <Text style={s.avisoTitulo}>{aviso.titulo}</Text>
              <Text style={s.avisoTexto} numberOfLines={3}>{aviso.texto}</Text>
              {aviso.creadoEl ? <Text noTraducir style={s.fecha}>{fechaCorta(aviso.creadoEl)}</Text> : null}
            </View>
          </Pressable>
        );
      })}
      {plegable ? (
        <Pressable onPress={() => setVerTodos((antes) => !antes)} accessibilityRole="button"
          accessibilityLabel={textoVer} accessibilityState={{ expanded: !plegada }}
          accessibilityHint={ocultosSinLeer ? `${ocultosSinLeer} sin leer` : undefined}
          style={({ pressed }) => [s.b3, pressed && s.pulsado]}>
          <Text style={s.b3Texto}>{textoVer}</Text>
        </Pressable>
      ) : null}
      {!visibles.length && !cargando && !error
        ? <Text style={s.nota}>Aquí verás las ofertas nuevas del radar y las novedades de RWAdar.</Text> : null}
      {cargando && !visibles.length ? <ActivityIndicator color={C.senal} accessibilityLabel="Cargando tus avisos" /> : null}
      {error ? <Text style={s.nota}>{error}</Text> : null}
      {sinLeer.length ? (
        <Pressable onPress={() => onMarcarLeidos?.(sinLeer.map((aviso) => aviso.id))} accessibilityRole="button"
          accessibilityLabel="Marcar como leídos" style={({ pressed }) => [s.b3, pressed && s.pulsado]}>
          <Text style={s.b3Texto}>Marcar como leídos</Text>
        </Pressable>
      ) : null}
      {typeof onDesactivar === 'function' ? (
        <Pressable onPress={onDesactivar} accessibilityRole="link" accessibilityLabel={TEXTO_DESACTIVAR}
          accessibilityHint="Abre Perfil › Avisos" style={({ pressed }) => [s.enlaceBaja, pressed && s.pulsado]}>
          <Text style={s.enlace}>{TEXTO_DESACTIVAR}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  panel: { borderRadius: R.l, backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd, padding: 16, gap: 10 },
  panelEtiqueta: { ...T.etiqueta, color: C.tx3 },
  panelTitulo: { ...T.cuerpoFte, color: C.tx },
  interruptor: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 12 },
  interruptorTexto: { ...T.cuerpoFte, color: C.tx, flex: 1 },
  casilla: { width: 25, height: 25, borderRadius: R.s, borderWidth: 1, borderColor: C.tx3, alignItems: 'center', justifyContent: 'center' },
  casillaMarcada: { backgroundColor: C.senal, borderColor: C.senal },
  marca: { color: C.enSenal, fontSize: 18, fontFamily: F.negrita },
  permiso: { ...T.menor, color: C.tx2 },
  nota: { ...T.menor, color: C.tx2 },
  mensaje: { ...T.menor, color: C.senalCl, backgroundColor: C.senal10, borderRadius: R.m, padding: 12 },
  error: { ...T.menor, color: C.alarma, backgroundColor: C.alarmaT, borderRadius: R.m, padding: 12 },
  divisor: { height: 1, backgroundColor: C.bd, marginVertical: 4 },
  boton: { minHeight: UI.tactil, borderRadius: R.m, backgroundColor: C.ton, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center' },
  botonTexto: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  deshabilitado: { opacity: 0.6 },
  pulsado: { opacity: 0.8 },
  // Como «Recién añadidas»: una sección más de Inicio.
  seccion: { marginTop: 28, paddingTop: 28, borderTopWidth: 1, borderTopColor: C.bd, gap: 10 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { ...T.seccion, color: C.tx },
  punto: { width: 10, height: 10, borderRadius: R.p, backgroundColor: C.senal },
  puntoAviso: { marginTop: 8 },
  puntoLeido: { backgroundColor: 'transparent' },
  aviso: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  avisoPulsado: { backgroundColor: C.s2 },
  avisoCuerpo: { flex: 1, gap: 4 },
  avisoTitulo: { ...T.cuerpoFte, color: C.tx },
  avisoTexto: { ...T.menor, color: C.tx2 },
  fecha: { ...T.dato, color: C.tx3 },
  b3: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, marginHorizontal: -8 },
  b3Texto: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  enlaceBaja: { minHeight: UI.tactil, justifyContent: 'center' },
  enlace: { ...T.menor, color: C.senal, textDecorationLine: 'underline' },
});
