-- ============================================
-- METODOLOGIA - ScoreDomino
-- Tabla de fila única para la metodología del torneo activo
-- Ejecutar después de schema-patrocinadores.sql
-- ============================================

CREATE TABLE IF NOT EXISTS Metodologia (
    Id            INT          NOT NULL DEFAULT 1 PRIMARY KEY,
    TorneoNombre  VARCHAR(200) NOT NULL DEFAULT '1ER TORNEO INTER CLUBES LA VEGA',
    TorneoSubtitulo VARCHAR(200) NOT NULL DEFAULT 'Metodología de Juego',
    TorneoFecha   VARCHAR(100) NOT NULL DEFAULT '30 de Noviembre',
    Secciones     JSON         NOT NULL,
    ActualizadoAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales (contenido actual del torneo)
-- ============================================
INSERT INTO Metodologia (Id, TorneoNombre, TorneoSubtitulo, TorneoFecha, Secciones)
VALUES (1,
  '1ER TORNEO INTER CLUBES LA VEGA',
  'Metodología de Juego',
  '30 de Noviembre',
  JSON_ARRAY(
    JSON_OBJECT(
      'titulo', '1. Participación por Club',
      'contenido', '<ul><li>Cada club puede inscribir de <strong>8 a 12 atletas</strong>.</li><li>Los ID que se le entregarán a los equipos es <strong>proporcional a la cantidad de atletas inscritos, máximo 12</strong>.</li><li>Los jugadores que participen en una ronda deberán <strong>tachar en la hoja de anotación el ID que va a reemplazar y colocar el ID que se le asignó</strong>.</li><li>Los jugadores sin ID asignado <strong>no pueden participar en el torneo</strong>.</li></ul>'
    ),
    JSON_OBJECT(
      'titulo', '2. Estructura del Torneo',
      'contenido', '<ul><li>El torneo se jugará a <strong>7 rondas oficiales</strong>.</li><li>En cada ronda, el sistema generará los enfrentamientos utilizando el siguiente orden:</li></ul><div class="metodologia-highlight"><ol style="margin-left:20px"><li><strong>Posición del equipo</strong> en la tabla general.</li><li><strong>Posición del jugador</strong> dentro del equipo, según su ID asignado para esa ronda.</li></ol></div><p><em>✓ Este mecanismo garantiza emparejamientos ordenados, equilibrados y consistentes durante todo el torneo.</em></p>'
    ),
    JSON_OBJECT(
      'titulo', '3. Sustituciones de Jugadores',
      'contenido', '<ul><li>Las sustituciones <strong>solo pueden realizarse entre rondas</strong>, nunca durante una ronda activa.</li><li>Las sustituciones deben <strong>tachar el ID en la hoja de anotación y colocar el ID que le corresponde</strong>.</li><li>Cada club tiene derecho a solo <strong>2 sustituciones por ronda.</strong></li></ul><div class="metodologia-highlight"><strong>📌 Ejemplo:</strong> Si el capitán decide sustituir al jugador con el ID 3 por el jugador con el ID 12 que está en la banca, en el sorteo el jugador 12 debe ir a la mesa donde le corresponde al ID 3 y tachar este ID, colocando al lado el ID 12 el cual tiene asignado. Los cambios se reflejarán en la siguiente ronda.</div>'
    ),
    JSON_OBJECT(
      'titulo', '4. Responsabilidades del Capitán',
      'contenido', '<p>Esta metodología está diseñada para <strong>fortalecer el rol del capitán</strong>, recuperando la esencia competitiva que muchos han solicitado.</p><ul><li>👥 Administrar las sustituciones.</li><li>📋 Definir estrategias por ronda.</li><li>✅ Presentar alineaciones correctas y a tiempo.</li><li>🏢 Mantener el orden interno de su club.</li></ul><p><em>Su rol vuelve a ser clave en la competitividad del torneo.</em></p>'
    ),
    JSON_OBJECT(
      'titulo', '5. Conducta y Disciplina',
      'contenido', '<ul><li>Los jugadores deben <strong>mantener disciplina y respeto en todo momento</strong>.</li><li>Cualquier conducta antideportiva puede generar sanciones que van desde <strong>advertencias hasta descalificación</strong>.</li><li>Las <strong>decisiones del comité del torneo serán finales y de cumplimiento obligatorio</strong>.</li></ul>'
    ),
    JSON_OBJECT(
      'titulo', '6. Objetivo de la Metodología',
      'contenido', '<ul><li>✓ Organizar un torneo justo, moderno y estructurado.</li><li>✓ Evitar desorden en inscripciones o alineaciones.</li><li>✓ Permitir flexibilidad a los clubes sin afectar el formato.</li><li>✓ Dar nuevamente importancia al liderazgo y estrategia de cada capitán.</li><li>✓ Promover una experiencia competitiva de alto nivel.</li></ul>'
    ),
    JSON_OBJECT(
      'titulo', '7. Enfrentamientos entre Equipos',
      'contenido', '<p>Los enfrentamientos entre equipos se organizarán de la siguiente manera. Se asume que los cuatro equipos participantes por bloque de 8 mesas son: <strong>A, B, C y D</strong>.</p><table class="metodologia-table"><thead><tr><th>Mesa</th><th>Enfrentamiento</th></tr></thead><tbody><tr><td><strong>1</strong></td><td>A-C vs B-D</td></tr><tr><td><strong>2</strong></td><td>A-D vs B-C</td></tr><tr><td><strong>3</strong></td><td>A-B vs C-D</td></tr><tr><td><strong>4</strong></td><td>A-C vs B-D</td></tr><tr><td><strong>5</strong></td><td>A-D vs B-C</td></tr><tr><td><strong>6</strong></td><td>A-B vs C-D</td></tr><tr><td><strong>7</strong></td><td>A-C vs B-D</td></tr><tr><td><strong>8</strong></td><td>A-D vs B-C</td></tr></tbody></table><p><em>Este patrón responde a observaciones realizadas en torneos anteriores, donde varios clubes señalaron que algunas parejas de equipos no coincidían entre sí. Tras evaluar la situación junto al Sr. Yumar Linares, se ajustó el método de apareamiento para garantizar enfrentamientos equitativos.</em></p>'
    ),
    JSON_OBJECT(
      'titulo', 'Conclusión: Emparejamientos por equipo',
      'contenido', '<div class="team-block"><h4>Equipo A</h4><ul><li><strong>vs C</strong> → <strong>3 veces</strong> (mesas 1, 4, 7)</li><li><strong>vs D</strong> → <strong>3 veces</strong> (mesas 2, 5, 8)</li><li><strong>vs B</strong> → <strong>2 veces</strong> (mesas 3, 6)</li></ul></div><div class="team-block"><h4>Equipo B</h4><ul><li><strong>vs D</strong> → <strong>3 veces</strong></li><li><strong>vs C</strong> → <strong>3 veces</strong></li><li><strong>vs A</strong> → <strong>2 veces</strong></li></ul></div><div class="team-block"><h4>Equipo C</h4><ul><li><strong>vs A</strong> → <strong>3 veces</strong></li><li><strong>vs B</strong> → <strong>3 veces</strong></li><li><strong>vs D</strong> → <strong>2 veces</strong></li></ul></div><div class="team-block"><h4>Equipo D</h4><ul><li><strong>vs B</strong> → <strong>3 veces</strong></li><li><strong>vs A</strong> → <strong>3 veces</strong></li><li><strong>vs C</strong> → <strong>2 veces</strong></li></ul></div><div class="metodologia-highlight" style="margin-top:25px"><strong>📊 Resumen directo:</strong> Cada equipo se empareja a dos rivales <strong>3 veces</strong> y a un rival <strong>2 veces</strong>, para un total de <strong>8 enfrentamientos por equipo</strong>.</div><div class="metodologia-note"><strong>📌 Nota:</strong> Este método de apareamiento es sujeto a normas y validaciones previas, las cuales consideran que parejas de jugadores (IDs) no repitan en rondas consecutivas.</div>'
    )
  )
)
ON DUPLICATE KEY UPDATE Id = Id;
