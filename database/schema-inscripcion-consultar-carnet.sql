-- ============================================
-- Opción "Consultar base de datos" por número de carnet
-- Módulo de inscripción - ScoreDomino
-- Requiere: insc_torneos (schema-inscripcion.sql) y la tabla dedicada
-- insc_carnet_jugadores (schema-insc-carnet-jugadores.sql + data-*).
-- ============================================

-- Cuando está activa, el formulario público pide el nº de Carnet
-- del jugador y autocompleta su nombre desde insc_carnet_jugadores
-- (Id_Federacion = 1, tabla DEDICADA separada de FEMUNDO).
ALTER TABLE `insc_torneos`
  ADD COLUMN `ConsultarCarnet` TINYINT(1) NOT NULL DEFAULT 0
  AFTER `BusquedaJugadores`;
