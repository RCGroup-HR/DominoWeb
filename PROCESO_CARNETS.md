# 📋 Proceso Completo del Sistema de Carnets

## 🔄 Flujo Completo

```
1. Usuario → Solicita Carnet → Estado: PENDIENTE
                ↓
2. Base de Datos → Guarda solicitud
                ↓
3. Administrador → Revisa solicitud
                ↓
4. Administrador → APRUEBA o RECHAZA
                ↓
5. Usuario → Recibe notificación
```

---

## 1️⃣ **Solicitud de Carnet (Usuario)**

### URL
```
http://localhost:3000/solicitar-carnet.html
```

### Requisitos
- ✅ Usuario debe estar **autenticado** (tener token JWT)
- ✅ Completar formulario completo
- ✅ Subir foto válida

### Proceso Backend
```javascript
POST /api/carnets/solicitudes

// 1. Valida datos
// 2. Convierte foto base64 → archivo físico
// 3. Genera ID único: CARD-1234567890-ABC123
// 4. Guarda en BD:
{
  Carnet: "CARD-1234567890-ABC123",
  Nombre: "Ronnie Hernandez",
  Pais: "DO",
  Bandera: "🇩🇴",
  Union_Federacion: "M",
  FotoUrl: "/uploads/fotos-carnets/carnet-xxx.jpg",
  Estatus: "pendiente",  ← IMPORTANTE
  UsuarioId: 123
}
```

---

## 2️⃣ **Panel de Administración**

### Endpoints para Administradores

#### Ver Solicitudes Pendientes
```javascript
GET /api/carnets?estatus=pendiente
Headers: {
  Authorization: "Bearer {admin_token}"
}

// Respuesta:
{
  "success": true,
  "data": [
    {
      "Id": 1,
      "Carnet": "CARD-1234567890-ABC123",
      "Nombre": "Ronnie Hernandez",
      "Pais": "DO",
      "Estatus": "pendiente",
      "FotoUrl": "/uploads/fotos-carnets/xxx.jpg",
      "FechaCreacion": "2025-12-11 13:00:00"
    }
  ]
}
```

#### Aprobar Solicitud
```javascript
POST /api/carnets/:id/aprobar
Headers: {
  Authorization: "Bearer {admin_token}"
}
Body: {
  "comentarios": "Aprobado - Datos correctos"
}

// Backend ejecuta:
UPDATE Carnets SET
  Estatus = 'aprobado',
  AdministradorAprobadorId = {admin_id},
  FechaAprobacion = NOW(),
  Comentarios = 'Aprobado - Datos correctos'
WHERE Id = :id
```

#### Rechazar Solicitud
```javascript
POST /api/carnets/:id/rechazar
Headers: {
  Authorization: "Bearer {admin_token}"
}
Body: {
  "comentarios": "Rechazado - Foto no válida"  // OBLIGATORIO
}

// Backend ejecuta:
UPDATE Carnets SET
  Estatus = 'rechazado',
  AdministradorAprobadorId = {admin_id},
  Comentarios = 'Rechazado - Foto no válida'
WHERE Id = :id
```

---

## 3️⃣ **Estados del Carnet**

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Solicitud enviada, esperando revisión |
| `aprobado` | Carnet aprobado por administrador |
| `rechazado` | Carnet rechazado (con comentarios del por qué) |

---

## 4️⃣ **Consultar Estado (Usuario)**

```javascript
GET /api/carnets
Headers: {
  Authorization: "Bearer {user_token}"
}

// El usuario ve solo SUS carnets:
{
  "success": true,
  "data": [
    {
      "Id": 1,
      "Carnet": "CARD-1234567890-ABC123",
      "Nombre": "Ronnie Hernandez",
      "Estatus": "pendiente",  // o "aprobado" / "rechazado"
      "Comentarios": null,
      "FechaCreacion": "2025-12-11",
      "FechaAprobacion": null
    }
  ]
}
```

---

## 🔒 **Permisos y Seguridad**

### Usuarios Regulares
- ✅ Pueden crear solicitudes
- ✅ Pueden ver solo SUS carnets
- ✅ Pueden actualizar carnets SOLO si están "pendiente"
- ❌ NO pueden aprobar/rechazar
- ❌ NO pueden ver carnets de otros usuarios

### Administradores
- ✅ Pueden ver TODOS los carnets
- ✅ Pueden aprobar solicitudes
- ✅ Pueden rechazar solicitudes
- ✅ Pueden ver estadísticas
- ✅ Pueden eliminar carnets

---

## 📊 **Tabla en Base de Datos**

```sql
CREATE TABLE Carnets (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Carnet VARCHAR(50) UNIQUE NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Pais VARCHAR(10) NOT NULL,
    Bandera VARCHAR(10),
    Union_Federacion VARCHAR(50),
    FotoUrl VARCHAR(255),
    Estatus ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    UsuarioId INT NOT NULL,
    AdministradorAprobadorId INT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaAprobacion TIMESTAMP NULL,
    Comentarios TEXT,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id),
    FOREIGN KEY (AdministradorAprobadorId) REFERENCES Usuarios(Id)
);
```

---

## 🛠️ **Solución al Error Actual**

El error que viste: `"Unexpected token '<', "<!DOCTYPE "..."`

**Causa:** El usuario NO está autenticado (falta token JWT)

**Soluciones:**

### Opción 1: Iniciar Sesión Primero
```
1. Ir a: http://localhost:3000/login.html
2. Iniciar sesión con usuario válido
3. El sistema guarda el token en localStorage
4. Regresar a solicitar-carnet.html
5. Enviar solicitud
```

### Opción 2: Hacer Ruta Pública (Para Pruebas)
Modificar temporalmente `carnetsRoutes.js`:

```javascript
// SOLO PARA PRUEBAS - Quitar verificarToken
router.post(
    '/solicitudes',
    // verificarToken,  ← Comentar esta línea
    carnetsController.crearSolicitudCarnetBase64
);
```

**⚠️ IMPORTANTE:** Esto es SOLO para pruebas. En producción DEBE tener autenticación.

---

## 🎯 **Crear Panel de Administración**

Necesitas crear una página HTML para que los administradores puedan:

### Archivo: `admin-carnets.html` (ya existe)

Debe tener:
1. **Lista de solicitudes pendientes**
   - Ver foto
   - Ver datos del usuario
   - Botón "Aprobar"
   - Botón "Rechazar"

2. **Formulario de aprobación**
   - Campo para comentarios (opcional)
   - Confirmación

3. **Formulario de rechazo**
   - Campo para comentarios (obligatorio)
   - Razón del rechazo

---

## 📱 **Ejemplo de Uso Completo**

### Paso 1: Usuario Solicita
```javascript
// Frontend: solicitar-carnet.html
Usuario completa formulario → Clic "Enviar"
↓
Backend: POST /api/carnets/solicitudes
↓
BD: INSERT INTO Carnets (Estatus = 'pendiente')
↓
Usuario ve: "Solicitud enviada - ID #123"
```

### Paso 2: Admin Revisa
```javascript
// Frontend: admin-carnets.html
Admin ve lista de pendientes
↓
Backend: GET /api/carnets?estatus=pendiente
↓
Admin ve:
- Foto de Ronnie
- Datos: DO, Masculino, Cédula 402-xxx
- Botones: [Aprobar] [Rechazar]
```

### Paso 3: Admin Aprueba
```javascript
Admin clic "Aprobar" → Escribe comentario (opcional)
↓
Backend: POST /api/carnets/123/aprobar
↓
BD: UPDATE Carnets SET Estatus='aprobado', FechaAprobacion=NOW()
↓
Usuario puede ver su carnet APROBADO
```

---

## 🔄 **Auditoría**

Todas las acciones quedan registradas en `AuditLog`:

```sql
INSERT INTO AuditLog (
  UsuarioId,
  Accion,
  Entidad,
  EntidadId,
  Detalles,
  IPAddress
) VALUES (
  123,
  'APROBAR_CARNET',
  'Carnets',
  1,
  '{"carnet":"CARD-xxx","nombre":"Ronnie Hernandez"}',
  '192.168.1.1'
);
```

---

## 🆘 **Troubleshooting**

### Error: "Unexpected token"
**Causa:** No hay token JWT
**Solución:** Iniciar sesión primero

### Error: "Unknown database"
**Causa:** Base de datos no configurada
**Solución:** Crear BD y tablas

### Error: "Token inválido"
**Causa:** Token expirado o inválido
**Solución:** Cerrar sesión y volver a iniciar

### Solicitud se queda "ENVIANDO..."
**Causa:** Error en el backend (ver logs del servidor)
**Solución:** Revisar consola del servidor

---

## ✅ **Checklist de Implementación**

- [x] Formulario de solicitud funcionando
- [x] Backend recibe y guarda solicitudes
- [x] Conversión base64 → archivo
- [x] Generación de IDs únicos
- [ ] **Autenticación JWT** ← PENDIENTE
- [ ] **Configurar base de datos** ← PENDIENTE
- [ ] **Panel de administración** ← PENDIENTE
- [ ] Sistema de notificaciones
- [ ] Descarga de carnet aprobado

---

**Próximo Paso Recomendado:**
1. Configurar la base de datos
2. Crear usuario de prueba
3. Obtener token JWT
4. Probar flujo completo
