@echo off
REM ====================================================================
REM  RWAdar - instala de cero el esquema reproducible y seguro
REM
REM  Uso: instalar-base-de-datos.cmd REFERENCIA_DEL_PROYECTO
REM
REM  La credencial viene de la sesion del CLI o SUPABASE_ACCESS_TOKEN.
REM  Nunca se acepta como argumento. La version del CLI es exacta.
REM  13/16 historicos, el opt-in de correo 23 y los retratos quedan fuera.
REM ====================================================================
setlocal DisableDelayedExpansion
cd /d "%~dp0"
goto :inicio

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
echo   Uso: instalar-base-de-datos.cmd REFERENCIA_DEL_PROYECTO
echo   Configura SUPABASE_ACCESS_TOKEN de forma segura o inicia sesion en
echo   el CLI. Define RWADAR_SUPABASE_CLI_VERSION=MAJOR.MINOR.PATCH ^>= 2.79.0.
echo   Nunca pases el token como argumento.
echo.
exit /b 1

:cli_invalida
echo.
echo   Falta RWADAR_SUPABASE_CLI_VERSION o no es SemVer exacto.
echo   Se exige 2.79.0 o posterior; no se admiten latest, rangos ni sufijos.
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
echo   Referencia no valida: deben ser 20 letras minusculas o digitos.
echo.
exit /b 1

:cancelado
echo.
echo   Confirmacion incorrecta. No se ha enlazado ni cambiado ningun proyecto.
echo.
exit /b 2

:error
echo.
echo   HA FALLADO. Alguna migracion anterior puede haberse aplicado.
if defined ENLAZADO (
  echo   Ejecutando cierre de emergencia sin borrar datos ...
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\fallo_cerrado.sql"
  if errorlevel 1 (
    echo   ALERTA: el cierre automatico tambien fallo. Aisla el proyecto ahora.
  ) else (
    echo   Acceso cliente y salidas correo/push cerrados; retencion sigue activa.
  )
)
echo   Conserva la salida y no publiques hasta reparar y pasar los verificadores.
echo.
exit /b 1

:inicio

set "MIGRACIONES=db\01_schema.sql db\02_seed.sql db\03_app.sql db\04_rls.sql db\06_archax_republic.sql db\07_cuentas.sql db\08_perfil.sql db\09_opiniones.sql db\10_moderacion.sql db\11_fuga_cola.sql db\12_borrado_moderador.sql db\14_seguridad_integral.sql db\15_acl_funciones.sql db\17_avisos_push.sql db\18_emisiones.sql db\19_emisiones_estados.sql db\20_emisiones_realidad.sql db\21_emisiones_continuas.sql db\22_cierre_regresiones.sql"
set "CONTROLES=db\14_seguridad_integral_verificar.sql db\15_acl_funciones_verificar.sql db\22_cierre_regresiones_verificar.sql db\fresh_install_verificar.sql db\fallo_cerrado.sql"
set "REF=%~1"
set "ENLAZADO="

if not defined REF goto :uso
call :validar_ref
if errorlevel 1 goto :ref_invalida
call :validar_cli
if errorlevel 1 goto :cli_invalida

for %%F in (%MIGRACIONES% %CONTROLES%) do (
  if not exist "%%F" (
    echo.
    echo   Falta %%F. No se ha enlazado ni cambiado ningun proyecto.
    exit /b 1
  )
)

echo.
echo   OBJETIVO: proyecto Supabase %REF%
echo   FLUJO: 01-12, 14-15, 17-22; opt-in de correo 23 NO activado.
echo.
set "CONFIRMACION="
set /p "CONFIRMACION=   Escribe exactamente INSTALAR-%REF% para continuar: "
if not "%CONFIRMACION%"=="INSTALAR-%REF%" goto :cancelado

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

for %%F in (%MIGRACIONES%) do (
  echo.
  echo == Aplicando %%F ...
  call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "%%F"
  if errorlevel 1 goto :error
)

echo.
echo == Verificacion fail-closed ...
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\14_seguridad_integral_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\15_acl_funciones_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\22_cierre_regresiones_verificar.sql"
if errorlevel 1 goto :error
call npx --yes supabase@%RWADAR_SUPABASE_CLI_VERSION% db query --linked -f "db\fresh_install_verificar.sql"
if errorlevel 1 goto :error

echo.
echo   LISTO. Fresh-install 26 + 4 y emisiones instalado y verificado.
echo   PUSH sigue APAGADO y sin cron. Solo activar-push.cmd puede habilitarlo
echo   tras una validacion E2E explicita. La retencion diaria queda activa.
echo   El correo sigue bloqueado hasta el opt-in seguro 23 mediante aplicar-envio-avisos.cmd.
echo.
exit /b 0
