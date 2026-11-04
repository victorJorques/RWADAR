import * as Nativo from 'react-native';

const { Platform } = Nativo;

/* ---------------------------------------------------------------------
   Los mismos colores que la web, para que la app y el sitio se
   reconozcan como la misma marca.
   ---------------------------------------------------------------------
   La app nació antes del rediseño de agosto de 2026 y se quedó con la
   piel vieja: crema, azul marino y un verde menta. La web abandonó eso
   por un motivo que vale igual aquí — el conjunto se leía como papel, y
   lo que la marca dice ser es un instrumento que detecta.

   Tres reglas, copiadas de `index.html`, sección 1 · TOKENS:

   1 · LA SEÑAL ES EL ÚNICO COLOR DE LA INTERFAZ. Va en el logotipo, los
       rótulos, la acción principal y el foco. En ningún otro sitio.
   2 · EL RESTO DEL COLOR LO PONEN LOS DATOS: las seis categorías de
       activo, la propia señal para «verificado» —es la promesa de la
       marca, no un color aparte— y el coral para «descartada».
   3 · LOS GRISES SON CÁLIDOS, no neutros ni azulados. Es lo que más se
       nota al leer: un secundario gris neutro sobre negro se lee apagado
       y cansa; el mismo valor tirando a tierra se lee cómodo.
   --------------------------------------------------------------------- */
export const C = {
  /* Superficies (GUIA-ACABADOS §3 y §13): el fondo y tres alturas. En negro,
     la altura la da la luz, no la sombra. */
  s0: '#0B0A0A',   // fondo, cabecera y barra inferior
  s1: '#171614',   // tarjetas, filas agrupadas
  s2: '#1E1D1B',   // hojas y menús encima de s1
  s3: '#2A2927',   // opción elegida de un segmentado
  ton: 'rgba(255,255,255,0.06)',   // relleno de controles: botón tonal, campo, chip
  ton2: 'rgba(255,255,255,0.10)',  // el mismo, pulsado o elegido
  /* Un solo borde: fino y de un solo color tenue. */
  bd: 'rgba(255,255,255,0.08)',

  /* Nombres de antes, que ahora apuntan a los nuevos: todo lo que ya los usa
     cambia a la vez. */
  noche: '#0B0A0A',
  noche2: '#0B0A0A',
  sup: '#171614',
  sup2: '#1E1D1B',
  sup3: '#2A2927',
  linea: 'rgba(255,255,255,0.08)',
  linea2: 'rgba(255,255,255,0.08)',

  /* Texto en grises cálidos. El terciario sube a #958E83 para pasar AA
     sobre s2. */
  tx: '#F7F5F0',
  tx2: '#BBB5AB',
  tx3: '#958E83',

  /* La señal: el verde de un eco de radar. Solo para la acción principal,
     los botones y enlaces de texto, la ✓, el estado «ok», la pestaña activa,
     el foco, el logotipo y el radar. */
  senal: '#25E39A',
  senalP: '#1FC98A',      // verde pulsado
  enSenal: '#06140E',     // la única tinta sobre verde
  senalT: 'rgba(37,227,154,0.12)',   // fondo de estado «ok»
  senalCl: '#6BF0C0',
  senalOs: '#0B5F42',
  senal10: 'rgba(37,227,154,0.12)',
  senal20: 'rgba(37,227,154,0.20)',
  /* Nunca un borde verde (GUIA-ACABADOS §3): el antiguo borde verde pasa a
     ser la línea tenue de siempre. */
  senal34: 'rgba(255,255,255,0.08)',

  /* Estados. */
  aviso: '#FFB454',
  avisoT: 'rgba(255,180,84,0.12)',
  alarma: '#FF8A80',
  alarmaT: 'rgba(255,59,48,0.14)',

  /* «Descartada». Es rojo puro y no naranja a propósito: contra el
     naranja de «materias primas» la distancia en Lab era de 22,9 —una
     categoría confundible con una advertencia—, y así sube a 34,5. */
  coral: '#FF3B30',
  coral10: 'rgba(255,59,48,0.14)',
  coral32: 'rgba(255,255,255,0.08)',

  /* Los cuatro dueños del explicador, iguales que en el 3D de la web. */
  duenos: ['#25E39A', '#5B8CFF', '#F2B23C', '#B583FF'],
};

/* Las seis categorías de activo. Las distancias entre estos colores
   están medidas en Lab, no juzgadas a ojo: con ocho colores simultáneos
   sobre negro el espacio ya está lleno y cambiarlos «a mejor» suele
   empeorar alguna pareja. No tocar sin volver a medir. */
export const COLOR_CATEGORIA = {
  'Inmobiliario': '#F2B23C',
  'Crédito privado': '#5B8CFF',
  'Tesoro y fondos': '#32C9F5',
  'Acciones y capital privado': '#B583FF',
  'Materias primas': '#FF8A5B',
  'Infraestructura': '#9AA6BF',
};

/* ---------------------------------------------------------------------
   Tipografía
   ---------------------------------------------------------------------
   Geist, la misma que la web, cargada desde el paquete oficial de Expo.
   Mientras no termine de cargar se usa la del sistema, que en iOS es San
   Francisco: la app nunca se ve sin texto.

   El interletraje es óptico, como en la web: cuanto mayor el cuerpo, más
   se aprieta. Es lo que más distingue una pantalla cuidada de una hecha
   con los valores por defecto.
   --------------------------------------------------------------------- */
export const F = {
  regular: 'Geist_400Regular',
  cursiva: 'Geist_400Regular_Italic',
  media: 'Geist_500Medium',
  semi: 'Geist_600SemiBold',
  negrita: 'Geist_700Bold',
  extra: 'Geist_800ExtraBold',
  mono: 'GeistMono_500Medium',
};

export const T = {
  titular:   { fontFamily: F.negrita, fontSize: 28, letterSpacing: -0.56, lineHeight: 33 },
  seccion:   { fontFamily: F.negrita, fontSize: 20, letterSpacing: -0.2, lineHeight: 25 },
  ficha:     { fontFamily: F.negrita, fontSize: 20, letterSpacing: -0.2, lineHeight: 26 },
  cuerpo:    { fontFamily: F.regular, fontSize: 16, letterSpacing: 0, lineHeight: 24 },
  cuerpoFte: { fontFamily: F.media,   fontSize: 16, letterSpacing: 0, lineHeight: 24 },
  menor:     { fontFamily: F.regular, fontSize: 14, letterSpacing: 0, lineHeight: 21 },
  /* Fechas y cifras en Geist con números tabulares; la mono queda solo para
     las cifras del radar (GUIA-ACABADOS §3). */
  dato:      { fontFamily: F.media,   fontSize: 13, letterSpacing: 0, lineHeight: 18, fontVariant: ['tabular-nums'] },
  /* Rótulo en frase normal, 12 px y gris: sin mono ni mayúsculas (§5). */
  etiqueta:  { fontFamily: F.semi,    fontSize: 12, letterSpacing: 0, lineHeight: 17 },
  /* La cifra del radar, el instrumento: la única mono de la app. */
  instrumento: { fontFamily: F.mono, letterSpacing: 0, fontVariant: ['tabular-nums'] },
};

/* Escala de letra: 7 tamaños (11 solo en la barra inferior). */
export const FS = { 1: 11, 2: 12, 3: 13, 4: 15, 5: 16, 6: 20, 7: 28 };

/* ---------------------------------------------------------------------
   Elevación
   ---------------------------------------------------------------------
   Sobre fondo oscuro una sombra negra no se ve: lo que separa una ficha
   del fondo es que la ficha sea MÁS CLARA que él, no que proyecte. Por
   eso aquí la jerarquía la llevan las superficies (sup → sup-2 → sup-3)
   y la sombra solo añade profundidad en iOS, donde se nota.
   --------------------------------------------------------------------- */
const sombraIOS = (y, radio, opacidad) => ({
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: y },
  shadowRadius: radio,
  shadowOpacity: opacidad,
});

/* Dos elevaciones (GUIA-ACABADOS §13). e1 es una superficie más clara, sin
   sombra; e2 es la sombra de iOS o elevation 4 en Android, solo para hojas
   y menús. e3 se queda como alias de e2. */
export const E = {
  e1: {},
  e2: Platform.select({ ios: sombraIOS(24, 24, 0.8), android: { elevation: 4 }, default: {} }),
};
E.e3 = E.e2;

/* Radios: 8 · 12 · 16 · 24 (solo hojas y diálogos) · píldora
   (GUIA-ACABADOS §3). Radio anidado = radio exterior − relleno. */
export const R = { s: 8, m: 12, l: 16, xl: 24, p: 999 };

/* Un solo borde, en todas partes. */
export const BORDE = { borderWidth: 1, borderColor: C.bd };

/* Movimiento: 120 ms al pulsar, 160 para color y 200 para lo que aparece,
   siempre ease-out. `reducir` sigue a «reducir movimiento» del sistema: con
   él activo, los pulsados cambian de color pero no encogen. */
export const MOV = { pulsar: 120, color: 160, aparecer: 200, reducir: false };
try {
  const accesibilidad = Nativo.AccessibilityInfo;
  accesibilidad?.isReduceMotionEnabled?.()?.then?.((v) => { MOV.reducir = Boolean(v); })?.catch?.(() => {});
  accesibilidad?.addEventListener?.('reduceMotionChanged', (v) => { MOV.reducir = Boolean(v); });
} catch { /* sin accesibilidad (pruebas): se queda en false */ }

/* Tres botones (GUIA-ACABADOS §4): b1 relleno verde, una sola acción por
   pantalla; b2 tonal, las demás; b3 de texto verde. Los controles no llevan
   borde: se distinguen por su relleno. */
export const BOTON = {
  b1: { minHeight: 48, borderRadius: R.m, backgroundColor: C.senal, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center' },
  b2: { minHeight: 48, borderRadius: R.m, backgroundColor: C.ton, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center' },
  b3: { minHeight: 44, borderRadius: R.m, paddingHorizontal: 8, alignItems: 'flex-start', justifyContent: 'center' },
  texto: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
};

/* Estado al pulsar de cada variante. Se calcula al pulsar, así que respeta
   «reducir movimiento» aunque cambie con la app abierta. */
export function pulsado(variante = 'b2') {
  const escala = MOV.reducir ? null : { transform: [{ scale: variante === 'chip' ? 0.97 : variante === 'icono' ? 0.96 : 0.98 }] };
  if (variante === 'b1') return [{ backgroundColor: C.senalP }, escala];
  if (variante === 'b3') return { backgroundColor: C.senalT };
  if (variante === 'fila') return { backgroundColor: C.ton };
  return [{ backgroundColor: C.ton2 }, escala];
}

/* Medidas semánticas compartidas por el nuevo shell. Mantenerlas aquí evita
   que navegación, filas y botones acaben con dianas distintas al crecer la
   app. Son mínimos táctiles, no tamaños visuales obligatorios. */
export const UI = {
  margen: 16,
  tactil: 48,
  fila: 60,
  boton: 48,
  nav: 68,
  icono: 24,
};

export const iniciales = (nombre) =>
  (nombre || '')
    .replace(/[^A-Za-zÀ-ÿ ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
