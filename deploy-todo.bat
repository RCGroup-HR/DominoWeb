@echo off
chcp 65001 >nul
echo ========================================
echo   DEPLOY COMPLETO - ScoreDomino
echo ========================================
echo.

REM ===== CONFIGURA ESTOS DATOS UNA SOLA VEZ =====
set VPS_IP=38.242.218.24
set VPS_USER=root
set VPS_PATH=/var/www/DominoWeb
set DB_USER=root
set DB_NAME=scoredominio
REM ============================================

echo [1/5] Git add, commit y push...
git add .
git reset node_modules 2>nul
git commit -m "ScoreDomino - Mejoras Carnets"
git push origin interesting-grothendieck 2>nul || git push

echo.
echo [2/5] Git pull en el servidor...
ssh %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && git pull"

echo.
echo [3/5] Creando directorio de logos...
ssh %VPS_USER%@%VPS_IP% "mkdir -p %VPS_PATH%/public/uploads/logos && chmod 755 %VPS_PATH%/public/uploads/logos"

echo.
echo [4/5] Ejecutando SQL de configuración...
echo NOTA: Se te pedirá la contraseña de MySQL
ssh -t %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && mysql -u %DB_USER% -p %DB_NAME% < database/schema-carnets-configuracion.sql"

echo.
echo [5/5] Reiniciando PM2...
ssh %VPS_USER%@%VPS_IP% "pm2 restart scoredominio --update-env"

echo.
echo ========================================
echo   ✅ DEPLOY COMPLETADO!
echo ========================================
echo.
echo Abre tu navegador en:
echo https://scoredomino.com/mis-carnets.html
echo.
echo Haz clic en "Nuevo Carnet" y verifica la vista previa
echo.
pause
