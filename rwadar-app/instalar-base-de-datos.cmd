@echo off
REM ====================================================================
REM  RWAdar - instala el esquema completo en un proyecto de Supabase
REM
REM  Uso:  instalar-base-de-datos.cmd TOKEN [REFERENCIA_DEL_PROYECTO]
REM
REM  Aplica db\01_schema.sql .. db\04_rls.sql en orden. Esos cuatro
REM  ficheros son la instalacion entera: no hay ningun "todo en uno".
REM ====================================================================
setlocal enabledelayedexpansion

if "%~1"=="" (
  echo.
  echo   Falta el token de acceso.
  echo.
  echo   1^) Entra en https://supabase.com/dashboard/account/tokens
  echo   2^) Pulsa "Generate new token" y ponle el nombre "rwadar"
  echo   3^) Copia el token y ejecuta:
  echo.
  echo        instalar-base-de-datos.cmd sbp_xxxxxxxxxxxxx
  echo.
  echo   El segundo parametro es opcional: la referencia del proyecto de
  echo   Supabase donde instalar. Por omision, el de RWAdar.
  echo.
  exit /b 1
)

set "SUPABASE_ACCESS_TOKEN=%~1"
set "REF=%~2"
if "%REF%"=="" set "REF=exgpmjpaaebyoolpwced"
cd /d "%~dp0"

echo.
echo == Enlazando con el proyecto %REF% ...
call npx --yes supabase@latest link --project-ref %REF% --yes
if errorlevel 1 goto :error

for %%F in (01_schema 02_seed 03_app 04_rls) do (
  echo.
  echo == Aplicando db\%%F.sql ...
  call npx --yes supabase@latest db query --linked -f "db\%%F.sql"
  if errorlevel 1 goto :error
)

echo.
echo == Comprobando ...
call npx --yes supabase@latest db query --linked "select estado, count(*) from plataformas group by estado;"
call npx --yes supabase@latest db query --linked "select count(*) as descartadas_sin_fuente from descartadas_sin_fuente;"

echo.
echo   LISTO. "descartadas_sin_fuente" tiene que salir a 0.
echo   Revoca el token en https://supabase.com/dashboard/account/tokens
echo.
exit /b 0

:error
echo.
echo   Ha fallado el paso de arriba. Nada mas se ha aplicado.
echo.
exit /b 1
