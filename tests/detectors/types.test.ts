import { describe, it, expect } from "vitest";
import {
  DETECTOR_LABELS,
  DETECTOR_COLORS,
  type DetectorType,
  type DetectionResults,
} from "@/lib/detectors/types";

describe("DETECTOR_LABELS", () => {
  const types: DetectorType[] = [
    "face_detector",
    "face_landmarker",
    "hand_landmarker",
    "pose_landmarker",
    "object_detector",
    "gesture_recognizer",
  ];

  it("has labels for all 6 detector types", () => {
    for (const t of types) {
      expect(DETECTOR_LABELS[t]).toBeTruthy();
      expect(typeof DETECTOR_LABELS[t]).toBe("string");
    }
  });

  it("labels are human-readable", () => {
    expect(DETECTOR_LABELS.face_detector).toMatch(/face/i);
    expect(DETECTOR_LABELS.hand_landmarker).toMatch(/hand/i);
    expect(DETECTOR_LABELS.pose_landmarker).toMatch(/pose/i);
  });
});

describe("DETECTOR_COLORS", () => {
  it("has colors for all 6 detector types", () => {
    const types = Object.keys(DETECTOR_COLORS);
    expect(types).toHaveLength(6);
    for (const color of Object.values(DETECTOR_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("DetectionResults type", () => {
  it("allows empty result", () => {
    const result: DetectionResults = { processingTimeMs: 0 };
    expect(result.processingTimeMs).toBe(0);
  });

  it("allows partial detection results", () => {
    const result: DetectionResults = {
      processingTimeMs: 42,
      faceDetections: [
        {
          boundingBox: { originX: 10, originY: 20, width: 100, height: 200 },
          keypoints: [],
          score: 0.95,
        },
      ],
    };
    expect(result.faceDetections).toHaveLength(1);
    expect(result.faceDetections![0].score).toBe(0.95);
  });

  it("allows all detection types simultaneously", () => {
    const result: DetectionResults = {
      processingTimeMs: 100,
      faceDetections: [],
      faceLandmarks: { faceLandmarks: [] },
      handLandmarks: {
        handLandmarks: [],
        handedness: [],
        handednessScores: [],
      },
      poseLandmarks: { poseLandmarks: [] },
      objectDetections: [],
      gestures: [],
    };
    expect(result.processingTimeMs).toBe(100);
    expect(result.faceLandmarks?.faceLandmarks).toEqual([]);
  });
});
