
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiClock,
  FiLayers,
  FiPlus,
  FiArrowUpRight,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
} from "react-icons/fi";

import {
  createWhiteboardId,
  getWhiteboards,
  renameWhiteboard,
  deleteWhiteboard,
  type Whiteboard,
} from "@/lib/whiteboards";

export default function WhiteboardsPage() {
  const router = useRouter();

  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const loadWhiteboards = useCallback(() => {
    setWhiteboards(getWhiteboards());
  }, []);

  useEffect(() => {
    loadWhiteboards();

    // Refresh the list when localStorage changes in another tab.
    window.addEventListener("storage", loadWhiteboards);

    return () => {
      window.removeEventListener("storage", loadWhiteboards);
    };
  }, [loadWhiteboards]);

  function handleCreateWhiteboard() {
    const id = createWhiteboardId();
    router.push(`/whiteboards/${id}`);
  }

  function handleStartRename(board: Whiteboard) {
    setEditingId(board.id);
    setEditingTitle(board.title);
  }

  function handleRename(id: string) {
    const title = editingTitle.trim();

    if (!title) return;

    renameWhiteboard(id, title);

    setEditingId(null);
    setEditingTitle("");
    loadWhiteboards();
  }

  function handleCancelRename() {
    setEditingId(null);
    setEditingTitle("");
  }

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this whiteboard? This action cannot be undone.",
    );

    if (!confirmed) return;

    deleteWhiteboard(id);

    if (editingId === id) {
      handleCancelRename();
    }

    loadWhiteboards();
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back navigation */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-emerald-500"
        >
          <FiArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Page header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Whiteboards
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Organize your ideas and continue where you left off.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateWhiteboard}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <FiPlus size={18} />
            New whiteboard
          </button>
        </header>

        {/* Empty state */}
        {whiteboards.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <FiLayers size={26} />
            </div>

            <h2 className="text-lg font-semibold">
              No saved whiteboards yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Create a whiteboard to start sketching, mapping concepts, and
              organizing your ideas.
            </p>

            <button
              type="button"
              onClick={handleCreateWhiteboard}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <FiPlus size={17} />
              Create whiteboard
            </button>
          </section>
        ) : (
          <>
            {/* Whiteboard count */}
            <p className="mb-4 text-sm text-muted-foreground">
              {whiteboards.length}{" "}
              {whiteboards.length === 1 ? "whiteboard" : "whiteboards"}
            </p>

            {/* Whiteboard grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {whiteboards.map((board) => (
                <article
                  key={board.id}
                  className="rounded-2xl border border-border bg-card p-5 transition hover:border-emerald-500/50 hover:shadow-lg"
                >
                  {/* Card actions */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <FiLayers size={21} />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Rename ${board.title}`}
                        title="Rename whiteboard"
                        onClick={() => handleStartRename(board)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        aria-label={`Delete ${board.title}`}
                        title="Delete whiteboard"
                        onClick={() => handleDelete(board.id)}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                      >
                        <FiTrash2 size={16} />
                      </button>

                      {editingId !== board.id && (
                        <FiArrowUpRight
                          size={19}
                          className="ml-1 text-muted-foreground"
                        />
                      )}
                    </div>
                  </div>

                  {/* Rename form or card details */}
                  {editingId === board.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleRename(board.id);
                      }}
                      className="space-y-3"
                    >
                      <label
                        htmlFor={`title-${board.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Whiteboard title
                      </label>

                      <input
                        id={`title-${board.id}`}
                        autoFocus
                        maxLength={100}
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                        placeholder="Enter whiteboard title"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={!editingTitle.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiCheck size={14} />
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                        >
                          <FiX size={14} />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/whiteboards/${board.id}`)
                        }
                        className="w-full text-left"
                      >
                        <h2 className="truncate font-semibold transition group-hover:text-emerald-500">
                          {board.title}
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                          Open this whiteboard to continue working.
                        </p>
                      </button>

                      <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                        <FiClock size={13} />
                        Updated{" "}
                        {new Date(board.updatedAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
