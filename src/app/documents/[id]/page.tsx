
import { Suspense } from "react";
import DocumentEditorClient from "./document-editor-client";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

function DocumentLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">
        Loading document...
      </p>
    </main>
  );
}

export default function DocumentPage({ params }: DocumentPageProps) {
  return (
    <Suspense fallback={<DocumentLoading />}>
      <DocumentRoute params={params} />
    </Suspense>
  );
}

async function DocumentRoute({ params }: DocumentPageProps) {
  const { id } = await params;

  return <DocumentEditorClient id={id} />;
}
