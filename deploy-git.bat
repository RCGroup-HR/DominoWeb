@echo off
echo ========================================
echo   DEPLOY AUTOMATICO - ScoreDomino
echo ========================================
echo.

REM === Tu Flujo de Trabajo Automatizado ===

echo [1/3] Subiendo cambios a GitHub...
cd /d "%~dp0"
git add .
git reset node_modules
git commit -m "ScoreDomino - Mejoras Carnets"
git push

IF ERRORLEVEL 1 (
    echo.
    echo ERROR: No se pudo hacer push a GitHub
    echo Verifica tu conexion o credenciales
    pause
    exit /b 1
)

echo.
echo [2/3] Conectando al servidor VPS...
echo.

REM Ejecutar comandos en el VPS
ssh root@38.242.218.24 "cd /var/www/DominoWeb && git pull && pm2 restart scoredominio && pm2 restart scoredominio --update-env"

echo.
echo [3/3] Ejecutando SQL de configuracion...
ssh root@38.242.218.24 "cd /var/www/DominoWeb && mysql -u tu_usuario -p'tu_password' tu_base_datos < database/schema-carnets-configuracion.sql"

echo.
echo ========================================
echo   DEPLOY COMPLETADO!
echo ========================================
echo.
echo La aplicacion se actualizo correctamente.
echo Abre: https://tu-dominio.com/mis-carnets.html
echo.
pause
