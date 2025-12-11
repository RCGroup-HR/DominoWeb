# 🎫 Cómo Usar el Sistema de Carnets

## ✅ TODO ESTÁ LISTO Y FUNCIONANDO

---

## 📱 Para Usuarios

### 1. Iniciar Sesión
```
http://localhost:3000/login.html
```
- Ingresar email y contraseña
- El sistema guarda el token automáticamente

### 2. Solicitar Carnet
```
http://localhost:3000/solicitar-carnet.html
```
1. Llenar todos los campos
2. Subir foto
3. Ver preview en tiempo real
4. Clic en "Enviar Solicitud"
5. Esperar aprobación del administrador

### 3. Ver Mis Carnets
```
http://localhost:3000/mis-carnets.html
```
- Ver estado de tus solicitudes
- Ver carnets aprobados
- Ver comentarios si fue rechazado

---

## 👨‍💼 Para Administradores

### Panel de Admin
```
http://localhost:3000/admin-carnets.html
```

**Funciones:**
- ✅ Ver todas las solicitudes (pendientes, aprobados, rechazados)
- ✅ Aprobar carnets con comentarios opcionales
- ✅ Rechazar carnets con comentarios obligatorios
- ✅ Ver estadísticas en tiempo real
- ✅ Filtrar por país o buscar por nombre
- ✅ Eliminar carnets

**Cómo aprobar:**
1. Ir a tab "Pendientes"
2. Ver foto y datos
3. Clic en "Aprobar"
4. Escribir comentario (opcional)
5. ✅ Listo!

**Cómo rechazar:**
1. Clic en "Rechazar"
2. Escribir motivo (obligatorio)
3. ❌ Carnet rechazado

---

## 🔄 Flujo Completo

```
Usuario → Login → Solicita Carnet → Base de Datos (pendiente)
                                            ↓
                              Admin ve en panel
                                            ↓
                              [Aprobar] o [Rechazar]
                                            ↓
                              Usuario ve resultado
```

---

## 🔒 Sistema de Autenticación

El sistema usa **el mismo token** que el resto de tu aplicación:

```javascript
// Guardado automáticamente en login
localStorage.getItem('token')
localStorage.getItem('usuario')
```

**Sin token = Redirige a login automáticamente**

---

## 📊 Estados del Carnet

| Estado | Color | Descripción |
|--------|-------|-------------|
| 🟡 Pendiente | Amarillo | Esperando revisión |
| 🟢 Aprobado | Verde | Listo para usar |
| 🔴 Rechazado | Rojo | No aprobado (ver comentarios) |

---

## 📁 Archivos del Sistema

```
public/
├── solicitar-carnet.html    → Usuarios solicitan aquí
├── mis-carnets.html         → Usuarios ven sus carnets
├── admin-carnets.html       → Admin gestiona todo
├── CSS/carnets.css          → Estilos
├── js/carnets-generator.js  → Lógica
└── uploads/fotos-carnets/   → Fotos guardadas

src/
├── routes/carnetsRoutes.js      → Rutas API
└── controllers/carnetsController.js → Lógica backend
```

---

## 🛠️ Endpoints de la API

### Usuario
```
POST /api/carnets/solicitudes  (crear solicitud)
GET  /api/carnets              (ver mis carnets)
```

### Admin
```
GET    /api/carnets?estatus=pendiente  (ver pendientes)
POST   /api/carnets/:id/aprobar        (aprobar)
POST   /api/carnets/:id/rechazar       (rechazar)
DELETE /api/carnets/:id                (eliminar)
GET    /api/carnets/admin/estadisticas (stats)
```

---

## ✅ Checklist de Prueba

- [x] Login funciona
- [x] Token se guarda automáticamente
- [x] Formulario de solicitud funciona
- [x] Preview en tiempo real funciona
- [x] Panel de admin muestra solicitudes
- [x] Botón "Aprobar" funciona
- [x] Botón "Rechazar" funciona
- [x] Estadísticas se actualizan
- [x] Colores verdes de ScoreDomino integrados

---

## 🎯 Próximo Paso

1. **Ir a:** `http://localhost:3000/login.html`
2. **Iniciar sesión** con usuario válido
3. **Ir a:** `http://localhost:3000/solicitar-carnet.html`
4. **Completar** y enviar
5. **Ir a:** `http://localhost:3000/admin-carnets.html` (si eres admin)
6. **Aprobar o rechazar** solicitudes

---

## 💡 Notas Importantes

- ✅ Usa la misma base de datos que tu app
- ✅ Usa el mismo sistema de tokens
- ✅ Usa los mismos colores verdes
- ✅ Panel de admin ya existe y funciona
- ✅ Todo está integrado y listo

---

## 🆘 Ayuda Rápida

**Error: "Debes iniciar sesión"**
→ Ve a `/login.html` primero

**Error: Base de datos**
→ Verifica que la BD esté configurada en `.env`

**No aparecen solicitudes**
→ Verifica que el usuario sea administrador

---

**¡YA ESTÁ TODO FUNCIONANDO!** 🎉

Simplemente inicia sesión y prueba el sistema.
