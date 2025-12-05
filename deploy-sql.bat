@echo off
echo ========================================
echo   SOLO EJECUTAR SQL - ScoreDomino
echo ========================================
echo.
echo Este script SOLO ejecuta el SQL de configuracion
echo (Si ya hiciste git push antes)
echo.

REM === EDITA ESTOS DATOS ===
set DB_USER=tu_usuario_mysql
set DB_PASS=tu_password_mysql
set DB_NAME=tu_base_datos

echo Ejecutando SQL en el servidor...
ssh root@38.242.218.24 "cd /var/www/DominoWeb && mysql -u %DB_USER% -p'%DB_PASS%' %DB_NAME% < database/schema-carnets-configuracion.sql"

IF ERRORLEVEL 1 (
    echo.
    echo ERROR: No se pudo ejecutar el SQL
    echo Verifica usuario/password de MySQL
    pause
    exit /b 1
)

echo.
echo SQL ejecutado correctamente!
echo.
pause
