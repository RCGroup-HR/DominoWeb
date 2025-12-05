# 🚀 Guía Rápida de Deploy - Mejoras Carnets

## Opción 1: FileZilla (Más Fácil) ⭐ RECOMENDADO

### 1. Descargar FileZilla
- Descarga: https://filezilla-project.org/download.php?type=client
- Instala FileZilla Client

### 2. Conectar al VPS
```
Host: sftp://tu-ip-vps
Usuario: root (o tu usuario)
Contraseña: tu-password
Puerto: 22
```

### 3. Subir estos archivos NUEVOS:
```
LOCAL                                    →  REMOTO
database/schema-carnets-configuracion.sql  →  /var/www/domino-api/database/
src/controllers/carnetConfigController.js  →  /var/www/domino-api/src/controllers/
src/routes/carnetConfigRoutes.js          →  /var/www/domino-api/src/routes/
MEJORAS_CARNETS.md                        →  /var/www/domino-api/
```

### 4. Subir estos archivos MODIFICADOS:
```
LOCAL                     →  REMOTO
src/app.js               →  /var/www/domino-api/src/
public/mis-carnets.html  →  /var/www/domino-api/public/
public/admin-carnets.html →  /var/www/domino-api/public/
```

### 5. En el VPS (terminal SSH):
```bash
# Conectar por SSH
ssh root@tu-ip-vps

# Ir al directorio
cd /var/www/domino-api

# Crear directorio de logos
mkdir -p public/uploads/logos
chmod 755 public/uploads/logos

# Ejecutar SQL (EDITA CON TUS DATOS)
mysql -u usuario_db -p nombre_db < database/schema-carnets-configuracion.sql

# Reiniciar servidor
pm2 restart all
# o si no usas PM2:
# npm start
```

---

## Opción 2: WinSCP (Alternativa a FileZilla)

### 1. Descargar WinSCP
- Descarga: https://winscp.net/eng/download.php

### 2. Conectar
```
Protocolo: SFTP
Host: tu-ip-vps
Puerto: 22
Usuario: root
Contraseña: tu-password
```

### 3. Arrastra y suelta los archivos
Igual que FileZilla, los archivos listados arriba.

---

## Opción 3: Script Automático (Requiere Git Bash)

### 1. Edita `deploy-simple.bat`
```batch
set VPS_USER=root
set VPS_HOST=123.456.789.0
set VPS_PATH=/var/www/domino-api
set DB_USER=tu_usuario_mysql
set DB_PASS=tu_password_mysql
set DB_NAME=nombre_base_datos
```

### 2. Ejecuta
```bash
.\deploy-simple.bat
```

---

## Opción 4: Manualmente por SSH (Avanzado)

### 1. Comprimir archivos en Windows
```bash
# Desde Git Bash o PowerShell
tar -czf carnets-mejoras.tar.gz database/schema-carnets-configuracion.sql src/controllers/carnetConfigController.js src/routes/carnetConfigRoutes.js src/app.js public/mis-carnets.html public/admin-carnets.html MEJORAS_CARNETS.md
```

### 2. Subir al VPS
```bash
scp carnets-mejoras.tar.gz root@tu-ip-vps:/tmp/
```

### 3. En el VPS
```bash
ssh root@tu-ip-vps

cd /var/www/domino-api
tar -xzf /tmp/carnets-mejoras.tar.gz
mkdir -p public/uploads/logos
chmod 755 public/uploads/logos
mysql -u usuario -p base_datos < database/schema-carnets-configuracion.sql
pm2 restart all
```

---

## ✅ Verificar que todo funciona

### 1. Abrir en navegador:
```
https://tu-dominio.com/mis-carnets.html
```

### 2. Hacer clic en "Nuevo Carnet"

### 3. Verificar que aparece:
- ✅ Vista previa del carnet a la derecha
- ✅ Se actualiza en tiempo real al escribir
- ✅ Diseño verde y naranja profesional

### 4. Como Admin, ir a:
```
https://tu-dominio.com/admin-carnets.html
```

### 5. Hacer clic en "Ver" en cualquier carnet
- ✅ Debe mostrar el carnet con diseño mejorado

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'carnetConfigRoutes'"
```bash
# Verifica que el archivo existe
ls -la /var/www/domino-api/src/routes/carnetConfigRoutes.js

# Si no existe, súbelo de nuevo con FileZilla
```

### Error: "Table 'carnet_configuracion' doesn't exist"
```bash
# Ejecuta el SQL manualmente
mysql -u usuario -p
use nombre_base_datos;
source /var/www/domino-api/database/schema-carnets-configuracion.sql;
exit;
```

### La vista previa no aparece
```bash
# Limpia caché del navegador
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Servidor no reinicia
```bash
# Ver logs
pm2 logs

# Reiniciar forzado
pm2 delete all
cd /var/www/domino-api
pm2 start server.js --name domino-api
```

---

## 📋 Checklist Final

Antes de terminar, verifica:

- [ ] Todos los archivos nuevos subidos
- [ ] Archivos modificados actualizados
- [ ] Directorio `public/uploads/logos` creado
- [ ] SQL ejecutado correctamente
- [ ] Servidor reiniciado
- [ ] Vista previa funciona en `/mis-carnets.html`
- [ ] Vista de admin funciona en `/admin-carnets.html`
- [ ] No hay errores en consola del navegador (F12)
- [ ] No hay errores en logs del servidor

---

## 🎯 Resumen de Archivos a Subir

### NUEVOS (7 archivos):
1. `database/schema-carnets-configuracion.sql`
2. `src/controllers/carnetConfigController.js`
3. `src/routes/carnetConfigRoutes.js`
4. `MEJORAS_CARNETS.md`
5. `DEPLOY.md` (este archivo)
6. `deploy.bat`
7. `deploy-simple.bat`

### MODIFICADOS (3 archivos):
1. `src/app.js`
2. `public/mis-carnets.html`
3. `public/admin-carnets.html`

---

## 💡 Recomendación

**Usa FileZilla (Opción 1)** - Es la forma más visual y segura de subir archivos.

Cualquier duda, revisa el archivo `MEJORAS_CARNETS.md` para más detalles técnicos.
