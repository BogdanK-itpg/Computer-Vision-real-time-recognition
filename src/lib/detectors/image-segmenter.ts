import { ImageSegmenter } from "@mediapipe/tasks-vision";
import type { SegmentationResult } from "./types";
import { modelManager } from "./model-manager";

function convertMaskToImageData(mask: {
  width: number;
  height: number;
  getAsFloat32Array(): Float32Array;
}): ImageData {
  const floatData = mask.getAsFloat32Array();
  const uint8Data = new Uint8ClampedArray(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    uint8Data[i] = Math.round(floatData[i] * 255);
  }
  return new ImageData(uint8Data, mask.width, mask.height);
}

export async function segmentImage(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
): Promise<SegmentationResult | null> {
  const segmenter = (await modelManager.loadModel("image_segmenter")) as ImageSegmenter;
  const result = segmenter.segment(input);
  if (!result.confidenceMasks || result.confidenceMasks.length === 0) return null;

  const confidenceMasks: ImageData[] = [];
  for (const mask of result.confidenceMasks) {
    confidenceMasks.push(convertMaskToImageData(mask));
  }

  return { confidenceMasks };
}
