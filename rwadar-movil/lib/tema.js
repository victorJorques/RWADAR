import { Platform } from 'react-native';

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
  /* Superficies, con una pizca de calor en el negro. */
  noche: '#0B0A0A',
  noche2: '#100F0E',
  sup: '#171614',
  sup2: '#1E1D1B',
  sup3: '#262523',
  linea: '#26241F',
  linea2: '#3A3833',

  /* Texto en grises cálidos. */
  tx: '#F7F5F0',
  tx2: '#BBB5AB',
  tx3: '#8A8378',

  /* La señal: el verde de un eco de radar. 13:1 sobre el fondo, así que
     sirve para texto, para botones y para el barrido. */
  senal: '#25E39A',
  senalCl: '#6BF0C0',
  senalOs: '#0B5F42',
  senal10: 'rgba(37,227,154,0.10)',
  senal20: 'rgba(37,227,154,0.20)',
  senal34: 'rgba(37,227,154,0.34)',

  /* «Descartada». Es rojo puro y no naranja a propósito: contra el
     naranja de «materias primas» la distancia en Lab era de 22,9 —una
     categoría confundible con una advertencia—, y así sube a 34,5. */
  coral: '#FF3B30',
  coral10: 'rgba(255,59,48,0.10)',
  coral32: 'rgba(255,59,48,0.32)',

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
  media: 'Geist_500Medium',
  semi: 'Geist_600SemiBold',
  negrita: 'Geist_700Bold',
  extra: 'Geist_800ExtraBold',
  mono: 'GeistMono_500Medium',
};

export const T = {
  titular:   { fontFamily: F.extra,   fontSize: 27, letterSpacing: -0.85, lineHeight: 31 },
  seccion:   { fontFamily: F.extra,   fontSize: 21, letterSpacing: -0.62, lineHeight: 25 },
  ficha:     { fontFamily: F.negrita, fontSize: 17, letterSpacing: -0.38, lineHeight: 21 },
  cuerpo:    { fontFamily: F.regular, fontSize: 14.5, letterSpacing: -0.1, lineHeight: 21 },
  cuerpoFte: { fontFamily: F.media,   fontSize: 14.5, letterSpacing: -0.1, lineHeight: 21 },
  menor:     { fontFamily: F.regular, fontSize: 13, letterSpacing: -0.05, lineHeight: 19 },
  dato:      { fontFamily: F.mono,    fontSize: 11.5, letterSpacing: 0.4 },
  etiqueta:  { fontFamily: F.mono,    fontSize: 10.5, letterSpacing: 1.1 },
};

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

export const E = {
  e1: Platform.select({ ios: sombraIOS(2, 6, 0.30), android: { elevation: 1 }, default: {} }),
  e2: Platform.select({ ios: sombraIOS(6, 16, 0.42), android: { elevation: 4 }, default: {} }),
  e3: Platform.select({ ios: sombraIOS(12, 28, 0.55), android: { elevation: 9 }, default: {} }),
};

/* Escala de radios: la curva crece con la superficie. */
export const R = { xs: 8, s: 12, m: 14, ficha: 18, panel: 24, pastilla: 99 };

export const iniciales = (nombre) =>
  (nombre || '')
    .replace(/[^A-Za-zÀ-ÿ ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
