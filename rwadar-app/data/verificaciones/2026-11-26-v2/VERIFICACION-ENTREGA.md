# Verificación de la entrega 2026-11-26 (comprobación determinista)

Generado por `motor.mjs auditar 2026-11-26`. Compara el SQL que vieron los revisores con el de después de corregir.

**Veredicto:** CONFORME. La corrección no cambió el SQL: basta esta comprobación determinista y no hace falta el auditor.

- SQL revisado (antes de corregir): `9b75ebf164c08e1cc1df6c29c79d515b8bfe960cff92781ac3fe644ccf527125` (es el que dio el montador).
- SQL final: `9b75ebf164c08e1cc1df6c29c79d515b8bfe960cff92781ac3fe644ccf527125`.
- Rehecho dos veces desde decisiones.json en una carpeta aparte: mismos SHA-256 las dos veces: sí; igual byte a byte a lo de la carpeta: sí.
- Mismo inventario de sentencias antes y después: sí (288 sentencias: 35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias que cambian (sin contar la revisión y la huella): 0.
- Ensayo en PGlite: correcto, 18 comprobaciones y 6 casos de fallo.
- Escáner de secretos sobre lo que irá a Git: sin hallazgos.

## Hallazgos

Ninguno.
