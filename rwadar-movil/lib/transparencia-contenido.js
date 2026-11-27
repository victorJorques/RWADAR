/* GENERADO por rwadar-editorial-source/ofertas/transparencia.mjs a partir de
   rwadar-editorial-source/ofertas/transparencia.json. No se edita a mano: cambia el
   JSON y ejecuta node rwadar-editorial-source/ofertas/transparencia.mjs.
   Es una comprobación de la documentación, no una recomendación de inversión.
   Una oferta sin entrada, o cuya verificadaEl no coincida con la del catálogo, no
   enseña puntos fuertes ni entra en la Selección. */
export const TRANSPARENCIA_REVISADA_EL = "2026-11-27";

export const CRITERIOS_TRANSPARENCIA = [
  {
    "id": "contratable",
    "texto": "Se contrata hoy desde España"
  },
  {
    "id": "supervisada",
    "texto": "La entidad que la ofrece está autorizada por un supervisor de la UE e inscrita en la CNMV"
  },
  {
    "id": "documentoEspana",
    "texto": "Hay un documento oficial (KID o folleto) que cubre su venta en España"
  },
  {
    "id": "minimoSalida",
    "texto": "El mínimo y la forma de salir están documentados"
  },
  {
    "id": "vigente",
    "texto": "Revisada esta semana y sin fuentes en conflicto"
  }
];

export const TRANSPARENCIA_POR_SLUG = {
  "aktionariat": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende el propio emisor suizo, que no figura en el registro de entidades autorizadas de FINMA ni en ningún registro de la CNMV.",
      "fuente": {
        "titulo": "FINMA · Registro de entidades autorizadas (búsqueda «Aktionariat»: 0 resultados)",
        "url": "https://www.finma.ch/en/finma-public/authorised-institutions-individuals-and-products/"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto ni KID: la oferta se acoge a umbrales de exención y no publica ningún documento equivalente.",
      "fuente": {
        "titulo": "Aktionariat · Aviso legal (oferta en el EEE limitada a 100.000 € en total, sin folleto)",
        "url": "https://www.aktionariat.com/disclaimer"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "500 CHF",
    "salidaCorta": "Venta a otros accionistas",
    "puntos": [
      {
        "texto": "Compra directa al emisor",
        "fuente": {
          "titulo": "Fuente de la ficha · Aktionariat · DAKS",
          "url": "https://shares.aktionariat.com/invest"
        }
      }
    ]
  },
  "alterna-bono-digital-mitsui": {
    "verificadaEl": "2026-11-26",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende una entidad japonesa; no hay autorización de un supervisor de la UE ni inscripción en la CNMV.",
      "fuente": {
        "titulo": "ALTERNA · Lista de ofertas",
        "url": "https://app.alterna-z.com/offerings"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Documentos solo en japonés; no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "ALTERNA · Lista de ofertas",
        "url": "https://app.alterna-z.com/offerings"
      },
      "consultadaEl": "2026-11-26"
    },
    "minimoCorto": "Sin publicar",
    "salidaCorta": "Al vencimiento (1 año)",
    "puntos": []
  },
  "amundi-core-stoxx-europe-600-tokenizada": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "El anuncio no identifica qué entidad vende la clase tokenizada ni su inscripción.",
      "fuente": {
        "titulo": "Amundi · «Amundi extends tokenisation to index investing»",
        "url": "https://about.amundi.com/article/amundi-extends-tokenisation-index-investing"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Amundi no ha publicado un KID ni folleto para la clase tokenizada.",
      "fuente": {
        "titulo": "Amundi · «Amundi extends tokenisation to index investing»",
        "url": "https://about.amundi.com/article/amundi-extends-tokenisation-index-investing"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Sin publicar",
    "salidaCorta": "Sin publicar",
    "puntos": []
  },
  "apartamento-vacacional-hinterstoder-50": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A31KP7)",
        "url": "https://cdn.brickwise.at/3aa9bf9c-ae7d-4dde-ab03-f6169dc9327a.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 77 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "blackrock-hkd-digital-liquidity": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "Autorizado por la SFC de Hong Kong, no por un supervisor de la UE ni inscrito en la CNMV.",
      "fuente": {
        "titulo": "BlackRock Hong Kong · HKD Digital Liquidity Fund",
        "url": "https://www.blackrock.com/hk/en/investment-ideas/hkd-digital-liquidity-fund"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No tiene KID europeo: sus documentos son los de Hong Kong.",
      "fuente": {
        "titulo": "BlackRock Hong Kong · HKD Digital Liquidity Fund",
        "url": "https://www.blackrock.com/hk/en/investment-ideas/hkd-digital-liquidity-fund"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Sin mínimo publicado",
    "salidaCorta": "Por el distribuidor",
    "puntos": []
  },
  "boss-info": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Vende el propio emisor suizo, sin licencia de un supervisor del EEE ni registro en la CNMV; su portal dice que no está supervisado.",
      "fuente": {
        "titulo": "Portal de acciones de Boss Info · aviso legal («not subject to prudential supervision»)",
        "url": "https://shares.bossinfo.com/"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto, KID ni ficha informativa, y el emisor no dice en qué exención se apoya para vender fuera de Suiza.",
      "fuente": {
        "titulo": "Portal de acciones de Boss Info · compra directa al emisor (sin folleto ni KID publicados)",
        "url": "https://shares.bossinfo.com/invest"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100 CHF",
    "salidaCorta": "Venta a otros accionistas",
    "puntos": [
      {
        "texto": "Compra directa al emisor",
        "fuente": {
          "titulo": "Fuente de la ficha · Aktionariat · BOSS",
          "url": "https://shares.bossinfo.com/"
        }
      }
    ]
  },
  "conda-devolo-bono-2026": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "Según su web, CONDA está autorizada en la UE como plataforma de financiación participativa (no lo hemos comprobado); el bono no se ofrece en España ni está inscrito en la CNMV.",
      "fuente": {
        "titulo": "CONDA · devolo solutions GmbH – Anleihe",
        "url": "https://conda-capital.com/campaign/devolo-solutions-anleihe/"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "La documentación de la campaña está en alemán y no se ofrece en España.",
      "fuente": {
        "titulo": "CONDA · devolo solutions GmbH – Anleihe",
        "url": "https://conda-capital.com/campaign/devolo-solutions-anleihe/"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "250 €",
    "salidaCorta": "Al vencimiento (2029)",
    "puntos": []
  },
  "drautalresidenz-paternion": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2YPQ0)",
        "url": "https://cdn.brickwise.at/2dcc086d-98b7-4707-8281-4ff3fa354109.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 70 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "exio-ustnt-bonos-tesoro-eeuu": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "Lo emite una sociedad de Hong Kong y lo vende una plataforma de Hong Kong; no está autorizado en la UE ni inscrito en la CNMV.",
      "fuente": {
        "titulo": "EX.IO · anuncio de USTNT",
        "url": "https://www.ex.io/en/support/announcements/new-offering-us-treasury-note-token-ustnt-is-now-available-on-ex-io"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "EX.IO · anuncio de USTNT",
        "url": "https://www.ex.io/en/support/announcements/new-offering-us-treasury-note-token-ustnt-is-now-available-on-ex-io"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1.000 USD",
    "salidaCorta": "Reembolso tras vender los bonos",
    "puntos": []
  },
  "finexity-bono-2026-2030-serie-b": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende el propio emisor alemán sin folleto; no consta como entidad autorizada inscrita en la CNMV para esta venta.",
      "fuente": {
        "titulo": "FINEXITY · Hoja de términos del bono 2026/2030",
        "url": "https://content.finexity.com/hubfs/documents/finexity-group/FINEXITY-Group_Bond-2026-2030_Term-Sheet_EN.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Tiene KID en alemán, pero la oferta pública es solo en Alemania.",
      "fuente": {
        "titulo": "FINEXITY · Hoja de términos («Public offer in Germany only»)",
        "url": "https://content.finexity.com/hubfs/documents/finexity-group/FINEXITY-Group_Bond-2026-2030_Term-Sheet_EN.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1.000 €",
    "salidaCorta": "Al vencimiento (2030)",
    "puntos": [
      {
        "texto": "Cupón variable con un mínimo fijado",
        "fuente": {
          "titulo": "FINEXITY · Hoja de términos del bono 2026/2030",
          "url": "https://content.finexity.com/hubfs/documents/finexity-group/FINEXITY-Group_Bond-2026-2030_Term-Sheet_EN.pdf"
        }
      }
    ]
  },
  "fotovoltaica-cohotel": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A38J40)",
        "url": "https://cdn.brickwise.at/da8e1df3-d334-4075-9311-299f93c8563e.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 110 € la participación (26/11)",
    "salidaCorta": "Nominal en 2038; antes, reventa",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "fotovoltaica-greenpoint": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A38J32)",
        "url": "https://cdn.brickwise.at/f6c7c7ff-f2f1-4272-86dd-39e02432868c.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 102 € la participación (26/11)",
    "salidaCorta": "Nominal en 2038; antes, reventa",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "franklin-onchain-euro-liquidity": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "Todavía no hay entidad ni canal publicados para venderlo en España.",
      "fuente": {
        "titulo": "Franklin Templeton · Comunicado del 23/11/2026",
        "url": "https://www.ftinstitutionalemea.com/press-releases/franklin-templeton-launches-tokenised-euro-money-market-fund"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Aún no hemos encontrado su KID en español.",
      "fuente": {
        "titulo": "Franklin Templeton · Comunicado del 23/11/2026",
        "url": "https://www.ftinstitutionalemea.com/press-releases/franklin-templeton-launches-tokenised-euro-money-market-fund"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Sin publicar",
    "salidaCorta": "Sin publicar",
    "puntos": []
  },
  "groma-real-estate-trust": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "La ofrece el propio REIT con exenciones de la SEC; no hay entidad autorizada en la UE ni inscrita en la CNMV.",
      "fuente": {
        "titulo": "Groma Real Estate Trust (Reg D 506(c) y Reg CF)",
        "url": "https://www.gromareit.com/"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Memorando de colocación de EE. UU.; no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "Groma Real Estate Trust",
        "url": "https://www.gromareit.com/"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Sin mínimo publicado",
    "salidaCorta": "Sin salida publicada",
    "puntos": []
  },
  "hsbc-hkd-money-fund-class-sd": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "Fondo y banco de Hong Kong; no está autorizado por un supervisor de la UE ni inscrito en la CNMV.",
      "fuente": {
        "titulo": "HSBC · anuncio del 19/11/2026",
        "url": "https://www.about.hsbc.com.hk/news-and-media/hsbc-redcoin-expands-into-wealth-with-tokenised-fund-access"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay KID europeo; los documentos del fondo son de Hong Kong.",
      "fuente": {
        "titulo": "HSBC · anuncio del 19/11/2026",
        "url": "https://www.about.hsbc.com.hk/news-and-media/hsbc-redcoin-expands-into-wealth-with-tokenised-fund-access"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100 HKD",
    "salidaCorta": "Según el folleto del fondo",
    "puntos": [
      {
        "texto": "Fondo de 1991 con clase tokenizada",
        "fuente": {
          "titulo": "HSBC · anuncio del 19/11/2026",
          "url": "https://www.about.hsbc.com.hk/news-and-media/hsbc-redcoin-expands-into-wealth-with-tokenised-fund-access"
        }
      }
    ]
  },
  "hwk-1365-zukunftsanleihe": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "La emite directamente una empresa industrial, no una entidad financiera; la BaFin no revisa el contenido de su hoja informativa.",
      "fuente": {
        "titulo": "HWK 1365 · Die HWK 1365 Zukunftsanleihe",
        "url": "https://www.hwk1365.de/anleihe/"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay una hoja informativa en alemán, sin folleto aprobado ni KID en castellano.",
      "fuente": {
        "titulo": "HWK 1365 SE · Wertpapier-Informationsblatt",
        "url": "https://www.hwk1365.de/wp-content/uploads/2026/11/HWK1365SE_Wertpapier-Informationsblatt.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1.000 €",
    "salidaCorta": "Al vencimiento (2031)",
    "puntos": []
  },
  "kraken-xstocks": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-03",
    "supervisada": {
      "cumple": true,
      "motivo": "Payward Europe Digital Solutions (CY), que vende en Kraken UE, tiene licencia CySEC y figura en la CNMV (n.º 4474) en libre prestación.",
      "fuente": {
        "titulo": "CNMV · Payward Europe Digital Solutions (CY) Limited, ESI del EEE en libre prestación n.º 4474",
        "url": "https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "El folleto se notificó a la CNMV, pero las condiciones finales solo ofrecen el producto en Liechtenstein y Suiza, no en España.",
      "fuente": {
        "titulo": "Backed Assets (JE) · Condiciones finales n.º 159 (LITEx), apartado «Country(ies) of offer(s)»",
        "url": "https://cdn.prod.website-files.com/655f3efc4be468487052e35a/69c684c9cf6e1070cfdd8851_Backed%20Assets_Final%20Terms%20Nr%20159%20(LITEx)_20260326.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 €",
    "salidaCorta": "Venta a Kraken, 24/5",
    "puntos": [
      {
        "texto": "Inscrita en la CNMV (UE)",
        "fuente": {
          "titulo": "CNMV · Payward Europe Digital Solutions (CY) Limited, ESI del EEE en libre prestación n.º 4474",
          "url": "https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474"
        }
      }
    ]
  },
  "liqi-creditos-empresas": {
    "verificadaEl": "2026-11-26",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "Liqi opera en Brasil bajo la CVM; no está autorizada por un supervisor de la UE ni inscrita en la CNMV.",
      "fuente": {
        "titulo": "Liqi · Ofertas de tokens (RCVM 88)",
        "url": "https://tokens.liqi.com.br/tokens"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Emisiones brasileñas del régimen CVM 88; no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "Liqi · Ofertas de tokens",
        "url": "https://tokens.liqi.com.br/tokens"
      },
      "consultadaEl": "2026-11-26"
    },
    "minimoCorto": "R$ 25",
    "salidaCorta": "Al vencimiento",
    "puntos": []
  },
  "local-de-estanco-klagenfurt": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2U5V3)",
        "url": "https://cdn.brickwise.at/a53b857c-4664-4a58-a6a6-11e8b2a4f911.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 95 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "mtbill": {
    "verificadaEl": "2026-11-26",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende el propio emisor, Midas Software GmbH, que no figura en BaFin ni en la CNMV; su KID dice que no está supervisado.",
      "fuente": {
        "titulo": "BaFin · Base de datos de empresas (búsqueda «Midas»: solo una sociedad danesa distinta)",
        "url": "https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do?institutName=Midas&sucheButtonInstitut=Suche"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": true,
      "motivo": "Folleto aprobado en Liechtenstein y notificado a la CNMV; las condiciones finales incluyen España y minoristas, y hay KID en español.",
      "fuente": {
        "titulo": "Midas · Documentación legal de mTBILL (condiciones finales del 17/07/2026 y KID en español)",
        "url": "https://docs.midas.app/resources/legal-product-documentation/mtbill"
      },
      "consultadaEl": "2026-11-21"
    },
    "minimoCorto": null,
    "salidaCorta": null,
    "puntos": [
      {
        "texto": "Folleto notificado a la CNMV",
        "fuente": {
          "titulo": "Midas · Documentación legal de mTBILL (condiciones finales del 17/07/2026 y KID en español)",
          "url": "https://docs.midas.app/resources/legal-product-documentation/mtbill"
        }
      },
      {
        "texto": "KID en español",
        "fuente": {
          "titulo": "Midas · Documentación legal de mTBILL (condiciones finales del 17/07/2026 y KID en español)",
          "url": "https://docs.midas.app/resources/legal-product-documentation/mtbill"
        }
      }
    ]
  },
  "mufg-realty-token-kioicho": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "Lo coloca una casa de valores japonesa; no está autorizado por un supervisor de la UE ni inscrito en la CNMV.",
      "fuente": {
        "titulo": "Daiwa Securities · MUFG Realty Token",
        "url": "https://www.daiwa.jp/products/securitytoken/info/mufg_kioicho/"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Folleto japonés; no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "Daiwa Securities · MUFG Realty Token",
        "url": "https://www.daiwa.jp/products/securitytoken/info/mufg_kioicho/"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100.000 JPY",
    "salidaCorta": "Venta del inmueble (~5 años)",
    "puntos": []
  },
  "osl-taikang-kaitai-usd-mmf": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "Según OSL, el fondo lo autorizó la SFC de Hong Kong (no lo hemos comprobado), no un supervisor de la UE; no está inscrito en la CNMV.",
      "fuente": {
        "titulo": "OSL · Taikang Kaitai USD Money Market Fund",
        "url": "https://www.osl.com/hk-en/bits/article/osl-taikang-kaitai-usd-money-market-fund"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay KID europeo; los documentos del fondo son de Hong Kong.",
      "fuente": {
        "titulo": "OSL · Taikang Kaitai USD Money Market Fund",
        "url": "https://www.osl.com/hk-en/bits/article/osl-taikang-kaitai-usd-money-market-fund"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 USD",
    "salidaCorta": "Reembolso en la app",
    "puntos": [
      {
        "texto": "Sin comisión de entrada ni de salida",
        "fuente": {
          "titulo": "OSL · Taikang Kaitai USD Money Market Fund",
          "url": "https://www.osl.com/hk-en/bits/article/osl-taikang-kaitai-usd-money-market-fund"
        }
      }
    ]
  },
  "prosegur-digital-gold": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Prosegur Crypto figura en la CNMV solo para custodiar, tramitar órdenes y transferir criptoactivos; su contrato dice que este oro no está supervisado.",
      "fuente": {
        "titulo": "CNMV · Relación de proveedores de servicios de criptoactivos (Prosegur: custodia, recepción de órdenes y transferencia)",
        "url": "https://www.cnmv.es/Docportal/Proveedores-Servicios-Criptoactivos/Listado_ProveedoresCriptoactivos.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No tiene KID ni folleto: su contrato dice que no es un producto financiero y solo hay términos y condiciones de la empresa.",
      "fuente": {
        "titulo": "Prosegur Gold · Términos y condiciones generales (08/07/2026)",
        "url": "https://app.prosegurdigitalgold.com/#/terms-service"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 gramo de oro",
    "salidaCorta": "Recompra por Prosegur",
    "puntos": [
      {
        "texto": "Empresa española",
        "fuente": {
          "titulo": "CNMV · Relación de proveedores de servicios de criptoactivos (Prosegur: custodia, recepción de órdenes y transferencia)",
          "url": "https://www.cnmv.es/Docportal/Proveedores-Servicios-Criptoactivos/Listado_ProveedoresCriptoactivos.pdf"
        }
      },
      {
        "texto": "Oro custodiado en España",
        "fuente": {
          "titulo": "Fuente de la ficha · Prosegur Crypto",
          "url": "https://www.prosegurcrypto.com/digital-gold"
        }
      }
    ]
  },
  "randhartingergasse-9-viena": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2ZT84)",
        "url": "https://cdn.brickwise.at/8c331bfe-ab6a-436c-9d07-bb9c36aabad9.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 78 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "robinhood-classic-stock-tokens": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-02",
    "supervisada": {
      "cumple": true,
      "motivo": "Robinhood Europe está autorizada por el Banco de Lituania y figura en la CNMV en libre prestación (n.º 5299) con derivados en su programa.",
      "fuente": {
        "titulo": "CNMV · Robinhood Europe, UAB, ESI del EEE en libre prestación n.º 5299",
        "url": "https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=5299"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": true,
      "motivo": "Tiene KID PRIIPs en español (1 de julio de 2026), enlazado desde su web española, para minoristas y sin excluir España.",
      "fuente": {
        "titulo": "Robinhood Europe · Documento de datos fundamentales en español (derivado sobre acciones/ETP de EE. UU.)",
        "url": "https://cdn.robinhood.com/assets/robinhood/legal/stock_and_etf_tokens_kid_es.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 €",
    "salidaCorta": "Cierre con Robinhood, 24/5",
    "puntos": [
      {
        "texto": "Inscrita en la CNMV (UE)",
        "fuente": {
          "titulo": "CNMV · Robinhood Europe, UAB, ESI del EEE en libre prestación n.º 5299",
          "url": "https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=5299"
        }
      },
      {
        "texto": "KID en español",
        "fuente": {
          "titulo": "Robinhood Europe · Documento de datos fundamentales en español (derivado sobre acciones/ETP de EE. UU.)",
          "url": "https://cdn.robinhood.com/assets/robinhood/legal/stock_and_etf_tokens_kid_es.pdf"
        }
      }
    ]
  },
  "securitize-hinc": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "Lo distribuye Securitize desde EE. UU.; no consta autorización de un supervisor de la UE ni inscripción en la CNMV para este fondo.",
      "fuente": {
        "titulo": "Securitize · HINC",
        "url": "https://securitize.io/hinc"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto ni KID europeos publicados para este fondo.",
      "fuente": {
        "titulo": "Securitize · HINC",
        "url": "https://securitize.io/hinc"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100.000 USD",
    "salidaCorta": "Reembolso diario",
    "puntos": [
      {
        "texto": "Reembolso diario",
        "fuente": {
          "titulo": "Securitize · HINC",
          "url": "https://securitize.io/hinc"
        }
      }
    ]
  },
  "spiko-letras-del-tesoro-dolar": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-02",
    "supervisada": {
      "cumple": true,
      "motivo": "Spiko Finance está autorizada en Francia (ACPR) y figura en la CNMV (n.º 5325) para tramitar órdenes sobre fondos.",
      "fuente": {
        "titulo": "CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": true,
      "motivo": "KID oficial en español para todo inversor; la SICAV figura en la CNMV (n.º 2380) y la tabla de países de Spiko marca España.",
      "fuente": {
        "titulo": "Spiko US T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)",
        "url": "https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 USD",
    "salidaCorta": "Reembolso diario",
    "puntos": [
      {
        "texto": "Inscrita en la CNMV (UE)",
        "fuente": {
          "titulo": "CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325",
          "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"
        }
      },
      {
        "texto": "KID en español",
        "fuente": {
          "titulo": "Spiko US T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)",
          "url": "https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf"
        }
      }
    ]
  },
  "spiko-letras-del-tesoro-euro": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": true,
      "motivo": "Spiko Finance está autorizada en Francia (ACPR) y figura en la CNMV (n.º 5325) para tramitar órdenes sobre fondos.",
      "fuente": {
        "titulo": "CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": true,
      "motivo": "KID oficial en español para todo inversor; la SICAV figura en la CNMV (n.º 2380) y la tabla de países de Spiko marca España.",
      "fuente": {
        "titulo": "Spiko EU T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)",
        "url": "https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 €",
    "salidaCorta": "Reembolso diario",
    "puntos": [
      {
        "texto": "Inscrita en la CNMV (UE)",
        "fuente": {
          "titulo": "CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325",
          "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"
        }
      },
      {
        "texto": "KID en español",
        "fuente": {
          "titulo": "Spiko EU T-Bills Money Market Fund · Documento de datos fundamentales en español (01/09/2026)",
          "url": "https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf"
        }
      }
    ]
  },
  "spiko-smart-cash-euro": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-03",
    "supervisada": {
      "cumple": true,
      "motivo": "Spiko Finance está autorizada en Francia (ACPR) y figura en la CNMV (n.º 5325) para tramitar órdenes sobre fondos.",
      "fuente": {
        "titulo": "CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Hay KID en español, pero ningún registro público de la CNMV ni de la AMF muestra que este fondo esté dado de alta en España.",
      "fuente": {
        "titulo": "CNMV · Spiko SICAV, IIC extranjera n.º 2380 (no muestra sus fondos uno a uno)",
        "url": "https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 €",
    "salidaCorta": "Reembolso diario, con límites",
    "puntos": [
      {
        "texto": "Inscrita en la CNMV (UE)",
        "fuente": {
          "titulo": "CNMV · Spiko Finance SASU, ESI del EEE en libre prestación n.º 5325",
          "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es"
        }
      }
    ]
  },
  "switzerlend": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Vende el propio emisor suizo; solo está afiliado a PolyReg (antiblanqueo), sin licencia del EEE ni registro en la CNMV.",
      "fuente": {
        "titulo": "Switzerlend AG · Investor Relations (afiliación a PolyReg y mercado no supervisado)",
        "url": "https://www.lend.ch/de/investor-relations"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto ni KID: su página de inversores dice que «no es un folleto» y ningún documento dice qué países pueden comprar.",
      "fuente": {
        "titulo": "Switzerlend AG · Investor Relations («weder Anlageberatung noch ein Prospekt»)",
        "url": "https://www.lend.ch/de/investor-relations"
      },
      "consultadaEl": "2026-11-26"
    },
    "minimoCorto": "1 acción (68,01 CHF a 26/11)",
    "salidaCorta": "Venta a otros accionistas",
    "puntos": [
      {
        "texto": "Compra directa al emisor",
        "fuente": {
          "titulo": "Fuente de la ficha · Aktionariat · LENDS",
          "url": "https://shares.lend.ch/"
        }
      }
    ]
  },
  "tohkn-iber1": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende MIO3 (TOHKN), autorizada en El Salvador según su web, no por un supervisor de la UE ni inscrita en la CNMV.",
      "fuente": {
        "titulo": "TOHKN · Emisiones de activos digitales (MIO3, PSAD-0016, CNAD)",
        "url": "https://www.tohkn.com/en/issuances"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "La documentación de IBER1 es salvadoreña (DIR y aviso de oferta pública ante la CNAD); no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "TOHKN · Emisiones de activos digitales",
        "url": "https://www.tohkn.com/en/issuances"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100 USD",
    "salidaCorta": "Al vencimiento (24 meses)",
    "puntos": [
      {
        "texto": "Interés fijo y pago mensual",
        "fuente": {
          "titulo": "TOHKN · IBER1",
          "url": "https://www.tohkn.com/en/issuances/iber1"
        }
      }
    ]
  },
  "tohkn-mmlti1": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende MIO3 (TOHKN), autorizada en El Salvador según su web, no por un supervisor de la UE ni inscrita en la CNMV.",
      "fuente": {
        "titulo": "TOHKN · Emisiones de activos digitales (MIO3, PSAD-0016, CNAD)",
        "url": "https://www.tohkn.com/en/issuances"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "La documentación de MMLTI1 es salvadoreña (DIR y aviso de oferta pública ante la CNAD); no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "TOHKN · Emisiones de activos digitales",
        "url": "https://www.tohkn.com/en/issuances"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100 USD",
    "salidaCorta": "Al vencimiento (24 meses)",
    "puntos": [
      {
        "texto": "Interés fijo y pago mensual",
        "fuente": {
          "titulo": "TOHKN · MMLTI1",
          "url": "https://www.tohkn.com/en/issuances/mmlti1"
        }
      }
    ]
  },
  "tohkn-rncrrev": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-26",
    "supervisada": {
      "cumple": false,
      "motivo": "La vende MIO3 (TOHKN), autorizada en El Salvador según su web, no por un supervisor de la UE ni inscrita en la CNMV.",
      "fuente": {
        "titulo": "TOHKN · Emisiones de activos digitales (MIO3, PSAD-0016, CNAD)",
        "url": "https://www.tohkn.com/en/issuances"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "La documentación de RNCRrev es salvadoreña (DIR y aviso de oferta pública ante la CNAD); no hay folleto ni KID europeos.",
      "fuente": {
        "titulo": "TOHKN · Emisiones de activos digitales",
        "url": "https://www.tohkn.com/en/issuances"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100 USD",
    "salidaCorta": "Venta de las viviendas",
    "puntos": []
  },
  "tokinvest-great-hampton-street": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "La emite Tokinvest FZCO con su licencia de VARA (Dubái), no un supervisor de la UE; no está inscrita en la CNMV.",
      "fuente": {
        "titulo": "Tokinvest · ficha del producto",
        "url": "https://tokinvest.capital/case-studies/great-hampton-street-works"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto ni KID europeos; los términos están en inglés en la web de Tokinvest.",
      "fuente": {
        "titulo": "Tokinvest · ficha del producto",
        "url": "https://tokinvest.capital/case-studies/great-hampton-street-works"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "100.000 AED",
    "salidaCorta": "Venta del edificio (10 años)",
    "puntos": [
      {
        "texto": "Edificio terminado y alquilado entero",
        "fuente": {
          "titulo": "Tokinvest · Great Hampton Street Works",
          "url": "https://tokinvest.capital/case-studies/great-hampton-street-works"
        }
      }
    ]
  },
  "tokinvest-lingote-plata-record": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-11-27",
    "supervisada": {
      "cumple": false,
      "motivo": "La emite Tokinvest FZCO con su licencia de VARA (Dubái), no un supervisor de la UE; no está inscrita en la CNMV.",
      "fuente": {
        "titulo": "Tokinvest · ficha del producto",
        "url": "https://tokinvest.capital/case-studies/worlds-largest-silver-bar"
      },
      "consultadaEl": "2026-11-27"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "No hay folleto ni KID europeos; los términos están en inglés en la web de Tokinvest.",
      "fuente": {
        "titulo": "Tokinvest · ficha del producto",
        "url": "https://tokinvest.capital/case-studies/worlds-largest-silver-bar"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "1 kg de plata",
    "salidaCorta": "Venta del lingote (10 años)",
    "puntos": [
      {
        "texto": "Lingote custodiado por Brink’s en Dubái",
        "fuente": {
          "titulo": "Tokinvest · lingote de plata récord",
          "url": "https://tokinvest.capital/case-studies/worlds-largest-silver-bar"
        }
      }
    ]
  },
  "vivienda-pluddemanngasse-101-graz": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2RAH5)",
        "url": "https://cdn.brickwise.at/f96b7e13-f9cb-4e13-a3f8-10974353ec4e.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 75 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "vivienda-pottendorfer-stra-e-62-wr-neustadt": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A324B4)",
        "url": "https://cdn.brickwise.at/03bdd125-b005-4948-b29f-4e575d58e985.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 81 € la participación (26/11)",
    "salidaCorta": "Primera cancelación a 15 años; reventa",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "vivienda-schwarzer-weg-18-graz": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2WCE8)",
        "url": "https://cdn.brickwise.at/4d0dd404-4a76-417a-b21d-606a1f11ba63.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 71 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "vivienda-sonnleithnergasse-2-viena": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2T4D7)",
        "url": "https://cdn.brickwise.at/8d71cb16-1152-4535-8c36-d41c07e5ec05.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 75 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  },
  "vivienda-stallhofstra-e-28-gratwein": {
    "verificadaEl": "2026-11-27",
    "anadidaEl": "2026-09-30",
    "supervisada": {
      "cumple": false,
      "motivo": "Effecta (BaFin) figura en la CNMV, pero Brickwise, el agente que te vende, no consta notificado para operar en España.",
      "fuente": {
        "titulo": "CNMV · Effecta GmbH en libre prestación (nº 5003), pestaña Agentes: sin datos",
        "url": "https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8"
      },
      "consultadaEl": "2026-11-26"
    },
    "documentoEspana": {
      "cumple": false,
      "motivo": "Solo hay un KID en alemán y una ficha de la ley austriaca de financiación alternativa; ninguno cubre su venta en España.",
      "fuente": {
        "titulo": "Basisinformationsblatt (KID) del emisor, solo en alemán (ISIN AT0000A2WCD0)",
        "url": "https://cdn.brickwise.at/4f7737ce-d8b6-45e2-88ef-d6f6d6acafee.pdf"
      },
      "consultadaEl": "2026-11-27"
    },
    "minimoCorto": "Desde 70 € la participación (26/11)",
    "salidaCorta": "Reventa en la app, si hay comprador",
    "puntos": [
      {
        "texto": "Reventa activa en la app",
        "fuente": {
          "titulo": "Brickwise · mercado de reventa en la app (26/11/2026)",
          "url": "https://app.brickwise.at/desktopWeb/marketplace"
        }
      }
    ]
  }
};
