import { pool } from "../db.js"

export const getAllData = async (req, res, next) => {
    const result = await pool.query("SELECT * FROM data");
    return res.json(result.rows);
}