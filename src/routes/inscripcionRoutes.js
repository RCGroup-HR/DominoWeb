// ============================================================
// RUTAS PÚBLICAS - Inscripción de equipos (ScoreDomino)
// Sin autenticación: uso del público.
// ============================================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inscripcionController');

// Torneos con inscripciones abiertas
router.get('/torneos',      ctrl.listarTorneosAbiertos);
router.get('/torneos/:id',  ctrl.getTorneo);

// Búsqueda pública de equipos y autocompletado de jugadores
router.get('/equipos',      ctrl.buscarEquiposPublico);
router.get('/jugadores',    ctrl.buscarJugadores);

// Inscribir un equipo
router.post('/equipos',     ctrl.inscribirEquipo);

// Acceder/editar equipo mediante su código
router.post('/equipos/acceso', ctrl.accederEquipo);
router.put('/equipos',         ctrl.actualizarEquipo);

module.exports = router;
