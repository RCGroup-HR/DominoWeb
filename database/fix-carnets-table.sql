-- ============================================
-- FIX: Crear tabla Carnets (PascalCase) que
-- coincide con los controllers y la vista
-- ============================================

-- 1. Crear tabla Carnets con columnas PascalCase
CREATE TABLE IF NOT EXISTS Carnets (
    Id                      INT AUTO_INCREMENT PRIMARY KEY,
    Carnet                  VARCHAR(50)  NOT NULL UNIQUE,
    Nombre                  VARCHAR(255) NOT NULL,
    Pais                    VARCHAR(10)  NOT NULL,
    Bandera                 VARCHAR(10)  NULL,
    Union_Federacion        VARCHAR(255) NULL,
    FotoUrl                 VARCHAR(500) NULL,
    Estatus                 ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
    UsuarioId               INT          NOT NULL,
    AdministradorAprobadorId INT         NULL,
    FechaCreacion           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FechaAprobacion         TIMESTAMP    NULL,
    Comentarios             TEXT         NULL,
    INDEX idx_estatus  (Estatus),
    INDEX idx_pais     (Pais),
    INDEX idx_usuario  (UsuarioId),
    CONSTRAINT fk_Carnets_usuario    FOREIGN KEY (UsuarioId)                REFERENCES Usuarios(Id) ON DELETE CASCADE,
    CONSTRAINT fk_Carnets_aprobador  FOREIGN KEY (AdministradorAprobadorId) REFERENCES Usuarios(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Recrear la vista vista_carnets_completa apuntando a Carnets (PascalCase)
DROP VIEW IF EXISTS vista_carnets_completa;
CREATE VIEW vista_carnets_completa AS
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
    c.UsuarioId,
    u.Email  AS UsuarioEmail,
    u.Rol    AS UsuarioRol,
    a.Email  AS AprobadorEmail
FROM Carnets c
LEFT JOIN Usuarios u ON c.UsuarioId               = u.Id
LEFT JOIN Usuarios a ON c.AdministradorAprobadorId = a.Id;

-- 3. Recrear vista de estadísticas por país apuntando a Carnets
DROP VIEW IF EXISTS vista_estadisticas_pais;
CREATE VIEW vista_estadisticas_pais AS
SELECT
    p.Codigo,
    p.Nombre    AS NombrePais,
    p.BanderaUrl,
    COUNT(c.Id)                                                          AS TotalCarnets,
    SUM(CASE WHEN c.Estatus = 'aprobado'   THEN 1 ELSE 0 END)           AS Aprobados,
    SUM(CASE WHEN c.Estatus = 'pendiente'  THEN 1 ELSE 0 END)           AS Pendientes,
    SUM(CASE WHEN c.Estatus = 'rechazado'  THEN 1 ELSE 0 END)           AS Rechazados
FROM Paises p
LEFT JOIN Carnets c ON c.Pais = p.Codigo
GROUP BY p.Id, p.Codigo, p.Nombre, p.BanderaUrl;

-- Verificación
SELECT 'Tabla Carnets creada:' AS mensaje;
DESCRIBE Carnets;
SELECT 'Vistas recreadas correctamente' AS mensaje;
