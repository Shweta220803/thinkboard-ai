
export type DocumentItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "thinkboard-ai-documents";

export function getDocuments(): DocumentItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as DocumentItem[]) : [];
  } catch {
    return [];
  }
}

function saveDocuments(documents: DocumentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function createDocument(): string {
  const now = new Date().toISOString();

  const document: DocumentItem = {
    id: crypto.randomUUID(),
    title: "Untitled Document",
    content: "",
    createdAt: now,
    updatedAt: now,
  };

  saveDocuments([document, ...getDocuments()]);

  return document.id;
}

export function updateDocument(
  id: string,
  updates: Partial<Pick<DocumentItem, "title" | "content">>,
) {
  const documents = getDocuments();
  const document = documents.find((item) => item.id === id);

  if (!document) return;

  if (updates.title !== undefined) {
    document.title = updates.title;
  }

  if (updates.content !== undefined) {
    document.content = updates.content;
  }

  document.updatedAt = new Date().toISOString();

  saveDocuments(documents);
}

export function deleteDocument(id: string) {
  const remainingDocuments = getDocuments().filter(
    (document) => document.id !== id,
  );

  saveDocuments(remainingDocuments);
}
