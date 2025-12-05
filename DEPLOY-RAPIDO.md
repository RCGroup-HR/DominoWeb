# 🚀 DEPLOY RÁPIDO - Basado en tu Flujo

## Opción 1: Todo Automático (Recomendado)

### 1. Edita `deploy-git.bat` con tus datos de MySQL:
```batch
set DB_USER=tu_usuario_mysql
set DB_PASS=tu_password_mysql
set DB_NAME=tu_base_datos
```

### 2. Ejecuta:
```bash
.\deploy-git.bat
```

**¡LISTO!** El script hace TODO automáticamente:
- ✅ Git add, commit y push
- ✅ SSH al servidor
- ✅ Git pull
- ✅ PM2 restart
- ✅ Ejecuta SQL

---

## Opción 2: Manual (Tu Forma Actual)

### En Windows (PowerShell o CMD):
```bash
cd desktop/domino-api
git add .
git reset node_modules
git commit -m "ScoreDomino - Mejoras Carnets"
git push
```

### En el Servidor (SSH):
```bash
ssh root@38.242.218.24
cd /var/www/DominoWeb
git pull
pm2 restart scoredominio
pm2 restart scoredominio --update-env
```

### Ejecutar SQL (IMPORTANTE - NUEVA TABLA):
```bash
# Opción A: Desde tu PC
ssh root@38.242.218.24 "cd /var/www/DominoWeb && mysql -u usuario -p'password' base_datos < database/schema-carnets-configuracion.sql"

# Opción B: Dentro del servidor
mysql -u usuario -p base_datos < database/schema-carnets-configuracion.sql
```

---

## Opción 3: Solo ejecutar SQL

Si ya hiciste git push antes y solo necesitas ejecutar el SQL:

### 1. Edita `deploy-sql.bat` con tus datos
### 2. Ejecuta:
```bash
.\deploy-sql.bat
```

---

## 📋 Verificar que Funciona

Después del deploy, abre:
```
https://tu-dominio.com/mis-carnets.html
```

1. Click en "Nuevo Carnet"
2. Debe aparecer vista previa a la derecha
3. Al escribir se actualiza en tiempo real

---

## ⚠️ IMPORTANTE

### Primera vez necesitas:

1. **Crear directorio de logos:**
```bash
ssh root@38.242.218.24
mkdir -p /var/www/DominoWeb/public/uploads/logos
chmod 755 /var/www/DominoWeb/public/uploads/logos
```

2. **Ejecutar el SQL:**
```bash
mysql -u usuario -p base_datos < database/schema-carnets-configuracion.sql
```

3. **Reiniciar:**
```bash
pm2 restart scoredominio
```

---

## 🐛 Si algo falla

### Error: "Cannot find module 'carnetConfigRoutes'"
```bash
# Verifica que todos los archivos se subieron
ssh root@38.242.218.24
cd /var/www/DominoWeb
ls -la src/routes/carnetConfigRoutes.js
ls -la src/controllers/carnetConfigController.js
```

### Error: "Table 'carnet_configuracion' doesn't exist"
```bash
# Ejecuta el SQL manualmente
ssh root@38.242.218.24
cd /var/www/DominoWeb
mysql -u usuario -p
> use nombre_base_datos;
> source database/schema-carnets-configuracion.sql;
> exit;
pm2 restart scoredominio
```

### La vista previa no aparece
```bash
# Limpia caché del navegador
Ctrl + Shift + R
```

---

## 📁 Archivos que se Subieron

### NUEVOS:
- ✅ `database/schema-carnets-configuracion.sql`
- ✅ `src/controllers/carnetConfigController.js`
- ✅ `src/routes/carnetConfigRoutes.js`

### MODIFICADOS:
- ✅ `src/app.js`
- ✅ `public/mis-carnets.html`
- ✅ `public/admin-carnets.html`

---

## 💡 Tip

Guarda el archivo `deploy-git.bat` en tu Desktop para ejecutarlo rápido cada vez que hagas cambios.
