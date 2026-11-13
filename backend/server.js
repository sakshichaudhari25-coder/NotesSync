import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import noteRoutes from "./routes/noteRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());
app.use("/api/notes", noteRoutes);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "NoteSync backend is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use((_request, response) => {
  response.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use((error, _request, response, _next) => {
  console.error("Request error:", error);
  response.status(500).json({
    status: "error",
    message: "An unexpected server error occurred",
  });
});

async function startServer() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env before starting the server.");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  await new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`NoteSync backend listening on port ${port}`);
      resolve();
    });
    server.on("error", reject);
  });
}

startServer().catch((error) => {
  console.error("Could not start the NoteSync backend:", error.message);
  process.exit(1);
});