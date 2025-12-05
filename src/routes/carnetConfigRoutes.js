const express = require('express');
const router = express.Router();
const configController = require('../controllers/carnetConfigController');
const { verificarToken, verificarAdmin } = require('../middleware/authJWT');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento de logos
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/logos');

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(file.originalname);
        cb(null, `logo-${timestamp}-${randomString}${extension}`);
    }
});

const logoUpload = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'));
        }
    }
});

// Rutas públicas
router.get('/', configController.obtenerConfiguracion);

// Rutas protegidas (solo administradores)
router.put('/', verificarToken, verificarAdmin, configController.actualizarConfiguracion);
router.put('/multiples', verificarToken, verificarAdmin, configController.actualizarMultiplesConfiguraciones);
router.post('/logo', verificarToken, verificarAdmin, logoUpload.single('logo'), configController.subirLogo);

module.exports = router;
