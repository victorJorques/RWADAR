# Tarea para Codex · que el catálogo no desaparezca al caducar

> **Estado: HECHO por Claude el 1 de octubre de 2026** (Víctor se quedó sin
> créditos de Codex y pidió que siguiera Claude). Además, Víctor amplió la
> regla: *el catálogo tiene que estar siempre disponible para el público salvo
> que él diga lo contrario*. Qué se hizo y cómo ponerlo en producción:
> [`PARA-CODEX.md`](PARA-CODEX.md), entrada «1 de octubre · Claude (2)».
> Lo de abajo es el planteamiento original y se conserva como referencia.

**Pedida por:** Víctor, 1 de octubre de 2026.
**Preparada por:** Claude (solo la investigación; el código no está tocado).
**Prioridad:** alta. El lote actual vence al terminar el **5 de octubre de 2026**.

---

## Qué pasa hoy

Cada revisión del catálogo dura como mucho 7 días (`vigencia_dias` entre 1 y 7).
Cuando vence sin que nadie la renueve, **todo desaparece**: la web enseña
«Catálogo pendiente de revisión», el contador se pone a 0, el radar se vacía y
la app hace lo mismo. Está hecho así a propósito (fallar cerrado), pero el
resultado para quien entra es una web vacía.

## Qué quiere Víctor

> Si no se revisa, que al menos no se borre.

Si el lote vence, se sigue enseñando **la última revisión completa**, con un
aviso bien visible. Por ejemplo:

> **Revisión pendiente.** Estos datos se revisaron el 28/09/2026 y su revisión
> semanal ha vencido. Comprueba cada dato en la web del emisor antes de decidir.

## La regla que hay que mantener

Esto no puede convertirse en «enseñar cifras viejas como si fueran de hoy».

- **Las fichas, los nombres, las descripciones, las fuentes y los enlaces se
  siguen viendo.**
- **Las cifras comerciales caducadas no se enseñan.** Rentabilidad, precio,
  puntuación y disponibilidad ya se ocultan oferta a oferta cuando vence su
  propia fecha (`cifras_vigentes` en las vistas). Eso se conserva tal cual. En
  su lugar se lee «Cifra pendiente de revisión».
- **Un lote incompleto, mezclado o retirado sigue sin mostrarse.** Lo único
  que cambia es el caso «completo y aprobado, pero vencido».
- **Las descartadas siguen saliendo siempre con su fuente.** Retirar un
  descarte sigue siendo lo que manda Supabase, nunca la copia local.

## Dónde está la lógica

### Base de datos (Supabase)

- `rwadar-app/db/24_catalogo_publico_verificado.sql`, desde la línea 204: las
  políticas `*_de_revision_vigente` solo dejan leer las revisiones con
  `current_date <= verificado_el + vigencia_dias`.
- `rwadar-app/supabase/migrations/20260930090621_catalogo_v2_colecciones.sql`:
  - `revision_publicable_v2` (línea 135) aplica el mismo filtro.
  - `catalogo_plataformas_publicas_v2` (línea 195) y
    `catalogo_ofertas_publicas_v2` (línea 265) son las vistas que lee la web.

**Propuesta:** una migración nueva (p. ej.
`supabase/migrations/2026100X_catalogo_caducado_visible.sql`) que:

1. Publique la **última** revisión aprobada y completa, aunque haya vencido.
2. Añada a las dos vistas públicas una columna `lote_caducado boolean` (y si
   hace falta `lote_vence_el date`).
3. Mantenga `cifras_vigentes` por oferta exactamente igual.
4. No vuelva a una revisión anterior si la última está retirada.

Tiene que seguir siendo `security_invoker`, sin permisos nuevos para `anon` ni
para `authenticated`.

### Web (`rwadar-site/assets/rwadar-20260820.js`)

| Función | Línea aprox. | Qué hace hoy |
|---|---|---|
| `validarManifiestoCatalogoV2` | 2607 | lanza «V2: lote futuro o caducado» si `edad > plazo` |
| `validarLoteCatalogoRemotoV2` | 2628 | llama a la anterior para los datos remotos |
| `comprobarCatalogoEmbebido` | 2639 | borra `P` y `EMI` si la copia embebida tiene más de 7 días |
| `alDia` | 2766 | si una vista responde vacía o incompleta, borra el catálogo |
| `pintarEmisiones` | 1600 | enseña «Revisión pendiente… no muestra datos anteriores» |
| líneas 1363, 1375 y 2887 | — | contador «0 plataformas» y radar vacío |
| `refrescarVigenciaOfertas` | 2855 | revisa la vigencia mientras la página sigue abierta |

**Propuesta:**

- Separar los dos motivos de bloqueo: **caducado** (completo pero vencido) y
  **no válido** (incompleto, mezclado, futuro o retirado).
- En el caso caducado: se conservan `P`, `FUERA` y `EMI`, se activa un modo
  `CATALOGO_CADUCADO`, se pinta el aviso y las cifras de las ofertas vencidas
  se pintan como «pendiente de revisión».
- En el caso no válido: todo sigue igual que ahora.
- Texto del contador: «26 plataformas · revisión del 28/09/2026 pendiente de
  renovar».

### App móvil (`rwadar-movil/`)

- `lib/contrato-catalogo.js`, línea 192: `edad <= MAX_VIGENCIA_DIAS`, si no,
  falla.
- `lib/catalogo-remoto.js`, líneas 87 y 127 (devuelve `vacio(...)`) y
  `vigilarCaducidadCatalogo` (línea 148).
- `componentes/Ofertas.js` y `App.js`: dónde se pinta el estado vacío.

Mismo criterio que la web. **Ojo:** la app no tiene actualización por el aire
(OTA desactivada), así que el APK 1.1.2 ya instalado seguirá vaciándose al
caducar. El cambio llega a la gente con el siguiente APK o AAB.

### Pruebas que hay que actualizar

Hoy varias pruebas exigen que el catálogo se vacíe al caducar. Hay que
cambiarlas para que exijan el comportamiento nuevo, sin borrar la parte de
«incompleto o retirado se oculta»:

- `probar-web.mjs`
- `rwadar-movil/tests/catalogo-remoto.test.cjs`, `ofertas-vigencia.test.cjs`
  y `flujo.test.cjs`
- `rwadar-app/probar-catalogo-v2.mjs`, `probar-catalogo-publico.mjs` y
  `probar-documentacion-ofertas.mjs`

Casos nuevos que conviene añadir:

1. Lote completo con 8 días → se ve, con aviso y sin cifras vencidas.
2. Lote completo con 30 días → se ve igual.
3. Lote incompleto (25 de 26) → no se ve.
4. Revisión retirada → no se ve y no vuelve a la anterior.
5. Lote con fecha futura → no se ve.

## Cómo saber que está terminado

- `npm test` en la raíz, en verde.
- En local, con el reloj adelantado (por ejemplo, simulando el 10/10/2026), la
  web enseña las 26 plataformas y las 49 referencias con el aviso de revisión
  pendiente, y sin cifras de rentabilidad o precio vencidas.
- La migración se aplica en Supabase **solo con permiso de Víctor**.

## Mientras tanto

Si el cambio no está listo y publicado antes del 5 de octubre, lo único que
evita la web vacía es **renovar la revisión** con el proceso de siempre
(`docs/comercial/RUNBOOK-CATALOGO-SUPABASE.md`).
