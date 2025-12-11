const { pool, withTransaction } = require("../db");

async function expirePendingBookings() {
  const { rows } = await pool.query(
    `SELECT * FROM bookings WHERE status='PENDING' AND expires_at <= NOW()`
  );

  for (const b of rows) {
    await withTransaction(async (client) => {
      await client.query(
        "UPDATE bookings SET status='FAILED' WHERE id=$1",
        [b.id]
      );

      await client.query(
        "UPDATE shows SET seats_available = seats_available + $1 WHERE id=$2",
        [b.seats_requested, b.show_id]
      );
    });
  }
}

setInterval(expirePendingBookings, 30000);
