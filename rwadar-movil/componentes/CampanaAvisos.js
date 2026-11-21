import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View, useIdioma } from './Idioma';
import { Icono } from './Navegacion';
import { C, F, R, T, UI } from '../lib/tema';
import { textoGlobo, etiquetaCampana, cargarAvisosPublicos } from '../lib/campana-avisos';
import { destinoAviso } from '../lib/avisos-cuenta';
import { retirarNotificacionesAvisos } from '../lib/avisos';
import { avisosPublicosLeidos, marcarAvisosPublicosLeidos } from '../lib/datos';

/* ---------------------------------------------------------------------
   Campana de avisos (21/11/2026)
   ---------------------------------------------------------------------
   - BotonCampana: en la cabecera, al lado del «?», con su mismo círculo y
     tamaño. Encima, un globo con los avisos sin leer (1-9, «9+»), solo si
     hay alguno.
   - PantallaAvisos: la lista que abre la campana, a pantalla completa y con
     su «Cerrar», como «Novedades de RWAdar». Cada aviso lleva «Abrir» si
     tiene a dónde llevar y, al final, «¿No quieres estos avisos?» hacia
     Perfil › Avisos.
   - useCampanaAvisos: abrirla es verlos (como un chat de WhatsApp): al
     abrirla se guardan como leídos, el globo baja a 0 y se quitan las
     notificaciones de RWAdar del sistema (con ellas, el número del icono de
     la app). Los puntos de «Sin leer» se quedan mientras siga abierta.
   - useAvisosPublicos: si la cuenta no tiene sus avisos encendidos, la
     campana enseña los públicos (los de la web sin sesión), con lo leído en
     este dispositivo y por cuenta (lib/datos.js).
   Sustituye a la tarjeta «Avisos» de Inicio y a su «Marcar como leídos».
   --------------------------------------------------------------------- */

const TEXTO_DESACTIVAR = '¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.';
const VACIA = 'Aquí verás las fichas nuevas del radar y las novedades de RWAdar.';
const ERROR_PUBLICOS = 'No se han podido cargar los avisos. Vuelve a intentarlo más tarde.';

export function BotonCampana({ noLeidos = 0, onPress }) {
  const idioma = useIdioma();
  const globo = textoGlobo(noLeidos);
  return (
    <Pressable onPress={onPress} testID="campanaAvisos"
      style={({ pressed }) => [s.boton, pressed && s.botonPulsado]}
      accessibilityRole="button" accessibilityLabel={etiquetaCampana(noLeidos, idioma)} hitSlop={4}>
      <Icono nombre="campana" color={C.tx} tamano={20} />
      {globo ? (
        <View style={s.globo} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
          testID="campanaGlobo">
          <Text noTraducir style={s.globoTxt}>{globo}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function fechaCorta(iso) {
  const fecha = new Date(iso);
  if (!iso || !Number.isFinite(fecha.getTime())) return '';
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/* La lista, sin el marco: `sinLeer` son los ids que estaban sin leer al
   abrirla (sus puntos se quedan aunque ya estén guardados como leídos). */
export function ListaAvisos({ avisos = [], sinLeer = [], cargando = false, error = '', onAbrir, onReintentar, onDesactivar }) {
  return (
    <View style={s.lista}>
      {avisos.map((aviso) => {
        const nuevo = sinLeer.includes(aviso.id);
        const destino = destinoAviso(aviso);
        return (
          <View key={aviso.id} style={[s.aviso, nuevo && s.avisoNuevo]} testID={`campanaAviso-${aviso.id}`}>
            <View style={[s.punto, !nuevo && s.puntoLeido]} accessible={false} />
            <View style={s.avisoCuerpo}>
              {nuevo ? <Text style={s.sinLeer}>Sin leer</Text> : null}
              <Text style={s.avisoTitulo} accessibilityRole="header">{aviso.titulo}</Text>
              <Text style={s.avisoTexto}>{aviso.texto}</Text>
              <View style={s.avisoPie}>
                {aviso.creadoEl ? <Text noTraducir style={s.fecha}>{fechaCorta(aviso.creadoEl)}</Text> : <View />}
                {destino ? (
                  <Pressable onPress={() => onAbrir?.(aviso)} accessibilityRole="button" accessibilityLabel="Abrir"
                    accessibilityHint={aviso.titulo} hitSlop={4} style={({ pressed }) => [s.abrir, pressed && s.pulsado]}>
                    <Text style={s.abrirTxt}>Abrir</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
      {!avisos.length && !cargando && !error ? <Text style={s.nota}>{VACIA}</Text> : null}
      {cargando && !avisos.length ? <ActivityIndicator color={C.senal} accessibilityLabel="Cargando tus avisos" /> : null}
      {error ? <Text style={s.nota} accessibilityRole="alert">{error}</Text> : null}
      {error && typeof onReintentar === 'function' ? (
        <Pressable onPress={onReintentar} accessibilityRole="button" accessibilityLabel="Reintentar"
          style={({ pressed }) => [s.abrir, s.reintentar, pressed && s.pulsado]}>
          <Text style={s.abrirTxt}>Reintentar</Text>
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

export function PantallaAvisos({ visible, avisos, sinLeer, cargando, error, onAbrir, onCerrar, onReintentar, onDesactivar }) {
  return (
    <Modal visible={!!visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCerrar}
      statusBarTranslucent={false} navigationBarTranslucent={false}>
      {visible ? (
        <SafeAreaProvider style={s.pantalla}>
          <SafeAreaView style={s.pantalla} edges={['top', 'right', 'bottom', 'left']} accessibilityViewIsModal testID="campanaPantalla">
            <View style={s.cab}>
              <Text style={s.cabTit} accessibilityRole="header" numberOfLines={1}>Avisos</Text>
              <Pressable onPress={onCerrar} testID="campanaCerrar" style={({ pressed }) => [s.cerrar, pressed && s.botonPulsado]}
                hitSlop={6} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Text noTraducir style={s.cerrarTxt}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={s.cuerpo}>
              <Text style={s.entradilla}>Fichas nuevas del radar y novedades de RWAdar.</Text>
              <ListaAvisos avisos={avisos} sinLeer={sinLeer} cargando={cargando} error={error}
                onAbrir={onAbrir} onReintentar={onReintentar} onDesactivar={onDesactivar} />
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      ) : null}
    </Modal>
  );
}

/* `fuente` es lo que devuelven useAvisosNovedades, useBandejaAvisos o
   useAvisosPublicos (avisos, leidos, idsNoLeidos, noLeidos, marcarLeidos,
   recargar), o null si no hay avisos que enseñar. */
export function useCampanaAvisos(fuente) {
  const [abierta, setAbierta] = useState(false);
  const [sinLeer, setSinLeer] = useState([]);
  const pendientes = fuente ? fuente.idsNoLeidos || [] : [];
  const clave = pendientes.join(',');
  /* Abierta, todo lo que esté sin leer se está viendo: al abrirla y cada vez
     que cambie lo pendiente (un aviso que llega, o una recarga que se cruzó
     con el guardado). Sus puntos se quedan mientras siga abierta. */
  useEffect(() => {
    if (!abierta || !pendientes.length) return;
    setSinLeer((antes) => [...new Set([...antes, ...pendientes])]);
    fuente?.marcarLeidos(pendientes);
  }, [abierta, clave]);
  function abrir() {
    if (!fuente) return;
    // Los puntos de «Sin leer» desde el primer fotograma (el efecto los mantiene).
    setSinLeer(fuente.idsNoLeidos || []);
    setAbierta(true);
    // Fuera también las notificaciones del sistema (y su número en el icono).
    void retirarNotificacionesAvisos();
  }
  function cerrar() {
    setAbierta(false);
    setSinLeer([]);
  }
  return { abierta, sinLeer, abrir, cerrar, noLeidos: fuente ? fuente.noLeidos || 0 : 0, activa: Boolean(fuente) };
}

/* Avisos públicos para la campana, con la misma forma que useBandejaAvisos.
   Sin usuarioId (interruptor apagado) no llama a nada. */
export function useAvisosPublicos({ usuarioId, cargar = cargarAvisosPublicos }) {
  const [vista, setVista] = useState({ avisos: [], leidos: [], cargando: false, errorCarga: '' });
  const turno = useRef(0);
  function actualizar(vuelta, cambios) {
    if (vuelta !== turno.current) return;
    setVista((antes) => ({ ...antes, ...(typeof cambios === 'function' ? cambios(antes) : cambios) }));
  }
  async function traer(vuelta) {
    actualizar(vuelta, { cargando: true, errorCarga: '' });
    const [avisos, leidos] = await Promise.allSettled([cargar(), avisosPublicosLeidos(usuarioId)]);
    actualizar(vuelta, { cargando: false,
      ...(avisos.status === 'fulfilled' ? { avisos: avisos.value } : { errorCarga: ERROR_PUBLICOS }),
      leidos: leidos.status === 'fulfilled' ? leidos.value : [] });
  }
  useEffect(() => {
    const vuelta = ++turno.current;
    setVista({ avisos: [], leidos: [], cargando: false, errorCarga: '' });
    if (!usuarioId) return undefined;
    traer(vuelta);
    return () => { turno.current += 1; };
  }, [usuarioId]);
  async function marcarLeidos(ids) {
    const vuelta = turno.current;
    if (!usuarioId || !Array.isArray(ids) || !ids.length) return;
    actualizar(vuelta, (antes) => ({ leidos: [...new Set([...ids, ...antes.leidos])] }));
    try {
      const leidos = await marcarAvisosPublicosLeidos(usuarioId, ids);
      actualizar(vuelta, { leidos });
    } catch { /* El punto volverá a salir la próxima vez. */ }
  }
  function recargar() {
    if (usuarioId) traer(turno.current);
  }
  const idsNoLeidos = vista.avisos.filter((aviso) => !vista.leidos.includes(aviso.id)).map((aviso) => aviso.id);
  return { ...vista, activo: Boolean(usuarioId), idsNoLeidos, noLeidos: idsNoLeidos.length,
    marcarLeidos, marcarTodosLeidos: () => marcarLeidos(idsNoLeidos), recargar };
}

/* Visto al estar en pantalla: llama a `onVisto` cuando la vista lleva
   `ms` (1,5 s) seguidos dentro de la ventana, midiendo cada `cada` ms. Vale
   en Android, iOS y la web (measureInWindow). `clave` vuelve a armarlo
   cuando cambia lo que enseña. */
/* «Visto» como en la web: la mitad de la sección o 160 dp a la vista, por
   encima de la barra de pestañas (margenInferior), durante ms seguidos. */
export function useVistoEnPantalla({ activo, clave = '', onVisto, ms = 1500, cada = 250, alto = () => Dimensions.get('window').height,
  margenInferior = 84 }) {
  const ref = useRef(null);
  const aviso = useRef(onVisto);
  aviso.current = onVisto;
  useEffect(() => {
    if (!activo) return undefined;
    // Medidas seguidas dentro de la ventana: con una fuera, se vuelve a empezar.
    let seguidas = 0, hecho = false;
    const necesarias = Math.max(1, Math.ceil(ms / cada));
    const reloj = setInterval(() => {
      const nodo = ref.current;
      if (hecho || !nodo || typeof nodo.measureInWindow !== 'function') return;
      nodo.measureInWindow((x, y, ancho, altura) => {
        if (hecho) return;
        const visible = Math.min(y + altura, alto() - margenInferior) - Math.max(y, 0);
        const dentro = altura > 0 && visible >= Math.min(160, altura / 2);
        seguidas = dentro ? seguidas + 1 : 0;
        if (seguidas >= necesarias) { hecho = true; clearInterval(reloj); aviso.current?.(); }
      });
    }, cada);
    return () => clearInterval(reloj);
  }, [activo, clave]);
  return ref;
}

const s = StyleSheet.create({
  // Como el «?» de la cabecera (accionCabecera de App.js).
  boton: { width: 44, height: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ton },
  botonPulsado: { backgroundColor: C.ton2 },
  globo: { position: 'absolute', top: -3, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: R.p,
    backgroundColor: C.coral, borderWidth: 1.5, borderColor: C.s0, alignItems: 'center', justifyContent: 'center' },
  globoTxt: { color: '#FFFFFF', fontFamily: F.semi, fontSize: 11, lineHeight: 13 },
  pantalla: { flex: 1, backgroundColor: C.noche },
  cab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: UI.margen, paddingRight: 8, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: C.bd },
  cabTit: { ...T.seccion, color: C.tx, flex: 1 },
  cerrar: { width: 44, height: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ton },
  cerrarTxt: { fontSize: 24, lineHeight: 26, color: C.tx },
  cuerpo: { paddingHorizontal: UI.margen, paddingTop: 14, paddingBottom: 48, maxWidth: 680, width: '100%', alignSelf: 'center' },
  entradilla: { ...T.menor, color: C.tx2, marginBottom: 12 },
  lista: { gap: 10 },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  avisoNuevo: { borderColor: C.senal },
  punto: { width: 10, height: 10, borderRadius: R.p, backgroundColor: C.senal, marginTop: 6 },
  puntoLeido: { backgroundColor: 'transparent' },
  avisoCuerpo: { flex: 1, minWidth: 0, gap: 4 },
  sinLeer: { ...T.etiqueta, color: C.senal },
  avisoTitulo: { ...T.cuerpoFte, color: C.tx },
  avisoTexto: { ...T.menor, color: C.tx2 },
  avisoPie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  fecha: { ...T.dato, color: C.tx3 },
  abrir: { minHeight: UI.tactil, borderRadius: R.m, justifyContent: 'center', paddingHorizontal: 12, marginRight: -8 },
  reintentar: { alignSelf: 'flex-start', marginRight: 0, marginLeft: -12 },
  abrirTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  pulsado: { opacity: 0.8 },
  nota: { ...T.menor, color: C.tx2 },
  enlaceBaja: { minHeight: UI.tactil, justifyContent: 'center', marginTop: 6 },
  enlace: { ...T.menor, color: C.senal, textDecorationLine: 'underline' },
});
