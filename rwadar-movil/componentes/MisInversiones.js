import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from './Idioma';
import { MONEDAS, crearPosicion, anadirMovimiento, fijarValoracion, resumirPosicion, resumirCartera, fechaHoy } from '../lib/cartera';
import { cargarCartera, guardarCartera } from '../lib/cartera-local';
import { C, F, R, T, UI } from '../lib/tema';

const TIPOS = [['compra', 'Compra'], ['venta', 'Venta'], ['cobro', 'Cobro'], ['gasto', 'Gasto']];
const identificador = prefijo => `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const decimal = valor => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
export const importeVisible = (centimos, moneda) => centimos == null ? 'Sin valoración' : `${decimal(centimos / 100)} ${moneda}`;
const porcentajeVisible = valor => valor == null ? 'Sin valoración' : `${decimal(valor)} %`;
const fechaVisible = valor => valor ? valor.split('-').reverse().join('/') : 'Sin fecha';
const nuevoFormulario = (oferta = {}) => ({
  modo: 'alta', tipo: 'compra', nombre: oferta.titulo || '', proveedor: oferta.plataformaNombre || '',
  ofertaSlug: oferta.slug || '', moneda: '', fecha: fechaHoy(), cantidad: '', precio: '', comision: '', importe: '',
});

function Boton({ texto, onPress, secundario = false, peligro = false, disabled = false }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={texto}
    accessibilityState={{ disabled }} style={({ pressed }) => [e.boton, secundario && e.secundario,
      peligro && e.peligro, disabled && e.deshabilitado, pressed && e.pulsado]}>
    <Text style={[e.botonTexto, secundario && e.textoSecundario, peligro && e.textoPeligro]}>{texto}</Text>
  </Pressable>;
}

function Campo({ etiqueta, valor, onChangeText, decimal: esDecimal = false, ...props }) {
  return <View style={e.campo}>
    <Text style={e.etiqueta}>{etiqueta}</Text>
    <TextInput value={valor} onChangeText={onChangeText} style={e.entrada}
      accessibilityLabel={etiqueta} placeholderTextColor={C.tx3} autoCorrect={false}
      autoCapitalize="none" keyboardType={esDecimal ? 'decimal-pad' : 'default'} maxLength={esDecimal ? 32 : 120} {...props} />
  </View>;
}

function Dato({ etiqueta, valor, destacado = false }) {
  return <View style={e.dato}><Text style={e.etiqueta}>{etiqueta}</Text>
    <Text noTraducir={/\d/.test(String(valor))} style={[e.valor, destacado && e.valorPrincipal]}>{valor}</Text></View>;
}

export default function MisInversiones(props) {
  if (!props.usuarioId) return null;
  // Una cuenta distinta monta un estado nuevo antes de dibujar sus datos.
  return <CarteraUsuario key={props.usuarioId} {...props} />;
}

export function CarteraUsuario({ usuarioId, ofertaInicial = null, onConsumirOferta, cargar: cargarCuenta, guardar: guardarCuenta }) {
  const [posiciones, setPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargaCorrecta, setCargaCorrecta] = useState(false);
  const [formulario, setFormulario] = useState(null);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(null);
  const [copiaLocal, setCopiaLocal] = useState([]);
  const vivo = useRef(true), escritura = useRef(false);
  const generacion = useRef(0);
  const sincronizada = typeof cargarCuenta === 'function' && typeof guardarCuenta === 'function';

  useEffect(() => {
    vivo.current = true;
    const estaCarga = ++generacion.current;
    const vigente = () => vivo.current && generacion.current === estaCarga;
    const controlador = new AbortController();
    setCargando(true); setCargaCorrecta(false); setPosiciones([]); setCopiaLocal([]); setVersion(null);
    setError(''); setMensaje(''); setGuardando(false); escritura.current = false;
    const carga = sincronizada ? cargarCuenta({ signal: controlador.signal }) : cargarCartera(usuarioId).then(posiciones => ({ posiciones, version: null }));
    carga.then(datos => {
      if (!vigente()) return;
      setPosiciones(datos.posiciones); setVersion(datos.version); setCargaCorrecta(true);
    }).catch(() => {
      if (vigente()) setError('No se pudieron leer tus inversiones. No se sobrescribirá lo guardado. Vuelve a abrir Perfil para reintentar. La copia anterior de este dispositivo se conserva.');
    }).finally(() => { if (vigente()) setCargando(false); });
    if (sincronizada) cargarCartera(usuarioId).then(datos => { if (vigente()) setCopiaLocal(datos); }).catch(() => {});
    return () => { vivo.current = false; generacion.current += 1; controlador.abort(); };
  }, [usuarioId, sincronizada, cargarCuenta]);

  useEffect(() => {
    if (!ofertaInicial) return;
    setFormulario(nuevoFormulario(ofertaInicial)); setError(''); setMensaje('');
    onConsumirOferta?.();
  }, [ofertaInicial, onConsumirOferta]);

  async function persistir(siguientes, texto) {
    if (!vivo.current || !cargaCorrecta || escritura.current) return;
    escritura.current = true; setGuardando(true); setError('');
    const estaEscritura = generacion.current;
    const vigente = () => vivo.current && generacion.current === estaEscritura;
    try {
      const confirmada = sincronizada ? await guardarCuenta(siguientes, version) :
        (await guardarCartera(usuarioId, siguientes), { posiciones: siguientes, version: null });
      if (vigente()) { setPosiciones(confirmada.posiciones); setVersion(confirmada.version); setFormulario(null); setMensaje(texto); }
    } catch {
      if (vigente()) setError('No se pudo confirmar el guardado. Tus registros anteriores se conservan. Si los editaste en otro dispositivo, vuelve a abrir Perfil antes de reintentarlo.');
    } finally {
      if (vigente()) { escritura.current = false; setGuardando(false); }
    }
  }

  function iniciar(modo, posicion) {
    setError(''); setMensaje('');
    setFormulario(posicion
      ? { ...nuevoFormulario(), modo, posicionId: posicion.id, nombre: posicion.nombre, moneda: posicion.moneda }
      : nuevoFormulario());
  }

  function guardar() {
    if (guardando || !cargaCorrecta || !formulario) return;
    try {
      const f = formulario;
      let posicion = posiciones.find(p => p.id === f.posicionId);
      if (f.modo === 'alta') posicion = crearPosicion({ id: identificador('pos'), nombre: f.nombre,
        proveedor: f.proveedor, ofertaSlug: f.ofertaSlug || undefined, moneda: f.moneda });
      if (!posicion) throw new Error('No se encontró la inversión. Vuelve a abrir el formulario.');
      if (f.modo === 'valoracion') posicion = fijarValoracion(posicion, { precio: f.precio, fecha: f.fecha });
      else {
        const operacion = f.modo === 'alta' ? 'compra' : f.tipo;
        if (['compra', 'venta'].includes(operacion) && !f.comision.trim()) {
          throw new Error('Indica la comisión; escribe 0 si no hubo comisión.');
        }
        posicion = anadirMovimiento(posicion, { id: identificador('mov'), tipo: operacion, fecha: f.fecha,
          ...(['compra', 'venta'].includes(operacion)
            ? { cantidad: f.cantidad, precio: f.precio, comision: f.comision }
            : { importe: f.importe }) });
      }
      const siguientes = f.modo === 'alta' ? [...posiciones, posicion] : posiciones.map(p => p.id === posicion.id ? posicion : p);
      persistir(siguientes, f.modo === 'valoracion' ? 'Precio y fecha guardados.' : 'Movimiento guardado.');
    } catch (fallo) { setError(fallo.message || 'Revisa los datos de la inversión.'); }
  }

  function eliminar(posicion) {
    Alert.alert('Eliminar inversión', `Se eliminarán «${posicion.nombre}» y sus movimientos ${sincronizada ? 'de tu cuenta. La copia local anterior se conserva.' : 'de este dispositivo.'}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => persistir(posiciones.filter(p => p.id !== posicion.id), 'Inversión eliminada.') },
    ]);
  }

  function importarCopiaLocal() {
    if (!sincronizada || posiciones.length || !copiaLocal.length || !cargaCorrecta || guardando) return;
    Alert.alert('Importar copia local', 'Se copiarán a tu cuenta las inversiones registradas en este dispositivo. La cuenta está vacía. La copia local se conserva y no se combinará con otras inversiones automáticamente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Importar a mi cuenta', onPress: () => persistir(copiaLocal, 'Copia local importada a tu cuenta. La copia del dispositivo se conserva.') },
    ]);
  }

  const bloqueado = cargando || !cargaCorrecta || guardando;
  const f = formulario;
  const resumen = cargaCorrecta ? resumirCartera(posiciones) : [];
  return <View style={e.seccion}>
    <Text style={e.titulo} accessibilityRole="header">Mis inversiones</Text>
    <Text style={e.nota}>{sincronizada
      ? 'Registro manual de tu cuenta, compartido con la web. RWAdar no consulta proveedores ni actualiza precios automáticamente.'
      : 'Registro manual, solo en este dispositivo: se pierde al desinstalar o borrar sus datos. No consulta tus compras en los proveedores.'}</Text>
    {cargando ? <ActivityIndicator color={C.senal} accessibilityLabel="Cargando mis inversiones" /> : null}
    {error ? <Text style={e.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text> : null}
    {mensaje ? <Text style={e.mensaje} accessibilityLiveRegion="polite">{mensaje}</Text> : null}
    {!cargando && cargaCorrecta ? <View style={e.resumen}>
      <Text style={e.subtitulo} accessibilityRole="header">Tu resumen</Text>
      {resumen.length ? resumen.map(grupo => <View key={grupo.moneda}>
        <Text noTraducir style={e.unidades}>{grupo.moneda}</Text>
        <View style={e.rejilla}>
          <Dato etiqueta="Invertido" valor={importeVisible(grupo.aportadoCentimos, grupo.moneda)} />
          <Dato etiqueta="Valor registrado" valor={importeVisible(grupo.valorActualCentimos, grupo.moneda)} destacado />
          <Dato etiqueta="Cobrado" valor={importeVisible(grupo.cobradoCentimos, grupo.moneda)} />
          <Dato etiqueta="Resultado" valor={importeVisible(grupo.resultadoCentimos, grupo.moneda)} destacado />
        </View>
        {grupo.pendientesValoracion ? <Text style={e.aviso}>Faltan valoraciones: el valor total y el resultado se mostrarán cuando añadas los precios y sus fechas.</Text> : null}
      </View>) : <View style={e.rejilla}>
        <Dato etiqueta="Invertido" valor="Sin compras" />
        <Dato etiqueta="Valor registrado" valor="Sin valoración" />
        <Dato etiqueta="Cobrado" valor="Sin movimientos" />
        <Dato etiqueta="Resultado" valor="Sin valoración" />
      </View>}
      <Text style={e.nota}>Invertido incluye compras, comisiones y gastos. Cobrado incluye ventas y cobros. Se mantienen las monedas separadas y solo se usan tus datos manuales.</Text>
    </View> : null}

    {!f ? <Boton texto="Registrar inversión" onPress={() => iniciar('alta')} disabled={bloqueado} /> : null}
    {sincronizada && copiaLocal.length ? <View style={e.resumen}>
      <Text style={e.subtitulo}>Tu copia anterior se conserva</Text>
      <Text style={e.nota}>{posiciones.length
        ? 'Hay inversiones anteriores guardadas en este dispositivo. No se han combinado ni sustituido las de tu cuenta.'
        : 'Hay inversiones anteriores en este dispositivo. Puedes copiarlas a tu cuenta con tu confirmación.'}</Text>
      {!posiciones.length ? <Boton texto="Importar copia local a mi cuenta" secundario onPress={importarCopiaLocal} disabled={cargando || !cargaCorrecta || guardando} /> : null}
    </View> : null}
    {!cargando && !posiciones.length && !f ? <Text style={e.vacio}>Añade lo que compraste y lo que pagaste. El resultado aparecerá cuando registres una valoración.</Text> : null}

    {f ? <View style={e.formulario}>
      <Text style={e.subtitulo} accessibilityRole="header">{f.modo === 'alta' ? 'Registrar compra' : f.modo === 'valoracion' ? 'Actualizar precio' : 'Añadir movimiento'}</Text>
      {f.modo === 'alta' ? <>
        <Campo etiqueta="Nombre de la inversión" valor={f.nombre} onChangeText={nombre => setFormulario({ ...f, nombre })} />
        <Campo etiqueta="Proveedor (opcional)" valor={f.proveedor} onChangeText={proveedor => setFormulario({ ...f, proveedor })} />
        <Text style={e.etiqueta}>Moneda de tus operaciones</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={e.opciones} accessibilityRole="radiogroup" accessibilityLabel="Moneda de la inversión">
            {MONEDAS.map(moneda => <Pressable key={moneda} onPress={() => setFormulario({ ...f, moneda })}
              accessibilityRole="radio" accessibilityState={{ checked: f.moneda === moneda }} accessibilityLabel={moneda}
              disabled={bloqueado} style={[e.opcion, f.moneda === moneda && e.opcionActiva]}>
              <Text noTraducir style={e.opcionTexto}>{moneda}</Text></Pressable>)}
          </View>
        </ScrollView>
      </> : <Text noTraducir style={e.nota}>{f.nombre} · {f.moneda}</Text>}
      {f.modo === 'movimiento' ? <View style={e.opciones} accessibilityRole="radiogroup" accessibilityLabel="Tipo de movimiento">
        {TIPOS.map(([tipo, etiqueta]) => <Pressable key={tipo} onPress={() => setFormulario({ ...f, tipo })}
          accessibilityRole="radio" accessibilityState={{ checked: f.tipo === tipo }} accessibilityLabel={etiqueta}
          disabled={bloqueado} style={[e.opcion, f.tipo === tipo && e.opcionActiva]}><Text style={e.opcionTexto}>{etiqueta}</Text></Pressable>)}
      </View> : null}
      <Campo etiqueta={f.modo === 'valoracion' ? 'Fecha del precio (AAAA-MM-DD)' : 'Fecha del movimiento (AAAA-MM-DD)'}
        valor={f.fecha} onChangeText={fecha => setFormulario({ ...f, fecha })} maxLength={10} />
      {f.modo === 'valoracion' ? <Campo etiqueta="Precio actual por unidad" valor={f.precio}
        onChangeText={precio => setFormulario({ ...f, precio })} decimal /> : ['compra', 'venta'].includes(f.tipo) ? <>
        <Campo etiqueta="Cantidad de unidades" valor={f.cantidad} onChangeText={cantidad => setFormulario({ ...f, cantidad })} decimal />
        <Campo etiqueta={f.tipo === 'venta' ? 'Precio de venta por unidad' : 'Precio pagado por unidad'} valor={f.precio} onChangeText={precio => setFormulario({ ...f, precio })} decimal />
        <Campo etiqueta="Comisión (0 si no hubo)" valor={f.comision} onChangeText={comision => setFormulario({ ...f, comision })} decimal />
      </> : <Campo etiqueta={f.tipo === 'cobro' ? 'Importe cobrado' : 'Importe del gasto'} valor={f.importe}
        onChangeText={importe => setFormulario({ ...f, importe })} decimal />}
      <Text style={e.nota}>Introduce cantidades reales en la moneda elegida, con coma o punto y sin separadores de miles. No introduzcas la rentabilidad anunciada como si fuera un cobro.</Text>
      <Boton texto={guardando ? 'Guardando…' : f.modo === 'valoracion' ? 'Guardar precio' : 'Guardar movimiento'} onPress={guardar} disabled={bloqueado} />
      <Boton texto="Cancelar" secundario onPress={() => { setFormulario(null); setError(''); }} disabled={guardando} />
    </View> : null}

    {posiciones.map(posicion => {
      const r = resumirPosicion(posicion);
      const abierto = detalle === posicion.id;
      return <View key={posicion.id} style={e.tarjeta}>
        <Text noTraducir style={e.nombre} accessibilityRole="header">{r.nombre}</Text>
        {posicion.proveedor ? <Text noTraducir style={e.nota}>{posicion.proveedor}</Text> : null}
        <Text noTraducir style={e.unidades}>{r.cantidad} unidades · {r.moneda}</Text>
        <View style={e.rejilla}>
          <Dato etiqueta="Aportado" valor={importeVisible(r.aportadoCentimos, r.moneda)} />
          <Dato etiqueta="Valor actual" valor={importeVisible(r.valorActualCentimos, r.moneda)} destacado />
          <Dato etiqueta="Cobrado" valor={importeVisible(r.cobradoCentimos, r.moneda)} />
          <Dato etiqueta="Costes registrados" valor={importeVisible(r.costesCentimos, r.moneda)} />
          <Dato etiqueta="Resultado" valor={importeVisible(r.resultadoCentimos, r.moneda)} destacado />
          <Dato etiqueta="Resultado sin anualizar" valor={porcentajeVisible(r.rentabilidadPorcentaje)} />
        </View>
        <Text style={e.nota}>Precio medio de las compras, sin comisiones: <Text noTraducir>{r.precioMedioCompras == null ? 'Sin compras' : `${r.precioMedioCompras} ${r.moneda}`}</Text></Text>
        <Text style={e.nota}>El porcentaje compara el resultado acumulado con todas las compras y gastos registrados. No es una rentabilidad anual.</Text>
        {r.fechaValoracion ? <Text style={e.nota}>Precio introducido: <Text noTraducir>{r.precioActual} {r.moneda} · {fechaVisible(r.fechaValoracion)}</Text></Text> : null}
        {r.requiereValoracion ? <Text style={e.aviso}>Falta un precio con fecha posterior o igual a tu último movimiento registrado. No se supone un resultado de cero.</Text> : null}
        {r.valoracionAntigua ? <Text style={e.aviso}>La valoración está desactualizada. Actualiza el precio para revisar el resultado.</Text> : null}
        <View style={e.acciones}>
          <Boton texto={`Añadir movimiento · ${r.nombre}`} secundario onPress={() => iniciar('movimiento', posicion)} disabled={bloqueado || Boolean(f)} />
          {!r.cerrada ? <Boton texto={`Actualizar precio · ${r.nombre}`} secundario onPress={() => iniciar('valoracion', posicion)} disabled={bloqueado || Boolean(f)} /> : null}
        </View>
        <Pressable onPress={() => setDetalle(abierto ? '' : posicion.id)} accessibilityRole="button"
          accessibilityLabel={`Movimientos de ${r.nombre}`} accessibilityState={{ expanded: abierto }} style={e.desplegable}>
          <Text style={e.enlace}>Movimientos y fechas · {r.movimientos.length}</Text><Text style={e.enlace}>{abierto ? '−' : '+'}</Text>
        </Pressable>
        {abierto ? <View>
          {r.movimientos.map(m => <View key={m.id} style={e.movimiento}>
            <Text style={e.etiqueta}>{TIPOS.find(([tipo]) => tipo === m.tipo)?.[1] || m.tipo} · <Text noTraducir>{fechaVisible(m.fecha)}</Text></Text>
            <Text noTraducir style={e.nota}>{['compra', 'venta'].includes(m.tipo)
              ? `${m.cantidad} unidades × ${m.precio} ${r.moneda} · comisión ${m.comision} ${r.moneda}`
              : `${m.importe} ${r.moneda}`}</Text>
          </View>)}
          <Boton texto={`Eliminar inversión · ${r.nombre}`} secundario peligro onPress={() => eliminar(posicion)} disabled={bloqueado || Boolean(f)} />
        </View> : null}
      </View>;
    })}
    {posiciones.length ? <Text style={e.nota}>Cada moneda se mantiene separada. El resultado usa tus movimientos y tu último precio introducido; no es una rentabilidad anual ni una cotización automática.</Text> : null}
  </View>;
}

const e = StyleSheet.create({
  seccion: { marginBottom: 24 }, titulo: { ...T.seccion, color: C.tx, marginBottom: 8 },
  subtitulo: { ...T.ficha, color: C.tx, marginBottom: 8 }, nombre: { ...T.ficha, color: C.tx },
  nota: { ...T.menor, color: C.tx2, marginVertical: 5 }, vacio: { ...T.cuerpo, color: C.tx2, marginVertical: 12 },
  unidades: { ...T.cuerpoFte, color: C.senal, marginTop: 8 },
  tarjeta: { padding: 16, backgroundColor: C.sup, borderRadius: R.m, borderWidth: 1, borderColor: C.linea, marginTop: 14 },
  resumen: { padding: 16, backgroundColor: C.sup2, borderRadius: R.m, borderWidth: 1, borderColor: C.senal34, marginTop: 12 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 16, marginVertical: 18 },
  dato: { flexBasis: '45%', flexGrow: 1, minWidth: 100 }, etiqueta: { ...T.menor, color: C.tx2, marginBottom: 4 },
  valor: { ...T.cuerpoFte, fontFamily: F.semi, color: C.tx }, valorPrincipal: { fontSize: 20, lineHeight: 27 },
  formulario: { padding: 14, marginVertical: 12, borderRadius: R.m, backgroundColor: C.sup2 }, campo: { marginVertical: 7 },
  entrada: { ...T.cuerpo, minHeight: UI.boton, padding: 12, color: C.tx, borderWidth: 1, borderColor: C.linea2, borderRadius: R.s, backgroundColor: C.noche2 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 7 },
  opcion: { minHeight: UI.tactil, minWidth: UI.tactil, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: C.linea2, borderRadius: R.s },
  opcionActiva: { backgroundColor: C.senal10, borderColor: C.senal }, opcionTexto: { ...T.menor, color: C.tx },
  boton: { minHeight: UI.boton, justifyContent: 'center', alignItems: 'center', backgroundColor: C.senal, borderRadius: R.s, padding: 12, marginTop: 9 },
  botonTexto: { ...T.cuerpoFte, color: C.noche, textAlign: 'center' },
  secundario: { backgroundColor: C.sup2, borderWidth: 1, borderColor: C.linea2 }, textoSecundario: { color: C.tx },
  peligro: { borderColor: C.coral32 }, textoPeligro: { color: C.coral },
  acciones: { marginTop: 7 }, desplegable: { minHeight: UI.tactil, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, marginTop: 10 },
  enlace: { ...T.menor, color: C.senal }, movimiento: { borderTopWidth: 1, borderTopColor: C.linea, paddingVertical: 12 },
  aviso: { ...T.menor, color: '#F2B23C', marginVertical: 8 }, error: { ...T.menor, color: C.coral, marginVertical: 10 },
  mensaje: { ...T.menor, color: C.senal, marginVertical: 8 }, deshabilitado: { opacity: 0.5 }, pulsado: { opacity: 0.78 },
});
