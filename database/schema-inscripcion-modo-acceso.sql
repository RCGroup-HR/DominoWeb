-- ============================================
-- Modo de acceso a la inscripción por torneo.
-- Módulo de inscripción - ScoreDomino
-- Requiere: insc_torneos con CodigoMaestro (schema-inscripcion-carnet-avanzado.sql)
-- ============================================

-- 'publico' → cualquiera puede inscribir/editar su equipo (comportamiento actual).
-- 'codigo'  → se exige el CodigoMaestro del torneo para inscribir o modificar
--             (quien lo tiene administra el torneo).
ALTER TABLE `insc_torneos`
  ADD COLUMN `ModoAcceso` ENUM('publico','codigo') NOT NULL DEFAULT 'publico'
  AFTER `CodigoMaestro`;
