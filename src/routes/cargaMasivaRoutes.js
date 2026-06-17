// ============================================================
// RUTAS CARGA MASIVA - ScoreDomino
// Protegidas con JWT + rol administrador
// ============================================================
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/cargaMasivaController');
const { verificarToken, esAdministrador } = require('../middleware/authJWT');

// Multer en memoria para archivos Excel (sin guardar en disco)
const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx / .xls)'));
        }
    },
});

// Aplica JWT + admin a todas las rutas
router.use(verificarToken, esAdministrador);

// POST /api/admin/carga/equipos
router.post('/equipos', excelUpload.single('archivo'), ctrl.bulkEquipos);

// POST /api/admin/carga/carnets
router.post('/carnets', excelUpload.single('archivo'), ctrl.bulkCarnets);

module.exports = router;
