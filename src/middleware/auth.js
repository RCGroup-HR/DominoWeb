// ============================================
// MIDDLEWARE DE AUTENTICACIÓN CON API KEY
// Archivo: src/middleware/auth.js
// ============================================

const requireApiKey = (req, res, next) => {
    // Obtener la API Key del header
    const apiKey = req.headers['x-api-key'];
    
    // API Key válida (desde .env)
    const validApiKey = process.env.API_KEY;
    
    // Verificar que existe la API Key configurada
    if (!validApiKey) {
        console.error('⚠️ API_KEY no configurada en .env');
        return res.status(500).json({
            success: false,
            error: 'Configuración del servidor incompleta'
        });
    }
    
    // Verificar que el cliente envió una API Key
    if (!apiKey) {
        console.warn('⚠️ Petición sin API Key desde:', req.ip);
        return res.status(401).json({
            success: false,
            error: 'API Key requerida. Acceso denegado.'
        });
    }
    
    // Verificar que la API Key sea válida
    if (apiKey !== validApiKey) {
        console.warn('⚠️ API Key inválida desde:', req.ip);
        return res.status(403).json({
            success: false,
            error: 'API Key inválida. Acceso denegado.'
        });
    }
    
    // API Key válida, permitir continuar
    console.log('✅ Acceso autorizado a:', req.path);
    next();
};

module.exports = {
    requireApiKey
};