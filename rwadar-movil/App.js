import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Animated, AppState, FlatList, Linking, Modal, RefreshControl, StatusBar, StyleSheet, useWindowDimensions } from 'react-native';
import { Alert, Pressable, ScrollView, Text, TextInput, View, SelectorIdioma, FuenteOriginal, useIdioma } from './componentes/Idioma';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts, Geist_400Regular, Geist_400Regular_Italic, Geist_500Medium, Geist_600SemiBold,
  Geist_700Bold, Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';

import { C, COLOR_CATEGORIA, iniciales, T, E, R, F, UI } from './lib/tema';
import { tacto } from './lib/tacto';
import {
  cargarCatalogo, cargarFuera, siguiendo, alternarSeguimiento, novedades, configurarAccesoCatalogo,
  sincronizarSeguimientoPendiente, borrarDatosDispositivo,
  cargarSecundario, cargarExclusiones, proveedoresDeOfertas, textoBusquedaOferta,
  ofertasGuardadas, alternarOfertaGuardada,
} from './lib/datos';
import {
  MODO_LOCAL, SERVICIOS_USUARIO_REMOTOS, CUENTAS_REMOTAS, CORREO_AUTH_E2E,
} from './lib/modo-local';
import { crearControladorCuentas } from './lib/cuentas';
import { cuentaAdmitida } from './lib/acceso-obligatorio';
import AccesoObligatorio from './componentes/AccesoObligatorio';
import BloqueoApp from './componentes/BloqueoApp';
import { useBloqueoApp } from './lib/desbloqueo-app';
import { useActualizacionesApp, useEstadoActualizaciones, textosActualizacion } from './lib/actualizaciones-app';
import AvisoActualizacion from './componentes/AvisoActualizacion';
import { vigilarCaducidadCatalogo, programarRevisionDiaria } from './lib/catalogo-remoto';
import {
  etiquetaEstadoVerificacionLocal, fechaVerificacionLocalVisible,
} from './lib/verificacion-local';
import {
  consultarEstadoAvisos, registrarParaAvisos, observarAperturasAvisos,
} from './lib/avisos';
import Explicador from './componentes/Explicador';
import Academy from './componentes/Academy';
import Inicio from './componentes/Inicio';
import Cuenta from './componentes/Cuenta';
import { LECCIONES } from './lib/academy-contenido';
import Radar from './componentes/Radar';
import Marca from './componentes/Marca';
import Navegacion, { Icono } from './componentes/Navegacion';
import useTransicionFicha from './componentes/useTransicionFicha';
import MisInversiones from './componentes/MisInversiones';
import { crearCarteraCuenta } from './lib/cartera-cuenta';
import {
  DetalleOferta, ExclusionesOfertas, FichaOferta, FichaGrupoOfertas,
  agruparOfertasLectura, ordenarOfertasLectura,
} from './componentes/Ofertas';
import { resumenOferta } from './lib/ficha-editorial';
import { enSeleccionOferta } from './lib/transparencia';

const URL_PRIVACIDAD = 'https://rwadar.pages.dev/privacidad';
const LECCIONES_PUBLICADAS = LECCIONES.filter((l) => l.publicado).length;
const USUARIO_LOCAL = MODO_LOCAL || SERVICIOS_USUARIO_REMOTOS !== true;
// Las cuentas son independientes del seguimiento y los avisos de instalaciones.
const CUENTA_REMOTA_ACTIVA = MODO_LOCAL === false && CUENTAS_REMOTAS === true && CORREO_AUTH_E2E === true;

async function abrirEnlace(url) {
  const valor = String(url || '').trim();
  let permitido = valor === 'mailto:RWAdar@protonmail.com';
  if (!permitido) {
    try {
      const destino = new URL(valor);
      permitido = destino.protocol === 'https:' && !destino.username && !destino.password;
    } catch {
      permitido = false;
    }
  }
  if (!permitido) {
    Alert.alert('Enlace no válido', 'RWAdar solo abre direcciones HTTPS verificables.');
    return;
  }
  try {
    await Linking.openURL(valor);
  } catch {
    Alert.alert('No se pudo abrir el enlace', 'Comprueba tu conexión e inténtalo de nuevo.');
  }
}

async function abrirAjustes() {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert('No se pudieron abrir los ajustes', 'Abre los ajustes del sistema y busca RWAdar.');
  }
}

export default function App() {
  useActualizacionesApp();
  const actualizacion = useEstadoActualizaciones();
  const idioma = useIdioma();
  const [avisoActualizacionOculto, setAvisoActualizacionOculto] = useState(null);
  const [fuentesListas] = useFonts({
    Geist_400Regular, Geist_400Regular_Italic, Geist_500Medium, Geist_600SemiBold,
    Geist_700Bold, Geist_800ExtraBold, GeistMono_500Medium,
  });

  /* Cinco botones en la barra (ESPEC-INICIO §4): Inicio · Ofertas ·
     Plataformas · Academy · Perfil. Ofertas y Plataformas son las dos vistas
     de la pestaña «buscar» (vistaBuscar 'ofertas' o 'empresas'), así que los
     destinos de siempre siguen funcionando sin tocarlos. */
  const [pestana, setPestana] = useState('inicio');
  const [vistaBuscar, setVistaBuscar] = useState('ofertas');
  const [guardadas, setGuardadas] = useState([]);
  const [radar, setRadar] = useState([]);
  const [fuera, setFuera] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [fechaCatalogo, setFechaCatalogo] = useState(null);
  const [secundario, setSecundario] = useState([]);
  const [enCamino, setEnCamino] = useState([]);
  const [exclusionesOfertas, setExclusionesOfertas] = useState([]);
  const [sigo, setSigo] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [busquedaOfertas, setBusquedaOfertas] = useState('');
  const [grupoOfertas, setGrupoOfertas] = useState('principales');
  const [tipoOferta, setTipoOferta] = useState('');
  const [proveedorOferta, setProveedorOferta] = useState('');
  const [grupoProveedorAbierto, setGrupoProveedorAbierto] = useState('');
  const [filtrosOfertasAbiertos, setFiltrosOfertasAbiertos] = useState(false);
  const [criteriosOfertasAbiertos, setCriteriosOfertasAbiertos] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [ofertaAbierta, setOfertaAbierta] = useState(null);
  const [inversionInicial, setInversionInicial] = useState(null);
  const [explicando, setExplicando] = useState(false);
  // Pestaña Academy: '' muestra la lista de lecciones; un slug, esa lección.
  const [leccion, setLeccion] = useState('');
  const [privacidad, setPrivacidad] = useState(false);
  const [estadoDatos, setEstadoDatos] = useState('');
  const [estadoAccion, setEstadoAccion] = useState('');
  const [procesandoSeguimiento, setProcesandoSeguimiento] = useState(false);
  const [estadoAvisos, setEstadoAvisos] = useState({ estado: 'comprobando' });
  const [procesandoAvisos, setProcesandoAvisos] = useState(false);
  const [borrandoDatos, setBorrandoDatos] = useState(false);
  const [slugAvisoPendiente, setSlugAvisoPendiente] = useState(null);
  // Las cuentas no habilitan el UUID de instalaciones, push ni seguimiento
  // antiguo. Su lista remota y los favoritos del dispositivo son distintos.
  const [cuenta, setCuenta] = useState(null);
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [revisionCartera, setRevisionCartera] = useState(0);
  const [restaurandoAcceso, setRestaurandoAcceso] = useState(CUENTA_REMOTA_ACTIVA);
  const [errorRestauracion, setErrorRestauracion] = useState('');
  const controladorActual = useRef(null);
  const usuarioAdmitido = cuentaAdmitida(estadoCuenta) ? estadoCuenta.usuario.id : null;
  const seguridad = useBloqueoApp({ usuarioId: CUENTA_REMOTA_ACTIVA ? usuarioAdmitido : null });
  const restaurarAcceso = useCallback(async (controlador) => {
    if (!CUENTA_REMOTA_ACTIVA || !controlador || controladorActual.current !== controlador) return;
    setRestaurandoAcceso(true); setErrorRestauracion('');
    try {
      const resultado = await controlador.restaurar();
      if (controladorActual.current === controlador && resultado?.ok === false) {
        setErrorRestauracion(resultado.error || 'No se pudo comprobar tu sesión guardada. Reinténtalo cuando tengas conexión.');
      }
      return resultado;
    } catch {
      if (controladorActual.current === controlador) {
        setErrorRestauracion('No se pudo comprobar tu sesión guardada. Reinténtalo cuando tengas conexión.');
      }
      return { ok: false };
    } finally {
      if (controladorActual.current === controlador) setRestaurandoAcceso(false);
    }
  }, []);
  const cerrarAcceso = useCallback(async () => {
    if (!cuenta || controladorActual.current !== cuenta) return;
    setRestaurandoAcceso(true);
    try { await cuenta.salir(); }
    finally {
      if (controladorActual.current === cuenta) {
        setErrorRestauracion(''); setRestaurandoAcceso(false);
      }
    }
  }, [cuenta]);
  const { width: anchoPantalla } = useWindowDimensions();

  useEffect(() => {
    // Crear y liberar en el mismo efecto evita conservar un cliente del SDK
    // al desmontar App y también soporta el doble setup de React StrictMode.
    const controlador = crearControladorCuentas({ modoLocal: MODO_LOCAL,
      cuentasRemotas: CUENTAS_REMOTAS, correoVerificado: CORREO_AUTH_E2E });
    controladorActual.current = controlador;
    setCuenta(controlador);
    const cancelarSuscripcion = controlador.suscribir(setEstadoCuenta);
    if (CUENTA_REMOTA_ACTIVA) restaurarAcceso(controlador);
    return () => {
      if (controladorActual.current === controlador) controladorActual.current = null;
      cancelarSuscripcion(); controlador.destruir();
    };
  }, []);

  /* El `finally` no es adorno: si cualquiera de estas llamadas rechazara,
     `cargando` se quedaría en true y la pantalla de "Sintonizando el
     radar…" no se iría nunca. Cada carga ya trae su respaldo desde la
     copia local, así que salir de la pantalla de carga es SIEMPRE lo
     correcto: peor que una lista corta es una app que no arranca. */
  const traer = useCallback(async () => {
    if (!usuarioAdmitido || !cuenta) {
      configurarAccesoCatalogo(null);
      setCargando(false);
      return false;
    }
    configurarAccesoCatalogo(usuarioAdmitido, async () => {
      const cliente = await cuenta.clienteCatalogo();
      if (cuenta.estado().usuario?.id !== usuarioAdmitido) throw new Error('La cuenta ha cambiado');
      return cliente;
    });
    try {
      const escaparate = MODO_LOCAL ? [
        cargarSecundario(), cargarExclusiones(),
      ] : [
        Promise.resolve({ datos: [] }),
        Promise.resolve({ datos: [] }),
      ];
      const [catalogo, f, mercado, exclusiones, s] = await Promise.all([
        cargarCatalogo(), cargarFuera(), ...escaparate, siguiendo(),
      ]);
      if (cuenta.estado().usuario?.id !== usuarioAdmitido) return false;
      const principales = MODO_LOCAL ? catalogo.ofertas
        : catalogo.ofertas.filter(o => o.coleccion === 'principales');
      const referenciasSecundarias = MODO_LOCAL ? mercado.datos
        : catalogo.ofertas.filter(o => o.coleccion === 'secundario');
      const referenciasEnCamino = MODO_LOCAL ? []
        : catalogo.ofertas.filter(o => o.coleccion === 'en_camino');
      setRadar(catalogo.plataformas); setFuera(f.datos); setOfertas(principales);
      setFechaCatalogo(catalogo.fecha
        ? { fecha: catalogo.fecha, vigenciaDias: catalogo.vigenciaDias, caducado: catalogo.caducado === true } : null);
      setSecundario(referenciasSecundarias); setEnCamino(referenciasEnCamino);
      setExclusionesOfertas(exclusiones.datos); setSigo(s);
      setAbierta(actual => actual && catalogo.plataformas.find(p => p.slug === actual.slug) || null);
      setOfertaAbierta(actual => actual && [...catalogo.ofertas, ...mercado.datos]
        .find(o => o.slug === actual.slug) || null);
      setSinConexion(!!catalogo.deCache);

      const [n, sincronizacion] = await Promise.all([
        novedades(s),
        sincronizarSeguimientoPendiente(),
      ]);
      if (cuenta.estado().usuario?.id !== usuarioAdmitido) return false;
      setAvisos(n.datos);

      const mensajes = [];
      if (catalogo.retirado) {
        mensajes.push('El catálogo se ha retirado temporalmente. Volverá a mostrarse en cuanto se publique de nuevo.');
      } else if (catalogo.error) {
        mensajes.push(catalogo.deCache
          ? 'No hemos podido comprobar la revisión más reciente. Mostramos la última copia completa guardada.'
          : 'Todavía no hay un catálogo guardado. Desliza hacia abajo para reintentar.');
      }
      if (catalogo.caducado) {
        const [a, m, d] = String(catalogo.fecha).split('-');
        mensajes.push(`Revisión pendiente: estos datos se revisaron el ${d}/${m}/${a} y su revisión semanal ha vencido. ` +
          'Las cifras caducadas se ocultan; comprueba cada dato en la web del emisor.');
      }
      if (f.error) mensajes.push('No se pudieron actualizar los descartes documentados.');
      if (n.error && s.length) mensajes.push('No se pudieron consultar las novedades.');
      if (sincronizacion.pendientes) {
        mensajes.push(`${sincronizacion.pendientes} cambio(s) de seguimiento pendientes de sincronizar.`);
      }
      setEstadoDatos(mensajes.join(' '));
      return !catalogo.error && !catalogo.deCache && !f.deCache;
    } catch {
      if (cuenta.estado().usuario?.id !== usuarioAdmitido) return false;
      setRadar([]); setOfertas([]); setSecundario([]); setEnCamino([]); setFuera([]);
      setExclusionesOfertas([]); setAbierta(null); setOfertaAbierta(null);
      setFechaCatalogo(null);
      setEstadoDatos('No se pudo cargar un catálogo verificable. Desliza hacia abajo para reintentar.');
      return false;
    } finally {
      if (cuenta.estado().usuario?.id === usuarioAdmitido) setCargando(false);
    }
  }, [usuarioAdmitido, cuenta]);

  useEffect(() => { traer(); }, [traer]);
  useEffect(() => {
    if (!usuarioAdmitido) {
      configurarAccesoCatalogo(null);
      setRadar([]); setOfertas([]); setSecundario([]); setEnCamino([]); setFuera([]);
      setGuardadas([]); setSigo([]);
      setAbierta(null); setOfertaAbierta(null); setInversionInicial(null);
      setExplicando(false);
      setPrivacidad(false); setLeccion(''); setPestana('inicio');
      return;
    }
    // Remote identity + guarded profile revalidated whenever the app returns.
    let activa = AppState.currentState === 'active';
    if (activa) cuenta.reanudar();
    else cuenta.suspender();
    const volver = AppState.addEventListener('change', estado => {
      activa = estado === 'active';
      if (activa) { cuenta.reanudar(); cuenta.refrescar(); }
      else cuenta.suspender();
    });
    const reloj = setInterval(() => { if (activa) cuenta.refrescar(); }, 60000);
    return () => { volver.remove(); clearInterval(reloj); cuenta.suspender(); };
  }, [usuarioAdmitido, cuenta]);
  const obtenerAccesoTutorial = useCallback(() => cuenta.accesoTutorial(), [cuenta]);
  const cerrarTutorial = useCallback(() => {
    setExplicando(false); setPestana('academy'); setLeccion('');
  }, []);
  useEffect(() => {
    let vivo = true;
    ofertasGuardadas().then((lista) => { if (vivo) setGuardadas(lista); });
    return () => { vivo = false; };
  }, [usuarioAdmitido]);
  useEffect(() => {
    if (MODO_LOCAL || !fechaCatalogo) return;
    // Al vencer, el catálogo no se borra: se vuelve a cargar y queda marcado
    // como caducado, con sus cifras vencidas ocultas. Ya caducado, basta con
    // refrescarlo una vez al día para ocultar las cifras que vayan venciendo.
    if (fechaCatalogo.caducado) {
      return programarRevisionDiaria({ appState: AppState, alCambiarDia: () => { traer(); } });
    }
    return vigilarCaducidadCatalogo({ fecha: fechaCatalogo.fecha, vigenciaDias: fechaCatalogo.vigenciaDias,
      appState: AppState, alCaducar: () => { traer(); } });
  }, [fechaCatalogo, traer]);
  useEffect(() => {
    let vivo = true;
    consultarEstadoAvisos().then((resultado) => {
      if (vivo) setEstadoAvisos(resultado);
    });
    return () => { vivo = false; };
  }, []);
  useEffect(() => observarAperturasAvisos((slug) => {
    setSlugAvisoPendiente(slug);
    return true;
  }), []);
  useEffect(() => {
    if (!slugAvisoPendiente || cargando) return;
    const plataforma = radar.find((p) => p.slug === slugAvisoPendiente);
    setBusqueda('');
    setCategoria('');
    if (plataforma) {
      setPestana('buscar');
      setVistaBuscar('empresas');
      setAbierta(plataforma);
    } else {
      /* Si el cambio acaba de sacar la plataforma del radar, su ficha activa
         ya no existe. Inicio conserva el titular y el motivo del cambio. */
      setPestana('inicio');
    }
    setSlugAvisoPendiente(null);
  }, [slugAvisoPendiente, cargando, radar]);

  const refrescar = async () => {
    setRefrescando(true);
    try {
      const actualizado = await traer();
      if (actualizado) tacto.novedad();
    } finally {
      setRefrescando(false);
    }
  };

  const categorias = useMemo(() => {
    const m = new Map();
    radar.forEach((p) => m.set(p.categoria, (m.get(p.categoria) || 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [radar]);

  /* Lista vacía sin ningún dato NO es "no hay resultados": es que no hubo
     forma de traerlos y todavía no hay copia guardada. Decirle a alguien
     que su búsqueda no encontró nada cuando lo que falla es la red le
     manda a cambiar el filtro en vez de a mirar la cobertura. */
  const nadaQueVer = radar.length === 0
    ? MODO_LOCAL
      ? 'No se pudo leer el radar incluido en esta copia. Desliza hacia abajo para reintentar la carga local.'
      : 'No se ha podido traer el radar y todavía no hay copia guardada. Desliza hacia abajo para reintentar cuando tengas cobertura.'
    : 'El radar no detecta nada con esos filtros.';

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return radar.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (!q) return true;
      const verificacion = p.verificacionLocal;
      const textoVerificado = verificacion ? [
        verificacion.estadoOperativo?.estado, verificacion.estadoOperativo?.detalle,
        verificacion.licenciaRegistro?.estado, verificacion.licenciaRegistro?.detalle,
        verificacion.acceso?.estado, verificacion.acceso?.detalle,
        ...(verificacion.alertasCriticas || []).flatMap((alerta) => [alerta.codigo, alerta.detalle]),
      ] : [p.nota, p.aval, p.acceso];
      return [p.nombre, p.categoria, p.region, p.cadenas, ...textoVerificado]
        .join(' ').toLowerCase().includes(q);
    });
  }, [radar, busqueda, categoria]);

  const todasOfertas = useMemo(() => [...ofertas, ...secundario, ...enCamino], [ofertas, secundario, enCamino]);
  const ofertasDelGrupo = useMemo(() => grupoOfertas === 'principales' ? ofertas
    : grupoOfertas === 'secundario' ? secundario
      : grupoOfertas === 'en_camino' ? enCamino : MODO_LOCAL ? todasOfertas : [],
  [grupoOfertas, ofertas, secundario, enCamino, todasOfertas]);
  const proveedoresOferta = useMemo(() => proveedoresDeOfertas(
    ofertasDelGrupo
  ), [ofertasDelGrupo]);
  const ofertasVisibles = useMemo(() => {
    const q = busquedaOfertas.trim().toLocaleLowerCase('es');
    return ordenarOfertasLectura(ofertasDelGrupo.filter((oferta) => {
      if (tipoOferta && oferta.tipo !== tipoOferta) return false;
      if (proveedorOferta && oferta.plataformaSlug !== proveedorOferta) return false;
      return !q || textoBusquedaOferta(oferta).includes(q);
    }));
  }, [ofertasDelGrupo, busquedaOfertas, tipoOferta, proveedorOferta]);
  const columnasOfertas = anchoPantalla >= 1120 ? 3 : anchoPantalla >= 720 ? 2 : 1;
  const separacionOfertas = 12;
  const anchoCeldaOferta = (anchoPantalla - (UI.margen * 2)
    - (separacionOfertas * (columnasOfertas - 1))) / columnasOfertas;
  const filtrosOfertasActivos = Number(!!tipoOferta) + Number(!!proveedorOferta);
  const hayRestriccionesOfertas = !!(busquedaOfertas || tipoOferta || proveedorOferta);
  const catalogoCaducado = fechaCatalogo?.caducado === true;
  /* En el móvil, como en la web: filas sueltas, sin grupos por proveedor, y
     arriba la Selección RWAdar (las que pasan las cinco comprobaciones de
     transparencia; falla cerrado). Con dos o tres columnas siguen los grupos. */
  const filasOfertas = useMemo(() => {
    const filas = agruparOfertasLectura(ofertasVisibles, !hayRestriccionesOfertas && columnasOfertas > 1);
    const conSeleccion = columnasOfertas === 1 && (grupoOfertas === 'principales' || grupoOfertas === 'todo');
    if (!conSeleccion) return filas;
    const ahora = new Date();
    const elegidas = filas.filter((fila) => fila.tipo === 'oferta' &&
      enSeleccionOferta(fila.oferta, resumenOferta(fila.oferta, [], ahora), { ahora, catalogoCaducado }));
    if (!elegidas.length) return filas;
    const resto = filas.filter((fila) => !elegidas.includes(fila));
    return [{ tipo: 'cabecera', slug: 'cabecera:seleccion', seleccion: true }, ...elegidas,
      ...(resto.length ? [{ tipo: 'cabecera', slug: 'cabecera:resto' }, ...resto] : [])];
  }, [ofertasVisibles, hayRestriccionesOfertas, columnasOfertas, grupoOfertas, catalogoCaducado]);

  const seleccionarGrupoOfertas = (grupo) => {
    tacto.eleccion();
    setGrupoOfertas(grupo);
    setGrupoProveedorAbierto('');
    setProveedorOferta('');
    if (grupo !== 'principales') setTipoOferta('');
  };

  const seguidas = useMemo(() => radar.filter((p) => sigo.includes(p.slug)), [radar, sigo]);

  const alternar = async (p) => {
    if (procesandoSeguimiento) return;
    setProcesandoSeguimiento(true);
    setEstadoAccion('');
    try {
      const yaSigo = sigo.includes(p.slug);
      const resultado = await alternarSeguimiento(p.slug, p.plataforma_id);
      setSigo(resultado.lista);
      yaSigo ? tacto.soltar() : tacto.seguir();
      if (!resultado.sincronizado) {
        setEstadoAccion(
          'Cambio guardado en este dispositivo, pero pendiente de sincronizar. ' +
          'Los avisos no pueden depender de él hasta que vuelva la conexión.'
        );
      }
    } catch {
      Alert.alert('No se guardó el cambio', 'No pudimos actualizar el seguimiento en este dispositivo.');
    } finally {
      setProcesandoSeguimiento(false);
    }
  };

  const activarAvisos = async () => {
    if (procesandoAvisos) return;
    setProcesandoAvisos(true);
    try {
      const resultado = await registrarParaAvisos({ solicitarPermiso: true });
      setEstadoAvisos(resultado);
      if (resultado.estado === 'error') {
        Alert.alert('No se pudieron preparar los avisos', 'No se ha registrado ningún éxito. Inténtalo más tarde.');
      }
    } finally {
      setProcesandoAvisos(false);
    }
  };

  const confirmarBorrado = () => {
    Alert.alert(
      'Borrar datos de este dispositivo',
      MODO_LOCAL
        ? 'Se eliminarán únicamente los seguimientos y cachés del escaparate local. No se contactará con Supabase.'
        : USUARIO_LOCAL
          ? 'Se borrarán las empresas y ofertas guardadas, las inversiones registradas de todas las cuentas en este dispositivo, el progreso de la Academy y las cachés del catálogo. No se borran datos del servidor.'
        : 'Se eliminarán de Supabase esta instalación, su token push y todos sus seguimientos, además de las cachés locales. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar definitivamente',
          style: 'destructive',
          onPress: async () => {
            setBorrandoDatos(true);
            try {
              await borrarDatosDispositivo();
              setRevisionCartera(actual => actual + 1);
              setRadar([]); setFuera([]); setOfertas([]); setSecundario([]); setEnCamino([]);
              setExclusionesOfertas([]); setSigo([]); setAvisos([]); setGuardadas([]);
              setEstadoDatos(MODO_LOCAL
                ? 'Datos locales borrados. Actualiza para volver a cargar el escaparate incluido en esta copia.'
                : 'Datos borrados. Actualiza para consultar de nuevo el catálogo con tu cuenta.');
              setEstadoAccion('');
              setEstadoAvisos(MODO_LOCAL
                ? { ok: false, estado: 'local', local: true }
                : USUARIO_LOCAL ? { ok: false, estado: 'desactivados' }
                : { estado: 'disponible' });
              setPrivacidad(false);
              Alert.alert('Datos borrados', MODO_LOCAL
                ? 'Se han eliminado los seguimientos y cachés de esta copia local.'
                : USUARIO_LOCAL ? 'Se han eliminado los guardados, las inversiones registradas, el progreso de la Academy y las cachés del catálogo de este dispositivo. No se han modificado datos del servidor.'
                : 'La instalación no volverá a identificarse hasta que uses seguimiento o avisos.');
            } catch {
              Alert.alert(
                'No se borraron los datos',
                USUARIO_LOCAL
                  ? 'No se pudo completar el borrado local. Inténtalo de nuevo.'
                  : 'Supabase no confirmó el borrado. Se conservan la identidad y los datos locales para que puedas reintentarlo.'
              );
            } finally {
              setBorrandoDatos(false);
            }
          },
        },
      ]
    );
  };

  const abrir = (p) => { tacto.abrir(); setAbierta(p); };
  const abrirAcademy = () => { tacto.abrir(); setLeccion(''); setPestana('academy'); };
  /* Los botones de una lección llevan al radar de la app o abren la web
     (el comparador solo existe allí). Nunca a una pantalla inexistente. */
  const accionAcademy = (destino) => {
    if (destino.app === 'radar') {
      setPestana('buscar');
      setVistaBuscar('empresas');
    } else if (destino.app === 'web' && destino.url) {
      abrirEnlace(destino.url);
    }
  };
  /* «fuera» abre Plataformas en «Descartadas» (ESPEC-INICIO §4), que va al
     pie de la lista, tras las 26 fichas. Se baja en cuanto la lista sabe lo
     que mide: primero al final (así se pintan las últimas fichas) y luego al
     principio del pie, que es donde empieza «Descartadas». */
  const listaPlataformas = useRef(null);
  const medidasPlataformas = useRef({ alto: 0, pie: 0 });
  const irADescartadas = useRef(false);
  const bajarADescartadas = () => {
    const { alto, pie } = medidasPlataformas.current;
    if (!irADescartadas.current || !alto || !pie || !listaPlataformas.current) return;
    irADescartadas.current = false;
    listaPlataformas.current.scrollToEnd?.({ animated: false });
    const ajustar = () => {
      const m = medidasPlataformas.current;
      listaPlataformas.current?.scrollToOffset?.({
        offset: Math.max(0, m.alto - (StyleSheet.flatten(e.lista).paddingBottom || 0) - m.pie - 8), animated: false });
    };
    setTimeout(ajustar, 60);
    setTimeout(ajustar, 320);
  };
  /* Destinos de Inicio (noticias y atajos). */
  const irA = (destino, url) => {
    if (destino === 'academy') abrirAcademy();
    else if (destino === 'web' && url) abrirEnlace(url);
    else if (destino === 'buscar' || destino === 'ofertas' || destino === 'fuera' || destino === 'plataformas') {
      tacto.eleccion();
      irADescartadas.current = destino === 'fuera' && fuera.length > 0;
      setVistaBuscar(destino === 'ofertas' ? 'ofertas' : 'empresas');
      setPestana('buscar');
      if (irADescartadas.current && pestana === 'buscar' && vistaBuscar === 'empresas') bajarADescartadas();
    }
  };
  const ofertaPorSlug = useMemo(() => new Map(
    [...ofertas, ...secundario, ...enCamino].map((o) => [o.slug, o])), [ofertas, secundario, enCamino]);
  const ofertasGuardadasVisibles = useMemo(() => guardadas
    .map((slug) => ofertaPorSlug.get(slug)).filter(Boolean), [guardadas, ofertaPorSlug]);
  const alternarGuardada = async (oferta) => {
    if (!oferta?.slug) return;
    const yaEstaba = guardadas.includes(oferta.slug);
    try {
      setGuardadas(await alternarOfertaGuardada(oferta.slug));
      yaEstaba ? tacto.soltar() : tacto.seguir();
    } catch {
      Alert.alert('No se guardó el cambio', 'No pudimos actualizar las ofertas guardadas en este dispositivo.');
    }
  };
  const filtrar = (c) => { tacto.eleccion(); setCategoria(c); };
  const cambiarPestana = (id) => {
    const destino = id === 'ofertas' || id === 'plataformas' ? 'buscar' : id;
    const vista = id === 'ofertas' ? 'ofertas' : id === 'plataformas' ? 'empresas' : vistaBuscar;
    if (destino === pestana && vista === vistaBuscar) return;
    tacto.eleccion();
    setVistaBuscar(vista);
    setPestana(destino);
  };
  const destinoBarra = pestana === 'buscar' ? (vistaBuscar === 'ofertas' ? 'ofertas' : 'plataformas') : pestana;
  // Mejora descargada: reinicia al pulsar. Versión nueva: descarga el APK, que
  // Android instala encima sin desinstalar. Sin nada pendiente: comprueba.
  const actualizarApp = async () => {
    const { resumen } = actualizacion;
    const textos = textosActualizacion(resumen, { idioma });
    tacto.eleccion();
    if (resumen.tipo === 'mejora') {
      if (!(await actualizacion.aplicarMejora())) Alert.alert(textos.falloTitulo, textos.fallo);
    } else if (resumen.tipo === 'version') {
      Alert.alert(textos.titulo, textos.confirmar, [
        { text: textos.cancelar, style: 'cancel' },
        { text: textos.aceptar, onPress: () => abrirEnlace(resumen.apk) },
      ]);
    } else {
      actualizacion.comprobar();
    }
  };
  const claveAvisoActualizacion = actualizacion.resumen.tipo === 'version'
    ? `version-${actualizacion.resumen.versionCode}` : actualizacion.resumen.tipo;
  const avisoActualizacion = avisoActualizacionOculto !== claveAvisoActualizacion ? (
    <AvisoActualizacion resumen={actualizacion.resumen} onActualizar={actualizarApp}
      onOcultar={() => setAvisoActualizacionOculto(claveAvisoActualizacion)} />
  ) : null;

  if (CUENTA_REMOTA_ACTIVA && (restaurandoAcceso || estadoCuenta?.estado === 'restaurando' || errorRestauracion)) {
    return <SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor={C.noche} />
      <PreparandoAcceso ocupado={restaurandoAcceso || estadoCuenta?.estado === 'restaurando'}
        mensaje={errorRestauracion} onReintentar={() => restaurarAcceso(cuenta)} onSalir={cerrarAcceso}
        aviso={avisoActualizacion} />
    </SafeAreaProvider>;
  }

  if (CUENTA_REMOTA_ACTIVA && usuarioAdmitido && (seguridad.preparando || seguridad.bloqueado)) {
    return <SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor={C.noche} />
      <BloqueoApp preparando={seguridad.preparando} ocupado={seguridad.ocupado}
        mensaje={seguridad.mensaje} onDesbloquear={seguridad.desbloquear} onSalir={cerrarAcceso}
        aviso={avisoActualizacion} />
    </SafeAreaProvider>;
  }

  if (fuentesListas && !usuarioAdmitido) {
    return <SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor={C.noche} />
      <AccesoObligatorio controlador={cuenta} estado={estadoCuenta} onAbrirEnlace={abrirEnlace} aviso={avisoActualizacion} />
    </SafeAreaProvider>;
  }

  if (!fuentesListas || cargando) {
    return (
      <SafeAreaProvider>
        <View style={[e.pantalla, e.centro]}>
          <ActivityIndicator size="large" color={C.senal} />
          <Text style={e.cargandoTxt}>Sintonizando el radar…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const avisoCatalogo = estadoDatos ? (
    <Text style={e.estadoGlobal} accessibilityRole="alert" accessibilityLiveRegion="polite">
      {estadoDatos}
    </Text>
  ) : null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.noche2} />
      <SafeAreaView style={e.pantalla} edges={['top']}>
        {/* La Academy trae su propia cabecera (con «volver» dentro de una lección). */}
        {pestana !== 'academy' ? (
          <Cabecera
            pestana={pestana}
            vistaBuscar={vistaBuscar}
            total={radar.length}
            ofertas={ofertas.length}
            secundario={secundario.length}
            enCamino={enCamino.length}
            guardados={sigo.length + guardadas.length}
            sinConexion={sinConexion}
            onAyuda={() => { tacto.abrir(); setExplicando(true); }}
          />
        ) : null}

        {/* El idioma sale de la primera pantalla: solo arriba de Perfil (ESPEC §4). */}
        {pestana === 'perfil' ? <SelectorIdioma /> : null}

        {MODO_LOCAL ? <BannerModoLocal /> : null}

        {avisoActualizacion}

        {/* En Buscar, el aviso se desplaza con el catálogo para no consumir
            todo el espacio de lectura con una fuente grande. */}
        {pestana !== 'buscar' ? avisoCatalogo : null}
        {estadoAccion ? (
          <Text style={e.estadoPendiente} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {estadoAccion}
          </Text>
        ) : null}

        <View style={e.contenido}>
          {pestana === 'inicio' ? (
            <Inicio
              refrescando={refrescando}
              onActualizar={refrescar}
              onDestino={irA}
              onExplicar={() => { tacto.abrir(); setExplicando(true); }}
              fuera={fuera}
              cambios={avisos}
              renderCambio={(aviso) => <Aviso aviso={aviso} />}
              plataformas={radar}
              ofertas={todasOfertas}
              fechaCatalogo={fechaCatalogo}
              onAbrirPlataforma={abrir}
              onAbrirOferta={(oferta) => { tacto.abrir(); setOfertaAbierta(oferta); }}
              onAbrirEnlace={abrirEnlace}
            />
          ) : null}

          {pestana === 'buscar' && vistaBuscar === 'empresas' ? (
            <FlatList
              ref={listaPlataformas}
              onContentSizeChange={(_, alto) => { medidasPlataformas.current.alto = alto; bajarADescartadas(); }}
              data={visibles}
              keyExtractor={(p) => p.slug}
              contentContainerStyle={e.lista}
              keyboardShouldPersistTaps="handled"
              refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
              ListHeaderComponent={
                <View>
                  {avisoCatalogo}
                  {/* El radar sigue siendo el producto y conserva toda su
                      animación, lectura, puntos y filtros. */}
                  <Radar
                    datos={radar}
                    categoriaActiva={categoria}
                    onAbrir={(p) => abrir(p)}
                    onFiltrar={(c) => filtrar(c)} />

                  <View style={e.panelBusqueda}>
                    <View style={e.busquedaFila}>
                      <Icono nombre="buscar" color={C.tx2} tamano={23} />
                      <TextInput
                        style={e.buscador}
                        placeholder="Plataforma o palabra clave"
                        placeholderTextColor={C.tx3}
                        value={busqueda}
                        onChangeText={setBusqueda}
                        returnKeyType="search"
                        accessibilityLabel="Buscar plataforma o palabra clave"
                      />
                      {busqueda || categoria ? (
                        <Pressable
                          onPress={() => { setBusqueda(''); filtrar(''); }}
                          style={({ pressed }) => [e.limpiar, pressed && e.pulsadoSuave]}
                          accessibilityRole="button"
                          accessibilityLabel="Limpiar búsqueda y filtros"
                          hitSlop={8}
                        >
                          <Text style={e.limpiarTxt}>✕</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={e.chips}
                      contentContainerStyle={e.chipsContenido}
                    >
                      <Chip texto={`Todas ${radar.length}`} activo={!categoria} onPress={() => filtrar('')} />
                      {categorias.map(([c, n]) => (
                        <Chip key={c} texto={`${c} ${n}`} color={COLOR_CATEGORIA[c]}
                          activo={categoria === c} onPress={() => filtrar(categoria === c ? '' : c)} />
                      ))}
                    </ScrollView>
                    <View style={e.resultadoResumen}>
                      <Text style={e.resultadoTit}>Plataformas detectadas</Text>
                      <Text style={e.contador}>{visibles.length} de {radar.length}</Text>
                    </View>
                  </View>
                </View>
              }
              renderItem={({ item }) => (
                <Ficha p={item} sigue={sigo.includes(item.slug)}
                  onAbrir={() => abrir(item)} onSeguir={() => alternar(item)}
                  deshabilitado={procesandoSeguimiento} />
              )}
              ListEmptyComponent={
                <EstadoVacioResultados
                  texto={nadaQueVer}
                  sePuedeLimpiar={radar.length > 0 && !!(busqueda || categoria)}
                  onLimpiar={() => { setBusqueda(''); filtrar(''); }}
                />
              }
              ListFooterComponent={
                <View onLayout={(ev) => { medidasPlataformas.current.pie = ev.nativeEvent.layout.height; bajarADescartadas(); }}>
                  <Descartadas fuera={fuera} />
                  <PiePrivacidad onAbrir={() => setPrivacidad(true)} />
                </View>
              }
            />
          ) : null}

          {pestana === 'buscar' && vistaBuscar === 'ofertas' ? (
            <FlatList
              key={`ofertas-${columnasOfertas}-${grupoOfertas}-${grupoProveedorAbierto || 'lista'}`}
              data={filasOfertas}
              keyExtractor={(fila) => fila.slug}
              numColumns={columnasOfertas}
              columnWrapperStyle={columnasOfertas > 1 ? e.filaOfertas : null}
              contentContainerStyle={e.lista}
              keyboardShouldPersistTaps="handled"
              refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
              ListHeaderComponent={
                <View style={e.panelOfertasCompacto}>
                  {avisoCatalogo}
                  <View style={e.selectorOfertas} accessibilityRole="tablist"
                    accessibilityLabel="Seleccionar grupo de ofertas">
                    <SegmentoOferta texto={`Principales ${ofertas.length}`} activo={grupoOfertas === 'principales'}
                      onPress={() => seleccionarGrupoOfertas('principales')} />
                    <SegmentoOferta texto={`Reventa ${secundario.length}`} activo={grupoOfertas === 'secundario'}
                      onPress={() => seleccionarGrupoOfertas('secundario')} />
                    {MODO_LOCAL ? <SegmentoOferta texto="Todo" activo={grupoOfertas === 'todo'}
                      onPress={() => seleccionarGrupoOfertas('todo')} />
                      : <SegmentoOferta texto={`Próximas ${enCamino.length}`} activo={grupoOfertas === 'en_camino'}
                        onPress={() => seleccionarGrupoOfertas('en_camino')} />}
                  </View>
                  {grupoProveedorAbierto ? (
                    <View>
                      <Text style={e.resultadoCompacto}>Referencias de {proveedoresOferta.find(p => p.slug === grupoProveedorAbierto)?.nombre || 'este proveedor'}. La búsqueda se aplica a este grupo.</Text>
                      <Pressable onPress={() => { setProveedorOferta(''); setGrupoProveedorAbierto(''); }}
                        style={({pressed}) => [e.botonBorde, pressed && e.pulsadoSuave]}
                        accessibilityRole="button" accessibilityLabel="Volver a la colección completa de ofertas">
                        <Text style={e.botonBordeTxt}>← Volver a la colección</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  <View style={e.panelBusquedaOfertas}>
                    <View style={[e.busquedaFila, e.busquedaFilaOfertas]}>
                      <Icono nombre="buscar" color={C.tx2} tamano={23} />
                      <TextInput
                        style={e.buscador}
                        placeholder="Ej.: Spiko, Suiza…"
                        placeholderTextColor={C.tx3}
                        value={busquedaOfertas}
                        onChangeText={setBusquedaOfertas}
                        returnKeyType="search"
                        accessibilityLabel="Buscar por oferta, empresa, país o activo"
                      />
                      {hayRestriccionesOfertas ? (
                        <Pressable
                          onPress={() => { setBusquedaOfertas(''); setTipoOferta(''); setProveedorOferta(''); setGrupoProveedorAbierto(''); }}
                          style={({ pressed }) => [e.limpiar, pressed && e.pulsadoSuave]}
                          accessibilityRole="button"
                          accessibilityLabel="Limpiar búsqueda y filtros de ofertas"
                          hitSlop={8}
                        >
                          <Text style={e.limpiarTxt}>✕</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <View style={e.barraFiltrosOfertas}>
                      <Pressable onPress={() => setCriteriosOfertasAbiertos(actual => !actual)}
                        style={({ pressed }) => [e.criteriosOrden, pressed && e.b3Pulsado]}
                        accessibilityRole="button" accessibilityLabel="¿Cómo ordenamos?"
                        accessibilityState={{ expanded: criteriosOfertasAbiertos }}>
                        <Text style={e.b3Txt}>¿Cómo ordenamos? {criteriosOfertasAbiertos ? '−' : '+'}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setFiltrosOfertasAbiertos((abiertos) => !abiertos)}
                        style={({ pressed }) => [e.botonFiltrosOfertas, filtrosOfertasAbiertos && e.botonFiltrosOfertasOn,
                          pressed && e.pulsadoSuave]}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: filtrosOfertasAbiertos }}
                        accessibilityLabel={`Filtros adicionales${filtrosOfertasActivos ? `, ${filtrosOfertasActivos} activos` : ''}`}
                      >
                        <Text style={[e.botonFiltrosOfertasTxt, filtrosOfertasAbiertos && e.botonFiltrosOfertasTxtOn]}>
                          Filtros{filtrosOfertasActivos ? ` · ${filtrosOfertasActivos}` : ''} {filtrosOfertasAbiertos ? '↑' : '↓'}
                        </Text>
                      </Pressable>
                    </View>
                    {/* La frase de la Selección, solo cuando la lista la lleva arriba. */}
                    {criteriosOfertasAbiertos ? <Text style={e.resultadoCompacto}>{filasOfertas[0]?.seleccion
                      ? 'Arriba, la Selección RWAdar: las que pasan las 5 comprobaciones de transparencia. Después, las referencias con cifras comprobables y luego las pendientes o con conflicto. El orden no depende de pagos ni de rentabilidades.'
                      : 'Primero, las referencias con cifras comprobables y luego las pendientes o con conflicto. El orden no depende de pagos ni de rentabilidades.'}</Text> : null}
                    <Text style={e.resultadoCompacto} accessibilityLiveRegion="polite">
                      {ofertasVisibles.length} de {ofertasDelGrupo.length} {ofertasDelGrupo.length === 1 ? 'ficha' : 'fichas'} · {todasOfertas.length} en el catálogo
                    </Text>
                    {/* Un solo aviso para todo el grupo, en vez de repetirlo en cada tarjeta. */}
                    <Text style={e.resultadoCompacto}>{grupoOfertas === 'secundario'
                      ? 'Referencias documentadas de mercado secundario. No confirman precio, liquidez ni disponibilidad actuales.'
                      : grupoOfertas === 'en_camino'
                        ? 'Anuncios documentados. No confirman apertura, fecha de lanzamiento ni acceso a la inversión.'
                        : 'RWAdar no recibe dinero de las inversiones.'}</Text>
                  </View>
                  {filtrosOfertasAbiertos ? (
                    <View style={e.filtrosOfertasDesplegados}>
                      {grupoOfertas === 'principales' || (MODO_LOCAL && grupoOfertas === 'todo') ? (
                        <View>
                          <Text style={e.filtroGrupoEtiqueta}>Tipo de oferta principal</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            style={e.chipsOfertas} contentContainerStyle={e.chipsContenidoCompacto}>
                            <Chip texto="Cualquier tipo" activo={!tipoOferta}
                              onPress={() => { tacto.eleccion(); setTipoOferta(''); }} />
                            <Chip texto={`Rendimiento ${ofertas.filter((o) => o.tipo === 'rendimiento').length}`}
                              activo={tipoOferta === 'rendimiento'}
                              onPress={() => { tacto.eleccion(); setTipoOferta(tipoOferta === 'rendimiento' ? '' : 'rendimiento'); }} />
                            <Chip texto={`Valor ${ofertas.filter((o) => o.tipo === 'valor').length}`}
                              activo={tipoOferta === 'valor'}
                              onPress={() => { tacto.eleccion(); setTipoOferta(tipoOferta === 'valor' ? '' : 'valor'); }} />
                          </ScrollView>
                        </View>
                      ) : null}
                      <Text style={e.filtroGrupoEtiqueta}>Proveedor</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={e.chipsOfertas} contentContainerStyle={e.chipsContenidoCompacto}>
                        <Chip texto="Todos" activo={!proveedorOferta}
                          onPress={() => { tacto.eleccion(); setProveedorOferta(''); setGrupoProveedorAbierto(''); }} />
                        {proveedoresOferta.map((proveedor) => (
                          <Chip key={proveedor.slug} texto={proveedor.nombre} activo={proveedorOferta === proveedor.slug}
                            onPress={() => {
                              tacto.eleccion();
                              setGrupoProveedorAbierto('');
                              setProveedorOferta(proveedorOferta === proveedor.slug ? '' : proveedor.slug);
                            }} />
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => (
                <View style={{ width: columnasOfertas > 1 ? anchoCeldaOferta : '100%' }}>
                  {item.tipo === 'cabecera' ? (
                    <View style={e.bloqueOfertasCab} accessibilityRole="header">
                      {item.seleccion ? <>
                        <Text style={e.bloqueOfertasTit}><Text style={e.bloqueOfertasMarca}>Selección RWAdar</Text> · pasan nuestras 5 comprobaciones</Text>
                        <Text style={e.bloqueOfertasSub}>No es una recomendación de inversión.</Text>
                      </> : <Text style={e.bloqueOfertasTit}>Otras ofertas principales</Text>}
                    </View>
                  ) : item.tipo === 'grupo'
                    ? <FichaGrupoOfertas grupo={item} onAbrir={() => {
                      tacto.abrir(); setProveedorOferta(item.proveedorSlug); setGrupoProveedorAbierto(item.proveedorSlug);
                    }} />
                    : <FichaOferta oferta={item.oferta} plataforma={radar.find(p => p.slug === item.oferta.plataformaSlug)}
                      catalogoCaducado={catalogoCaducado}
                      onAbrir={() => { tacto.abrir(); setOfertaAbierta(item.oferta); }} />}
                </View>
              )}
              ListEmptyComponent={
                <EstadoVacioResultados
                  texto={todasOfertas.length ? 'No hay ofertas que coincidan con esos filtros.'
                    : 'No hay un catálogo de ofertas vigente disponible. Desliza hacia abajo para reintentar.'}
                  sePuedeLimpiar={todasOfertas.length > 0 && !!(busquedaOfertas || tipoOferta || proveedorOferta)}
                  onLimpiar={() => { setBusquedaOfertas(''); setTipoOferta(''); setProveedorOferta(''); setGrupoProveedorAbierto(''); }}
                />
              }
              ListFooterComponent={<View>
                {filasOfertas.length ? <Text style={e.notaImagenes}>Imágenes ilustrativas, no fotos del activo</Text> : null}
                <ExclusionesOfertas datos={exclusionesOfertas} onAbrirEnlace={abrirEnlace} />
              </View>}
            />
          ) : null}

          {pestana === 'academy' ? (
            <Academy
              slug={leccion || null}
              onAbrirLeccion={(slug) => setLeccion(slug)}
              onVolver={() => { tacto.eleccion(); setLeccion(''); }}
              onAccion={accionAcademy}
              onExplicar={() => { tacto.abrir(); setExplicando(true); }}
            />
          ) : null}

          {pestana === 'perfil' ? (
            <PantallaPerfil
              key={`${usuarioAdmitido}:${revisionCartera}`}
              cuenta={cuenta}
              estadoCuenta={estadoCuenta}
              seguridad={CUENTA_REMOTA_ACTIVA ? seguridad : null}
              plataformas={radar}
              onAbrirEnlace={abrirEnlace}
              seguidas={seguidas}
              ofertasGuardadas={ofertasGuardadasVisibles}
              guardadasRetiradas={guardadas.length - ofertasGuardadasVisibles.length}
              sinConexion={sinConexion}
              estadoAvisos={estadoAvisos}
              procesandoAvisos={procesandoAvisos}
              refrescando={refrescando}
              borrando={borrandoDatos}
              onActualizar={refrescar}
              onAbrirEmpresa={abrir}
              onAbrirOferta={(oferta) => { tacto.abrir(); setOfertaAbierta(oferta); }}
              onExplorar={() => irA('buscar')}
              onActivarAvisos={activarAvisos}
              onAjustes={abrirAjustes}
              onExplicar={() => { tacto.abrir(); setExplicando(true); }}
              onPrivacidad={() => setPrivacidad(true)}
              onPolitica={() => abrirEnlace(URL_PRIVACIDAD)}
              onContacto={() => abrirEnlace('mailto:RWAdar@protonmail.com')}
              onBorrar={confirmarBorrado}
              inversionInicial={inversionInicial}
              onConsumirInversion={() => setInversionInicial(null)}
              idioma={idioma}
              textosVersion={actualizacion.activo ? textosActualizacion(actualizacion.resumen,
                { idioma, versionInstalada: actualizacion.versionInstalada }) : null}
              comprobandoVersion={actualizacion.resumen.tipo === 'comprobando'}
              onActualizarApp={actualizarApp}
            />
          ) : null}
        </View>

        <Navegacion
          activa={destinoBarra}
          guardados={sigo.length + guardadas.length}
          novedades={avisos.length}
          onCambiar={cambiarPestana}
        />

        <Detalle p={abierta} sigue={abierta && sigo.includes(abierta.slug)}
          onCerrar={() => { tacto.eleccion(); setAbierta(null); }}
          onSeguir={() => abierta && alternar(abierta)}
          deshabilitado={procesandoSeguimiento} />

        <DetalleOferta
          oferta={ofertaAbierta}
          catalogoCaducado={fechaCatalogo?.caducado === true}
          onCerrar={() => { tacto.eleccion(); setOfertaAbierta(null); }}
          onAbrirEnlace={abrirEnlace}
          plataformaCanonica={!!ofertaAbierta && radar.some((p) => p.slug === ofertaAbierta.plataformaSlug)}
          plataforma={ofertaAbierta && radar.find(p => p.slug === ofertaAbierta.plataformaSlug)}
          guardada={!!ofertaAbierta && guardadas.includes(ofertaAbierta.slug)}
          onGuardar={() => ofertaAbierta && alternarGuardada(ofertaAbierta)}
          onRegistrarInversion={() => {
            if (!ofertaAbierta) return;
            setInversionInicial(ofertaAbierta); setOfertaAbierta(null); setPestana('perfil');
          }}
        />

        <Modal visible={explicando} animationType="slide" onRequestClose={cerrarTutorial}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: C.noche }} edges={['top', 'bottom']}>
              {explicando && <Explicador onCerrar={cerrarTutorial} obtenerAcceso={obtenerAccesoTutorial}
                onPrimeraLeccion={() => { cerrarTutorial(); setLeccion('que-significa-tokenizar-un-activo'); }} />}
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>

        <Privacidad visible={privacidad} onCerrar={() => setPrivacidad(false)} estadoCuenta={estadoCuenta} idioma={idioma}
          onBorrar={confirmarBorrado} borrando={borrandoDatos} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/* Cabecera opaca de una sola línea, como la web (GUIA-ACABADOS §6 y ESPEC
   §4): la marca, el título de la pestaña y la ayuda. Debajo, solo si dice
   algo, una línea con el recuento. */
function Cabecera({ pestana, vistaBuscar, total, ofertas, secundario, enCamino, guardados, sinConexion, onAyuda }) {
  const textos = {
    inicio: { titulo: 'Inicio', subtitulo: '' },
    // Ofertas y Plataformas ya enseñan sus recuentos en el segmentado y los
    // chips; la cabecera solo avisa si es una copia sin conexión o local.
    radar: {
      titulo: 'Plataformas',
      subtitulo: MODO_LOCAL ? `${total} plataformas · fixture local` : sinConexion ? 'Copia sin conexión' : '',
    },
    ofertas: {
      titulo: 'Ofertas',
      subtitulo: MODO_LOCAL ? `${ofertas} principales · ${secundario} referencias secundarias`
        : sinConexion ? 'Copia sin conexión' : '',
    },
    perfil: {
      titulo: 'Perfil',
      subtitulo: guardados ? `${guardados} ${guardados === 1 ? 'guardado' : 'guardados'} en este dispositivo` : 'Lo que guardas, avisos y privacidad',
    },
  };
  const clave = pestana === 'buscar' ? (vistaBuscar === 'ofertas' ? 'ofertas' : 'radar') : pestana;
  const actual = textos[clave] || textos.inicio;

  return (
    <View style={e.cabecera}>
      <View style={e.cabeceraSuperior}>
        <View style={e.marcaFila}>
          <Marca tamano={26} />
          <Text style={e.marca}>RWA<Text style={{ color: C.senal }}>dar</Text></Text>
        </View>
        <Text style={e.cabeceraTitulo} accessibilityRole="header" numberOfLines={1}>{actual.titulo}</Text>
        <Pressable
          onPress={onAyuda}
          style={({ pressed }) => [e.accionCabecera, pressed && e.accionCabeceraPulsada]}
          accessibilityRole="button"
          accessibilityLabel="Abrir explicación animada sobre RWAdar"
          hitSlop={4}
        >
          <Icono nombre="ayuda" color={C.tx} tamano={20} />
        </Pressable>
      </View>
      {actual.subtitulo ? <Text style={e.cabeceraSub}>{actual.subtitulo}</Text> : null}
    </View>
  );
}

function BannerModoLocal() {
  return (
    <View style={e.bannerLocal} accessibilityRole="alert">
      <View style={e.bannerLocalPunto} />
      <Text style={e.bannerLocalTxt}>
        INTERNO · datos locales · sin conexión a Supabase de producción
      </Text>
    </View>
  );
}

function EstadoVacioResultados({ texto, sePuedeLimpiar, onLimpiar }) {
  return (
    <View style={e.vacioResultados}>
      <Icono nombre="radar" color={C.tx3} tamano={38} />
      <Text style={e.vacio}>{texto}</Text>
      {sePuedeLimpiar ? (
        <Pressable
          onPress={onLimpiar}
          style={({ pressed }) => [e.ctaBorde, pressed && e.pulsado]}
          accessibilityRole="button"
        >
          <Text style={e.ctaBordeTxt}>Quitar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function etiquetaEstadoAvisos(estado) {
  switch (estado?.estado) {
    case 'local': return 'Desactivados en modo local';
    case 'desactivados': return 'No activados en esta versión';
    case 'activo': return 'Envío activo';
    case 'preparado': return 'Dispositivo preparado';
    case 'disponible': return 'Permiso disponible';
    case 'registro-pendiente': return 'Registro pendiente';
    case 'denegado': return 'Permiso denegado';
    case 'comprobando': return 'Comprobando';
    case 'no-compatible': return 'No compatible aquí';
    case 'emulador': return 'Requiere dispositivo';
    case 'expo-go': return 'Requiere compilación nativa';
    case 'configuracion-pendiente': return 'Configuración pendiente';
    default: return 'No comprobado';
  }
}

function PreparandoAcceso({ ocupado, mensaje, onReintentar, onSalir, aviso = null }) {
  return <SafeAreaView style={[e.pantalla, e.centro, { padding: 24, gap: 18 }]} edges={['top', 'bottom']}>
    {aviso}
    {ocupado ? <ActivityIndicator size="large" color={C.senal} /> : null}
    <Text style={e.cargandoTxt} accessibilityRole="header">{ocupado ? 'Preparando tu acceso…' : 'Comprueba tu conexión'}</Text>
    {mensaje ? <Text style={e.cargandoTxt} accessibilityRole="alert" accessibilityLiveRegion="polite">{mensaje}</Text> : null}
    {!ocupado ? <>
      <Pressable accessibilityRole="button" accessibilityLabel="Reintentar sesión guardada"
        onPress={onReintentar} style={[e.ctaBorde, { minHeight: 48 }]}>
        <Text style={e.ctaBordeTxt}>Reintentar sesión guardada</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión guardada"
        onPress={onSalir} style={[e.ctaBorde, { minHeight: 48 }]}>
        <Text style={e.ctaBordeTxt}>Cerrar sesión guardada</Text>
      </Pressable>
    </> : null}
  </SafeAreaView>;
}

/* Perfil: cuenta opcional, vigilancia de la cuenta y favoritos locales.
   El registro nunca se mezcla con el seguimiento de instalaciones antiguo. */
function PantallaPerfil({
  cuenta, estadoCuenta, seguridad, plataformas = [], onAbrirEnlace,
  seguidas, ofertasGuardadas, guardadasRetiradas = 0, sinConexion, estadoAvisos, procesandoAvisos,
  refrescando, borrando, onActualizar, onAbrirEmpresa, onAbrirOferta, onExplorar, onActivarAvisos, onAjustes,
  onExplicar, onPrivacidad, onPolitica, onContacto, onBorrar, inversionInicial, onConsumirInversion,
  idioma, textosVersion, comprobandoVersion, onActualizarApp,
}) {
  const total = seguidas.length + ofertasGuardadas.length;
  const usuarioCartera = estadoCuenta?.estado === 'autenticada' ? estadoCuenta.usuario?.id : null;
  const [carteraRemota, setCarteraRemota] = useState(null);
  const carteraCuenta = carteraRemota?.usuarioId === usuarioCartera ? carteraRemota.adaptador : null;
  useEffect(() => {
    if (!cuenta || !usuarioCartera) { setCarteraRemota(null); return; }
    const adaptador = crearCarteraCuenta({ cuenta, usuarioId: usuarioCartera });
    setCarteraRemota({ usuarioId: usuarioCartera, adaptador });
    return () => adaptador.destruir();
  }, [cuenta, usuarioCartera]);
  return (
    <ScrollView
      contentContainerStyle={e.masCuerpo}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onActualizar} tintColor={C.senal} />}
    >
      {estadoCuenta?.estado === 'autenticada' && estadoCuenta.usuario?.id ? (
        cuenta && !carteraCuenta ? <ActivityIndicator color={C.senal} accessibilityLabel="Preparando mis inversiones" /> :
          <MisInversiones usuarioId={estadoCuenta.usuario.id} ofertaInicial={inversionInicial}
            onConsumirOferta={onConsumirInversion} cargar={carteraCuenta?.cargar} guardar={carteraCuenta?.guardar} />
      ) : null}
      {cuenta ? <Cuenta controlador={cuenta} estado={estadoCuenta} seguridad={seguridad} plataformas={plataformas}
        onAbrirEmpresa={onAbrirEmpresa} onAbrirEnlace={onAbrirEnlace} /> : (
      <View style={e.resumenDispositivo}>
        <View style={e.resumenMarca}><Marca tamano={48} /></View>
        <View style={{ flex: 1 }}>
          <Text style={e.resumenEtiqueta}>Tu perfil</Text>
          <Text style={e.resumenTitulo}>Sin cuenta, por ahora</Text>
          <Text style={e.resumenTexto}>
            {MODO_LOCAL
              ? 'Copia interna: lo guardado vive solo en su espacio local y nunca se sincroniza.'
              : USUARIO_LOCAL
                ? 'Las cuentas llegarán próximamente a la app con las nuevas actualizaciones. Lo que guardas se queda en este dispositivo.'
                : 'Lo que guardas se sincroniza con esta instalación.'}
          </Text>
        </View>
        <View style={e.resumenNumero}>
          <Text style={e.resumenNumeroValor}>{total}</Text>
          <Text style={e.resumenNumeroEtiqueta}>Guardados</Text>
        </View>
      </View>
      )}

      {estadoCuenta?.disponible ? <Text style={e.notaFavoritosLocales}>
        Los siguientes favoritos se guardan solo en este dispositivo. Son distintos de la lista de vigilancia de tu cuenta.
      </Text> : null}

      <GrupoMenu titulo={`Plataformas guardadas · ${seguidas.length}`}>
        {seguidas.length ? seguidas.map((p, i) => (
          <FilaMenu key={p.slug} icono="radar" titulo={p.nombre}
            subtitulo={[p.categoria, p.region].filter(Boolean).join(' · ')}
            onPress={() => onAbrirEmpresa(p)} ultima={i === seguidas.length - 1} />
        )) : (
          <FilaMenu icono="buscar" titulo="Todavía no sigues ninguna"
            subtitulo="Abre Buscar y pulsa «+ Seguir» en una empresa" onPress={onExplorar} ultima />
        )}
      </GrupoMenu>

      <GrupoMenu titulo={`Ofertas guardadas · ${ofertasGuardadas.length}`}>
        {ofertasGuardadas.length ? ofertasGuardadas.map((o, i) => (
          <FilaMenu key={o.slug} icono="guardada" titulo={o.titulo}
            subtitulo={[o.plataformaNombre, o.categoria].filter(Boolean).join(' · ')}
            onPress={() => onAbrirOferta(o)} ultima={i === ofertasGuardadas.length - 1} />
        )) : (
          <FilaMenu icono="ofertas" titulo="Todavía no has guardado ninguna"
            subtitulo="Abre una oferta y pulsa la estrella. Guardar no es invertir." onPress={onExplorar} ultima />
        )}
      </GrupoMenu>
      {guardadasRetiradas > 0 ? (
        <Text style={e.notaGuardadas}>
          {guardadasRetiradas === 1 ? 'Una oferta guardada ya no está' : `${guardadasRetiradas} ofertas guardadas ya no están`} en
          el catálogo actual. Se conserva en el dispositivo por si vuelve.
        </Text>
      ) : null}

      <View style={e.grupoSeccion}>
        <Text style={e.grupoTitulo}>Avisos</Text>
        {USUARIO_LOCAL ? (
          <View style={e.avisoProximo}>
            <View style={e.avisoProximoIcono}><Icono nombre="avisos" color={C.senal} tamano={22} /></View>
            <View style={{ flex: 1 }}>
              <Text style={e.resumenEtiqueta}>Próximamente</Text>
              <Text style={e.avisoProximoTit}>Avisos de cambios</Text>
              <Text style={e.resumenTexto}>Los avisos llegarán próximamente a la app con las nuevas actualizaciones.</Text>
            </View>
          </View>
        ) : (
          <PanelAvisos estado={estadoAvisos} tieneSeguimientos={seguidas.length > 0}
            procesando={procesandoAvisos} onActivar={onActivarAvisos} onAjustes={onAjustes} />
        )}
      </View>

      <GrupoMenu titulo="Entender RWAdar">
        <FilaMenu
          icono="ayuda"
          titulo="Cómo funciona la tokenización"
          subtitulo="Abrir la explicación animada en 3D"
          onPress={onExplicar}
        />
        <FilaMenu
          icono="actualizar"
          titulo="Actualizar catálogo"
          subtitulo={MODO_LOCAL ? 'Recargar el fixture incluido en esta copia' :
            sinConexion ? 'Volver a intentar la conexión' : 'Descargar los últimos datos verificados'}
          onPress={onActualizar}
          cargando={refrescando}
          ultima
        />
      </GrupoMenu>

      {textosVersion ? (
        <GrupoMenu titulo={idioma === 'en' ? 'App version' : 'Versión de la app'}>
          <FilaMenu
            icono="actualizar"
            titulo={textosVersion.titulo}
            subtitulo={textosVersion.detalle}
            onPress={onActualizarApp}
            cargando={comprobandoVersion}
            ultima
          />
        </GrupoMenu>
      ) : null}

      <GrupoMenu titulo="Privacidad y datos">
        <FilaMenu
          icono="privacidad"
          titulo="Datos de esta app"
          subtitulo="Qué se guarda y cómo eliminarlo"
          onPress={onPrivacidad}
        />
        {!MODO_LOCAL ? (
          <FilaMenu
            icono="enlace"
            titulo="Política de privacidad"
            subtitulo="Abrir la política completa"
            onPress={onPolitica}
          />
        ) : null}
        <FilaMenu
          icono="correo"
          titulo="Contactar sobre mis datos"
          subtitulo="RWAdar@protonmail.com"
          onPress={onContacto}
        />
        <FilaMenu
          icono="borrar"
          titulo="Borrar datos del dispositivo"
          subtitulo={USUARIO_LOCAL ? 'Guardados, progreso y cachés de esta versión' : 'Instalación, seguimientos, token y cachés'}
          onPress={onBorrar}
          cargando={borrando}
          peligro
          ultima
        />
      </GrupoMenu>

      <Text style={e.notaMas}>
        RWAdar no pide datos bancarios, claves de monedero ni frases de recuperación. Esto no es asesoramiento financiero.
      </Text>
    </ScrollView>
  );
}

function GrupoMenu({ titulo, children }) {
  return (
    <View style={e.grupoSeccion}>
      <Text style={e.grupoTitulo}>{titulo}</Text>
      <View style={e.grupo}>{children}</View>
    </View>
  );
}

function FilaMenu({ icono, titulo, subtitulo, onPress, ultima, peligro, cargando }) {
  const color = peligro ? C.coral : C.tx;
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      style={({ pressed }) => [e.filaMenu, !ultima && e.filaMenuBorde, pressed && e.pulsadoSuave, cargando && e.deshabilitado]}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${subtitulo}`}
      accessibilityState={{ disabled: !!cargando, busy: !!cargando }}
    >
      <View style={[e.filaIcono, peligro && e.filaIconoPeligro]}>
        <Icono nombre={icono} color={color} tamano={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[e.filaTitulo, peligro && e.filaTituloPeligro]}>{titulo}</Text>
        <Text style={e.filaSub}>{subtitulo}</Text>
      </View>
      {cargando ? <ActivityIndicator size="small" color={color} /> : <Icono nombre="flecha" color={C.tx3} tamano={18} />}
    </Pressable>
  );
}

function Chip({ texto, color, activo, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [e.chip, activo && e.chipOn, pressed && e.pulsado]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`Filtrar por ${texto}`}
    >
      {color ? <View style={[e.punto, { backgroundColor: color }]} /> : null}
      <Text style={[e.chipTxt, activo && e.chipTxtOn]} numberOfLines={1}>{texto}</Text>
    </Pressable>
  );
}

function SegmentoOferta({ texto, activo, onPress }) {
  const [, nombreSegmento, cuentaSegmento] = String(texto).match(/^(.*?)(?: (\d+))?$/);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [e.segmentoOferta, activo && e.segmentoOfertaOn, pressed && e.pulsadoSuave]}
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`Mostrar ${texto.toLocaleLowerCase('es')}`}
    >
      {/* El nombre y la cifra por separado, para que el nombre se traduzca. */}
      <Text style={[e.segmentoOfertaTxt, activo && e.segmentoOfertaTxtOn]} numberOfLines={2}>
        {nombreSegmento}{cuentaSegmento ? <Text noTraducir>{` ${cuentaSegmento}`}</Text> : null}
      </Text>
    </Pressable>
  );
}

function PanelVerificacionLocal({ verificacion, compacta = false }) {
  if (!verificacion) return null;
  const campos = [
    ['Estado operativo', verificacion.estadoOperativo],
    ['Licencia / registro', verificacion.licenciaRegistro],
    ['Acceso', verificacion.acceso],
  ];
  const fecha = fechaVerificacionLocalVisible(verificacion.verificadoEl);
  const fuentes = [...new Map([
    ...campos.flatMap(([, campo]) => campo.fuentes || []),
    ...(verificacion.alertasCriticas || []).flatMap(alerta => alerta.fuentes || []),
  ].map(fuente => [fuente.url, fuente])).values()];
  const etiquetaAccesible = [
    `Revisión de fuentes del ${fecha}`,
    ...campos.flatMap(([nombre, campo]) => [
      `${nombre}: ${etiquetaEstadoVerificacionLocal(campo.estado)}`,
      campo.detalle,
    ]),
    ...(verificacion.alertasCriticas || []).map((alerta) => `Importante: ${alerta.detalle}`),
  ].join('. ');

  return (
    <View
      style={[e.verLocal, compacta && e.verLocalCompacta]}
      accessible={compacta}
      accessibilityLabel={compacta ? etiquetaAccesible : undefined}
    >
      <Text style={e.verLocalFecha}>Revisión de fuentes · <Text noTraducir>{fecha}</Text></Text>
      <View style={e.verLocalCampos}>
        {campos.map(([nombre, campo]) => {
          const atencion = campo.estado === 'no_verificable' ||
            campo.estado === 'sin_registro_declarado';
          return (
            <View key={nombre} style={[e.verLocalCampo, atencion && e.verLocalCampoAtencion]}>
              <Text style={e.verLocalCampoNombre}>{nombre}</Text>
              <Text style={[e.verLocalCampoEstado, atencion && e.verLocalCampoEstadoAtencion]}>
                {etiquetaEstadoVerificacionLocal(campo.estado)}
              </Text>
              {!compacta ? <FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={e.verLocalDetalle}>{campo.detalle}</FuenteOriginal> : null}
            </View>
          );
        })}
      </View>
      <View style={e.verLocalAlertas}>
        {(verificacion.alertasCriticas || []).map((alerta) => (
          <View key={alerta.codigo} style={e.verLocalAlerta}>
            <Text style={e.verLocalAlertaTitulo}>Importante</Text>
            <Text noTraducir idiomaOriginal="es-ES" style={e.verLocalAlertaTexto} numberOfLines={compacta ? 3 : undefined}>
              {alerta.detalle}
            </Text>
          </View>
        ))}
      </View>
      {!compacta ? (
        <>
          <Text style={e.verLocalNota}>
            La fecha canónica se conserva aparte. Esta revisión no convierte un registro,
            documento o web accesible en aval, licencia global ni acceso desde España.
          </Text>
          {fuentes.map(fuente => (
            <Pressable key={fuente.url} onPress={() => abrirEnlace(fuente.url)}
              style={({ pressed }) => [e.botonBorde, pressed && e.pulsado]}
              accessibilityRole="link" accessibilityLabel={`Abrir fuente: ${fuente.titulo}`}>
              <Text style={e.botonBordeTxt}>{fuente.titulo} ↗</Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </View>
  );
}

function Ficha({ p, sigue, onAbrir, onSeguir, deshabilitado }) {
  const verificacion = p.verificacionLocal;
  return (
    <View style={e.ficha}>
      <Pressable
        onPress={onAbrir}
        style={({ pressed }) => [e.fichaTop, pressed && e.pulsadoSuave]}
        accessibilityRole="button"
        accessibilityLabel={`${p.nombre}. ${p.actor}, ${p.region}. Abrir ficha.`}
      >
        <View style={[e.mono, { backgroundColor: COLOR_CATEGORIA[p.categoria] || C.sup3 }]}>
          <Text style={e.monoTxt}>{iniciales(p.nombre)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text noTraducir idiomaOriginal="es-ES" style={e.fichaNombre}>{p.nombre}</Text>
          <Text style={e.fichaSub}>{p.actor} · {p.region}</Text>
        </View>
        <Icono nombre="flecha" color={C.tx3} tamano={18} />
      </Pressable>
      <Text style={e.fichaNota} numberOfLines={verificacion ? 4 : 3}>
        {verificacion ? verificacion.estadoOperativo.detalle : p.nota}
      </Text>
      {verificacion ? (
        <PanelVerificacionLocal verificacion={verificacion} compacta />
      ) : (
        <View style={e.etiquetas}>
          <Text style={[e.etiqueta, e.etiquetaAcento]}>{p.acceso}</Text>
          <Text style={e.etiqueta}>Entrada: {(p.ticket || '').toLowerCase()}</Text>
        </View>
      )}
      <Pressable onPress={onSeguir} disabled={deshabilitado}
        style={({ pressed }) => [e.seguir, sigue && e.seguirOn, deshabilitado && e.deshabilitado, pressed && e.pulsado]}
        accessibilityRole="button"
        accessibilityLabel={sigue ? `Dejar de seguir ${p.nombre}` : `Seguir ${p.nombre}`}
        accessibilityState={{ selected: sigue, disabled: deshabilitado }}>
        <Text style={[e.seguirTxt, sigue && e.seguirTxtOn]}>{sigue ? '✓ Siguiendo' : '+ Seguir'}</Text>
      </Pressable>
    </View>
  );
}

function Aviso({ aviso }) {
  return (
    <View style={e.aviso} accessibilityRole="summary">
      <View style={e.avisoMarca} />
      <View style={{ flex: 1 }}>
        <Text style={e.avisoTitular}>{aviso.titular}</Text>
        {aviso.detalle ? <Text style={e.avisoDetalle}>{aviso.detalle}</Text> : null}
      </View>
    </View>
  );
}

function PanelAvisos({ estado, tieneSeguimientos, procesando, onActivar, onAjustes }) {
  let titulo = 'Avisos push';
  let texto = '';
  let accion = null;
  let tono = e.panelAvisos;

  const estadoVisible = USUARIO_LOCAL
    ? (MODO_LOCAL ? 'local' : 'desactivados') : estado.estado;
  switch (estadoVisible) {
    case 'local':
      titulo = 'Avisos desconectados';
      texto = 'El modo interno no solicita permisos, no obtiene tokens y no registra este dispositivo en Supabase.';
      tono = [e.panelAvisos, e.panelAvisosActivo];
      break;
    case 'desactivados':
      titulo = 'Avisos no activados';
      texto = 'Esta versión permite consultar el catálogo y guardar favoritos en el dispositivo. No solicita permisos push, obtiene tokens ni registra instalaciones. No se envían avisos.';
      break;
    case 'comprobando':
      texto = 'Comprobando el estado real de este dispositivo…';
      break;
    case 'configuracion-pendiente':
      texto = 'Esta copia no tiene un projectId de EAS. Seguir una plataforma no implica que vayas a recibir avisos.';
      tono = [e.panelAvisos, e.panelAvisosAtencion];
      break;
    case 'no-compatible':
      texto = 'Los avisos remotos solo se pueden preparar en la app nativa.';
      break;
    case 'emulador':
      texto = 'Para probar avisos hace falta un dispositivo compatible y una compilación de desarrollo.';
      break;
    case 'expo-go':
      texto = 'Expo Go en Android no admite push remoto desde SDK 53. Usa una compilación de desarrollo; aquí no se solicitará permiso.';
      break;
    case 'disponible':
      texto = tieneSeguimientos
        ? 'Si continúas, el sistema pedirá permiso y RWAdar guardará un token de entrega asociado a esta instalación.'
        : 'Primero sigue alguna plataforma. Después podrás decidir, con contexto, si quieres conceder permiso.';
      if (tieneSeguimientos) accion = ['Continuar y pedir permiso', onActivar];
      break;
    case 'registro-pendiente':
      texto = 'El permiso ya está concedido, pero este dispositivo aún no está registrado en RWAdar.';
      if (tieneSeguimientos) accion = ['Completar preparación', onActivar];
      break;
    case 'preparado':
      titulo = 'Dispositivo preparado';
      texto = 'Permiso, token y registro remoto están correctos. El envío automático todavía no está activado, así que no prometemos avisos.';
      tono = [e.panelAvisos, e.panelAvisosAtencion];
      break;
    case 'activo':
      titulo = 'Avisos push activos';
      texto = 'Permiso, token, registro remoto y servicio de envío figuran como operativos.';
      tono = [e.panelAvisos, e.panelAvisosActivo];
      break;
    case 'denegado':
      texto = 'El sistema no permite avisos. RWAdar no volverá a pedir permiso automáticamente.';
      accion = ['Abrir ajustes', onAjustes];
      break;
    case 'error':
    default:
      texto = 'No se pudo comprobar o completar la preparación. No se ha registrado ningún éxito.';
      if (tieneSeguimientos) accion = ['Reintentar', onActivar];
      tono = [e.panelAvisos, e.panelAvisosAtencion];
  }

  return (
    <View style={tono} accessibilityLiveRegion="polite">
      <View style={e.panelAvisosCab}>
        <View style={e.panelAvisosIcono}>
          <Icono nombre="avisos" color={C.senal} tamano={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={e.panelAvisosEtiqueta}>Estado del dispositivo</Text>
          <Text style={e.panelAvisosTitulo}>{titulo}</Text>
        </View>
      </View>
      <Text style={e.panelAvisosTexto}>{texto}</Text>
      {estadoVisible === 'comprobando' || (!USUARIO_LOCAL && procesando) ? (
        <ActivityIndicator size="small" color={C.senal} style={{ marginTop: 10 }} />
      ) : null}
      {accion && !procesando ? (
        <Pressable
          onPress={accion[1]}
          style={({ pressed }) => [e.panelAvisosBoton, pressed && e.pulsadoVerde]}
          accessibilityRole="button"
        >
          <Text style={e.panelAvisosBotonTxt}>{accion[0]}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PiePrivacidad({ onAbrir }) {
  return (
    <Pressable
      onPress={onAbrir}
      style={({ pressed }) => [e.piePrivacidad, pressed && e.pulsadoSuave]}
      accessibilityRole="button"
    >
      <Text style={e.piePrivacidadTxt}>Privacidad y datos de esta app</Text>
    </Pressable>
  );
}

function Privacidad({ visible, onCerrar, onBorrar, borrando, estadoCuenta, idioma }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaProvider>
        <SafeAreaView style={e.pantalla} edges={['top', 'bottom']}>
          <View style={e.detCab}>
            <View style={{ flex: 1 }}>
              <Text style={e.detNombre}>Privacidad</Text>
              <Text style={e.fichaSub}>Qué trata la app móvil</Text>
            </View>
            <Pressable onPress={onCerrar} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]} hitSlop={10}
              accessibilityRole="button" accessibilityLabel="Cerrar privacidad">
              <Text style={e.cerrarTxt}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={e.privacidadCuerpo}>
            {!MODO_LOCAL && estadoCuenta?.disponible ? (
              <>
                <Text style={e.privacidadTit}>Tu cuenta en la app y funciones personales de la web</Text>
                <Text style={e.privacidadParrafo}>
                  Si creas una cuenta se envían tu correo, tu contraseña y, si lo eliges, tu nombre a Supabase. El servicio verifica tu correo antes de permitir el acceso y envía los mensajes de confirmación y recuperación. RWAdar no guarda la contraseña en el dispositivo.
                </Text>
                <Text style={e.privacidadParrafo}>
                  Tu lista de vigilancia y tu registro manual de inversiones se guardan de forma privada en Supabase, asociados a tu cuenta, para consultarlos y modificarlos desde la web y la app con cartera sincronizada. El registro incluye los nombres y proveedores que escribas, moneda, compras, ventas, cobros, gastos y valoraciones con sus cantidades, precios, comisiones y fechas. RWAdar no conecta con tus proveedores ni importa compras o precios automáticamente. No se envían los favoritos locales ni el progreso de Academy.
                </Text>
                <Text style={e.privacidadParrafo}>
                  La sesión se guarda en el almacenamiento seguro del móvil para volver a entrar sin escribir la contraseña. En Perfil puedes activar el desbloqueo con huella, reconocimiento facial o el PIN del sistema. RWAdar no recibe ni guarda esos datos. Cerrar sesión elimina el acceso guardado de este dispositivo. No se activan opiniones, publicidad, avisos por correo ni push al registrarte.
                </Text>
                <Text style={e.privacidadParrafo}>
                  La copia de inversiones de una versión anterior se conserva en este dispositivo. No se sube automáticamente: solo puedes importarla con tu confirmación cuando el registro de la cuenta está vacío. Importarla no borra la copia local ni combina o sustituye inversiones que ya estén en tu cuenta.
                </Text>
                <Text style={e.privacidadParrafo}>
                  Desde Perfil puedes cerrar sesión o borrar la cuenta, confirmando tu contraseña y escribiendo BORRAR. La baja elimina el perfil, la lista de vigilancia y el registro remoto de inversiones. Borrar una inversión desde la cartera guarda el registro de cuenta sin ella. Los favoritos, las copias locales anteriores de inversiones de todas las cuentas y el progreso local se eliminan por separado con «Borrar datos del dispositivo»; ese botón no elimina inversiones de tu cuenta.
                </Text>
              </>
            ) : null}
            {MODO_LOCAL ? (
              <>
                <Text style={e.privacidadTit}>Copia interna aislada</Text>
                <Text style={e.privacidadParrafo}>
                  Empresas, descartes, ofertas e imágenes se leen del fixture incluido en esta copia. La app no consulta Supabase de producción.
                </Text>
                <Text style={e.privacidadTit}>Seguimiento exclusivamente local</Text>
                <Text style={e.privacidadParrafo}>
                  Seguir una plataforma guarda solo su slug bajo claves rwadar.local.*, igual que el progreso de la Academy. No se crea UUID, no se registra un dispositivo y no se conserva ninguna operación para sincronizarla después.
                </Text>
                <Text style={e.privacidadTit}>Avisos desconectados</Text>
                <Text style={e.privacidadParrafo}>
                  Esta copia no solicita permiso, no obtiene un token push y no registra avisos remotos.
                </Text>
                <Text style={e.privacidadTit}>Control de borrado</Text>
                <Text style={e.privacidadParrafo}>
                  El borrado elimina únicamente seguimientos y cachés con el prefijo local. Las claves de una instalación productiva anterior no se leen ni se modifican.
                </Text>
              </>
            ) : USUARIO_LOCAL ? (
              <>
                <Text style={e.privacidadTit}>Catálogo con cuenta confirmada</Text>
                <Text style={e.privacidadParrafo}>
                  Para consultar el catálogo necesitas registrarte, confirmar el correo e iniciar sesión. Supabase verifica la cuenta y la sesión antes de entregar los datos; el proveedor recibe datos técnicos de la conexión, como la dirección IP. No se crea un identificador de instalación para consultar el catálogo.
                </Text>
                <Text style={e.privacidadTit}>Favoritos en este dispositivo</Text>
                <Text style={e.privacidadParrafo}>
                  Las empresas y ofertas guardadas (solo su identificador público) y el progreso de RWAdar Academy (lecciones leídas y aciertos del test) se guardan bajo claves rwadar.editorial.* separadas por cuenta. No se envían al servidor ni se crean operaciones pendientes de sincronización. Las copias de inversiones de versiones anteriores permanecen en el dispositivo hasta que las borres; el registro nuevo de cuenta se guarda por separado en Supabase.
                </Text>
                <Text style={e.privacidadParrafo}>
                  La caché del catálogo también se separa por cuenta. Antes de leerla se necesita conexión para verificar la sesión actual; no permite entrar sin conexión. Si no puede actualizarse una copia completa, se conserva la anterior tras verificar la sesión y se avisa de su fecha. Las cifras vencidas se ocultan.
                </Text>
                <Text style={e.privacidadTit}>{estadoCuenta?.disponible
                  ? 'Instalaciones y avisos desactivados' : 'Servicios de usuario desactivados'}</Text>
                <Text style={e.privacidadParrafo}>
                  No se solicitan permisos push, obtienen tokens ni registran instalaciones. Cambiar de catálogo local a conectado no activa estos servicios.
                </Text>
                <Text style={e.privacidadTit}>Borrado limitado a esta versión</Text>
                <Text style={e.privacidadParrafo}>
                  El botón elimina las empresas y ofertas guardadas, las inversiones registradas de todas las cuentas en este dispositivo, el progreso de la Academy y las cachés del catálogo. No modifica identificadores o seguimientos de versiones anteriores ni elimina datos del servidor. Para solicitar acceso o borrado de datos históricos, usa «Contactar sobre mis datos».
                </Text>
              </>
            ) : (
              <>
                <Text style={e.privacidadTit}>Acceso con cuenta confirmada</Text>
                <Text style={e.privacidadParrafo}>
                  Para consultar el catálogo y los descartes documentados necesitas una cuenta con el correo confirmado y una sesión vigente comprobada con Supabase.
                </Text>
                <Text style={e.privacidadTit}>Identificador y seguimiento</Text>
                <Text style={e.privacidadParrafo}>
                  La app solo genera un UUID aleatorio cuando usas seguimiento o avisos. En iOS y Android se guarda cifrado mediante Keychain o Keystore. Al seguir una plataforma se envían a Supabase ese identificador, la plataforma elegida y el sistema operativo. Si no hay red, el cambio queda pendiente y no se presenta como sincronizado.
                </Text>
                <Text style={e.privacidadTit}>Avisos opcionales</Text>
                <Text style={e.privacidadParrafo}>
                  La app no solicita permiso al abrirse. Solo lo hace después de que pulses el botón contextual. Si aceptas, se guarda en Supabase un token de entrega y la versión de la app.
                </Text>
                <Text style={e.privacidadTit}>Datos locales y terceros</Text>
                <Text style={e.privacidadParrafo}>
                  El catálogo, la fecha de sincronización, tu lista y el progreso de la Academy se guardan localmente por cuenta; leer la caché requiere conexión y verificar la sesión actual. El registro manual de inversiones de cuenta se guarda de forma privada en Supabase para usarlo en la web y la app. Las copias locales anteriores se conservan hasta que las borres y solo se importan con tu confirmación. Supabase presta la base de datos y Expo los servicios que se habiliten expresamente.
                </Text>
                <Text style={e.privacidadTit}>Control de borrado</Text>
                <Text style={e.privacidadParrafo}>
                  Puedes eliminar esta instalación, su token push, sus seguimientos y todas las cachés locales. Primero se exige confirmación remota.
                </Text>
              </>
            )}

            {!MODO_LOCAL ? (idioma === 'en' ? (
              <>
                <Text noTraducir idiomaOriginal="en" style={e.privacidadTit}>App updates</Text>
                <Text noTraducir idiomaOriginal="en" style={e.privacidadParrafo}>
                  When it opens, the app downloads compatible improvements from Expo and asks the RWAdar download page on GitHub whether there is a new Android version. Expo receives your IP address, the platform, the installed version and a random identifier for this installation; GitHub receives your IP address and technical connection data. Neither receives your account or your data. A new version is only downloaded when you tap «Update».
                </Text>
              </>
            ) : (
              <>
                <Text noTraducir style={e.privacidadTit}>Actualizaciones de la app</Text>
                <Text noTraducir style={e.privacidadParrafo}>
                  Al abrirse, la app descarga de Expo las mejoras compatibles y pregunta a la página de descargas de RWAdar en GitHub si hay una versión Android nueva. Expo recibe tu IP, la plataforma, la versión instalada y un identificador aleatorio de esta instalación; GitHub recibe tu IP y datos técnicos de la conexión. Ninguno recibe tu cuenta ni tus datos. Una versión nueva solo se descarga cuando pulsas «Actualizar».
                </Text>
              </>
            )) : null}

            <Text style={e.privacidadTit}>Transparencia comercial</Text>
            <Text style={e.privacidadParrafo}>
              RWAdar no cobra comisión al inversor ni cobra ahora a las empresas por inversiones. Las fichas editoriales son gratuitas; no hay comisiones ni enlaces remunerados activos. Las comisiones por venta quedan para una fase futura, con revisión legal y acuerdo previo, nunca retroactivas. Una relación comercial debe identificarse y no altera el ranking editorial. El dinero de la inversión nunca pasa por RWAdar.
            </Text>
            <Text style={e.privacidadParrafo}>
              La vía inicial de ingresos prevista es publicidad dentro de la app: una red publicitaria pagaría a RWAdar por los anuncios, en espacios separados y marcados como «Publicidad». No depende de invertir en un token. No hay campañas activas ni redes de anuncios integradas en esta versión.
            </Text>

            {!MODO_LOCAL ? (
              <Pressable onPress={() => abrirEnlace(URL_PRIVACIDAD)}
                style={({ pressed }) => [e.botonBorde, pressed && e.pulsado]}
                accessibilityRole="link">
                <Text style={e.botonBordeTxt}>Abrir política completa ↗</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => abrirEnlace('mailto:RWAdar@protonmail.com')}
              style={({ pressed }) => [e.botonBorde, pressed && e.pulsado]}
              accessibilityRole="link">
              <Text style={e.botonBordeTxt}>Contactar sobre mis datos</Text>
            </Pressable>
            <Pressable onPress={onBorrar} disabled={borrando}
              style={({ pressed }) => [e.botonPeligro, borrando && e.deshabilitado, pressed && e.pulsado]}
              accessibilityRole="button" accessibilityState={{ disabled: borrando, busy: borrando }}>
              {borrando ? <ActivityIndicator size="small" color={C.tx} /> : (
                <Text style={e.botonPeligroTxt}>Borrar datos de este dispositivo</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function Descartadas({ fuera }) {
  if (!fuera.length) return null;
  return (
    <View style={e.fueraCaja}>
      <Text style={e.fueraTitulo} accessibilityRole="header">Descartadas</Text>
      <Text style={e.fueraSub}>
        Solo aparecen aquí los descartes cuyo motivo podemos respaldar con una
        fuente comprobable. Señalar a una empresa sin poder demostrarlo vale
        menos que no decir nada.
      </Text>
      {fuera.map((f) => (
        <View key={f.slug} style={e.fueraFila}>
          <View style={e.fueraCab}>
            <Text style={e.fueraNombre}>{f.nombre}</Text>
            <Text style={e.insignia}>{f.etiqueta_descarte}</Text>
          </View>
          <Text style={e.fueraPor}>{f.motivo_descarte}</Text>
          {(f.fuentes || []).length > 0 && (
            <View style={e.fuentes}>
              <Text style={e.fuentesTitulo}>Comprobado en</Text>
              {f.fuentes.map((s) => (
                <Pressable key={s.url} onPress={() => { tacto.eleccion(); abrirEnlace(s.url); }}
                  accessibilityRole="link" accessibilityLabel={`Abrir fuente: ${s.titulo}`}>
                  <Text style={e.fuente} numberOfLines={2}>{s.titulo} ↗</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function Detalle({ p, sigue, onCerrar, onSeguir, deshabilitado }) {
  const transicion = useTransicionFicha(Boolean(p), onCerrar);
  if (!p) return null;
  const verificacion = p.verificacionLocal;
  const filasFicha = verificacion
    ? [['Tipo de actor', p.actor], ['Región / marco', p.region], ['Cadenas', p.cadenas]]
    : [['Tipo de actor', p.actor], ['Región / marco', p.region],
      ['Quién puede entrar', p.acceso], ['Importe de entrada', p.ticket],
      ['Cadenas', p.cadenas]];
  return (
    <Modal visible animationType="none" presentationStyle="fullScreen"
      statusBarTranslucent={false} navigationBarTranslucent={false} onRequestClose={transicion.cerrar}>
      <SafeAreaProvider style={e.pantalla}>
        <Animated.View style={[e.pantalla, transicion.estilo]}>
        <SafeAreaView style={e.pantalla} edges={['top', 'right', 'bottom', 'left']} accessibilityViewIsModal>
          <View style={e.detCab}>
            <View style={[e.mono, e.monoGrande, { backgroundColor: COLOR_CATEGORIA[p.categoria] || C.sup3 }]}>
              <Text style={[e.monoTxt, { fontSize: 18 }]}>{iniciales(p.nombre)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={e.fichaSub}>Ficha de la plataforma</Text>
            </View>
            <Pressable onPress={transicion.cerrar} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]} hitSlop={10}
              accessibilityRole="button" accessibilityLabel={`Cerrar ficha de ${p.nombre}`}>
              <Text style={e.cerrarTxt}>✕</Text>
            </Pressable>
          </View>
          <ScrollView key={p.slug} style={e.detDesplazamiento}
            contentContainerStyle={e.detCuerpo} contentInsetAdjustmentBehavior="never">
            <FuenteOriginal idiomaOriginal="es-ES" />
            <Text noTraducir idiomaOriginal="es-ES" style={e.detNombre} accessibilityRole="header">{p.nombre}</Text>
            <Text style={e.detCategoria}>{p.categoria}</Text>
            {verificacion ? (
              <PanelVerificacionLocal verificacion={verificacion} />
            ) : (
              <>
                <Text style={e.detEtiqueta}>Por qué está en el radar</Text>
                <View style={e.aval}><FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={e.avalTxt}>{p.aval}</FuenteOriginal></View>
                <Text style={e.detEtiqueta}>Qué hace</Text>
                <FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={e.detParrafo}>{p.nota}</FuenteOriginal>
              </>
            )}
            <Text style={e.detEtiqueta}>Ficha</Text>
            <View style={e.tabla}>
              {filasFicha.map(([k, v]) => (
                <View key={k} style={e.filaTabla}>
                  <Text style={e.filaClave}>{k}</Text>
                  <Text noTraducir idiomaOriginal="es-ES" style={e.filaValor}>{v}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={onSeguir} disabled={deshabilitado}
              style={({ pressed }) => [e.botonPrincipal, sigue && e.botonSecundario, deshabilitado && e.deshabilitado, pressed && (sigue ? e.pulsado : e.pulsadoVerde)]}
              accessibilityRole="button"
              accessibilityState={{ selected: sigue, disabled: deshabilitado }}>
              <Text style={[e.botonTxt, sigue && { color: C.senal }]}>
                {sigue ? '✓ Siguiendo esta plataforma' : 'Seguir esta plataforma'}
              </Text>
            </Pressable>
            <Pressable onPress={() => { tacto.eleccion(); p.web && abrirEnlace(p.web); }}
              style={({ pressed }) => [e.botonBorde, pressed && e.pulsado]}
              accessibilityRole="link">
              <Text style={e.botonBordeTxt}>Abrir la web oficial ↗</Text>
            </Pressable>
            <Text style={e.nota}>
              {verificacion
                ? 'Revisión de fuentes primarias, sin comprobación transaccional. No acredita una oferta abierta ni constituye asesoramiento financiero.'
                : 'Esto no es asesoramiento financiero. Que una plataforma esté supervisada no significa que la inversión sea segura.'}
            </Text>
          </ScrollView>
        </SafeAreaView>
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
}

const e = StyleSheet.create({
  criteriosOrden: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', borderRadius: R.m, paddingHorizontal: 8, marginLeft: -8 },
  b3Txt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  b3Pulsado: { backgroundColor: C.senalT },
  pantalla: { flex: 1, backgroundColor: C.noche },
  centro: { alignItems: 'center', justifyContent: 'center' },
  cargandoTxt: { ...T.cuerpo, marginTop: 14, color: C.tx2 },

  /* Las superficies grandes apenas ceden: conservan la respuesta táctil
     sin producir el salto visual de encoger una tarjeta completa. */
  /* Al pulsar cambia el relleno; sin encoger, así vale también con «reducir
     movimiento» (GUIA-ACABADOS §9). */
  pulsado: { backgroundColor: C.ton2 },
  pulsadoSuave: { backgroundColor: C.ton },
  /* El b1 se oscurece al pulsar (GUIA-ACABADOS §4). */
  pulsadoVerde: { backgroundColor: C.senalP },
  deshabilitado: { opacity: 0.5 },

  contenido: { flex: 1 },
  cabecera: {
    backgroundColor: C.s0, paddingHorizontal: UI.margen, paddingTop: 6, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: C.bd,
  },
  cabeceraSuperior: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  marcaFila: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 0 },
  marca: { fontFamily: F.extra, fontSize: 19, letterSpacing: -0.4, color: C.tx },
  accionCabecera: {
    width: 44, height: 44, borderRadius: R.p, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.ton,
  },
  accionCabeceraPulsada: { backgroundColor: C.ton2 },
  cabeceraEtiqueta: { ...T.etiqueta, color: C.tx3 },
  cabeceraTitulo: { ...T.seccion, fontSize: 17, lineHeight: 22, color: C.tx, flex: 1, textAlign: 'center' },
  cabeceraSub: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, textAlign: 'center', marginBottom: 2 },

  estadoGlobal: {
    ...T.menor, fontSize: 13, lineHeight: 19, color: C.aviso, backgroundColor: C.avisoT,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  estadoPendiente: {
    ...T.menor, fontSize: 13, lineHeight: 19, color: C.alarma, backgroundColor: C.alarmaT,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  bannerLocal: {
    minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.senal10,
    borderBottomWidth: 1, borderBottomColor: C.senal34,
  },
  bannerLocalPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.senal },
  bannerLocalTxt: { ...T.etiqueta, color: C.tx3, textAlign: 'center' },

  lista: { padding: UI.margen, paddingBottom: 26 },
  listaVacia: { flexGrow: 1 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, padding: 16, minHeight: 76, marginBottom: 14,
  },
  bannerMarca: {
    width: 40, height: 40, borderRadius: R.m, backgroundColor: C.senalT,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTit: { ...T.ficha, fontSize: 15, lineHeight: 20, color: C.tx },
  bannerSub: { ...T.menor, fontSize: 12, color: C.tx2, marginTop: 2 },

  panelBusqueda: { marginBottom: 12 },
  busquedaFila: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, borderRadius: R.m, backgroundColor: C.ton,
  },
  buscador: { ...T.cuerpo, color: C.tx, flex: 1, paddingVertical: 12 },
  limpiar: {
    width: 36, height: 36, borderRadius: R.p, backgroundColor: C.ton2,
    alignItems: 'center', justifyContent: 'center',
  },
  limpiarTxt: { fontFamily: F.media, fontSize: 13, color: C.tx2 },
  chips: { maxHeight: 58 },
  chipsContenido: { paddingHorizontal: 0, paddingVertical: 10 },
  chip: {
    minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.ton,
    borderRadius: R.p, paddingHorizontal: 12, marginRight: 8,
  },
  chipOn: { backgroundColor: C.tx },
  chipTxt: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.media, color: C.tx2 },
  chipTxtOn: { color: C.s0, fontFamily: F.semi },
  punto: { width: 8, height: 8, borderRadius: 4 },
  resultadoResumen: {
    minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resultadoTit: { ...T.etiqueta, color: C.tx3 },
  contador: { ...T.dato, fontSize: 12, color: C.tx3 },
  filaOfertas: { gap: 12 },
  bloqueOfertasCab: { paddingTop: 14, paddingBottom: 6 },
  bloqueOfertasTit: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 15, lineHeight: 21, color: C.tx },
  bloqueOfertasMarca: { color: C.senal },
  bloqueOfertasSub: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 1 },
  notaImagenes: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3, marginTop: 12, marginBottom: 8 },
  panelOfertasCompacto: { marginBottom: 12 },
  selectorOfertas: {
    minHeight: UI.tactil + 6, flexDirection: 'row', gap: 2, padding: 3,
    backgroundColor: C.ton, borderRadius: R.m,
  },
  segmentoOferta: {
    flex: 1, minHeight: UI.tactil, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.s, paddingHorizontal: 7,
  },
  segmentoOfertaOn: { backgroundColor: C.s3 },
  segmentoOfertaTxt: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.media, color: C.tx2, textAlign: 'center' },
  segmentoOfertaTxtOn: { color: C.tx, fontFamily: F.semi },
  panelBusquedaOfertas: { marginTop: 10 },
  busquedaFilaOfertas: { minHeight: 48 },
  barraFiltrosOfertas: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4,
  },
  resultadoCompacto: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 6 },
  botonFiltrosOfertas: {
    minHeight: UI.tactil, justifyContent: 'center', borderRadius: R.p,
    backgroundColor: C.ton, paddingHorizontal: 14,
  },
  botonFiltrosOfertasOn: { backgroundColor: C.tx },
  botonFiltrosOfertasTxt: { ...T.menor, fontSize: 13, lineHeight: 18, fontFamily: F.semi, color: C.tx2 },
  botonFiltrosOfertasTxtOn: { color: C.s0 },
  filtrosOfertasDesplegados: { marginTop: 8, paddingTop: 4 },
  filtroGrupoEtiqueta: { ...T.etiqueta, color: C.tx3, marginTop: 4, marginBottom: 2 },
  chipsOfertas: { maxHeight: 50 },
  chipsContenidoCompacto: { paddingTop: 5, paddingBottom: 7 },

  ficha: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, padding: 16, marginBottom: 12, gap: 10,
  },
  fichaTop: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mono: { width: 40, height: 40, borderRadius: R.m, alignItems: 'center', justifyContent: 'center' },
  monoGrande: { width: 52, height: 52, borderRadius: R.l },
  /* Las iniciales van sobre el color de la categoría, que es claro:
     encima tiene que ir tinta oscura, no blanca. */
  monoTxt: { fontFamily: F.negrita, fontSize: 15, color: C.noche },
  fichaNombre: { ...T.ficha, color: C.tx },
  fichaSub: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 3 },
  fichaNota: { ...T.cuerpo, color: C.tx2 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  etiqueta: {
    ...T.etiqueta, color: C.tx2, backgroundColor: C.ton,
    borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden',
  },
  etiquetaAcento: { backgroundColor: C.senalT, color: C.senal },
  verLocal: {
    backgroundColor: C.ton, borderRadius: R.m, padding: 14, gap: 11, marginBottom: 2,
  },
  verLocalCompacta: { padding: 12, gap: 8 },
  verLocalFecha: { ...T.etiqueta, color: C.tx3 },
  verLocalCampos: { gap: 7 },
  verLocalCampo: { paddingLeft: 0 },
  verLocalCampoAtencion: {},
  verLocalCampoNombre: { ...T.etiqueta, color: C.tx3 },
  verLocalCampoEstado: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 13, lineHeight: 18, color: C.senal, marginTop: 1 },
  verLocalCampoEstadoAtencion: { color: C.aviso },
  verLocalDetalle: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx2, marginTop: 4 },
  verLocalAlertas: { gap: 7 },
  verLocalAlerta: {
    borderRadius: R.s, backgroundColor: C.alarmaT, padding: 10,
  },
  verLocalAlertaTitulo: { ...T.etiqueta, color: C.alarma },
  verLocalAlertaTexto: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx, marginTop: 4 },
  verLocalNota: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx3 },
  seguir: {
    minHeight: UI.tactil, backgroundColor: C.ton,
    borderRadius: R.m, alignItems: 'center', justifyContent: 'center',
  },
  seguirOn: { backgroundColor: C.senalT },
  seguirTxt: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  seguirTxtOn: { color: C.senal },

  vacio: { ...T.cuerpo, color: C.tx2, textAlign: 'center' },
  vacioGrande: {
    flex: 1, minHeight: 430, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingBottom: 28,
  },
  vacioMarca: {
    width: 132, height: 132, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  vacioEco: {
    position: 'absolute', width: 128, height: 128, borderRadius: 64, backgroundColor: C.senalT,
  },
  vacioIcono: {
    width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senalT, marginBottom: 22,
  },
  vacioTituloGrande: { ...T.seccion, color: C.tx, textAlign: 'center', marginBottom: 10 },
  vacioDescripcion: { ...T.cuerpo, color: C.tx2, textAlign: 'center', maxWidth: 360, marginBottom: 22 },
  vacioAvisos: { minHeight: 330, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  vacioResultados: { alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 36, backgroundColor: C.s1, borderRadius: R.l },
  cta: {
    width: '100%', maxWidth: 340, minHeight: 48, borderRadius: R.m,
    backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  ctaTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.enSenal },
  ctaTexto: { minHeight: UI.tactil, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 7 },
  ctaTextoTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.senal, textAlign: 'center' },
  ctaBorde: {
    minHeight: UI.tactil, borderRadius: R.m, backgroundColor: C.ton,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 4,
  },
  ctaBordeTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },

  resumenSeguimiento: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, padding: 16, marginBottom: 16,
  },
  resumenEtiqueta: { ...T.etiqueta, color: C.tx3, marginBottom: 5 },
  resumenTitulo: { ...T.ficha, color: C.tx },
  resumenTexto: { ...T.menor, color: C.tx2, marginTop: 5 },
  resumenAccion: {
    minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: C.linea2, marginTop: 14, paddingTop: 12,
  },
  resumenAccionTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.senal, flex: 1 },

  seccionCab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, marginBottom: 10,
  },
  seccionTit: { ...T.seccion, color: C.tx },
  seccionDato: {
    ...T.dato, color: C.tx2, backgroundColor: C.ton, minWidth: 27,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.s, textAlign: 'center', overflow: 'hidden',
  },
  aviso: {
    minHeight: 74, flexDirection: 'row', gap: 12, backgroundColor: C.s1,
    borderWidth: 1, borderColor: C.bd, borderRadius: R.l,
    padding: 16, marginBottom: 10,
  },
  avisoMarca: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: C.alarma },
  avisoTitular: { ...T.cuerpoFte, fontFamily: F.negrita, color: C.tx },
  avisoDetalle: { ...T.menor, color: C.tx2, marginTop: 5 },

  panelAvisos: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, padding: 16, marginBottom: 18,
  },
  panelAvisosAtencion: { backgroundColor: C.s1 },
  panelAvisosActivo: { backgroundColor: C.s1 },
  panelAvisosCab: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelAvisosIcono: {
    width: 40, height: 40, borderRadius: R.m, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senalT,
  },
  panelAvisosEtiqueta: { ...T.etiqueta, color: C.tx3, marginBottom: 2 },
  panelAvisosTitulo: { ...T.ficha, color: C.tx },
  panelAvisosTexto: { ...T.menor, color: C.tx2, marginTop: 12 },
  panelAvisosBoton: {
    minHeight: UI.boton, backgroundColor: C.senal, borderRadius: R.m,
    paddingHorizontal: 20, marginTop: 15, alignItems: 'center', justifyContent: 'center',
  },
  panelAvisosBotonTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.enSenal },

  masCuerpo: { padding: UI.margen, paddingBottom: 32 },
  resumenDispositivo: {
    minHeight: 120, flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, padding: 16, marginBottom: 28,
  },
  resumenMarca: {
    width: 56, height: 56, borderRadius: R.p, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.ton,
  },
  resumenNumero: { alignItems: 'center', paddingLeft: 8 },
  resumenNumeroValor: { fontFamily: F.negrita, fontSize: 28, lineHeight: 32, color: C.tx, fontVariant: ['tabular-nums'] },
  resumenNumeroEtiqueta: { ...T.etiqueta, color: C.tx3, marginTop: 2 },
  grupoSeccion: { marginBottom: 25 },
  notaFavoritosLocales: { ...T.menor, fontSize: 12, color: C.tx3, marginTop: 16, marginBottom: 22, paddingHorizontal: 4 },
  notaGuardadas: { ...T.menor, fontSize: 12, color: C.tx3, marginTop: -14, marginBottom: 22, paddingHorizontal: 4 },
  avisoProximo: {
    flexDirection: 'row', gap: 12, padding: 16, backgroundColor: C.s1, borderRadius: R.l,
    borderWidth: 1, borderColor: C.bd,
  },
  avisoProximoIcono: {
    width: 40, height: 40, borderRadius: R.m, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senalT,
  },
  avisoProximoTit: { ...T.ficha, fontSize: 15, lineHeight: 20, color: C.tx, marginBottom: 2 },
  grupoTitulo: { ...T.seccion, fontSize: 17, lineHeight: 22, color: C.tx, marginBottom: 10 },
  grupo: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, overflow: 'hidden',
  },
  filaMenu: {
    minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  filaMenuBorde: { borderBottomWidth: 1, borderBottomColor: C.bd },
  filaIcono: {
    width: 40, height: 40, borderRadius: R.m, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.ton,
  },
  filaIconoPeligro: { backgroundColor: C.alarmaT },
  filaTitulo: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  filaTituloPeligro: { color: C.alarma },
  filaSub: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 2 },
  notaMas: { ...T.menor, fontSize: 12, lineHeight: 18, color: C.tx3, textAlign: 'center', paddingHorizontal: 14 },

  fueraCaja: { marginTop: 28 },
  fueraTitulo: { ...T.seccion, color: C.tx, marginBottom: 6 },
  fueraSub: { ...T.menor, color: C.tx2, marginBottom: 14 },
  fueraFila: {
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.bd,
  },
  fueraCab: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  fueraNombre: { ...T.ficha, fontSize: 15, color: C.tx },
  insignia: {
    ...T.etiqueta, backgroundColor: C.alarmaT, color: C.alarma,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.s, overflow: 'hidden',
  },
  fueraPor: { ...T.menor, color: C.tx2 },
  fuentes: { marginTop: 11, paddingTop: 11, gap: 6, borderTopWidth: 1, borderTopColor: C.linea },
  fuentesTitulo: { ...T.etiqueta, color: C.tx3 },
  fuente: { ...T.menor, fontSize: 13, lineHeight: 19, fontFamily: F.semi, color: C.senal, paddingVertical: 12, marginVertical: -12 },

  piePrivacidad: { alignItems: 'center', paddingVertical: 22 },
  piePrivacidadTxt: { ...T.menor, fontFamily: F.semi, color: C.senal },

  detCab: {
    flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 12, padding: 16,
    borderBottomWidth: 1, borderBottomColor: C.bd, backgroundColor: C.s1,
  },
  detNombre: { ...T.seccion, color: C.tx, lineHeight: 29 },
  detCategoria: { ...T.menor, color: C.tx2, marginTop: 6 },
  cerrar: {
    width: UI.tactil, height: UI.tactil, flexShrink: 0, borderRadius: R.p, backgroundColor: C.ton,
    alignItems: 'center', justifyContent: 'center',
  },
  cerrarTxt: { fontFamily: F.media, fontSize: 15, color: C.tx },
  detDesplazamiento: { flex: 1, minHeight: 0 },
  detCuerpo: { padding: 18, paddingBottom: 40 },
  detEtiqueta: { ...T.etiqueta, color: C.tx3, marginTop: 20, marginBottom: 8 },
  detParrafo: { ...T.cuerpo, fontSize: 15, lineHeight: 23, color: C.tx },
  aval: { backgroundColor: C.ton, borderRadius: R.m, padding: 13 },
  avalTxt: { ...T.cuerpoFte, color: C.tx },
  tabla: { backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd, borderRadius: R.l, overflow: 'hidden' },
  filaTabla: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.linea,
  },
  filaClave: { ...T.menor, color: C.tx2 },
  filaValor: { ...T.menor, fontFamily: F.semi, color: C.tx, flexShrink: 1, textAlign: 'right' },

  /* La acción principal es el único sitio, con el logotipo y los
     rótulos, donde la señal se usa como fondo. */
  botonPrincipal: {
    minHeight: UI.boton, backgroundColor: C.senal, borderRadius: R.m,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 24,
  },
  botonSecundario: { backgroundColor: C.ton },
  botonTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.enSenal },
  botonBorde: {
    minHeight: UI.boton, borderRadius: R.m,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: C.ton,
  },
  botonBordeTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  nota: { ...T.menor, fontSize: 12, color: C.tx2, textAlign: 'center', marginTop: 16 },
  privacidadCuerpo: { padding: 20, paddingBottom: 44 },
  privacidadTit: { ...T.ficha, fontSize: 16, color: C.tx, marginTop: 18, marginBottom: 6 },
  privacidadParrafo: { ...T.cuerpo, color: C.tx2 },
  botonPeligro: {
    minHeight: UI.boton, backgroundColor: C.alarmaT, borderRadius: R.m,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 22,
  },
  botonPeligroTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.alarma },
});
