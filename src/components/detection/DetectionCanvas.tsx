"use client";

import { useRef, useEffect, useCallback } from "react";
import type { DetectionResults } from "@/lib/detectors/types";
import {
  clearCanvas,
  renderFaceDetections,
  renderFaceLandmarks,
  renderHandLandmarks,
  renderPoseLandmarks,
  renderObjectDetections,
  renderGestures,
} from "@/lib/utils/canvas";

interface DetectionCanvasProps {
  imageData: ImageData | null;
  results: DetectionResults | null;
  width: number;
  height: number;
  showOverlay?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function DetectionCanvas({
  imageData,
  results,
  width,
  height,
  showOverlay = true,
  canvasRef: externalRef,
}: DetectionCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalRef ?? internalRef;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearCanvas(ctx, width, height);

    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }

    if (!results || !showOverlay) return;

    if (results.faceDetections) {
      renderFaceDetections(ctx, results.faceDetections);
    }
    if (results.faceLandmarks) {
      renderFaceLandmarks(ctx, results.faceLandmarks);
    }
    if (results.handLandmarks) {
      renderHandLandmarks(ctx, results.handLandmarks);
    }
    if (results.poseLandmarks) {
      renderPoseLandmarks(ctx, results.poseLandmarks);
    }
    if (results.objectDetections) {
      renderObjectDetections(ctx, results.objectDetections);
    }
    if (results.gestures) {
      renderGestures(ctx, results.gestures);
    }
  }, [imageData, results, width, height, showOverlay]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="max-w-full h-auto rounded-lg border border-gray-200"
    />
  );
}
