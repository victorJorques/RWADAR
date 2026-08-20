@echo off
REM ====================================================================
REM  RWAdar - aplica UNA migracion aprobada a un proyecto existente
REM
REM  Uso: aplicar-sql.cmd REFERENCIA_DEL_PROYECTO db\22_cierre_regresiones.sql
REM
REM  No hay destino ni fichero por defecto, no hay globs y no se aceptan
REM  credenciales por argumento. 13 usa su flujo separado; 16 y los
REM  retratos recuperados estan bloqueados.
REM ====================================================================
setlocal DisableDelayedExpansion
cd /d "%~dp0"

set "REF=%~1"
set "UNO=%~2"
set "PERMITIDO="
set "ENLAZADO="

if not defined REF goto :uso
if not defined UNO goto :uso
call :validar_ref
if errorlevel 1 goto :ref_invalida
call :validar_cli
if errorlevel 1 goto :cli_invalida

REM Los ficheros históricos solo se reproducen en orden mediante el instalador
REM nuevo. Algunos no son idempotentes y aislados dejan la cadena incompleta.
REM En un proyecto existente el único cambio aprobado hoy es el cierre 22.
if /i "%UNO%"=="db\22_cierre_regresiones.sql" set "PERMITIDO=1"

if not defined PERMITIDO goto :fichero_bloqueado
if not exist "%UNO%" goto :fichero_ausente
for %%F in (
  db\14_seguridad_integral_verificar.sql
  db\15_acl_funciones_verificar.sql
  db\22_cierre_regresiones_verificar.sql
  db\fresh_install_verificar.sql
  db\fallo_cerrado.sql
) do if not exist "%%F" goto :control_ausente

echo.
echo   OBJETIVO: proyecto Supabase %REF%
echo   FICHERO: %UNO%
echo.
set "CONFIRMACION="
set /p "CONFIRMACION=   Escribe APLICAR-%~nx2-%REF% para continuar: "
if not "%CONFIRMACION%"=="APLICAR-%~nx2-%REF%" goto :cancelado

if defined SUPABASE_ACCESS_TOKEN (
  echo   Credencial: SUPABASE_ACCESS_TOKEN detectada ^(valor oculto^).
) else (
  echo   Credencial: se usara la sesion ya configurada del CLI.
)

echo.
echo == Comprobando que la CLI fijada incluye db query ...
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --help >nul 2>&1
if errorlevel 1 goto :cli_incompatible

echo.
echo == Enlazando exclusivamente con %REF% ...
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% link --project-ref "%REF%" --yes
if errorlevel 1 goto :error
set "ENLAZADO=1"

echo.
echo == Aplicando %UNO% ...
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "%UNO%"
if errorlevel 1 goto :error

if /i "%~nx2"=="22_cierre_regresiones.sql" (
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\14_seguridad_integral_verificar.sql"
  if errorlevel 1 goto :error
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\15_acl_funciones_verificar.sql"
  if errorlevel 1 goto :error
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\22_cierre_regresiones_verificar.sql"
  if errorlevel 1 goto :error
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\fresh_install_verificar.sql"
  if errorlevel 1 goto :error
)

echo.
echo   LISTO. %UNO% aplicado y sus invariantes verificadas.
echo   PUSH queda APAGADO y sin cron; la retencion diaria queda activa.
echo.
exit /b 0

:validar_ref
if not "%REF:~20,1%"=="" exit /b 1
if "%REF:~19,1%"=="" exit /b 1
for /f "delims=abcdefghijklmnopqrstuvwxyz0123456789" %%A in ("%REF%") do exit /b 1
exit /b 0

:validar_cli
if not defined RWADAR_SUPABASE_CLI_VERSION exit /b 1
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -NonInteractive -Command "$v=$env:RWADAR_SUPABASE_CLI_VERSION; try { if (($v -cmatch '\A(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\z') -and ([version]$v -ge [version]'2.79.0')) { exit 0 } } catch {}; exit 1"
exit /b %errorlevel%

:uso
echo.
echo   Uso: aplicar-sql.cmd REFERENCIA_DEL_PROYECTO db\MIGRACION_APROBADA.sql
echo   La credencial procede del CLI o SUPABASE_ACCESS_TOKEN; nunca es un argumento.
echo   Define RWADAR_SUPABASE_CLI_VERSION=MAJOR.MINOR.PATCH exacto ^>= 2.79.0.
echo.
exit /b 1

:fichero_bloqueado
echo.
echo   Fichero no permitido. Solo se aprueba 22 para proyectos existentes.
echo   13 usa aplicar-envio-avisos.cmd; 01-21 solo van en el fresh-install.
echo   16 y 14-15_recuperado.sql NO se pueden ejecutar.
echo.
exit /b 1

:fichero_ausente
echo.
echo   No existe %UNO%. No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 1

:control_ausente
echo.
echo   Falta un verificador o db\fallo_cerrado.sql.
echo   No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 1

:cli_invalida
echo.
echo   Falta RWADAR_SUPABASE_CLI_VERSION o no es SemVer exacto.
echo   Se exige 2.79.0 o posterior porque versiones anteriores no tienen db query.
echo.
exit /b 1

:cli_incompatible
echo.
echo   La CLI fijada no ofrece "supabase db query" con ficheros SQL.
echo   No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 1

:ref_invalida
echo.
echo   Referencia no valida. No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 1

:cancelado
echo.
echo   Confirmacion incorrecta. No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 2

:error
echo.
echo   HA FALLADO. La migracion puede haberse aplicado parcialmente.
if defined ENLAZADO (
  echo   Ejecutando cierre de emergencia sin borrar datos ...
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\fallo_cerrado.sql"
  if errorlevel 1 (
    echo   ALERTA: el cierre automatico tambien fallo. Aisla el proyecto ahora.
  ) else (
    echo   Acceso cliente y salidas correo/push cerrados; retencion sigue activa.
  )
)
echo   Conserva la salida y no publiques hasta reparar y verificar el estado.
echo.
exit /b 1
