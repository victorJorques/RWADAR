@echo off
REM ====================================================================
REM  RWAdar - activa PUSH solo tras una validacion E2E aprobada
REM
REM  Uso: activar-push.cmd REFERENCIA_DEL_PROYECTO
REM
REM  Requiere credencial en SUPABASE_ACCESS_TOKEN, version CLI exacta y
REM  RWADAR_PUSH_E2E_APROBADO=SI. Nunca forma parte del fresh-install.
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
if /i not "%RWADAR_PUSH_E2E_APROBADO%"=="SI" goto :e2e_ausente

for %%F in (
  db\14_seguridad_integral_verificar.sql
  db\15_acl_funciones_verificar.sql
  db\22_cierre_regresiones_verificar.sql
  db\activar_push.sql
  db\activar_push_verificar.sql
  db\push_fallo_cerrado.sql
) do if not exist "%%F" goto :control_ausente

echo.
echo   OBJETIVO: proyecto Supabase %REF%
echo   ACCION: habilitar llamadas PUSH reales a Expo cada dos minutos.
echo   E2E: RWADAR_PUSH_E2E_APROBADO=SI detectado.
echo.
set "CONFIRMACION="
set /p "CONFIRMACION=   Escribe ACTIVAR-PUSH-E2E-%REF% para continuar: "
if not "%CONFIRMACION%"=="ACTIVAR-PUSH-E2E-%REF%" goto :cancelado

echo   Credencial: SUPABASE_ACCESS_TOKEN detectada ^(valor oculto^).
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --help >nul 2>&1
if errorlevel 1 goto :cli_incompatible

call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% link --project-ref "%REF%" --yes
if errorlevel 1 goto :error
set "ENLAZADO=1"

REM El estado de partida debe ser el cierre 22 verificado y apagado.
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\14_seguridad_integral_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\15_acl_funciones_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\22_cierre_regresiones_verificar.sql"
if errorlevel 1 goto :error

call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\activar_push.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\activar_push_verificar.sql"
if errorlevel 1 goto :error

echo.
echo   PUSH ACTIVADO. Interruptor, ACL, retencion y reloj verificados.
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
echo   Uso: activar-push.cmd REFERENCIA_DEL_PROYECTO
echo   Requiere SUPABASE_ACCESS_TOKEN, RWADAR_PUSH_E2E_APROBADO=SI y
echo   RWADAR_SUPABASE_CLI_VERSION=MAJOR.MINOR.PATCH exacto ^>= 2.79.0.
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
:e2e_ausente
echo   Falta RWADAR_PUSH_E2E_APROBADO=SI. El push permanece apagado.
exit /b 1
:control_ausente
echo   Falta SQL de activacion, cierre o verificacion. No se ha enlazado.
exit /b 1
:cli_incompatible
echo   La CLI fijada no ofrece supabase db query. No se ha enlazado.
exit /b 1
:cancelado
echo   Confirmacion incorrecta. El push permanece apagado.
exit /b 2

:error
echo.
echo   HA FALLADO LA ACTIVACION PUSH.
if defined ENLAZADO (
  echo   Ejecutando cierre limitado al push; API y retencion siguen operativas ...
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\push_fallo_cerrado.sql"
  if errorlevel 1 echo   ALERTA: el cierre push tambien fallo; aisla el reloj manualmente.
)
echo   No anuncies entregas hasta repetir E2E y superar el verificador.
echo.
exit /b 1
