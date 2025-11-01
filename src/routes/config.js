// ============================================
// RUTA PARA SERVIR CONFIGURACIÓN AL FRONTEND
// Archivo: src/routes/config.js
// ============================================

const express = require('express');
const router = express.Router();

/**
 * @route GET /api-config
 * @desc Proporciona la configuración de API al frontend
 */
router.get('/api-config', (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        const apiBaseUrl = process.env.API_BASE_URL || '/api';
        
        if (!apiKey) {
            console.error('❌ API_KEY no configurada en .env');
            return res.status(500).json({
                success: false,
                error: 'Configuración del servidor incompleta'
            });
        }
        
        // Enviar configuración completa
        res.json({
            success: true,
            apiKey: apiKey,
            apiBaseUrl: apiBaseUrl
        });
        
    } catch (error) {
        console.error('❌ Error al obtener configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;