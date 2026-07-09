import { ObjectDetector } from "@mediapipe/tasks-vision";
import type { ObjectDetection } from "./types";
import { modelManager } from "./model-manager";

export async function detectObjects(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
  confidenceThreshold = 0.5,
): Promise<ObjectDetection[]> {
  const detector = (await modelManager.loadModel("object_detector")) as ObjectDetector;
  const result = detector.detect(input);
  if (!result.detections) return [];

  return result.detections.map((d) => ({
    boundingBox: {
      originX: d.boundingBox?.originX ?? 0,
      originY: d.boundingBox?.originY ?? 0,
      width: d.boundingBox?.width ?? 0,
      height: d.boundingBox?.height ?? 0,
    },
    categoryName: d.categories?.[0]?.categoryName ?? "unknown",
    score: d.categories?.[0]?.score ?? 0,
  })).filter((d) => d.score >= confidenceThreshold);
}
