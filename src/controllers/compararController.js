const pool = require('../config/database');

const compararController = {

  // Obtener ranking por torneo
  getComparar: async (req, res) => {
    try {
      const { carnet } = req.params;
      
      const [rows] = await pool.query(`
SELECT 
 *
From
RankingIndividual
WHERE 
	   Id = ${carnet}
   `, [carnet]);

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error al obtener jugador:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el jugador',
        error: error.message
      });
    }
  },

  // Obtener jugador por ID
  getJugadorById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.query(`
        SELECT * FROM ranking_view WHERE ID = ?
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Jugador no encontrado'
        });
      }

      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error al obtener jugador:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el jugador',
        error: error.message
      });
    }
  }
};

module.exports = compararController;