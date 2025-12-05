@echo off
echo ========================================
echo   DEPLOY RAPIDO - ScoreDomino Carnets
echo ========================================
echo.
echo Este script usa RSYNC para subir cambios.
echo Necesitas tener Git Bash o WSL instalado.
echo.
echo INSTRUCCIONES:
echo 1. Edita este archivo con tus datos del VPS
echo 2. Ejecuta: .\deploy-simple.bat
echo.

REM === EDITA ESTOS VALORES ===
set VPS_USER=root
set VPS_HOST=tu-ip-del-vps.com
set VPS_PATH=/var/www/domino-api
set DB_USER=usuario_mysql
set DB_PASS=password_mysql
set DB_NAME=nombre_base_datos

echo Conectando al VPS...
echo.

REM Usar rsync desde Git Bash
"C:\Program Files\Git\usr\bin\rsync.exe" -avz --progress ^
  --exclude "node_modules" ^
  --exclude ".git" ^
  --exclude ".env" ^
  ./ %VPS_USER%@%VPS_HOST%:%VPS_PATH%/

echo.
echo Archivos subidos. Ahora configurando en el VPS...
echo.

REM Ejecutar comandos en el VPS
ssh %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && ^
  mkdir -p public/uploads/logos && ^
  chmod 755 public/uploads/logos && ^
  mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < database/schema-carnets-configuracion.sql && ^
  pm2 restart all || npm start"

echo.
echo ========================================
echo   COMPLETADO!
echo ========================================
pause
