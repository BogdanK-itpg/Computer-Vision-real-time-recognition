import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDetect, mockLoadModel } = vi.hoisted(() => ({
  mockDetect: vi.fn(),
  mockLoadModel: vi.fn(),
}));

vi.mock("@/lib/detectors/model-manager", () => ({
  modelManager: {
    loadModel: mockLoadModel,
  },
}));

vi.mock("@mediapipe/tasks-vision", () => ({}));

import { detectHandLandmarks } from "@/lib/detectors/hand-landmarker";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    detect: mockDetect,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

describe("detectHandLandmarks", () => {
  it("returns null when no landmarks detected", async () => {
    mockDetect.mockReturnValue({ landmarks: [] });
    const result = await detectHandLandmarks(makeImageData());
    expect(result).toBeNull();
  });

  it("maps hand landmarks and handedness correctly", async () => {
    mockDetect.mockReturnValue({
      landmarks: [[{ x: 0.1, y: 0.2, z: 0.3 }]],
      handedness: [[{ categoryName: "Right", score: 0.99 }]],
    });
    const result = await detectHandLandmarks(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.handLandmarks).toHaveLength(1);
    expect(result!.handLandmarks[0][0]).toEqual([0.1, 0.2, 0.3]);
    expect(result!.handedness).toEqual(["Right"]);
    expect(result!.handednessScores).toEqual([0.99]);
  });

  it("handles missing handedness gracefully", async () => {
    mockDetect.mockReturnValue({
      landmarks: [[{ x: 0, y: 0, z: 0 }]],
    });
    const result = await detectHandLandmarks(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.handedness).toEqual([]);
    expect(result!.handednessScores).toEqual([]);
  });

  it("returns null for empty landmarks", async () => {
    mockDetect.mockReturnValue({ landmarks: [] });
    const result = await detectHandLandmarks(makeImageData());
    expect(result).toBeNull();
  });
});
