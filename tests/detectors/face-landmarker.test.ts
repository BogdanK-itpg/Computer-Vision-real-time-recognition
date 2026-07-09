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

import { detectFaceLandmarks } from "@/lib/detectors/face-landmarker";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    detect: mockDetect,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

describe("detectFaceLandmarks", () => {
  it("returns null when no landmarks detected", async () => {
    mockDetect.mockReturnValue({ faceLandmarks: [] });
    const result = await detectFaceLandmarks(makeImageData());
    expect(result).toBeNull();
  });

  it("maps face landmarks correctly", async () => {
    mockDetect.mockReturnValue({
      faceLandmarks: [
        [
          { x: 0.1, y: 0.2, z: 0.3 },
          { x: 0.4, y: 0.5, z: 0.6 },
        ],
      ],
    });
    const result = await detectFaceLandmarks(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.faceLandmarks).toHaveLength(1);
    expect(result!.faceLandmarks[0]).toHaveLength(2);
    expect(result!.faceLandmarks[0][0]).toEqual([0.1, 0.2, 0.3]);
  });

  it("extracts blend shapes when present", async () => {
    mockDetect.mockReturnValue({
      faceLandmarks: [[{ x: 0, y: 0, z: 0 }]],
      faceBlendshapes: [
        {
          categories: [
            { categoryName: "eyeBlink", score: 0.8 },
            { categoryName: "mouthOpen", score: 0.3 },
          ],
        },
      ],
    });
    const result = await detectFaceLandmarks(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.blendShapes).toHaveLength(1);
    expect(result!.blendShapes![0].eyeBlink).toBe(0.8);
    expect(result!.blendShapes![0].mouthOpen).toBe(0.3);
  });

  it("handles null result gracefully", async () => {
    mockDetect.mockReturnValue({ faceLandmarks: [] });
    const result = await detectFaceLandmarks(makeImageData());
    expect(result).toBeNull();
  });
});
