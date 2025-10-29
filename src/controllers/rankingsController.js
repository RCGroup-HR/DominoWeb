const pool = require('../config/database');

const rankingsController = {
  // Obtener ranking completo
  getNombreTorneo: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          Nombre
        FROM Torneo
        Where Estatus = 'A'
      `);

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el ranking',
        error: error.message
      });
    }
  },

  // Obtener ranking por torneo
  getRankingByTorneo: async (req, res) => {
    try {      
      const [rows] = await pool.query(`
SELECT 
 ROW_NUMBER() OVER (ORDER BY Victorias DESC, Derrotas ASC, Efectividad DESC ) AS Rank,
jugador.id as ID,
Jugador.nombre as Jugador,
Equipo.Nombre as NEquipo,
IFNULL(SUM(partidas),0) as Partidas,
IFNULL(SUM(VICT),0) as Victorias,
IFNULL(SUM(DERR),0) as Derrotas,
IFNULL(SUM(PtsObt),0) as PuntosOb,
IFNULL(SUM(PtsPerm),0)  as PuntosPer,
IFNULL(SUM(PtsObt) - SUM(PtsPerm),0)  as Efectividad, 
IFNULL(SUM(TotalPts),0)  as TotalPts, 
Equipo.Id_Union, 
Lower(Paises.Siglas) as Bandera, 
Paises.Pais as Pais, 
Equipo.Id

FROM (
-- ========================================================              
-- POSICION 1
-- ========================================================
SELECT 
jugador.Id_Torneo as Id_Torneo, 
jugador.ID,
jugador.Nombre,
COUNT(partida.Id) as Partidas,

IFNULL(CASE WHEN jugador.ID = partida.Id_J1 AND partida.RJ1 = 'G' THEN COUNT(partida.RJ1) END,0) as Vict, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J1 AND partida.RJ1 = 'P' THEN COUNT(partida.RJ1) END,0) as Derr, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J1 AND partida.PtsJ1 <= 200 THEN SUM(partida.PtsJ1) ELSE SUM(200) END,0) AS PtsObt,
IFNULL(CASE WHEN jugador.ID = partida.Id_J1 AND partida.PP2 <= 200 THEN SUM(partida.PP2) ELSE SUM(200) END,0) as PtsPerm,
IFNULL(CASE WHEN jugador.ID = partida.Id_J1 THEN SUM(partida.PtsJ1) END,0) AS TotalPts

FROM 
jugador, partida
WHERE 
jugador.ID = partida.Id_J1 
and jugador.Id_torneo = partida.Id_torneo
GROUP BY 
Jugador.Id_Torneo,
partida.Id_J1, 
partida.RJ1, 
partida.PtsJ1
              
-- ========================================================              
UNION ALL -- POSICION 2
-- ========================================================
   SELECT 
   jugador.Id_Torneo as Id_Torneo, 
jugador.ID,
jugador.Nombre,
COUNT(partida.Id) as Partidas,

IFNULL(CASE WHEN jugador.ID = partida.Id_J2 AND partida.RJ2 = 'G' THEN COUNT(partida.RJ2) END,0) as Vict,
IFNULL(CASE WHEN jugador.ID = partida.Id_J2 AND partida.RJ2 = 'P' THEN COUNT(partida.RJ2) END,0) as Derr, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J2 AND partida.PtsJ2 <= 200 THEN SUM(partida.PtsJ2) ELSE SUM(200) END,0) AS PtsObt,
IFNULL(CASE WHEN jugador.ID = partida.Id_J2 AND partida.PP1 <= 200 THEN SUM(partida.PP1) ELSE SUM(200) END,0) as PtsPerm,
IFNULL(CASE WHEN jugador.ID = partida.Id_J2 THEN SUM(partida.PtsJ2) END,0) AS TotalPts
FROM 
jugador, partida
WHERE 
jugador.ID = partida.Id_J2  
and jugador.Id_torneo = partida.Id_torneo
GROUP BY  
Jugador.Id_Torneo,
partida.Id_J2, 
partida.RJ2, 
partida.PtsJ2
            
-- ========================================================              
UNION ALL -- POSICION 3
-- ========================================================
SELECT 
jugador.Id_Torneo as Id_Torneo, 
jugador.ID,
jugador.Nombre,
COUNT(partida.Id) as Partidas,

IFNULL(CASE WHEN jugador.ID = partida.Id_J3 AND partida.RJ3 = 'G' THEN COUNT(partida.RJ3) END,0) as Vict, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J3 AND partida.RJ3 = 'P' THEN COUNT(partida.RJ3) END,0) as Derr, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J3 AND partida.PtsJ3 <= 200 THEN SUM(partida.PtsJ3) ELSE SUM(200) END,0) AS PtsObt,
IFNULL(CASE WHEN jugador.ID = partida.Id_J3 AND partida.PP2 <= 200 THEN SUM(partida.PP2) ELSE SUM(200) END,0) as PtsPerm,
IFNULL(CASE WHEN jugador.ID = partida.Id_J3 THEN SUM(partida.PtsJ3) END,0) AS TotalPts
FROM 
jugador, partida
WHERE 
jugador.ID = partida.Id_J3  
and jugador.Id_torneo = partida.Id_torneo
GROUP BY  
Jugador.Id_Torneo,
partida.Id_J3, 
partida.RJ3, 
partida.PtsJ3
              
-- ========================================================              
UNION ALL -- POSICION 4
-- ========================================================
   SELECT 
   jugador.Id_Torneo as Id_Torneo, 
jugador.ID,
jugador.Nombre,
COUNT(partida.Id) as Partidas,

IFNULL(CASE WHEN jugador.ID = partida.Id_J4 AND partida.RJ4 = 'G' THEN COUNT(partida.RJ4) END,0) as Vict,
IFNULL(CASE WHEN jugador.ID = partida.Id_J4 AND partida.RJ4 = 'P' THEN COUNT(partida.RJ4) END,0) as Derr, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J4 AND partida.PtsJ4 <= 200 THEN SUM(partida.PtsJ4) ELSE SUM(200) END,0) AS PtsObt, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J4 AND partida.PP1 <= 200 THEN SUM(partida.PP1) ELSE SUM(200) END,0) as PtsPerm, 
IFNULL(CASE WHEN jugador.ID = partida.Id_J4 THEN SUM(partida.PtsJ4) END,0) AS TotalPts
 
FROM 
jugador, partida
WHERE 
jugador.ID = partida.Id_J4 
and jugador.Id_torneo = partida.Id_torneo
GROUP BY 
Jugador.Id_Torneo,
partida.Id_J4, 
partida.RJ4,
partida.PtsJ4


) AS TEMP RIGHT join 
Jugador on (Jugador.ID = TEMP.Id AND Jugador.Id_Torneo = Temp.Id_Torneo) INNER JOIN
Torneo On (Torneo.Id = Temp.Id_Torneo ), Equipo, Paises

WHERE 
	    jugador.Id_Equipo = Equipo.ID
    AND jugador.Id_Torneo = Equipo.ID_Torneo
	AND jugador.estatus <> 'I' 
	And Torneo.Estatus = 'A'

    AND Jugador.Id_Pais = Paises.Id
	
GROUP BY Jugador.ID
ORDER BY
6 DESC, 
7 ASC, 
10 DESC,
11 DESC

      `);

      // Calcular totales
      const totales = rows.reduce((acc, row) => ({
        Partidas: acc.Partidas + (row.Partidas || 0),
        Victorias: acc.Victorias + (row.Victorias || 0),
        Derrotas: acc.Derrotas + (row.Derrotas || 0),
        PuntosOb: acc.PuntosOb + (row.PuntosOb || 0),
        PuntosPer: acc.PuntosPer + (row.PuntosPer || 0),
        Efectividad: acc.Efectividad + (row.Efectividad || 0),
        TotalPts: acc.TotalPts + (row.TotalPts || 0)
      }), {
        Partidas: 0,
        Victorias: 0,
        Derrotas: 0,
        PuntosOb: 0,
        PuntosPer: 0,
        Efectividad: 0,
        TotalPts: 0
      });

      // Agregar fila de totales al final
      const filaTotal = {
        ID: null,
        Jugador: 'TOTAL',
        NTorneo: '',
        NEquipo: '',
        Partidas: totales.Partidas,
        Total: totales.Total,
        Victorias: totales.Victorias,
        Derrotas: totales.Derrotas,
        PuntosOb: totales.PuntosOb,
        PuntosPer: totales.PuntosPer,
        Efectividad: totales.Efectividad,
        TotalPts: totales.TotalPts,
        Id_Union: null,
        Bandera: null,
        Pais: '',
        Id: null,
        isTotal: true
      };

      res.json({
        success: true,
        data: [...rows, filaTotal],
        totales: totales
      });
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(510).json({
        success: false,
        message: 'Error al obtener el ranking del torneo',
        error: error.message
      });
    }
  },

};

module.exports = rankingsController;