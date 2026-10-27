
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowUpRight,
  FiClock,
  FiFileText,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  type DocumentItem,
} from "@/lib/documents";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState("");

  const loadDocuments = useCallback(() => {
    setDocuments(getDocuments());
  }, []);

  useEffect(() => {
    loadDocuments();

    window.addEventListener("storage", loadDocuments);
    return () => window.removeEventListener("storage", loadDocuments);
  }, [loadDocuments]);

  function handleCreateDocument() {
    const id = createDocument();
    loadDocuments();
    router.push(`/documents/${id}`);
  }

  function handleDeleteDocument(
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
    title: string,
  ) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`,
    );

    if (!confirmed) return;

    deleteDocument(id);
    loadDocuments();
  }

  const filteredDocuments = documents.filter((document) => {
    const query = search.toLowerCase();

    return (
      document.title.toLowerCase().includes(query) ||
      document.content.toLowerCase().includes(query)
    );
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <FiFileText />
              <span>Workspace / Documents</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              My Documents
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Create, organize, and manage your documents.
            </p>
          </div>

          <button
            onClick={handleCreateDocument}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            <FiPlus size={18} />
            New Document
          </button>
        </header>

        <div className="mb-8 flex items-center gap-3 rounded-xl border border-border bg-card px-4">
          <FiSearch className="shrink-0 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents by title or content..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium">All Documents</h2>
          <span className="text-sm text-muted-foreground">
            {filteredDocuments.length}{" "}
            {filteredDocuments.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FiFileText size={25} className="text-muted-foreground" />
            </div>

            <h3 className="text-lg font-medium">
              {search ? "No documents found" : "No documents yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Create your first document to get started."}
            </p>

            {!search && (
              <button
                onClick={handleCreateDocument}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                <FiPlus size={16} />
                Create Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => (
              <article
                key={document.id}
                onClick={() => router.push(`/documents/${document.id}`)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-5 transition hover:border-emerald-500/50 hover:shadow-sm"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FiFileText size={21} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Delete document"
                      aria-label={`Delete ${document.title}`}
                      onClick={(event) =>
                        handleDeleteDocument(
                          event,
                          document.id,
                          document.title,
                        )
                      }
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <FiTrash2 size={16} />
                    </button>

                    <FiArrowUpRight className="text-muted-foreground transition group-hover:text-emerald-500" />
                  </div>
                </div>

                <h3 className="truncate font-medium">{document.title}</h3>

                <p className="mt-2 min-h-10 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {document.content
                    ? document.content.slice(0, 100)
                    : "No content yet. Open to start writing."}
                  {document.content.length > 100 ? "..." : ""}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <FiClock size={13} />
                  <span>Updated {formatDate(document.updatedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
