# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 1 de octubre de 2026 · Claude

**Rama:** `claude/magical-hamilton-aiddjs`, creada encima de
`codex/relanzamiento-publico` (último commit de Codex: `59ecbe3`). No toca nada
de producción: ni web publicada, ni Supabase, ni EAS.

### Qué he hecho

| Commit | Qué cambia | Qué tienes que saber |
|---|---|---|
| `fix(movil): parchea … uuidv5 en iOS` | `rwadar-movil/scripts/parchear-expo-uuidv5.cjs` + `postinstall` en `rwadar-movil/package.json` + `.easignore` + paso en `ci.yml` | Corrige el fallo de expo-modules-core (copiaba 20 bytes en un UUID de 16; sigue sin corregir en Expo 58.0.10). Se aplica solo en cada `npm install` o `npm ci`, también en EAS. **Si actualizas Expo** y el script se para, lee su mensaje: o el archivo cambió y hay que revisar, o Expo ya lo arregló y se puede borrar el script. Instalar con `--ignore-scripts` no aplica el parche: ejecuta luego `npm --prefix rwadar-movil run postinstall`. |
| `feat(datos): copia de seguridad cifrada diaria` | `.github/workflows/copia-seguridad.yml`, `rwadar-app/copia-seguridad.sh`, `docs/COPIAS-DE-SEGURIDAD.md` | `pg_dump` de `auth`, `public` y `rwadar_catalogo`, cifrado con gpg y comprobado. Necesita los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` y estar en `main`. **Antes de actualizar Postgres, una copia comprobada.** |
| `docs: pruebas de ataque … y tarea del catálogo` | `docs/seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`, `docs/tareas/CODEX-catalogo-no-desaparece.md` | Todos los ataques probados en local están bloqueados. La tarea del catálogo es **tuya** (ver abajo). |
| `docs: documentación en lenguaje llano …` | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/INTERNO.md`, `docs/RUNBOOK.md`, `docs/LEEME.md` nuevo | Ya no dicen que RWAdar está apagado. Las versiones anteriores están en `docs/archive/2026-09/`. Los informes con fecha **no se han movido**: los cita `rwadar-app/data/relanzamiento/estado.json`. En `CATALOGO-V2-2026-09-30.md` cambié «API35, run…» por «API 35, ejecución…» porque gitleaks lo confundía con una clave. |

### Autoría de commits (importante)

Desde ahora **firma como Codex**: lo tienes en `AGENTS.md` → «Autoría de los
commits». Los commits del 28 al 30 de septiembre salieron como «Claude» porque
la carpeta local tenía ese nombre configurado desde agosto. No cambies el
`git config` de la carpeta: usa `git -c user.name=… -c user.email=…` en cada
commit.

### Pruebas que he pasado

- Web: `npm run test:web` → 341/341.
- Base de datos: las 26 baterías de `npm --prefix rwadar-app test`, todas en
  verde.
- App: `npm --prefix rwadar-movil test` → 89/89 (5 nuevas del parche).
- Compuerta: `npm --prefix rwadar-app run auditar:relanzamiento` → «LISTO PARA
  CORTE FINAL» (los cambios de hoy no tocan rutas aprobadas).
- gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` → 0 hallazgos en archivos
  versionados.

### Pendiente para Codex

1. **[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md)**:
   que el catálogo caducado se siga viendo con aviso y sin cifras vencidas.
   Urgente: el lote vence al terminar el 5 de octubre.
2. Al siguiente build de iOS: comprobar en el simulador que la app abre y
   funciona con el parche de Expo.

### Pendiente para Víctor

1. Renovar el catálogo antes del 5 de octubre (o que Codex termine la tarea 1
   y la publique antes).
2. Crear los dos secretos de la copia en GitHub y lanzar la primera copia
   (`docs/COPIAS-DE-SEGURIDAD.md`, parte 1).
3. Unir esta rama a `main`. Las copias nocturnas solo funcionan desde `main`.
4. En la carpeta local, una vez: `git config user.name "Victor Jorques"` y tu
   correo de GitHub.
5. Si quieres que Claude revise la web real: permitir en la red del entorno
   `rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`.
