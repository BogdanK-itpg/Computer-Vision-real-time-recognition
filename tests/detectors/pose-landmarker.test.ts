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

import { detectPoseLandmarks } from "@/lib/detectors/pose-landmarker";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    detect: mockDetect,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

describe("detectPoseLandmarks", () => {
  it("returns null when no landmarks detected", async () => {
    mockDetect.mockReturnValue({ landmarks: [] });
    const result = await detectPoseLandmarks(makeImageData());
    expect(result).toBeNull();
  });

  it("maps pose landmarks correctly", async () => {
    mockDetect.mockReturnValue({
      landmarks: [
        [
          { x: 0.1, y: 0.2, z: 0.3 },
          { x: 0.4, y: 0.5, z: 0.6 },
        ],
      ],
    });
    const result = await detectPoseLandmarks(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.poseLandmarks).toHaveLength(1);
    expect(result!.poseLandmarks[0]).toHaveLength(2);
    expect(result!.poseLandmarks[0][0]).toEqual([0.1, 0.2, 0.3]);
  });

  it("handles multiple poses", async () => {
    mockDetect.mockReturnValue({
      landmarks: [[{ x: 0, y: 0, z: 0 }], [{ x: 1, y: 1, z: 1 }]],
    });
    const result = await detectPoseLandmarks(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.poseLandmarks).toHaveLength(2);
  });

  it("returns null for empty landmarks", async () => {
    mockDetect.mockReturnValue({ landmarks: [] });
    const result = await detectPoseLandmarks(makeImageData());
    expect(result).toBeNull();
  });
});
