-- ============================================
-- Consulta de carnet: registro/actualización de jugadores,
-- validación de carnet único por torneo y código maestro.
-- Módulo de inscripción - ScoreDomino
-- Requiere: schema-inscripcion.sql y schema-inscripcion-consultar-carnet.sql
-- ============================================

-- Nº de carnet del jugador dentro de la inscripción (para validar que un
-- carnet no se repita en dos equipos del mismo torneo).
ALTER TABLE `insc_jugadores`
  ADD COLUMN `Carnet` INT NULL AFTER `NombreCompleto`;

-- Código maestro por torneo: permite a un usuario editar TODOS los equipos.
ALTER TABLE `insc_torneos`
  ADD COLUMN `CodigoMaestro` VARCHAR(20) NULL UNIQUE AFTER `ConsultarCarnet`;
