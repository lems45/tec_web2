
import { pool } from "../db.js";

export const getAllData = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM data");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

export const postData = async (req, res, next) => {
    const { timestamp, altitude, temperature, pressure, velocity } = req.body;

    if (!timestamp || altitude === undefined || temperature === undefined || pressure === undefined || velocity === undefined) {
        return res.status(400).json({ message: 'Faltan parámetros en la solicitud.' });
    }

    try {
        const result = await pool.query(
            "INSERT INTO data (date, time, altitude, temperature, pressure, velocity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [date, time, altitude, temperature, pressure, velocity]
        );

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al insertar los datos:', error);
        return res.status(500).json({ message: 'Error al insertar los datos.' });
    }
};

export const getAllBatteries = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM battery_status");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};
