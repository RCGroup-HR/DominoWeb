# Instrucciones de Instalación - Mejoras de Carnets

## 🚀 Instalación Rápida

### Opción 1: Instalación Local (Windows)

```cmd
# En el directorio del proyecto
install-carnets-mejoras.bat
```

El script automáticamente:
- ✓ Crea el directorio para logos
- ✓ Ejecuta el script SQL
- ✓ Verifica dependencias
- ✓ Configura todo el sistema

---

### Opción 2: Deploy al VPS (Linux)

#### Paso 1: Subir archivos desde Windows

```cmd
# En tu máquina Windows
deploy-to-vps.bat
```

El script te pedirá:
- IP o dominio del VPS
- Usuario SSH (default: root)
- Ruta del proyecto (default: /var/www/domino-api)
- Puerto SSH (default: 22)

#### Paso 2: El script automáticamente

1. Sube todos los archivos necesarios
2. Te pregunta si quieres ejecutar la instalación
3. Si aceptas, ejecuta el script de instalación en el VPS

---

### Opción 3: Instalación Manual en VPS

Si prefieres hacerlo manualmente:

```bash
# Conectarse al VPS
ssh usuario@tu-vps.com

# Ir al directorio del proyecto
cd /var/www/domino-api

# Dar permisos de ejecución al script
chmod +x install-carnets-mejoras.sh

# Ejecutar el script
./install-carnets-mejoras.sh
```

El script te guiará paso a paso.

---

## 📋 Lo que Hace el Script de Instalación

1. **Crea directorios**
   - `public/uploads/logos/` para logos personalizados

2. **Base de datos**
   - Crea tabla `carnet_configuracion`
   - Inserta configuraciones por defecto
   - Valida conexión MySQL

3. **Verificaciones**
   - Confirma que todos los archivos existen
   - Verifica que las rutas estén configuradas
   - Chequea dependencias de Node.js

4. **Reinicio** (opcional)
   - Puede reiniciar el servidor automáticamente
   - Compatible con PM2, npm start, o node

---

## 🗂️ Archivos Incluidos

```
domino-api/
├── install-carnets-mejoras.bat       # Script Windows (local)
├── install-carnets-mejoras.sh        # Script Linux (VPS)
├── deploy-to-vps.bat                 # Deploy automático a VPS
├── INSTRUCCIONES_INSTALACION.md      # Este archivo
├── MEJORAS_CARNETS.md                # Documentación completa
├── database/
│   └── schema-carnets-configuracion.sql
├── src/
│   ├── controllers/
│   │   └── carnetConfigController.js
│   ├── routes/
│   │   └── carnetConfigRoutes.js
│   └── app.js (modificado)
└── public/
    ├── mis-carnets.html (mejorado)
    └── admin-carnets.html (mejorado)
```

---

## ⚙️ Configuración Manual (Si los Scripts Fallan)

### 1. Base de Datos

```bash
mysql -u tu_usuario -p tu_base_datos < database/schema-carnets-configuracion.sql
```

### 2. Crear Directorio de Logos

**Windows:**
```cmd
mkdir public\uploads\logos
```

**Linux:**
```bash
mkdir -p public/uploads/logos
chmod 755 public/uploads/logos
```

### 3. Verificar app.js

Asegúrate de que `src/app.js` tenga estas líneas:

```javascript
const carnetConfigRoutes = require('./routes/carnetConfigRoutes');

// En la sección de rutas:
app.use('/api/carnets/config', carnetConfigRoutes);
```

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Reiniciar Servidor

```bash
# Con PM2
pm2 restart all

# O normal
npm start

# O directo
node server.js
```

---

## 🧪 Verificar la Instalación

### 1. Probar en el Navegador

```
http://tu-servidor/mis-carnets.html
```

- Haz clic en "Nuevo Carnet"
- Deberías ver la vista previa lado a lado
- Escribe en los campos y verás actualización en tiempo real

### 2. Probar la API de Configuración

```bash
# Obtener configuración (público)
curl http://tu-servidor/api/carnets/config

# Debería devolver:
{
  "success": true,
  "data": {
    "logo_entidad_url": "/img/default-logo.png",
    "nombre_entidad": "ScoreDomino",
    "titulo_carnet": "CARNET OFICIAL",
    ...
  }
}
```

---

## 🔧 Solución de Problemas

### Error: "MySQL command not found"

**Windows:** Agrega MySQL a tu PATH o proporciona la ruta completa
**Linux:** `sudo apt-get install mysql-client`

### Error: "Cannot find module carnetConfigRoutes"

Verifica que el archivo exista:
```bash
ls -la src/routes/carnetConfigRoutes.js
```

Si no existe, copialo manualmente del repositorio.

### Error: "Access denied for user"

Verifica tus credenciales de MySQL en el archivo `.env`:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=tu_base_datos
```

### La vista previa no aparece

1. Abre la consola del navegador (F12)
2. Busca errores JavaScript
3. Verifica que el archivo `mis-carnets.html` se actualizó correctamente
4. Limpia la caché del navegador (Ctrl+Shift+R)

### Error: "Port already in use"

El servidor ya está corriendo:
```bash
# Matar proceso existente
pkill -f "node.*server.js"

# O con PM2
pm2 stop all
pm2 start server.js
```

---

## 📞 Soporte

Si encuentras algún problema:

1. **Revisa la documentación completa:**
   - `MEJORAS_CARNETS.md` - Documentación detallada
   - `SISTEMA_CARNETS_README.md` - Sistema original

2. **Verifica los logs:**
   ```bash
   # Si usas PM2
   pm2 logs

   # O revisa el archivo
   cat server.log
   ```

3. **Comandos útiles de diagnóstico:**
   ```bash
   # Ver procesos de Node
   ps aux | grep node

   # Verificar puerto
   netstat -tulpn | grep 3000

   # Ver tablas de MySQL
   mysql -u usuario -p -e "SHOW TABLES" nombre_db
   ```

---

## ✅ Checklist Post-Instalación

- [ ] Base de datos actualizada
- [ ] Directorio de logos creado
- [ ] Servidor reiniciado
- [ ] Vista previa funciona en `/mis-carnets.html`
- [ ] API de configuración responde en `/api/carnets/config`
- [ ] Panel de administrador muestra nuevo diseño
- [ ] No hay errores en los logs

---

## 🎉 ¡Listo!

Una vez completada la instalación, tu sistema de carnets tendrá:

✨ Vista previa en tiempo real
✨ Diseño profesional mejorado
✨ Sistema de configuración personalizable
✨ Soporte para logo de entidad
✨ Colores y textos configurables

**¡Disfruta del nuevo sistema de carnets!** 🎲
