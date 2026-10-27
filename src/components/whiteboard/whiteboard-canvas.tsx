"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

type WhiteboardCanvasProps = {
  id: string;
};

export function WhiteboardCanvas({ id }: WhiteboardCanvasProps) {
  return (
    <div className="h-full w-full">
      <Tldraw persistenceKey={`thinkboard-ai-${id}`} />
    </div>
  );
}