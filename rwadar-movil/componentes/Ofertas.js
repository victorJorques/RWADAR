import React, { useEffect, useState } from 'react';
import {
  AppState, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ETIQUETA_EDITORIAL, imagenEditorial } from '../fixtures/imagenes-editoriales';
import { vigenciaOferta } from '../lib/datos';
import { documentacionOferta, fechaVerificacionLocalVisible, ofertaConCifrasVigentes } from '../lib/verificacion-local';
import { C, COLOR_CATEGORIA, F, R, T, UI, iniciales } from '../lib/tema';

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
    return { etiqueta: 'REFERENCIA DOCUMENTAL', valor: 'Consultar fuente' };
  }
  if (oferta.cifrasPendientes) {
    return { etiqueta: 'CONDICIONES ACTUALES', valor: 'Consultar emisor' };
  }
  if (oferta.tipo === 'rendimiento') {
    return {
      etiqueta: 'RENTABILIDAD PUBLICADA',
      valor: oferta.rentabilidad?.mostrada || oferta.rentabilidad?.literal || 'No publicada',
      referencia: oferta.rentabilidad?.literal || '',
    };
  }
  if (oferta.tipo === 'valor') {
    return { etiqueta: 'PRECIO DE REFERENCIA', valor: oferta.precio?.mostrado || 'Consultar fuente',
      referencia: oferta.precio?.unidad || '' };
  }
  const valor = [oferta.precio?.mostrado, oferta.precio?.unidad].filter(Boolean).join(' / ');
  return { etiqueta: 'PRECIO EN SECUNDARIO', valor: valor || 'Consultar mercado' };
}

function rentabilidadSecundaria(oferta) {
  if (oferta?.tipo !== 'secundario') return '';
  return [...new Set([
    oferta.rentabilidad?.mostrada,
    oferta.rentabilidad?.literal,
  ].filter(Boolean))].join(' · ');
}

function avisosCriticos(oferta) {
  return (oferta?.avisos || [])
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
  if (coleccion === 'en_camino') return 'EN CAMINO';
  if (coleccion === 'secundario') return 'SECUNDARIO';
  if (tipo === 'secundario') return 'SECUNDARIO';
  if (tipo === 'valor') return 'VALOR';
  return 'RENDIMIENTO';
}

function etiquetaDatoCompacta(tipo) {
  if (tipo === 'secundario') return 'PRECIO';
  if (tipo === 'valor') return 'PRECIO REF.';
  return 'RENTABILIDAD';
}

function tonoVigencia(estado) {
  if (estado === 'vencida' || estado === 'permanente-vencida' ||
    estado === 'bloqueada' || estado === 'conflicto') return e.vigenciaVencida;
  if (estado === 'proxima' || estado === 'permanente-proxima') return e.vigenciaProxima;
  if (estado === 'vigente' || estado === 'permanente-vigente') return e.vigenciaOk;
  return null;
}

function ImagenOferta({ oferta, grande = false, decorativa = false, estilo }) {
  const [fallo, setFallo] = useState(false);
  const editorial = imagenEditorial(oferta.categoria);
  if (!editorial || fallo) {
    return (
      <View
        style={[e.imagen, grande && e.imagenGrande, estilo, e.imagenFallback, e.imagenEditorialMarco,
          { backgroundColor: COLOR_CATEGORIA[oferta.categoria] || C.sup3 }]}
        accessible={!decorativa}
        importantForAccessibility={decorativa ? 'no-hide-descendants' : 'auto'}
        accessibilityRole={decorativa ? undefined : 'image'}
        accessibilityLabel={decorativa ? undefined : `Sin ${ETIQUETA_EDITORIAL.toLocaleLowerCase('es')} disponible para ${oferta.titulo}`}
      >
        <Text style={e.imagenFallbackTxt}>{iniciales(oferta.plataformaNombre || oferta.titulo)}</Text>
        <Text style={e.etiquetaEditorial} accessible={false} importantForAccessibility="no">
          {ETIQUETA_EDITORIAL}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={[e.imagen, grande && e.imagenGrande, estilo, e.imagenEditorialMarco]}
      accessible={!decorativa}
      importantForAccessibility={decorativa ? 'no-hide-descendants' : 'auto'}
      accessibilityRole={decorativa ? undefined : 'image'}
      accessibilityLabel={decorativa ? undefined : editorial.alt}
    >
      <Image
        source={editorial.fuente}
        style={e.imagenEditorial}
        resizeMode="cover"
        onError={() => setFallo(true)}
        accessible={false}
        importantForAccessibility="no"
      />
      <Text
        style={e.etiquetaEditorial}
        accessible={false}
        importantForAccessibility="no"
      >
        {editorial.etiqueta}
      </Text>
    </View>
  );
}

export function FichaOferta({ oferta: ofertaOriginal, onAbrir }) {
  const ahora = useFechaOferta();
  const oferta = ofertaConCifrasVigentes(ofertaOriginal, ahora);
  const documentacion = documentacionOferta(ofertaOriginal, ahora);
  const vigencia = vigenciaOferta(oferta, ahora);
  const destacado = datoDestacado(oferta);
  const criticos = avisosCriticos(oferta);
  const primerCritico = criticos[0];
  const etiquetaAccesible = [
    `Ver ficha de ${oferta.titulo}`, oferta.plataformaNombre,
    ETIQUETA_EDITORIAL,
    oferta.patrocinada ? 'Contenido patrocinado; no altera el ranking' : null,
    `${destacado.etiqueta}: ${destacado.valor}`,
    destacado.referencia,
    documentacion?.etiqueta,
    vigencia.etiqueta,
    primerCritico
      ? `${primerCritico.tono === 'stop' ? 'Aviso bloqueante' : 'Precaución'}: ${primerCritico.texto}`
      : null,
    criticos.length > 1 ? `${criticos.length - 1} avisos adicionales en el detalle` : null,
  ].filter(Boolean).join('. ');
  return (
    <Pressable
      onPress={onAbrir}
      style={({ pressed }) => [e.ficha, pressed && e.pulsado]}
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible}
      accessibilityHint="Abre la ficha completa de la oferta"
    >
      <View style={e.imagenFicha}>
        <ImagenOferta oferta={oferta} decorativa estilo={e.imagenEnFicha} />
        <View style={e.tipoPastilla}>
          <Text style={e.tipoPastillaTxt}>{tipoVisible(oferta.tipo, oferta.coleccion)}</Text>
        </View>
      </View>
      <View style={e.cuerpoFicha}>
        {oferta.patrocinada ? <Text style={e.patrocinada}>PATROCINADA</Text> : null}
        <Text style={e.titulo} numberOfLines={2}>{oferta.titulo}</Text>
        <Text style={e.plataforma} numberOfLines={1}>{oferta.plataformaNombre}</Text>
        <View style={e.datosCompactos}>
          <View style={e.datoCompacto}>
            <Text style={e.datoEtiqueta}>{oferta.cifrasPendientes ? destacado.etiqueta : etiquetaDatoCompacta(oferta.tipo)}</Text>
            <Text style={e.datoValor}>{destacado.valor}</Text>
          </View>
        </View>
        {/* Una cifra conserva su ventana/unidad completa. La compactación
            elimina bloques duplicados, nunca la condición de una cifra. */}
        {destacado.referencia ? <Text style={e.referencia}>{destacado.referencia}</Text> : null}
        <Text style={[e.estadoFicha, tonoVigencia(vigencia.estado)]}>{vigencia.etiqueta}</Text>
        {primerCritico ? (
          <View style={[
            e.avisoFicha,
            primerCritico.tono === 'stop' ? e.avisoFichaStop : e.avisoFichaWarn,
          ]}>
            <Text style={[
              e.avisoFichaTxt,
              primerCritico.tono === 'stop' ? e.avisoTxtStop : e.avisoTxtWarn,
            ]}>
              {primerCritico.tono === 'stop' ? 'IMPORTANTE' : 'ATENCIÓN'} · {primerCritico.texto}
              {criticos.length > 1 ? ` · ${criticos.length - 1} más en la ficha` : ''}
            </Text>
          </View>
        ) : null}
        <View style={e.pieFicha}>
          <Text style={e.fechaFicha}>
            {documentacion ? `Doc. ${fechaVerificacionLocalVisible(documentacion.fecha)}` : 'Fecha sin verificar'}
          </Text>
          <Text style={e.abrirFicha}>Ver ficha →</Text>
        </View>
      </View>
    </Pressable>
  );
}

function FilaMetrica({ etiqueta, valor }) {
  return (
    <View style={e.filaMetrica}>
      <Text style={e.metricaEtiqueta}>{etiqueta}</Text>
      <Text style={e.metricaValor}>{valor}</Text>
    </View>
  );
}

export function DetalleOferta({ oferta: ofertaOriginal, onCerrar, onAbrirEnlace, plataformaCanonica }) {
  const ahora = useFechaOferta();
  if (!ofertaOriginal) return null;
  const oferta = ofertaConCifrasVigentes(ofertaOriginal, ahora);
  const documentacion = documentacionOferta(ofertaOriginal, ahora);
  const vigencia = vigenciaOferta(oferta, ahora);
  const destacado = datoDestacado(oferta);
  const rentabilidadSec = rentabilidadSecundaria(oferta);
  const cifraVencida = oferta.cifrasPendientes;
  const enlacePrincipal = oferta.tipo === 'secundario'
    ? (oferta.urlMercado || oferta.url) : oferta.url;
  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaProvider>
        <SafeAreaView style={e.modal} edges={['top', 'bottom']}>
          <View style={e.cabeceraModal}>
            <View style={{ flex: 1 }}>
              <Text style={e.supra}>{oferta.coleccion && oferta.coleccion !== 'principales' ? 'REFERENCIA' : 'OFERTA'} · {tipoVisible(oferta.tipo, oferta.coleccion)}</Text>
              <Text style={e.modalTitulo} numberOfLines={2}>{oferta.titulo}</Text>
            </View>
            <Pressable onPress={onCerrar} style={({ pressed }) => [e.cerrar, pressed && e.pulsado]}
              accessibilityRole="button" accessibilityLabel={`Cerrar ${oferta.titulo}`} hitSlop={10}>
              <Text style={e.cerrarTxt}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={e.modalCuerpo}>
            <ImagenOferta oferta={oferta} grande />
            <View style={e.proveedorCaja}>
              <Text style={e.proveedorNombre}>{oferta.plataformaNombre}</Text>
              <Text style={e.proveedorMeta}>
                {[oferta.categoria, oferta.pais].filter(Boolean).join(' · ')}
              </Text>
              {documentacion ? <Text style={e.referencia}>{documentacion.etiqueta}</Text> : null}
              <Text style={[e.proveedorEstado, !plataformaCanonica && e.proveedorSolo]}>
                {plataformaCanonica
                  ? 'Plataforma incluida también en el radar canónico'
                  : 'Proveedor solo del escaparate · no admite seguimiento'}
              </Text>
              <Text style={[e.disponibilidad, oferta.disponibleEs === false && e.disponibilidadNo]}>
                {oferta.disponibleEs === true
                  ? 'Disponible desde España en la fecha verificada'
                  : oferta.disponibleEs === false
                    ? 'No disponible desde España en la fecha verificada'
                    : 'Disponibilidad desde España sin comprobar'}
              </Text>
              {oferta.patrocinada ? (
                <Text style={e.patrocinioAviso}>
                  Patrocinada. Consulta la relación comercial en la ficha; no altera el ranking ni implica recomendación.
                </Text>
              ) : null}
            </View>

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
                <Text style={e.avisosTitulo}>FICHA DOCUMENTADA · {fechaVerificacionLocalVisible(documentacion.fecha)}</Text>
                <Text style={e.estadoTexto}>{documentacion.descripcion}</Text>
                {documentacion.caracteristicas.length ? (
                  <View style={[e.tabla, e.tablaDocumental]}>
                    {documentacion.caracteristicas.map((caracteristica, indice) => (
                      <FilaMetrica key={`documentacion-${indice}`} {...caracteristica} />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {oferta.resumen ? <Text style={e.parrafo}>{oferta.resumen}</Text> : null}
            <View style={e.destacado}>
              <Text style={e.datoEtiqueta}>{destacado.etiqueta}</Text>
              <Text style={e.destacadoValor}>{destacado.valor}</Text>
              {destacado.referencia ? <Text style={e.referencia}>{destacado.referencia}</Text> : null}
            </View>
            {rentabilidadSec ? (
              <View style={e.destacadoSecundario}>
                <Text style={e.datoEtiqueta}>RENTABILIDAD AJUSTADA / PUBLICADA</Text>
                <Text style={e.destacadoValor}>{rentabilidadSec}</Text>
              </View>
            ) : null}

            {oferta.metricas.length ? (
              <View style={e.tabla}>
                {oferta.metricas.map((metrica, indice) => (
                  <FilaMetrica key={`${metrica.etiqueta}-${indice}`} {...metrica} />
                ))}
              </View>
            ) : null}

            {documentacion?.referencias.length ? (
              <View style={e.documentacion}>
                <Text style={e.avisosTitulo}>REFERENCIAS FECHADAS</Text>
                <Text style={e.estadoTexto}>
                  Datos publicados en las fechas indicadas. No son precios actuales ni garantizan rentabilidad, apertura o disponibilidad para contratar.
                </Text>
                {documentacion.referencias.map((referencia, indice) => (
                  <View style={e.referenciaDocumental} key={`referencia-${indice}`}>
                    <Text style={e.datoEtiqueta}>{referencia.etiqueta}</Text>
                    <Text style={e.datoValor}>{referencia.valor}</Text>
                    <Text style={e.referencia}>
                      Fecha del dato: {referencia.fechaDato ? fechaVerificacionLocalVisible(referencia.fechaDato) : 'no indicada en la fuente'}
                    </Text>
                    <Text style={e.referencia}>Consultado el {fechaVerificacionLocalVisible(referencia.fechaConsulta)}</Text>
                    <Text style={e.referencia}>{referencia.alcance}</Text>
                    <Pressable onPress={() => onAbrirEnlace(referencia.fuente)}
                      style={({ pressed }) => [e.enlaceSecundario, pressed && e.pulsado]}
                      accessibilityRole="link" accessibilityLabel={`Ver fuente · ${dominioFuente(referencia.fuente)} de ${referencia.etiqueta}: ${referencia.fuente}`}>
                      <Text style={e.enlaceSecundarioTxt}>Ver fuente · {dominioFuente(referencia.fuente)} ↗</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {oferta.avisos.length ? (
              <View style={e.avisos}>
                <Text style={e.avisosTitulo}>ANTES DE ABRIR EL ENLACE</Text>
                {oferta.avisos.map((aviso, indice) => (
                  <View key={`${aviso.texto}-${indice}`} style={[
                    e.avisoFila,
                    aviso.tono === 'stop' && e.avisoFilaStop,
                    aviso.tono === 'warn' && e.avisoFilaWarn,
                    aviso.tono === 'ok' && e.avisoFilaOk,
                  ]}>
                    <Text style={[
                      e.aviso,
                      aviso.tono === 'stop' && e.avisoTxtStop,
                      aviso.tono === 'warn' && e.avisoTxtWarn,
                      aviso.tono === 'ok' && e.avisoTxtOk,
                    ]}>• {aviso.texto}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={() => enlacePrincipal && onAbrirEnlace(enlacePrincipal)}
              disabled={!enlacePrincipal}
              style={({ pressed }) => [e.enlace, !enlacePrincipal && e.deshabilitado, pressed && e.pulsado]}
              accessibilityRole="link"
              accessibilityState={{ disabled: !enlacePrincipal }}
            >
              <Text style={e.enlaceTxt}>
                {cifraVencida ? 'Consultar fuente' : oferta.tipo === 'secundario' ? 'Ver mercado' : 'Ver oferta'} en {oferta.plataformaNombre} ↗
              </Text>
            </Pressable>
            {oferta.tipo === 'secundario' && oferta.url && oferta.url !== enlacePrincipal ? (
              <Pressable onPress={() => onAbrirEnlace(oferta.url)}
                style={({ pressed }) => [e.enlaceSecundario, pressed && e.pulsado]}
                accessibilityRole="link">
                <Text style={e.enlaceSecundarioTxt}>Abrir ficha oficial ↗</Text>
              </Pressable>
            ) : null}
            {documentacion ? (
              <View>
                <Text style={e.avisosTitulo}>FUENTES CONSULTADAS · {documentacion.fecha}</Text>
                {documentacion.fuentes.map((url, indice) => (
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
      </SafeAreaProvider>
    </Modal>
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
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: R.ficha,
    overflow: 'hidden', marginBottom: 10,
  },
  pulsado: { opacity: 0.72, transform: [{ scale: 0.992 }] },
  imagen: { width: '100%', backgroundColor: C.sup3 },
  imagenEditorialMarco: { position: 'relative', overflow: 'hidden' },
  imagenEditorial: { width: '100%', height: '100%' },
  etiquetaEditorial: {
    position: 'absolute', left: 10, bottom: 8, zIndex: 2,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999,
    backgroundColor: 'rgba(8,10,13,0.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    color: '#FFFFFF', fontFamily: F.mono, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.5,
  },
  imagenFicha: { width: '100%', aspectRatio: 2, position: 'relative', backgroundColor: C.sup3 },
  imagenEnFicha: { height: '100%' },
  imagenGrande: { height: 220, borderRadius: R.ficha },
  imagenFallback: { alignItems: 'center', justifyContent: 'center' },
  imagenFallbackTxt: { fontFamily: F.extra, fontSize: 34, color: C.noche },
  tipoPastilla: {
    position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(8, 18, 17, 0.88)',
    borderWidth: 1, borderColor: C.linea2, borderRadius: R.pastilla,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  tipoPastillaTxt: { ...T.etiqueta, color: C.tx, fontSize: 11 },
  estadoFicha: { ...T.menor, fontFamily: F.media, color: C.tx2, fontSize: 12, lineHeight: 17, marginTop: 8 },
  vigenciaOk: { color: C.senal, borderColor: C.senal34 },
  vigenciaProxima: { color: '#F2B23C', borderColor: '#665126' },
  vigenciaVencida: { color: C.coral, borderColor: C.coral32 },
  cuerpoFicha: { padding: 12 },
  patrocinada: {
    ...T.etiqueta, alignSelf: 'flex-start', color: C.noche, backgroundColor: C.senal,
    borderRadius: R.pastilla, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 7,
  },
  plataforma: { ...T.menor, fontFamily: F.media, color: C.tx2, fontSize: 12, lineHeight: 17, marginTop: 3 },
  titulo: { ...T.ficha, color: C.tx, fontSize: 17, lineHeight: 21 },
  datosCompactos: {
    flexDirection: 'row', gap: 9, marginTop: 9, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea2,
  },
  datoCompacto: { flex: 1, minWidth: 0 },
  pieFicha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  fechaFicha: { ...T.menor, color: C.tx2, fontSize: 12, lineHeight: 17 },
  abrirFicha: { ...T.menor, fontFamily: F.semi, color: C.senal, fontSize: 12, lineHeight: 17 },
  avisoFicha: {
    borderWidth: 1, borderRadius: R.s, paddingHorizontal: 8, paddingVertical: 5, marginTop: 8,
  },
  avisoFichaStop: { backgroundColor: C.coral10, borderColor: C.coral32 },
  avisoFichaWarn: { backgroundColor: '#2B2416', borderColor: '#6F592B' },
  avisoFichaTxt: { ...T.menor, fontFamily: F.media, fontSize: 12, lineHeight: 17 },
  avisoTxtStop: { color: C.coral },
  avisoTxtWarn: { color: '#F2B23C' },
  avisoTxtOk: { color: C.senal },
  datoEtiqueta: { ...T.etiqueta, color: C.tx2, fontSize: 11.5, lineHeight: 16, marginBottom: 4 },
  datoValor: { ...T.dato, color: C.tx, fontSize: 17, lineHeight: 22 },
  modal: { flex: 1, backgroundColor: C.noche },
  cabeceraModal: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18,
    paddingVertical: 14, backgroundColor: C.noche2, borderBottomWidth: 1, borderBottomColor: C.linea,
  },
  supra: { ...T.etiqueta, color: C.senal, marginBottom: 5 },
  modalTitulo: { ...T.ficha, color: C.tx, fontSize: 19 },
  cerrar: {
    width: UI.tactil, height: UI.tactil, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.pastilla, backgroundColor: C.sup2,
  },
  cerrarTxt: { color: C.tx, fontSize: 18 },
  modalCuerpo: { padding: 16, paddingBottom: 34 },
  proveedorCaja: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.linea },
  proveedorNombre: { ...T.ficha, color: C.tx },
  proveedorMeta: { ...T.menor, color: C.tx2, marginTop: 3 },
  proveedorEstado: { ...T.dato, color: C.senal, marginTop: 8 },
  proveedorSolo: { color: '#F2B23C' },
  disponibilidad: { ...T.menor, color: C.tx2, marginTop: 5 },
  disponibilidadNo: { color: C.coral },
  patrocinioAviso: { ...T.menor, color: C.senal, marginTop: 7 },
  estadoCaja: { backgroundColor: C.senal10, borderRadius: R.m, padding: 13, marginTop: 16 },
  estadoCajaVencida: { backgroundColor: C.coral10 },
  estadoTitulo: { ...T.etiqueta, color: C.tx, marginBottom: 6 },
  estadoTexto: { ...T.menor, color: C.tx2 },
  documentacion: { marginVertical: 14 },
  tablaDocumental: { marginTop: 12 },
  referenciaDocumental: { backgroundColor: C.sup2, borderRadius: R.m, padding: 13, marginTop: 12 },
  parrafo: { ...T.cuerpo, color: C.tx, marginVertical: 18 },
  destacado: { backgroundColor: C.sup2, borderRadius: R.m, padding: 15, marginBottom: 14 },
  referencia: { ...T.menor, color: C.tx2, fontSize: 12, lineHeight: 18, marginTop: 5 },
  destacadoSecundario: {
    backgroundColor: C.senal10, borderWidth: 1, borderColor: C.senal34,
    borderRadius: R.m, padding: 15, marginBottom: 14,
  },
  destacadoValor: { ...T.ficha, color: C.tx, fontSize: 21 },
  tabla: { borderWidth: 1, borderColor: C.linea, borderRadius: R.m, overflow: 'hidden' },
  filaMetrica: {
    gap: 5, paddingHorizontal: 13, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.linea2,
  },
  metricaEtiqueta: { ...T.menor, fontFamily: F.media, color: C.tx2 },
  metricaValor: { ...T.cuerpo, color: C.tx, lineHeight: 21 },
  avisos: { backgroundColor: C.sup, borderRadius: R.m, padding: 14, marginTop: 14 },
  avisosTitulo: { ...T.etiqueta, color: '#F2B23C', marginBottom: 8 },
  avisoFila: {
    borderWidth: 1, borderColor: C.linea2, borderRadius: R.s,
    backgroundColor: C.sup2, paddingHorizontal: 10, paddingVertical: 8, marginTop: 6,
  },
  avisoFilaStop: { backgroundColor: C.coral10, borderColor: C.coral32 },
  avisoFilaWarn: { backgroundColor: '#2B2416', borderColor: '#6F592B' },
  avisoFilaOk: { backgroundColor: C.senal10, borderColor: C.senal34 },
  aviso: { ...T.menor, color: C.tx2 },
  enlace: {
    minHeight: UI.boton, backgroundColor: C.senal, borderRadius: R.m, marginTop: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  enlaceTxt: { fontFamily: F.negrita, color: C.noche, fontSize: 15 },
  enlaceSecundario: {
    minHeight: UI.boton, borderWidth: 1, borderColor: C.linea2, borderRadius: R.m,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  enlaceSecundarioTxt: { fontFamily: F.semi, color: C.tx, fontSize: 14 },
  deshabilitado: { opacity: 0.45 },
  notaLegal: { ...T.menor, color: C.tx3, textAlign: 'center', marginTop: 16 },
  exclusiones: {
    backgroundColor: C.noche2, borderWidth: 1, borderColor: C.linea,
    borderRadius: R.panel, padding: 10, marginTop: 6, marginBottom: 16,
  },
  exclusionesBoton: {
    minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 5,
  },
  exclusionesTitulo: { ...T.ficha, color: C.tx },
  exclusionesResumen: { ...T.dato, color: C.tx3, marginTop: 2 },
  exclusionesFlecha: { ...T.ficha, color: C.senal, paddingHorizontal: 6 },
  exclusionesContenido: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea2, marginTop: 7, paddingHorizontal: 5,
  },
  exclusionesIntro: { ...T.menor, color: C.tx2, marginTop: 12, marginBottom: 12 },
  exclusionFila: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.linea2, paddingVertical: 10 },
  exclusionNombre: { ...T.cuerpoFte, color: C.tx },
  exclusionAlcance: { ...T.dato, color: C.senal, marginTop: 3 },
  exclusionMotivo: { ...T.menor, color: C.tx2, marginTop: 3 },
  exclusionFuente: { minHeight: 38, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 5 },
  exclusionFuenteTxt: { ...T.menor, fontFamily: F.semi, color: C.senal },
});
