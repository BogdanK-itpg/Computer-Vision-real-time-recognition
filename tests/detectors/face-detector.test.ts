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

import { detectFaces } from "@/lib/detectors/face-detector";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    detect: mockDetect,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

describe("detectFaces", () => {
  it("returns empty array when no detections", async () => {
    mockDetect.mockReturnValue({ detections: [] });
    const result = await detectFaces(makeImageData());
    expect(result).toEqual([]);
  });

  it("maps detection results correctly", async () => {
    mockDetect.mockReturnValue({
      detections: [
        {
          boundingBox: { originX: 10, originY: 20, width: 100, height: 200 },
          keypoints: [{ x: 0.5, y: 0.5 }],
          categories: [{ score: 0.95 }],
        },
      ],
    });
    const result = await detectFaces(makeImageData());
    expect(result).toHaveLength(1);
    expect(result[0].boundingBox).toEqual({
      originX: 10,
      originY: 20,
      width: 100,
      height: 200,
    });
    expect(result[0].keypoints).toEqual([{ x: 0.5, y: 0.5 }]);
    expect(result[0].score).toBe(0.95);
  });

  it("filters by confidence threshold", async () => {
    mockDetect.mockReturnValue({
      detections: [
        {
          boundingBox: { originX: 0, originY: 0, width: 10, height: 10 },
          keypoints: [],
          categories: [{ score: 0.9 }],
        },
        {
          boundingBox: { originX: 0, originY: 0, width: 10, height: 10 },
          keypoints: [],
          categories: [{ score: 0.3 }],
        },
      ],
    });
    const result = await detectFaces(makeImageData(), 0.5);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0.9);
  });

  it("handles missing categories", async () => {
    mockDetect.mockReturnValue({
      detections: [
        {
          boundingBox: { originX: 0, originY: 0, width: 10, height: 10 },
          keypoints: [],
        },
      ],
    });
    const result = await detectFaces(makeImageData(), 0);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0);
  });

  it("handles missing detections property", async () => {
    mockDetect.mockReturnValue({});
    const result = await detectFaces(makeImageData());
    expect(result).toEqual([]);
  });
});
