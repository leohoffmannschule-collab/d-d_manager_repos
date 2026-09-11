@echo off
rem  Den Weg von aussen aufmachen - zum Doppelklicken.
rem
rem  Dieses Fenster ist die Leitung: Solange es offen ist, erreicht die Runde
rem  den Almanach von ueberall. Schliesst man es, ist der Weg wieder zu -
rem  der Almanach selbst laeuft davon unbeirrt weiter, der steht im anderen
rem  Fenster. Beenden auch mit Strg+C.
rem
rem  Zuerst starten.cmd, dann diese Datei. Zwei Fenster also.
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

node scripts\tunnel.mjs %*

rem  Ohne diese Zeile schliesst sich das Fenster nach einem Fehler sofort
rem  wieder - und man sieht nie, woran es lag.
echo.
pause
