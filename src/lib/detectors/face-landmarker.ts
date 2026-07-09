import { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FaceLandmarksResult } from "./types";
import { modelManager } from "./model-manager";

function getLandmarks(
  result: unknown,
): Array<Array<{ x: number; y: number; z: number }>> {
  const r = result as { faceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> };
  return r.faceLandmarks ?? [];
}

export async function detectFaceLandmarks(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
): Promise<FaceLandmarksResult | null> {
  const landmarker = (await modelManager.loadModel("face_landmarker")) as FaceLandmarker;
  const result = landmarker.detect(input);
  const rawLandmarks = getLandmarks(result);
  if (rawLandmarks.length === 0) return null;

  const faceLandmarks = rawLandmarks.map((face) =>
    face.map((lm) => [lm.x, lm.y, lm.z] as unknown as number[])
  );

  let blendShapes: Record<string, number>[] | undefined;
  const r = result as unknown as { faceBlendshapes?: Array<{ categories: Array<{ categoryName?: string; displayName?: string; score: number }> }> };
  if (r.faceBlendshapes && r.faceBlendshapes.length > 0) {
    blendShapes = r.faceBlendshapes.map((bsList) => {
      const dict: Record<string, number> = {};
      for (const cat of bsList.categories) {
        dict[cat.categoryName ?? cat.displayName ?? ""] = cat.score;
      }
      return dict;
    });
  }

  return { faceLandmarks, blendShapes };
}
