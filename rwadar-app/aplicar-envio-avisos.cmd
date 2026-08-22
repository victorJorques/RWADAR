@echo off
REM ====================================================================
REM  RWAdar - activa correo Brevo con el opt-in seguro posterior a 22
REM
REM  Uso: aplicar-envio-avisos.cmd REFERENCIA_DEL_PROYECTO
REM
REM  Nunca aplica el historico 13 ni reaplica 22 despues de activar. Requiere
REM  credencial explicita, CLI fijada y aprobacion de proveedor/privacidad.
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
if not defined SUPABASE_ACCESS_TOKEN goto :credencial_ausente
if /i not "%RWADAR_CORREO_PROVEEDOR_APROBADO%"=="SI" goto :aprobacion_ausente
if /i not "%RWADAR_CORREO_PRIVACIDAD_APROBADA%"=="SI" goto :aprobacion_ausente

for %%F in (
  db\14_seguridad_integral_verificar.sql
  db\15_acl_funciones_verificar.sql
  db\23_activar_correo.sql
  db\23_activar_correo_verificar.sql
  db\correo_fallo_cerrado.sql
) do if not exist "%%F" goto :control_ausente

echo.
echo   OBJETIVO: proyecto Supabase %REF%
echo   ACCION: habilitar correo real por Brevo cada cinco minutos.
echo   ORIGEN: https://rwadar.pages.dev
echo   Vault debe contener BREVO_API_KEY y RWADAR_REMITENTE validos.
echo.
set "CONFIRMACION="
set /p "CONFIRMACION=   Escribe ACTIVAR-CORREO-BREVO-%REF% para continuar: "
if not "%CONFIRMACION%"=="ACTIVAR-CORREO-BREVO-%REF%" goto :cancelado

echo   Credencial: SUPABASE_ACCESS_TOKEN detectada ^(valor oculto^).
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --help >nul 2>&1
if errorlevel 1 goto :cli_incompatible

call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% link --project-ref "%REF%" --yes
if errorlevel 1 goto :error
set "ENLAZADO=1"

REM 14/15 comprueban la base de seguridad. 23 verifica por si misma los
REM marcadores de 22 y admite la primera aplicacion y la reaplicacion idempotente.
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\14_seguridad_integral_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\15_acl_funciones_verificar.sql"
if errorlevel 1 goto :error

call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\23_activar_correo.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\23_activar_correo_verificar.sql"
if errorlevel 1 goto :error

echo.
echo   CORREO CONFIGURADO: flag, Vault, ACL, HTML, origen y reloj verificados.
echo   Haz una prueba controlada: Brevo debe aceptar con 201 y messageId.
echo   No anuncies entrega hasta confirmar Delivered o el buzon real.
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
echo   Uso: aplicar-envio-avisos.cmd REFERENCIA_DEL_PROYECTO
echo   Requiere SUPABASE_ACCESS_TOKEN, RWADAR_CORREO_PROVEEDOR_APROBADO=SI,
echo   RWADAR_CORREO_PRIVACIDAD_APROBADA=SI y una version CLI exacta.
echo.
exit /b 1

:ref_invalida
echo   Referencia no valida. No se ha enlazado ni cambiado ningun proyecto.
exit /b 1
:cli_invalida
echo   La version CLI falta o no es SemVer exacto ^>= 2.79.0.
exit /b 1
:credencial_ausente
echo   Falta SUPABASE_ACCESS_TOKEN. No se admite activacion por sesion implicita.
exit /b 1
:aprobacion_ausente
echo   Faltan las aprobaciones explicitas de proveedor y privacidad.
echo   El correo permanece apagado.
exit /b 1
:control_ausente
echo   Falta SQL de activacion, cierre o verificacion. No se ha enlazado.
exit /b 1
:cli_incompatible
echo   La CLI fijada no ofrece supabase db query. No se ha enlazado.
exit /b 1
:cancelado
echo   Confirmacion incorrecta. El correo permanece apagado.
exit /b 2

:error
echo.
echo   HA FALLADO LA ACTIVACION DE CORREO.
if defined ENLAZADO (
  echo   Ejecutando cierre limitado al correo; API, push y retencion siguen operativos ...
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\correo_fallo_cerrado.sql"
  if errorlevel 1 echo   ALERTA: el cierre de correo tambien fallo; aisla el reloj manualmente.
)
echo   No anuncies el correo hasta reparar y repetir la prueba E2E.
echo.
exit /b 1
