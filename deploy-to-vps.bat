@echo off
REM ============================================
REM Script para Subir Archivos al VPS
REM Usando SCP (Secure Copy)
REM Para Windows (Local)
REM ============================================

chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================
echo   Deploy de Mejoras de Carnets al VPS
echo   ScoreDomino v2.0
echo ============================================
echo.

REM ============================================
REM Configuracion del VPS
REM ============================================
echo [INFO] Configuracion del servidor VPS
echo.

set /p "VPS_HOST=IP o dominio del VPS: "
set /p "VPS_USER=Usuario SSH [root]: " || set "VPS_USER=root"
set /p "VPS_PATH=Ruta del proyecto en VPS [/var/www/domino-api]: " || set "VPS_PATH=/var/www/domino-api"
set /p "VPS_PORT=Puerto SSH [22]: " || set "VPS_PORT=22"

echo.
echo Configuracion:
echo   Host: !VPS_HOST!
echo   Usuario: !VPS_USER!
echo   Ruta: !VPS_PATH!
echo   Puerto: !VPS_PORT!
echo.

set /p "confirm=¿Es correcta la configuracion? (s/n): "
if /i not "!confirm!"=="s" (
    echo [INFO] Configuracion cancelada
    pause
    exit /b 0
)

REM ============================================
REM Verificar que SCP esta disponible
REM ============================================
echo.
echo [INFO] Verificando SCP...

where scp.exe >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] SCP no encontrado
    echo.
    echo Por favor, instala OpenSSH Client:
    echo   1. Configuracion ^> Aplicaciones ^> Caracteristicas opcionales
    echo   2. Agregar caracteristica
    echo   3. Buscar "Cliente OpenSSH" e instalar
    echo.
    echo O usa WinSCP, FileZilla, o cualquier cliente SFTP
    pause
    exit /b 1
)

echo [OK] SCP encontrado

REM ============================================
REM Crear archivo temporal con lista de archivos
REM ============================================
echo.
echo [INFO] Preparando archivos para subir...

set TEMP_DIR=temp_deploy
if exist "!TEMP_DIR!" rmdir /s /q "!TEMP_DIR!"
mkdir "!TEMP_DIR!"

REM Copiar archivos necesarios al directorio temporal
echo [INFO] Copiando archivos...

REM Base de datos
xcopy /Y "database\schema-carnets-configuracion.sql" "!TEMP_DIR!\database\" >nul
if !errorlevel! equ 0 (echo [OK] schema-carnets-configuracion.sql) else (echo [ERROR] schema-carnets-configuracion.sql)

REM Controladores
xcopy /Y "src\controllers\carnetConfigController.js" "!TEMP_DIR!\src\controllers\" >nul
if !errorlevel! equ 0 (echo [OK] carnetConfigController.js) else (echo [ERROR] carnetConfigController.js)

REM Rutas
xcopy /Y "src\routes\carnetConfigRoutes.js" "!TEMP_DIR!\src\routes\" >nul
if !errorlevel! equ 0 (echo [OK] carnetConfigRoutes.js) else (echo [ERROR] carnetConfigRoutes.js)

REM App.js modificado
xcopy /Y "src\app.js" "!TEMP_DIR!\src\" >nul
if !errorlevel! equ 0 (echo [OK] app.js) else (echo [ERROR] app.js)

REM HTML
xcopy /Y "public\mis-carnets.html" "!TEMP_DIR!\public\" >nul
if !errorlevel! equ 0 (echo [OK] mis-carnets.html) else (echo [ERROR] mis-carnets.html)

xcopy /Y "public\admin-carnets.html" "!TEMP_DIR!\public\" >nul
if !errorlevel! equ 0 (echo [OK] admin-carnets.html) else (echo [ERROR] admin-carnets.html)

REM Script de instalacion
xcopy /Y "install-carnets-mejoras.sh" "!TEMP_DIR!\" >nul
if !errorlevel! equ 0 (echo [OK] install-carnets-mejoras.sh) else (echo [ERROR] install-carnets-mejoras.sh)

REM Documentacion
xcopy /Y "MEJORAS_CARNETS.md" "!TEMP_DIR!\" >nul
if !errorlevel! equ 0 (echo [OK] MEJORAS_CARNETS.md) else (echo [ERROR] MEJORAS_CARNETS.md)

REM ============================================
REM Subir archivos al VPS
REM ============================================
echo.
echo [INFO] Subiendo archivos al VPS...
echo [INFO] Se te pedira la contraseña SSH
echo.

REM Crear directorio de destino si no existe
echo [INFO] Creando directorios en el VPS...
ssh -p !VPS_PORT! !VPS_USER!@!VPS_HOST! "mkdir -p !VPS_PATH!/database !VPS_PATH!/src/controllers !VPS_PATH!/src/routes !VPS_PATH!/public"

REM Subir archivos usando SCP
echo.
echo [INFO] Transfiriendo archivos...

scp -P !VPS_PORT! -r "!TEMP_DIR!\*" !VPS_USER!@!VPS_HOST!:!VPS_PATH!/

if !errorlevel! equ 0 (
    echo.
    echo [OK] Archivos subidos correctamente al VPS
) else (
    echo.
    echo [ERROR] Error al subir archivos
    echo [INFO] Verifica:
    echo   - Credenciales SSH correctas
    echo   - Servidor VPS accesible
    echo   - Permisos en el directorio destino
    rmdir /s /q "!TEMP_DIR!"
    pause
    exit /b 1
)

REM ============================================
REM Ejecutar instalacion en el VPS
REM ============================================
echo.
set /p "run_install=¿Ejecutar script de instalacion en el VPS? (s/n): "

if /i "!run_install!"=="s" (
    echo.
    echo [INFO] Ejecutando instalacion remota...
    echo [INFO] Esto puede tardar unos minutos...
    echo.

    REM Dar permisos de ejecucion al script
    ssh -p !VPS_PORT! !VPS_USER!@!VPS_HOST! "chmod +x !VPS_PATH!/install-carnets-mejoras.sh"

    REM Ejecutar el script de instalacion
    ssh -p !VPS_PORT! -t !VPS_USER!@!VPS_HOST! "cd !VPS_PATH! && ./install-carnets-mejoras.sh"

    if !errorlevel! equ 0 (
        echo.
        echo [OK] Instalacion completada en el VPS
    ) else (
        echo.
        echo [WARN] Hubo un problema en la instalacion
        echo [INFO] Puedes ejecutar manualmente:
        echo   ssh !VPS_USER!@!VPS_HOST!
        echo   cd !VPS_PATH!
        echo   chmod +x install-carnets-mejoras.sh
        echo   ./install-carnets-mejoras.sh
    )
)

REM ============================================
REM Limpiar archivos temporales
REM ============================================
echo.
echo [INFO] Limpiando archivos temporales...
rmdir /s /q "!TEMP_DIR!"
echo [OK] Archivos temporales eliminados

REM ============================================
REM Resumen final
REM ============================================
echo.
echo ============================================
echo [OK] ¡Deploy completado!
echo ============================================
echo.
echo [INFO] Archivos subidos a:
echo   !VPS_HOST!:!VPS_PATH!
echo.
echo [INFO] Proximos pasos en el VPS:
echo   1. Conéctate por SSH:
echo      ssh !VPS_USER!@!VPS_HOST!
echo.
echo   2. Ve al directorio del proyecto:
echo      cd !VPS_PATH!
echo.
echo   3. Si no ejecutaste el script, ejecútalo:
echo      chmod +x install-carnets-mejoras.sh
echo      ./install-carnets-mejoras.sh
echo.
echo   4. Reinicia el servidor:
echo      pm2 restart all
echo      # o
echo      npm start
echo.
echo [INFO] Verifica que todo funciona:
echo   http://!VPS_HOST!/mis-carnets.html
echo.
echo ============================================
echo [OK] ¡Sistema actualizado exitosamente!
echo ============================================
echo.

pause
exit /b 0
