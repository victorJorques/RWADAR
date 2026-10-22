@echo off
rem RWAdar · panel de control. Doble clic para abrirlo en el navegador.
rem Mientras esta ventana negra siga abierta, el panel funciona.
chcp 65001 >nul
title Panel de control de RWAdar
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo No encuentro Node.js en este ordenador. Instalalo desde https://nodejs.org y vuelve a probar.
  pause
  exit /b 1
)
node rwadar-panel\servidor.js --abrir
pause
