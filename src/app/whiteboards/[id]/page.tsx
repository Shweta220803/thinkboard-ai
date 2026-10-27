import { Suspense } from "react";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import { WhiteboardHeaderClient } from "@/components/whiteboard/whiteboard-header";

type WhiteboardPageProps = {
  params: Promise<{ id: string }>;
};

function WhiteboardLoading() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading whiteboard...
    </div>
  );
}

export default function WhiteboardPage({ params }: WhiteboardPageProps) {
  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      <Suspense fallback={<WhiteboardLoading />}>
        <WhiteboardRoute params={params} />
      </Suspense>
    </main>
  );
}

async function WhiteboardRoute({ params }: WhiteboardPageProps) {
  const { id } = await params;

  return (
    <>
      <WhiteboardHeaderClient id={id} />
      <section className="min-h-0 flex-1">
        <WhiteboardCanvas id={id} />
      </section>
    </>
  );
}