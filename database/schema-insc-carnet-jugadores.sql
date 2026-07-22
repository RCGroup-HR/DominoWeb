-- ============================================
-- Tabla DEDICADA de carnets para el módulo de inscripción.
-- Separada de `carnetjugadores` (FEMUNDO) para no mezclar
-- instituciones distintas. La opción "Consultar base de datos"
-- del torneo lee/escribe AQUÍ (federación configurada en el
-- controlador: FEDERACION_CARNET).
--
-- Cargar los datos con: data-insc-carnet-jugadores.sql
-- ============================================

CREATE TABLE IF NOT EXISTS `insc_carnet_jugadores` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Carnet` int(11) NOT NULL,
  `Identificacion` varchar(20) NOT NULL DEFAULT '',
  `Nombre` varchar(100) NOT NULL DEFAULT '',
  `Apellidos` varchar(100) NOT NULL DEFAULT '',
  `Club` int(6) NOT NULL DEFAULT 0,
  `ID_Provincia` int(6) NOT NULL DEFAULT 0,
  `Celular` varchar(18) NOT NULL DEFAULT '',
  `Estatus` int(3) NOT NULL DEFAULT 0,
  `Comentarios` varchar(200) NOT NULL DEFAULT '',
  `FechaRegistro` varchar(18) NOT NULL DEFAULT '',
  `Id_Equipo` int(6) NOT NULL DEFAULT 0,
  `Genero` varchar(1) NOT NULL DEFAULT '',
  `Usuario` varchar(30) NOT NULL DEFAULT '',
  `FechaNacimiento` varchar(16) NOT NULL DEFAULT '',
  `Id_Federacion` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uk_carnet_idfederacion` (`Carnet`, `Id_Federacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
