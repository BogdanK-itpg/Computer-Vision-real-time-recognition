import { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseLandmarksResult } from "./types";
import { modelManager } from "./model-manager";

function getLandmarks(
  result: unknown,
): Array<Array<{ x: number; y: number; z: number }>> {
  const r = result as { landmarks?: Array<Array<{ x: number; y: number; z: number }>> };
  return r.landmarks ?? [];
}

export async function detectPoseLandmarks(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
): Promise<PoseLandmarksResult | null> {
  const landmarker = (await modelManager.loadModel("pose_landmarker")) as PoseLandmarker;
  const result = landmarker.detect(input);
  const rawLandmarks = getLandmarks(result);
  if (rawLandmarks.length === 0) return null;

  const poseLandmarks = rawLandmarks.map((pose) =>
    pose.map((lm) => [lm.x, lm.y, lm.z] as unknown as number[])
  );

  return { poseLandmarks };
}
