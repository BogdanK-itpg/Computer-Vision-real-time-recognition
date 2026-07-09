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

import { detectObjects } from "@/lib/detectors/object-detector";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    detect: mockDetect,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

describe("detectObjects", () => {
  it("returns empty array when no detections", async () => {
    mockDetect.mockReturnValue({ detections: [] });
    const result = await detectObjects(makeImageData());
    expect(result).toEqual([]);
  });

  it("maps object detections correctly", async () => {
    mockDetect.mockReturnValue({
      detections: [
        {
          boundingBox: { originX: 10, originY: 20, width: 100, height: 200 },
          categories: [{ categoryName: "cat", score: 0.95 }],
        },
      ],
    });
    const result = await detectObjects(makeImageData());
    expect(result).toHaveLength(1);
    expect(result[0].boundingBox).toEqual({
      originX: 10,
      originY: 20,
      width: 100,
      height: 200,
    });
    expect(result[0].categoryName).toBe("cat");
    expect(result[0].score).toBe(0.95);
  });

  it("filters by confidence threshold", async () => {
    mockDetect.mockReturnValue({
      detections: [
        {
          boundingBox: { originX: 0, originY: 0, width: 10, height: 10 },
          categories: [{ categoryName: "dog", score: 0.9 }],
        },
        {
          boundingBox: { originX: 0, originY: 0, width: 10, height: 10 },
          categories: [{ categoryName: "bird", score: 0.2 }],
        },
      ],
    });
    const result = await detectObjects(makeImageData(), 0.5);
    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe("dog");
  });

  it("handles missing categories", async () => {
    mockDetect.mockReturnValue({
      detections: [
        {
          boundingBox: { originX: 0, originY: 0, width: 10, height: 10 },
        },
      ],
    });
    const result = await detectObjects(makeImageData(), 0);
    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe("unknown");
    expect(result[0].score).toBe(0);
  });

  it("handles missing detections property", async () => {
    mockDetect.mockReturnValue({});
    const result = await detectObjects(makeImageData());
    expect(result).toEqual([]);
  });
});
