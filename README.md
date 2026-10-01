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
2026, con 26 plataformas, 4 descartadas y 49 referencias de inversión. Las
cuentas, las opiniones y los avisos están en pausa. Las tiendas de apps están
pendientes.

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
| `rwadar-app/` | Base de datos, importadores y pruebas |
| `rwadar-movil/` | App Expo para Android e iPhone |
| `rwadar-qr/` | Código QR |
| `rwadar-limpieza/` | Desinstala la PWA antigua de Netlify; se conserva |
| `rwadar-publicado/` | Generado al publicar; no se edita |
| `rwadar-version-codex/` | Copia histórica de agosto; no se edita |
| `docs/` | Documentación |

## Ramas

El trabajo vigente está en `codex/relanzamiento-publico` y en las ramas que
salen de ella. **`main` se quedó en agosto** y está pendiente de ponerse al
día.
