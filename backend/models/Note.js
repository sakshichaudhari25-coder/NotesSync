import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A note title is required"],
      trim: true,
      minlength: [1, "A note title cannot be empty"],
    },
    content: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      required: [true, "An author is required"],
      trim: true,
      minlength: [1, "An author cannot be empty"],
    },
    collaborators: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: {
        validator: (collaborators) =>
          collaborators.every((collaborator) => collaborator.length > 0),
        message: "Collaborator names cannot be empty",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Note = mongoose.model("Note", noteSchema);

export default Note;
