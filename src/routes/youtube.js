const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

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

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            console.error('❌ YOUTUBE_API_KEY no configurada en .env');
            return res.status(500).json({ 
                error: 'Configuración del servidor incompleta',
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