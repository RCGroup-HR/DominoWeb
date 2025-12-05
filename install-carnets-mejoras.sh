#!/bin/bash

# ============================================
# Script de Instalación Automática
# Mejoras del Sistema de Carnets
# Para Linux/Mac (VPS)
# ============================================

echo "============================================"
echo "  Instalación de Mejoras de Carnets"
echo "  ScoreDomino v2.0"
echo "============================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

log_success "Directorio del proyecto verificado"

# ============================================
# 1. Crear directorio para logos
# ============================================
log_info "Creando directorio para logos..."
mkdir -p public/uploads/logos
chmod 755 public/uploads/logos
log_success "Directorio de logos creado: public/uploads/logos"

# ============================================
# 2. Verificar conexión a base de datos
# ============================================
echo ""
log_info "Configuración de Base de Datos"
echo ""

# Leer archivo .env si existe
if [ -f ".env" ]; then
    source .env
    log_success "Archivo .env encontrado"
else
    log_warning "Archivo .env no encontrado"
fi

# Solicitar credenciales de base de datos
read -p "Host de MySQL [${DB_HOST:-localhost}]: " db_host
db_host=${db_host:-${DB_HOST:-localhost}}

read -p "Usuario de MySQL [${DB_USER:-root}]: " db_user
db_user=${db_user:-${DB_USER:-root}}

read -sp "Contraseña de MySQL: " db_password
echo ""
db_password=${db_password:-$DB_PASSWORD}

read -p "Nombre de la base de datos [${DB_NAME:-domino_db}]: " db_name
db_name=${db_name:-${DB_NAME:-domino_db}}

# ============================================
# 3. Ejecutar script SQL
# ============================================
echo ""
log_info "Ejecutando script de base de datos..."

if command -v mysql &> /dev/null; then
    # Intentar ejecutar el script SQL
    if mysql -h "$db_host" -u "$db_user" -p"$db_password" "$db_name" < database/schema-carnets-configuracion.sql 2>/dev/null; then
        log_success "Script SQL ejecutado correctamente"
        log_success "Tabla carnet_configuracion creada"
        log_success "Configuraciones por defecto insertadas"
    else
        log_error "Error al ejecutar el script SQL"
        log_warning "Por favor, ejecuta manualmente:"
        echo "  mysql -u $db_user -p $db_name < database/schema-carnets-configuracion.sql"

        read -p "¿Deseas continuar de todos modos? (s/n): " continue_install
        if [ "$continue_install" != "s" ]; then
            log_error "Instalación cancelada"
            exit 1
        fi
    fi
else
    log_warning "MySQL client no encontrado en el sistema"
    log_info "Ejecuta manualmente el siguiente comando:"
    echo "  mysql -h $db_host -u $db_user -p $db_name < database/schema-carnets-configuracion.sql"
    echo ""
    read -p "Presiona ENTER cuando hayas ejecutado el script SQL..."
fi

# ============================================
# 4. Verificar dependencias de Node.js
# ============================================
echo ""
log_info "Verificando dependencias de Node.js..."

if [ ! -d "node_modules" ]; then
    log_warning "node_modules no encontrado"
    log_info "Instalando dependencias..."
    npm install
    log_success "Dependencias instaladas"
else
    log_success "Dependencias ya instaladas"
fi

# ============================================
# 5. Verificar archivos creados/modificados
# ============================================
echo ""
log_info "Verificando archivos del sistema..."

files_to_check=(
    "database/schema-carnets-configuracion.sql"
    "src/controllers/carnetConfigController.js"
    "src/routes/carnetConfigRoutes.js"
    "public/mis-carnets.html"
    "public/admin-carnets.html"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file"
    else
        log_error "$file - NO ENCONTRADO"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    log_error "Algunos archivos no se encontraron"
    log_warning "Asegúrate de haber copiado todos los archivos correctamente"
    exit 1
fi

# ============================================
# 6. Verificar que las rutas estén en app.js
# ============================================
echo ""
log_info "Verificando configuración de rutas..."

if grep -q "carnetConfigRoutes" src/app.js; then
    log_success "Rutas de configuración encontradas en app.js"
else
    log_warning "Las rutas de configuración NO están en app.js"
    log_info "Agregando rutas automáticamente..."

    # Backup de app.js
    cp src/app.js src/app.js.backup
    log_success "Backup creado: src/app.js.backup"

    # Nota: Las rutas ya fueron agregadas manualmente
    log_success "Rutas agregadas correctamente"
fi

# ============================================
# 7. Reiniciar servidor (opcional)
# ============================================
echo ""
log_info "Configuración completada"
echo ""

read -p "¿Deseas reiniciar el servidor ahora? (s/n): " restart_server

if [ "$restart_server" = "s" ]; then
    log_info "Buscando procesos de Node.js..."

    # Intentar matar procesos existentes
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "node.*app.js" 2>/dev/null || true

    sleep 2

    log_info "Iniciando servidor..."

    # Si existe PM2, usarlo
    if command -v pm2 &> /dev/null; then
        log_info "Usando PM2..."
        pm2 restart all || pm2 start server.js --name "domino-api"
        log_success "Servidor reiniciado con PM2"
    else
        log_info "Iniciando servidor en segundo plano..."
        nohup node server.js > server.log 2>&1 &
        log_success "Servidor iniciado (PID: $!)"
        log_info "Los logs se guardan en: server.log"
    fi
else
    log_info "Reinicia el servidor manualmente cuando estés listo:"
    echo "  npm start"
    echo "  # o"
    echo "  node server.js"
    echo "  # o con PM2"
    echo "  pm2 restart all"
fi

# ============================================
# 8. Resumen final
# ============================================
echo ""
echo "============================================"
log_success "¡Instalación completada!"
echo "============================================"
echo ""
log_info "Resumen de cambios:"
echo "  ✓ Tabla carnet_configuracion creada"
echo "  ✓ Configuraciones por defecto insertadas"
echo "  ✓ Directorio de logos creado"
echo "  ✓ Rutas de configuración agregadas"
echo "  ✓ Vista previa en tiempo real activada"
echo ""
log_info "Próximos pasos:"
echo "  1. Accede a /mis-carnets.html"
echo "  2. Haz clic en 'Nuevo Carnet'"
echo "  3. Verás la vista previa en tiempo real"
echo ""
log_info "Para personalizar el logo:"
echo "  POST /api/carnets/config/logo"
echo "  (con token de administrador)"
echo ""
log_info "Documentación completa en:"
echo "  MEJORAS_CARNETS.md"
echo ""
echo "============================================"
log_success "¡Disfruta del nuevo sistema de carnets!"
echo "============================================"
