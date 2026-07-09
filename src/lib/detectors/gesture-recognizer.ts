import { GestureRecognizer } from "@mediapipe/tasks-vision";
import type { GestureResult } from "./types";
import { modelManager } from "./model-manager";

function getLandmarks(result: unknown, index: number) {
  const r = result as { landmarks?: Array<Array<{ x: number; y: number; z: number }>> };
  return r.landmarks?.[index] ?? [];
}

export async function recognizeGestures(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
): Promise<GestureResult[]> {
  const recognizer = (await modelManager.loadModel("gesture_recognizer")) as GestureRecognizer;
  const result = recognizer.recognize(input);
  if (!result.gestures || result.gestures.length === 0) return [];

  const gestures: GestureResult[] = [];
  for (let i = 0; i < result.gestures.length; i++) {
    const gestureList = result.gestures[i];
    const top = gestureList[0];
    if (!top) continue;

    const raw = getLandmarks(result, i);
    const handLandmarks = raw.map((lm) => [lm.x, lm.y, lm.z] as unknown as number[]);

    let handedness = "Unknown";
    if (result.handedness?.[i]?.[0]) {
      handedness = result.handedness[i][0].categoryName ?? "Unknown";
    }

    gestures.push({
      gestureName: top.categoryName ?? "unknown",
      score: top.score,
      handLandmarks,
      handedness,
    });
  }

  return gestures;
}
