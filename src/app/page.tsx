"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWhiteboardId } from "@/lib/whiteboards";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FiSearch,
  FiPlus,
  FiArrowUpRight,
  FiLayers,
  FiFileText,
  FiMessageSquare,
  FiClock,
  FiMoreHorizontal,
} from "react-icons/fi";

const workspaces = [
  {
    title: "AI Project Research",
    description: "Research ideas, references, and project planning.",
    type: "Whiteboard",
    icon: FiLayers,
    updated: "Updated recently",
  },
  {
    title: "Learning Notes",
    description: "A collection of learning notes and key concepts.",
    type: "Notes",
    icon: FiFileText,
    updated: "Updated recently",
  },
  {
    title: "AI Product Ideas",
    description: "Explore and organize new product concepts.",
    type: "Whiteboard",
    icon: FiLayers,
    updated: "Updated recently",
  },
];


export default function Home() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Handle create whiteboard
const handleCreateWhiteboard = () => {
  const id = createWhiteboardId();
  router.push(`/whiteboards/${id}`);
};


  const filteredWorkspaces = workspaces.filter((workspace) =>
    `${workspace.title} ${workspace.description} ${workspace.type}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1">
        <header className="flex flex-col gap-5 border-b border-border px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">
              Your personal knowledge space
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Good morning, <span className="text-emerald-500">Creator.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 sm:w-64 sm:flex-none">
              <FiSearch className="shrink-0 text-muted-foreground" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workspaces..."
                aria-label="Search workspaces"
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-10 px-5 py-8 sm:px-8 sm:py-10">
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Create something new</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with an idea. Let ThinkBoard AI help you develop it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={handleCreateWhiteboard}       
                className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-emerald-500/60 hover:shadow-lg"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FiLayers size={21} />
                  </div>
                  <FiArrowUpRight className="text-muted-foreground transition group-hover:text-emerald-500" size={20} />
                </div>
                <h3 className="font-semibold">New whiteboard</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Map ideas, connect concepts, and visualize your thinking.
                </p>
              </button>

              <button
                type="button"
                onClick={() => alert("Note creation will be added next.")}
                className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-emerald-500/60 hover:shadow-lg"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                    <FiFileText size={21} />
                  </div>
                  <FiArrowUpRight className="text-muted-foreground transition group-hover:text-emerald-500" size={20} />
                </div>
                <h3 className="font-semibold">New note</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Capture thoughts, write notes, and organize your knowledge.
                </p>
              </button>

              <button
                type="button"
                onClick={() => alert("AI assistant will be added later.")}
                className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-emerald-500/60 hover:shadow-lg sm:col-span-2 xl:col-span-1"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                    <FiMessageSquare size={21} />
                  </div>
                  <FiArrowUpRight className="text-muted-foreground transition group-hover:text-emerald-500" size={20} />
                </div>
                <h3 className="font-semibold">Ask AI</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Brainstorm ideas, summarize information, and explore concepts.
                </p>
              </button>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Recent workspaces</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick up where you left off.
                </p>
              </div>

              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted"
                onClick={() => alert("Workspace creation will be added next.")}
              >
                <FiPlus size={16} />
                <span className="hidden sm:inline">New workspace</span>
              </button>
            </div>

            {filteredWorkspaces.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredWorkspaces.map((workspace) => {
                  const Icon = workspace.icon;

                  return (
                    <article
                      key={workspace.title}
                      className="rounded-2xl border border-border bg-card p-5 transition hover:border-emerald-500/40"
                    >
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                          <Icon size={20} />
                        </div>
                        <button
                          type="button"
                          aria-label={`More options for ${workspace.title}`}
                          title="More options"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                          onClick={() => alert("Workspace options will be added later.")}
                        >
                          <FiMoreHorizontal size={20} />
                        </button>
                      </div>

                      <h3 className="font-semibold">{workspace.title}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                        {workspace.description}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {workspace.type}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FiClock size={13} />
                          {workspace.updated}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                <FiSearch className="mx-auto mb-3 text-muted-foreground" size={24} />
                <h3 className="font-medium">No workspaces found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another search term.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}