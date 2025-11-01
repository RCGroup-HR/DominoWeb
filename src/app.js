const express = require('express');
const cors = require('cors');
const path = require('path');
const rankingRoutes = require('./routes/rankingRoutes');
const torneoRoutes = require('./routes/torneoRoutes');
const historicoRoutes = require('./routes/historicoRoutes');
const compararRoutes = require('./routes/compararRoutes');
// ===== Agregar esta línea donde importas las rutas =====
const youtubeRoutes = require('./routes/youtube');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API (ANTES de los archivos estáticos)
app.use('/api/torneos', torneoRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/comparar', compararRoutes);
// ===== Agregar esta línea donde registras las rutas =====
app.use('/api/youtube', youtubeRoutes);

// Ruta de bienvenida API
app.get('/api', (req, res) => {
  res.json({
    message: '🎯 API de Ranking de Dominó',
    version: '1.0.0',
    endpoints: {
      torneos: '/api/torneos',
      ranking: '/api/ranking',
      historico: '/api/historico',
      comparar: '/api/comparar'
    }
  });
});

// Servir archivos estáticos (DESPUÉS de las rutas API)
app.use(express.static(path.join(__dirname, '../public')));

// Ruta principal para servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejo de rutas no encontradas (SIEMPRE AL FINAL)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

module.exports = app;