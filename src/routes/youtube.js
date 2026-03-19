const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../config/database');

/**
 * Obtiene el valor de una clave de configuración desde la BD
 */
async function getConfigValue(clave) {
    try {
        const [rows] = await pool.query(
            'SELECT Valor FROM Configuracion WHERE Clave = ?', [clave]
        );
        return rows.length > 0 ? rows[0].Valor : null;
    } catch { return null; }
}

/**
 * @route GET /api/youtube/check-live
 * @desc Verificar si hay transmisión en vivo en un canal
 * @param {string} channelId - ID del canal de YouTube
 */
router.get('/check-live', async (req, res) => {
    try {
        const { channelId } = req.query;

        if (!channelId) {
            return res.status(400).json({
                error: 'channelId es requerido',
                isLive: false
            });
        }

        // Leer API key desde env o desde la BD
        const apiKey = process.env.YOUTUBE_API_KEY || await getConfigValue('youtube_api_key');
        if (!apiKey) {
            console.error('❌ YOUTUBE_API_KEY no configurada');
            return res.status(500).json({
                error: 'Configuración del servidor incompleta — configura youtube_api_key en el panel admin',
                isLive: false
            });
        }

        const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
        
        const response = await fetch(youtubeUrl);
        const data = await response.json();

        if (data.error) {
            console.error('❌ Error de YouTube API:', data.error.message);
            return res.status(500).json({ 
                error: 'Error al consultar YouTube API',
                isLive: false 
            });
        }

        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            console.log('✅ Live encontrado:', videoId);
            
            res.json({
                isLive: true,
                videoId: videoId,
                title: data.items[0].snippet.title
            });
        } else {
            console.log('ℹ️ No hay live activo');
            res.json({
                isLive: false,
                videoId: null
            });
        }

    } catch (error) {
        console.error('❌ Error en el servidor:', error.message);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            isLive: false 
        });
    }
});

module.exports = router;