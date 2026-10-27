
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiFileText,
  FiPlus,
  FiSearch,
  FiClock,
  FiArrowUpRight,
} from "react-icons/fi";
import { createNote, getNotes, type Note } from "@/lib/notes";

export default function NotesPage() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");

  const loadNotes = useCallback(() => {
    setNotes(getNotes());
  }, []);

  useEffect(() => {
    loadNotes();

    window.addEventListener("storage", loadNotes);

    return () => {
      window.removeEventListener("storage", loadNotes);
    };
  }, [loadNotes]);

  function handleCreateNote() {
    const id = createNote();
    router.push(`/notes/${id}`);
  }

  const filteredNotes = notes.filter((note) => {
    const query = search.toLowerCase();

    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-emerald-500"
        >
          <FiArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Capture ideas, organize your thoughts, and keep everything in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNote}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <FiPlus size={18} />
            New note
          </button>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <FiSearch
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>

        {filteredNotes.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <FiFileText size={26} />
            </div>

            <h2 className="text-lg font-semibold">
              {search ? "No matching notes" : "No notes yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {search
                ? "Try another search term."
                : "Create your first note to start capturing your ideas."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={handleCreateNote}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <FiPlus size={17} />
                Create note
              </button>
            )}
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => router.push(`/notes/${note.id}`)}
                className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-emerald-500/50 hover:shadow-lg"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FiFileText size={21} />
                  </div>
                  <FiArrowUpRight
                    size={19}
                    className="text-muted-foreground transition group-hover:text-emerald-500"
                  />
                </div>

                <h2 className="truncate font-semibold">{note.title}</h2>

                <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  {note.content.trim()
                    ? note.content.trim().slice(0, 100)
                    : "No content yet. Open to start writing."}
                </p>

                <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <FiClock size={13} />
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
