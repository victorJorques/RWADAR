@echo off
REM ====================================================================
REM  RWAdar - pone la base de datos al dia
REM
REM  Doble clic: pide el token y aplica TODAS las migraciones de la 06
REM  en adelante, en orden.
REM
REM  Se pueden repetir sin miedo: todas estan escritas para poder
REM  aplicarse dos veces sin duplicar ni romper nada (create ... if not
REM  exists, on conflict do nothing, create or replace). Si alguna se
REM  quedo a medias alguna vez, esto la termina.
REM
REM  Desde consola tambien vale:  aplicar-sql.cmd TOKEN [fichero.sql]
REM ====================================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"
title RWAdar - poner la base de datos al dia

set "TOKEN=%~1"
set "UNO=%~2"
set "INTERACTIVO="
if "%TOKEN%"=="" set "INTERACTIVO=1"

if defined INTERACTIVO (
  echo.
  echo   ==================================================
  echo    RWAdar - poner la base de datos al dia
  echo   ==================================================
  echo.
  echo   Se van a aplicar estas migraciones, en orden:
  echo.
  for %%F in (db\0[6-9]_*.sql db\1?_*.sql) do echo      - %%~nxF
  echo.
  echo   Necesito un token de Supabase:
  echo   https://supabase.com/dashboard/account/tokens
  echo   Boton verde "Generate new token", copia el valor
  echo   ^(empieza por sbp_^) y pegalo aqui con CLIC DERECHO.
  echo.
  set /p "TOKEN=   Token: "
  echo.
)

if "%TOKEN%"=="" (
  echo   No has pegado nada. No se ha cambiado nada.
  goto :fin
)

set "SUPABASE_ACCESS_TOKEN=%TOKEN%"
set "REF=exgpmjpaaebyoolpwced"

echo   Conectando con el proyecto...
echo   ^(la primera vez tarda: se descarga la herramienta^)
echo.
call npx --yes supabase@latest link --project-ref %REF% --yes
if errorlevel 1 goto :error

if not "%UNO%"=="" (
  echo   Aplicando %UNO% ...
  call npx --yes supabase@latest db query --linked -f "%UNO%"
  if errorlevel 1 goto :error
  goto :bien
)

for %%F in (db\0[6-9]_*.sql db\1?_*.sql) do (
  echo.
  echo   -- %%~nxF
  call npx --yes supabase@latest db query --linked -f "%%F"
  if errorlevel 1 goto :error
)

:bien
echo.
echo   ==================================================
echo    LISTO. La base de datos esta al dia.
echo   ==================================================
echo.
echo   AHORA REVOCA EL TOKEN, que ya no hace falta:
echo   https://supabase.com/dashboard/account/tokens
echo   Los tres puntos a la derecha - Revoke
echo.
goto :fin

:error
echo.
echo   ==================================================
echo    HA FALLADO en el paso de arriba.
echo   ==================================================
echo.
echo   Lo anterior si se aplico. Copia el error y enseñaselo
echo   a Claude; volver a ejecutar esto es seguro.
echo.

:fin
if defined INTERACTIVO (
  echo.
  pause
)
endlocal
