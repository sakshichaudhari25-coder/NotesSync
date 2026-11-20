
const API_URL = "http://localhost:5001/api/notes";

const simplemde = new SimpleMDE({
  element: document.getElementById("editor"),
  spellChecker: false,
  autofocus: false,
  placeholder: "Write your Markdown notes here...",
  status: true
});

const authorInput = document.getElementById("author");
const titleInput = document.getElementById("title");
const notesList = document.getElementById("notesList");

const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const newNoteBtn = document.getElementById("newNoteBtn");
const refreshBtn = document.getElementById("refreshBtn");
const message = document.getElementById("message");

let selectedNoteId = null;

authorInput.value = localStorage.getItem("noteAuthor") || "";

authorInput.addEventListener("input", () => {
  localStorage.setItem("noteAuthor", authorInput.value.trim());
});

function showMessage(text, success = true) {
  message.textContent = text;
  message.style.color = success ? "green" : "red";
}

function clearEditor() {
  selectedNoteId = null;
  titleInput.value = "";
  simplemde.value("");
  saveBtn.textContent = "Save Note";
  showMessage("Create a new note");
  displayNotes();
}

function createNoteItem(note) {
  const item = document.createElement("div");
  item.className = "note-item";

  if (note._id === selectedNoteId) {
    item.classList.add("active");
  }

  const heading = document.createElement("h3");
  heading.textContent = note.title;

  const author = document.createElement("p");
  author.textContent = `By: ${note.author}`;

  const date = document.createElement("p");
  date.textContent = new Date(note.updatedAt).toLocaleString();

  item.append(heading, author, date);

  item.addEventListener("click", () => {
    openNote(note._id);
  });

  return item;
}

async function displayNotes() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Unable to fetch notes");
    }

    const notes = await response.json();

    notesList.replaceChildren();

    if (notes.length === 0) {
      notesList.textContent = "No notes available. Create one!";
      return;
    }

    notes.forEach((note) => {
      notesList.appendChild(createNoteItem(note));
    });

  } catch (error) {
    showMessage(error.message, false);
  }
}

async function openNote(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
      throw new Error("Could not open note");
    }

    const note = await response.json();

    selectedNoteId = note._id;

    titleInput.value = note.title;
    simplemde.value(note.content);

    saveBtn.textContent = "Update Note";

    showMessage(`Editing note by ${note.author}`);

    displayNotes();

  } catch (error) {
    showMessage(error.message, false);
  }
}

async function saveNote() {
  const title = titleInput.value.trim();
  const content = simplemde.value().trim();
  const author = authorInput.value.trim();

  if (!author || !title || !content) {
    showMessage(
      "Please enter your name, title and note content.",
      false
    );
    return;
  }

  const noteData = {
    title,
    content,
    author
  };

  try {
    let response;

    if (selectedNoteId) {
      response = await fetch(`${API_URL}/${selectedNoteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(noteData)
      });

    } else {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(noteData)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to save note");
    }

    selectedNoteId = result.note._id;

    saveBtn.textContent = "Update Note";

    showMessage(result.message);

    await displayNotes();

  } catch (error) {
    showMessage(error.message, false);
  }
}

async function deleteNote() {
  if (!selectedNoteId) {
    showMessage("Please select a note first.", false);
    return;
  }

  const confirmDelete = confirm(
    "Are you sure you want to delete this note?"
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `${API_URL}/${selectedNoteId}`,
      {
        method: "DELETE"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    showMessage(result.message);

    clearEditor();

  } catch (error) {
    showMessage(error.message, false);
  }
}

saveBtn.addEventListener("click", saveNote);

deleteBtn.addEventListener("click", deleteNote);

newNoteBtn.addEventListener("click", clearEditor);

refreshBtn.addEventListener("click", displayNotes);

displayNotes();
