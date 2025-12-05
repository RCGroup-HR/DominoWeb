@echo off
echo ========================================
echo   SUBIR CAMBIOS AL VPS - ScoreDomino
echo ========================================
echo.

REM Configuracion - EDITA ESTOS VALORES
set VPS_USER=root
set VPS_HOST=tu-vps-ip-o-dominio.com
set VPS_PATH=/var/www/domino-api
set SSH_KEY=C:\Users\RonnieHdez\.ssh\id_rsa

echo [1/4] Subiendo archivos nuevos y modificados...
scp -i "%SSH_KEY%" "database\schema-carnets-configuracion.sql" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/database/
scp -i "%SSH_KEY%" "src\controllers\carnetConfigController.js" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/src/controllers/
scp -i "%SSH_KEY%" "src\routes\carnetConfigRoutes.js" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/src/routes/
scp -i "%SSH_KEY%" "src\app.js" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/src/
scp -i "%SSH_KEY%" "public\mis-carnets.html" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/public/
scp -i "%SSH_KEY%" "public\admin-carnets.html" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/public/
scp -i "%SSH_KEY%" "MEJORAS_CARNETS.md" %VPS_USER%@%VPS_HOST%:%VPS_PATH%/

echo.
echo [2/4] Creando directorio para logos...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "mkdir -p %VPS_PATH%/public/uploads/logos && chmod 755 %VPS_PATH%/public/uploads/logos"

echo.
echo [3/4] Ejecutando script de base de datos...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && mysql -u usuario_db -p'password_db' nombre_db < database/schema-carnets-configuracion.sql"

echo.
echo [4/4] Reiniciando servidor Node.js...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && pm2 restart domino-api || npm start"

echo.
echo ========================================
echo   DEPLOY COMPLETADO!
echo ========================================
echo.
pause
