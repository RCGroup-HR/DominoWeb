-- ============================================
-- PATROCINADORES - ScoreDomino
-- Tabla para gestionar el carousel de patrocinadores del homepage
-- Ejecutar después de schema-admin.sql
-- ============================================

CREATE TABLE IF NOT EXISTS Patrocinadores (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    Nombre      VARCHAR(150)  NOT NULL,
    ImagenUrl   VARCHAR(500)  NOT NULL COMMENT 'URL de la imagen (absoluta o relativa a /public)',
    LinkUrl     VARCHAR(500)  NULL     COMMENT 'URL de Instagram u otro enlace al hacer clic',
    Orden       TINYINT       NOT NULL DEFAULT 99 COMMENT 'Posición en el carousel (menor = primero)',
    Activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    CreadoAt    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    ActualizadoAt TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orden  (Orden),
    INDEX idx_activo (Activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales (patrocinadores actuales)
-- ============================================
INSERT INTO Patrocinadores (Nombre, ImagenUrl, LinkUrl, Orden) VALUES
('Industrial Shal',    'patrocinadores/logo.jpg',  'https://www.instagram.com/industrialshal_/',    1),
('Movimiento Jugadores','patrocinadores/logo5.png', 'https://www.instagram.com/movimientojugadores/', 2),
('TJ Multiservice',    'patrocinadores/logo4.jpg',  'https://www.instagram.com/tj.multiservice/',   3),
('Brisas del Olimpo',  'patrocinadores/logo2.jpg',  'https://www.instagram.com/brisasdelolimpo/',   4),
('Ronnie Hdez',        'patrocinadores/logo3.png',  'https://www.instagram.com/ronniehdez/',        5);
