import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import Note from "./models/Note.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/api", (req, res) => {
  res.json({ message: "Markdown Notes API is running!" });
});

app.get("/api/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/notes/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(400).json({
      message: "Invalid note ID"
    });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { title, content, author } = req.body;

    if (!title?.trim() || !content?.trim() || !author?.trim()) {
      return res.status(400).json({
        message: "Title, content and author are required"
      });
    }

    const newNote = await Note.create({
      title,
      content,
      author
    });

    res.status(201).json({
      message: "Note created successfully",
      note: newNote
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/notes/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        message: "Title and content are required"
      });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedNote) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.status(200).json({
      message: "Note updated successfully",
      note: updatedNote
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(
      req.params.id
    );

    if (!deletedNote) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.status(200).json({
      message: "Note deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid note ID" });
  }
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(process.env.PORT || 5001, () => {
      console.log(
        `Server running on port ${process.env.PORT || 5001}`
      );
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error.message);
  });
