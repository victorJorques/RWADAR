import React, { useEffect, useState } from 'react';
import { Animated, AppState, Modal, StyleSheet } from 'react-native';
import { Image, Pressable, ScrollView, Text, View, FuenteOriginal, useIdioma } from './Idioma';
import { traducir } from '../lib/idioma';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ETIQUETA_EDITORIAL, imagenEditorial, imagenEditorialOferta } from '../fixtures/imagenes-editoriales';
import { proveedoresDeOfertas, vigenciaOferta } from '../lib/datos';
import { documentacionOferta, etiquetaEstadoVerificacionLocal, fechaVerificacionLocalVisible, ofertaConCifrasVigentes } from '../lib/verificacion-local';
import { resumenOferta } from '../lib/ficha-editorial';
import {
  comprobacionesOferta, datosCortosOferta, fechaES, puntosFuertesOferta,
} from '../lib/transparencia';
import { C, COLOR_CATEGORIA, F, R, T, UI, iniciales } from '../lib/tema';
import { Icono } from './Navegacion';
import useTransicionFicha from './useTransicionFicha';

function useFechaOferta() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    let temporizador;
    const actualizar = () => {
      const fecha = new Date();
      setAhora(fecha);
      const siguienteDia = new Date(fecha);
      siguienteDia.setUTCHours(24, 0, 0, 100);
      clearTimeout(temporizador);
      temporizador = setTimeout(actualizar, siguienteDia.getTime() - fecha.getTime());
    };
    actualizar();
    const escucha = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') actualizar();
    });
    return () => { clearTimeout(temporizador); escucha.remove(); };
  }, []);
  return ahora;
}

function datoDestacado(oferta) {
  if (oferta.coleccion === 'secundario' || oferta.coleccion === 'en_camino') {
    return { etiqueta: 'Referencia documental', valor: 'Consultar fuente' };
  }
  if (oferta.cifrasPendientes) {
    return { etiqueta: 'Condiciones actuales', valor: 'Consultar emisor' };
  }
  if (oferta.tipo === 'rendimiento') {
    return {
      etiqueta: 'Rentabilidad publicada',
      valor: oferta.rentabilidad?.mostrada || oferta.rentabilidad?.literal || 'No publicada',
      original: Boolean(oferta.rentabilidad?.mostrada || oferta.rentabilidad?.literal),
      referencia: oferta.rentabilidad?.literal || '',
    };
  }
  if (oferta.tipo === 'valor') {
    return { etiqueta: 'Precio de referencia', valor: oferta.precio?.mostrado || 'Consultar fuente', original: Boolean(oferta.precio?.mostrado),
      referencia: oferta.precio?.unidad || '' };
  }
  const valor = [oferta.precio?.mostrado, oferta.precio?.unidad].filter(Boolean).join(' / ');
  return { etiqueta: 'Precio en secundario', valor: valor || 'Consultar mercado', original:Boolean(valor) };
}

function rentabilidadSecundaria(oferta) {
  if (oferta?.tipo !== 'secundario') return '';
  return [...new Set([
    oferta.rentabilidad?.mostrada,
    oferta.rentabilidad?.literal,
  ].filter(Boolean))].join(' · ');
}

// El aviso general (igual en todas las fichas) no ocupa la tarjeta: va una vez
// encima de la lista y entero en el detalle.
const AVISO_GENERAL = /^Referencia editorial gratuita\b/;
function avisosCriticos(oferta) {
  return (oferta?.avisos || [])
    .filter((aviso) => !AVISO_GENERAL.test(String(aviso?.texto || '')))
    .filter((aviso) => (aviso.tono === 'warn' || aviso.tono === 'stop')
      && (!aviso.esAntiguedad || aviso.tono === 'stop'))
    .sort((a, b) => Number(b.tono === 'stop') - Number(a.tono === 'stop'));
}

function dominioFuente(url) {
  try {
    const fuente = new URL(url);
    if (fuente.protocol !== 'https:' || fuente.username || fuente.password) return 'fuente oficial';
    return fuente.hostname.replace(/^www\./, '');
  } catch { return 'fuente oficial'; }
}

function tipoVisible(tipo, coleccion) {
  if (coleccion === 'en_camino') return 'En camino';
  if (coleccion === 'secundario') return 'Secundario';
  if (tipo === 'secundario') return 'Secundario';
  if (tipo === 'valor') return 'Valor';
  return 'Rendimiento';
}

// El orden nunca usa importe, rentabilidad, patrocinio ni un perfil personal.
// Conserva el orden editorial de origen entre referencias del mismo estado.
export function ordenarOfertasLectura(ofertas, ahora = new Date()) {
  const prioridad = oferta => {
    const resumen = resumenOferta(oferta, [], ahora);
    if (resumen.cifrasVigentes) return 0;
    if (oferta.estadoRevision === 'fuentes_en_conflicto') return 3;
    return resumen.vencida ? 2 : 1;
  };
  return ofertas.map((oferta, indice) => ({oferta, indice, prioridad: prioridad(oferta)}))
    .sort((a, b) => a.prioridad - b.prioridad || a.indice - b.indice).map(fila => fila.oferta);
}

export function agruparOfertasLectura(ofertas, agrupar = true) {
  const nombres = new Map(proveedoresDeOfertas(ofertas).map(p => [p.slug,p.nombre]));
  const porProveedor = new Map();
  for (const oferta of ofertas) {
    if (!oferta.plataformaSlug) continue;
    if (!porProveedor.has(oferta.plataformaSlug)) porProveedor.set(oferta.plataformaSlug, []);
    porProveedor.get(oferta.plataformaSlug).push(oferta);
  }
  const emitidos = new Set();
  return ofertas.flatMap(oferta => {
    const grupo = porProveedor.get(oferta.plataformaSlug);
    if (!agrupar || !grupo || grupo.length < 2) return [{tipo:'oferta', slug:`${oferta.tipo}:${oferta.slug}`, oferta}];
    if (emitidos.has(oferta.plataformaSlug)) return [];
    emitidos.add(oferta.plataformaSlug);
    return [{tipo:'grupo',slug:`grupo:${oferta.plataformaSlug}`,proveedorSlug:oferta.plataformaSlug,
      proveedorNombre:nombres.get(oferta.plataformaSlug) || oferta.plataformaNombre,ofertas:grupo}];
  });
}

export function FichaGrupoOfertas({grupo, onAbrir}) {
  useIdioma();
  const n = grupo.ofertas.length;
  return (
    <Pressable onPress={onAbrir} style={({pressed}) => [e.ficha, pressed && e.pulsado]}
      accessibilityRole="button" accessibilityLabel={`${grupo.proveedorNombre}: ver ${n} referencias`}
      accessibilityHint="Abre todas las fichas del proveedor dentro de esta colección">
      <View style={e.cuerpoGrupo}>
        <Text style={e.datoEtiqueta}>Referencias del mismo proveedor</Text>
        <Text noTraducir idiomaOriginal="es-ES" style={e.titulo}>{grupo.proveedorNombre}</Text>
        <Text style={e.grupoNumero}>{n} referencias</Text>
        <Text style={e.referencia}>Cada ficha conserva su fuente, fecha, mínimo publicado, acceso desde España y condiciones de salida. No se ha confirmado que puedas contratar todas.</Text>
        <Text style={e.abrirGrupo}>Ver {n} referencias →</Text>
      </View>
    </Pressable>
  );
}

function registroProveedor(plataforma, ahora) {
  const verificacion = plataforma?.verificacionLocal;
  const registro = verificacion?.licenciaRegistro;
  const fecha = verificacion?.verificadoEl;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') ? new Date(`${fecha}T00:00:00Z`) : null;
  if (!dia || !Number.isFinite(dia.getTime()) || dia.toISOString().slice(0, 10) !== fecha || dia > ahora ||
      !registro?.estado || !Array.isArray(registro.fuentes) || !registro.fuentes.length ||
      !registro.fuentes.every(f => {
        try { const u = new URL(f.url); return u.protocol === 'https:' && !u.username && !u.password && f.primaria === true && f.consultadaEl === fecha; }
        catch { return false; }
      })) return null;
  return {texto:etiquetaEstadoVerificacionLocal(registro.estado),detalle:registro.detalle,
    fecha,fuentes:registro.fuentes.map(f => f.url)};
}

function tonoVigencia(estado) {
  if (estado === 'vencida' || estado === 'permanente-vencida' ||
    estado === 'bloqueada' || estado === 'conflicto') return e.vigenciaVencida;
  if (estado === 'proxima' || estado === 'permanente-proxima') return e.vigenciaProxima;
  if (estado === 'vigente' || estado === 'permanente-vigente') return e.vigenciaOk;
  return null;
}

export function imagenesParaOferta(oferta) {
  const local = imagenEditorialOferta(oferta);
  const propia = local?.archivo === `oferta-${oferta?.slug}.webp`;
  const categoria = imagenEditorial(oferta?.categoria);
  const fallback = categoria || {...imagenEditorial('Acciones y capital privado'),
    alt:'Ilustración editorial financiera; no representa un activo concreto'};
  if (propia) return {principal:local, fallback};
  const slug = oferta?.slug;
  if (oferta?.catalogo !== true || typeof slug !== 'string' || slug.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {principal:local || fallback, fallback:null};
  }
  const literal = oferta.documentacion?.imagenEditorialAlt;
  const descripcion = typeof literal === 'string' && literal.trim().length >= 20 && literal.trim().length <= 400 &&
    !/[\u0000-\u001f\u007f]/.test(literal) ? literal.trim() : String(oferta.titulo || 'esta referencia');
  return {principal:{fuente:{uri:`https://rwadar.pages.dev/ofertas-editoriales/oferta-${slug}.webp`},
    archivo:`oferta-${slug}.webp`,remota:true,
    etiqueta:'Ilustración editorial · IA',
    alt:`Ilustración editorial generada con IA; no es fotografía del activo. ${descripcion}`},fallback:local || fallback};
}

export function ImagenOferta({ oferta, grande = false, decorativa = false, estilo }) {
  const [fallo, setFallo] = useState(0);
  useEffect(() => { setFallo(0); }, [oferta.slug, oferta.revisionId]);
  const opciones = imagenesParaOferta(oferta);
  const editorial = fallo === 0 ? opciones.principal : fallo === 1 ? opciones.fallback : null;
  if (!editorial?.fuente) {
    return (
      <View
        style={[e.imagen, grande && e.imagenGrande, estilo, e.imagenFallback, e.imagenEditorialMarco,
          { backgroundColor: COLOR_CATEGORIA[oferta.categoria] || C.sup3 }]}
        accessible={!decorativa}
        importantForAccessibility={decorativa ? 'no-hide-descendants' : 'auto'}
        accessibilityRole={decorativa ? undefined : 'image'}
        noTraducir idiomaOriginal="es-ES"
        accessibilityLabel={decorativa ? undefined : `Sin ${ETIQUETA_EDITORIAL.toLocaleLowerCase('es')} disponible para ${oferta.titulo}`}
      >
        <Text style={[e.imagenFallbackTxt, !grande && e.imagenFallbackTxtPeq]}>{iniciales(oferta.plataformaNombre || oferta.titulo)}</Text>
        {grande ? <Text style={e.etiquetaEditorial} accessible={false} importantForAccessibility="no">
          {ETIQUETA_EDITORIAL}
        </Text> : null}
      </View>
    );
  }
  return (
    <View
      style={[e.imagen, grande && e.imagenGrande, estilo, e.imagenEditorialMarco]}
      accessible={!decorativa}
      importantForAccessibility={decorativa ? 'no-hide-descendants' : 'auto'}
      accessibilityRole={decorativa ? undefined : 'image'}
      noTraducir idiomaOriginal="es-ES"
      accessibilityLabel={decorativa ? undefined : editorial.alt}
    >
      <Image
        source={editorial.fuente}
        style={e.imagenEditorial}
        resizeMode="cover"
        onError={() => setFallo(fallo === 0 && opciones.fallback ? 1 : 2)}
        accessible={false}
        importantForAccessibility="no"
      />
      {/* En la miniatura no va ninguna etiqueta encima de la foto (como en la
          web); el aviso «Imágenes ilustrativas» va bajo la lista. */}
      {grande ? <Text
        style={e.etiquetaEditorial}
        accessible={false}
        importantForAccessibility="no"
      >
        {editorial.etiqueta}
      </Text> : null}
    </View>
  );
}

/* La fila compacta de la web (03/11/2026): miniatura, título de dos líneas
   como mucho, proveedor y lugar; hasta dos puntos fuertes ✓ en texto;
   Mínimo · España · Salida en forma corta; y al pie «Revisa · N avisos en la
   ficha», la fecha y «Ver ficha». El aviso crítico (tono stop) se lee entero
   siempre; el ordinario se resume en su número y sigue entero para el lector
   de pantalla y en la ficha. */
function avisosContables(oferta) {
  return (oferta?.avisos || []).filter((aviso) => aviso && String(aviso.texto || '').trim() &&
    aviso.tono !== 'ok' && (!aviso.esAntiguedad || aviso.tono === 'stop'));
}

export function FichaOferta({ oferta: ofertaOriginal, plataforma, onAbrir, catalogoCaducado = false }) {
  const idiomaActual = useIdioma();
  const ahora = useFechaOferta();
  const oferta = ofertaConCifrasVigentes(ofertaOriginal, ahora);
  const documentacion = documentacionOferta(ofertaOriginal, ahora);
  const vigencia = vigenciaOferta(oferta, ahora);
  const criticos = avisosCriticos(oferta);
  const primerCritico = criticos[0];
  const bloqueo = primerCritico?.tono === 'stop' ? primerCritico : null;
  const contables = avisosContables(oferta);
  const resumen = resumenOferta(ofertaOriginal, [], ahora);
  const datosCortos = datosCortosOferta(ofertaOriginal, resumen, { catalogoCaducado });
  const puntos = puntosFuertesOferta(ofertaOriginal).slice(0, 2);
  const fechaProcedencia = resumen.fechas.comprobadaEl
    ? `Fuente consultada ${fechaVerificacionLocalVisible(resumen.fechas.comprobadaEl)}`
    : documentacion ? `Revisión documental ${fechaVerificacionLocalVisible(documentacion.fecha)}`
      : 'Sin consulta de fuente fechada';
  const fechaCorta = resumen.fechas.comprobadaEl ? fechaVerificacionLocalVisible(resumen.fechas.comprobadaEl)
    : documentacion ? fechaVerificacionLocalVisible(documentacion.fecha) : '';
  // Una principal vigente enseña su vigencia; lo demás, el estado que da resumenOferta.
  const vigenteOk = !catalogoCaducado && resumen.cifrasVigentes &&
    ['vigente', 'proxima', 'permanente-vigente', 'permanente-proxima'].includes(vigencia.estado);
  const estadoTexto = vigenteOk ? vigencia.etiqueta : resumen.estado.texto;
  // «Cifras vigentes N d» empieza en mayúscula; el diccionario lo tiene en minúscula.
  const estadoTraducido = (() => {
    const directo = traducir(estadoTexto);
    if (directo !== estadoTexto) return directo;
    const minuscula = traducir(estadoTexto.charAt(0).toLowerCase() + estadoTexto.slice(1));
    return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
  })();
  // Como en los buscadores de viajes: dónde está el activo, bajo el nombre.
  const lugar = imagenEditorialOferta(oferta)?.lugar || '';
  const etiquetaAccesible = [
    `${traducir('Ver ficha de')} ${oferta.titulo}`, oferta.plataformaNombre, lugar,
    traducir(ETIQUETA_EDITORIAL),
    oferta.patrocinada ? traducir('Contenido patrocinado; no altera el ranking') : null,
    ...puntos.map((punto) => `✓ ${traducir(punto.texto)}`),
    ...datosCortos.map(([etiqueta, valor]) => `${traducir(etiqueta)}: ${traducir(valor)}`),
    traducir(fechaProcedencia),
    estadoTraducido,
    primerCritico
      ? `${traducir(primerCritico.tono === 'stop' ? 'Aviso bloqueante' : 'Precaución')}: ${primerCritico.texto}`
      : null,
    criticos.length > 1 ? `${criticos.length - 1} avisos adicionales en el detalle` : null,
  ].filter(Boolean).join('. ');
  return (
    <Pressable
      onPress={onAbrir}
      style={({ pressed }) => [e.ficha, pressed && e.fichaPulsada]}
      accessibilityRole="button"
      noTraducir idiomaOriginal={idiomaActual==='en'?'en-US':'es-ES'}
      accessibilityLabel={etiquetaAccesible}
      accessibilityHint={traducir('Abre la ficha completa de la oferta')}
    >
      <View style={e.filaSuperior}>
        <View style={e.imagenFicha}>
          <ImagenOferta oferta={oferta} decorativa estilo={e.imagenEnFicha} />
        </View>
        <View style={e.cuerpoFicha}>
          {oferta.patrocinada ? <Text style={e.patrocinada}>Patrocinada</Text> : null}
          <Text noTraducir idiomaOriginal="es-ES" style={e.titulo} numberOfLines={2}>{oferta.titulo}</Text>
          <Text style={e.plataforma} numberOfLines={1}>
            <Text noTraducir idiomaOriginal="es-ES" style={e.plataformaNombre}>{oferta.plataformaNombre}</Text>
            {lugar ? <Text noTraducir idiomaOriginal="es-ES" style={e.lugarTxt}>{` · ${lugar}`}</Text> : null}
          </Text>
          <View style={e.metaFicha}>
            <Text noTraducir idiomaOriginal={idiomaActual === 'en' ? 'en-US' : 'es-ES'}
              style={[e.estadoFicha, vigenteOk ? e.estadoOk : tonoVigencia(vigencia.estado)]}>{estadoTraducido}</Text>
            {!catalogoCaducado && resumen.cifrasVigentes && oferta.disponibleEs === false
              ? <Text style={e.noDisponible}>No disponible en España</Text> : null}
          </View>
        </View>
      </View>
      {puntos.length ? (
        <View style={e.puntos} accessibilityLabel={traducir('Puntos fuertes')}>
          {puntos.map((punto) => (
            <Text key={punto.texto} style={e.punto}><Text style={e.puntoMarca}>✓ </Text>{punto.texto}</Text>
          ))}
        </View>
      ) : null}
      <View style={e.decisionTarjeta}>
        {datosCortos.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={e.decisionFila}>
            <Text style={e.decisionEtiqueta}>{etiqueta}</Text>
            <Text style={e.decisionValor}>{valor}</Text>
          </View>
        ))}
      </View>
      {bloqueo ? (
        <View style={[e.avisoFicha, e.avisoFichaStop]}>
          <Text style={[e.avisoFichaTxt, e.avisoTxtStop]}>
            Importante · <Text noTraducir idiomaOriginal="es-ES">{bloqueo.texto}</Text>
            {criticos.length > 1 ? ` · ${criticos.length - 1} más en la ficha` : ''}
          </Text>
        </View>
      ) : null}
      <View style={e.pieFicha}>
        {!bloqueo && contables.length ? (
          <Text style={e.avisosN}>
            <Text style={e.avisosNMarca}>Revisa</Text> · {contables.length === 1 ? '1 aviso en la ficha' : `${contables.length} avisos en la ficha`}
          </Text>
        ) : <View style={e.avisosHueco} />}
        {fechaCorta ? <Text style={e.fechaFicha}>{fechaCorta}</Text> : null}
        <Text style={e.abrirFicha}>Ver ficha →</Text>
      </View>
    </Pressable>
  );
}

function FilaMetrica({ etiqueta, valor, original=false, etiquetaOriginal=false }) {
  return (
    <View style={e.filaMetrica}>
      <Text noTraducir={etiquetaOriginal} idiomaOriginal="es-ES" style={e.metricaEtiqueta}>{etiqueta}</Text>
      <Text noTraducir={original} idiomaOriginal="es-ES" style={e.metricaValor}>{valor}</Text>
    </View>
  );
}

export function DetalleOferta({
  oferta: ofertaOriginal, onCerrar, onAbrirEnlace, plataformaCanonica, plataforma, guardada = false, onGuardar,
  onRegistrarInversion, catalogoCaducado = false,
}) {
  const idiomaActual=useIdioma();
  const ahora = useFechaOferta();
  const transicion = useTransicionFicha(Boolean(ofertaOriginal), onCerrar);
  if (!ofertaOriginal) return null;
  const oferta = ofertaConCifrasVigentes(ofertaOriginal, ahora);
  const documentacion = documentacionOferta(ofertaOriginal, ahora);
  const vigencia = vigenciaOferta(oferta, ahora);
  const destacado = datoDestacado(oferta);
  const rentabilidadSec = rentabilidadSecundaria(oferta);
  const cifraVencida = oferta.cifrasPendientes;
  const resumen = resumenOferta(ofertaOriginal, [], ahora);
  const registro = registroProveedor(plataforma, ahora);
  const datosParaDecidir = [
    ['Mínimo publicado en euros', resumen.minimo],
    ['Acceso desde España', resumen.accesoEspana],
    ['Cómo recuperar el dinero', resumen.salida],
    ['Costes publicados', resumen.costes],
  ];
  const enlacePrincipal = oferta.tipo === 'secundario'
    ? (oferta.urlMercado || oferta.url) : oferta.url;
  const fuentesAdicionales = documentacion
    ? [...new Set([...documentacion.fuentes, ...documentacion.referencias.map(r => r.fuente),
      ...(registro?.fuentes || []), oferta.url].filter(Boolean))].filter(url => url !== enlacePrincipal)
    : registro?.fuentes || [];
  return (
    <Modal visible animationType="none" presentationStyle="fullScreen"
      statusBarTranslucent={false} navigationBarTranslucent={false} onRequestClose={transicion.cerrar}>
      <SafeAreaProvider style={e.modal}>
        <Animated.View style={[e.modal, transicion.estilo]}>
        <SafeAreaView style={e.modal} edges={['top', 'right', 'bottom', 'left']} accessibilityViewIsModal>
          <View style={e.cabeceraModal}>
            <Text style={e.cabeceraEtiqueta}>Ficha de la oferta</Text>
            {/* Guardar no es invertir: solo la deja a mano en Perfil, en este dispositivo. */}
            {onGuardar ? (
              <Pressable onPress={onGuardar} style={({ pressed }) => [e.cerrar, guardada && e.guardarOn, pressed && e.pulsado]}
                accessibilityRole="button" accessibilityState={{ selected: guardada }}
                noTraducir idiomaOriginal={idiomaActual==='en'?'en-US':'es-ES'}
                accessibilityLabel={guardada ? `${traducir('Quitar')} ${oferta.titulo} ${traducir('de guardadas')}` : `${traducir('Guardar')} ${oferta.titulo} ${traducir('en Perfil')}`}
                hitSlop={10}>
                <Icono nombre={guardada ? 'guardada' : 'guardar'} color={C.senal} tamano={22} />
              </Pressable>
            ) : null}
            <Pressable onPress={transicion.cerrar} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]}
              accessibilityRole="button" noTraducir idiomaOriginal={idiomaActual==='en'?'en-US':'es-ES'} accessibilityLabel={`${traducir('Cerrar')} ${oferta.titulo}`} hitSlop={10}>
              <Text style={e.cerrarTxt}>✕</Text>
            </Pressable>
          </View>
          <ScrollView key={oferta.slug} style={e.modalDesplazamiento}
            contentContainerStyle={e.modalCuerpo} contentInsetAdjustmentBehavior="never">
            <Text style={e.supra}>{oferta.coleccion && oferta.coleccion !== 'principales' ? 'Referencia' : 'Oferta'} · {tipoVisible(oferta.tipo, oferta.coleccion)}</Text>
            <FuenteOriginal idiomaOriginal="es-ES" />
            <Text noTraducir idiomaOriginal="es-ES" style={e.modalTitulo} accessibilityRole="header">{oferta.titulo}</Text>
            <ImagenOferta oferta={oferta} grande />
            <View style={e.proveedorCaja}>
              <Text noTraducir idiomaOriginal="es-ES" style={e.proveedorNombre}>{oferta.plataformaNombre}</Text>
              <Text style={e.proveedorMeta}>
                {oferta.categoria}<Text noTraducir idiomaOriginal="es-ES">{oferta.pais ? ` · ${oferta.pais}` : ''}</Text>
              </Text>
              <Text style={[e.proveedorEstado, !plataformaCanonica && e.proveedorSolo]}>
                {plataformaCanonica
                  ? 'Proveedor incluido también en el radar'
                  : 'Proveedor de esta referencia · no está en el radar'}
              </Text>
              {oferta.patrocinada ? (
                <Text style={e.patrocinioAviso}>
                  Patrocinada. Consulta la relación comercial en la ficha; no altera el ranking ni implica recomendación.
                </Text>
              ) : null}
            </View>
            <Text style={e.riesgoSalida}>Puedes perder dinero. RWAdar no vende ni asesora.</Text>
            <Text style={e.avisosTitulo}>¿Quién puede acceder y en qué condiciones?</Text>
            <View style={e.tabla}>
              {datosParaDecidir.map(([etiqueta, dato]) => (
                <View key={etiqueta} style={e.filaMetrica}>
                  <Text style={e.metricaEtiqueta}>{etiqueta}</Text>
                  <Text noTraducir={Boolean(dato.fuente || dato.referencias?.length)} idiomaOriginal="es-ES" style={e.metricaValor}>{dato.texto}</Text>
                  {dato.unidadDocumentada ? <Text style={e.referencia}>Unidad publicada: <Text noTraducir idiomaOriginal="es-ES">{dato.unidadDocumentada}</Text>; no se ha convertido a euros.</Text> : null}
                  {dato.referencias?.length ? dato.referencias.map((ref, indice) => (
                    <Text key={`${ref.fuente}-${indice}`} style={e.referencia}>{ref.etiqueta}: fuente consultada el {fechaVerificacionLocalVisible(ref.fechaConsulta)} · {dominioFuente(ref.fuente)}{ref.fechaDato ? ` · dato del ${fechaVerificacionLocalVisible(ref.fechaDato)}` : ''}</Text>
                  )) : dato.consultadaEl ? <Text style={e.referencia}>Fuente consultada el {fechaVerificacionLocalVisible(dato.consultadaEl)} · {dominioFuente(dato.fuente)}</Text> : null}
                </View>
              ))}
            </View>
            <Transparencia oferta={ofertaOriginal} resumen={resumen} ahora={ahora}
              catalogoCaducado={catalogoCaducado} onAbrirEnlace={onAbrirEnlace} />
            <View style={e.documentacion}>
              <Text style={e.avisosTitulo}>En tres frases</Text>
              {documentacion?.descripcion || oferta.resumen ? <FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={e.estadoTexto}>{documentacion?.descripcion || oferta.resumen}</FuenteOriginal> : <Text style={e.estadoTexto}>La fuente no aporta una descripción comprobable en esta ficha.</Text>}
              <Text style={e.referencia}>La disponibilidad de salida no está garantizada.</Text>
            </View>
            {registro ? <View style={e.documentacion}>
              <Text style={e.avisosTitulo}>Registro del proveedor · {registro.texto} · revisión {fechaVerificacionLocalVisible(registro.fecha)}</Text>
              <FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={e.estadoTexto}>{registro.detalle}</FuenteOriginal>
              <Text style={e.referencia}>Este registro no acredita la supervisión ni la apertura de esta oferta. Fuentes al final de la ficha.</Text>
            </View> : null}
            <View style={[e.estadoCaja, cifraVencida && e.estadoCajaVencida]}>
              <Text style={[e.estadoTitulo, tonoVigencia(vigencia.estado)]}>{vigencia.etiqueta}</Text>
              <Text style={e.estadoTexto}>
                {vigencia.estado === 'bloqueada'
                  ? 'No está confirmada la admisión de nuevas inversiones. Consulta la apertura y las condiciones actuales con el emisor.'
                  : vigencia.estado === 'conflicto'
                    ? 'Las fuentes consultadas se contradicen. Conservamos la referencia y sus avisos, pero ocultamos las cifras hasta poder contrastarlas.'
                    : vigencia.estado === 'permanente-vencida'
                  ? `${documentacion ? 'La referencia sigue documentada; ha vencido la actualización de sus cifras.' : 'Ha vencido la actualización de las cifras.'} Consulta precio, rentabilidad y disponibilidad actuales con el emisor.`
                  : vigencia.estado === 'vencida'
                    ? `${documentacion ? 'La referencia sigue documentada; ha vencido la actualización de sus cifras.' : 'Ha vencido la actualización de las cifras.'} Consulta precio, rentabilidad y disponibilidad actuales con el emisor.`
                  : cifraVencida
                    ? 'No hay cifras con fecha y vigencia válidas. Consulta las condiciones actuales con el emisor.'
                  : oferta.permanente
                    ? 'Estas cifras conservan su fecha de revisión. Su vigencia no garantiza la disponibilidad actual ni que puedas contratar el producto.'
                    : `Información comprobada el ${oferta.verificadaEl || 'día indicado en la fuente'}.`}
              </Text>
            </View>
            {documentacion?.descripcion ? (
              <View style={e.documentacion}>
                <Text style={e.avisosTitulo}>Características documentadas</Text>
                {documentacion.caracteristicas.length ? (
                  <View style={[e.tabla, e.tablaDocumental]}>
                    {documentacion.caracteristicas.map((caracteristica, indice) => (
                      <FilaMetrica key={`documentacion-${indice}`} {...caracteristica} original etiquetaOriginal />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={e.documentacion}>
              <Text style={e.avisosTitulo}>Fechas de esta ficha</Text>
              <Text style={e.referencia}>Revisión del catálogo: {resumen.fechas.revisadaEl ? fechaVerificacionLocalVisible(resumen.fechas.revisadaEl) : 'sin fecha válida'}</Text>
              <Text style={e.referencia}>Última consulta citada: {resumen.fechas.comprobadaEl ? fechaVerificacionLocalVisible(resumen.fechas.comprobadaEl) : 'no documentada'}</Text>
              <Text style={e.referencia}>Fecha del dato en esa referencia: {resumen.fechas.fechaDato ? fechaVerificacionLocalVisible(resumen.fechas.fechaDato) : 'no indicada por la fuente'}</Text>
              <Text style={e.referencia}>Revisar el catálogo no vuelve a comprobar las cifras antiguas. Cada referencia conserva su consulta original debajo.</Text>
            </View>
            <View style={e.destacado}>
              <Text style={e.datoEtiqueta}>{destacado.etiqueta}</Text>
              <Text noTraducir={Boolean(destacado.original)} idiomaOriginal="es-ES" style={e.destacadoValor}>{destacado.valor}</Text>
              {destacado.referencia ? <Text noTraducir idiomaOriginal="es-ES" style={e.referencia}>{destacado.referencia}</Text> : null}
            </View>
            {rentabilidadSec ? (
              <View style={e.destacadoSecundario}>
                <Text style={e.datoEtiqueta}>Rentabilidad ajustada / publicada</Text>
                <Text noTraducir idiomaOriginal="es-ES" style={e.destacadoValor}>{rentabilidadSec}</Text>
              </View>
            ) : null}
            {oferta.metricas.length ? (
              <View style={e.tabla}>
                {oferta.metricas.map((metrica, indice) => (
                  <FilaMetrica key={`${metrica.etiqueta}-${indice}`} {...metrica} original etiquetaOriginal />
                ))}
              </View>
            ) : null}
            {documentacion?.referencias.length ? (
              <View style={e.documentacion}>
                <Text style={e.avisosTitulo}>Referencias fechadas</Text>
                <Text style={e.estadoTexto}>
                  Datos publicados en las fechas indicadas. No son precios actuales ni garantizan rentabilidad, apertura o disponibilidad para contratar.
                </Text>
                {documentacion.referencias.map((referencia, indice) => (
                  <View style={e.referenciaDocumental} key={`referencia-${indice}`}>
                    <Text noTraducir idiomaOriginal="es-ES" style={e.datoEtiqueta}>{referencia.etiqueta}</Text>
                    <Text noTraducir idiomaOriginal="es-ES" style={e.datoValor}>{referencia.valor}</Text>
                    <Text style={e.referencia}>
                      Fecha del dato: {referencia.fechaDato ? fechaVerificacionLocalVisible(referencia.fechaDato) : 'no indicada en la fuente'}
                    </Text>
                    <Text style={e.referencia}>Consultado el {fechaVerificacionLocalVisible(referencia.fechaConsulta)}</Text>
                    <FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={e.referencia}>{referencia.alcance}</FuenteOriginal>
                    <Text style={e.referencia}>Fuente: {dominioFuente(referencia.fuente)} · enlace al final de la ficha</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {oferta.avisos.length ? (
              <View style={e.avisos}>
                <Text style={e.avisosTitulo}>Antes de abrir el enlace</Text>
                {oferta.avisos.map((aviso, indice) => (
                  <View key={`${aviso.texto}-${indice}`} style={[
                    e.avisoFila,
                    aviso.tono === 'stop' && e.avisoFilaStop,
                    aviso.tono === 'warn' && e.avisoFilaWarn,
                    aviso.tono === 'ok' && e.avisoFilaOk,
                  ]}>
                    <FuenteOriginal aviso={false} idiomaOriginal="es-ES" style={[
                      e.aviso,
                      aviso.tono === 'stop' && e.avisoTxtStop,
                      aviso.tono === 'warn' && e.avisoTxtWarn,
                      aviso.tono === 'ok' && e.avisoTxtOk,
                    ]}>• {aviso.texto}</FuenteOriginal>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={e.avisos}>
              <Text style={e.avisosTitulo}>Antes de ir a la fuente</Text>
              <FilaMetrica etiqueta="¿Puedo perder dinero?" valor="Sí. Puedes perder parte o toda la inversión; una cifra publicada no garantiza el resultado." />
              <FilaMetrica etiqueta="¿Puedo vender cuando quiera?" valor={resumen.salida.texto} original={Boolean(resumen.salida.fuente)} />
              <FilaMetrica etiqueta="¿Quién custodia el activo?" original={Boolean(documentacion?.caracteristicas.find(c => /custodio|responsable de custodia/i.test(c.etiqueta))?.valor)} valor={documentacion?.caracteristicas.find(c => /custodio|responsable de custodia/i.test(c.etiqueta))?.valor || 'No consta en esta ficha. Compruébalo en la fuente.'} />
              <FilaMetrica etiqueta="¿Quién supervisa esta oferta?" original={Boolean(documentacion?.caracteristicas.find(c => /supervisor|regulador/i.test(c.etiqueta))?.valor)} valor={documentacion?.caracteristicas.find(c => /supervisor|regulador/i.test(c.etiqueta))?.valor || 'No consta en esta ficha. Un registro de la plataforma no acredita cada oferta.'} />
            </View>
            <Text style={e.riesgoSalida}>Puedes perder dinero. RWAdar no vende ni asesora.</Text>
            <Pressable
              onPress={() => enlacePrincipal && onAbrirEnlace(enlacePrincipal)}
              disabled={!enlacePrincipal}
              style={({ pressed }) => [e.enlace, !enlacePrincipal && e.deshabilitado, pressed && e.pulsado]}
              accessibilityRole="link"
              noTraducir idiomaOriginal={idiomaActual==='en'?'en-US':'es-ES'} accessibilityLabel={`${traducir('Ver en la fuente ·')} ${oferta.plataformaNombre}: ${enlacePrincipal || traducir('enlace no documentado')}`}
              accessibilityState={{ disabled: !enlacePrincipal }}
            >
              <Text style={e.enlaceTxt}>
                Ver en la fuente · <Text noTraducir idiomaOriginal="es-ES">{oferta.plataformaNombre}</Text> ↗
              </Text>
            </Pressable>
            {onRegistrarInversion ? <Pressable onPress={onRegistrarInversion}
              style={({ pressed }) => [e.registrarInversion, pressed && e.pulsado]}
              accessibilityRole="button" accessibilityLabel={`Registrar inversión en ${oferta.titulo}`}>
              <Text style={e.enlaceSecundarioTxt}>Registrar inversión</Text>
            </Pressable> : null}
            {fuentesAdicionales.length ? (
              <View>
                <Text style={e.avisosTitulo}>Otras fuentes consultadas</Text>
                {fuentesAdicionales.map((url, indice) => (
                  <Pressable key={url} onPress={() => onAbrirEnlace(url)}
                    style={({ pressed }) => [e.enlaceSecundario, pressed && e.pulsado]}
                    accessibilityRole="link" accessibilityLabel={`Ver fuente ${indice + 1} · ${dominioFuente(url)}: ${url}`}>
                    <Text style={e.enlaceSecundarioTxt}>Ver fuente {indice + 1} · {dominioFuente(url)} ↗</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text style={e.notaLegal}>
              RWAdar no cobra comisión al inversor. La contratación y el pago se realizan directamente con el proveedor; RWAdar no recibe ni custodia tu inversión. Información editorial, no asesoramiento financiero. Una cifra publicada no es una rentabilidad garantizada ni una recomendación de inversión.
            </Text>
          </ScrollView>
        </SafeAreaView>
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
}

/* «Transparencia: lo que hemos comprobado» (como transparenciaDetalleHtml de
   la web): las cinco comprobaciones con ✓/✗, su motivo y la fuente con su
   fecha, y todos los puntos fuertes con su fuente. Solo el texto de
   transparencia.json y el nombre de cada fuente quedan como texto original;
   lo que escribe RWAdar se traduce. */
function Transparencia({ oferta, resumen, ahora, catalogoCaducado, onAbrirEnlace }) {
  const lista = comprobacionesOferta(oferta, resumen, { ahora, catalogoCaducado });
  const puntos = puntosFuertesOferta(oferta);
  const Fuente = ({ fuente, de }) => {
    if (!fuente?.url) return null;
    const titulo = fuente.titulo || fuente.url;
    return (
      <View style={e.comprobacionFuente}>
        <Pressable onPress={() => onAbrirEnlace(fuente.url)} style={({ pressed }) => [e.enlaceFuente, pressed && e.enlaceFuentePulsado]}
          accessibilityRole="link" noTraducir accessibilityLabel={`${titulo} · ${traducir('fuente de:')} ${traducir(de)}`}>
          <Text noTraducir idiomaOriginal="es-ES" style={e.enlaceFuenteTxt}>{titulo} ↗</Text>
        </Pressable>
        {fuente.fecha ? <Text style={[e.referencia, e.referenciaFila]}>Consultada el {fechaES(fuente.fecha)}</Text> : null}
      </View>
    );
  };
  return (
    <View style={e.transparencia}>
      <Text style={e.seccionDetalle} accessibilityRole="header">Transparencia: lo que hemos comprobado</Text>
      <Text style={e.referencia}>Es una comprobación de la documentación, no una recomendación de inversión.</Text>
      {lista.map((c) => (
        <View key={c.id} style={e.comprobacion}>
          <Text style={[e.comprobacionMarca, c.cumple ? e.comprobacionSi : e.comprobacionNo]}
            accessible={false} importantForAccessibility="no">{c.cumple ? '✓' : '✗'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={e.comprobacionTit} accessibilityLabel={`${traducir(c.texto)}: ${traducir(c.cumple ? 'sí' : 'no')}`}>{c.texto}</Text>
            {c.partes ? (
              <Text style={e.comprobacionMotivo}>
                {c.partes.map((x, i) => x.length > 1
                  ? <Text key={i}>{i ? ' ' : ''}{x[0]} <Text noTraducir idiomaOriginal="es-ES" style={e.comprobacionDato}>{x[1]}</Text>.</Text>
                  : <Text key={i}>{i ? ' ' : ''}{x[0]}</Text>)}
              </Text>
            ) : (
              <Text noTraducir={Boolean(c.deFuente)} idiomaOriginal="es-ES" style={e.comprobacionMotivo}>{c.motivo}</Text>
            )}
            <Fuente fuente={c.fuente} de={c.texto} />
          </View>
        </View>
      ))}
      {puntos.length ? (
        <View style={e.puntosDetalle}>
          <Text style={e.comprobacionTit}>Puntos fuertes, con su fuente</Text>
          {puntos.map((punto) => (
            <View key={punto.texto} style={e.puntoDetalle}>
              <Text style={e.punto}><Text style={e.puntoMarca}>✓ </Text>{punto.texto}</Text>
              <Fuente fuente={punto.fuente?.url ? { url: punto.fuente.url, titulo: punto.fuente.titulo } : null} de={punto.texto} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ExclusionesOfertas({ datos, onAbrirEnlace }) {
  const [abiertas, setAbiertas] = useState(false);
  if (!datos?.length) return null;
  return (
    <View style={e.exclusiones}>
      <Pressable
        onPress={() => setAbiertas((valor) => !valor)}
        style={({ pressed }) => [e.exclusionesBoton, pressed && e.pulsado]}
        accessibilityRole="button"
        accessibilityState={{ expanded: abiertas }}
        accessibilityLabel={`${abiertas ? 'Ocultar' : 'Ver'} ${datos.length} exclusiones editoriales`}
        accessibilityHint="Muestra u oculta el anexo de ofertas excluidas"
      >
        <View style={{ flex: 1 }}>
          <Text style={e.exclusionesTitulo}>{abiertas ? 'Ocultar exclusiones' : `Ver ${datos.length} exclusiones`}</Text>
          <Text style={e.exclusionesResumen}>Anexo editorial · no son descartes del radar</Text>
        </View>
        <Text style={e.exclusionesFlecha}>{abiertas ? '↑' : '↓'}</Text>
      </Pressable>
      {abiertas ? (
        <View style={e.exclusionesContenido}>
          <Text style={e.exclusionesIntro}>
            Estas exclusiones acotan la selección de ofertas; no significan que una plataforma esté descartada del radar.
          </Text>
          {datos.map((item, indice) => (
            <View key={`${item.nombre}-${indice}`} style={e.exclusionFila}>
              <Text style={e.exclusionNombre}>{item.nombre}</Text>
              {item.alcance ? <Text style={e.exclusionAlcance}>{item.alcance}</Text> : null}
              <Text style={e.exclusionMotivo}>{item.motivo}</Text>
              {item.urlFuente ? (
                <Pressable onPress={() => onAbrirEnlace?.(item.urlFuente)}
                  accessibilityRole="link" style={({ pressed }) => [e.exclusionFuente, pressed && e.pulsado]}>
                  <Text style={e.exclusionFuenteTxt}>Abrir fuente de la exclusión ↗</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const e = StyleSheet.create({
  ficha: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.bd,
  },
  fichaPulsada: { backgroundColor: C.ton },
  filaSuperior: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pulsado: { backgroundColor: C.ton2 },
  imagen: { width: '100%', backgroundColor: C.sup3 },
  imagenEditorialMarco: { position: 'relative', overflow: 'hidden' },
  imagenEditorial: { width: '100%', height: '100%' },
  etiquetaEditorial: {
    position: 'absolute', left: 10, bottom: 8, zIndex: 2,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.s,
    backgroundColor: 'rgba(11,10,10,0.86)',
    color: C.tx, fontFamily: F.semi, fontSize: 12, lineHeight: 16,
  },
  imagenFicha: { width: 88, aspectRatio: 1, borderRadius: R.m, overflow: 'hidden', backgroundColor: C.sup3 },
  imagenEnFicha: { height: '100%' },
  imagenGrande: { aspectRatio: 960 / 660, borderRadius: R.l },
  imagenFallback: { alignItems: 'center', justifyContent: 'center' },
  imagenFallbackTxt: { fontFamily: F.negrita, fontSize: 34, color: C.noche },
  imagenFallbackTxtPeq: { fontSize: 20 },
  estadoFicha: { ...T.menor, fontFamily: F.semi, color: C.tx2, fontSize: 12, lineHeight: 17 },
  estadoOk: { color: C.senal, backgroundColor: C.senalT, borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  metaFicha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 },
  noDisponible: { ...T.menor, fontSize: 12, lineHeight: 17, color: C.alarma },
  vigenciaOk: { color: C.senal, borderColor: C.senal34 },
  vigenciaProxima: { color: C.aviso },
  vigenciaVencida: { color: C.coral, borderColor: C.coral32 },
  cuerpoFicha: { flex: 1, minWidth: 0 },
  cuerpoGrupo: { padding: 18, gap: 10 },
  grupoNumero: { ...T.dato, fontSize: 20, lineHeight: 27, color: C.tx },
  abrirGrupo: { ...T.menor, fontFamily: F.semi, color: C.senal, fontSize: 14, lineHeight: 20, marginTop: 8 },
  patrocinada: {
    ...T.etiqueta, alignSelf: 'flex-start', color: C.tx2, backgroundColor: C.ton,
    borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4, overflow: 'hidden',
  },
  plataforma: { ...T.menor, fontFamily: F.regular, color: C.tx3, fontSize: 13, lineHeight: 18, marginTop: 3 },
  plataformaNombre: { fontFamily: F.semi, color: C.tx2 },
  lugarTxt: { color: C.tx3 },
  titulo: { ...T.ficha, color: C.tx, fontSize: 16, lineHeight: 20, letterSpacing: -0.16 },
  decisionTarjeta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 2, marginTop: 6 },
  puntos: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 2, marginTop: 10 },
  punto: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx2 },
  puntoMarca: { fontFamily: F.semi, color: C.senal },
  decisionFila: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexShrink: 1, maxWidth: '100%' },
  decisionEtiqueta: { ...T.menor, fontFamily: F.media, fontSize: 12, lineHeight: 18, color: C.tx3 },
  decisionValor: { ...T.menor, fontFamily: F.semi, fontSize: 13, lineHeight: 18, color: C.tx, flexShrink: 1 },
  pieFicha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  avisosN: { ...T.menor, flex: 1, fontSize: 12, lineHeight: 17, color: C.aviso },
  avisosNMarca: { fontFamily: F.semi },
  avisosHueco: { flex: 1 },
  fechaFicha: { ...T.dato, color: C.tx3, fontSize: 12, lineHeight: 17 },
  abrirFicha: { ...T.menor, fontFamily: F.semi, color: C.senal, fontSize: 14, lineHeight: 20, paddingVertical: 12, marginVertical: -12 },
  avisoFicha: {
    borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8,
  },
  avisoFichaStop: { backgroundColor: C.alarmaT },
  avisoFichaWarn: { backgroundColor: C.avisoT },
  avisoFichaTxt: { ...T.menor, fontFamily: F.media, fontSize: 13, lineHeight: 19 },
  avisoTxtStop: { color: C.alarma },
  avisoTxtWarn: { color: C.aviso },
  avisoTxtOk: { color: C.senal },
  datoEtiqueta: { ...T.etiqueta, color: C.tx2, lineHeight: 16, marginBottom: 4 },
  datoValor: { ...T.dato, color: C.tx, fontSize: 20, lineHeight: 27 },
  modal: { flex: 1, backgroundColor: C.noche },
  registrarInversion: { minHeight: UI.tactil, justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingHorizontal: 20, backgroundColor: C.ton, borderRadius: R.m },
  cabeceraModal: {
    flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 12, paddingHorizontal: 16,
    paddingVertical: 10, backgroundColor: C.s1, borderBottomWidth: 1, borderBottomColor: C.bd,
  },
  cabeceraEtiqueta: { ...T.menor, color: C.tx2, flex: 1, minWidth: 0 },
  supra: { ...T.etiqueta, color: C.tx3, marginBottom: 5 },
  modalTitulo: { ...T.ficha, color: C.tx, fontSize: 22, lineHeight: 29, marginBottom: 16 },
  guardarOn: { backgroundColor: C.senalT },
  cerrar: {
    width: UI.tactil, height: UI.tactil, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.p, backgroundColor: C.ton,
  },
  cerrarTxt: { color: C.tx, fontSize: 18 },
  modalDesplazamiento: { flex: 1, minHeight: 0 },
  modalCuerpo: { padding: 16, paddingBottom: 34 },
  proveedorCaja: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.linea },
  proveedorNombre: { ...T.ficha, color: C.tx },
  proveedorMeta: { ...T.menor, color: C.tx2, marginTop: 3 },
  proveedorEstado: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.senal, marginTop: 8 },
  proveedorSolo: { color: C.aviso },
  disponibilidad: { ...T.menor, color: C.tx2, marginTop: 5 },
  disponibilidadNo: { color: C.coral },
  patrocinioAviso: { ...T.menor, color: C.tx2, marginTop: 7 },
  estadoCaja: { backgroundColor: C.ton, borderRadius: R.m, padding: 13, marginTop: 16 },
  estadoCajaVencida: { backgroundColor: C.avisoT },
  estadoTitulo: { ...T.etiqueta, color: C.tx, marginBottom: 6 },
  estadoTexto: { ...T.menor, color: C.tx2 },
  documentacion: { marginVertical: 14 },
  tablaDocumental: { marginTop: 12 },
  referenciaDocumental: { backgroundColor: C.ton, borderRadius: R.m, padding: 13, marginTop: 12 },
  parrafo: { ...T.cuerpo, color: C.tx, marginVertical: 18 },
  destacado: { backgroundColor: C.ton, borderRadius: R.m, padding: 15, marginBottom: 14 },
  referencia: { ...T.menor, color: C.tx2, fontSize: 14, lineHeight: 21, marginTop: 5 },
  destacadoSecundario: {
    backgroundColor: C.ton, borderRadius: R.m, padding: 15, marginBottom: 14,
  },
  destacadoValor: { ...T.ficha, color: C.tx, fontSize: 20 },
  tabla: { borderWidth: 1, borderColor: C.bd, borderRadius: R.l, overflow: 'hidden' },
  filaMetrica: {
    gap: 5, paddingHorizontal: 13, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.linea2,
  },
  metricaEtiqueta: { ...T.menor, fontFamily: F.media, color: C.tx2 },
  metricaValor: { ...T.cuerpo, color: C.tx, lineHeight: 21 },
  avisos: { backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd, borderRadius: R.l, padding: 14, marginTop: 14 },
  riesgoSalida: { ...T.menor, color: C.aviso, fontSize: 13, lineHeight: 19, marginTop: 18 },
  avisosTitulo: { ...T.etiqueta, color: C.tx3, marginBottom: 8 },
  avisoFila: {
    borderRadius: R.s, backgroundColor: C.ton, paddingHorizontal: 10, paddingVertical: 8, marginTop: 6,
  },
  avisoFilaStop: { backgroundColor: C.alarmaT },
  avisoFilaWarn: { backgroundColor: C.avisoT },
  avisoFilaOk: { backgroundColor: C.senalT },
  aviso: { ...T.menor, color: C.tx2 },
  enlace: {
    minHeight: 48, backgroundColor: C.ton, borderRadius: R.m, marginTop: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  enlaceTxt: { fontFamily: F.semi, color: C.tx, fontSize: 15, lineHeight: 20 },
  enlaceSecundario: {
    minHeight: 44, borderRadius: R.m,
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 10, alignItems: 'flex-start', justifyContent: 'center',
  },
  enlaceSecundarioTxt: { fontFamily: F.semi, color: C.senal, fontSize: 14 },
  deshabilitado: { opacity: 0.45 },
  notaLegal: { ...T.menor, color: C.tx3, textAlign: 'center', marginTop: 16 },
  transparencia: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.bd },
  seccionDetalle: { ...T.seccion, color: C.tx, marginBottom: 4 },
  comprobacion: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.bd },
  comprobacionMarca: { width: 20, fontFamily: F.semi, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  comprobacionSi: { color: C.senal },
  comprobacionNo: { color: C.alarma },
  comprobacionTit: { ...T.cuerpoFte, fontFamily: F.semi, fontSize: 15, lineHeight: 21, color: C.tx },
  comprobacionMotivo: { ...T.menor, color: C.tx2, marginTop: 3 },
  comprobacionDato: { fontFamily: F.semi, color: C.tx },
  /* Enlace y fecha en la misma fila si caben: sin huecos de 44 px apilados. */
  comprobacionFuente: { marginTop: 2, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10 },
  referenciaFila: { marginTop: 0 },
  enlaceFuente: { minHeight: UI.tactil, justifyContent: 'center', alignSelf: 'flex-start', borderRadius: R.m },
  enlaceFuentePulsado: { backgroundColor: C.senalT },
  enlaceFuenteTxt: { ...T.menor, fontFamily: F.semi, color: C.senal },
  puntosDetalle: { marginTop: 14, gap: 6 },
  puntoDetalle: { gap: 0 },
  exclusiones: {
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.bd,
    borderRadius: R.l, padding: 10, marginTop: 6, marginBottom: 16,
  },
  exclusionesBoton: {
    minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 5,
  },
  exclusionesTitulo: { ...T.ficha, color: C.tx },
  exclusionesResumen: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 2 },
  exclusionesFlecha: { ...T.ficha, color: C.tx3, paddingHorizontal: 6 },
  exclusionesContenido: {
    borderTopWidth: 1, borderTopColor: C.linea2, marginTop: 7, paddingHorizontal: 5,
  },
  exclusionesIntro: { ...T.menor, color: C.tx2, marginTop: 12, marginBottom: 12 },
  exclusionFila: { borderTopWidth: 1, borderTopColor: C.linea2, paddingVertical: 10 },
  exclusionNombre: { ...T.cuerpoFte, color: C.tx },
  exclusionAlcance: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx3, marginTop: 3 },
  exclusionMotivo: { ...T.menor, color: C.tx2, marginTop: 3 },
  exclusionFuente: { minHeight: 38, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 5 },
  exclusionFuenteTxt: { ...T.menor, fontFamily: F.semi, color: C.senal },
});
