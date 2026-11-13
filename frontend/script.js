const API_URL = "http://localhost:5000/api/notes";

const notesList = document.querySelector("#notes-list");
const notesPlaceholder = document.querySelector("#notes-placeholder");
const noteCount = document.querySelector("#note-count");
const titleInput = document.querySelector("#note-title");
const authorInput = document.querySelector("#note-author");
const collaboratorsInput = document.querySelector("#note-collaborators");
const editorElement = document.querySelector("#markdown-editor");
const previewElement = document.querySelector("#markdown-preview");
const messageBanner = document.querySelector("#message-banner");
const messageText = document.querySelector("#message-text");
const saveButton = document.querySelector("#save-note-button");
const deleteButton = document.querySelector("#delete-note-button");
const refreshButton = document.querySelector("#refresh-notes-button");
const newNoteButton = document.querySelector("#new-note-button");

let notes = [];
let selectedNoteId = null;
let easyMDE;
let messageTimer;

if (typeof EasyMDE === "undefined") {
  showMessage("The Markdown editor could not load. Check your internet connection and refresh the page.", "error");
} else {
  easyMDE = new EasyMDE({
    element: editorElement,
    autofocus: false,
    spellChecker: false,
    status: false,
    minHeight: "290px",
    toolbar: [
      "bold",
      "italic",
      "heading",
      "|",
      "quote",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "|",
      "preview",
      "side-by-side",
      "fullscreen",
    ],
    placeholder: "Start writing in Markdown...",
  });

  easyMDE.codemirror.on("change", renderPreview);
}

function showMessage(message, type = "success") {
  window.clearTimeout(messageTimer);
  messageText.textContent = message;
  messageBanner.classList.toggle("is-error", type === "error");
  messageBanner.hidden = false;

  messageTimer = window.setTimeout(() => {
    messageBanner.hidden = true;
  }, 5000);
}

function dismissMessage() {
  window.clearTimeout(messageTimer);
  messageBanner.hidden = true;
}

function renderPreview() {
  const markdown = easyMDE ? easyMDE.value() : "";

  if (!markdown.trim()) {
    previewElement.innerHTML = `
      <div class="preview-empty">
        <span aria-hidden="true">✧</span>
        <p>Your formatted note will appear here as you write.</p>
      </div>
    `;
    return;
  }

  if (typeof marked === "undefined" || typeof DOMPurify === "undefined") {
    previewElement.textContent = "The Markdown preview could not load. Check your internet connection and refresh the page.";
    return;
  }

  const renderedMarkdown = marked.parse(markdown, { breaks: true, gfm: true });
  previewElement.innerHTML = DOMPurify.sanitize(renderedMarkdown);
}

function renderNotes() {
  notesList.replaceChildren();
  noteCount.textContent = String(notes.length);

  if (notes.length === 0) {
    notesList.append(notesPlaceholder);
    notesPlaceholder.hidden = false;
    return;
  }

  notesPlaceholder.hidden = true;

  notes.forEach((note) => {
    const noteButton = document.createElement("button");
    const title = document.createElement("span");
    const author = document.createElement("span");

    noteButton.type = "button";
    noteButton.className = "note-list-item";
    noteButton.classList.toggle("is-active", note._id === selectedNoteId);
    noteButton.setAttribute("aria-current", note._id === selectedNoteId ? "true" : "false");
    noteButton.addEventListener("click", () => loadNote(note._id));

    title.className = "note-list-title";
    title.textContent = note.title || "Untitled note";
    author.className = "note-list-meta";
    author.textContent = note.author || "Unknown author";

    noteButton.append(title, author);
    notesList.append(noteButton);
  });
}

async function fetchNotes() {
  refreshButton.disabled = true;

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Could not fetch notes (HTTP ${response.status}).`);
    }

    if (!Array.isArray(result.notes)) {
      throw new Error("The server returned an unexpected notes response.");
    }

    notes = result.notes;
    renderNotes();
    return true;
  } catch (error) {
    const message = error instanceof TypeError
      ? "Could not connect to NoteSync. Make sure the backend is running on port 5000."
      : error.message;
    showMessage(message || "Could not fetch notes.", "error");
    return false;
  } finally {
    refreshButton.disabled = false;
  }
}

function getNoteFormData() {
  return {
    title: titleInput.value.trim(),
    content: easyMDE ? easyMDE.value() : "",
    author: authorInput.value.trim(),
    collaborators: collaboratorsInput.value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  };
}

function validateNote(data) {
  if (!data.title) {
    showMessage("Please add a title before saving your note.", "error");
    titleInput.focus();
    return false;
  }

  if (!data.author) {
    showMessage("Please add an author name before saving your note.", "error");
    authorInput.focus();
    return false;
  }

  return true;
}

async function readApiResponse(response, fallbackMessage) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(`The server returned an unreadable response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const validationErrors = Array.isArray(result.errors) ? ` ${result.errors.join(" ")}` : "";
    throw new Error(`${result.message || fallbackMessage}${validationErrors}`);
  }

  return result;
}

async function createNote() {
  const noteData = getNoteFormData();
  if (!validateNote(noteData)) return;

  saveButton.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData),
    });
    const result = await readApiResponse(response, "Could not create note.");

    selectedNoteId = result.note?._id ?? null;
    deleteButton.disabled = !selectedNoteId;
    const refreshed = await fetchNotes();
    showMessage(
      refreshed
        ? "Your note was saved successfully."
        : "Your note was saved, but the list could not refresh. Try Refresh notes.",
      refreshed ? "success" : "error",
    );
  } catch (error) {
    showMessage(error instanceof TypeError
      ? "Could not connect to NoteSync. Make sure the backend is running on port 5000."
      : error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function updateNote() {
  if (!selectedNoteId) {
    await createNote();
    return;
  }

  const noteData = getNoteFormData();
  if (!validateNote(noteData)) return;

  saveButton.disabled = true;

  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(selectedNoteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData),
    });
    await readApiResponse(response, "Could not update note.");
    const refreshed = await fetchNotes();
    showMessage(
      refreshed
        ? "Your changes were saved successfully."
        : "Your changes were saved, but the list could not refresh. Try Refresh notes.",
      refreshed ? "success" : "error",
    );
  } catch (error) {
    showMessage(error instanceof TypeError
      ? "Could not connect to NoteSync. Make sure the backend is running on port 5000."
      : error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function deleteNote() {
  if (!selectedNoteId) {
    showMessage("Choose a saved note before deleting it.", "error");
    return;
  }

  if (!window.confirm("Delete this note? This action cannot be undone.")) {
    return;
  }

  deleteButton.disabled = true;

  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(selectedNoteId)}`, {
      method: "DELETE",
    });
    await readApiResponse(response, "Could not delete note.");
    clearEditor();
    const refreshed = await fetchNotes();
    showMessage(
      refreshed
        ? "Your note was deleted."
        : "Your note was deleted, but the list could not refresh. Try Refresh notes.",
      refreshed ? "success" : "error",
    );
  } catch (error) {
    showMessage(error instanceof TypeError
      ? "Could not connect to NoteSync. Make sure the backend is running on port 5000."
      : error.message, "error");
  } finally {
    deleteButton.disabled = !selectedNoteId;
  }
}

function loadNote(noteId) {
  const note = notes.find((savedNote) => savedNote._id === noteId);

  if (!note) {
    showMessage("That note is no longer in the list. Refresh and try again.", "error");
    return;
  }

  selectedNoteId = note._id;
  titleInput.value = note.title || "";
  authorInput.value = note.author || "";
  collaboratorsInput.value = Array.isArray(note.collaborators)
    ? note.collaborators.join(", ")
    : "";

  if (easyMDE) {
    easyMDE.value(note.content || "");
  }

  deleteButton.disabled = false;
  renderNotes();
  renderPreview();
  dismissMessage();
}

function clearEditor() {
  selectedNoteId = null;
  titleInput.value = "";
  authorInput.value = "Sakshi";
  collaboratorsInput.value = "";

  if (easyMDE) {
    easyMDE.value("");
  }

  deleteButton.disabled = true;
  renderNotes();
  renderPreview();
  dismissMessage();
}

function saveCurrentNote() {
  if (selectedNoteId) {
    updateNote();
  } else {
    createNote();
  }
}

newNoteButton.addEventListener("click", () => {
  clearEditor();
  titleInput.focus();
});

document.querySelector("#placeholder-new-note").addEventListener("click", () => {
  clearEditor();
  titleInput.focus();
});

refreshButton.addEventListener("click", fetchNotes);
saveButton.addEventListener("click", saveCurrentNote);
deleteButton.addEventListener("click", deleteNote);
document.querySelector("#message-dismiss").addEventListener("click", dismissMessage);

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key.toLowerCase() === "n") {
    event.preventDefault();
    clearEditor();
    titleInput.focus();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveCurrentNote();
  }
});

fetchNotes();