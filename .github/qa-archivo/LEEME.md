# Flujos de QA archivados (07/11/2026)

Estos cuatro flujos de GitHub Actions estaban en `.github/workflows/` y se
han movido aquí para que GitHub deje de cargarlos. **No se borran**: son la
receta de pruebas ya hechas y los citan las evidencias de `.github/qa-*`.

| Archivo | Para qué fue |
| --- | --- |
| `android-authenticated-140.yml` | QA privada del APK 1.4.0 con una cuenta de prueba confirmada |
| `android-session-lock-140.yml` | QA privada de la sesión y el bloqueo del sistema (APK 1.4.0) |
| `android-update-141.yml` | QA privada de la actualización en el sitio a la 1.4.1 |
| `web-chrome-141.yml` | QA privada de la sesión web en Chrome (1.4.1) |

## Por qué se archivan

- **Eran de un solo uso.** Cada uno se lanzó a mano para una versión concreta
  (1.4.0 y 1.4.1) y ya cumplió. La app publicada es la 1.4.2.
- **Fijan el repositorio `victorJorques/RWADAR`.** Comprueban
  `test "$GITHUB_REPOSITORY" = victorJorques/RWADAR` y consultan
  `gh api repos/victorJorques/RWADAR`. El repositorio se va a trasladar a la
  organización `rwadar`, y allí fallarían en el primer paso.
- **Salían en la lista de flujos de Actions** con el botón «Run workflow»,
  sin servir ya para nada, y un `push` a la rama `codex/android-140-auth-qa`
  los ponía en marcha (aunque su trabajo se saltaba).

## Si hiciera falta repetir una de estas pruebas

1. Copia el `.yml` a `.github/workflows/` en una rama aparte.
2. Cambia `victorJorques/RWADAR` por el repositorio donde esté entonces.
3. Revisa los APK, commits y huellas fijados: son los de aquella versión.
4. Lánzalo a mano con «Run workflow».

Ojo: `.github/qa-android-authenticated-140/test_candidate_c21_controls.py`
lee `../workflows/android-session-lock-140.yml`. Si se vuelve a ejecutar esa
prueba de Python, hay que apuntarla aquí (`../qa-archivo/…`). No la ejecuta
`npm test` ni ningún flujo.
