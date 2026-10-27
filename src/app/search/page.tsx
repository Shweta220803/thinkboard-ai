
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiSearch,
  FiFileText,
  FiClock,
  FiX,
  FiZap,
  FiLoader,
} from "react-icons/fi";

import { getNotes, type Note } from "@/lib/notes";

type SemanticResult = {
  id: string;
  score: number;
  reason: string;
};

type SearchMode = "keyword" | "ai";

export default function SmartNoteSearchPage() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [aiResults, setAiResults] = useState<SemanticResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const loadNotes = useCallback(() => {
    setNotes(getNotes());
  }, []);

  useEffect(() => {
    loadNotes();

    window.addEventListener("storage", loadNotes);
    window.addEventListener("focus", loadNotes);

    return () => {
      window.removeEventListener("storage", loadNotes);
      window.removeEventListener("focus", loadNotes);
    };
  }, [loadNotes]);

  const keywordResults = useMemo(() => {
    const searchTerms = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (searchTerms.length === 0) return notes;

    return notes
      .map((note) => {
        const title = note.title.toLowerCase();
        const content = note.content.toLowerCase();

        const score = searchTerms.reduce((total, term) => {
          if (title.includes(term)) return total + 3;
          if (content.includes(term)) return total + 1;
          return total;
        }, 0);

        return { note, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.note);
  }, [notes, query]);

  const aiNoteResults = useMemo(() => {
    const noteMap = new Map(notes.map((note) => [note.id, note]));

    return aiResults
      .map((result) => ({
        ...result,
        note: noteMap.get(result.id),
      }))
      .filter(
        (
          result,
        ): result is SemanticResult & { note: Note } =>
          result.note !== undefined,
      );
  }, [aiResults, notes]);

  async function handleAISearch() {
    const searchQuery = query.trim();

    if (!searchQuery) {
      setAiError("Enter a question or topic to search your notes.");
      return;
    }

    if (notes.length === 0) {
      setAiError("Create a note before searching your notes with AI.");
      return;
    }

    setMode("ai");
    setAiLoading(true);
    setAiError("");
    setAiResults([]);

    try {
      const response = await fetch("/api/semantic-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          notes: notes.map((note) => ({
            id: note.id,
            title: note.title,
            content: note.content,
          })),
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "AI search failed. Please try again.";

        throw new Error(errorMessage);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("results" in data) ||
        !Array.isArray(data.results)
      ) {
        throw new Error("The AI returned an invalid search response.");
      }

      const validResults = data.results.filter(
        (item): item is SemanticResult =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          "score" in item &&
          "reason" in item &&
          typeof item.id === "string" &&
          typeof item.score === "number" &&
          typeof item.reason === "string",
      );

      setAiResults(validResults);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to search notes with AI. Please try again.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleKeywordSearch() {
    setMode("keyword");
    setAiError("");
  }

  function handleClearSearch() {
    setQuery("");
    setAiResults([]);
    setAiError("");
    setMode("keyword");
  }

  function getPreview(content: string) {
    const plainText = content.replace(/\s+/g, " ").trim();

    if (!plainText) return "No content in this note yet.";

    return plainText.length > 180
      ? `${plainText.slice(0, 180)}...`
      : plainText;
  }

  const displayedResults =
    mode === "ai"
      ? aiNoteResults.map((result) => ({
          note: result.note,
          reason: result.reason,
          score: result.score,
        }))
      : keywordResults.map((note) => ({
          note,
          reason: "",
          score: 0,
        }));

  const searching = mode === "ai" && aiLoading;

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/whiteboards"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-emerald-500"
        >
          <FiArrowLeft size={16} />
          Back to whiteboards
        </Link>

        <header className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <FiSearch size={23} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Smart Note Search
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Search by keywords or let AI find notes by meaning.
          </p>
        </header>

        <div className="relative mb-4">
          <FiSearch
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setAiError("");
              if (mode === "ai") {
                setMode("keyword");
                setAiResults([]);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAISearch();
              }
            }}
            placeholder="e.g. notes about login security..."
            aria-label="Search saved notes"
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-12 text-sm outline-none transition focus:border-emerald-500"
          />

          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <FiX size={17} />
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleKeywordSearch}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              mode === "keyword"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                : "border-border hover:bg-muted"
            }`}
          >
            <FiSearch size={16} />
            Keyword Search
          </button>

          <button
            type="button"
            onClick={() => void handleAISearch()}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading ? (
              <FiLoader className="animate-spin" size={16} />
            ) : (
              <FiZap size={16} />
            )}
            {aiLoading ? "Searching with AI..." : "AI Semantic Search"}
          </button>
        </div>

        {aiError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600"
          >
            {aiError}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {searching
              ? "Finding relevant notes..."
              : `${displayedResults.length} ${
                  displayedResults.length === 1 ? "note" : "notes"
                } found`}
          </span>
          <span>{notes.length} total saved</span>
        </div>

        {notes.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <FiFileText
              size={28}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <h2 className="font-semibold">No saved notes yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a note first, then return here to search it.
            </p>
          </section>
        ) : searching ? (
          <section className="rounded-2xl border border-border px-6 py-14 text-center">
            <FiLoader
              size={28}
              className="mx-auto mb-3 animate-spin text-emerald-500"
            />
            <h2 className="font-semibold">Understanding your search</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              AI is comparing your query with your saved notes.
            </p>
          </section>
        ) : displayedResults.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <FiSearch
              size={28}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <h2 className="font-semibold">No matching notes</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try different keywords or describe the topic another way.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {displayedResults.map(({ note, reason, score }) => (
              <article
                key={note.id}
                className="rounded-2xl border border-border bg-card p-5 transition hover:border-emerald-500/50 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/notes/${note.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <FiFileText size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold transition hover:text-emerald-500">
                        {note.title || "Untitled Note"}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {getPreview(note.content)}
                      </p>

                      {mode === "ai" && reason && (
                        <div className="mt-3 rounded-lg bg-emerald-500/5 px-3 py-2">
                          <p className="text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                            <FiZap className="mr-1 inline" size={13} />
                            {reason}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            AI relevance: {Math.round(score * 100)}%
                          </p>
                        </div>
                      )}

                      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <FiClock size={13} />
                        Updated{" "}
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
