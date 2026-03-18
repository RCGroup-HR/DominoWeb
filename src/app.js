const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const configRoutes  = require('./routes/config');
const { requireApiKey }               = require('./middleware/auth');
const { setSecurityHeaders, rateLimiter } = require('./middleware/security');
const rankingRoutes   = require('./routes/rankingRoutes');
const torneoRoutes    = require('./routes/torneoRoutes');
const historicoRoutes = require('./routes/historicoRoutes');
const compararRoutes  = require('./routes/compararRoutes');
const colectivoRoutes = require('./routes/colectivoRoutes');
const youtubeRoutes   = require('./routes/youtube');
const authRoutes      = require('./routes/authRoutes');
const carnetsRoutes   = require('./routes/carnetsRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const adminController = require('./controllers/adminController');

const app = express();

// ──────────────────────────────────────────
// 1. SEGURIDAD: headers en todas las respuestas
// ──────────────────────────────────────────
app.use(setSecurityHeaders);

// ──────────────────────────────────────────
// 2. CORS dinámico (usa configuración de BD si existe)
// ──────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        const allowed = (process.env.ALLOWED_DOMAINS || '*').split(',').map(d => d.trim());
        if (allowed.includes('*') || !origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: dominio no permitido → ${origin}`));
        }
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// ──────────────────────────────────────────
// 3. BODY PARSING con límite de tamaño
// ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ──────────────────────────────────────────
// 4. RATE LIMITING global (60 rpm por IP)
// ──────────────────────────────────────────
app.use('/api', rateLimiter(60, 60 * 1000));

// ──────────────────────────────────────────
// 5. RUTAS PÚBLICAS (sin API Key ni JWT)
// ──────────────────────────────────────────
app.use('/', configRoutes);
app.use('/api/youtube', youtubeRoutes);

// Config pública (colores, nombre de app, etc.)
app.get('/api/config/publica', adminController.getConfigPublica);

// ──────────────────────────────────────────
// 6. RUTAS DE AUTH Y CARNETS (protección JWT interna)
// ──────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/carnets', carnetsRoutes);

// ──────────────────────────────────────────
// 7. MÓDULO ADMIN (JWT + rol administrador)
// ──────────────────────────────────────────
app.use('/api/admin', adminRoutes);

// ──────────────────────────────────────────
// 8. RUTAS PROTEGIDAS CON API KEY
// ──────────────────────────────────────────
app.use('/api', requireApiKey);
app.use('/api/torneos',   torneoRoutes);
app.use('/api/ranking',   rankingRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/comparar',  compararRoutes);
app.use('/api/colectivo', colectivoRoutes);

// ──────────────────────────────────────────
// 9. INFO DE LA API
// ──────────────────────────────────────────
app.get('/api', (req, res) => {
    res.json({
        message:  '🎯 API de Ranking de Dominó - ScoreDomino',
        version:  '2.0.0',
        endpoints: {
            auth:     '/api/auth',
            carnets:  '/api/carnets',
            admin:    '/api/admin  [JWT + administrador]',
            torneos:  '/api/torneos  [API Key]',
            ranking:  '/api/ranking  [API Key]',
            historico:'/api/historico  [API Key]',
            comparar: '/api/comparar  [API Key]',
            youtube:  '/api/youtube',
            config:   '/api/config/publica'
        }
    });
});

// ──────────────────────────────────────────
// 10. ARCHIVOS ESTÁTICOS
// ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ──────────────────────────────────────────
// 11. MANEJO DE ERRORES GLOBAL
// ──────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Error global:', err.message);
    if (err.message?.startsWith('CORS')) {
        return res.status(403).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

module.exports = app;
