@echo off
REM ============================================
REM Script de Instalacion Automatica
REM Mejoras del Sistema de Carnets
REM Para Windows (Local)
REM ============================================

chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================
echo   Instalacion de Mejoras de Carnets
echo   ScoreDomino v2.0
echo ============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo [ERROR] Este script debe ejecutarse desde el directorio raiz del proyecto
    pause
    exit /b 1
)

echo [OK] Directorio del proyecto verificado
echo.

REM ============================================
REM 1. Crear directorio para logos
REM ============================================
echo [INFO] Creando directorio para logos...
if not exist "public\uploads\logos" (
    mkdir "public\uploads\logos"
    echo [OK] Directorio creado: public\uploads\logos
) else (
    echo [OK] Directorio ya existe: public\uploads\logos
)
echo.

REM ============================================
REM 2. Configuracion de Base de Datos
REM ============================================
echo [INFO] Configuracion de Base de Datos
echo.

REM Intentar leer del archivo .env
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=domino_db

if exist ".env" (
    echo [OK] Archivo .env encontrado
    REM Leer valores del .env (simplificado)
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="DB_HOST" set DB_HOST=%%b
        if "%%a"=="DB_USER" set DB_USER=%%b
        if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
        if "%%a"=="DB_NAME" set DB_NAME=%%b
    )
) else (
    echo [WARN] Archivo .env no encontrado
)

echo.
echo Valores actuales:
echo   Host: !DB_HOST!
echo   Usuario: !DB_USER!
echo   Base de datos: !DB_NAME!
echo.

set /p "confirm=¿Usar estos valores? (s/n): "
if /i not "!confirm!"=="s" (
    set /p "DB_HOST=Host de MySQL [!DB_HOST!]: " || set "DB_HOST=localhost"
    set /p "DB_USER=Usuario de MySQL [!DB_USER!]: " || set "DB_USER=root"
    set /p "DB_PASSWORD=Contraseña de MySQL: "
    set /p "DB_NAME=Nombre de la base de datos [!DB_NAME!]: " || set "DB_NAME=domino_db"
)

REM ============================================
REM 3. Ejecutar script SQL
REM ============================================
echo.
echo [INFO] Ejecutando script de base de datos...

REM Buscar mysql en rutas comunes
set MYSQL_PATH=
for %%P in (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
    "C:\xampp\mysql\bin\mysql.exe"
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
) do (
    if exist %%P (
        set MYSQL_PATH=%%P
        goto :mysql_found
    )
)

REM Buscar en PATH
where mysql.exe >nul 2>&1
if !errorlevel! equ 0 (
    set MYSQL_PATH=mysql.exe
    goto :mysql_found
)

echo [WARN] MySQL client no encontrado automaticamente
echo.
echo Por favor, ejecuta manualmente este comando:
echo   mysql -h !DB_HOST! -u !DB_USER! -p !DB_NAME! ^< database\schema-carnets-configuracion.sql
echo.
pause
goto :skip_sql

:mysql_found
echo [OK] MySQL encontrado: !MYSQL_PATH!
echo.

if "!DB_PASSWORD!"=="" (
    "!MYSQL_PATH!" -h !DB_HOST! -u !DB_USER! !DB_NAME! < database\schema-carnets-configuracion.sql
) else (
    "!MYSQL_PATH!" -h !DB_HOST! -u !DB_USER! -p!DB_PASSWORD! !DB_NAME! < database\schema-carnets-configuracion.sql
)

if !errorlevel! equ 0 (
    echo [OK] Script SQL ejecutado correctamente
    echo [OK] Tabla carnet_configuracion creada
    echo [OK] Configuraciones por defecto insertadas
) else (
    echo [ERROR] Error al ejecutar el script SQL
    echo.
    echo Por favor, ejecuta manualmente:
    echo   mysql -h !DB_HOST! -u !DB_USER! -p !DB_NAME! ^< database\schema-carnets-configuracion.sql
    echo.
    set /p "continue=¿Deseas continuar de todos modos? (s/n): "
    if /i not "!continue!"=="s" (
        echo [ERROR] Instalacion cancelada
        pause
        exit /b 1
    )
)

:skip_sql

REM ============================================
REM 4. Verificar dependencias de Node.js
REM ============================================
echo.
echo [INFO] Verificando dependencias de Node.js...

if not exist "node_modules" (
    echo [WARN] node_modules no encontrado
    echo [INFO] Instalando dependencias...
    call npm install
    if !errorlevel! equ 0 (
        echo [OK] Dependencias instaladas
    ) else (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencias ya instaladas
)

REM ============================================
REM 5. Verificar archivos creados/modificados
REM ============================================
echo.
echo [INFO] Verificando archivos del sistema...

set ALL_FILES_EXIST=1

call :check_file "database\schema-carnets-configuracion.sql"
call :check_file "src\controllers\carnetConfigController.js"
call :check_file "src\routes\carnetConfigRoutes.js"
call :check_file "public\mis-carnets.html"
call :check_file "public\admin-carnets.html"

if !ALL_FILES_EXIST! equ 0 (
    echo.
    echo [ERROR] Algunos archivos no se encontraron
    echo [WARN] Asegurate de haber copiado todos los archivos correctamente
    pause
    exit /b 1
)

REM ============================================
REM 6. Verificar que las rutas esten en app.js
REM ============================================
echo.
echo [INFO] Verificando configuracion de rutas...

findstr /C:"carnetConfigRoutes" src\app.js >nul
if !errorlevel! equ 0 (
    echo [OK] Rutas de configuracion encontradas en app.js
) else (
    echo [WARN] Las rutas de configuracion NO estan en app.js
    echo [INFO] Por favor, agrega manualmente al archivo src\app.js:
    echo.
    echo   const carnetConfigRoutes = require('./routes/carnetConfigRoutes');
    echo   app.use('/api/carnets/config', carnetConfigRoutes);
    echo.
    pause
)

REM ============================================
REM 7. Resumen final
REM ============================================
echo.
echo ============================================
echo [OK] ¡Instalacion completada!
echo ============================================
echo.
echo [INFO] Resumen de cambios:
echo   + Tabla carnet_configuracion creada
echo   + Configuraciones por defecto insertadas
echo   + Directorio de logos creado
echo   + Rutas de configuracion agregadas
echo   + Vista previa en tiempo real activada
echo.
echo [INFO] Proximos pasos:
echo   1. Inicia el servidor: npm start
echo   2. Accede a /mis-carnets.html
echo   3. Haz clic en 'Nuevo Carnet'
echo   4. Veras la vista previa en tiempo real
echo.
echo [INFO] Para personalizar el logo:
echo   POST /api/carnets/config/logo
echo   (con token de administrador)
echo.
echo [INFO] Documentacion completa en:
echo   MEJORAS_CARNETS.md
echo.
echo ============================================
echo [OK] ¡Disfruta del nuevo sistema de carnets!
echo ============================================
echo.

pause
exit /b 0

REM ============================================
REM Funciones auxiliares
REM ============================================
:check_file
if exist %1 (
    echo [OK] %~1
) else (
    echo [ERROR] %~1 - NO ENCONTRADO
    set ALL_FILES_EXIST=0
)
exit /b
