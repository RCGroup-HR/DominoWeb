# 🚀 Guía Rápida de Deploy Automático

## Opción 1: Con Contraseña Automática (100% Automático)

### Requisitos:
Necesitas tener **PuTTY** instalado (para usar `plink`)

📥 Descarga PuTTY: https://www.putty.org/

### Pasos:

1. **Edita el archivo `deploy-auto.bat`** (líneas 9-15):

```batch
set VPS_IP=38.242.218.24
set VPS_USER=root
set VPS_PASS=tu_password_del_vps       ← CAMBIA ESTO
set VPS_PATH=/var/www/DominoWeb
set DB_USER=root
set DB_PASS=tu_password_mysql          ← CAMBIA ESTO
set DB_NAME=scoredominio
```

2. **Ejecuta:**

```bash
.\deploy-auto.bat
```

**¡YA ESTÁ!** El script hace TODO automáticamente sin pedir contraseñas.

---

## Opción 2: Sin Guardar Contraseñas (Más Seguro)

Si no quieres guardar contraseñas en el script:

### Ejecuta `deploy-todo.bat`:

```bash
.\deploy-todo.bat
```

Te pedirá:
1. Contraseña SSH del VPS (1 vez)
2. Contraseña de MySQL (1 vez)

---

## ¿Qué hace el script automático?

✅ 1. Git add, commit y push
✅ 2. Git pull en el servidor
✅ 3. Crea directorio de logos
✅ 4. Ejecuta SQL de configuración
✅ 5. Reinicia PM2
✅ 6. Muestra logs

**Todo en 1 click.**

---

## 🔒 Seguridad

### Si usas `deploy-auto.bat` (con contraseña guardada):

⚠️ **IMPORTANTE:**
- No compartas este archivo
- Agrégalo al `.gitignore`

Ejecuta esto UNA VEZ:

```bash
echo deploy-auto.bat >> .gitignore
git add .gitignore
git commit -m "Ignorar script con contraseñas"
git push
```

---

## ✅ Verificar que Funcionó

Después del deploy:

1. Abre: **https://scoredomino.com/mis-carnets.html**
2. Click en **"Nuevo Carnet"**
3. Debes ver **vista previa a la derecha**
4. Al escribir se debe **actualizar en tiempo real**

---

## 🐛 Si algo falla

### "plink is not recognized"
👉 Instala PuTTY: https://www.putty.org/

O usa `deploy-todo.bat` que usa SSH normal

### Error de MySQL
Verifica usuario y contraseña en el script

### No aparece la vista previa
Limpia caché del navegador: `Ctrl + Shift + R`

---

## 📌 Archivos de Deploy Disponibles

| Archivo | Descripción | Ventaja |
|---------|-------------|---------|
| `deploy-auto.bat` | 100% automático con contraseñas | Sin interrupciones |
| `deploy-todo.bat` | Pide contraseñas | Más seguro |
| `subir.bat` | Solo git + PM2 restart | Más rápido |

---

## 💡 Recomendación

**Primera vez:** Usa `deploy-todo.bat` para probar

**Después:** Si todo funciona, edita `deploy-auto.bat` con tus contraseñas para hacer deploy en 1 click

---

**¿Dudas?** Revisa `MEJORAS_CARNETS.md` para más detalles técnicos.
