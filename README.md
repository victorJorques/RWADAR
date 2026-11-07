# RWAdar

**Un radar de plataformas de tokenización de activos reales.** Dice cuáles
existen, cuáles están supervisadas y cuáles se han descartado, siempre con la
fuente al lado.

→ **https://rwadar.pages.dev** · App Android en
[RWAdar-downloads](https://github.com/victorJorques/RWAdar-downloads/releases/latest)

> Este repositorio es **privado**. RWAdar es un registro independiente y no es
> asesoramiento financiero.

## Estado

La web y la app de Android están **publicadas** desde el 28 de septiembre de
2026. A 7 de noviembre de 2026:

- **Catálogo** del 05/11/2026: 25 plataformas en el radar (5 descartadas) y
  22 ofertas. Vale hasta el 12/11/2026 incluido; si no se renueva, desde el
  13/11 a las 00:00 UTC (01:00 en España) se sigue viendo con un aviso y sin
  las cifras vencidas.
- **Cuentas** abiertas y gratis. Las 9 lecciones de RWAdar Academy se leen con
  una cuenta; el índice y el tutorial 3D, sin ella.
- **App Android 1.4.2**, publicada el 06/11/2026. No hay app de iPhone ni
  está en las tiendas.
- **Avisos a registrados** (correo y notificaciones): preparados y apagados.
  Opiniones y comunidad, en pausa.

Todo el detalle, en lenguaje llano: **[`docs/INTERNO.md`](docs/INTERNO.md)**.

## Empezar

| Si quieres… | Lee |
|---|---|
| saber cómo está el proyecto | [`docs/INTERNO.md`](docs/INTERNO.md) |
| trabajar en local | [`docs/RUNBOOK.md`](docs/RUNBOOK.md) |
| ver toda la documentación | [`docs/LEEME.md`](docs/LEEME.md) |
| reglas para Codex y Claude | [`AGENTS.md`](AGENTS.md) |
| avisar de un fallo de seguridad | [`SECURITY.md`](SECURITY.md) |

Ver la web en tu ordenador, sin tocar la base de datos:

```powershell
node rwadar-publicar.js --local --sin-sincronizar
node rwadar-servir.js
```

Y abre `http://localhost:4173`.

Comprobar que todo está bien:

```powershell
npm test
```

## Qué hay en cada carpeta

| Carpeta | Qué es |
|---|---|
| `rwadar-site/` | La web (fuente) |
| `rwadar-acceso/` | Servidor web de la sesión y de la Academy con cuenta; se compila en el `_worker.js` que se publica |
| `rwadar-academy/` | Lecciones de la Academy en Markdown |
| `rwadar-noticias/` | Noticias de Inicio (web y app) |
| `rwadar-app/` | Base de datos, importadores y pruebas |
| `rwadar-movil/` | App Expo para Android e iPhone |
| `rwadar-qr/` | Código QR |
| `rwadar-limpieza/` | Página de `rwadar.netlify.app` que desinstala la app web antigua; se conserva |
| `rwadar-publicado/` | Generado al publicar; no se edita |
| `rwadar-version-codex/` | Copia histórica de agosto; no se edita |
| `docs/` | Documentación (lo legal, en `docs/legal/`) |

## Ramas

**`main` es la rama vigente.** Desde el 1 de octubre de 2026 contiene todo el
trabajo de Codex y de Claude, y la web se publica desde ella con los flujos de
GitHub. Las ramas `codex/*` y `claude/*` se conservan como historial (el panel
de control sigue solo en `claude/panel-control`). Trabaja siempre a partir de
`main` actualizada (`git pull`).
