import { pool } from "../db.js"

export const getAllData = async (req, res, next) => {
    const result = await pool.query("SELECT * FROM data");
    return res.json(result.rows);
}

export const postData = async (req, res, next) => {
    const { date, time, pc, avg, conteo, dispositivo_id } = req.body;


    const result = await pool.query(
        "INSERT INTO data (date, time, pc, avg, conteo, dispositivo_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
        [date, time, pc, avg, conteo, dispositivo_id]
    );

    return res.json(result.rows[0]);

}

export const getHistory = async (req, res, next) => {
    try {

        // Ejecuta la consulta con la fecha proporcionada
        const result = await pool.query("SELECT * FROM history");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        return res.status(500).json({ message: 'Error al obtener el historial.' });
    }
};


