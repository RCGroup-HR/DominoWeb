-- ============================================
-- SISTEMA DE ADMINISTRACIÓN DE CARNETS
-- ScoreDomino.com
-- ============================================

-- Tabla de Usuarios del Sistema
CREATE TABLE IF NOT EXISTS Usuarios (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Rol ENUM('usuario', 'administrador') DEFAULT 'usuario',
    Pais VARCHAR(100),
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (Email),
    INDEX idx_rol (Rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Carnets (Jugadores)
CREATE TABLE IF NOT EXISTS Carnets (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Carnet VARCHAR(50) UNIQUE NOT NULL,
    Nombre VARCHAR(255) NOT NULL,
    Pais VARCHAR(100) NOT NULL,
    Bandera VARCHAR(255),
    Union_Federacion VARCHAR(255),
    FotoUrl VARCHAR(500),
    Estatus ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    UsuarioId INT,
    AdministradorAprobadorId INT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaAprobacion TIMESTAMP NULL,
    Comentarios TEXT,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE SET NULL,
    FOREIGN KEY (AdministradorAprobadorId) REFERENCES Usuarios(Id) ON DELETE SET NULL,
    INDEX idx_carnet (Carnet),
    INDEX idx_estatus (Estatus),
    INDEX idx_pais (Pais),
    INDEX idx_usuario (UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Sesiones (para tokens JWT - opcional, para invalidar tokens)
CREATE TABLE IF NOT EXISTS Sesiones (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioId INT NOT NULL,
    Token VARCHAR(500) NOT NULL,
    FechaExpiracion TIMESTAMP NOT NULL,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE,
    INDEX idx_token (Token(255)),
    INDEX idx_usuario (UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Logs de Auditoría
CREATE TABLE IF NOT EXISTS AuditLog (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioId INT,
    Accion VARCHAR(100) NOT NULL,
    Entidad VARCHAR(50) NOT NULL,
    EntidadId INT,
    Detalles JSON,
    IPAddress VARCHAR(45),
    FechaAccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE SET NULL,
    INDEX idx_usuario (UsuarioId),
    INDEX idx_fecha (FechaAccion),
    INDEX idx_entidad (Entidad, EntidadId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Países (para validación y filtros)
CREATE TABLE IF NOT EXISTS Paises (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Codigo VARCHAR(10) UNIQUE NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    BanderaUrl VARCHAR(255),
    Activo BOOLEAN DEFAULT TRUE,
    INDEX idx_codigo (Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar administrador por defecto (password: admin123)
-- IMPORTANTE: Cambiar esta contraseña en producción
INSERT INTO Usuarios (Email, Password, Rol, Pais)
VALUES ('admin@scoredomino.com', '$2b$10$rQZ9YZYq4YZYq4YZYq4YZO8qj8q8q8q8q8q8q8q8q8q8q8q8q8q8q', 'administrador', 'República Dominicana')
ON DUPLICATE KEY UPDATE Email=Email;

-- Insertar algunos países comunes
INSERT INTO Paises (Codigo, Nombre, BanderaUrl) VALUES
('DO', 'República Dominicana', '/Pais/DO.png'),
('US', 'Estados Unidos', '/Pais/US.png'),
('ES', 'España', '/Pais/ES.png'),
('MX', 'México', '/Pais/MX.png'),
('CO', 'Colombia', '/Pais/CO.png'),
('VE', 'Venezuela', '/Pais/VE.png'),
('PR', 'Puerto Rico', '/Pais/PR.png'),
('CU', 'Cuba', '/Pais/CU.png')
ON DUPLICATE KEY UPDATE Codigo=Codigo;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de carnets con información de usuario
CREATE OR REPLACE VIEW vista_carnets_completa AS
SELECT
    c.Id,
    c.Carnet,
    c.Nombre,
    c.Pais,
    c.Bandera,
    c.Union_Federacion,
    c.FotoUrl,
    c.Estatus,
    c.FechaCreacion,
    c.FechaAprobacion,
    c.Comentarios,
    u.Email as UsuarioEmail,
    u.Rol as UsuarioRol,
    a.Email as AprobadorEmail
FROM Carnets c
LEFT JOIN Usuarios u ON c.UsuarioId = u.Id
LEFT JOIN Usuarios a ON c.AdministradorAprobadorId = a.Id;

-- Vista de estadísticas por país
CREATE OR REPLACE VIEW vista_estadisticas_pais AS
SELECT
    Pais,
    COUNT(*) as TotalCarnets,
    SUM(CASE WHEN Estatus = 'aprobado' THEN 1 ELSE 0 END) as Aprobados,
    SUM(CASE WHEN Estatus = 'pendiente' THEN 1 ELSE 0 END) as Pendientes,
    SUM(CASE WHEN Estatus = 'rechazado' THEN 1 ELSE 0 END) as Rechazados
FROM Carnets
GROUP BY Pais;
