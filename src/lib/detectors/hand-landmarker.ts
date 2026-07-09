import { HandLandmarker } from "@mediapipe/tasks-vision";
import type { HandLandmarksResult } from "./types";
import { modelManager } from "./model-manager";

function getLandmarks(
  result: unknown,
): Array<Array<{ x: number; y: number; z: number }>> {
  const r = result as { landmarks?: Array<Array<{ x: number; y: number; z: number }>> };
  return r.landmarks ?? [];
}

export async function detectHandLandmarks(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
): Promise<HandLandmarksResult | null> {
  const landmarker = (await modelManager.loadModel("hand_landmarker")) as HandLandmarker;
  const result = landmarker.detect(input);
  const rawLandmarks = getLandmarks(result);
  if (rawLandmarks.length === 0) return null;

  const handLandmarks = rawLandmarks.map((hand) =>
    hand.map((lm) => [lm.x, lm.y, lm.z] as unknown as number[])
  );

  const handedness: string[] = [];
  const handednessScores: number[] = [];
  if (result.handedness) {
    for (const list of result.handedness) {
      const top = list[0];
      if (top) {
        handedness.push(top.categoryName ?? top.displayName ?? "Unknown");
        handednessScores.push(top.score);
      }
    }
  }

  return { handLandmarks, handedness, handednessScores };
}
