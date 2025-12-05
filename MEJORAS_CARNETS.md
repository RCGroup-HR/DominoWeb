# Mejoras del Sistema de Carnets

## Resumen de Mejoras Implementadas

Se han realizado mejoras significativas al sistema de carnets para proporcionar una mejor experiencia de usuario y mayor personalización.

---

## 1. Vista Previa en Tiempo Real

### Usuario: Solicitar Nuevo Carnet (`/mis-carnets.html`)

Ahora cuando un usuario llena el formulario para solicitar un nuevo carnet, puede ver una **vista previa en tiempo real** del carnet mientras escribe:

**Características:**
- Vista previa lado a lado con el formulario
- Actualización automática al escribir
- Diseño profesional con los colores de ScoreDomino
- Muestra todos los campos:
  - Logo de la entidad (configurable)
  - Número de carnet
  - Nombre completo
  - País
  - Unión/Federación (si se proporciona)
  - Foto de perfil
  - Estado (Pendiente de aprobación)

**Diseño del Carnet:**
- Fondo verde degradado (#1e6b4f a #145a40)
- Borde naranja (#f97316) en los elementos destacados
- Logo circular en el encabezado
- Foto tipo credencial con borde verde
- Información organizada por secciones
- Footer con nombre de la entidad

---

## 2. Vista Previa Mejorada para Administradores

### Administrador: Vista de Detalles (`/admin-carnets.html`)

Cuando un administrador hace clic en "Ver" para ver los detalles de un carnet:

**Características:**
- Muestra el carnet con el diseño final
- Vista previa profesional centrada
- Refleja el estado actual (Pendiente/Aprobado/Rechazado)
- Información adicional debajo del carnet:
  - Usuario solicitante
  - Fechas de creación y aprobación
  - Administrador que aprobó
  - Comentarios

---

## 3. Sistema de Configuración Personalizable

### Nueva Funcionalidad: Logo y Personalización de Entidad

Se ha agregado un sistema completo de configuración para personalizar los carnets.

#### Base de Datos

**Nueva tabla: `carnet_configuracion`**

Archivo: `/database/schema-carnets-configuracion.sql`

```sql
CREATE TABLE carnet_configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NULL,
    descripcion VARCHAR(255) NULL,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modificado_por INT NULL
);
```

**Configuraciones disponibles:**

| Clave | Valor por Defecto | Descripción |
|-------|------------------|-------------|
| `logo_entidad_url` | `/img/default-logo.png` | URL del logo de la entidad |
| `nombre_entidad` | `ScoreDomino` | Nombre de la entidad emisora |
| `titulo_carnet` | `CARNET OFICIAL` | Título principal del carnet |
| `subtitulo_carnet` | `Dominó Internacional` | Subtítulo del carnet |
| `emoji_logo` | `🎲` | Emoji por defecto si no hay logo |
| `colores_primario` | `#1e6b4f` | Color primario (verde) |
| `colores_secundario` | `#f97316` | Color secundario (naranja) |

#### Backend

**Nuevo controlador: `/src/controllers/carnetConfigController.js`**

Métodos disponibles:
- `obtenerConfiguracion()` - Obtener toda la configuración (público)
- `actualizarConfiguracion()` - Actualizar una configuración (admin)
- `subirLogo()` - Subir logo personalizado (admin)
- `actualizarMultiplesConfiguraciones()` - Actualizar varias configuraciones (admin)

**Nuevas rutas: `/src/routes/carnetConfigRoutes.js`**

Endpoint base: `/api/carnets/config`

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/api/carnets/config` | Obtener configuración | Pública |
| PUT | `/api/carnets/config` | Actualizar una configuración | Admin |
| PUT | `/api/carnets/config/multiples` | Actualizar múltiples | Admin |
| POST | `/api/carnets/config/logo` | Subir logo | Admin |

#### Frontend

Ambas páginas (`mis-carnets.html` y `admin-carnets.html`) ahora:
1. Cargan la configuración al inicio
2. Aplican el logo personalizado si existe
3. Usan los textos configurados
4. Muestran el logo en el carnet

---

## 4. Cómo Usar las Nuevas Características

### Para Usuarios

1. **Solicitar un Carnet:**
   - Ir a `/mis-carnets.html`
   - Hacer clic en "Nuevo Carnet"
   - Llenar el formulario
   - **Ver la vista previa actualizándose en tiempo real**
   - Subir una foto (opcional)
   - Enviar solicitud

### Para Administradores

1. **Ver Carnets con el Nuevo Diseño:**
   - Ir a `/admin-carnets.html`
   - Hacer clic en "Ver" en cualquier carnet
   - Verás el carnet con el diseño profesional

2. **Personalizar el Logo de la Entidad:**

**Opción 1: Usando la API directamente**

```javascript
// Subir logo
const formData = new FormData();
formData.append('logo', archivoLogo);

fetch('/api/carnets/config/logo', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

**Opción 2: Actualizar configuración manualmente**

```javascript
// Cambiar nombre de la entidad
fetch('/api/carnets/config', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        clave: 'nombre_entidad',
        valor: 'Federación Dominicana de Dominó'
    })
});

// Cambiar título del carnet
fetch('/api/carnets/config', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        clave: 'titulo_carnet',
        valor: 'CARNET OFICIAL FDD'
    })
});
```

**Opción 3: Actualizar varias configuraciones a la vez**

```javascript
fetch('/api/carnets/config/multiples', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        configuraciones: [
            { clave: 'nombre_entidad', valor: 'Mi Federación' },
            { clave: 'titulo_carnet', valor: 'CARNET OFICIAL' },
            { clave: 'subtitulo_carnet', valor: 'Dominó Profesional' }
        ]
    })
});
```

---

## 5. Instalación y Configuración

### Paso 1: Ejecutar Script de Base de Datos

```bash
# Ejecutar el nuevo script SQL
mysql -u tu_usuario -p nombre_base_datos < database/schema-carnets-configuracion.sql
```

Esto creará:
- La tabla `carnet_configuracion`
- Los valores de configuración por defecto

### Paso 2: Reiniciar el Servidor

```bash
npm start
# o
node server.js
```

### Paso 3: Probar la Funcionalidad

1. Ir a `/mis-carnets.html`
2. Hacer clic en "Nuevo Carnet"
3. Verificar que la vista previa aparece
4. Llenar el formulario y ver la actualización en tiempo real

---

## 6. Estructura de Archivos Modificados/Creados

```
domino-api/
├── database/
│   └── schema-carnets-configuracion.sql          [NUEVO]
├── public/
│   ├── mis-carnets.html                          [MODIFICADO]
│   ├── admin-carnets.html                        [MODIFICADO]
│   └── uploads/
│       └── logos/                                 [NUEVO DIRECTORIO]
├── src/
│   ├── controllers/
│   │   └── carnetConfigController.js             [NUEVO]
│   ├── routes/
│   │   └── carnetConfigRoutes.js                 [NUEVO]
│   └── app.js                                     [MODIFICADO]
└── MEJORAS_CARNETS.md                            [NUEVO]
```

---

## 7. Características del Diseño del Carnet

### Colores Principales
- **Verde primario:** `#1e6b4f` - Fondo y elementos principales
- **Verde oscuro:** `#145a40` - Degradado
- **Naranja:** `#f97316` - Bordes y acentos
- **Blanco:** Fondo del carnet

### Dimensiones
- **Carnet:** 320px de ancho máximo
- **Logo:** 80x80px (circular)
- **Foto:** 150x180px (rectangular con bordes redondeados)

### Tipografía
- **Título:** 18px, bold
- **Subtítulo:** 12px
- **Número de carnet:** 16px, bold, con letter-spacing
- **Etiquetas de campo:** 10px, uppercase
- **Valores de campo:** 14px, bold

---

## 8. Seguridad

- ✅ Solo administradores pueden cambiar la configuración
- ✅ Validación de tipos de archivo para logos
- ✅ Límite de tamaño de 5MB para logos
- ✅ Tokens JWT requeridos para modificaciones
- ✅ Auditoría: Se guarda quién modificó cada configuración

---

## 9. Próximas Mejoras Sugeridas

1. **Panel de Administración de Configuración:**
   - Crear página `/admin-configuracion.html`
   - Interfaz visual para cambiar logo y textos
   - Vista previa en tiempo real de cambios

2. **Exportar Carnet como PDF:**
   - Botón para descargar el carnet
   - Generación de PDF del lado del servidor
   - Código QR con información del carnet

3. **Múltiples Plantillas:**
   - Diferentes diseños de carnet
   - Selección de plantilla por tipo de usuario
   - Personalización de colores por entidad

4. **Carnet Digital:**
   - Versión digital con código QR
   - Verificación en línea
   - App móvil para mostrar carnet

---

## 10. Soporte

Para más información sobre el sistema de carnets original, consulta:
- `SISTEMA_CARNETS_README.md` - Documentación completa del sistema

Para reportar problemas o sugerencias:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Versión:** 2.0
**Fecha:** Diciembre 2025
**Autor:** Sistema ScoreDomino
