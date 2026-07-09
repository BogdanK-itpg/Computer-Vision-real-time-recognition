"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface AnnotatedImageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  filename?: string;
}

export function AnnotatedImage({
  canvasRef,
  filename = "annotated-image.png",
}: AnnotatedImageProps) {
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [canvasRef, filename]);

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto rounded-lg border border-gray-200"
      />
      <Button variant="outline" size="sm" onClick={handleDownload}>
        Download Annotated
      </Button>
    </div>
  );
}
