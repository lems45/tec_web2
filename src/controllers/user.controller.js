import { pool } from "../db.js";

export const getAllUsers = async (req, res, next) => {
  const result = await pool.query("SELECT * FROM users");
  return res.json(result.rows);
};

export const getUser = async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe un usuario con ese id",
    });
  }

  return res.json(result.rows[0]);
};


export const updateUser = async (req, res) => {
  const id = req.params.id;
  const { username, email, password, level } = req.body;

  const result = await pool.query(
    "UPDATE users SET username = $1, password = $2, email = $3, level = $4 WHERE id = $5 RETURNING*",
    [username, password, email, level, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe un usuario con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const deleteUser = async (req, res) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe un usuario con ese id",
    });
  }

  return res.sendStatus(204);
};
