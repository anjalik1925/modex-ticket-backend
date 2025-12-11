const express = require("express");
const router = express.Router();
const { withTransaction } = require("../db");

// POST /api/shows/:id/book
router.post("/:id/book", async (req, res) => {
  const showId = parseInt(req.params.id);
  const { user_id, seats_requested } = req.body;
  const seats = Number(seats_requested);

  try {
    const booking = await withTransaction(async (client) => {
      const sel = await client.query(
        "SELECT seats_available FROM shows WHERE id=$1 FOR UPDATE",
        [showId]
      );

      if (sel.rowCount === 0)
        return res.status(404).json({ error: "Show not found" });

      const available = sel.rows[0].seats_available;

      if (available < seats) {
        const r = await client.query(
          `INSERT INTO bookings (show_id, user_id, seats_requested, status)
           VALUES ($1,$2,$3,'FAILED') RETURNING *`,
          [showId, user_id, seats]
        );
        return r.rows[0];
      }

      await client.query(
        "UPDATE shows SET seats_available = seats_available - $1 WHERE id=$2",
        [seats, showId]
      );

      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

      const r = await client.query(
        `INSERT INTO bookings (show_id, user_id, seats_requested, status, expires_at)
         VALUES ($1,$2,$3,'PENDING',$4) RETURNING *`,
        [showId, user_id, seats, expiresAt]
      );

      return r.rows[0];
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal error" });
  }
});

module.exports = router;
