const express = require("express");
const app = express();
require("dotenv").config();

app.use(express.json());

const showRoutes = require("./routes/shows");
const bookingRoutes = require("./routes/bookings");

app.use("/api/admin/shows", showRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/shows", bookingRoutes);

if (process.env.EXPIRE_WORKER === "true") {
  require("./workers/expireBookings");
}

app.listen(process.env.PORT, () =>
  console.log(`Server running on ${process.env.PORT}`)
);
