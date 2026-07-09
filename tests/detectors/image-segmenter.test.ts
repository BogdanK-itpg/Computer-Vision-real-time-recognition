import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSegment, mockLoadModel } = vi.hoisted(() => ({
  mockSegment: vi.fn(),
  mockLoadModel: vi.fn(),
}));

vi.mock("@/lib/detectors/model-manager", () => ({
  modelManager: {
    loadModel: mockLoadModel,
  },
}));

vi.mock("@mediapipe/tasks-vision", () => ({}));

import { segmentImage } from "@/lib/detectors/image-segmenter";

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadModel.mockResolvedValue({
    segment: mockSegment,
  });
});

function makeImageData(): ImageData {
  return new ImageData(100, 100);
}

function makeMockMask(width: number, height: number) {
  const len = width * height;
  const floatData = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    floatData[i] = i / len;
  }
  return {
    width,
    height,
    getAsFloat32Array: () => floatData,
  };
}

describe("segmentImage", () => {
  it("returns null when no confidence masks", async () => {
    mockSegment.mockReturnValue({ confidenceMasks: [] });
    const result = await segmentImage(makeImageData());
    expect(result).toBeNull();
  });

  it("converts confidence masks to ImageData", async () => {
    mockSegment.mockReturnValue({
      confidenceMasks: [makeMockMask(2, 2)],
    });
    const result = await segmentImage(makeImageData());
    expect(result).not.toBeNull();
    expect(result!.confidenceMasks).toHaveLength(1);
    expect(result!.confidenceMasks[0].width).toBe(2);
    expect(result!.confidenceMasks[0].height).toBe(2);
  });

  it("handles null result", async () => {
    mockSegment.mockReturnValue({ confidenceMasks: [] });
    const result = await segmentImage(makeImageData());
    expect(result).toBeNull();
  });
});
