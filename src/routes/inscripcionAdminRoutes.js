// ============================================================
// RUTAS ADMIN - Inscripción de equipos (ScoreDomino)
// Protegidas con JWT + rol administrador.
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inscripcionController');
const { verificarToken, esAdministrador } = require('../middleware/authJWT');

router.use(verificarToken, esAdministrador);

// Torneos
router.get('/torneos',       ctrl.adminListarTorneos);
router.post('/torneos',      ctrl.adminCrearTorneo);
router.put('/torneos/:id',   ctrl.adminActualizarTorneo);

// Equipos
router.get('/equipos',                  ctrl.adminListarEquipos);
router.get('/equipos/:id',              ctrl.adminGetEquipo);
router.patch('/equipos/:id/estado',     ctrl.adminCambiarEstado);

// Jugadores (grid por equipo + exportar Excel)
router.get('/jugadores',        ctrl.adminListarJugadores);
router.get('/jugadores/export', ctrl.adminExportJugadores);

// Estadísticas
router.get('/stats',         ctrl.adminStats);

module.exports = router;
