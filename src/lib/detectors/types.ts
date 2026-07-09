export interface BoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface Detection {
  boundingBox: BoundingBox;
  keypoints: Array<{ x: number; y: number }>;
  score: number;
}

export interface FaceLandmarksResult {
  faceLandmarks: number[][][];
  blendShapes?: Record<string, number>[];
}

export interface HandLandmarksResult {
  handLandmarks: number[][][];
  handedness: string[];
  handednessScores: number[];
}

export interface PoseLandmarksResult {
  poseLandmarks: number[][][];
  segmentationMask?: ImageData | null;
}

export interface ObjectDetection {
  boundingBox: BoundingBox;
  categoryName: string;
  score: number;
}

export interface GestureResult {
  gestureName: string;
  score: number;
  handLandmarks: number[][];
  handedness: string;
}

export interface DetectionResults {
  faceDetections?: Detection[];
  faceLandmarks?: FaceLandmarksResult;
  handLandmarks?: HandLandmarksResult;
  poseLandmarks?: PoseLandmarksResult;
  objectDetections?: ObjectDetection[];
  gestures?: GestureResult[];
  processingTimeMs: number;
}

export type DetectorType =
  | "face_detector"
  | "face_landmarker"
  | "hand_landmarker"
  | "pose_landmarker"
  | "object_detector"
  | "gesture_recognizer";

export const DETECTOR_LABELS: Record<DetectorType, string> = {
  face_detector: "Face Detection",
  face_landmarker: "Face Landmarks",
  hand_landmarker: "Hand Landmarks",
  pose_landmarker: "Pose Landmarks",
  object_detector: "Object Detection",
  gesture_recognizer: "Gesture Recognition",
};

export const DETECTOR_COLORS: Record<DetectorType, string> = {
  face_detector: "#22c55e",
  face_landmarker: "#3b82f6",
  hand_landmarker: "#eab308",
  pose_landmarker: "#a855f7",
  object_detector: "#ef4444",
  gesture_recognizer: "#ec4899",
};
