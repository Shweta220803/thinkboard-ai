
export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "thinkboard-ai-notes";

export function getNotes(): Note[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function createNote(): string {
  const now = new Date().toISOString();

  const note: Note = {
    id: crypto.randomUUID(),
    title: "Untitled Note",
    content: "",
    createdAt: now,
    updatedAt: now,
  };

  saveNotes([note, ...getNotes()]);

  return note.id;
}

export function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title" | "content">>,
) {
  const notes = getNotes();
  const note = notes.find((item) => item.id === id);

  if (!note) return;

  if (updates.title !== undefined) {
    note.title = updates.title;
  }

  if (updates.content !== undefined) {
    note.content = updates.content;
  }

  note.updatedAt = new Date().toISOString();

  saveNotes(notes);
}

export function deleteNote(id: string) {
  const notes = getNotes().filter((note) => note.id !== id);
  saveNotes(notes);
}
