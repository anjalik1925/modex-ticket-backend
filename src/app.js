import express from "express";
import dotenv from "dotenv";
import showRoutes from "./routes/shows.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", showRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
