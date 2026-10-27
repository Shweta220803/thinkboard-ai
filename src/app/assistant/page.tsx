
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  FiArrowLeft,
  FiArrowUp,
  FiCheck,
  FiEdit2,
  FiMenu,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  renameConversation,
  saveConversationMessages,
  type ChatMessage,
  type Conversation,
} from "@/lib/conversations";

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const refreshConversations = useCallback(() => {
    setConversations(getConversations());
  }, []);

  useEffect(() => {
    refreshConversations();

    const storedConversations = getConversations();

    if (storedConversations.length > 0) {
      const first = storedConversations[0];
      setActiveId(first.id);
      activeIdRef.current = first.id;
      setMessages(first.messages);
      messagesRef.current = first.messages;
    }

    setLoaded(true);
  }, [refreshConversations]);

  const openConversation = useCallback((id: string) => {
    if (loadingRef.current) return;

    const conversation = getConversation(id);
    if (!conversation) return;

    setActiveId(id);
    activeIdRef.current = id;
    setMessages(conversation.messages);
    messagesRef.current = conversation.messages;
    setInput("");
    setError("");
    setSidebarOpen(false);
  }, []);

  function handleNewChat() {
    if (loadingRef.current) return;

    const id = createConversation();
    const updated = getConversation(id);

    setActiveId(id);
    activeIdRef.current = id;
    setMessages([]);
    messagesRef.current = [];
    setInput("");
    setError("");

    if (updated) {
      setConversations((previous) => [updated, ...previous]);
    }

    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  function handleRename(id: string) {
    const conversation = getConversation(id);
    if (!conversation) return;

    const newTitle = window.prompt(
      "Enter a new conversation title:",
      conversation.title,
    );

    if (newTitle === null) return;

    renameConversation(id, newTitle);
    refreshConversations();
  }

  function handleDelete(id: string) {
    if (loadingRef.current) return;

    const conversation = getConversation(id);
    if (!conversation) return;

    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    deleteConversation(id);

    const remaining = getConversations();
    setConversations(remaining);

    if (activeIdRef.current === id) {
      const next = remaining[0];

      if (next) {
        openConversation(next.id);
      } else {
        setActiveId(null);
        activeIdRef.current = null;
        setMessages([]);
        messagesRef.current = [];
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || loadingRef.current) return;

    let conversationId = activeIdRef.current;

    if (!conversationId || !getConversation(conversationId)) {
      conversationId = createConversation();
      activeIdRef.current = conversationId;
      setActiveId(conversationId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const updatedMessages = [...messagesRef.current, userMessage];
    console.log(
  "Frontend conversation history:",
  updatedMessages.map(({ role, content }) => ({ role, content })),
);

    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    saveConversationMessages(conversationId, updatedMessages);
    refreshConversations();

    setInput("");
    setError("");
    loadingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  messages: updatedMessages.map(({ role, content }) => ({
    role,
    content,
  })),
}),      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get an AI response.");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      };

      const finalMessages = [...messagesRef.current, assistantMessage];

      messagesRef.current = finalMessages;
      setMessages(finalMessages);

      const currentId = activeIdRef.current;
      if (currentId) {
        saveConversationMessages(currentId, finalMessages);
      }

      refreshConversations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      loadingRef.current = false;
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeId,
  );

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">
          Loading conversations...
        </p>
      </main>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-card md:relative">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2 font-semibold">
              <HiOutlineSparkles className="text-emerald-500" size={23} />
              ThinkBoard AI
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="rounded-lg p-2 hover:bg-muted md:hidden"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={handleNewChat}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              <FiPlus size={17} />
              New conversation
            </button>
          </div>

          <div className="px-4 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent conversations
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
            {conversations.length === 0 ? (
              <p className="px-3 py-5 text-sm text-muted-foreground">
                Your conversations will appear here.
              </p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-1 rounded-xl ${
                    activeId === conversation.id
                      ? "bg-muted"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                  >
                    <FiMessageSquare
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate text-sm">
                      {conversation.title}
                    </span>
                  </button>

                  <div className="flex pr-1">
                    <button
                      type="button"
                      onClick={() => handleRename(conversation.id)}
                      title="Rename conversation"
                      aria-label={`Rename ${conversation.title}`}
                      className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <FiEdit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(conversation.id)}
                      title="Delete conversation"
                      aria-label={`Delete ${conversation.title}`}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border p-4 text-xs text-muted-foreground">
            Conversations are saved in this browser.
          </div>
        </aside>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              className="rounded-lg p-2 hover:bg-muted"
            >
              {sidebarOpen ? (
                <FiArrowLeft size={18} />
              ) : (
                <FiMenu size={19} />
              )}
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">
                {activeConversation?.title || "AI Assistant"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Powered by Gemini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <FiPlus size={16} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
            {messages.length === 0 && (
              <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <HiOutlineSparkles size={32} />
                </div>

                <h2 className="text-2xl font-semibold">
                  What can I help you with?
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Ask questions, explore ideas, or get help with your
                  workspace.
                </p>

                <div className="mt-7 grid w-full max-w-xl gap-3 sm:grid-cols-2">
                  {[
                    "Explain React hooks with examples",
                    "Help me plan a software project",
                    "Explain a technical concept",
                    "Create a daily learning plan",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-xl border border-border p-4 text-left text-sm transition hover:border-emerald-500/50 hover:bg-muted"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    message.role === "assistant"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <HiOutlineSparkles size={20} />
                  ) : (
                    <FiUser size={18} />
                  )}
                </div>

                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 ${
                    message.role === "user"
                      ? "bg-emerald-500 text-white"
                      : "border border-border bg-card"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <HiOutlineSparkles className="text-emerald-500" size={21} />
                Gemini is thinking...
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background p-4 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-3 shadow-sm"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Message ThinkBoard AI..."
              rows={2}
              maxLength={10000}
              disabled={loading}
              className="max-h-40 min-h-14 w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />

            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Enter to send · Shift + Enter for a new line
              </p>

              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiArrowUp size={19} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
