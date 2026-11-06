import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Pressable, Text, TextInput, View, useIdioma } from './Idioma';
import { C, F, R, T, UI } from '../lib/tema';
import { INFO_BASICA_ES, TEXTO_AVISOS_ES } from '../lib/avisos-cuenta';

const PRIVACIDAD = 'https://rwadar.pages.dev/privacidad';
// Las condiciones están en la página de privacidad (la ruta /condiciones da 404).
const CONDICIONES = 'https://rwadar.pages.dev/privacidad#condiciones';
const TEXTO_EDAD = 'Tengo 18 años o más, acepto las condiciones y he leído la privacidad';

/* Validación de lectura, no autorización: el controlador y el servidor
   comprueban otra vez los datos y la identidad antes de cada operación. */
export function validarFormularioCuenta(vista, datos) {
  if (vista !== 'borrar' && vista !== 'perfil') {
    const correo = String(datos.correo || '').trim();
    if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return 'Escribe un correo válido.';
    }
  }
  if (['alta', 'entrar', 'borrar'].includes(vista) && !datos.clave) {
    return 'Escribe tu contraseña.';
  }
  if (vista === 'alta' && datos.clave.length < 12) {
    return 'Elige una contraseña de al menos 12 caracteres.';
  }
  if (['alta', 'perfil'].includes(vista) && (String(datos.nombre || '').trim().length > 60
    || /[\u0000-\u001f\u007f]/.test(String(datos.nombre || '')))) {
    return 'Usa un nombre de hasta 60 caracteres, sin saltos de línea.';
  }
  if (vista === 'alta' && datos.acepta !== true) {
    return 'Confirma que tienes 18 años o más, que aceptas las condiciones y que has leído la privacidad.';
  }
  if (vista === 'borrar' && datos.confirmacion !== 'BORRAR') {
    return 'Escribe BORRAR para confirmar la baja.';
  }
  return '';
}

function Boton({ texto, onPress, secundario = false, peligro = false, deshabilitado = false, cargando = false }) {
  return (
    <Pressable
      onPress={onPress} disabled={deshabilitado || cargando}
      accessibilityRole="button" accessibilityLabel={texto}
      accessibilityState={{ disabled: deshabilitado || cargando, busy: cargando }}
      style={({ pressed }) => [s.boton, secundario && s.botonSecundario, peligro && s.botonPeligro,
        (deshabilitado || cargando) && s.deshabilitado, pressed && s.pulsado]}
    >
      {cargando ? <ActivityIndicator size="small" color={secundario || peligro ? C.tx : C.noche} /> : null}
      <Text style={[s.botonTexto, secundario && s.botonTextoSecundario, peligro && s.botonTextoPeligro]}>{texto}</Text>
    </Pressable>
  );
}

function Campo({ etiqueta, referencia, ...props }) {
  return (
    <View style={s.campo}>
      <Text style={s.etiquetaCampo}>{etiqueta}</Text>
      <TextInput ref={referencia} style={s.entrada} placeholderTextColor={C.tx3}
        accessibilityLabel={etiqueta} {...props} />
    </View>
  );
}

/* avisosNovedades: interruptor AVISOS_NOVEDADES_REMOTOS. Apagado, el alta y
   el perfil envían exactamente lo de antes y no enseñan la casilla ni la
   información básica de los avisos. Con o sin él, las condiciones abren
   /privacidad#condiciones y borrar la cuenta explica que se van también los
   avisos (revisión legal del 06/11/2026). */
export default function Cuenta({ controlador, estado, seguridad, plataformas = [], onAbrirEmpresa, onAbrirEnlace,
  avisosNovedades = false }) {
  // Idioma en que se ve la casilla de avisos: se guarda con el permiso.
  const idioma = useIdioma();
  const [vista, setVista] = useState('entrar');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [nombre, setNombre] = useState('');
  const [acepta, setAcepta] = useState(false);
  // Casilla aparte y sin marcar: la Academy y la cuenta no dependen de ella.
  const [avisos, setAvisos] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [editarNombre, setEditarNombre] = useState(false);
  const claveInput = useRef(null);
  const nombreInput = useRef(null);
  const vigente = useRef(true);
  const turno = useRef(0);
  const bloqueado = estado?.procesando === true;
  const autenticada = estado?.estado === 'autenticada' && !!estado?.usuario;

  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
      turno.current += 1;
      controlador.cancelar();
    };
  }, [controlador]);
  useEffect(() => {
    setClave(''); setConfirmacion(''); setEditarNombre(false);
    setSelectorAbierto(false); setBusqueda('');
    if (autenticada) { setVista('entrar'); setErrorLocal(''); }
  }, [estado?.usuario?.id]);
  useEffect(() => {
    if (estado?.estado === 'confirmacion') setVista('confirmacion');
  }, [estado?.estado]);

  function cambiarVista(siguiente) {
    turno.current += 1;
    controlador.cancelar();
    Keyboard.dismiss();
    setClave(''); setConfirmacion(''); setErrorLocal('');
    setEditarNombre(false); setVista(siguiente);
  }

  async function ejecutar(accion, datos = {}, alTerminar) {
    if (bloqueado) return;
    setErrorLocal('');
    Keyboard.dismiss();
    // La contraseña no queda en el formulario durante una petición ni al
    // volver a Perfil. Solo el controlador la recibe para esta operación.
    setClave('');
    const actual = ++turno.current;
    try {
      const resultado = await controlador[accion](datos);
      if (!vigente.current || actual !== turno.current) return;
      if (resultado?.ok && alTerminar) alTerminar();
    } catch {
      if (vigente.current && actual === turno.current) {
        setErrorLocal('No se pudo completar la operación. Comprueba la conexión e inténtalo de nuevo.');
      }
    }
  }

  function enviarFormulario() {
    const datos = { correo, clave, nombre, acepta, confirmacion };
    const error = validarFormularioCuenta(vista, datos);
    if (error) { setErrorLocal(error); return; }
    if (vista === 'alta') {
      ejecutar('registrar', { correo, clave, nombre, aceptaCondiciones: acepta,
        ...(avisosNovedades === true ? { avisosNovedades: avisos === true, idioma: idioma === 'en' ? 'en' : 'es' } : {}) },
      () => setVista('confirmacion'));
    } else if (vista === 'recuperar') {
      ejecutar('recuperar', { correo });
    } else if (vista === 'borrar') {
      ejecutar('borrarCuenta', { clave, confirmacion }, () => { setConfirmacion(''); setVista('entrar'); });
    } else {
      ejecutar('entrar', { correo, clave });
    }
  }

  if (!estado?.disponible) {
    return (
      <View style={s.tarjeta}>
        <Text style={s.kicker}>Tu cuenta</Text>
        <Text style={s.titulo} accessibilityRole="header">Cuentas en preparación</Text>
        <Text style={s.parrafo}>
          El acceso requiere una cuenta confirmada. Ahora no podemos preparar la conexión: inténtalo de nuevo más tarde.
        </Text>
      </View>
    );
  }

  const error = errorLocal || estado.error;
  const mensaje = estado.mensaje;
  const confirmando = !autenticada && vista === 'confirmacion';
  const vigiladas = Array.isArray(estado.vigiladas) ? estado.vigiladas : [];
  const nombres = new Set(vigiladas.map((p) => p.nombre));
  const disponibles = plataformas.filter((p) => p.nombre && !nombres.has(p.nombre)
    && p.nombre.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es')));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.tarjeta}>
      <Text style={s.kicker}>{autenticada ? 'Tu cuenta · web y app' : 'Tu espacio en RWAdar'}</Text>
      <Text style={s.titulo} accessibilityRole="header">
        {autenticada ? (vista === 'borrar' ? 'Borrar mi cuenta' : 'Tu perfil')
          : confirmando ? 'Confirma tu correo'
            : vista === 'alta' ? 'Crea tu cuenta'
              : vista === 'recuperar' ? 'Recupera tu acceso' : 'Entra en tu cuenta'}
      </Text>

      {error ? <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text> : null}
      {mensaje ? <Text style={s.mensaje} accessibilityLiveRegion="polite">{mensaje}</Text> : null}

      {autenticada && vista !== 'borrar' ? (
        <>
          <Text noTraducir={Boolean(estado.perfil?.nombre)} idiomaOriginal="es-ES" style={s.nombre}>{estado.perfil?.nombre || 'Miembro de RWAdar'}</Text>
          <Text noTraducir idiomaOriginal="es-ES" style={s.parrafo} selectable>{estado.usuario.correo}</Text>
          <Text style={s.nota}>La misma cuenta funciona en la web y en la app. Tu sesión se guarda de forma segura en este dispositivo. Puedes cerrarla cuando quieras y añadir el desbloqueo con la seguridad del móvil.</Text>
          {editarNombre ? (
            <View style={s.bloque}>
              <Campo etiqueta="Nombre (opcional)" value={nombre} onChangeText={setNombre}
                maxLength={60} autoCapitalize="words" autoComplete="name" editable={!bloqueado} />
              <Boton texto="Guardar nombre" cargando={bloqueado && estado.accion === 'perfil'} deshabilitado={bloqueado}
                onPress={() => {
                  const e = validarFormularioCuenta('perfil', { nombre });
                  if (e) setErrorLocal(e);
                  else ejecutar('guardarPerfil', { nombre }, () => setEditarNombre(false));
                }} />
              <Boton texto="Cancelar edición" secundario onPress={() => { cambiarVista('entrar'); }} />
            </View>
          ) : <Boton texto="Editar nombre" secundario deshabilitado={bloqueado}
            onPress={() => { setNombre(estado.perfil?.nombre || ''); setEditarNombre(true); setErrorLocal(''); }} />}

          {seguridad ? <View style={s.bloque}>
            <Pressable accessibilityRole="switch" accessibilityLabel="Desbloquear con la seguridad del móvil"
              accessibilityState={{ checked: seguridad.activado === true,
                disabled: bloqueado || seguridad.preparando || seguridad.ocupado, busy: seguridad.ocupado === true }}
              disabled={bloqueado || seguridad.preparando || seguridad.ocupado}
              onPress={() => seguridad.activar(!seguridad.activado)}
              style={({ pressed }) => [s.aceptacion, pressed && s.pulsado]}>
              <View style={[s.casilla, seguridad.activado && s.casillaMarcada]}>
                {seguridad.activado ? <Text style={s.marca}>✓</Text> : null}
              </View>
              <Text style={s.aceptacionTexto}>Desbloquear con la seguridad del móvil</Text>
            </Pressable>
            <Text style={s.nota}>Usa la huella, el reconocimiento facial o el PIN que ya tengas en el móvil. RWAdar no crea ni guarda un PIN.</Text>
            {seguridad.mensaje ? <Text style={s.nota} accessibilityLiveRegion="polite">{seguridad.mensaje}</Text> : null}
          </View> : null}

          <View style={s.divisor} />
          <Text style={s.subtitulo} accessibilityRole="header">Lista de seguimiento · {vigiladas.length}</Text>
          <Text style={s.nota}>{avisosNovedades
            ? 'Estas empresas se sincronizan con tu cuenta. No son inversiones ni activan avisos sobre cada empresa.'
            : 'Estas empresas se sincronizan con tu cuenta. No son inversiones ni activan avisos por correo.'}</Text>
          {vigiladas.length ? vigiladas.map((p) => {
            const empresa = plataformas.find((item) => item.nombre === p.nombre);
            return (
              <View key={p.id || p.nombre} style={s.vigilada}>
                <Pressable onPress={() => empresa && onAbrirEmpresa(empresa)} disabled={!empresa}
                  accessibilityRole="button" accessibilityLabel={`Ver ${p.nombre}`}
                  accessibilityState={{ disabled: !empresa }} style={s.empresa}>
                  <Text noTraducir idiomaOriginal="es-ES" style={s.empresaNombre}>{p.nombre}</Text>
                  <Text style={s.nota}>{empresa ? 'Ver ficha' : 'No está en el catálogo actual'}</Text>
                </Pressable>
                <Boton texto={`Quitar ${p.nombre}`} secundario deshabilitado={bloqueado}
                  onPress={() => ejecutar('alternarVigilancia', p.nombre)} />
              </View>
            );
          }) : <Text style={s.parrafo}>Todavía no has añadido ninguna empresa.</Text>}
          <Boton texto={selectorAbierto ? 'Cerrar selector' : 'Añadir una empresa'} secundario deshabilitado={bloqueado}
            onPress={() => { setSelectorAbierto(!selectorAbierto); setBusqueda(''); }} />
          {selectorAbierto ? (
            <View style={s.bloque}>
              <Campo etiqueta="Buscar empresa para seguir" value={busqueda} onChangeText={setBusqueda}
                autoCapitalize="none" returnKeyType="search" maxLength={100} editable={!bloqueado} />
              {disponibles.length ? disponibles.slice(0, 8).map((p) => (
                <Boton key={p.slug || p.nombre} texto={`Seguir ${p.nombre}`} secundario deshabilitado={bloqueado}
                  onPress={() => ejecutar('alternarVigilancia', p.nombre)} />
              )) : <Text style={s.nota}>No hay empresas nuevas que coincidan con esa búsqueda.</Text>}
              {disponibles.length > 8 ? <Text style={s.nota}>Mostramos 8 de {disponibles.length}. Escribe un nombre para filtrar la lista.</Text> : null}
            </View>
          ) : null}
          <Boton texto="Actualizar mi lista" secundario deshabilitado={bloqueado}
            cargando={bloqueado && estado.accion === 'refrescar'} onPress={() => ejecutar('refrescar')} />
          <View style={s.divisor} />
          <Boton texto="Cerrar sesión" secundario deshabilitado={bloqueado}
            cargando={bloqueado && estado.accion === 'salir'} onPress={() => ejecutar('salir')} />
          <Boton texto="Borrar mi cuenta" secundario peligro deshabilitado={bloqueado} onPress={() => cambiarVista('borrar')} />
        </>
      ) : autenticada && vista === 'borrar' ? (
        <>
          <Text style={s.parrafo}>Borrar la cuenta elimina tu perfil, tu lista de seguimiento, tu registro de inversiones y tus avisos (permiso y móviles registrados; el historial del permiso queda bloqueado 3 años solo para atender reclamaciones). No borra los favoritos locales ni el progreso de Academy. No se puede deshacer.</Text>
          <Campo etiqueta="Contraseña actual" referencia={claveInput} value={clave} onChangeText={setClave}
            secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password"
            textContentType="password" editable={!bloqueado} maxLength={256} />
          <Campo etiqueta="Escribe BORRAR" value={confirmacion} onChangeText={setConfirmacion}
            autoCapitalize="characters" autoCorrect={false} maxLength={6} editable={!bloqueado}
            returnKeyType="done" onSubmitEditing={enviarFormulario} />
          <Boton texto="Confirmar borrado de cuenta" peligro cargando={bloqueado} deshabilitado={bloqueado}
            onPress={enviarFormulario} />
          <Boton texto="Cancelar borrado" secundario onPress={() => cambiarVista('entrar')} />
        </>
      ) : confirmando ? (
        <>
          <Text style={s.parrafo}>Abre el mensaje de confirmación en tu correo y pulsa el enlace de RWAdar. Comprueba también la carpeta de spam.</Text>
          <Text style={s.nota}>El enlace se abre en la web. Después vuelve a la app y entra con tu correo y contraseña. Nunca compartas el enlace de confirmación.</Text>
          <Campo etiqueta="Correo para reenviar la confirmación" value={correo} onChangeText={setCorreo}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
            textContentType="emailAddress" maxLength={254} editable={!bloqueado} />
          <Boton texto="Reenviar confirmación" secundario cargando={bloqueado} deshabilitado={bloqueado}
            onPress={() => {
              const e = validarFormularioCuenta('recuperar', { correo });
              if (e) setErrorLocal(e); else ejecutar('reenviar', { correo });
            }} />
          <Boton texto="Ya confirmé: entrar" onPress={() => cambiarVista('entrar')} />
          <Boton texto="Usar otro correo" secundario onPress={() => cambiarVista('alta')} />
        </>
      ) : (
        <>
          <Text style={s.parrafo}>{vista === 'alta'
            ? 'Tu cuenta es gratuita. Confirma el correo para entrar en RWAdar y guardar tu lista de seguimiento.'
            : vista === 'recuperar'
              ? 'Te enviaremos un enlace para elegir una contraseña nueva en la web. Después vuelve y entra en la app.'
              : 'Entra con el mismo correo y contraseña que en la web para acceder a RWAdar.'}</Text>
          <Campo etiqueta="Correo" value={correo} onChangeText={setCorreo} keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
            maxLength={254} editable={!bloqueado} returnKeyType={vista === 'recuperar' ? 'send' : 'next'}
            onSubmitEditing={() => vista === 'recuperar' ? enviarFormulario() : claveInput.current?.focus()} />
          {vista !== 'recuperar' ? (
            <Campo etiqueta={vista === 'alta' ? 'Contraseña · mínimo 12 caracteres' : 'Contraseña'} referencia={claveInput}
              value={clave} onChangeText={setClave} secureTextEntry autoCapitalize="none" autoCorrect={false}
              autoComplete={vista === 'alta' ? 'new-password' : 'current-password'}
              textContentType={vista === 'alta' ? 'newPassword' : 'password'} maxLength={256}
              editable={!bloqueado} returnKeyType={vista === 'alta' ? 'next' : 'go'}
              onSubmitEditing={() => vista === 'entrar' ? enviarFormulario() : nombreInput.current?.focus()} />
          ) : null}
          {vista === 'alta' ? (
            <>
              <Campo etiqueta="Nombre (opcional)" referencia={nombreInput} value={nombre} onChangeText={setNombre}
                autoCapitalize="words" autoComplete="name" maxLength={60} editable={!bloqueado}
                returnKeyType="done" onSubmitEditing={enviarFormulario} />
              <Pressable onPress={() => setAcepta(!acepta)} disabled={bloqueado} style={s.aceptacion}
                accessibilityRole="checkbox" accessibilityLabel={TEXTO_EDAD}
                accessibilityState={{ checked: acepta, disabled: bloqueado }}>
                <View style={[s.casilla, acepta && s.casillaMarcada]}><Text style={s.marca}>{acepta ? '✓' : ''}</Text></View>
                <Text style={s.aceptacionTexto}>{`${TEXTO_EDAD}.`}</Text>
              </Pressable>
              {avisosNovedades ? (
                <Pressable onPress={() => setAvisos(!avisos)} disabled={bloqueado} style={s.aceptacion}
                  accessibilityRole="checkbox" accessibilityLabel={TEXTO_AVISOS_ES}
                  accessibilityState={{ checked: avisos, disabled: bloqueado }}>
                  <View style={[s.casilla, avisos && s.casillaMarcada]}><Text style={s.marca}>{avisos ? '✓' : ''}</Text></View>
                  <Text style={s.aceptacionTexto}>{TEXTO_AVISOS_ES}</Text>
                </Pressable>
              ) : null}
              {/* Primera capa de información, fuera del texto versionado del permiso. */}
              {avisosNovedades ? <Text style={s.nota}>{INFO_BASICA_ES}</Text> : null}
              <View style={s.enlaces}>
                <Boton texto="Leer condiciones" secundario onPress={() => onAbrirEnlace(CONDICIONES)} />
                <Boton texto="Leer privacidad" secundario onPress={() => onAbrirEnlace(PRIVACIDAD)} />
              </View>
              <Text style={s.nota}>{avisosNovedades
                ? 'Crear la cuenta no te suscribe a publicidad. Los avisos de novedades solo llegan si marcas su casilla y confirmas el correo. Tendrás que confirmar el correo antes de entrar.'
                : 'No te suscribes a publicidad ni a avisos. Tendrás que confirmar el correo antes de entrar.'}</Text>
            </>
          ) : null}
          <Boton texto={vista === 'alta' ? 'Crear cuenta' : vista === 'recuperar' ? 'Enviar enlace de recuperación' : 'Entrar'}
            cargando={bloqueado} deshabilitado={bloqueado} onPress={enviarFormulario} />
          {vista === 'entrar' ? (
            <>
              <Boton texto="Crear una cuenta gratis" secundario deshabilitado={bloqueado} onPress={() => cambiarVista('alta')} />
              <Boton texto="He olvidado la contraseña" secundario deshabilitado={bloqueado} onPress={() => cambiarVista('recuperar')} />
              <Boton texto="No he recibido la confirmación" secundario deshabilitado={bloqueado} onPress={() => cambiarVista('confirmacion')} />
            </>
          ) : <Boton texto="Volver a entrar" secundario onPress={() => cambiarVista('entrar')} />}
          {bloqueado ? <Boton texto="Cancelar operación" secundario onPress={() => cambiarVista('entrar')} /> : null}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tarjeta: { borderRadius: R.l, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea2, padding: 18, gap: 12 },
  kicker: { ...T.etiqueta, color: C.tx3, lineHeight: 17 },
  titulo: { ...T.seccion, color: C.tx },
  subtitulo: { ...T.ficha, color: C.tx },
  parrafo: { ...T.cuerpo, color: C.tx2 },
  nota: { ...T.menor, color: C.tx2 },
  nombre: { ...T.ficha, color: C.tx },
  campo: { gap: 7 },
  etiquetaCampo: { ...T.cuerpoFte, color: C.tx },
  entrada: { minHeight: UI.boton, borderWidth: 1, borderColor: C.linea2, borderRadius: R.m,
    backgroundColor: C.noche2, color: C.tx, paddingHorizontal: 13, paddingVertical: 13,
    fontFamily: F.regular, fontSize: 16 },
  boton: { minHeight: UI.tactil, borderRadius: R.m, backgroundColor: C.senal,
    paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botonSecundario: { backgroundColor: C.sup2, borderWidth: 1, borderColor: C.linea2 },
  botonPeligro: { backgroundColor: C.coral10, borderWidth: 1, borderColor: C.coral32 },
  botonTexto: { ...T.cuerpoFte, color: C.noche, textAlign: 'center' },
  botonTextoSecundario: { color: C.tx },
  botonTextoPeligro: { color: C.coral },
  deshabilitado: { opacity: 0.6 },
  pulsado: { opacity: 0.8 },
  aceptacion: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 12 },
  aceptacionTexto: { ...T.menor, color: C.tx2, flex: 1 },
  casilla: { width: 25, height: 25, borderRadius: R.s, borderWidth: 1, borderColor: C.tx3, alignItems: 'center', justifyContent: 'center' },
  casillaMarcada: { backgroundColor: C.senal, borderColor: C.senal },
  marca: { color: C.noche, fontSize: 18, fontFamily: F.negrita },
  error: { ...T.cuerpo, color: C.coral, backgroundColor: C.coral10, borderRadius: R.m, padding: 12 },
  mensaje: { ...T.cuerpo, color: C.senalCl, backgroundColor: C.senal10, borderRadius: R.m, padding: 12 },
  divisor: { height: 1, backgroundColor: C.linea2, marginVertical: 3 },
  bloque: { gap: 10 },
  enlaces: { gap: 8 },
  vigilada: { gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.linea },
  empresa: { minHeight: UI.tactil, justifyContent: 'center', gap: 3 },
  empresaNombre: { ...T.cuerpoFte, color: C.tx },
});
