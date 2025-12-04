-- ============================================
-- SQL para Sistema de Carnets
-- Ejecutar SOLO las tablas nuevas
-- ============================================

-- 1. Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS carnet_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'administrador') DEFAULT 'usuario',
    pais_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_sesion TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de carnets
CREATE TABLE IF NOT EXISTS carnets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    numero_carnet VARCHAR(50) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255) NOT NULL,
    pais_id INT NOT NULL,
    federacion VARCHAR(255) NULL,
    foto_url VARCHAR(500) NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    comentarios TEXT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP NULL,
    aprobado_por INT NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_pais (pais_id),
    INDEX idx_numero_carnet (numero_carnet),
    FOREIGN KEY (usuario_id) REFERENCES carnet_usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE RESTRICT,
    FOREIGN KEY (aprobado_por) REFERENCES carnet_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de historial de cambios en carnets (auditoría)
CREATE TABLE IF NOT EXISTS carnets_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carnet_id INT NOT NULL,
    usuario_id INT NOT NULL,
    accion ENUM('creado', 'aprobado', 'rechazado', 'modificado', 'eliminado') NOT NULL,
    estado_anterior VARCHAR(50) NULL,
    estado_nuevo VARCHAR(50) NULL,
    comentario TEXT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_carnet (carnet_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    FOREIGN KEY (carnet_id) REFERENCES carnets(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES carnet_usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de sesiones (tokens JWT)
CREATE TABLE IF NOT EXISTS carnet_sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token_hash),
    INDEX idx_activa (activa),
    FOREIGN KEY (usuario_id) REFERENCES carnet_usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de intentos de login (seguridad)
CREATE TABLE IF NOT EXISTS carnet_login_intentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    exitoso BOOLEAN DEFAULT FALSE,
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_ip (ip_address),
    INDEX idx_fecha (fecha_intento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Crear usuario administrador por defecto
-- ============================================
-- Contraseña: admin123 (encriptada con bcrypt)
INSERT INTO carnet_usuarios (email, password, nombre, rol, pais_id, activo)
VALUES (
    'admin@scoredomino.com',
    '$2b$10$rZ4QJmEY5F8xH9XqN0Y.3.zK8xLr0yVwC1GqJ5wT3vR7mN2pQ8yZS',
    'Administrador del Sistema',
    'administrador',
    (SELECT id FROM paises WHERE nombre = 'República Dominicana' LIMIT 1),
    TRUE
) ON DUPLICATE KEY UPDATE email = email;

-- ============================================
-- Verificaciones finales
-- ============================================

-- Ver las tablas creadas
SELECT 'Tablas creadas correctamente:' AS mensaje;
SHOW TABLES LIKE 'carnet%';

-- Verificar usuario administrador
SELECT 'Usuario administrador creado:' AS mensaje;
SELECT id, email, nombre, rol FROM carnet_usuarios WHERE rol = 'administrador';

-- Estadísticas iniciales
SELECT 'Estadísticas iniciales:' AS mensaje;
SELECT
    (SELECT COUNT(*) FROM carnet_usuarios) AS total_usuarios,
    (SELECT COUNT(*) FROM carnets) AS total_carnets,
    (SELECT COUNT(*) FROM carnets WHERE estado = 'pendiente') AS carnets_pendientes,
    (SELECT COUNT(*) FROM carnets WHERE estado = 'aprobado') AS carnets_aprobados;
