import { FaceDetector } from "@mediapipe/tasks-vision";
import type { Detection } from "./types";
import { modelManager } from "./model-manager";

export async function detectFaces(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
  confidenceThreshold = 0.5,
): Promise<Detection[]> {
  const detector = (await modelManager.loadModel("face_detector")) as FaceDetector;
  const result = detector.detect(input);
  if (!result.detections) return [];

  return result.detections.map((d) => ({
    boundingBox: {
      originX: d.boundingBox?.originX ?? 0,
      originY: d.boundingBox?.originY ?? 0,
      width: d.boundingBox?.width ?? 0,
      height: d.boundingBox?.height ?? 0,
    },
    keypoints: (d.keypoints ?? []).map((kp) => ({
      x: kp.x,
      y: kp.y,
    })),
    score: d.categories?.[0]?.score ?? 0,
  })).filter((d) => d.score >= confidenceThreshold);
}
