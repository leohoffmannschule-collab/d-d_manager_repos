@echo off
rem  Abenteuer-Almanach starten - zum Doppelklicken.
rem
rem  Dieses Fenster ist der Almanach. Solange es offen ist, laeuft er;
rem  schliesst man es, ist Schluss. Beenden auch mit Strg+C.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js ist auf diesem Rechner nicht zu finden.
  echo   Zu holen unter https://nodejs.org - die LTS-Fassung genuegt.
  echo.
  pause
  exit /b 1
)

node scripts\start.mjs %*

rem  Ohne diese Zeile schliesst sich das Fenster nach einem Fehler sofort
rem  wieder - und man sieht nie, woran es lag.
echo.
pause
