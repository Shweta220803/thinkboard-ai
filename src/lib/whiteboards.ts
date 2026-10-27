export type Whiteboard = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "thinkboard-ai-whiteboards";

export function getWhiteboards(): Whiteboard[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Whiteboard[]) : [];
  } catch {
    return [];
  }
}

function saveWhiteboards(whiteboards: Whiteboard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(whiteboards));
}

// Keep the existing function name so existing imports continue to work.
export function createWhiteboardId(): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const whiteboard: Whiteboard = {
    id,
    title: "Untitled Whiteboard",
    createdAt: now,
    updatedAt: now,
  };

  saveWhiteboards([whiteboard, ...getWhiteboards()]);
  return id;
}

export function updateWhiteboardTitle(id: string, title: string) {
  const whiteboards = getWhiteboards();
  const existing = whiteboards.find((board) => board.id === id);
  const now = new Date().toISOString();

  if (existing) {
    existing.title = title.trim() || "Untitled Whiteboard";
    existing.updatedAt = now;
  } else {
    whiteboards.unshift({
      id,
      title: title.trim() || "Untitled Whiteboard",
      createdAt: now,
      updatedAt: now,
    });
  }

  saveWhiteboards(whiteboards);
}

export function deleteWhiteboard(id: string) {
  // Remove the whiteboard from the saved list.
  const remainingWhiteboards = getWhiteboards().filter(
    (board) => board.id !== id,
  );

  localStorage.setItem(
    "thinkboard-ai-whiteboards",
    JSON.stringify(remainingWhiteboards),
  );

  // Remove its saved title.
  localStorage.removeItem(`thinkboard-ai-title-${id}`);
}

export function renameWhiteboard(id: string, title: string) {
  updateWhiteboardTitle(id, title);
  localStorage.setItem(`thinkboard-ai-title-${id}`, title);
}