# 🚀 Guía Rápida - Deploy de Mejoras

## Para Windows (Local)

```cmd
install-carnets-mejoras.bat
```

## Para VPS Linux (Deploy Completo)

### Desde Windows:

```cmd
deploy-to-vps.bat
```

Ingresa:
- IP del VPS
- Usuario SSH
- Ruta del proyecto
- Contraseña cuando se solicite

El script subirá todo y ejecutará la instalación automáticamente.

---

## Si Prefieres Manual en VPS

```bash
# 1. Subir archivos (FTP, SCP, Git)

# 2. Conectarse al VPS
ssh usuario@vps-ip

# 3. Ir al proyecto
cd /var/www/domino-api

# 4. Ejecutar instalación
chmod +x install-carnets-mejoras.sh
./install-carnets-mejoras.sh

# 5. Reiniciar servidor
pm2 restart all
```

---

## Verificar que Funciona

1. Abre: `http://tu-dominio/mis-carnets.html`
2. Haz clic en "Nuevo Carnet"
3. ¡Deberías ver la vista previa en tiempo real! ✨

---

## Personalizar Logo

```javascript
// Ejemplo de código para administradores
const formData = new FormData();
formData.append('logo', tuArchivoLogo);

fetch('/api/carnets/config/logo', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

---

## Archivos Clave

- `install-carnets-mejoras.bat` → Windows local
- `install-carnets-mejoras.sh` → Linux VPS
- `deploy-to-vps.bat` → Subir al VPS automático
- `MEJORAS_CARNETS.md` → Documentación completa
- `INSTRUCCIONES_INSTALACION.md` → Guía detallada

---

## Problemas Comunes

**"MySQL not found"**
→ Instala MySQL client o usa la ruta completa

**"Cannot find module"**
→ Verifica que copiaste todos los archivos

**"Access denied"**
→ Revisa credenciales en `.env`

**Vista previa no aparece**
→ Limpia caché del navegador (Ctrl+Shift+R)

---

## 📚 Documentación Completa

Lee `MEJORAS_CARNETS.md` para:
- Detalles técnicos
- Personalización avanzada
- Guía de desarrollo
- API endpoints

---

**¡Eso es todo!** 🎉

Tu sistema de carnets ahora tiene vista previa en tiempo real y diseño profesional.
