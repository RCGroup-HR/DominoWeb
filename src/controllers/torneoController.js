const pool = require('../config/database');

const torneoController = {
  // Obtener torneo por ID
  getTorneoById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.query(
        'SELECT Id, Nombre   FROM Torneo WHERE Estatus = "A"',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Torneo no encontrado'
        });
      }

      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error al obtener torneo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el torneo',
        error: error.message
      });
    }
  },

  // Obtener todos los torneos
  getAllTorneos: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Torneo WHERE Estatus = "A"');

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error al obtener torneos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los torneos',
        error: error.message
      });
    }
  }
};

module.exports = torneoController;