# Certificados públicos

## `supabase-ca.crt` (pendiente: aún no está)

La CA de Supabase. Con ella, `crear-token-base` (flujo «Dominio de correo»,
`rwadar-app/claves-comun.mjs`) conecta con `PGSSLMODE=verify-full`: psql
comprueba que el servidor es de verdad el de Supabase **antes** de mandarle el
token de Lettermint. Con `require`, que es lo que usan los demás flujos, la
conexión va cifrada, pero libpq acepta el certificado de cualquiera que se
ponga en medio.

- **De dónde sale:** Supabase › el proyecto RWAdar › Project Settings ›
  Database › SSL Configuration › **Download certificate**. Es público: no es
  una clave y se puede subir al repositorio. Lo descarga la sesión de Claude
  del PC de Víctor, con su Chrome.
- **Dónde va:** aquí, con el nombre exacto `supabase-ca.crt`, en un PR a
  `main`.
- **Cómo se comprueba que vale:** la primera vez que se lanza
  `crear-token-base`, su paso 1 solo lee la base (transacción de solo
  lectura) y ya usa `verify-full`. Si el certificado del «Session pooler» no
  cuelga de esta CA, para ahí con «TLS: no se pudo comprobar el certificado…»
  y no crea ningún token. La guía de Supabase da `sslmode=verify-full` con el
  host del pooler (https://supabase.com/docs/guides/platform/ssl-enforcement,
  consultada el 09/11/2026).
- **Después:** si sale bien, pasar a `verify-full` con esta misma CA los
  demás flujos que usan `SUPABASE_DB_URL` (copia, catálogo, avisos, correo,
  vigilante) y cambiar la regla común de `.github/flujos.test.mjs`.

Sin este archivo, `crear-token-base` para antes de hacer nada y explica cómo
conseguirlo.
