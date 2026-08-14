import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { C } from '../lib/tema';

/* ---------------------------------------------------------------------
   El logotipo
   ---------------------------------------------------------------------
   Portado tal cual de `index.html` (`const MARK`), coordenada a
   coordenada sobre el mismo lienzo de 104×104. Es un radar —tres aros,
   la cruz de los ejes, un barrido y tres ecos— con un hexágono en el
   centro, que es la ficha: el activo troceado.

   La app llevaba sin logotipo desde que existe: en la cabecera solo
   había texto. Una marca que se presenta como un instrumento y no enseña
   su instrumento en ningún sitio es media marca.
   --------------------------------------------------------------------- */
export default function Marca({ tamano = 30 }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 104 104">
      <G fill="none" stroke={C.senal} strokeWidth={1.6} opacity={0.55}>
        <Circle cx={52} cy={52} r={46} />
        <Circle cx={52} cy={52} r={35} />
        <Circle cx={52} cy={52} r={24} />
      </G>
      <G fill="none" stroke={C.senal} strokeWidth={1.4} strokeLinecap="round" opacity={0.75}>
        <Path d="M52 4v14M52 86v14M4 52h14M86 52h14" />
      </G>
      {/* El barrido, quieto: en un icono de 30 px una animación no se lee,
          solo gasta batería. */}
      <Path d="M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z" fill={C.senal} opacity={0.38} />
      <G>
        <Path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill={C.senal} />
        <Path d="M65 52L58.5 63.26L45.5 63.26L39 52Z" fill="#0F7A57" />
        <Path d="M58.5 40.74L65 52L58.5 63.26" fill="none" stroke={C.senalCl}
          strokeWidth={1.6} strokeLinejoin="round" />
      </G>
      <G fill={C.senal}>
        <Circle cx={22} cy={30} r={3.1} />
        <Circle cx={25} cy={78} r={2.6} />
        <Circle cx={82} cy={76} r={2.9} />
      </G>
    </Svg>
  );
}
