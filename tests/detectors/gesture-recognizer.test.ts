import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRecognize, mockLoadModel } = vi.hoisted(() => ({
  mockRecognize: vi.fn(),
  mockLoadModel: vi.fn(),
}));

vi.mock("@/lib/detectors/model-manager", () => ({
  modelManager: {
    loadModel: mockLoadModel,
  },
}));

vi.mock("@mediapipe/tasks-vision", () => ({}));

import { recognizeGestures } from "@/lib/detectors/gesture-recognizer";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    recognize: mockRecognize,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

describe("recognizeGestures", () => {
  it("returns empty array when no gestures", async () => {
    mockRecognize.mockReturnValue({ gestures: [] });
    const result = await recognizeGestures(makeImageData());
    expect(result).toEqual([]);
  });

  it("maps gesture results correctly", async () => {
    mockRecognize.mockReturnValue({
      gestures: [[{ categoryName: "Thumb_Up", score: 0.95 }]],
      landmarks: [[{ x: 0.1, y: 0.2, z: 0.3 }]],
      handedness: [[{ categoryName: "Right" }]],
    });
    const result = await recognizeGestures(makeImageData());
    expect(result).toHaveLength(1);
    expect(result[0].gestureName).toBe("Thumb_Up");
    expect(result[0].score).toBe(0.95);
    expect(result[0].handedness).toBe("Right");
    expect(result[0].handLandmarks).toHaveLength(1);
  });

  it("handles missing landmarks and handedness", async () => {
    mockRecognize.mockReturnValue({
      gestures: [[{ categoryName: "Victory", score: 0.8 }]],
    });
    const result = await recognizeGestures(makeImageData());
    expect(result).toHaveLength(1);
    expect(result[0].handLandmarks).toEqual([]);
    expect(result[0].handedness).toBe("Unknown");
  });

  it("handles multiple gestures", async () => {
    mockRecognize.mockReturnValue({
      gestures: [
        [{ categoryName: "Thumb_Up", score: 0.9 }],
        [{ categoryName: "Peace", score: 0.85 }],
      ],
      landmarks: [[{ x: 0, y: 0, z: 0 }], [{ x: 1, y: 1, z: 1 }]],
      handedness: [[{ categoryName: "Right" }], [{ categoryName: "Left" }]],
    });
    const result = await recognizeGestures(makeImageData());
    expect(result).toHaveLength(2);
    expect(result[0].gestureName).toBe("Thumb_Up");
    expect(result[1].gestureName).toBe("Peace");
    expect(result[1].handedness).toBe("Left");
  });

  it("handles missing gestures property", async () => {
    mockRecognize.mockReturnValue({});
    const result = await recognizeGestures(makeImageData());
    expect(result).toEqual([]);
  });
});
