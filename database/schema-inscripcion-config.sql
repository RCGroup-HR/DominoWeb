-- ============================================
-- CONFIGURACIÓN del módulo de inscripción - ScoreDomino
-- Ejecutar SOLO si ya existe la tabla Configuracion
-- (módulo admin, schema-admin.sql).
-- ============================================
INSERT INTO Configuracion (Clave, Valor, Tipo, Grupo, Descripcion, Editable) VALUES
('inscripcion_habilitada',       'true',      'booleano', 'inscripcion', 'Permite el formulario público de inscripción de equipos', TRUE),
('inscripcion_busqueda_default', 'true',      'booleano', 'inscripcion', 'Valor por defecto de búsqueda de jugadores en torneos nuevos', TRUE),
('busqueda_publica_equipos',     'true',      'booleano', 'inscripcion', 'Mostrar públicamente el listado de equipos registrados', TRUE),
('captcha_proveedor',            'turnstile', 'texto',    'inscripcion', 'Proveedor de CAPTCHA: turnstile | recaptcha', TRUE),
('captcha_site_key',             '',          'texto',    'inscripcion', 'Site key pública del CAPTCHA', TRUE),
('captcha_secret_key',           '',          'password', 'inscripcion', 'Secret key del CAPTCHA (se guarda cifrada)', TRUE)
ON DUPLICATE KEY UPDATE Clave = Clave;
