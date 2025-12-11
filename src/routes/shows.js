const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.post("/", async (req, res) => {
  const { name, start_time, total_seats } = req.body;

  const q = `INSERT INTO shows (name, start_time, total_seats, seats_available)
             VALUES ($1, $2, $3, $3) RETURNING *`;

  const { rows } = await pool.query(q, [name, start_time, total_seats]);
  res.status(201).json(rows[0]);
});

router.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM shows ORDER BY start_time");
  res.json(rows);
});

module.exports = router;
