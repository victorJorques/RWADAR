import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, AppState, FlatList, Linking, Modal, Pressable, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts, Geist_400Regular, Geist_400Regular_Italic, Geist_500Medium, Geist_600SemiBold,
  Geist_700Bold, Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';

import { C, COLOR_CATEGORIA, iniciales, T, E, R, F, UI } from './lib/tema';
import { tacto } from './lib/tacto';
import {
  cargarCatalogo, cargarFuera, siguiendo, alternarSeguimiento, novedades,
  sincronizarSeguimientoPendiente, borrarDatosDispositivo,
  cargarSecundario, cargarExclusiones, proveedoresDeOfertas, textoBusquedaOferta,
  ofertasGuardadas, alternarOfertaGuardada,
} from './lib/datos';
import {
  MODO_LOCAL, SERVICIOS_USUARIO_REMOTOS, CUENTAS_REMOTAS, CORREO_AUTH_E2E,
} from './lib/modo-local';
import { crearControladorCuentas } from './lib/cuentas';
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
import {
  DetalleOferta, ExclusionesOfertas, FichaOferta,
} from './componentes/Ofertas';

const URL_PRIVACIDAD = 'https://rwadar.pages.dev/privacidad';
const LECCIONES_PUBLICADAS = LECCIONES.filter((l) => l.publicado).length;
const USUARIO_LOCAL = MODO_LOCAL || SERVICIOS_USUARIO_REMOTOS !== true;

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
  const [fuentesListas] = useFonts({
    Geist_400Regular, Geist_400Regular_Italic, Geist_500Medium, Geist_600SemiBold,
    Geist_700Bold, Geist_800ExtraBold, GeistMono_500Medium,
  });

  /* Cuatro pestañas: inicio · buscar (empresas u ofertas) · academy · perfil. */
  const [pestana, setPestana] = useState('inicio');
  const [vistaBuscar, setVistaBuscar] = useState('empresas');
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
  const [filtrosOfertasAbiertos, setFiltrosOfertasAbiertos] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [ofertaAbierta, setOfertaAbierta] = useState(null);
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
  const { width: anchoPantalla } = useWindowDimensions();

  useEffect(() => {
    // Crear y liberar en el mismo efecto evita conservar un cliente del SDK
    // al desmontar App y también soporta el doble setup de React StrictMode.
    const controlador = crearControladorCuentas({ modoLocal: MODO_LOCAL,
      cuentasRemotas: CUENTAS_REMOTAS, correoVerificado: CORREO_AUTH_E2E });
    setCuenta(controlador);
    const cancelarSuscripcion = controlador.suscribir(setEstadoCuenta);
    return () => { cancelarSuscripcion(); controlador.destruir(); };
  }, []);

  /* El `finally` no es adorno: si cualquiera de estas llamadas rechazara,
     `cargando` se quedaría en true y la pantalla de "Sintonizando el
     radar…" no se iría nunca. Cada carga ya trae su respaldo desde la
     copia local, así que salir de la pantalla de carga es SIEMPRE lo
     correcto: peor que una lista corta es una app que no arranca. */
  const traer = useCallback(async () => {
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
        mensajes.push(`Revisión pendiente: estos datos se revisaron el ${d}.${m}.${a} y su revisión semanal ha vencido. ` +
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
      setRadar([]); setOfertas([]); setSecundario([]); setEnCamino([]); setFuera([]);
      setExclusionesOfertas([]); setAbierta(null); setOfertaAbierta(null);
      setFechaCatalogo(null);
      setEstadoDatos('No se pudo cargar un catálogo verificable. Desliza hacia abajo para reintentar.');
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { traer(); }, [traer]);
  useEffect(() => {
    let vivo = true;
    ofertasGuardadas().then((lista) => { if (vivo) setGuardadas(lista); });
    return () => { vivo = false; };
  }, []);
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
    return ofertasDelGrupo.filter((oferta) => {
      if (tipoOferta && oferta.tipo !== tipoOferta) return false;
      if (proveedorOferta && oferta.plataformaSlug !== proveedorOferta) return false;
      return !q || textoBusquedaOferta(oferta).includes(q);
    });
  }, [ofertasDelGrupo, busquedaOfertas, tipoOferta, proveedorOferta]);
  const columnasOfertas = anchoPantalla >= 1120 ? 3 : anchoPantalla >= 720 ? 2 : 1;
  const separacionOfertas = 12;
  const anchoCeldaOferta = (anchoPantalla - (UI.margen * 2)
    - (separacionOfertas * (columnasOfertas - 1))) / columnasOfertas;
  const filtrosOfertasActivos = Number(!!tipoOferta) + Number(!!proveedorOferta);
  const hayRestriccionesOfertas = !!(busquedaOfertas || tipoOferta || proveedorOferta);

  const seleccionarGrupoOfertas = (grupo) => {
    tacto.eleccion();
    setGrupoOfertas(grupo);
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
          ? 'Se borrarán las empresas y ofertas guardadas en esta versión editorial, el progreso de la Academy y la caché del catálogo en este dispositivo. No se borran datos de versiones anteriores ni del servidor.'
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
              setRadar([]); setFuera([]); setOfertas([]); setSecundario([]); setEnCamino([]);
              setExclusionesOfertas([]); setSigo([]); setAvisos([]); setGuardadas([]);
              setEstadoDatos(MODO_LOCAL
                ? 'Datos locales borrados. Actualiza para volver a cargar el escaparate incluido en esta copia.'
                : 'Datos borrados. Actualiza para descargar de nuevo el catálogo público.');
              setEstadoAccion('');
              setEstadoAvisos(MODO_LOCAL
                ? { ok: false, estado: 'local', local: true }
                : USUARIO_LOCAL ? { ok: false, estado: 'desactivados' }
                : { estado: 'disponible' });
              setPrivacidad(false);
              Alert.alert('Datos borrados', MODO_LOCAL
                ? 'Se han eliminado los seguimientos y cachés de esta copia local.'
                : USUARIO_LOCAL ? 'Se han eliminado los guardados editoriales, el progreso de la Academy y la caché del catálogo de este dispositivo. No se han modificado datos anteriores ni del servidor.'
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
  /* Destinos de Inicio (noticias y atajos). */
  const irA = (destino, url) => {
    if (destino === 'academy') abrirAcademy();
    else if (destino === 'web' && url) abrirEnlace(url);
    else if (destino === 'buscar' || destino === 'ofertas' || destino === 'fuera') {
      tacto.eleccion();
      setVistaBuscar(destino === 'ofertas' ? 'ofertas' : 'empresas');
      setPestana('buscar');
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
    if (id === pestana) return;
    tacto.eleccion();
    setPestana(id);
  };

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

        {MODO_LOCAL ? <BannerModoLocal /> : null}

        {estadoDatos ? (
          <Text style={e.estadoGlobal} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {estadoDatos}
          </Text>
        ) : null}
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
            />
          ) : null}

          {pestana === 'buscar' ? (
            <SelectorBuscar
              vista={vistaBuscar}
              empresas={radar.length}
              ofertas={todasOfertas.length}
              onCambiar={(vista) => { tacto.eleccion(); setVistaBuscar(vista); }}
            />
          ) : null}

          {pestana === 'buscar' && vistaBuscar === 'empresas' ? (
            <FlatList
              data={visibles}
              keyExtractor={(p) => p.slug}
              contentContainerStyle={e.lista}
              keyboardShouldPersistTaps="handled"
              refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
              ListHeaderComponent={
                <View>
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
                <View>
                  <Descartadas fuera={fuera} />
                  <PiePrivacidad onAbrir={() => setPrivacidad(true)} />
                </View>
              }
            />
          ) : null}

          {pestana === 'buscar' && vistaBuscar === 'ofertas' ? (
            <FlatList
              key={`ofertas-${columnasOfertas}`}
              data={ofertasVisibles}
              keyExtractor={(oferta) => `${oferta.tipo}:${oferta.slug}`}
              numColumns={columnasOfertas}
              columnWrapperStyle={columnasOfertas > 1 ? e.filaOfertas : null}
              contentContainerStyle={e.lista}
              keyboardShouldPersistTaps="handled"
              refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
              ListHeaderComponent={
                <View style={e.panelOfertasCompacto}>
                  <View style={e.selectorOfertas} accessibilityRole="tablist"
                    accessibilityLabel="Seleccionar grupo de ofertas">
                    <SegmentoOferta texto={`Principales ${ofertas.length}`} activo={grupoOfertas === 'principales'}
                      onPress={() => seleccionarGrupoOfertas('principales')} />
                    <SegmentoOferta texto={`Secundario ${secundario.length}`} activo={grupoOfertas === 'secundario'}
                      onPress={() => seleccionarGrupoOfertas('secundario')} />
                    {MODO_LOCAL ? <SegmentoOferta texto="Todo" activo={grupoOfertas === 'todo'}
                      onPress={() => seleccionarGrupoOfertas('todo')} />
                      : <SegmentoOferta texto={`En camino ${enCamino.length}`} activo={grupoOfertas === 'en_camino'}
                        onPress={() => seleccionarGrupoOfertas('en_camino')} />}
                  </View>
                  {grupoOfertas === 'secundario' || grupoOfertas === 'en_camino'
                    ? <Text style={e.resultadoCompacto}>{grupoOfertas === 'secundario'
                      ? 'Referencias documentadas de mercado secundario. No confirman precio, liquidez ni disponibilidad actuales.'
                      : 'Anuncios documentados. No confirman apertura, fecha de lanzamiento ni acceso a la inversión.'}</Text> : null}
                  <View style={e.panelBusquedaOfertas}>
                    <View style={[e.busquedaFila, e.busquedaFilaOfertas]}>
                      <Icono nombre="buscar" color={C.tx2} tamano={23} />
                      <TextInput
                        style={e.buscador}
                        placeholder="Oferta, proveedor, país o métrica"
                        placeholderTextColor={C.tx3}
                        value={busquedaOfertas}
                        onChangeText={setBusquedaOfertas}
                        returnKeyType="search"
                        accessibilityLabel="Buscar ofertas por nombre, proveedor, país o métrica"
                      />
                      {hayRestriccionesOfertas ? (
                        <Pressable
                          onPress={() => { setBusquedaOfertas(''); setTipoOferta(''); setProveedorOferta(''); }}
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
                      <Text style={e.resultadoCompacto} accessibilityLiveRegion="polite">
                        {ofertasVisibles.length} {ofertasVisibles.length === 1 ? 'ficha' : 'fichas'}
                      </Text>
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
                  </View>
                  {filtrosOfertasAbiertos ? (
                    <View style={e.filtrosOfertasDesplegados}>
                      {grupoOfertas === 'principales' || (MODO_LOCAL && grupoOfertas === 'todo') ? (
                        <View>
                          <Text style={e.filtroGrupoEtiqueta}>TIPO DE OFERTA PRINCIPAL</Text>
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
                      <Text style={e.filtroGrupoEtiqueta}>PROVEEDOR</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={e.chipsOfertas} contentContainerStyle={e.chipsContenidoCompacto}>
                        <Chip texto="Todos" activo={!proveedorOferta}
                          onPress={() => { tacto.eleccion(); setProveedorOferta(''); }} />
                        {proveedoresOferta.map((proveedor) => (
                          <Chip key={proveedor.slug} texto={proveedor.nombre} activo={proveedorOferta === proveedor.slug}
                            onPress={() => {
                              tacto.eleccion();
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
                  <FichaOferta oferta={item} onAbrir={() => { tacto.abrir(); setOfertaAbierta(item); }} />
                </View>
              )}
              ListEmptyComponent={
                <EstadoVacioResultados
                  texto={todasOfertas.length ? 'No hay ofertas que coincidan con esos filtros.'
                    : 'No hay un catálogo de ofertas vigente disponible. Desliza hacia abajo para reintentar.'}
                  sePuedeLimpiar={todasOfertas.length > 0 && !!(busquedaOfertas || tipoOferta || proveedorOferta)}
                  onLimpiar={() => { setBusquedaOfertas(''); setTipoOferta(''); setProveedorOferta(''); }}
                />
              }
              ListFooterComponent={<ExclusionesOfertas datos={exclusionesOfertas} onAbrirEnlace={abrirEnlace} />}
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
              cuenta={cuenta}
              estadoCuenta={estadoCuenta}
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
            />
          ) : null}
        </View>

        <Navegacion
          activa={pestana}
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
          onCerrar={() => { tacto.eleccion(); setOfertaAbierta(null); }}
          onAbrirEnlace={abrirEnlace}
          plataformaCanonica={!!ofertaAbierta && radar.some((p) => p.slug === ofertaAbierta.plataformaSlug)}
          guardada={!!ofertaAbierta && guardadas.includes(ofertaAbierta.slug)}
          onGuardar={() => ofertaAbierta && alternarGuardada(ofertaAbierta)}
        />

        <Modal visible={explicando} animationType="slide" onRequestClose={() => setExplicando(false)}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: C.noche }} edges={['top', 'bottom']}>
              <Explicador onCerrar={() => setExplicando(false)} />
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>

        <Privacidad visible={privacidad} onCerrar={() => setPrivacidad(false)} estadoCuenta={estadoCuenta}
          onBorrar={confirmarBorrado} borrando={borrandoDatos} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Cabecera({ pestana, vistaBuscar, total, ofertas, secundario, enCamino, guardados, sinConexion, onAyuda }) {
  const textos = {
    inicio: {
      etiqueta: 'RWADAR',
      titulo: 'Inicio',
      subtitulo: 'Noticias, novedades y por dónde empezar',
    },
    radar: {
      etiqueta: 'RADAR DE ACTIVOS REALES',
      titulo: 'Explora lo verificado',
      subtitulo: MODO_LOCAL
        ? `${total} plataformas · fixture local`
        : `${total} plataformas${sinConexion ? ' · copia sin conexión' : ' · revisión editorial'}`,
    },
    ofertas: {
      etiqueta: MODO_LOCAL ? 'ESCAPARATE LOCAL' : 'ESCAPARATE DE ACTIVOS',
      titulo: 'Ofertas específicas',
      subtitulo: MODO_LOCAL ? `${ofertas} principales · ${secundario} referencias secundarias`
        : `${ofertas} principales · ${secundario} secundarias · ${enCamino} en camino`,
    },
    perfil: {
      etiqueta: 'TU ESPACIO',
      titulo: 'Perfil',
      subtitulo: guardados ? `${guardados} guardados en este dispositivo` : 'Lo que guardas, avisos y privacidad',
    },
  };
  const clave = pestana === 'buscar' ? (vistaBuscar === 'ofertas' ? 'ofertas' : 'radar') : pestana;
  const actual = textos[clave] || textos.inicio;

  return (
    <View style={e.cabecera}>
      <View style={e.cabeceraSuperior}>
        <View style={e.marcaFila} accessibilityRole="header">
          <Marca tamano={27} />
          <Text style={e.marca}>RWA<Text style={{ color: C.senal }}>dar</Text></Text>
        </View>
        <Pressable
          onPress={onAyuda}
          style={({ pressed }) => [e.accionCabecera, pressed && e.pulsado]}
          accessibilityRole="button"
          accessibilityLabel="Abrir explicación animada sobre RWAdar"
          hitSlop={7}
        >
          <Icono nombre="ayuda" color={C.tx} tamano={23} />
        </Pressable>
      </View>
      <Text style={e.cabeceraEtiqueta}>{actual.etiqueta}</Text>
      <Text style={e.cabeceraTitulo} accessibilityRole="header">{actual.titulo}</Text>
      <Text style={e.cabeceraSub}>{actual.subtitulo}</Text>
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

/* Perfil: cuenta opcional, vigilancia de la cuenta y favoritos locales.
   El registro nunca se mezcla con el seguimiento de instalaciones antiguo. */
function PantallaPerfil({
  cuenta, estadoCuenta, plataformas = [], onAbrirEnlace,
  seguidas, ofertasGuardadas, guardadasRetiradas = 0, sinConexion, estadoAvisos, procesandoAvisos,
  refrescando, borrando, onActualizar, onAbrirEmpresa, onAbrirOferta, onExplorar, onActivarAvisos, onAjustes,
  onExplicar, onPrivacidad, onPolitica, onContacto, onBorrar,
}) {
  const total = seguidas.length + ofertasGuardadas.length;
  return (
    <ScrollView
      contentContainerStyle={e.masCuerpo}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onActualizar} tintColor={C.senal} />}
    >
      {cuenta ? <Cuenta controlador={cuenta} estado={estadoCuenta} plataformas={plataformas}
        onAbrirEmpresa={onAbrirEmpresa} onAbrirEnlace={onAbrirEnlace} /> : (
      <View style={e.resumenDispositivo}>
        <View style={e.resumenMarca}><Marca tamano={48} /></View>
        <View style={{ flex: 1 }}>
          <Text style={e.resumenEtiqueta}>TU PERFIL</Text>
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
          <Text style={e.resumenNumeroEtiqueta}>GUARDADOS</Text>
        </View>
      </View>
      )}

      {estadoCuenta?.disponible ? <Text style={e.notaGuardadas}>
        Los siguientes favoritos se guardan solo en este dispositivo. Son distintos de la lista de vigilancia de tu cuenta.
      </Text> : null}

      <GrupoMenu titulo={`Empresas guardadas · ${seguidas.length}`}>
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
              <Text style={e.resumenEtiqueta}>PRÓXIMAMENTE</Text>
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

/* Buscar: todas las empresas del radar o todas las ofertas documentadas. */
function SelectorBuscar({ vista, empresas, ofertas, onCambiar }) {
  return (
    <View style={[e.selectorOfertas, e.selectorBuscar]} accessibilityRole="tablist"
      accessibilityLabel="Buscar empresas u ofertas">
      <SegmentoOferta texto={`Empresas ${empresas}`} activo={vista === 'empresas'} onPress={() => onCambiar('empresas')} />
      <SegmentoOferta texto={`Ofertas ${ofertas}`} activo={vista === 'ofertas'} onPress={() => onCambiar('ofertas')} />
    </View>
  );
}

function SegmentoOferta({ texto, activo, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [e.segmentoOferta, activo && e.segmentoOfertaOn, pressed && e.pulsadoSuave]}
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`Mostrar ${texto.toLocaleLowerCase('es')}`}
    >
      <Text style={[e.segmentoOfertaTxt, activo && e.segmentoOfertaTxtOn]} numberOfLines={2}>{texto}</Text>
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
    ...(verificacion.alertasCriticas || []).map((alerta) => `Alerta crítica: ${alerta.detalle}`),
  ].join('. ');

  return (
    <View
      style={[e.verLocal, compacta && e.verLocalCompacta]}
      accessible={compacta}
      accessibilityLabel={compacta ? etiquetaAccesible : undefined}
    >
      <Text style={e.verLocalFecha}>REVISIÓN DE FUENTES · {verificacion.verificadoEl}</Text>
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
              {!compacta ? <Text style={e.verLocalDetalle}>{campo.detalle}</Text> : null}
            </View>
          );
        })}
      </View>
      <View style={e.verLocalAlertas}>
        {(verificacion.alertasCriticas || []).map((alerta) => (
          <View key={alerta.codigo} style={e.verLocalAlerta}>
            <Text style={e.verLocalAlertaTitulo}>ALERTA CRÍTICA</Text>
            <Text style={e.verLocalAlertaTexto} numberOfLines={compacta ? 3 : undefined}>
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
          <Text style={e.fichaNombre}>{p.nombre}</Text>
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
          <Text style={e.panelAvisosEtiqueta}>ESTADO DEL DISPOSITIVO</Text>
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
          style={({ pressed }) => [e.panelAvisosBoton, pressed && e.pulsado]}
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

function Privacidad({ visible, onCerrar, onBorrar, borrando, estadoCuenta }) {
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
                <Text style={e.privacidadTit}>Cuenta opcional, la misma en web y app</Text>
                <Text style={e.privacidadParrafo}>
                  Si creas una cuenta se envían tu correo, tu contraseña y, si lo eliges, tu nombre a Supabase. El servicio verifica tu correo antes de permitir el acceso y envía los mensajes de confirmación y recuperación. RWAdar no guarda la contraseña en el dispositivo.
                </Text>
                <Text style={e.privacidadParrafo}>
                  Tu lista de vigilancia de empresas se guarda en tu cuenta y es accesible desde la web y la app. No se envían los favoritos locales ni el progreso de Academy. La sesión vive solo en memoria: al cerrar la app tendrás que entrar de nuevo. No se activan opiniones, publicidad, avisos por correo ni push al registrarte.
                </Text>
                <Text style={e.privacidadParrafo}>
                  Desde Perfil puedes cerrar sesión o borrar la cuenta, confirmando tu contraseña y escribiendo BORRAR. La baja elimina el perfil y la lista de vigilancia remota; los favoritos y el progreso locales se eliminan por separado con «Borrar datos del dispositivo».
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
                <Text style={e.privacidadTit}>{estadoCuenta?.disponible
                  ? 'Catálogo público, sin registro obligatorio' : 'Catálogo conectado, sin cuenta'}</Text>
                <Text style={e.privacidadParrafo}>
                  La app consulta el catálogo público en Supabase. El proveedor de infraestructura recibe los datos técnicos de la conexión, como la dirección IP. Consultarlo no crea una cuenta ni un identificador de instalación de RWAdar.
                </Text>
                <Text style={e.privacidadTit}>Favoritos en este dispositivo</Text>
                <Text style={e.privacidadParrafo}>
                  Las empresas y ofertas guardadas (solo su identificador público) y el progreso de RWAdar Academy (lecciones leídas y aciertos del test) se guardan bajo claves rwadar.editorial.*. No se envían al servidor ni se crean operaciones pendientes de sincronización. La caché del catálogo permite consultar un lote válido sin conexión hasta su caducidad.
                </Text>
                <Text style={e.privacidadTit}>{estadoCuenta?.disponible
                  ? 'Instalaciones y avisos desactivados' : 'Servicios de usuario desactivados'}</Text>
                <Text style={e.privacidadParrafo}>
                  No se solicitan permisos push, obtienen tokens ni registran instalaciones. Cambiar de catálogo local a conectado no activa estos servicios.
                </Text>
                <Text style={e.privacidadTit}>Borrado limitado a esta versión</Text>
                <Text style={e.privacidadParrafo}>
                  El botón elimina las empresas y ofertas guardadas, el progreso de la Academy y la caché del catálogo de este dispositivo. No lee ni modifica identificadores o seguimientos de versiones anteriores y no elimina datos del servidor. Para solicitar acceso o borrado de datos históricos, usa «Contactar sobre mis datos».
                </Text>
              </>
            ) : (
              <>
                <Text style={e.privacidadTit}>Consulta sin cuenta</Text>
                <Text style={e.privacidadParrafo}>
                  Puedes consultar el catálogo público y los descartes documentados sin crear una cuenta, dar tu nombre o facilitar tu correo.
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
                  El catálogo, la fecha de sincronización, tu lista y el progreso de la Academy se guardan localmente para funcionar sin conexión. Supabase presta la base de datos y Expo los servicios de token push y actualización.
                </Text>
                <Text style={e.privacidadTit}>Control de borrado</Text>
                <Text style={e.privacidadParrafo}>
                  Puedes eliminar esta instalación, su token push, sus seguimientos y todas las cachés locales. Primero se exige confirmación remota.
                </Text>
              </>
            )}

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
      <Text style={e.fueraTitulo}>Fuera del radar</Text>
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
              <Text style={e.fuentesTitulo}>COMPROBADO EN</Text>
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
  if (!p) return null;
  const verificacion = p.verificacionLocal;
  const filasFicha = verificacion
    ? [['Tipo de actor', p.actor], ['Región / marco', p.region], ['Cadenas', p.cadenas]]
    : [['Tipo de actor', p.actor], ['Región / marco', p.region],
      ['Quién puede entrar', p.acceso], ['Importe de entrada', p.ticket],
      ['Cadenas', p.cadenas]];
  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaProvider>
        <SafeAreaView style={e.pantalla} edges={['top', 'bottom']}>
          <View style={e.detCab}>
            <View style={[e.mono, e.monoGrande, { backgroundColor: COLOR_CATEGORIA[p.categoria] || C.sup3 }]}>
              <Text style={[e.monoTxt, { fontSize: 18 }]}>{iniciales(p.nombre)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={e.detNombre}>{p.nombre}</Text>
              <Text style={e.fichaSub}>{p.categoria}</Text>
            </View>
            <Pressable onPress={onCerrar} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]} hitSlop={10}
              accessibilityRole="button" accessibilityLabel={`Cerrar ficha de ${p.nombre}`}>
              <Text style={e.cerrarTxt}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={e.detCuerpo}>
            {verificacion ? (
              <PanelVerificacionLocal verificacion={verificacion} />
            ) : (
              <>
                <Text style={e.detEtiqueta}>POR QUÉ ESTÁ EN EL RADAR</Text>
                <View style={e.aval}><Text style={e.avalTxt}>{p.aval}</Text></View>
                <Text style={e.detEtiqueta}>QUÉ HACE</Text>
                <Text style={e.detParrafo}>{p.nota}</Text>
              </>
            )}
            <Text style={e.detEtiqueta}>FICHA</Text>
            <View style={e.tabla}>
              {filasFicha.map(([k, v]) => (
                <View key={k} style={e.filaTabla}>
                  <Text style={e.filaClave}>{k}</Text>
                  <Text style={e.filaValor}>{v}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={onSeguir} disabled={deshabilitado}
              style={({ pressed }) => [e.botonPrincipal, sigue && e.botonSecundario, deshabilitado && e.deshabilitado, pressed && e.pulsado]}
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
      </SafeAreaProvider>
    </Modal>
  );
}

const e = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.noche },
  centro: { alignItems: 'center', justifyContent: 'center' },
  cargandoTxt: { ...T.cuerpo, marginTop: 14, color: C.tx2 },

  /* Las superficies grandes apenas ceden: conservan la respuesta táctil
     sin producir el salto visual de encoger una tarjeta completa. */
  pulsado: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  pulsadoSuave: { opacity: 0.68 },
  deshabilitado: { opacity: 0.5 },

  contenido: { flex: 1 },
  cabecera: {
    backgroundColor: C.noche2, paddingHorizontal: UI.margen, paddingTop: 10, paddingBottom: 17,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.linea2,
  },
  cabeceraSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marcaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marca: { fontFamily: F.extra, fontSize: 21, letterSpacing: -0.7, color: C.tx },
  accionCabecera: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sup2, borderWidth: 1, borderColor: C.linea2,
  },
  cabeceraEtiqueta: { ...T.etiqueta, color: C.senal, marginTop: 13, marginBottom: 4 },
  cabeceraTitulo: { ...T.titular, fontSize: 26, lineHeight: 30, color: C.tx },
  cabeceraSub: { ...T.menor, color: C.tx2, marginTop: 3 },

  estadoGlobal: {
    ...T.menor, color: '#F2B23C', backgroundColor: '#2B2416',
    paddingHorizontal: 16, paddingVertical: 9,
  },
  estadoPendiente: {
    ...T.menor, color: C.coral, backgroundColor: C.coral10,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  bannerLocal: {
    minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.senal10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.senal34,
  },
  bannerLocalPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.senal },
  bannerLocalTxt: { ...T.etiqueta, fontSize: 9, color: C.senal, textAlign: 'center' },

  lista: { padding: UI.margen, paddingBottom: 26 },
  listaVacia: { flexGrow: 1 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.ficha, padding: 15, minHeight: 76, marginBottom: 14, ...E.e1,
  },
  bannerMarca: {
    width: 42, height: 42, borderRadius: R.m, backgroundColor: C.senal,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTit: { ...T.ficha, fontSize: 15.5, color: C.tx },
  bannerSub: { ...T.menor, fontSize: 12, color: C.tx2, marginTop: 2 },

  panelBusqueda: {
    backgroundColor: C.sup, borderWidth: 1.5, borderColor: C.senal34,
    borderRadius: R.ficha, marginBottom: 15, overflow: 'hidden', ...E.e2,
  },
  busquedaFila: {
    minHeight: UI.fila, flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.linea2,
  },
  buscador: { ...T.cuerpo, color: C.tx, flex: 1, paddingVertical: 12 },
  limpiar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.sup2,
    alignItems: 'center', justifyContent: 'center',
  },
  limpiarTxt: { fontFamily: F.media, fontSize: 13, color: C.tx2 },
  chips: { maxHeight: 58 },
  chipsContenido: { paddingHorizontal: 12, paddingVertical: 10 },
  chip: {
    minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sup2,
    borderWidth: 1, borderColor: C.linea, borderRadius: R.pastilla,
    paddingHorizontal: 13, paddingVertical: 8, marginRight: 8,
  },
  chipOn: { backgroundColor: C.senal, borderColor: C.senal },
  chipTxt: { ...T.menor, fontFamily: F.media, color: C.tx2 },
  chipTxtOn: { color: C.noche },
  punto: { width: 8, height: 8, borderRadius: 4 },
  resultadoResumen: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea2,
  },
  resultadoTit: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
  contador: { ...T.dato, color: C.senal },
  filaOfertas: { gap: 12 },
  panelOfertasCompacto: { marginBottom: 12 },
  selectorOfertas: {
    minHeight: UI.tactil + 6, flexDirection: 'row', gap: 3, padding: 3,
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.m,
  },
  selectorBuscar: { marginHorizontal: UI.margen, marginTop: 10, marginBottom: 2 },
  segmentoOferta: {
    flex: 1, minHeight: UI.tactil, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.s, paddingHorizontal: 7,
  },
  segmentoOfertaOn: { backgroundColor: C.senal },
  segmentoOfertaTxt: { ...T.dato, fontFamily: F.semi, color: C.tx2, textAlign: 'center' },
  segmentoOfertaTxtOn: { color: C.noche },
  panelBusquedaOfertas: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.m, marginTop: 8, overflow: 'hidden',
  },
  busquedaFilaOfertas: { minHeight: 48 },
  barraFiltrosOfertas: {
    minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  resultadoCompacto: { ...T.dato, color: C.tx2 },
  botonFiltrosOfertas: {
    minHeight: UI.tactil, justifyContent: 'center', borderRadius: R.pastilla,
    borderWidth: 1, borderColor: C.linea2, paddingHorizontal: 11,
  },
  botonFiltrosOfertasOn: { backgroundColor: C.senal10, borderColor: C.senal34 },
  botonFiltrosOfertasTxt: { ...T.dato, fontFamily: F.semi, color: C.tx2 },
  botonFiltrosOfertasTxtOn: { color: C.senal },
  filtrosOfertasDesplegados: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.m, marginTop: 8, paddingTop: 10, paddingBottom: 2,
  },
  filtroGrupoEtiqueta: { ...T.etiqueta, color: C.tx3, paddingHorizontal: 12, marginBottom: 2 },
  chipsOfertas: { maxHeight: 50 },
  chipsContenidoCompacto: { paddingHorizontal: 12, paddingTop: 5, paddingBottom: 7 },

  ficha: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.ficha, padding: 16, marginBottom: 12, gap: 10, ...E.e1,
  },
  fichaTop: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mono: { width: 44, height: 44, borderRadius: R.m, alignItems: 'center', justifyContent: 'center' },
  monoGrande: { width: 52, height: 52, borderRadius: 16 },
  /* Las iniciales van sobre el color de la categoría, que es claro:
     encima tiene que ir tinta oscura, no blanca. */
  monoTxt: { fontFamily: F.extra, fontSize: 15, color: C.noche },
  fichaNombre: { ...T.ficha, color: C.tx },
  fichaSub: { ...T.dato, color: C.tx2, marginTop: 3 },
  fichaNota: { ...T.cuerpo, color: C.tx2 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  etiqueta: {
    ...T.dato, fontSize: 11, color: C.tx2, backgroundColor: C.sup2,
    borderWidth: 1, borderColor: C.linea, borderRadius: R.pastilla,
    paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden',
  },
  etiquetaAcento: { backgroundColor: C.senal10, borderColor: C.senal34, color: C.senal },
  verLocal: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.senal34,
    borderRadius: R.s, padding: 14, gap: 11, marginBottom: 2,
  },
  verLocalCompacta: { padding: 11, gap: 8, backgroundColor: C.noche2 },
  verLocalFecha: { ...T.etiqueta, fontSize: 9.5, color: C.senal },
  verLocalCampos: { gap: 7 },
  verLocalCampo: {
    borderLeftWidth: 2, borderLeftColor: C.senal34, paddingLeft: 9,
  },
  verLocalCampoAtencion: { borderLeftColor: C.coral32 },
  verLocalCampoNombre: { ...T.etiqueta, fontSize: 8.5, color: C.tx3 },
  verLocalCampoEstado: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 12, color: C.senal, marginTop: 1 },
  verLocalCampoEstadoAtencion: { color: C.coral },
  verLocalDetalle: { ...T.menor, fontSize: 12.5, lineHeight: 18, color: C.tx2, marginTop: 4 },
  verLocalAlertas: { gap: 7 },
  verLocalAlerta: {
    borderWidth: 1, borderColor: C.coral32, borderRadius: R.s,
    backgroundColor: C.coral10, padding: 10,
  },
  verLocalAlertaTitulo: { ...T.etiqueta, fontSize: 8.5, color: C.coral },
  verLocalAlertaTexto: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.tx, marginTop: 4 },
  verLocalNota: { ...T.menor, fontSize: 11.5, lineHeight: 17, color: C.tx3 },
  seguir: {
    minHeight: UI.tactil, borderWidth: 1, borderColor: C.senal,
    borderRadius: R.m, alignItems: 'center', justifyContent: 'center',
  },
  seguirOn: { backgroundColor: C.senal10, borderColor: C.senal },
  seguirTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.senal },
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
    position: 'absolute', width: 128, height: 128, borderRadius: 64,
    borderWidth: 1, borderColor: C.senal34, backgroundColor: C.senal10,
  },
  vacioIcono: {
    width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34, marginBottom: 22,
  },
  vacioTituloGrande: { ...T.seccion, color: C.tx, textAlign: 'center', marginBottom: 10 },
  vacioDescripcion: { ...T.cuerpo, color: C.tx2, textAlign: 'center', maxWidth: 360, marginBottom: 22 },
  vacioAvisos: { minHeight: 330, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  vacioResultados: { alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 36 },
  cta: {
    width: '100%', maxWidth: 340, minHeight: UI.boton, borderRadius: R.m,
    backgroundColor: C.senal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18,
  },
  ctaTxt: { ...T.cuerpoFte, fontFamily: F.negrita, fontSize: 15.5, color: C.noche },
  ctaTexto: { minHeight: UI.tactil, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 7 },
  ctaTextoTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.senal, textAlign: 'center' },
  ctaBorde: {
    minHeight: UI.tactil, borderRadius: R.m, borderWidth: 1, borderColor: C.senal,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 4,
  },
  ctaBordeTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.senal },

  resumenSeguimiento: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.senal34,
    borderRadius: R.ficha, padding: 17, marginBottom: 16, ...E.e2,
  },
  resumenEtiqueta: { ...T.etiqueta, color: C.senal, marginBottom: 5 },
  resumenTitulo: { ...T.ficha, color: C.tx },
  resumenTexto: { ...T.menor, color: C.tx2, marginTop: 5 },
  resumenAccion: {
    minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea2, marginTop: 14, paddingTop: 12,
  },
  resumenAccionTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.senal, flex: 1 },

  seccionCab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, marginBottom: 10,
  },
  seccionTit: { ...T.seccion, fontSize: 19, color: C.tx },
  seccionDato: {
    ...T.dato, color: C.noche, backgroundColor: C.senal, minWidth: 27,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: R.pastilla, textAlign: 'center', overflow: 'hidden',
  },
  aviso: {
    minHeight: 74, flexDirection: 'row', gap: 12, backgroundColor: C.sup,
    borderWidth: 1, borderColor: C.linea, borderRadius: R.ficha,
    padding: 15, marginBottom: 10, ...E.e1,
  },
  avisoMarca: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: C.coral },
  avisoTitular: { ...T.cuerpoFte, fontFamily: F.negrita, color: C.tx },
  avisoDetalle: { ...T.menor, color: C.tx2, marginTop: 5 },

  panelAvisos: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.ficha, padding: 17, marginBottom: 18, ...E.e2,
  },
  panelAvisosAtencion: { backgroundColor: '#241F14', borderColor: '#6F592B' },
  panelAvisosActivo: { backgroundColor: C.senal10, borderColor: C.senal34 },
  panelAvisosCab: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelAvisosIcono: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34,
  },
  panelAvisosEtiqueta: { ...T.etiqueta, fontSize: 9, color: C.senal, marginBottom: 2 },
  panelAvisosTitulo: { ...T.ficha, color: C.tx },
  panelAvisosTexto: { ...T.menor, color: C.tx2, marginTop: 12 },
  panelAvisosBoton: {
    minHeight: UI.boton, backgroundColor: C.senal, borderRadius: R.m,
    paddingHorizontal: 16, marginTop: 15, alignItems: 'center', justifyContent: 'center',
  },
  panelAvisosBotonTxt: { ...T.cuerpoFte, fontFamily: F.negrita, color: C.noche },

  masCuerpo: { padding: UI.margen, paddingBottom: 32 },
  resumenDispositivo: {
    minHeight: 136, flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.senal34,
    borderRadius: R.ficha, padding: 16, marginBottom: 28, ...E.e2,
  },
  resumenMarca: {
    width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.noche2, borderWidth: 1, borderColor: C.linea2,
  },
  resumenNumero: { alignItems: 'center', paddingLeft: 8 },
  resumenNumeroValor: { fontFamily: F.extra, fontSize: 27, lineHeight: 30, color: C.senal },
  resumenNumeroEtiqueta: { ...T.etiqueta, fontSize: 8, color: C.tx3, marginTop: 2 },
  grupoSeccion: { marginBottom: 25 },
  notaGuardadas: { ...T.menor, fontSize: 12, color: C.tx3, marginTop: -14, marginBottom: 22, paddingHorizontal: 4 },
  avisoProximo: {
    flexDirection: 'row', gap: 12, padding: 15, backgroundColor: C.sup, borderRadius: R.m,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.linea,
  },
  avisoProximoIcono: {
    width: 44, height: 44, borderRadius: R.s, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34,
  },
  avisoProximoTit: { ...T.ficha, fontSize: 15.5, color: C.tx, marginBottom: 2 },
  grupoTitulo: { ...T.seccion, fontSize: 19, color: C.tx, marginBottom: 10 },
  grupo: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.ficha, overflow: 'hidden', ...E.e1,
  },
  filaMenu: {
    minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  filaMenuBorde: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.linea2 },
  filaIcono: {
    width: 42, height: 42, borderRadius: R.m, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sup2, borderWidth: 1, borderColor: C.linea2,
  },
  filaIconoPeligro: { backgroundColor: C.coral10, borderColor: C.coral32 },
  filaTitulo: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
  filaTituloPeligro: { color: C.coral },
  filaSub: { ...T.menor, fontSize: 12, color: C.tx2, marginTop: 2 },
  notaMas: { ...T.menor, fontSize: 12, lineHeight: 18, color: C.tx3, textAlign: 'center', paddingHorizontal: 14 },

  fueraCaja: { marginTop: 28 },
  fueraTitulo: { ...T.seccion, color: C.tx, marginBottom: 6 },
  fueraSub: { ...T.menor, color: C.tx2, marginBottom: 14 },
  fueraFila: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.s, padding: 14, marginBottom: 8, ...E.e1,
  },
  fueraCab: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  fueraNombre: { ...T.ficha, fontSize: 15, color: C.tx },
  insignia: {
    ...T.etiqueta, fontSize: 9.5, backgroundColor: C.coral, color: C.tx,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pastilla, overflow: 'hidden',
  },
  fueraPor: { ...T.menor, color: C.tx2 },
  fuentes: { marginTop: 11, paddingTop: 11, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea },
  fuentesTitulo: { ...T.etiqueta, fontSize: 9.5, color: C.tx2 },
  fuente: { ...T.menor, fontSize: 12, fontFamily: F.semi, color: C.senal },

  piePrivacidad: { alignItems: 'center', paddingVertical: 22 },
  piePrivacidadTxt: { ...T.menor, fontFamily: F.semi, color: C.senal, textDecorationLine: 'underline' },

  detCab: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18,
    borderBottomWidth: 1, borderBottomColor: C.linea, backgroundColor: C.noche2,
  },
  detNombre: { ...T.seccion, color: C.tx },
  cerrar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.sup2,
    borderWidth: 1, borderColor: C.linea, alignItems: 'center', justifyContent: 'center',
  },
  cerrarTxt: { fontFamily: F.media, fontSize: 15, color: C.tx2 },
  detCuerpo: { padding: 18, paddingBottom: 40 },
  detEtiqueta: { ...T.etiqueta, color: C.tx2, marginTop: 20, marginBottom: 8 },
  detParrafo: { ...T.cuerpo, fontSize: 15, lineHeight: 23, color: C.tx },
  aval: { backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34, borderRadius: R.s, padding: 13 },
  avalTxt: { ...T.cuerpoFte, color: C.senal },
  tabla: { backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.s },
  filaTabla: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.linea,
  },
  filaClave: { ...T.menor, color: C.tx2 },
  filaValor: { ...T.menor, fontFamily: F.semi, color: C.tx, flexShrink: 1, textAlign: 'right' },

  /* La acción principal es el único sitio, con el logotipo y los
     rótulos, donde la señal se usa como fondo. */
  botonPrincipal: {
    minHeight: UI.boton, backgroundColor: C.senal, borderRadius: R.m,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 24, ...E.e2,
  },
  botonSecundario: { backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal },
  botonTxt: { ...T.cuerpoFte, fontFamily: F.negrita, fontSize: 15, color: C.noche },
  botonBorde: {
    minHeight: UI.boton, borderWidth: 1, borderColor: C.linea, borderRadius: R.m,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: C.sup,
  },
  botonBordeTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
  nota: { ...T.menor, fontSize: 12, color: C.tx2, textAlign: 'center', marginTop: 16 },
  privacidadCuerpo: { padding: 20, paddingBottom: 44 },
  privacidadTit: { ...T.ficha, fontSize: 16, color: C.tx, marginTop: 18, marginBottom: 6 },
  privacidadParrafo: { ...T.cuerpo, color: C.tx2 },
  botonPeligro: {
    minHeight: UI.boton, backgroundColor: C.coral, borderRadius: R.m,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 22,
  },
  botonPeligroTxt: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx },
});
