"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiLayers,
  FiFileText,
  FiFolder,
  FiMessageSquare,
  FiSettings,
  FiPlus,
  FiChevronLeft,
} from "react-icons/fi";

const navigation = [
  { label: "Dashboard", href: "/", icon: FiGrid },
  { label: "Whiteboards", href: "/whiteboards", icon: FiLayers },
  { label: "My Notes", href: "/notes", icon: FiFileText },
  { label: "Documents", href: "/documents", icon: FiFolder },
  { label: "AI Assistant", href: "/assistant", icon: FiMessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background p-4">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">
          T
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            ThinkBoard <span className="text-emerald-500">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Your intelligent workspace
          </p>
        </div>
      </div>

      <Link
        href="/whiteboards/new"
        className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        <FiPlus size={17} />
        Create workspace
      </Link>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
      </p>

      <nav className="space-y-1">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <FiSettings size={18} />
          Settings
        </Link>

        <div className="mt-4 flex items-center gap-3 border-t border-border px-2 pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold">
            U
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Your Workspace</p>
            <p className="text-xs text-muted-foreground">Free plan</p>
          </div>
          <FiChevronLeft className="rotate-180 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}