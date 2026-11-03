# Kraken xStocks · addenda del coordinador · 03/11/2026

Víctor preguntó si un particular en España puede comprarlos por internet y
pidió buscar los documentos oficiales. Para no sortear el bloqueo por país de
`backedassets.fi`, se buscaron por vías abiertas. El resultado **confirma el
rechazo** de `kraken-xstocks.md`, ahora con copias oficiales.

## Copias de la web oficial del emisor

La web oficial `xstocks.fi` (consultada a las 11:06 UTC, servida en su versión
`/us`) carga sus archivos desde el contenedor
`https://cdn.prod.website-files.com/655f3efc4be468487052e35a/`, que aparece 24
veces en su HTML. Las condiciones finales de abajo están alojadas en ese
mismo contenedor y se encontraron con un buscador web. Son archivos de la
propia web del emisor, sin sortear ningún bloqueo.

| Producto | Fecha | SHA-256 del PDF | Países de oferta |
|---|---|---|---|
| LITEx, Product Nr. 159 (CH1500008730) | 26/03/2026 | `85b56d11920c9641dcf95f28ca7aa030d53bef0f5729df8f2e252c1c9d0fde5a` | «The Products will be offered in Liechtenstein and Switzerland (only to Swiss Professional Investors). The right to offer in other jurisdictions is explicitly reserved.» |
| ABTx, Product Nr. 51 (CH1436219518) | 17/11/2025 | `e5cec83f833f0acc6a26f55acfca9c62c0a91897adbe8d2e124c1bd5f37c1f46` | Igual |
| AAPLx, Product Nr. 18 (CH1436219187) | 09/07/2025 | `0eb8d3b2d8286098d7cb4ea8c9af6d7869e4735729a988a2562abfd31582eae2` | Igual |

Los textos extraídos están en `fuentes/kraken-xstocks-web-emisor/`.

## Lo que dicen las condiciones finales sobre el EEE

Este apartado coincide con el de las condiciones finales de 2026 que leyó el
revisor: SPYx, AAPLx y NVDAx de mayo, y G24x del 12/10. Para cada Estado del
EEE («Relevant Member State»), el participante autorizado se compromete a no
ofrecer los productos al público salvo:

- (a) si las condiciones finales prevén para ese Estado una oferta no exenta
  («Non-Exempt Offer»);
- (b) a inversores cualificados;
- (c) a menos de 150 personas;
- (d) en otros supuestos de exención del art. 1.4 del Reglamento de Folletos.

Ninguna de las condiciones finales leídas prevé una oferta no exenta en
España: España solo figura entre los países a los que se notificó el folleto
base.

## Conclusión

Por lo que publica, Kraken vende xStocks en la UE a clientes que superan su
test, desde 1 €. Pero, según los documentos oficiales, **una oferta al público
de particulares en España no está cubierta por el folleto**. RWAdar no puede
presentarlo como una oferta que un particular compre desde España con folleto
y KID. Se mantiene `rechazado`.

Entrará si el emisor publica condiciones finales con España en «Country(ies)
of offer(s)». El propio emisor se reserva ese derecho («The right to offer in
other jurisdictions is explicitly reserved»).
