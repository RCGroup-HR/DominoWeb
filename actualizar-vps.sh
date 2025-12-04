#!/bin/bash

# Script de actualización para el VPS - Sistema de Carnets
# Ejecutar en el servidor: bash actualizar-vps.sh

echo "═══════════════════════════════════════════════════════════"
echo "  🚀 Actualizando domino-api en VPS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mensajes
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Detener la aplicación
echo "1. Deteniendo aplicación..."
pm2 stop domino-api 2>/dev/null || echo "La app no estaba corriendo"
info "Aplicación detenida"
echo ""

# 2. Hacer backup de la base de datos
echo "2. Creando backup de la base de datos..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u root -p sdr > "$BACKUP_FILE" 2>/dev/null && info "Backup creado: $BACKUP_FILE" || warn "No se pudo crear backup"
echo ""

# 3. Instalar nuevas dependencias
echo "3. Instalando dependencias..."
npm install
if [ $? -eq 0 ]; then
    info "Dependencias instaladas correctamente"
else
    error "Error al instalar dependencias"
    exit 1
fi
echo ""

# 4. Actualizar .env
echo "4. Verificando archivo .env..."
if [ ! -f .env ]; then
    error "Archivo .env no encontrado"
    echo "Por favor crea el archivo .env con las credenciales correctas"
    exit 1
fi

# Verificar que existan las nuevas variables
if ! grep -q "JWT_SECRET" .env; then
    warn "Agregando variables JWT al .env..."
    cat >> .env << 'EOF'

# JWT Configuration para sistema de carnets
JWT_SECRET=8f3e9d2a7b4c6e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6
JWT_EXPIRATION=24h
EOF
    info "Variables JWT agregadas al .env"
fi
echo ""

# 5. Crear directorios necesarios
echo "5. Creando directorios para uploads..."
mkdir -p public/uploads/fotos-carnets
chmod -R 755 public/uploads
info "Directorios creados con permisos correctos"
echo ""

# 6. Ejecutar SQL de carnets
echo "6. Actualizando base de datos..."
warn "IMPORTANTE: Se ejecutarán los comandos SQL para crear las tablas de carnets"
read -p "¿Deseas continuar? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mysql -u root -p sdr < database/schema-carnets.sql
    if [ $? -eq 0 ]; then
        info "Base de datos actualizada correctamente"
    else
        error "Error al actualizar base de datos"
        exit 1
    fi
else
    warn "Actualización de base de datos omitida"
fi
echo ""

# 7. Reiniciar aplicación con PM2
echo "7. Reiniciando aplicación..."
pm2 restart domino-api || pm2 start server.js --name "domino-api"
pm2 save
info "Aplicación reiniciada correctamente"
echo ""

# 8. Verificar estado
echo "8. Verificando estado..."
sleep 2
pm2 status domino-api
echo ""

# 9. Ver logs
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ ACTUALIZACIÓN COMPLETA"
echo "═══════════════════════════════════════════════════════════"
echo ""
info "Para ver los logs en tiempo real, ejecuta:"
echo "   pm2 logs domino-api"
echo ""
info "Para verificar que funciona, visita:"
echo "   https://tudominio.com/login.html"
echo ""
warn "Si hay errores, revisa los logs y verifica:"
echo "   1. El .env tiene las credenciales correctas"
echo "   2. Las tablas de carnets se crearon correctamente"
echo "   3. Los permisos de la carpeta uploads son correctos"
echo ""
