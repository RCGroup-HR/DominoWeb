-- ============================================
-- MÓDULO DE INSCRIPCIÓN DE EQUIPOS - ScoreDomino
-- Torneos, equipos y jugadores de inscripción pública.
-- Prefijo insc_ para no colisionar con las tablas del
-- sistema existente (torneo/equipo/jugador).
--
-- Edición de equipos: se autoriza con el CodigoEquipo,
-- que NUNCA debe exponerse en la búsqueda pública.
-- ============================================

-- Limpieza idempotente (orden por dependencias)
DROP VIEW  IF EXISTS vista_insc_equipos_publica;
DROP VIEW  IF EXISTS vista_insc_equipos_admin;
DROP TABLE IF EXISTS insc_equipo_jugador;
DROP TABLE IF EXISTS insc_equipos;
DROP TABLE IF EXISTS insc_jugadores;
DROP TABLE IF EXISTS insc_torneos;

-- ============================================
-- 1. TORNEOS
-- ============================================
CREATE TABLE insc_torneos (
    Id                      INT AUTO_INCREMENT PRIMARY KEY,
    Nombre                  VARCHAR(200) NOT NULL,
    Lugar                   VARCHAR(200) NULL COMMENT 'Lugar/sede del evento',
    FechaInicio             DATE NULL,
    FechaFin                DATE NULL,
    JugadoresPorEquipo      TINYINT      NOT NULL DEFAULT 4 COMMENT 'Cantidad de jugadores generados por equipo',
    FechaLimiteModificacion DATETIME     NULL COMMENT 'Tras esta fecha solo el admin puede modificar',
    BusquedaJugadores       BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Activa la búsqueda/reutilización de jugadores existentes',
    Estado                  ENUM('borrador','abierto','cerrado','finalizado') NOT NULL DEFAULT 'borrador' COMMENT 'abierto = inscripciones abiertas',
    FechaCreacion           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ActualizadoAt           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. JUGADORES (base histórica reutilizable, sin correo)
-- ============================================
CREATE TABLE insc_jugadores (
    Id              INT AUTO_INCREMENT PRIMARY KEY,
    CodigoJugador   VARCHAR(50)  UNIQUE NOT NULL,
    NombreCompleto  VARCHAR(255) NOT NULL,
    Genero          ENUM('masculino','femenino','otro') NULL,
    FechaNacimiento DATE         NULL COMMENT 'Opcional',
    Telefono        VARCHAR(50)  NULL COMMENT 'Opcional',
    FechaRegistro   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (NombreCompleto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. EQUIPOS
-- ============================================
CREATE TABLE insc_equipos (
    Id                       INT AUTO_INCREMENT PRIMARY KEY,
    CodigoEquipo             VARCHAR(20)  UNIQUE NOT NULL COMMENT 'Código único, ej: EQ-X7M9K2A4P',
    TorneoId                 INT          NOT NULL,
    NombreEquipo             VARCHAR(200) NOT NULL,
    Club                     VARCHAR(200) NULL,
    Pais                     VARCHAR(100) NULL,
    Representante            VARCHAR(200) NOT NULL,
    CorreoRepresentante      VARCHAR(255) NOT NULL,
    Telefono                 VARCHAR(50)  NULL,
    Estado                   ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
    AdministradorAprobadorId INT          NULL COMMENT 'Id del usuario admin que aprobó (sin FK por compatibilidad de entornos)',
    Comentarios              TEXT         NULL,
    FechaRegistro            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ActualizadoAt            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (TorneoId) REFERENCES insc_torneos(Id) ON DELETE CASCADE,
    INDEX idx_codigo (CodigoEquipo),
    INDEX idx_torneo (TorneoId),
    INDEX idx_estado (Estado),
    INDEX idx_correo (CorreoRepresentante),
    INDEX idx_pais (Pais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. EQUIPO_JUGADOR (relación N:M con posición)
-- ============================================
CREATE TABLE insc_equipo_jugador (
    Id        INT AUTO_INCREMENT PRIMARY KEY,
    EquipoId  INT     NOT NULL,
    JugadorId INT     NOT NULL,
    Posicion  TINYINT NOT NULL DEFAULT 1 COMMENT 'Número de jugador dentro del equipo (1..N)',
    FOREIGN KEY (EquipoId)  REFERENCES insc_equipos(Id)   ON DELETE CASCADE,
    FOREIGN KEY (JugadorId) REFERENCES insc_jugadores(Id) ON DELETE CASCADE,
    UNIQUE KEY uq_equipo_jugador (EquipoId, JugadorId),
    INDEX idx_equipo  (EquipoId),
    INDEX idx_jugador (JugadorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Vista PÚBLICA (sin código, correo ni teléfono)
-- ============================================
CREATE VIEW vista_insc_equipos_publica AS
SELECT
    e.Id,
    e.NombreEquipo,
    e.Club,
    e.Pais,
    e.Representante,
    e.Estado,
    e.FechaRegistro,
    t.Id      AS TorneoId,
    t.Nombre  AS TorneoNombre,
    t.JugadoresPorEquipo,
    COUNT(ej.Id) AS TotalJugadores
FROM insc_equipos e
JOIN insc_torneos t            ON e.TorneoId = t.Id
LEFT JOIN insc_equipo_jugador ej ON ej.EquipoId = e.Id
GROUP BY e.Id;

-- ============================================
-- 6. Vista ADMIN (datos completos)
-- ============================================
CREATE VIEW vista_insc_equipos_admin AS
SELECT
    e.Id,
    e.CodigoEquipo,
    e.NombreEquipo,
    e.Club,
    e.Pais,
    e.Representante,
    e.CorreoRepresentante,
    e.Telefono,
    e.Estado,
    e.AdministradorAprobadorId,
    e.FechaRegistro,
    t.Id      AS TorneoId,
    t.Nombre  AS TorneoNombre,
    t.JugadoresPorEquipo,
    COUNT(ej.Id) AS TotalJugadores
FROM insc_equipos e
JOIN insc_torneos t            ON e.TorneoId = t.Id
LEFT JOIN insc_equipo_jugador ej ON ej.EquipoId = e.Id
GROUP BY e.Id;

-- ============================================
-- 7. Datos de ejemplo (un torneo abierto)
-- ============================================
INSERT INTO insc_torneos (Nombre, Lugar, FechaInicio, FechaFin, JugadoresPorEquipo, Estado)
VALUES ('Copa Internacional ScoreDomino 2026', 'Santo Domingo, R.D.', '2026-08-01', '2026-08-15', 4, 'abierto');

-- ============================================
-- Verificación
-- ============================================
SELECT 'Módulo de inscripción creado (insc_*).' AS mensaje;
SELECT TABLE_NAME, TABLE_TYPE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'insc\_%' OR TABLE_NAME LIKE 'vista_insc%';
