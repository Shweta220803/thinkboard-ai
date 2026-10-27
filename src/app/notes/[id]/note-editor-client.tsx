"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheck,
  FiFileText,
  FiTrash2,
  FiLoader,
  FiZap,
  FiMessageSquare,
  FiSend,
} from "react-icons/fi";
import {
  deleteNote,
  getNotes,
  updateNote,
  type Note,
} from "@/lib/notes";

type NoteEditorClientProps = {
  id: string;
};

type SaveStatus = "saved" | "unsaved" | "saving";
type ChatMessage = { role: "user" | "assistant"; content: string };

export default function NoteEditorClient({ id }: NoteEditorClientProps) {
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // AI feature state: keep the two actions separate so each button has a clear loading label.
  const [summarizing, setSummarizing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [continuingWriting, setContinuingWriting] = useState(false);
  const [extractingKeyPoints, setExtractingKeyPoints] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [improvedContent, setImprovedContent] = useState("");
  const [expandedContent, setExpandedContent] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [continuedContent, setContinuedContent] = useState("");
  const [keyPointsContent, setKeyPointsContent] = useState("");
  const [questionsContent, setQuestionsContent] = useState("");
  const [flashcardsContent, setFlashcardsContent] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const initialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValues = useRef({ title: "", content: "" });

  useEffect(() => {
    const existingNote = getNotes().find((item) => item.id === id);

    if (existingNote) {
      setNote(existingNote);
      setTitle(existingNote.title);
      setContent(existingNote.content);
      latestValues.current = {
        title: existingNote.title,
        content: existingNote.content,
      };
      initialized.current = true;
    } else {
      setNote(null);
    }

    setLoading(false);
  }, [id]);

  // Save the latest values to localStorage and update the visible save status.
  const saveCurrentNote = useCallback(() => {
    if (!initialized.current) return;

    const current = latestValues.current;
    const normalizedTitle = current.title.trim() || "Untitled Note";

    setSaveStatus("saving");

    updateNote(id, {
      title: normalizedTitle,
      content: current.content,
    });

    setTitle((previous) =>
      previous === current.title ? normalizedTitle : previous,
    );

    setNote((previous) =>
      previous
        ? {
            ...previous,
            title: normalizedTitle,
            content: current.content,
            updatedAt: new Date().toISOString(),
          }
        : previous,
    );

    latestValues.current.title = normalizedTitle;
    setSaveStatus("saved");
  }, [id]);

  // Autosave after the user stops typing for 700 milliseconds.
  useEffect(() => {
    if (!initialized.current || !note) return;

    setSaveStatus("unsaved");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 700);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [title, content, note, saveCurrentNote]);

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

    saveCurrentNote();
  }

  // Ask the AI to summarize the note and append the result to the existing content.
  async function handleSummarize() {
    if (!content.trim()) {
      setSummaryError("Write some content before summarizing.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setSummarizing(true);
    setSummaryError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Summarize the following note into concise bullet points.
Preserve the key facts, ideas, and important details.
Return only the summary.

NOTE:
${content}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize the note.");
      }

      const summary = data.reply;

      if (typeof summary !== "string" || !summary.trim()) {
        throw new Error("The AI returned an empty summary.");
      }

      const updatedContent = `${content.trim()}\n\n## AI Summary\n${summary.trim()}`;

      // Update the ref as well as React state so autosave stores the new content.
      latestValues.current.content = updatedContent;
      setContent(updatedContent);
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to summarize this note. Please try again.",
      );
    } finally {
      setSummarizing(false);
    }
  }

  // Ask the AI to improve the writing, but do not overwrite the original yet.
  async function handleImproveWriting() {
    if (!content.trim()) {
      setSummaryError("Write some content before improving it.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setImproving(true);
    setSummaryError("");
    setImprovedContent("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Improve the writing in the following note.
Correct grammar, spelling, and awkward sentences.
Improve clarity and readability while preserving the original meaning, facts, and important details.
Do not summarize the note.
Return only the improved text, without an introduction or explanation.

NOTE:
${content}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve the writing.");
      }

      const improvedText = data.reply;

      if (typeof improvedText !== "string" || !improvedText.trim()) {
        throw new Error("The AI returned empty text.");
      }

      // Show the improved version for review; the original stays untouched for now.
      setImprovedContent(improvedText.trim());
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to improve writing. Please try again.",
      );
    } finally {
      setImproving(false);
    }
  }

  // Expand short notes into more detailed content without changing the original immediately.
  async function handleExpandWriting() {
    if (!content.trim()) {
      setSummaryError("Write some content before expanding it.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setExpanding(true);
    setSummaryError("");
    setExpandedContent("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Expand the following note into more detailed, well-structured content.
Explain important ideas clearly and add helpful context where appropriate.
Preserve the original meaning and facts. Do not invent specific facts or pretend uncertain details are certain.
Do not summarize the note. Return only the expanded text, without an introduction or explanation.

NOTE:
${content}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to expand the note.");
      }

      const expandedText = data.reply;

      if (typeof expandedText !== "string" || !expandedText.trim()) {
        throw new Error("The AI returned empty text.");
      }

      // Keep the expanded draft separate until the user chooses to replace the original.
      setExpandedContent(expandedText.trim());
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to expand writing. Please try again.",
      );
    } finally {
      setExpanding(false);
    }
  }

  // Extract the most important ideas as concise bullet points for review.
  async function handleExtractKeyPoints() {
    if (!content.trim()) {
      setSummaryError("Write some content before extracting key points.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setExtractingKeyPoints(true);
    setSummaryError("");
    setKeyPointsContent("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Extract the most important key points from the following note.\nReturn concise, clear bullet points. Preserve important facts, names, dates, definitions, and figures.\nDo not add information that is not present in the note. Return only the bullet points, without an introduction.\n\nNOTE:\n${content}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract key points.");
      }

      const keyPoints = data.reply;
      if (typeof keyPoints !== "string" || !keyPoints.trim()) {
        throw new Error("The AI returned empty key points.");
      }

      setKeyPointsContent(keyPoints.trim());
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to extract key points. Please try again.",
      );
    } finally {
      setExtractingKeyPoints(false);
    }
  }

  // Replace the note with the accepted key points only after the user reviews them.
  function handleApplyKeyPoints() {
    const replacement = keyPointsContent.trim();
    if (!replacement) return;

    latestValues.current.content = replacement;
    setContent(replacement);
    setKeyPointsContent("");
    setSummaryError("");
  }


  // Generate revision questions from the note and let the user review them first.
  async function handleGenerateQuestions() {
    if (!content.trim()) {
      setSummaryError("Write some content before generating questions.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setGeneratingQuestions(true);
    setSummaryError("");
    setQuestionsContent("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Create 8 to 12 useful revision questions based only on the note below.
Include a mix of factual recall and conceptual understanding questions.
Do not include answers. Number the questions clearly. Do not ask questions about information absent from the note.
Return only the questions, without an introduction.

NOTE:
${content}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      const questions = data.reply;
      if (typeof questions !== "string" || !questions.trim()) {
        throw new Error("The AI returned no questions.");
      }

      setQuestionsContent(questions.trim());
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to generate questions. Please try again.",
      );
    } finally {
      setGeneratingQuestions(false);
    }
  }

  // Append accepted questions without deleting the original note content.
  function handleAddQuestionsToNote() {
    const questions = questionsContent.trim();
    if (!questions) return;

    const updatedContent = `${content.trim()}\n\n## Revision Questions\n${questions}`;
    latestValues.current.content = updatedContent;
    setContent(updatedContent);
    setQuestionsContent("");
    setSummaryError("");
  }

  // Generate question-and-answer flashcards from the note and review them before adding.
  async function handleGenerateFlashcards() {
    if (!content.trim()) {
      setSummaryError("Write some content before generating flashcards.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setGeneratingFlashcards(true);
    setSummaryError("");
    setFlashcardsContent("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Create 8 to 12 study flashcards based only on the note below.
For each flashcard, write a concise question on one line beginning with "Q:" and its accurate answer on the next line beginning with "A:". Separate each flashcard with a blank line.
Cover the most important facts and concepts. Do not add information that is absent from the note. Return only the flashcards, without an introduction.

NOTE:
${content}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards.");
      }

      const flashcards = data.reply;
      if (typeof flashcards !== "string" || !flashcards.trim()) {
        throw new Error("The AI returned no flashcards.");
      }

      setFlashcardsContent(flashcards.trim());
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to generate flashcards. Please try again.",
      );
    } finally {
      setGeneratingFlashcards(false);
    }
  }

  // Append accepted flashcards while preserving the original note content.
  function handleAddFlashcardsToNote() {
    const flashcards = flashcardsContent.trim();
    if (!flashcards) return;

    const updatedContent = `${content.trim()}\n\n## Flashcards\n${flashcards}`;
    latestValues.current.content = updatedContent;
    setContent(updatedContent);
    setFlashcardsContent("");
    setSummaryError("");
  }

  // Generate a continuation based on the current note and let the user review it first.
  async function handleContinueWriting() {
    if (!content.trim()) {
      setSummaryError("Write some content before continuing.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setContinuingWriting(true);
    setSummaryError("");
    setContinuedContent("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Continue the following note by writing the next paragraph or a few relevant paragraphs.
Continue naturally from the existing text and maintain its tone and topic.
Do not repeat or summarize the existing content.
Do not invent specific facts; if the note is factual, keep additions accurate and appropriately qualified.
Return only the new continuation text, without an introduction.

EXISTING NOTE:
${content}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to continue writing.");
      }

      const continuation = data.reply;
      if (typeof continuation !== "string" || !continuation.trim()) {
        throw new Error("The AI returned empty text.");
      }

      setContinuedContent(continuation.trim());
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to continue writing. Please try again.",
      );
    } finally {
      setContinuingWriting(false);
    }
  }

  // Append the accepted continuation to the existing note content.
  function handleApplyContinuation() {
    const continuation = continuedContent.trim();
    if (!continuation) return;

    const updatedContent = `${content.trim()}\n\n${continuation}`;
    latestValues.current.content = updatedContent;
    setContent(updatedContent);
    setContinuedContent("");
    setSummaryError("");
  }

  // Chat with the AI using the current note as context.
  async function handleSendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || chatLoading) return;

    if (!content.trim()) {
      setChatError("Add some content to this note before chatting with it.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards) {
      setChatError("Please wait for the current AI action to finish.");
      return;
    }

    const updatedMessages: ChatMessage[] = [...chatMessages, { role: "user", content: question }];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);
    setChatError("");

    try {
      const conversation = updatedMessages
        .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
        .join("\n\n");

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are an assistant helping a user understand their current note. Answer the user's latest question using the note as the primary source. Be clear, useful, and concise. If the note does not contain enough information, say so instead of inventing details. You may use general knowledge to explain concepts, but distinguish it from information stated in the note.\n\nNOTE TITLE:\n${title.trim() || "Untitled Note"}\n\nNOTE CONTENT:\n${content}\n\nCONVERSATION:\n${conversation}\n\nRespond to the latest user message.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get an AI response.");
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setChatMessages((previous) => [...previous, { role: "assistant", content: data.reply.trim() }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Unable to get an AI response. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }

  // Generate a title suggestion from the note without changing the current title automatically.
  async function handleGenerateTitle() {
    if (!content.trim()) {
      setSummaryError("Write some content before generating a title.");
      return;
    }

    if (summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading) return;

    setGeneratingTitle(true);
    setSummaryError("");
    setSuggestedTitle("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Suggest one clear, specific title for the following note.
Keep it concise (ideally 3–8 words).
Do not use quotation marks, a label, or an explanation.
Return only the title.

CURRENT TITLE:
${title.trim() || "Untitled Note"}

NOTE CONTENT:
${content}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate a title.");
      }

      const generatedTitle = data.reply;

      if (typeof generatedTitle !== "string" || !generatedTitle.trim()) {
        throw new Error("The AI returned an empty title.");
      }

      // Present the suggestion for review before applying it to the note.
      setSuggestedTitle(generatedTitle.trim().replace(/^["'“”]+|["'“”]+$/g, ""));
      setSummaryError("");
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Unable to generate a title. Please try again.",
      );
    } finally {
      setGeneratingTitle(false);
    }
  }

  // Apply the title only when the user accepts the AI suggestion.
  function handleApplySuggestedTitle() {
    const replacement = suggestedTitle.trim();
    if (!replacement) return;

    latestValues.current.title = replacement;
    setTitle(replacement);
    setSuggestedTitle("");
    setSummaryError("");
  }

  // Replace the original only after the user has reviewed the AI result.
  function handleReplaceOriginal() {
    const replacement = improvedContent.trim();
    if (!replacement) return;

    latestValues.current.content = replacement;
    setContent(replacement);
    setImprovedContent("");
    setSummaryError("");
  }

  // Apply the expanded draft only when the user accepts it.
  function handleReplaceWithExpanded() {
    const replacement = expandedContent.trim();
    if (!replacement) return;

    latestValues.current.content = replacement;
    setContent(replacement);
    setExpandedContent("");
    setSummaryError("");
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note? This action cannot be undone.",
    );

    if (!confirmed) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    initialized.current = false;
    deleteNote(id);
    router.push("/notes");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading note...</p>
      </main>
    );
  }

  if (!note) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-center text-foreground">
        <FiFileText size={36} className="text-muted-foreground" />
        <h1 className="text-xl font-semibold">Note not found</h1>
        <p className="text-sm text-muted-foreground">
          This note may have been deleted or does not exist.
        </p>
        <Link
          href="/notes"
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Back to notes
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/notes"
            aria-label="Back to notes"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border transition hover:bg-muted"
          >
            <FiArrowLeft size={18} />
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <FiFileText size={17} className="shrink-0 text-emerald-500" />
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              maxLength={200}
              aria-label="Note title"
              placeholder="Untitled Note"
              className="w-full min-w-0 bg-transparent text-sm font-semibold outline-none sm:text-base"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            aria-live="polite"
            className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
          >
            {saveStatus === "saving" ? (
              <FiLoader size={14} className="animate-spin" />
            ) : (
              <FiCheck
                size={14}
                className={saveStatus === "saved" ? "text-emerald-500" : ""}
              />
            )}

            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved locally"
                : "Unsaved changes"}
          </span>

          <button
            type="button"
            onClick={handleManualSave}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 sm:text-sm"
          >
            <FiCheck size={15} />
            Save
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete note"
            title="Delete note"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
          >
            <FiTrash2 size={17} />
          </button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-500">
            ThinkBoard AI / Notes
          </p>

          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {title.trim() || "Untitled Note"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your ideas are saved automatically as you write.
          </p>
        </div>

        {/* AI tools for summarizing, improving, expanding, or titling the note. */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {summarizing ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {summarizing ? "Summarizing..." : "Summarize with AI"}
          </button>

          <button
            type="button"
            onClick={handleImproveWriting}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {improving ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {improving ? "Improving..." : "Improve Writing"}
          </button>

          <button
            type="button"
            onClick={handleExpandWriting}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {expanding ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {expanding ? "Expanding..." : "Expand Writing"}
          </button>

          <button
            type="button"
            onClick={handleGenerateTitle}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingTitle ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {generatingTitle ? "Generating title..." : "Generate Title"}
          </button>

          <button
            type="button"
            onClick={handleContinueWriting}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {continuingWriting ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {continuingWriting ? "Continuing..." : "Continue Writing"}
          </button>

          <button
            type="button"
            onClick={handleExtractKeyPoints}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {extractingKeyPoints ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {extractingKeyPoints ? "Extracting key points..." : "Extract Key Points"}
          </button>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingQuestions ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {generatingQuestions ? "Generating questions..." : "Generate Questions"}
          </button>

          <button
            type="button"
            onClick={handleGenerateFlashcards}
            disabled={summarizing || improving || expanding || generatingTitle || continuingWriting || extractingKeyPoints || generatingQuestions || generatingFlashcards || chatLoading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingFlashcards ? (
              <FiLoader size={16} className="animate-spin" />
            ) : (
              <FiZap size={16} />
            )}
            {generatingFlashcards ? "Generating flashcards..." : "Generate Flashcards"}
          </button>

          {summaryError && (
            <p role="alert" className="text-sm text-destructive">
              {summaryError}
            </p>
          )}
        </div>

        {/* Ask questions about the current note without changing its content. */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
            <FiMessageSquare size={18} className="text-emerald-500" />
            <div>
              <h2 className="font-semibold">AI Chat with Notes</h2>
              <p className="text-xs text-muted-foreground">Ask questions about this note.</p>
            </div>
            {chatMessages.length > 0 && (
              <button
                type="button"
                onClick={() => { setChatMessages([]); setChatError(""); }}
                className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Clear chat
              </button>
            )}
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {chatMessages.length === 0 ? (
              <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Try asking: “Explain this note in simple English” or “What are the key concepts?”
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${message.role === "user" ? "bg-emerald-500 text-white" : "bg-muted text-foreground"}`}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">{message.role === "user" ? "You" : "ThinkBoard AI"}</p>
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FiLoader size={15} className="animate-spin" />
                Thinking about your note...
              </div>
            )}
          </div>

          {chatError && <p role="alert" className="px-4 pb-2 text-sm text-destructive sm:px-5">{chatError}</p>}

          <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-border p-3 sm:p-4">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask something about this note..."
              aria-label="Ask AI about this note"
              maxLength={2000}
              disabled={chatLoading || !content.trim()}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim() || !content.trim()}
              aria-label="Send message"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              {chatLoading ? <FiLoader size={16} className="animate-spin" /> : <FiSend size={16} />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </section>

        {/* Review the suggested title separately before applying it. */}
        {suggestedTitle && (
          <div className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">AI Title Suggestion</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit the suggestion if needed, then apply it to your note.
              </p>
            </div>

            <input
              value={suggestedTitle}
              onChange={(event) => setSuggestedTitle(event.target.value)}
              maxLength={200}
              aria-label="AI suggested note title"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApplySuggestedTitle}
                disabled={!suggestedTitle.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Title
              </button>

              <button
                type="button"
                onClick={() => setSuggestedTitle("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Review the continuation; append it only when the user accepts it. */}
        {continuedContent && (
          <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Continue Writing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review or edit the suggested continuation before adding it to your note.
              </p>
            </div>

            <textarea
              value={continuedContent}
              onChange={(event) => setContinuedContent(event.target.value)}
              rows={6}
              aria-label="AI writing continuation"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-7 outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApplyContinuation}
                disabled={!continuedContent.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Note
              </button>

              <button
                type="button"
                onClick={() => setContinuedContent("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Review the extracted bullet points before replacing the note content. */}
        {keyPointsContent && (
          <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Extracted Key Points</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review or edit these points. Applying them will replace the note content.
              </p>
            </div>

            <textarea
              value={keyPointsContent}
              onChange={(event) => setKeyPointsContent(event.target.value)}
              rows={8}
              aria-label="AI extracted key points"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-7 outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApplyKeyPoints}
                disabled={!keyPointsContent.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace with Key Points
              </button>

              <button
                type="button"
                onClick={() => setKeyPointsContent("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Review and edit generated questions before adding them to the note. */}
        {questionsContent && (
          <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">AI-Generated Questions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review or edit these revision questions. Adding them will preserve your existing note content.
              </p>
            </div>

            <textarea
              value={questionsContent}
              onChange={(event) => setQuestionsContent(event.target.value)}
              rows={8}
              aria-label="AI-generated revision questions"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-7 outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddQuestionsToNote}
                disabled={!questionsContent.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Questions to Note
              </button>

              <button
                type="button"
                onClick={() => setQuestionsContent("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Review and edit generated flashcards before adding them to the note. */}
        {flashcardsContent && (
          <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">AI-Generated Flashcards</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review or edit the questions and answers. Adding them will preserve your existing note content.
              </p>
            </div>

            <textarea
              value={flashcardsContent}
              onChange={(event) => setFlashcardsContent(event.target.value)}
              rows={10}
              aria-label="AI-generated flashcards"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-7 outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddFlashcardsToNote}
                disabled={!flashcardsContent.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Flashcards to Note
              </button>

              <button
                type="button"
                onClick={() => setFlashcardsContent("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Main note editor. */}
        <textarea
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          placeholder="Start writing your thoughts here..."
          aria-label="Note content"
          className="min-h-[50vh] w-full flex-1 resize-y rounded-2xl border border-border bg-card p-5 text-sm leading-7 outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald-500 sm:p-7 sm:text-base"
        />

        {/* Review panel: AI text stays separate until the user accepts it. */}
        {improvedContent && (
          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Improved Writing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review or edit the suggestion before replacing your original note.
              </p>
            </div>

            <textarea
              value={improvedContent}
              onChange={(event) => setImprovedContent(event.target.value)}
              rows={8}
              aria-label="AI improved note text"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-7 outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReplaceOriginal}
                disabled={!improvedContent.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace Original
              </button>

              <button
                type="button"
                onClick={() => setImprovedContent("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Review the expanded draft separately before applying it to the note. */}
        {expandedContent && (
          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Expanded Writing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review or edit the expanded version before replacing your original note.
              </p>
            </div>

            <textarea
              value={expandedContent}
              onChange={(event) => setExpandedContent(event.target.value)}
              rows={8}
              aria-label="AI expanded note text"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-7 outline-none transition focus:border-emerald-500"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReplaceWithExpanded}
                disabled={!expandedContent.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace Original
              </button>

              <button
                type="button"
                onClick={() => setExpandedContent("")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Changes are saved locally after you stop typing for a short time.
        </p>
      </section>
    </main>
  );
}
