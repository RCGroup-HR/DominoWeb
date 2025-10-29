require('dotenv').config();

console.log('🔍 Iniciando servidor...');
console.log('Puerto:', process.env.PORT);
console.log('Base de datos:', process.env.DB_NAME);

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET http://localhost:${PORT}/api/torneos`);
  console.log(`   - GET http://localhost:${PORT}/api/torneos/:id`);
  console.log(`   - GET http://localhost:${PORT}/api/ranking`);
  console.log(`   - GET http://localhost:${PORT}/api/ranking/torneo/:id_torneo`);
  console.log(`   - GET http://localhost:${PORT}/api/ranking/jugador/:id`);
  console.log(`   - GET http://localhost:${PORT}/api/historico/Resumen/:Carnet`);
  console.log(`   - GET http://localhost:${PORT}/api/comparar/:carnet`);
});