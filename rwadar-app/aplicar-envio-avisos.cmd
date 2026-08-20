@echo off
REM ====================================================================
REM  RWAdar - activa deliberadamente el envio de avisos por correo
REM
REM  Uso: aplicar-envio-avisos.cmd REFERENCIA_DEL_PROYECTO
REM
REM  Flujo separado y reforzado para 13_envio_avisos.sql. Requiere que
REM  Vault, Brevo y la politica operativa esten aprobados y configurados.
REM  RWADAR_SUPABASE_CLI_VERSION debe ser un SemVer exacto validado.
REM ====================================================================
setlocal DisableDelayedExpansion
cd /d "%~dp0"

set "REF=%~1"
set "ENLAZADO="
if not defined REF goto :uso
call :validar_ref
if errorlevel 1 goto :ref_invalida
call :validar_cli
if errorlevel 1 goto :cli_invalida
for %%F in (
  db\13_envio_avisos.sql db\15_acl_funciones.sql
  db\22_cierre_regresiones.sql db\15_acl_funciones_verificar.sql
  db\22_cierre_regresiones_verificar.sql db\fallo_cerrado.sql
) do if not exist "%%F" goto :control_ausente

echo.
echo   ATENCION: este flujo activa pg_cron/pg_net y el ciclo de correo.
echo   OBJETIVO: proyecto Supabase %REF%
echo   Verifica antes Vault, remitente, DPA y prueba de entrega.
echo.
set "CONFIRMACION="
set /p "CONFIRMACION=   Escribe ACTIVAR-ENVIO-%REF% para continuar: "
if not "%CONFIRMACION%"=="ACTIVAR-ENVIO-%REF%" goto :cancelado

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
echo == Aplicando db\13_envio_avisos.sql ...
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\13_envio_avisos.sql"
if errorlevel 1 goto :error

REM Reaplicar 15 y 22 es idempotente y garantiza que los helpers internos
REM mantienen ACL/search_path cerrados tras activar componentes opcionales.
echo.
echo == Reafirmando ACL y ejecutando el verificador ...
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\15_acl_funciones.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\22_cierre_regresiones.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\15_acl_funciones_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\22_cierre_regresiones_verificar.sql"
if errorlevel 1 goto :error

echo.
echo   LISTO. Envio 13 activado deliberadamente en %REF% y ACL/22 verificados.
echo   PUSH queda APAGADO; si algun dia supera E2E se activa por separado.
echo   Comprueba una entrega real y los reintentos antes de anunciarlo.
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
echo   Falta la referencia explicita del proyecto Supabase.
echo   Uso: aplicar-envio-avisos.cmd REFERENCIA_DEL_PROYECTO
echo.
echo   La credencial procede del CLI o de SUPABASE_ACCESS_TOKEN; nunca
echo   se acepta como argumento ni se imprime.
echo   Define RWADAR_SUPABASE_CLI_VERSION=MAJOR.MINOR.PATCH con la version
echo   exacta previamente validada y registrada por el equipo.
echo   La version minima compatible es 2.79.0.
echo.
exit /b 1

:cli_invalida
echo.
echo   Falta RWADAR_SUPABASE_CLI_VERSION o no es SemVer exacto.
echo   Se exige 2.79.0 o posterior; no se admiten "latest", rangos ni sufijos.
echo   El envio no se ha activado y no se ha enlazado el proyecto.
echo.
exit /b 1

:cli_incompatible
echo.
echo   La CLI fijada no ofrece "supabase db query" con ficheros SQL.
echo   El envio no se ha activado y no se ha enlazado el proyecto.
echo.
exit /b 1

:control_ausente
echo.
echo   Falta SQL necesario, un verificador o db\fallo_cerrado.sql.
echo   El envio no se ha activado y no se ha enlazado el proyecto.
echo.
exit /b 1

:ref_invalida
echo.
echo   Referencia no valida. No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 1

:cancelado
echo.
echo   Frase incorrecta. El envio NO se ha activado y no se enlazo el proyecto.
echo.
exit /b 2

:error
echo.
echo   HA FALLADO la activacion. Conserva la salida, revisa el estado exacto
if defined ENLAZADO (
  echo   Ejecutando cierre de emergencia sin borrar datos ...
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\fallo_cerrado.sql"
  if errorlevel 1 (
    echo   ALERTA: el cierre automatico tambien fallo. Aisla el proyecto ahora.
  ) else (
    echo   Acceso cliente y salidas correo/push cerrados; retencion sigue activa.
  )
)
echo   No anuncies el correo hasta reparar, verificar y probar una entrega real.
echo.
exit /b 1
