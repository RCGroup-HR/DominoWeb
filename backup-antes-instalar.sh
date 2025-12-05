#!/bin/bash

# ============================================
# Script de Backup Antes de Instalar
# Para Linux/Mac (VPS)
# ============================================

echo "============================================"
echo "  Backup del Sistema Antes de Actualizar"
echo "  ScoreDomino - Sistema de Carnets"
echo "============================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Directorio de backup
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}[INFO]${NC} Creando backup en: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup de archivos que serán modificados
echo -e "${BLUE}[INFO]${NC} Respaldando archivos..."

# Archivos HTML
if [ -f "public/mis-carnets.html" ]; then
    cp "public/mis-carnets.html" "$BACKUP_DIR/"
    echo -e "${GREEN}[✓]${NC} mis-carnets.html"
fi

if [ -f "public/admin-carnets.html" ]; then
    cp "public/admin-carnets.html" "$BACKUP_DIR/"
    echo -e "${GREEN}[✓]${NC} admin-carnets.html"
fi

# App.js
if [ -f "src/app.js" ]; then
    cp "src/app.js" "$BACKUP_DIR/"
    echo -e "${GREEN}[✓]${NC} app.js"
fi

# Backup de base de datos (carnets tables)
echo ""
echo -e "${BLUE}[INFO]${NC} ¿Deseas respaldar la base de datos? (s/n)"
read -p "> " backup_db

if [ "$backup_db" = "s" ]; then
    echo ""
    read -p "Host de MySQL [localhost]: " db_host
    db_host=${db_host:-localhost}

    read -p "Usuario de MySQL [root]: " db_user
    db_user=${db_user:-root}

    read -sp "Contraseña de MySQL: " db_password
    echo ""

    read -p "Nombre de la base de datos: " db_name

    echo -e "${BLUE}[INFO]${NC} Respaldando base de datos..."

    mysqldump -h "$db_host" -u "$db_user" -p"$db_password" "$db_name" \
        carnets carnets_historial carnet_usuarios carnet_sesiones carnet_login_intentos \
        > "$BACKUP_DIR/carnets_backup.sql" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[✓]${NC} Base de datos respaldada"
    else
        echo -e "${YELLOW}[!]${NC} No se pudo respaldar la base de datos"
    fi
fi

# Crear archivo de información del backup
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup creado: $(date)
Sistema: $(uname -a)
Directorio: $(pwd)
Usuario: $(whoami)

Archivos respaldados:
$(ls -lh "$BACKUP_DIR")
EOF

echo ""
echo -e "${GREEN}[✓]${NC} Backup completado: $BACKUP_DIR"
echo ""
echo "Para restaurar en caso de problemas:"
echo "  cp $BACKUP_DIR/mis-carnets.html public/"
echo "  cp $BACKUP_DIR/admin-carnets.html public/"
echo "  cp $BACKUP_DIR/app.js src/"
echo ""
echo "Para restaurar base de datos:"
echo "  mysql -u usuario -p base_datos < $BACKUP_DIR/carnets_backup.sql"
echo ""
echo "============================================"
echo -e "${GREEN}¡Ahora puedes ejecutar la instalación!${NC}"
echo "============================================"
echo ""
echo "Ejecuta: ./install-carnets-mejoras.sh"
echo ""
