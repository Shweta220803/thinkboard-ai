
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheck,
  FiFileText,
  FiLoader,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import {
  deleteDocument,
  getDocuments,
  updateDocument,
  type DocumentItem,
} from "@/lib/documents";

type DocumentEditorClientProps = {
  id: string;
};

type SaveStatus = "saved" | "unsaved" | "saving";

export default function DocumentEditorClient({
  id,
}: DocumentEditorClientProps) {
  const router = useRouter();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const initialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValues = useRef({ title: "", content: "" });
  const lastSaved = useRef({ title: "", content: "" });

  useEffect(() => {
    initialized.current = false;
    setLoading(true);

    const existing = getDocuments().find((item) => item.id === id);

    if (existing) {
      setDocument(existing);
      setTitle(existing.title);
      setContent(existing.content);

      latestValues.current = {
        title: existing.title,
        content: existing.content,
      };

      lastSaved.current = {
        title: existing.title,
        content: existing.content,
      };

      initialized.current = true;
    } else {
      setDocument(null);
    }

    setLoading(false);
  }, [id]);

  const saveCurrentDocument = useCallback(() => {
    if (!initialized.current) return;

    const current = latestValues.current;
    const normalizedTitle = current.title.trim() || "Untitled Document";

    setSaveStatus("saving");

    updateDocument(id, {
      title: normalizedTitle,
      content: current.content,
    });

    latestValues.current = {
      title: normalizedTitle,
      content: current.content,
    };

    lastSaved.current = {
      title: normalizedTitle,
      content: current.content,
    };

    setTitle((previous) =>
      previous === current.title ? normalizedTitle : previous,
    );

    setSaveStatus("saved");
  }, [id]);

  const documentId = document?.id;

  useEffect(() => {
    if (!initialized.current || !documentId) return;

    const current = { title, content };

    if (
      current.title === lastSaved.current.title &&
      current.content === lastSaved.current.content
    ) {
      return;
    }

    setSaveStatus("unsaved");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveCurrentDocument();
      timerRef.current = null;
    }, 700);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [title, content, documentId, saveCurrentDocument]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleTitleChange(value: string) {
    latestValues.current.title = value;
    setTitle(value);
  }

  function handleContentChange(value: string) {
    latestValues.current.content = value;
    setContent(value);
  }

  function handleManualSave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    saveCurrentDocument();
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title || "Untitled Document"}"?`,
    );

    if (!confirmed) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    initialized.current = false;
    deleteDocument(id);
    router.push("/documents");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">
          Loading document...
        </p>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
        <FiFileText size={36} className="mb-4 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Document not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This document may have been deleted or does not exist.
        </p>
        <Link
          href="/documents"
          className="mt-5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white"
        >
          Back to Documents
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/documents"
              aria-label="Back to documents"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <FiArrowLeft size={19} />
            </Link>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <FiFileText size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                ThinkBoard AI / Documents
              </p>
              <p className="truncate text-sm font-medium">
                {title.trim() || "Untitled Document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saveStatus === "saving" ? (
                <>
                  <FiLoader className="animate-spin" />
                  Saving...
                </>
              ) : saveStatus === "unsaved" ? (
                "Unsaved changes"
              ) : (
                <>
                  <FiCheck className="text-emerald-500" />
                  Saved
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleManualSave}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted"
            >
              <FiSave size={16} />
              Save
            </button>

            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete document"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <FiTrash2 size={17} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-10 sm:px-10 sm:py-14">
        <input
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Untitled Document"
          aria-label="Document title"
          className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground sm:text-4xl"
        />

        <p className="mt-3 text-xs text-muted-foreground">
          Your changes are saved automatically.
        </p>

        <textarea
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          placeholder="Start writing your document..."
          aria-label="Document content"
          className="mt-10 min-h-[60vh] w-full flex-1 resize-y border-none bg-transparent text-base leading-8 outline-none placeholder:text-muted-foreground"
        />

        <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          Plain text document · Stored locally in this browser
        </div>
      </section>
    </main>
  );
}
