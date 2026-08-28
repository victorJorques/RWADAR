# RWAdar · instrucciones internas

RWAdar es un proyecto **privado e interno**. La aplicación completa está
retirada de internet; los dos dominios públicos sirven únicamente la limpieza
de la antigua PWA. No desplegar la aplicación, reactivar servicios, aplicar
SQL remoto, publicar con EAS ni cambiar la visibilidad del repositorio sin una
petición explícita del usuario en el turno actual.

## Contexto mínimo

Lee primero `docs/INTERNO.md` y después solo los archivos necesarios para la
tarea. Para operar o probar, consulta `docs/RUNBOOK.md`. Los documentos de
`docs/archive/2026-08/` son fotografías históricas anteriores o simultáneas al
apagado: sirven como evidencia, pero no describen el estado vigente.

## Límites de seguridad

- Un Git privado no aísla la ejecución. La web y la app móvil locales todavía
  apuntan al Supabase de producción y pueden escribir si se inicia sesión.
- No ejecutar `--preview`, `--produccion`, Wrangler, Netlify, EAS, scripts
  `.cmd`, SQL remoto ni smokes con `*_MUTANTE=SI` sin autorización explícita.
- No recuperar credenciales desde historiales ni guardar secretos en Git. La
  clave publicable de Supabase es cliente, pero no debe duplicarse en docs.
- `rwadar-limpieza/` es infraestructura de retirada. No sustituirla en los
  dominios por la aplicación sin una decisión expresa de republicación.
- `rwadar-site/` es la fuente web. `rwadar-publicado/` y
  `rwadar-generated-source/` son generados y desechables.
- `rwadar-version-codex/` es un rescate forense del antiguo despliegue, no una
  segunda fuente ni un lugar para editar.
- No editar datos del catálogo dentro del HTML o JS: la fuente de verdad es
  Supabase. Ninguna plataforma descartada puede quedar sin una fuente citable.

## Forma de trabajar

- Localiza primero con `rg`; no leas enteros los manuales históricos, activos
  binarios, fuentes base64 ni artefactos generados salvo que la tarea lo exija.
- Ejecuta `git status --short --branch` antes y después de generadores.
- Usa pruebas del área afectada; para cambios transversales, `npm test`.
  Ninguna prueba local demuestra el estado de producción.
- Registra aquí solo reglas estables. Actualiza el estado y las decisiones en
  `docs/INTERNO.md`, sin volver a duplicarlas en varios manuales.
