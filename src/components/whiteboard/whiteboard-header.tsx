"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { updateWhiteboardTitle } from "@/lib/whiteboards";
import { FiArrowLeft, FiCheck, FiEdit2 } from "react-icons/fi";

type WhiteboardHeaderProps = {
  id: string;
};

export function WhiteboardHeaderClient({ id }: WhiteboardHeaderProps) {
  const storageKey = `thinkboard-ai-title-${id}`;
  const [title, setTitle] = useState("Untitled Whiteboard");
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

useEffect(() => {
  const storedTitle = localStorage.getItem(storageKey);
  const initialTitle = storedTitle || "Untitled Whiteboard";

  setTitle(initialTitle);
  updateWhiteboardTitle(id, initialTitle);

  setMounted(true);
  setSaved(true);
}, [id, storageKey]);

// Handle title change
function handleTitleChange(value: string) {
  setTitle(value);
  setSaved(false);

  localStorage.setItem(storageKey, value);
  updateWhiteboardTitle(id, value);

  setSaved(true);
}
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border transition hover:bg-muted"
        >
          <FiArrowLeft size={18} />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FiEdit2 className="shrink-0 text-emerald-500" size={14} />
            <input
              value={mounted ? title : ""}
              onChange={(event) => handleTitleChange(event.target.value)}
              aria-label="Whiteboard title"
              placeholder="Untitled Whiteboard"
              className="w-full min-w-0 max-w-md bg-transparent text-sm font-semibold outline-none sm:text-base"
            />
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <FiCheck className="text-emerald-500" size={13} />
            {saved ? "Title saved locally" : "Saving title..."}
          </p>
        </div>
      </div>

      <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Whiteboard
      </span>
    </header>
  );
}