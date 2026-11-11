import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Pressable, Text, TextInput, View, useIdioma } from './Idioma';
import * as M from '../lib/calculadora';
import { C, F, R, T, UI, pulsado } from '../lib/tema';
import { tacto } from '../lib/tacto';

/* ---------------------------------------------------------------------
   «Calcula tus números» en Inicio (11/11/2026), como en la web
   ---------------------------------------------------------------------
   El encargo: «hazle su propia sección en Inicio para que la gente calcule sus
   números, y que pongan ellos los números, no que sea sí o sí los
   300.000». Va entre «Mercado y noticias» y Aprende:
   - el resultado arriba y grande («Cobrarías unos X € al año (Y € al
     mes)» o «Al cabo de N años tendrías Z €») y, debajo, la ganancia neta;
   - los campos de escritura libre (teclado decimal) con lo que inviertes,
     la rentabilidad y los años, con un ejemplo editable de partida
     (1.000 €, 4 %, 5 años) e importes rápidos que solo rellenan el campo;
   - «Lo cobro» (interés simple) o «Lo reinvierto» (compuesto);
   - «Usa la rentabilidad de una oferta»: las del catálogo que ya tiene la
     app con rentabilidad publicada y vigente, con su fecha, si es en
     dólares y su ficha. Sin ninguna, no sale;
   - «Afinar: comisiones e impuestos» (plegado), con el valor del activo y
     el precio de cada participación: así se generaliza el local de
     300.000 € del explicador;
   - un minigráfico de barras por año (react-native-svg, como el de
     «Mercado») con su frase para el lector de pantalla, «Ver la cuenta
     paso a paso» (plegado) y la nota legal, siempre a la vista.
   Las cuentas y los textos con cifras salen de lib/calculadora.js, el mismo
   motor que la web (assets/calculadora-modelo-20261111.js es su copia).
   El teclado no tapa el resultado: al entrar en uno de los tres campos de
   arriba, Inicio sube hasta el resultado (onDesplazar); en los de «Afinar»,
   Inicio enseña arriba el resultado en pequeño (ResultadoFlotante).
   --------------------------------------------------------------------- */

const tx = (idioma, es, en) => (idioma === 'en' ? en : es);
const ARRIBA = ['inversion', 'rentabilidad', 'anios'];
const AFINAR = ['comisionAnual', 'comisionEntrada', 'impuestos', 'valorActivo', 'precioParticipacion'];
/* Teclado decimal; la rentabilidad puede ser negativa y el teclado decimal no
   tiene signo: en Android, el numérico con signo; en iOS, números y signos. */
const TECLADO = { anios: 'number-pad', rentabilidad: Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric' };
const CAMPO = {
  inversion: { etiqueta: 'Lo que inviertes', unidad: '€', a11y: 'Lo que inviertes, en euros' },
  rentabilidad: { etiqueta: 'Rentabilidad al año', unidad: '%', a11y: 'Rentabilidad al año, en porcentaje' },
  anios: { etiqueta: 'Años', unidad: 'años', a11y: 'Años' },
  comisionAnual: { etiqueta: 'Comisión anual', unidad: '%', ayuda: 'Sobre tu capital, cada año.', a11y: 'Comisión anual, en porcentaje' },
  comisionEntrada: { etiqueta: 'Comisión de entrada', unidad: '%', ayuda: 'Una vez, sobre lo que pones.', a11y: 'Comisión de entrada, en porcentaje' },
  impuestos: { etiqueta: 'Impuestos sobre la ganancia', unidad: '%', ayuda: M.IMPUESTOS_NOTA.es, a11y: 'Impuestos sobre la ganancia, en porcentaje' },
  valorActivo: { etiqueta: 'Valor del activo entero', unidad: '€', opcional: true, ayuda: 'Para saber qué parte del activo es tuya.',
    a11y: 'Valor del activo entero, en euros, opcional', ejemplo: 300000 },
  precioParticipacion: { etiqueta: 'Precio de cada participación', unidad: '€', opcional: true, ayuda: 'Para saber cuántas compras y cuánto te sobra.',
    a11y: 'Precio de cada participación, en euros, opcional', ejemplo: 100 },
};

/* Los valores de partida, escritos en el idioma de la app («1.000» o «1,000»). */
export function textosIniciales(idioma = 'es') {
  const salida = {};
  for (const campo of M.CAMPOS) {
    const v = M.PREDETERMINADOS[campo];
    salida[campo] = v == null ? '' : M.valorCampo(v, idioma, campo);
  }
  return salida;
}

function Campo({ campo, idioma, valor, error, onCambiar, onFoco, onSalir, ancho, onLayout }) {
  const d = CAMPO[campo];
  const [enfocado, setEnfocado] = useState(false);
  const mensaje = error ? M.mensajeError(error, idioma) : '';
  const ejemplo = d.ejemplo != null ? M.valorCampo(d.ejemplo, idioma, campo) : undefined;
  return (
    <View style={[e.campo, ancho === 'mitad' && e.campoMitad]} onLayout={onLayout}>
      <Text style={e.etq}>
        {d.etiqueta}
        {d.opcional ? <Text style={e.opcional}>{' '}{'(opcional)'}</Text> : null}
      </Text>
      <View style={[e.entrada, enfocado && e.entradaFoco, error && e.entradaError]}>
        <TextInput
          testID={`calc-${campo}`}
          value={valor}
          onChangeText={(texto) => onCambiar(campo, texto)}
          onFocus={() => { setEnfocado(true); onFoco(campo); }}
          onBlur={() => { setEnfocado(false); onSalir(campo); }}
          keyboardType={TECLADO[campo] || 'decimal-pad'}
          returnKeyType="done"
          selectTextOnFocus
          autoCorrect={false}
          autoComplete="off"
          importantForAutofill="no"
          maxLength={18}
          placeholder={ejemplo}
          placeholderTextColor={C.tx3}
          accessibilityLabel={d.a11y}
          accessibilityHint={mensaje || d.ayuda}
          style={e.input}
        />
        <Text noTraducir={d.unidad !== 'años'} style={e.unidad} accessibilityElementsHidden importantForAccessibility="no">{d.unidad}</Text>
      </View>
      {mensaje ? (
        <View style={e.error} accessibilityLiveRegion="polite">
          <View style={e.errorMarca}><Text noTraducir style={e.errorMarcaTxt}>!</Text></View>
          <Text noTraducir style={e.errorTxt}>{mensaje}</Text>
        </View>
      ) : d.ayuda ? <Text style={e.ayuda}>{d.ayuda}</Text> : null}
    </View>
  );
}

/* El minigráfico: una barra por año, lo que pones abajo (gris) y lo ganado
   arriba (verde), la línea de puntos de lo que pones y la cifra del último año. */
function Barras({ res, idioma }) {
  const [ancho, setAncho] = useState(0);
  const g = ancho > 0 ? M.barras(res, { ancho, alto: 150, margenArriba: 22, margenAbajo: 24 }) : null;
  const ultima = g ? g.barras[g.barras.length - 1] : null;
  return (
    <View style={e.graf} accessible accessibilityRole="image" noTraducir accessibilityLabel={M.descripcionBarras(res, idioma)}>
      <Text style={e.grafTit}>Lo que tendrías cada año</Text>
      <View style={e.lienzo} onLayout={(ev) => setAncho(Math.round(ev.nativeEvent.layout.width))}>
        {g ? (
          <Svg width={ancho} height={g.alto}>
            <Line x1={0} x2={ancho} y1={g.suelo + 0.5} y2={g.suelo + 0.5} stroke={C.bd} strokeWidth={1} />
            {g.barras.map((b) => (
              <React.Fragment key={b.anio}>
                {b.altoPuesto > 0 ? <Rect x={b.x} y={b.yPuesto} width={b.ancho} height={b.altoPuesto} rx={Math.min(3, b.ancho / 3)} fill="rgba(255,255,255,0.16)" /> : null}
                {b.altoGanancia > 0.5 ? <Rect x={b.x} y={b.yGanancia} width={b.ancho} height={b.altoGanancia} rx={Math.min(3, b.ancho / 3)} fill={C.senal} /> : null}
              </React.Fragment>
            ))}
            <Line x1={0} x2={ancho} y1={g.yBase} y2={g.yBase} stroke={C.tx2} strokeWidth={1} strokeDasharray="3 4" />
            <SvgText x={Math.min(ancho, ultima.x + ultima.ancho)} y={Math.max(12, ultima.y - 6)} textAnchor="end" fill={C.tx}
              fontSize={12} fontFamily={F.mono} fontWeight="600">{M.eurosAprox(ultima.valor, idioma)}</SvgText>
            {g.etiquetas.map((n) => {
              const b = g.barras[n - 1], muchas = g.barras.length > 6;
              const x = muchas && n === 1 ? b.x : muchas && n === g.barras.length ? b.x + b.ancho : b.x + b.ancho / 2;
              const ancla = muchas && n === 1 ? 'start' : muchas && n === g.barras.length ? 'end' : 'middle';
              return <SvgText key={n} x={x} y={g.alto - 6} textAnchor={ancla} fill={C.tx2} fontSize={11} fontFamily={F.mono}>{`${tx(idioma, 'Año', 'Year')} ${n}`}</SvgText>;
            })}
          </Svg>
        ) : null}
      </View>
      <View style={e.leyenda}>
        <View style={e.leyendaFila}><View style={[e.muestra, e.muestraPuesto]} /><Text style={e.leyendaTxt}>Lo que pones</Text></View>
        <View style={e.leyendaFila}><View style={[e.muestra, e.muestraGanado]} /><Text style={e.leyendaTxt}>Lo ganado, neto</Text></View>
      </View>
    </View>
  );
}

/* El resultado en pequeño, arriba de Inicio, mientras se escribe en «Afinar»
   (que el teclado no lo tape). Repite lo que ya dice el resultado, que es el
   que anuncia el lector de pantalla: este no se lee. */
export function ResultadoFlotante({ estado }) {
  if (!estado) return null;
  return (
    <View style={e.flotante} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="calc-flotante">
      <Text noTraducir style={[e.flotanteTxt, estado.signo === 'error' && e.titularError]} numberOfLines={2}>{estado.titular}</Text>
      {estado.detalle ? <Text noTraducir style={[e.flotanteDet, estado.signo === 'pierde' && e.detallePierde]} numberOfLines={1}>{estado.detalle}</Text> : null}
    </View>
  );
}

export default function CalculadoraInicio({ ofertas = [], catalogoVigente = true, ahora, onAbrirOferta, onDesplazar, onFlotante }) {
  const idioma = useIdioma();
  const [textos, setTextos] = useState(() => textosIniciales(idioma));
  const [modo, setModo] = useState(M.PREDETERMINADOS.modo);
  const [tocado, setTocado] = useState(false);
  const [afinar, setAfinar] = useState(false);
  const [cuenta, setCuenta] = useState(false);
  const [elegida, setElegida] = useState(null);
  const [anuncio, setAnuncio] = useState('');
  const idiomaCampos = useRef(idioma);
  const posiciones = useRef({});

  // Al cambiar de idioma, cada cifra válida se reescribe con su formato («1.000» ↔ «1,000»).
  useEffect(() => {
    if (idiomaCampos.current === idioma) return;
    const antes = idiomaCampos.current;
    idiomaCampos.current = idioma;
    setTextos((t) => {
      const nuevos = { ...t };
      for (const campo of M.CAMPOS) {
        const l = M.LIMITES[campo];
        // Se lee con las reglas del idioma de antes: «1,000» en inglés son mil.
        const texto = antes === 'en' ? t[campo].replace(/,/g, '') : t[campo];
        const leido = M.leerNumero(texto, { miles: l.unidad === 'euros' });
        if (t[campo].trim() && leido.ok) nuevos[campo] = M.valorCampo(leido.valor, idioma, campo);
      }
      return nuevos;
    });
  }, [idioma]);

  const valido = useMemo(() => M.validarEntradas({ ...textos, modo }), [textos, modo]);
  const res = useMemo(() => (valido.ok ? M.calcular(valido) : null), [valido]);
  const r = M.resumen(res, idioma);
  const lista = useMemo(() => M.ofertasConRentabilidad(ofertas, { ahora: ahora ? ahora() : new Date(), catalogoVigente }),
    [ofertas, catalogoVigente, ahora]);
  // La oferta elegida sigue marcada solo mientras su rentabilidad siga escrita.
  const deVerdad = elegida && valido.valores.rentabilidad != null && lista.find((o) => o.slug === elegida && Math.abs(o.rentabilidad - valido.valores.rentabilidad) < 1e-9);

  // El lector de pantalla oye el resultado cuando se deja de escribir, no a cada tecla.
  const frase = [r.titular, r.detalle].filter(Boolean).join('. ');
  useEffect(() => {
    const reloj = setTimeout(() => {
      setAnuncio(frase);
      if (Platform.OS === 'ios') AccessibilityInfo?.announceForAccessibility?.(frase);
    }, anuncio ? 700 : 0);
    return () => clearTimeout(reloj);
  }, [frase]); // eslint-disable-line react-hooks/exhaustive-deps

  const marcarTocado = () => { if (!tocado) setTocado(true); };
  const cambiar = (campo, texto) => { marcarTocado(); setTextos((t) => ({ ...t, [campo]: texto })); };
  const foco = (campo) => {
    if (ARRIBA.includes(campo)) { onFlotante?.(null); onDesplazar?.(Math.max(0, (posiciones.current.resultado ?? 0) - 8)); }
    else onFlotante?.({ campo, ...flotante.current });
  };
  // Al salir del campo, la cifra con su formato («1000» → «1.000»), sin cambiar su valor.
  const salir = (campo) => {
    onFlotante?.(null);
    setTextos((t) => {
      const l = M.LIMITES[campo], leido = M.leerNumero(t[campo], { miles: l.unidad === 'euros' });
      if (!t[campo].trim() || !leido.ok || leido.valor < l.min || leido.valor > l.max) return t;
      return { ...t, [campo]: M.valorCampo(leido.valor, idioma, campo) };
    });
  };
  // Mientras se escribe en «Afinar», el resultado en pequeño va arriba (lo pinta Inicio).
  const flotante = useRef(null);
  flotante.current = { titular: r.titular, detalle: r.detalle, signo: r.signo };
  useEffect(() => { onFlotante?.((x) => (x ? { ...x, ...flotante.current } : x)); }, [r.titular, r.detalle, r.signo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un error dentro de «Afinar» lo deja abierto: que no quede escondido.
  const abierto = afinar || AFINAR.some((c) => valido.errores[c]);

  const campo = (c, ancho) => (
    <Campo key={c} campo={c} idioma={idioma} valor={textos[c]} error={valido.errores[c]} ancho={ancho}
      onCambiar={cambiar} onFoco={foco} onSalir={salir} />
  );
  const pasos = res ? M.pasos(res, idioma) : [];

  return (
    <View testID="calculadora-inicio">
      <Text style={e.titulo} accessibilityRole="header">Calcula tus números</Text>
      <Text style={e.sub}>Pon lo que quieres invertir, la rentabilidad y los años: verás lo que cobrarías o lo que tendrías.</Text>

      {/* El resultado, arriba y grande. El lector lo anuncia al dejar de escribir. */}
      <View style={e.resultado} onLayout={(ev) => { posiciones.current.resultado = ev.nativeEvent.layout.y; }}
        accessible accessibilityLiveRegion="polite" noTraducir accessibilityLabel={anuncio || frase} testID="calc-resultado">
        <Text noTraducir style={[e.titular, r.signo === 'error' && e.titularError]}>{r.titular}</Text>
        {r.detalle ? <Text noTraducir style={[e.detalle, r.signo === 'gana' && e.detalleGana, r.signo === 'pierde' && e.detallePierde]}>{r.detalle}</Text> : null}
      </View>

      <View style={e.datos}>
        <View style={e.datosCab}>
          <Text style={e.datosTit}>Tus números</Text>
          {tocado ? null : <Text style={e.ejemplo}>Ejemplo: cámbialo</Text>}
        </View>
        {campo('inversion')}
        <View style={e.rapidos} accessibilityRole="toolbar" accessibilityLabel="Importes rápidos">
          {M.IMPORTES_RAPIDOS.map((v) => (
            <Pressable key={v} onPress={() => { tacto.eleccion(); cambiar('inversion', M.valorCampo(v, idioma, 'inversion')); }}
              style={({ pressed }) => [e.rapido, pressed && pulsado('chip')]} accessibilityRole="button" noTraducir
              accessibilityLabel={tx(idioma, `Poner ${M.euros(v, idioma)}`, `Enter ${M.euros(v, idioma)}`)} testID={`calc-rapido-${v}`}>
              <Text noTraducir style={e.rapidoTxt}>{M.euros(v, idioma)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={e.fila}>
          {campo('rentabilidad', 'mitad')}
          {campo('anios', 'mitad')}
        </View>

        <View style={e.modo} accessibilityRole="radiogroup" accessibilityLabel="Lo que ganas cada año">
          <Text style={e.etq}>Lo que ganas cada año</Text>
          <View style={e.segmento}>
            {[['cobrar', 'Lo cobro'], ['reinvertir', 'Lo reinvierto']].map(([valor, texto]) => (
              <Pressable key={valor} onPress={() => { tacto.eleccion(); marcarTocado(); setModo(valor); }}
                style={({ pressed }) => [e.opcion, modo === valor && e.opcionOn, pressed && modo !== valor && e.opcionPulsada]}
                accessibilityRole="radio" accessibilityState={{ checked: modo === valor }} accessibilityLabel={texto} testID={`calc-modo-${valor}`}>
                <Text style={[e.opcionTxt, modo === valor && e.opcionTxtOn]}>
                  {modo === valor ? <Text noTraducir style={e.opcionMarca}>{'✓ '}</Text> : null}{texto}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {lista.length ? (
          <View style={e.ofertas} testID="calc-ofertas">
            <Text style={e.etq}>Usa la rentabilidad de una oferta</Text>
            {lista.map((of) => {
              const on = deVerdad && deVerdad.slug === of.slug;
              const original = ofertas.find((o) => o?.slug === of.slug);
              return (
                <View key={of.slug} style={e.oferta}>
                  <Pressable onPress={() => {
                    tacto.eleccion(); marcarTocado(); setElegida(of.slug);
                    setTextos((t) => ({ ...t, rentabilidad: M.valorCampo(of.rentabilidad, idioma, 'rentabilidad') }));
                  }} style={({ pressed }) => [e.chip, on && e.chipOn, pressed && !on && e.chipPulsado]}
                    accessibilityRole="button" accessibilityState={{ selected: !!on }} noTraducir accessibilityLabel={M.etiquetaOferta(of, idioma)}
                    testID={`calc-oferta-${of.slug}`}>
                    <Text noTraducir idiomaOriginal="es-ES" style={e.chipNom} numberOfLines={2}>{on ? <Text noTraducir style={e.opcionMarca}>{'✓ '}</Text> : null}{of.nombre}</Text>
                    <View style={e.chipFila}>
                      <Text noTraducir style={e.chipPct}>{M.porcentaje(of.rentabilidad, idioma, 2)}</Text>
                      <Text noTraducir style={e.chipFecha}>{M.fechaCorta(of.fecha, idioma)}</Text>
                      {of.enDolares ? <Text style={e.chipUsd}>en dólares</Text> : null}
                    </View>
                  </Pressable>
                  {original && onAbrirOferta ? (
                    <Pressable onPress={() => { tacto.abrir(); onAbrirOferta(original); }} style={({ pressed }) => [e.ficha, pressed && pulsado('b3')]}
                      accessibilityRole="link" noTraducir accessibilityLabel={tx(idioma, `Ficha de ${of.nombre}`, `Page for ${of.nombre}`)} testID={`calc-ficha-${of.slug}`}>
                      <Text style={e.fichaTxt}>Ficha</Text><Text noTraducir style={e.fichaTxt}>{' →'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            <Text noTraducir={!!deVerdad} style={e.nota}>
              {deVerdad ? M.notaOferta(deVerdad, idioma) : 'La cifra que publica cada oferta, con su fecha. Rellena la rentabilidad; puedes cambiarla.'}
            </Text>
          </View>
        ) : null}

        {/* «Afinar»: plegado, con lo que lleva dentro dicho en una línea. */}
        <View style={e.afinar}>
          <Pressable onPress={() => { tacto.eleccion(); setAfinar((x) => !x); }} style={({ pressed }) => [e.plegable, pressed && e.plegablePulsado]}
            accessibilityRole="button" accessibilityState={{ expanded: abierto }} noTraducir
            accessibilityLabel={`${tx(idioma, 'Afinar: comisiones e impuestos', 'Fine-tune: fees and tax')}. ${valido.ok ? M.resumenAfinar(valido.valores, idioma) : ''}`}
            testID="calc-afinar">
            <View style={e.plegableTexto}>
              <Text style={e.plegableTit}>Afinar: comisiones e impuestos</Text>
              {valido.ok ? <Text noTraducir style={e.plegableSub}>{M.resumenAfinar(valido.valores, idioma)}</Text> : null}
            </View>
            <Text noTraducir style={e.plegableSigno}>{abierto ? '−' : '+'}</Text>
          </Pressable>
          {abierto ? (
            <View style={e.afinarCuerpo}>
              <View style={e.fila}>{campo('comisionAnual', 'mitad')}{campo('comisionEntrada', 'mitad')}</View>
              {campo('impuestos')}
              {campo('valorActivo')}
              {campo('precioParticipacion')}
            </View>
          ) : null}
        </View>
      </View>

      {res ? <Barras res={res} idioma={idioma} /> : null}

      {res ? (
        <View style={e.cuenta}>
          <Pressable onPress={() => { tacto.eleccion(); setCuenta((x) => !x); }} style={({ pressed }) => [e.plegable, e.cuentaCab, pressed && e.plegablePulsado]}
            accessibilityRole="button" accessibilityState={{ expanded: cuenta }} accessibilityLabel="Ver la cuenta paso a paso" testID="calc-cuenta">
            <Text style={e.cuentaTit}>Ver la cuenta paso a paso</Text>
            <Text noTraducir style={e.plegableSigno}>{cuenta ? '−' : '+'}</Text>
          </Pressable>
          {cuenta ? (
            <View style={e.cuentaCuerpo}>
              <Text style={e.cuentaSub}>No hay nada escondido: es la misma cuenta que harías con un papel.</Text>
              {pasos.map((p, i) => (
                <View key={i} style={e.paso} accessible noTraducir accessibilityLabel={`${i + 1}. ${p.op}: ${p.res}`}>
                  <Text noTraducir style={e.pasoOp}><Text noTraducir style={e.pasoN}>{`${i + 1}. `}</Text>{p.op}</Text>
                  <Text noTraducir style={[e.pasoRes, i >= pasos.length - 2 && e.pasoResFin]}>{p.res}</Text>
                </View>
              ))}
              <Text noTraducir style={e.cuentaNota}>{`${M.notaImpuestos(res.modo, idioma)} ${M.IMPUESTOS_NOTA[idioma] || M.IMPUESTOS_NOTA.es}`}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={e.legal}>Simulación con tus números: no es una previsión ni una oferta. La rentabilidad pasada no garantiza la futura y puedes perder dinero.</Text>
    </View>
  );
}

const e = StyleSheet.create({
  titulo: { fontFamily: F.negrita, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.tx },
  sub: { ...T.menor, fontSize: 16, lineHeight: 23, color: C.tx2, marginTop: 4 },

  resultado: { marginTop: 16, padding: 18, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, gap: 6 },
  titular: { fontFamily: F.negrita, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: C.tx, fontVariant: ['tabular-nums'] },
  titularError: { fontSize: 17, lineHeight: 23, color: C.aviso },
  detalle: { ...T.cuerpo, color: C.tx2, fontVariant: ['tabular-nums'] },
  detalleGana: { color: C.senalCl },
  detallePierde: { color: C.alarma },

  datos: { marginTop: 12, padding: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1, gap: 16 },
  datosCab: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  datosTit: { fontFamily: F.semi, fontSize: 17, lineHeight: 22, color: C.tx },
  ejemplo: { fontFamily: F.semi, fontSize: 13, lineHeight: 17, color: C.aviso, backgroundColor: C.avisoT, borderRadius: R.p, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  fila: { flexDirection: 'row', gap: 12 },
  campo: { gap: 6 },
  campoMitad: { flex: 1, minWidth: 0 },
  etq: { fontFamily: F.media, fontSize: 15, lineHeight: 20, color: C.tx2 },
  opcional: { fontFamily: F.regular, color: C.tx3 },
  entrada: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: R.m, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: C.s0, paddingLeft: 14, paddingRight: 12 },
  entradaFoco: { borderColor: C.senal, borderWidth: 2, paddingLeft: 13, paddingRight: 11 },
  entradaError: { borderColor: C.alarma },
  input: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: 0, fontFamily: F.semi, fontSize: 20, color: C.tx, fontVariant: ['tabular-nums'] },
  unidad: { fontFamily: F.media, fontSize: 16, lineHeight: 20, color: C.tx2, marginLeft: 8 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  errorMarca: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.alarma, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  errorMarcaTxt: { fontFamily: F.negrita, fontSize: 12, lineHeight: 14, color: C.s0 },
  errorTxt: { flex: 1, fontFamily: F.media, fontSize: 14, lineHeight: 20, color: C.alarma },
  ayuda: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3 },

  rapidos: { flexDirection: 'row', gap: 6, marginTop: -6 },
  rapido: { flex: 1, minHeight: 44, borderRadius: R.p, backgroundColor: C.ton, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  rapidoTxt: { fontFamily: F.semi, fontSize: 13, lineHeight: 17, color: C.tx, fontVariant: ['tabular-nums'] },

  modo: { gap: 8 },
  segmento: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: R.m, backgroundColor: C.s0, borderWidth: 1, borderColor: C.bd },
  opcion: { flex: 1, minHeight: 44, borderRadius: R.m - 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  opcionOn: { backgroundColor: C.s3, borderWidth: 1, borderColor: C.ton2 },
  opcionPulsada: { backgroundColor: C.ton },
  opcionTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx2, textAlign: 'center' },
  opcionTxtOn: { color: C.tx },
  opcionMarca: { color: C.senal },

  ofertas: { gap: 8 },
  oferta: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  chip: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 12, paddingVertical: 9, borderRadius: R.m, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 3 },
  chipOn: { borderColor: C.senal, backgroundColor: C.senalT },
  chipPulsado: { backgroundColor: C.ton },
  chipNom: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  chipFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  chipPct: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.senal, fontVariant: ['tabular-nums'] },
  chipFecha: { ...T.dato, color: C.tx3 },
  chipUsd: { fontFamily: F.semi, fontSize: 12, lineHeight: 16, color: C.aviso, backgroundColor: C.avisoT, borderRadius: R.p, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  ficha: { minWidth: 64, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: R.m },
  fichaTxt: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  nota: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3 },

  afinar: { borderTopWidth: 1, borderTopColor: C.bd, paddingTop: 4 },
  plegable: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: UI.tactil, paddingVertical: 6, borderRadius: R.s },
  plegablePulsado: { backgroundColor: C.ton },
  plegableTexto: { flex: 1, gap: 2 },
  plegableTit: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.tx },
  plegableSub: { ...T.dato, fontFamily: F.regular, color: C.tx3 },
  plegableSigno: { fontFamily: F.media, fontSize: 22, lineHeight: 24, color: C.tx2, width: 20, textAlign: 'center' },
  afinarCuerpo: { gap: 14, paddingTop: 8, paddingBottom: 4 },

  graf: { marginTop: 12, padding: 16, paddingBottom: 12, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  grafTit: { fontFamily: F.media, fontSize: 14, lineHeight: 19, color: C.tx2, marginBottom: 8 },
  lienzo: { width: '100%', minHeight: 150 },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 },
  leyendaFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaTxt: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.tx2 },
  muestra: { width: 12, height: 12, borderRadius: 3 },
  muestraPuesto: { backgroundColor: 'rgba(255,255,255,0.16)', borderBottomWidth: 2, borderBottomColor: C.tx2 },
  muestraGanado: { backgroundColor: C.senal },

  cuenta: { marginTop: 12, paddingHorizontal: 16, borderRadius: R.l, borderWidth: 1, borderColor: C.bd, backgroundColor: C.s1 },
  cuentaCab: { minHeight: 52 },
  cuentaTit: { flex: 1, fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: C.senal },
  cuentaCuerpo: { paddingBottom: 14 },
  cuentaSub: { ...T.menor, color: C.tx2, marginBottom: 6 },
  paso: { flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.bd },
  pasoOp: { flex: 1, ...T.menor, fontSize: 15, lineHeight: 21, color: C.tx2 },
  pasoN: { fontFamily: F.mono, fontSize: 13, color: C.tx3 },
  pasoRes: { fontFamily: F.semi, fontSize: 15, lineHeight: 21, color: C.tx, textAlign: 'right', fontVariant: ['tabular-nums'] },
  pasoResFin: { color: C.senal },
  cuentaNota: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, borderTopWidth: 1, borderTopColor: C.bd, paddingTop: 10, marginTop: 2 },

  legal: { ...T.menor, fontSize: 13, lineHeight: 19, color: C.tx3, marginTop: 14 },

  flotante: { position: 'absolute', pointerEvents: 'none', top: 8, left: UI.margen, right: UI.margen, paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.m,
    backgroundColor: C.s2, borderWidth: 1, borderColor: C.bd, gap: 2,
    ...Platform.select({ android: { elevation: 6 }, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, shadowOpacity: 0.6 }, default: {} }) },
  flotanteTxt: { fontFamily: F.semi, fontSize: 16, lineHeight: 21, color: C.tx, fontVariant: ['tabular-nums'] },
  flotanteDet: { ...T.menor, fontSize: 13, lineHeight: 18, color: C.senalCl, fontVariant: ['tabular-nums'] },
});
