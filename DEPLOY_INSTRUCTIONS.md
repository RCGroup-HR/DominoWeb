# 🚀 INSTRUCCIONES DE DESPLIEGUE VPS

**Fecha:** 4 de Diciembre, 2024
**Sistema:** Git + PM2
**Servidor:** 38.242.218.24

---

## 📋 PASOS PARA DESPLEGAR (Tu flujo normal + pasos nuevos)

### 1️⃣ DESDE TU PC LOCAL (Windows PowerShell o CMD)

```bash
# Ir al proyecto
cd C:\Users\RonnieHdez\Desktop\domino-api

# Agregar cambios
git add .

# Excluir node_modules (como siempre)
git reset node_modules

# Commit
git commit -m "ScoreDomino - Sistema de Carnets v2.0"

# Push a GitHub
git push
```

---

### 2️⃣ EN EL SERVIDOR VPS (SSH)

```bash
# Conectar al servidor
ssh root@38.242.218.24

# Ir al proyecto
cd /var/www/DominoWeb

# Pull de los cambios
git pull

# ⚠️ NUEVOS PASOS (SOLO ESTA VEZ):

# A) Instalar las 3 dependencias nuevas
npm install bcryptjs jsonwebtoken multer

# B) Agregar variables al .env
nano .env
# Agregar al final:
# JWT_SECRET=8f3e9d2a7b4c6e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6
# JWT_EXPIRATION=24h
# Guardar: Ctrl+O, Enter, Ctrl+X

# C) Crear carpeta de uploads
mkdir -p public/uploads/fotos-carnets
chmod -R 755 public/uploads

# D) Ejecutar SQL para crear tablas de carnets
mysql -u root -p sdr < database/schema-carnets.sql
# Ingresa la contraseña de MySQL cuando te la pida

# E) Reiniciar PM2
pm2 restart scoredominio
pm2 restart scoredominio --update-env

# F) Ver logs para confirmar que todo está bien
pm2 logs scoredominio --lines 30
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

```bash
# 1. Ver estado de PM2
pm2 status

# 2. Probar endpoint de carnets
curl http://localhost:3000/api/carnets/paises

# 3. Ver que las tablas se crearon
mysql -u root -p sdr -e "SHOW TABLES LIKE 'carnet%';"
```

**Deberías ver:**
- `carnet_usuarios`
- `carnets`
- `carnets_historial`
- `carnet_sesiones`
- `carnet_login_intentos`

---

## 🌐 PROBAR EN EL NAVEGADOR

Visita:
- `https://scoredomino.com/login.html` → Login
- `https://scoredomino.com/registro.html` → Registro
- `https://scoredomino.com/mis-carnets.html` → Panel usuario
- `https://scoredomino.com/admin-carnets.html` → Panel admin

**Credenciales de administrador:**
- Email: `admin@scoredomino.com`
- Password: `admin123`

⚠️ **IMPORTANTE:** Cambia esta contraseña después del primer login.

---

## 🔄 FUTURAS ACTUALIZACIONES (Flujo Normal)

Después de esta primera vez, tus actualizaciones serán como siempre:

```bash
# En tu PC:
cd C:\Users\RonnieHdez\Desktop\domino-api
git add .
git reset node_modules
git commit -m "Actualización"
git push

# En el servidor:
ssh root@38.242.218.24
cd /var/www/DominoWeb
git pull
pm2 restart scoredominio
pm2 restart scoredominio --update-env
```

**Solo si instalas nuevas dependencias NPM, ejecuta:**
```bash
npm install
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module 'bcryptjs'"
```bash
cd /var/www/DominoWeb
npm install bcryptjs jsonwebtoken multer
pm2 restart scoredominio
```

### Error: "Unknown database 'domino_db'"
Tu base de datos se llama `sdr`, verifica el `.env`:
```bash
cat .env | grep DB_NAME
# Debería decir: DB_NAME=sdr
```

### Error 502 después del despliegue
```bash
# Ver logs
pm2 logs scoredominio --lines 50

# Reiniciar todo
pm2 restart scoredominio --update-env
sudo systemctl restart nginx

# Si sigue fallando, ver qué módulos faltan:
pm2 logs scoredominio | grep "Cannot find module"
```

### Las fotos no se suben
```bash
# Verificar permisos
ls -la /var/www/DominoWeb/public/uploads

# Arreglar permisos
chmod -R 755 /var/www/DominoWeb/public/uploads
chown -R www-data:www-data /var/www/DominoWeb/public/uploads
```

---

## 📊 COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
pm2 logs scoredominio

# Ver estado
pm2 status

# Reiniciar con variables de entorno actualizadas
pm2 restart scoredominio --update-env

# Ver información detallada
pm2 info scoredominio

# Ver procesos
ps aux | grep node

# Ver qué usa el puerto 3000
sudo lsof -i :3000

# Reiniciar nginx
sudo systemctl restart nginx

# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📝 NOTAS IMPORTANTES

1. **No subas node_modules** → Ya está en `.gitignore`, bien hecho ✅
2. **No subas .env** → Ya está en `.gitignore`, bien hecho ✅
3. **Sí sube database/schema-carnets.sql** → Se actualizó `.gitignore` ✅
4. **Ejecuta `npm install` en el servidor** después del pull si hay nuevas dependencias
5. **Usa `--update-env`** al reiniciar PM2 para cargar las nuevas variables del .env

---

## 🎉 NUEVAS FUNCIONALIDADES

Después de desplegar, tendrás:
- ✅ Sistema de login y registro
- ✅ Panel de carnets para usuarios
- ✅ Panel de administración
- ✅ Subida de fotos de carnets
- ✅ Aprobación/rechazo de carnets
- ✅ Auditoría completa
- ✅ Todo integrado con tu sistema actual

---

## 🔒 SEGURIDAD POST-DESPLIEGUE

### Cambiar contraseña del admin
```bash
# Genera una nueva contraseña encriptada aquí:
# https://bcrypt-generator.com/ (10 rounds)

mysql -u root -p sdr

UPDATE carnet_usuarios
SET password = '$2b$10$TU_NUEVA_CONTRASEÑA_ENCRIPTADA'
WHERE email = 'admin@scoredomino.com';

EXIT;
```

### Cambiar JWT_SECRET
```bash
# Genera un secret aleatorio:
openssl rand -hex 32

# Actualiza el .env:
nano .env
# Cambia JWT_SECRET por el nuevo valor
```

---

¡Todo listo para desplegar! 🚀
