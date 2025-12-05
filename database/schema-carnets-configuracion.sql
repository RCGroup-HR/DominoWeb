-- ============================================
-- SQL para Configuración de Sistema de Carnets
-- Tabla de configuración para personalización
-- ============================================

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS carnet_configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NULL,
    descripcion VARCHAR(255) NULL,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modificado_por INT NULL,
    INDEX idx_clave (clave),
    FOREIGN KEY (modificado_por) REFERENCES carnet_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto
INSERT INTO carnet_configuracion (clave, valor, descripcion) VALUES
('logo_entidad_url', '/img/default-logo.png', 'URL del logo de la entidad para los carnets'),
('nombre_entidad', 'ScoreDomino', 'Nombre de la entidad emisora del carnet'),
('titulo_carnet', 'CARNET OFICIAL', 'Título principal del carnet'),
('subtitulo_carnet', 'Dominó Internacional', 'Subtítulo del carnet'),
('emoji_logo', '🎲', 'Emoji por defecto si no hay logo personalizado'),
('colores_primario', '#1e6b4f', 'Color primario del carnet (hexadecimal)'),
('colores_secundario', '#f97316', 'Color secundario del carnet (hexadecimal)')
ON DUPLICATE KEY UPDATE clave = clave;

-- Verificar configuraciones creadas
SELECT 'Configuraciones del sistema:' AS mensaje;
SELECT * FROM carnet_configuracion;
