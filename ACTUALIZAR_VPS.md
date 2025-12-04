# 🚀 GUÍA DE ACTUALIZACIÓN VPS - SISTEMA DE CARNETS

**Fecha:** 4 de Diciembre, 2024
**Versión:** 2.0 con Sistema de Carnets

---

## ⚠️ IMPORTANTE: LEE ANTES DE EMPEZAR

El proyecto original funcionaba correctamente. Se agregó:
- ✅ Sistema de autenticación JWT
- ✅ Sistema de carnets con fotos
- ✅ Panel de administrador
- ✅ 5 tablas nuevas en la base de datos

---

## 📋 OPCIÓN 1: ACTUALIZACIÓN RÁPIDA (RECOMENDADA)

### Paso 1: Subir archivos al servidor

```bash
# En tu máquina local (Windows)
# Comprimir el proyecto (excluyendo node_modules)
cd C:\Users\RonnieHdez\Desktop
tar -czf domino-api-actualizado.tar.gz domino-api --exclude=node_modules --exclude=.git

# Subir al servidor (reemplaza con tu IP/dominio)
scp domino-api-actualizado.tar.gz usuario@tu-servidor.com:/home/usuario/
```

### Paso 2: En el servidor VPS (vía SSH)

```bash
# Conectar al servidor
ssh usuario@tu-servidor.com

# Ir al directorio donde está tu app actual
cd /var/www/domino-api  # O la ruta donde esté tu app

# Hacer backup de la versión actual
cp -r . ../domino-api-backup-$(date +%Y%m%d)

# Detener la aplicación
pm2 stop domino-api

# Descomprimir los archivos nuevos
cd /home/usuario
tar -xzf domino-api-actualizado.tar.gz
cd domino-api

# Copiar al directorio de producción
rsync -av --exclude='node_modules' --exclude='.env' . /var/www/domino-api/

# Volver al directorio de producción
cd /var/www/domino-api

# Instalar dependencias nuevas
npm install

# Hacer el script ejecutable
chmod +x actualizar-vps.sh

# Ejecutar el script de actualización
bash actualizar-vps.sh
```

---

## 📋 OPCIÓN 2: ACTUALIZACIÓN MANUAL (PASO A PASO)

### Paso 1: Backup

```bash
# Conectar al servidor
ssh usuario@tu-servidor.com

# Backup de la base de datos
mysqldump -u root -p sdr > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de la aplicación
cp -r /var/www/domino-api /var/www/domino-api-backup
```

### Paso 2: Actualizar archivos

```bash
# Detener la aplicación
pm2 stop domino-api

# Subir los archivos nuevos (desde tu máquina local)
# Usa FileZilla, SCP o rsync para subir:
# - src/controllers/authController.js
# - src/controllers/carnetsController.js
# - src/routes/authRoutes.js
# - src/routes/carnetsRoutes.js
# - src/middleware/authJWT.js
# - src/middleware/upload.js
# - public/login.html
# - public/registro.html
# - public/mis-carnets.html
# - public/admin-carnets.html
# - database/schema-carnets.sql
```

### Paso 3: Actualizar app.js

```bash
# En el servidor
cd /var/www/domino-api
nano src/app.js
```

Verifica que tenga estas líneas:

```javascript
const authRoutes = require('./routes/authRoutes');
const carnetsRoutes = require('./routes/carnetsRoutes');

// Rutas de autenticación y carnets
app.use('/api/auth', authRoutes);
app.use('/api/carnets', carnetsRoutes);
```

### Paso 4: Actualizar .env

```bash
nano .env
```

Agrega estas líneas al final:

```env
# JWT Configuration para sistema de carnets
JWT_SECRET=8f3e9d2a7b4c6e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6
JWT_EXPIRATION=24h
```

### Paso 5: Instalar dependencias

```bash
npm install bcryptjs jsonwebtoken multer
```

### Paso 6: Crear directorios

```bash
mkdir -p public/uploads/fotos-carnets
chmod -R 755 public/uploads
```

### Paso 7: Actualizar base de datos

```bash
mysql -u root -p sdr < database/schema-carnets.sql
```

### Paso 8: Reiniciar aplicación

```bash
pm2 restart domino-api
pm2 save
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

### 1. Ver logs de la aplicación

```bash
pm2 logs domino-api --lines 50
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
```

### 2. Verificar endpoints

```bash
# Probar endpoint de paises (para carnets)
curl http://localhost:3000/api/carnets/paises

# Probar la página de login
curl http://localhost:3000/login.html
```

### 3. Verificar base de datos

```bash
mysql -u root -p sdr

# En MySQL:
SHOW TABLES LIKE 'carnet%';
# Deberías ver 5 tablas:
# - carnet_usuarios
# - carnets
# - carnets_historial
# - carnet_sesiones
# - carnet_login_intentos

# Ver el usuario administrador
SELECT * FROM carnet_usuarios WHERE rol = 'administrador';

EXIT;
```

### 4. Probar desde el navegador

Visita: `https://tudominio.com/login.html`

**Credenciales de administrador:**
- Email: `admin@scoredomino.com`
- Contraseña: `admin123`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module 'bcryptjs'"

```bash
npm install bcryptjs jsonwebtoken multer
pm2 restart domino-api
```

### Error: "Unknown database 'domino_db'"

Tu base de datos se llama `sdr`, no `domino_db`. Verifica el .env:

```bash
# Ver el nombre correcto de tu base de datos
mysql -u root -p -e "SHOW DATABASES;"

# Actualizar .env si es necesario
nano .env
# Cambiar a: DB_NAME=sdr
```

### Error: "EADDRINUSE: address already in use ::3000"

```bash
# Matar el proceso en el puerto 3000
sudo lsof -ti:3000 | xargs sudo kill -9

# Reiniciar la app
pm2 restart domino-api
```

### Error 502 Bad Gateway

```bash
# Verificar que la app está corriendo
pm2 status domino-api

# Si está crashed, ver los logs
pm2 logs domino-api --lines 100

# Reiniciar nginx
sudo systemctl restart nginx
```

### No se pueden subir fotos

```bash
# Verificar permisos
ls -la public/uploads

# Dar permisos correctos
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads

# O si usas otro usuario:
chown -R $USER:$USER public/uploads
```

---

## 📊 COMANDOS ÚTILES

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs domino-api

# Reiniciar la aplicación
pm2 restart domino-api

# Ver información detallada
pm2 info domino-api

# Ver uso de recursos
pm2 monit

# Reiniciar nginx
sudo systemctl restart nginx

# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log

# Ver procesos usando el puerto 3000
sudo lsof -i :3000

# Ver espacio en disco
df -h
```

---

## 🔒 SEGURIDAD POST-INSTALACIÓN

### 1. Cambiar contraseña del administrador

```bash
# Acceder a MySQL
mysql -u root -p sdr

# Generar nueva contraseña encriptada
# Usa este sitio: https://bcrypt-generator.com/
# Rounds: 10

# Actualizar contraseña
UPDATE carnet_usuarios
SET password = '$2b$10$TU_NUEVA_CONTRASEÑA_ENCRIPTADA_AQUI'
WHERE email = 'admin@scoredomino.com';

EXIT;
```

### 2. Cambiar JWT_SECRET

```bash
nano .env

# Genera un nuevo secret aleatorio:
# https://generate-secret.vercel.app/64
# O ejecuta: openssl rand -hex 32
```

---

## 📞 SOPORTE

Si algo no funciona:

1. Revisa los logs: `pm2 logs domino-api`
2. Verifica el estado: `pm2 status`
3. Verifica nginx: `sudo systemctl status nginx`
4. Verifica MySQL: `sudo systemctl status mysql`
5. Revisa que el .env tenga las credenciales correctas

---

## ✨ NUEVAS FUNCIONALIDADES

Después de actualizar, tendrás acceso a:

1. **Sistema de Login** → `/login.html`
2. **Registro de usuarios** → `/registro.html`
3. **Panel de usuario** → `/mis-carnets.html`
4. **Panel de administrador** → `/admin-carnets.html`
5. **API de carnets** → `/api/carnets/*`
6. **API de autenticación** → `/api/auth/*`

---

## 🎉 ¡LISTO!

Tu sistema ahora tiene:
- ✅ Autenticación segura con JWT
- ✅ Sistema de carnets con fotos
- ✅ Panel de administración
- ✅ Registro de usuarios
- ✅ Aprobación de carnets
- ✅ Auditoría completa

**Todo integrado con el sistema original que ya funcionaba.**
