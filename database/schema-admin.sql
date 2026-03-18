-- ============================================
-- MÓDULO ADMINISTRATIVO - ScoreDomino
-- Tabla de configuración parametrizable
-- Ejecutar después de schema-carnets.sql
-- ============================================

-- 1. Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS Configuracion (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    Clave       VARCHAR(100) NOT NULL UNIQUE,
    Valor       TEXT         NOT NULL DEFAULT '',
    Tipo        ENUM('texto','numero','booleano','json','color','url','password') DEFAULT 'texto',
    Grupo       VARCHAR(50)  NOT NULL DEFAULT 'general',
    Descripcion TEXT         NULL,
    Editable    BOOLEAN      DEFAULT TRUE,
    UpdatedAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdatedBy   INT          NULL,
    INDEX idx_clave (Clave),
    INDEX idx_grupo (Grupo),
    FOREIGN KEY (UpdatedBy) REFERENCES Usuarios(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Configuraciones iniciales
-- ============================================
INSERT INTO Configuracion (Clave, Valor, Tipo, Grupo, Descripcion, Editable) VALUES

-- ── GENERAL ────────────────────────────────
('app_nombre',             'ScoreDomino',                     'texto',    'general',      'Nombre visible de la aplicación',               TRUE),
('app_tagline',            'Sistema de Ranking de Dominó',    'texto',    'general',      'Eslogan / descripción corta',                   TRUE),
('app_url',                'https://scoredomino.com',         'url',      'general',      'URL pública principal del sistema',             TRUE),
('registro_habilitado',    'true',                            'booleano', 'general',      'Permitir registro de nuevos usuarios',          TRUE),
('modo_mantenimiento',     'false',                           'booleano', 'general',      'Activar modo mantenimiento (bloquea el sitio)', TRUE),
('mensaje_mantenimiento',  'Sistema en mantenimiento. Vuelve pronto.', 'texto', 'general','Mensaje mostrado durante el mantenimiento',    TRUE),
('contacto_email',         'admin@scoredomino.com',           'texto',    'general',      'Email de contacto público',                     TRUE),

-- ── APARIENCIA ─────────────────────────────
('color_primario',         '#667eea',                         'color',    'apariencia',   'Color primario del tema (gradiente inicio)',     TRUE),
('color_secundario',       '#764ba2',                         'color',    'apariencia',   'Color secundario del tema (gradiente fin)',      TRUE),
('logo_url',               '/img/logo.png',                   'url',      'apariencia',   'URL del logo principal',                        TRUE),
('favicon_url',            '/favicon.ico',                    'url',      'apariencia',   'URL del favicon',                               TRUE),
('banner_activo',          'false',                           'booleano', 'apariencia',   'Mostrar banner informativo en el sitio',        TRUE),
('banner_mensaje',         '',                                'texto',    'apariencia',   'Texto del banner informativo',                  TRUE),
('banner_tipo',            'info',                            'texto',    'apariencia',   'Tipo de banner: info | warning | success | danger', TRUE),

-- ── SEGURIDAD ──────────────────────────────
('max_intentos_login',     '5',                               'numero',   'seguridad',    'Máximo de intentos fallidos de login',          TRUE),
('bloqueo_minutos',        '30',                              'numero',   'seguridad',    'Minutos de bloqueo tras exceder intentos',      TRUE),
('jwt_expiracion',         '24h',                             'texto',    'seguridad',    'Duración del JWT (ej: 24h, 7d, 1h)',            TRUE),
('sesion_unica',           'false',                           'booleano', 'seguridad',    'Permitir solo una sesión activa por usuario',   TRUE),
('rate_limit_rpm',         '60',                              'numero',   'seguridad',    'Peticiones por minuto permitidas por IP',       TRUE),
('dominios_cors',          '*',                               'texto',    'seguridad',    'Dominios CORS permitidos (separados por coma)', TRUE),
('forzar_https',           'false',                           'booleano', 'seguridad',    'Redirigir HTTP a HTTPS automáticamente',        TRUE),

-- ── CARNETS ────────────────────────────────
('carnets_requieren_aprobacion', 'true',                      'booleano', 'carnets',      'Los carnets nuevos requieren aprobación admin', TRUE),
('carnets_max_foto_mb',    '5',                               'numero',   'carnets',      'Tamaño máximo de foto en megabytes',            TRUE),
('carnets_formatos_foto',  'jpg,jpeg,png,webp',               'texto',    'carnets',      'Formatos de imagen permitidos (sin punto)',     TRUE),
('carnets_por_usuario',    '5',                               'numero',   'carnets',      'Máximo de carnets que puede tener un usuario',  TRUE),
('carnets_prefijo',        'CARD',                            'texto',    'carnets',      'Prefijo del número de carnet generado',         TRUE),
('carnets_dias_expiracion','365',                             'numero',   'carnets',      'Días de validez de un carnet aprobado (0 = sin expiración)', TRUE),

-- ── RANKING ────────────────────────────────
('ranking_visible_publico','true',                            'booleano', 'ranking',      'Ranking visible sin autenticación',             TRUE),
('ranking_max_jugadores',  '100',                             'numero',   'ranking',      'Máximo de jugadores mostrados en el ranking',   TRUE),
('ranking_temporada_actual','2025',                           'texto',    'ranking',      'Temporada/año activo del ranking',              TRUE),
('ranking_actualizar_horas','6',                              'numero',   'ranking',      'Cada cuántas horas se actualiza el ranking',    TRUE),

-- ── INTEGRACIONES ──────────────────────────
('youtube_canal_id',       '',                                'texto',    'integraciones','ID del canal de YouTube para live check',       TRUE),
('youtube_api_key',        '',                                'password', 'integraciones','API Key de YouTube (se guarda cifrada)',        TRUE),
('youtube_auto_check',     'false',                           'booleano', 'integraciones','Verificar transmisiones en vivo automáticamente', TRUE),
('webhook_url',            '',                                'url',      'integraciones','URL de webhook para notificaciones externas',   TRUE)

ON DUPLICATE KEY UPDATE Clave = Clave;

-- ============================================
-- 3. Vista de sesiones activas
-- ============================================
CREATE OR REPLACE VIEW vista_sesiones_activas AS
SELECT
    s.Id,
    s.UsuarioId,
    u.Email AS UsuarioEmail,
    u.Rol,
    s.FechaCreacion,
    s.FechaExpiracion,
    TIMESTAMPDIFF(MINUTE, NOW(), s.FechaExpiracion) AS MinutosRestantes
FROM Sesiones s
JOIN Usuarios u ON s.UsuarioId = u.Id
WHERE s.FechaExpiracion > NOW();

-- ============================================
-- Verificación
-- ============================================
SELECT 'Tabla Configuracion creada:' AS mensaje;
SELECT COUNT(*) AS total_parametros FROM Configuracion;
SELECT Grupo, COUNT(*) AS parametros FROM Configuracion GROUP BY Grupo;
