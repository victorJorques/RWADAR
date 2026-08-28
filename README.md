# RWAdar

Registro editorial de plataformas de tokenización, con web/PWA, backend
Supabase, app Expo y herramientas de investigación y publicación.

## Estado actual

RWAdar es un proyecto **privado e interno**. La aplicación completa se retiró
de internet el 25 de agosto de 2026 para continuar el trabajo sin exponer una
versión en desarrollo.

Los dominios históricos no sirven la aplicación: muestran únicamente una
página de limpieza para desregistrar la antigua PWA instalada.

- `https://rwadar.pages.dev`
- `https://rwadar.netlify.app`

No desplegar la aplicación ni sustituir esa limpieza sin una decisión expresa
de republicación.

## Empezar

- Estado canónico y mapa: [`docs/INTERNO.md`](docs/INTERNO.md)
- Trabajo local y pruebas: [`docs/RUNBOOK.md`](docs/RUNBOOK.md)
- Reglas automáticas para agentes: [`AGENTS.md`](AGENTS.md)
- Seguridad: [`SECURITY.md`](SECURITY.md)
- Informes anteriores: `docs/archive/2026-08/`

Reconstrucción local sin consultar Supabase:

```powershell
node rwadar-publicar.js --local --sin-sincronizar
node rwadar-servir.js
```

Después abre `http://localhost:4173`. Aunque el servidor solo escucha en
`127.0.0.1`, el JavaScript de la web todavía apunta al Supabase de producción.
No iniciar sesión ni probar escrituras hasta disponer de un backend aislado o
una autorización concreta.

## Fuente y generados

| Ruta | Papel |
|---|---|
| `rwadar-site/` | Fuente web/PWA |
| `rwadar-editorial-source/` | Maestros de portadas |
| `rwadar-app/` | Base, migraciones, sincronización y pruebas |
| `rwadar-movil/` | App Expo |
| `rwadar-qr/` | QR |
| `rwadar-limpieza/` | Retirada pública de la PWA; conservar |
| `rwadar-publicado/` | Generado; no editar |
| `rwadar-version-codex/` | Rescate histórico; no editar |

La rama canónica para continuar el trabajo es `codex/interno-privado`.
