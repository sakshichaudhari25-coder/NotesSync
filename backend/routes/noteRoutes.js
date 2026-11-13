import express from "express";
import mongoose from "mongoose";
import Note from "../models/Note.js";

const router = express.Router();

function hasRequiredFields(title, author) {
  return (
    typeof title === "string" &&
    title.trim().length > 0 &&
    typeof author === "string" &&
    author.trim().length > 0
  );
}

function isValidationError(error) {
  return error instanceof mongoose.Error.ValidationError;
}

function isValidNoteId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

router.post("/", async (request, response) => {
  try {
    const { title, content, author, collaborators } = request.body ?? {};

    if (!hasRequiredFields(title, author)) {
      return response.status(400).json({
        message: "Title and author are required and cannot be blank.",
      });
    }

    const note = await Note.create({
      title,
      content,
      author,
      collaborators,
    });

    return response.status(201).json({
      message: "Note created successfully.",
      note,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return response.status(400).json({
        message: "Note validation failed.",
        errors: Object.values(error.errors).map((fieldError) => fieldError.message),
      });
    }

    console.error("Could not create note:", error);
    return response.status(500).json({ message: "Could not create note." });
  }
});

router.get("/", async (_request, response) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    return response.status(200).json({ notes });
  } catch (error) {
    console.error("Could not fetch notes:", error);
    return response.status(500).json({ message: "Could not fetch notes." });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (!isValidNoteId(id)) {
      return response.status(400).json({ message: "The note ID is invalid." });
    }

    const note = await Note.findById(id);
    if (!note) {
      return response.status(404).json({ message: "Note not found." });
    }

    return response.status(200).json({ note });
  } catch (error) {
    console.error("Could not fetch note:", error);
    return response.status(500).json({ message: "Could not fetch note." });
  }
});

router.put("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (!isValidNoteId(id)) {
      return response.status(400).json({ message: "The note ID is invalid." });
    }

    const { title, content, author, collaborators } = request.body ?? {};
    if (!hasRequiredFields(title, author)) {
      return response.status(400).json({
        message: "Title and author are required and cannot be blank.",
      });
    }

    const updates = { title, author };
    if (content !== undefined) updates.content = content;
    if (collaborators !== undefined) updates.collaborators = collaborators;

    const note = await Note.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return response.status(404).json({ message: "Note not found." });
    }

    return response.status(200).json({
      message: "Note updated successfully.",
      note,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return response.status(400).json({
        message: "Note validation failed.",
        errors: Object.values(error.errors).map((fieldError) => fieldError.message),
      });
    }

    console.error("Could not update note:", error);
    return response.status(500).json({ message: "Could not update note." });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (!isValidNoteId(id)) {
      return response.status(400).json({ message: "The note ID is invalid." });
    }

    const note = await Note.findByIdAndDelete(id);
    if (!note) {
      return response.status(404).json({ message: "Note not found." });
    }

    return response.status(200).json({
      message: "Note deleted successfully.",
      note,
    });
  } catch (error) {
    console.error("Could not delete note:", error);
    return response.status(500).json({ message: "Could not delete note." });
  }
});

export default router;
