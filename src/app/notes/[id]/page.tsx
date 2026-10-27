
import { Suspense } from "react";
import NoteEditorClient from "./note-editor-client";

type NotePageProps = {
  params: Promise<{ id: string }>;
};

function NoteLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Loading note...</p>
    </main>
  );
}

export default function NotePage({ params }: NotePageProps) {
  return (
    <Suspense fallback={<NoteLoading />}>
      <NoteRoute params={params} />
    </Suspense>
  );
}

async function NoteRoute({ params }: NotePageProps) {
  const { id } = await params;

  return <NoteEditorClient id={id} />;
}
