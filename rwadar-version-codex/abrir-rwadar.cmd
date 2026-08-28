@echo off
REM Doble clic para levantar RWAdar (version de Codex) en este ordenador.
REM Deja esta ventana abierta: si la cierras, se apaga el servidor.
title RWAdar - version de Codex
cd /d "%~dp0"
echo.
echo   Levantando RWAdar...
echo   En este ordenador:  http://localhost:4174
echo   Desde el movil:     escanea qr-movil.png
echo.
echo   NO CIERRES ESTA VENTANA mientras lo estes usando.
echo.
node servir.js --movil
pause
