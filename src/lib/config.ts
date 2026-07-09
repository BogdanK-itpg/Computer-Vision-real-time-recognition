import { z } from "zod";

export const DetectorType = z.enum([
  "face_detector",
  "face_landmarker",
  "hand_landmarker",
  "pose_landmarker",
  "object_detector",
  "image_segmenter",
  "gesture_recognizer",
]);
export type DetectorType = z.infer<typeof DetectorType>;

export const DetectorConfigSchema = z.object({
  confidence: z.number().min(0).max(1).default(0.5),
  maxResults: z.number().int().min(1).max(50).default(5),
  enabled: z.boolean().default(true),
});

export type DetectorConfig = z.infer<typeof DetectorConfigSchema>;

export const ModelEntrySchema = z.object({
  url: z.string().url(),
  version: z.string(),
  sha256: z.string().optional(),
  sizeBytes: z.number().int().positive(),
  detectorType: DetectorType,
});

export type ModelEntry = z.infer<typeof ModelEntrySchema>;

export const AppConfigSchema = z.object({
  detectors: z.record(z.string(), DetectorConfigSchema).default({}),
  camera: z.object({
    preferredWidth: z.number().int().positive().default(640),
    preferredHeight: z.number().int().positive().default(480),
    preferredFps: z.number().int().positive().default(30),
  }).default({
    preferredWidth: 640,
    preferredHeight: 480,
    preferredFps: 30,
  }),
  upload: z.object({
    maxImageSizeMB: z.number().positive().default(20),
    maxVideoSizeMB: z.number().positive().default(100),
    allowedImageTypes: z
      .array(z.string())
      .default(["image/jpeg", "image/png", "image/webp"]),
    allowedVideoTypes: z
      .array(z.string())
      .default(["video/mp4"]),
  }).default({
    maxImageSizeMB: 20,
    maxVideoSizeMB: 100,
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedVideoTypes: ["video/mp4"],
  }),
  ui: z.object({
    defaultTheme: z.enum(["light", "dark", "system"]).default("system"),
    frameSkip: z.number().int().min(0).default(1),
  }).default({
    defaultTheme: "system",
    frameSkip: 1,
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const DEFAULT_CONFIG: AppConfig = AppConfigSchema.parse({});

export const MODEL_REGISTRY: Record<string, ModelEntry> = {
  face_detector: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/face_detector.tflite",
    version: "latest",
    sizeBytes: 229746,
    detectorType: "face_detector",
  },
  face_landmarker: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/face_landmarker.task",
    version: "latest",
    sizeBytes: 3758596,
    detectorType: "face_landmarker",
  },
  hand_landmarker: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/hand_landmarker.task",
    version: "latest",
    sizeBytes: 7819105,
    detectorType: "hand_landmarker",
  },
  pose_landmarker: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/pose_landmarker.task",
    version: "latest",
    sizeBytes: 5777746,
    detectorType: "pose_landmarker",
  },
  object_detector: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/object_detector.task",
    version: "latest",
    sizeBytes: 7254339,
    detectorType: "object_detector",
  },
  image_segmenter: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/image_segmenter.task",
    version: "latest",
    sizeBytes: 249537,
    detectorType: "image_segmenter",
  },
  gesture_recognizer: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/gesture_recognizer.task",
    version: "latest",
    sizeBytes: 8373440,
    detectorType: "gesture_recognizer",
  },
};

export function getDetectorConfig(
  config: AppConfig,
  type: string,
): DetectorConfig {
  return config.detectors[type] ?? DetectorConfigSchema.parse({});
}
