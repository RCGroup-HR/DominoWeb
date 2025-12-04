# Sistema de Administración de Carnets - ScoreDomino

## 📋 Descripción

Sistema completo de gestión de carnets de jugadores de dominó con funcionalidades de:
- Registro y autenticación de usuarios
- Solicitud de carnets con subida de fotos
- Sistema de aprobación por administradores
- Roles y permisos (usuario, administrador)
- Segmentación por país
- Auditoría completa de acciones

---

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

**Nuevas dependencias agregadas:**
- `bcryptjs` - Encriptación de contraseñas
- `jsonwebtoken` - Tokens JWT para autenticación
- `multer` - Subida de archivos (fotos)

### 2. Configurar variables de entorno

Agrega estas nuevas variables a tu archivo `.env`:

```env
# JWT Configuration
JWT_SECRET=tu_secret_key_super_secreto_aqui_cambiar_en_produccion
JWT_EXPIRATION=24h
```

**IMPORTANTE:** Genera un JWT_SECRET seguro para producción. Puedes usar:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Crear las tablas en la base de datos

Ejecuta el script SQL ubicado en `database/schema.sql`:

```bash
mysql -u tu_usuario -p nombre_base_datos < database/schema.sql
```

O copia y ejecuta el contenido del archivo en tu cliente MySQL.

**Tablas creadas:**
- `Usuarios` - Usuarios del sistema
- `Carnets` - Carnets de jugadores
- `Sesiones` - Tokens JWT activos
- `AuditLog` - Registro de auditoría
- `Paises` - Catálogo de países

### 4. Crear directorio para fotos

El sistema creará automáticamente el directorio, pero puedes crearlo manualmente:

```bash
mkdir -p public/uploads/fotos-carnets
```

### 5. Iniciar el servidor

```bash
npm start
```

O en modo desarrollo:

```bash
npm run dev
```

---

## 👤 Usuario Administrador Por Defecto

El script SQL crea un administrador por defecto:

- **Email:** `admin@scoredomino.com`
- **Contraseña:** `admin123`

**⚠️ IMPORTANTE:** Cambia esta contraseña inmediatamente en producción.

Para cambiar la contraseña del administrador:
1. Inicia sesión con las credenciales por defecto
2. Ve a tu perfil y cambia la contraseña
3. O actualiza directamente en la base de datos con una contraseña hasheada

---

## 📱 Páginas del Sistema

### Páginas Públicas
- `/login.html` - Inicio de sesión
- `/registro.html` - Registro de nuevos usuarios

### Páginas de Usuario
- `/mis-carnets.html` - Gestión de carnets del usuario
  - Ver mis carnets
  - Solicitar nuevos carnets
  - Subir foto de perfil
  - Ver estado de aprobación

### Páginas de Administrador
- `/admin-carnets.html` - Panel de administración
  - Ver estadísticas generales
  - Aprobar/rechazar solicitudes
  - Gestionar todos los carnets
  - Filtros por país y estado
  - Eliminar carnets

---

## 🔑 API Endpoints

### Autenticación

#### POST `/api/auth/registro`
Registrar nuevo usuario

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "pais": "República Dominicana"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "rol": "usuario",
    "pais": "República Dominicana"
  }
}
```

---

#### POST `/api/auth/login`
Iniciar sesión

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "rol": "usuario",
      "pais": "República Dominicana"
    }
  }
}
```

---

#### POST `/api/auth/logout`
Cerrar sesión (requiere autenticación)

**Headers:**
```
Authorization: Bearer {token}
```

---

#### GET `/api/auth/perfil`
Obtener perfil del usuario actual

**Headers:**
```
Authorization: Bearer {token}
```

---

### Carnets

#### POST `/api/carnets`
Crear solicitud de carnet (requiere autenticación)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `carnet` (string) - Número de carnet
- `nombre` (string) - Nombre completo
- `pais` (string) - País
- `union_federacion` (string, opcional) - Federación
- `foto` (file, opcional) - Foto de perfil (JPG, PNG, GIF, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Solicitud de carnet creada exitosamente. Pendiente de aprobación",
  "data": {
    "id": 1,
    "carnet": "DOM-12345",
    "nombre": "Juan Pérez",
    "pais": "República Dominicana",
    "fotoUrl": "/uploads/fotos-carnets/carnet-1234567890.jpg",
    "estatus": "pendiente"
  }
}
```

---

#### GET `/api/carnets`
Listar carnets (requiere autenticación)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `estatus` - pendiente | aprobado | rechazado
- `pais` - Nombre del país
- `buscar` - Buscar por nombre o carnet
- `page` - Número de página (default: 1)
- `limit` - Límite por página (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

#### GET `/api/carnets/:id`
Obtener carnet por ID (requiere autenticación)

---

#### PUT `/api/carnets/:id`
Actualizar carnet (propietario o administrador)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

---

#### POST `/api/carnets/:id/aprobar`
Aprobar carnet (solo administradores)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "comentarios": "Carnet aprobado correctamente"
}
```

---

#### POST `/api/carnets/:id/rechazar`
Rechazar carnet (solo administradores)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "comentarios": "Motivo del rechazo (requerido)"
}
```

---

#### DELETE `/api/carnets/:id`
Eliminar carnet (solo administradores)

---

#### GET `/api/carnets/admin/estadisticas`
Obtener estadísticas (solo administradores)

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "total": 150,
      "pendientes": 25,
      "aprobados": 120,
      "rechazados": 5
    },
    "porPais": [...]
  }
}
```

---

#### GET `/api/carnets/paises`
Listar países disponibles (público)

---

### Gestión de Usuarios (Solo Administradores)

#### GET `/api/auth/usuarios`
Listar todos los usuarios

**Query Params:**
- `pais` - Filtrar por país
- `rol` - usuario | administrador
- `activo` - true | false
- `page` - Número de página
- `limit` - Límite por página

---

#### PUT `/api/auth/usuarios/:userId/rol`
Cambiar rol de usuario

**Body:**
```json
{
  "rol": "administrador"
}
```

---

#### PUT `/api/auth/usuarios/:userId/activo`
Activar/desactivar usuario

**Body:**
```json
{
  "activo": false
}
```

---

## 🔒 Seguridad

### Autenticación
- Sistema JWT (JSON Web Tokens)
- Tokens con expiración configurable (default: 24h)
- Tokens almacenados en base de datos para revocación
- Logout invalida el token

### Contraseñas
- Hasheadas con bcrypt (10 rounds)
- Validación de longitud mínima (6 caracteres)
- No se almacenan en texto plano

### Autorización
- Middleware de verificación de token
- Middleware de verificación de roles
- Usuarios solo pueden ver/editar sus propios carnets
- Administradores tienen acceso completo

### Subida de Archivos
- Solo imágenes permitidas (JPEG, PNG, GIF, WEBP)
- Tamaño máximo: 5MB
- Nombres de archivo únicos generados automáticamente
- Validación de tipo MIME

### Auditoría
- Todas las acciones importantes se registran
- Se guarda: usuario, acción, entidad, detalles, IP, fecha
- Útil para rastrear cambios y actividad sospechosa

---

## 📊 Estructura de Datos

### Usuario
```javascript
{
  Id: number,
  Email: string,
  Password: string (hasheada),
  Rol: 'usuario' | 'administrador',
  Pais: string,
  FechaCreacion: timestamp,
  Activo: boolean
}
```

### Carnet
```javascript
{
  Id: number,
  Carnet: string,
  Nombre: string,
  Pais: string,
  Bandera: string,
  Union_Federacion: string,
  FotoUrl: string,
  Estatus: 'pendiente' | 'aprobado' | 'rechazado',
  UsuarioId: number,
  AdministradorAprobadorId: number,
  FechaCreacion: timestamp,
  FechaAprobacion: timestamp,
  Comentarios: text
}
```

---

## 🎨 Flujo de Usuario

### Usuario Regular

1. **Registro**
   - Usuario visita `/registro.html`
   - Completa formulario con email, contraseña y país
   - Se crea cuenta con rol "usuario"

2. **Login**
   - Usuario inicia sesión en `/login.html`
   - Recibe token JWT
   - Es redirigido a `/mis-carnets.html`

3. **Solicitar Carnet**
   - Hace clic en "Nuevo Carnet"
   - Completa formulario:
     - Número de carnet
     - Nombre completo
     - País
     - Unión/Federación (opcional)
     - Foto de perfil (opcional)
   - Envía solicitud
   - Carnet queda en estado "pendiente"

4. **Ver Estado**
   - Ve sus carnets en `/mis-carnets.html`
   - Puede ver el estado: pendiente, aprobado o rechazado
   - Si fue rechazado, ve los comentarios del administrador

### Administrador

1. **Login**
   - Administrador inicia sesión en `/login.html`
   - Es redirigido a `/admin-carnets.html`

2. **Ver Dashboard**
   - Ve estadísticas generales:
     - Total de carnets
     - Pendientes de aprobación
     - Aprobados
     - Rechazados

3. **Gestionar Solicitudes**
   - Ve carnets pendientes en la pestaña "Pendientes"
   - Puede ver detalles completos de cada carnet
   - Opciones:
     - **Aprobar:** Carnet pasa a estado "aprobado"
     - **Rechazar:** Debe proporcionar motivo
     - **Eliminar:** Elimina permanentemente

4. **Filtros y Búsqueda**
   - Puede filtrar por:
     - Estado (pendiente, aprobado, rechazado, todos)
     - País
     - Nombre o número de carnet

---

## 🔧 Personalización

### Agregar más países

Edita el archivo `database/schema.sql` e inserta más países:

```sql
INSERT INTO Paises (Codigo, Nombre, BanderaUrl) VALUES
('AR', 'Argentina', '/Pais/AR.png'),
('BR', 'Brasil', '/Pais/BR.png');
```

### Cambiar tiempo de expiración de tokens

En `.env`:
```env
JWT_EXPIRATION=48h  # 48 horas
JWT_EXPIRATION=7d   # 7 días
```

### Cambiar tamaño máximo de foto

En `src/middleware/upload.js`:
```javascript
limits: {
  fileSize: 10 * 1024 * 1024 // Cambiar a 10MB
}
```

---

## 🐛 Solución de Problemas

### Error: "Token inválido o expirado"
- El token JWT expiró o es inválido
- Solución: Vuelve a iniciar sesión

### Error: "No tienes permisos"
- Intentas acceder a una función de administrador siendo usuario regular
- Solución: Contacta al administrador

### Foto no se sube
- Verifica que el directorio `public/uploads/fotos-carnets` exista
- Verifica permisos de escritura en el directorio
- Verifica que el tamaño no exceda 5MB

### No puedo iniciar sesión como administrador
- Verifica que el script SQL se ejecutó correctamente
- Verifica la tabla `Usuarios` en la base de datos
- El email debe ser: `admin@scoredomino.com`
- La contraseña por defecto es: `admin123`

---

## 📝 Notas Adicionales

### Producción

Antes de desplegar a producción:

1. ✅ Cambia `JWT_SECRET` a un valor seguro y único
2. ✅ Cambia la contraseña del administrador por defecto
3. ✅ Configura backups automáticos de la base de datos
4. ✅ Configura HTTPS (los tokens JWT deben ir por conexión segura)
5. ✅ Revisa los logs de auditoría regularmente
6. ✅ Configura límites de rate limiting en el servidor

### Integración con Sistema Existente

Este sistema es **independiente** del sistema de ranking existente. Los carnets aquí son para **gestión administrativa**, no para el ranking de torneos.

Si quieres integrarlos:
1. Puedes relacionar la tabla `Carnets` con `RIndividual` por el número de carnet
2. Agregar columna `CarnetId` en `RIndividual`
3. Mostrar foto del carnet en el ranking

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

---

**Sistema desarrollado para ScoreDomino.com**
