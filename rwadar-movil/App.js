import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Linking, Modal, Pressable, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold,
  Geist_700Bold, Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';

import { C, COLOR_CATEGORIA, iniciales, T, E, R, F, UI } from './lib/tema';
import { tacto } from './lib/tacto';
import {
  cargarRadar, cargarFuera, siguiendo, alternarSeguimiento, novedades,
  sincronizarSeguimientoPendiente, borrarDatosDispositivo,
} from './lib/datos';
import {
  consultarEstadoAvisos, registrarParaAvisos, observarAperturasAvisos,
} from './lib/avisos';
import Explicador from './componentes/Explicador';
import Radar from './componentes/Radar';
import Marca from './componentes/Marca';
import Navegacion, { Icono } from './componentes/Navegacion';

const URL_PRIVACIDAD = 'https://rwadar.pages.dev/privacidad';

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
    Geist_400Regular, Geist_500Medium, Geist_600SemiBold,
    Geist_700Bold, Geist_800ExtraBold, GeistMono_500Medium,
  });

  const [pestana, setPestana] = useState('radar');
  const [radar, setRadar] = useState([]);
  const [fuera, setFuera] = useState([]);
  const [sigo, setSigo] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [explicando, setExplicando] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const [estadoDatos, setEstadoDatos] = useState('');
  const [estadoAccion, setEstadoAccion] = useState('');
  const [procesandoSeguimiento, setProcesandoSeguimiento] = useState(false);
  const [estadoAvisos, setEstadoAvisos] = useState({ estado: 'comprobando' });
  const [procesandoAvisos, setProcesandoAvisos] = useState(false);
  const [borrandoDatos, setBorrandoDatos] = useState(false);
  const [slugAvisoPendiente, setSlugAvisoPendiente] = useState(null);

  /* El `finally` no es adorno: si cualquiera de estas llamadas rechazara,
     `cargando` se quedaría en true y la pantalla de "Sintonizando el
     radar…" no se iría nunca. Cada carga ya trae su respaldo desde la
     copia local, así que salir de la pantalla de carga es SIEMPRE lo
     correcto: peor que una lista corta es una app que no arranca. */
  const traer = useCallback(async () => {
    try {
      const [r, f, s] = await Promise.all([cargarRadar(), cargarFuera(), siguiendo()]);
      setRadar(r.datos); setFuera(f.datos); setSigo(s);
      setSinConexion(!!(r.deCache || f.deCache));

      const [n, sincronizacion] = await Promise.all([
        novedades(s),
        sincronizarSeguimientoPendiente(),
      ]);
      setAvisos(n.datos);

      const mensajes = [];
      if (r.error || f.error) {
        mensajes.push('Mostramos la última copia guardada; no se pudo actualizar el catálogo.');
      }
      if (n.error && s.length) mensajes.push('No se pudieron consultar las novedades.');
      if (sincronizacion.pendientes) {
        mensajes.push(`${sincronizacion.pendientes} cambio(s) de seguimiento pendientes de sincronizar.`);
      }
      setEstadoDatos(mensajes.join(' '));
      return !r.deCache && !f.deCache;
    } catch {
      setEstadoDatos('No se pudieron cargar los datos locales. Cierra y vuelve a abrir la app.');
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { traer(); }, [traer]);
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
      setPestana('radar');
      setAbierta(plataforma);
    } else {
      /* Si el cambio acaba de sacar la plataforma del radar, su ficha activa
         ya no existe. La pantalla de avisos conserva el titular y el motivo. */
      setPestana('avisos');
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
    ? 'No se ha podido traer el radar y todavía no hay copia guardada. Desliza hacia abajo para reintentar cuando tengas cobertura.'
    : 'El radar no detecta nada con esos filtros.';

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return radar.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (!q) return true;
      return [p.nombre, p.nota, p.aval, p.categoria, p.region, p.cadenas]
        .join(' ').toLowerCase().includes(q);
    });
  }, [radar, busqueda, categoria]);

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
      'Se eliminarán de Supabase esta instalación, su token push y todos sus seguimientos, además de las cachés locales. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar definitivamente',
          style: 'destructive',
          onPress: async () => {
            setBorrandoDatos(true);
            try {
              await borrarDatosDispositivo();
              setRadar([]); setFuera([]); setSigo([]); setAvisos([]);
              setEstadoDatos('Datos borrados. Actualiza para descargar de nuevo el catálogo público.');
              setEstadoAccion('');
              setEstadoAvisos({ estado: 'disponible' });
              setPrivacidad(false);
              Alert.alert('Datos borrados', 'La instalación no volverá a identificarse hasta que uses seguimiento o avisos.');
            } catch {
              Alert.alert(
                'No se borraron los datos',
                'Supabase no confirmó el borrado. Se conservan la identidad y los datos locales para que puedas reintentarlo.'
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
        <Cabecera
          pestana={pestana}
          total={radar.length}
          seguidas={sigo.length}
          sinConexion={sinConexion}
          onAyuda={() => { tacto.abrir(); setExplicando(true); }}
        />

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
          {pestana === 'radar' ? (
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

                  <Pressable
                    onPress={() => { tacto.abrir(); setExplicando(true); }}
                    style={({ pressed }) => [e.banner, pressed && e.pulsado]}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir explicación animada sobre tokenización"
                  >
                    <View style={e.bannerMarca}><Icono nombre="ayuda" color={C.noche} tamano={22} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={e.bannerTit}>¿Qué es tokenizar un activo?</Text>
                      <Text style={e.bannerSub}>Explicado con una animación 3D, paso a paso</Text>
                    </View>
                    <Icono nombre="flecha" color={C.tx3} tamano={20} />
                  </Pressable>

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

          {pestana === 'sigo' ? (
            <FlatList
              data={seguidas}
              keyExtractor={(p) => p.slug}
              contentContainerStyle={[e.lista, !seguidas.length && e.listaVacia]}
              refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
              ListHeaderComponent={seguidas.length ? (
                <ResumenSeguimiento cantidad={seguidas.length} onAvisos={() => cambiarPestana('avisos')} />
              ) : null}
              renderItem={({ item }) => (
                <Ficha p={item} sigue onAbrir={() => abrir(item)} onSeguir={() => alternar(item)}
                  deshabilitado={procesandoSeguimiento} />
              )}
              ListEmptyComponent={
                <EstadoVacioSeguimiento
                  onExplorar={() => cambiarPestana('radar')}
                  onAprender={() => { tacto.abrir(); setExplicando(true); }}
                />
              }
              ListFooterComponent={seguidas.length ? <PiePrivacidad onAbrir={() => setPrivacidad(true)} /> : null}
            />
          ) : null}

          {pestana === 'avisos' ? (
            <FlatList
              data={avisos}
              keyExtractor={(a) => String(a.id)}
              contentContainerStyle={[e.lista, !avisos.length && e.listaVacia]}
              refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={C.senal} />}
              ListHeaderComponent={
                <View>
                  <PanelAvisos
                    estado={estadoAvisos}
                    tieneSeguimientos={sigo.length > 0}
                    procesando={procesandoAvisos}
                    onActivar={activarAvisos}
                    onAjustes={abrirAjustes}
                  />
                  {avisos.length ? (
                    <View style={e.seccionCab}>
                      <Text style={e.seccionTit}>Últimas novedades</Text>
                      <Text style={e.seccionDato}>{avisos.length}</Text>
                    </View>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => <Aviso aviso={item} />}
              ListEmptyComponent={
                <EstadoVacioAvisos onExplorar={() => cambiarPestana('radar')} />
              }
              ListFooterComponent={<PiePrivacidad onAbrir={() => setPrivacidad(true)} />}
            />
          ) : null}

          {pestana === 'mas' ? (
            <PantallaMas
              cantidadSeguimientos={sigo.length}
              sinConexion={sinConexion}
              estadoAvisos={estadoAvisos}
              refrescando={refrescando}
              borrando={borrandoDatos}
              onActualizar={refrescar}
              onAvisos={() => cambiarPestana('avisos')}
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
          seguimientos={sigo.length}
          novedades={avisos.length}
          onCambiar={cambiarPestana}
        />

        <Detalle p={abierta} sigue={abierta && sigo.includes(abierta.slug)}
          onCerrar={() => { tacto.eleccion(); setAbierta(null); }}
          onSeguir={() => abierta && alternar(abierta)}
          deshabilitado={procesandoSeguimiento} />

        <Modal visible={explicando} animationType="slide" onRequestClose={() => setExplicando(false)}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: C.noche }} edges={['top', 'bottom']}>
              <Explicador onCerrar={() => setExplicando(false)} />
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>

        <Privacidad visible={privacidad} onCerrar={() => setPrivacidad(false)}
          onBorrar={confirmarBorrado} borrando={borrandoDatos} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Cabecera({ pestana, total, seguidas, sinConexion, onAyuda }) {
  const textos = {
    radar: {
      etiqueta: 'RADAR DE ACTIVOS REALES',
      titulo: 'Explora lo verificado',
      subtitulo: `${total} plataformas${sinConexion ? ' · copia sin conexión' : ' · datos actualizados'}`,
    },
    sigo: {
      etiqueta: 'TU SEGUIMIENTO',
      titulo: 'Plataformas seguidas',
      subtitulo: seguidas ? `${seguidas} bajo seguimiento en este dispositivo` : 'Guarda las que quieras vigilar',
    },
    avisos: {
      etiqueta: 'ESTADO Y NOVEDADES',
      titulo: 'Avisos claros',
      subtitulo: 'Permiso, preparación y entrega son estados distintos',
    },
    mas: {
      etiqueta: 'CONTROL DE LA APP',
      titulo: 'Más',
      subtitulo: 'Aprendizaje, actualización y privacidad',
    },
  };
  const actual = textos[pestana] || textos.radar;

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

function ResumenSeguimiento({ cantidad, onAvisos }) {
  return (
    <View style={e.resumenSeguimiento}>
      <Text style={e.resumenEtiqueta}>TU RADAR</Text>
      <Text style={e.resumenTitulo}>
        {cantidad} {cantidad === 1 ? 'plataforma seguida' : 'plataformas seguidas'}
      </Text>
      <Text style={e.resumenTexto}>
        Los cambios se guardan también sin conexión. RWAdar te indicará si queda algo pendiente de sincronizar.
      </Text>
      <Pressable
        onPress={onAvisos}
        style={({ pressed }) => [e.resumenAccion, pressed && e.pulsado]}
        accessibilityRole="button"
      >
        <Icono nombre="avisos" color={C.senal} tamano={20} />
        <Text style={e.resumenAccionTxt}>Comprobar avisos</Text>
        <Icono nombre="flecha" color={C.tx3} tamano={18} />
      </Pressable>
    </View>
  );
}

function EstadoVacioSeguimiento({ onExplorar, onAprender }) {
  return (
    <View style={e.vacioGrande}>
      <View style={e.vacioMarca}>
        <View style={e.vacioEco} />
        <Marca tamano={74} />
      </View>
      <Text style={e.vacioTituloGrande}>Guarda lo que quieras vigilar</Text>
      <Text style={e.vacioDescripcion}>
        Sigue una plataforma para tenerla a mano y consultar aquí sus novedades verificadas.
      </Text>
      <Pressable
        onPress={onExplorar}
        style={({ pressed }) => [e.cta, pressed && e.pulsado]}
        accessibilityRole="button"
      >
        <Text style={e.ctaTxt}>Explorar el radar</Text>
      </Pressable>
      <Pressable
        onPress={onAprender}
        style={({ pressed }) => [e.ctaTexto, pressed && e.pulsadoSuave]}
        accessibilityRole="button"
      >
        <Text style={e.ctaTextoTxt}>Ver cómo funciona la tokenización</Text>
      </Pressable>
    </View>
  );
}

function EstadoVacioAvisos({ onExplorar }) {
  return (
    <View style={e.vacioAvisos}>
      <View style={e.vacioIcono}><Icono nombre="avisos" color={C.senal} tamano={44} /></View>
      <Text style={e.vacioTituloGrande}>No hay novedades todavía</Text>
      <Text style={e.vacioDescripcion}>
        Aquí aparecerán los cambios publicados para las plataformas que sigues. El panel superior muestra el estado real del dispositivo.
      </Text>
      <Pressable
        onPress={onExplorar}
        style={({ pressed }) => [e.cta, pressed && e.pulsado]}
        accessibilityRole="button"
      >
        <Text style={e.ctaTxt}>Explorar plataformas</Text>
      </Pressable>
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

function PantallaMas({
  cantidadSeguimientos, sinConexion, estadoAvisos, refrescando, borrando,
  onActualizar, onAvisos, onExplicar, onPrivacidad, onPolitica, onContacto, onBorrar,
}) {
  return (
    <ScrollView
      contentContainerStyle={e.masCuerpo}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onActualizar} tintColor={C.senal} />}
    >
      <View style={e.resumenDispositivo}>
        <View style={e.resumenMarca}><Marca tamano={48} /></View>
        <View style={{ flex: 1 }}>
          <Text style={e.resumenEtiqueta}>TU DISPOSITIVO</Text>
          <Text style={e.resumenTitulo}>RWAdar listo para consultar</Text>
          <Text style={e.resumenTexto}>
            {sinConexion ? 'Usando la última copia local disponible.' : 'Catálogo conectado y disponible sin crear una cuenta.'}
          </Text>
        </View>
        <View style={e.resumenNumero}>
          <Text style={e.resumenNumeroValor}>{cantidadSeguimientos}</Text>
          <Text style={e.resumenNumeroEtiqueta}>SIGUIENDO</Text>
        </View>
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
          subtitulo={sinConexion ? 'Volver a intentar la conexión' : 'Descargar los últimos datos verificados'}
          onPress={onActualizar}
          cargando={refrescando}
          ultima
        />
      </GrupoMenu>

      <GrupoMenu titulo="Avisos">
        <FilaMenu
          icono="avisos"
          titulo="Gestionar avisos"
          subtitulo={etiquetaEstadoAvisos(estadoAvisos)}
          onPress={onAvisos}
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
        <FilaMenu
          icono="enlace"
          titulo="Política de privacidad"
          subtitulo="Abrir la política completa"
          onPress={onPolitica}
        />
        <FilaMenu
          icono="correo"
          titulo="Contactar sobre mis datos"
          subtitulo="RWAdar@protonmail.com"
          onPress={onContacto}
        />
        <FilaMenu
          icono="borrar"
          titulo="Borrar datos del dispositivo"
          subtitulo="Instalación, seguimientos, token y cachés"
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

function Ficha({ p, sigue, onAbrir, onSeguir, deshabilitado }) {
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
      <Text style={e.fichaNota} numberOfLines={3}>{p.nota}</Text>
      <View style={e.etiquetas}>
        <Text style={[e.etiqueta, e.etiquetaAcento]}>{p.acceso}</Text>
        <Text style={e.etiqueta}>Entrada: {(p.ticket || '').toLowerCase()}</Text>
      </View>
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

  switch (estado.estado) {
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
      {estado.estado === 'comprobando' || procesando ? (
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

function Privacidad({ visible, onCerrar, onBorrar, borrando }) {
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
              La app no solicita permiso al abrirse. Solo lo hace después de que pulses el botón contextual. Si aceptas, se guarda en Supabase un token de entrega y la versión de la app. El panel distingue entre dispositivo preparado y servicio de envío realmente activo.
            </Text>

            <Text style={e.privacidadTit}>Datos locales y terceros</Text>
            <Text style={e.privacidadParrafo}>
              El catálogo, la fecha de sincronización y tu lista se guardan localmente para funcionar sin conexión. Supabase presta la base de datos y Expo presta los servicios de token push y actualización. RWAdar no pide datos bancarios, claves de monedero ni frases de recuperación.
            </Text>

            <Text style={e.privacidadTit}>Retención automática</Text>
            <Text style={e.privacidadParrafo}>
              La fecha de última actividad se renueva al sincronizar seguimiento o registrar el token. La base elimina instalaciones y tokens sin actividad durante 180 días, además del borrado inmediato que puedes pedir aquí.
            </Text>

            <Text style={e.privacidadTit}>Control de borrado</Text>
            <Text style={e.privacidadParrafo}>
              Puedes eliminar esta instalación, su token push, sus seguimientos y todas las cachés locales. Primero se exige confirmación de Supabase; si falla, la app no finge que el borrado terminó.
            </Text>

            <Pressable onPress={() => abrirEnlace(URL_PRIVACIDAD)}
              style={({ pressed }) => [e.botonBorde, pressed && e.pulsado]}
              accessibilityRole="link">
              <Text style={e.botonBordeTxt}>Abrir política completa ↗</Text>
            </Pressable>
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
            <Text style={e.detEtiqueta}>POR QUÉ ESTÁ EN EL RADAR</Text>
            <View style={e.aval}><Text style={e.avalTxt}>{p.aval}</Text></View>
            <Text style={e.detEtiqueta}>QUÉ HACE</Text>
            <Text style={e.detParrafo}>{p.nota}</Text>
            <Text style={e.detEtiqueta}>FICHA</Text>
            <View style={e.tabla}>
              {[['Tipo de actor', p.actor], ['Región / marco', p.region],
                ['Quién puede entrar', p.acceso], ['Importe de entrada', p.ticket],
                ['Cadenas', p.cadenas]].map(([k, v]) => (
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
              Esto no es asesoramiento financiero. Que una plataforma esté supervisada
              no significa que la inversión sea segura.
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
