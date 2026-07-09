import {
  FaceDetector,
  FaceLandmarker,
  HandLandmarker,
  PoseLandmarker,
  ObjectDetector,
  ImageSegmenter,
  GestureRecognizer,
  type FaceDetectorOptions,
  type FaceLandmarkerOptions,
  type HandLandmarkerOptions,
  type PoseLandmarkerOptions,
  type ObjectDetectorOptions,
  type ImageSegmenterOptions,
  type GestureRecognizerOptions,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import type { ModelEntry } from "@/lib/config";
import { MODEL_REGISTRY } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

class ModelManager {
  private wasmInitialized = false;
  private wasmFileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null = null;
  private loadedModels: Map<string, { entry: ModelEntry; instance: unknown; loadedAt: number }> = new Map();
  private loadPromises: Map<string, Promise<unknown>> = new Map();

  async initializeWasm(): Promise<Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>> {
    if (this.wasmFileset) return this.wasmFileset;
    const basePath = process.env.NEXT_PUBLIC_MODEL_CDN_BASE
      || "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/";
    this.wasmFileset = await FilesetResolver.forVisionTasks(basePath);
    this.wasmInitialized = true;
    logger.info("ModelManager", "WASM runtime initialized");
    return this.wasmFileset;
  }

  isWasmInitialized(): boolean {
    return this.wasmInitialized;
  }

  async loadModel(type: string): Promise<unknown> {
    const existing = this.loadedModels.get(type);
    if (existing) return existing.instance;

    const pending = this.loadPromises.get(type);
    if (pending) return pending;

    const promise = this.loadModelInternal(type);
    this.loadPromises.set(type, promise);
    const instance = await promise;
    this.loadPromises.delete(type);
    return instance;
  }

  private async loadModelInternal(type: string): Promise<unknown> {
    const wasmFileset = await this.initializeWasm();

    const entry = MODEL_REGISTRY[type];
    if (!entry) throw new Error(`No model registry entry for: ${type}`);

    const baseOptions = { modelAssetPath: entry.url };
    let instance: unknown;

    switch (type) {
      case "face_detector": {
        const options: FaceDetectorOptions = {
          baseOptions,
          runningMode: "IMAGE",
          minDetectionConfidence: 0.5,
        };
        instance = await FaceDetector.createFromOptions(wasmFileset, options);
        break;
      }
      case "face_landmarker": {
        const options: FaceLandmarkerOptions = {
          baseOptions,
          runningMode: "IMAGE",
          numFaces: 5,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          outputFaceBlendshapes: false,
        };
        instance = await FaceLandmarker.createFromOptions(wasmFileset, options);
        break;
      }
      case "hand_landmarker": {
        const options: HandLandmarkerOptions = {
          baseOptions,
          runningMode: "IMAGE",
          numHands: 5,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
        };
        instance = await HandLandmarker.createFromOptions(wasmFileset, options);
        break;
      }
      case "pose_landmarker": {
        const options: PoseLandmarkerOptions = {
          baseOptions,
          runningMode: "IMAGE",
          numPoses: 5,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          outputSegmentationMasks: false,
        };
        instance = await PoseLandmarker.createFromOptions(wasmFileset, options);
        break;
      }
      case "object_detector": {
        const options: ObjectDetectorOptions = {
          baseOptions,
          runningMode: "IMAGE",
          scoreThreshold: 0.5,
          maxResults: 5,
        };
        instance = await ObjectDetector.createFromOptions(wasmFileset, options);
        break;
      }
      case "image_segmenter": {
        const options: ImageSegmenterOptions = {
          baseOptions,
          runningMode: "IMAGE",
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        };
        instance = await ImageSegmenter.createFromOptions(wasmFileset, options);
        break;
      }
      case "gesture_recognizer": {
        const options: GestureRecognizerOptions = {
          baseOptions,
          runningMode: "IMAGE",
          numHands: 5,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          cannedGesturesClassifierOptions: {
            scoreThreshold: 0.5,
            maxResults: 1,
          },
        };
        instance = await GestureRecognizer.createFromOptions(wasmFileset, options);
        break;
      }
      default:
        throw new Error(`Unknown detector type: ${type}`);
    }

    this.loadedModels.set(type, {
      entry,
      instance,
      loadedAt: Date.now(),
    });

    logger.info("ModelManager", `Loaded model: ${type}`);
    return instance;
  }

  getModel(type: string): unknown {
    return this.loadedModels.get(type)?.instance ?? null;
  }

  isLoaded(type: string): boolean {
    return this.loadedModels.has(type);
  }

  getLoadedTypes(): string[] {
    return Array.from(this.loadedModels.keys());
  }

  unloadModel(type: string): void {
    const entry = this.loadedModels.get(type);
    if (entry) {
      const instance = entry.instance as { close(): void };
      instance.close();
      this.loadedModels.delete(type);
      logger.info("ModelManager", `Unloaded model: ${type}`);
    }
  }

  unloadAll(): void {
    for (const [type] of this.loadedModels) {
      this.unloadModel(type);
    }
  }

  async prefetchModels(types: string[]): Promise<void> {
    await Promise.all(types.map((t) => this.loadModel(t)));
  }
}

export const modelManager = new ModelManager();
