@echo off
chcp 65001 >nul
echo ========================================
echo   DEPLOY AUTOMATICO - ScoreDomino
echo ========================================
echo.

REM ===== EDITA ESTOS DATOS =====
set VPS_IP=38.242.218.24
set VPS_USER=root
set VPS_PASS=TU_PASSWORD_VPS_AQUI
set VPS_PATH=/var/www/DominoWeb
set DB_USER=root
set DB_PASS=TU_PASSWORD_MYSQL_AQUI
set DB_NAME=scoredominio
REM =============================

echo [1/6] Git push...
git add .
git reset node_modules 2>nul
git commit -m "ScoreDomino"
git push origin interesting-grothendieck 2>nul || git push

echo.
echo [2/6] Conectando al VPS y haciendo git pull...
plink -batch -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && git pull"

echo.
echo [3/6] Creando directorio de logos...
plink -batch -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "mkdir -p %VPS_PATH%/public/uploads/logos && chmod 755 %VPS_PATH%/public/uploads/logos"

echo.
echo [4/6] Ejecutando SQL...
plink -batch -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && mysql -u %DB_USER% -p'%DB_PASS%' %DB_NAME% < database/schema-carnets-configuracion.sql"

echo.
echo [5/6] Reiniciando servidor...
plink -batch -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && pm2 restart scoredominio --update-env"

echo.
echo [6/6] Verificando logs...
plink -batch -pw %VPS_PASS% %VPS_USER%@%VPS_IP% "pm2 logs scoredominio --lines 20 --nostream"

echo.
echo ========================================
echo   ✅ COMPLETADO!
echo ========================================
echo.
echo Prueba en: https://scoredomino.com/mis-carnets.html
echo.
pause
