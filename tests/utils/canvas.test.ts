import { describe, it, expect, vi, beforeEach } from "vitest";

function createMockCtx() {
  return {
    strokeStyle: "",
    lineWidth: 0,
    fillStyle: "",
    font: "",
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
  } as unknown as CanvasRenderingContext2D;
}

import {
  drawRect,
  drawLabel,
  drawLandmarks,
  drawLandmarkConnections,
  drawFps,
  clearCanvas,
  renderFaceDetections,
  renderFaceLandmarks,
  renderHandLandmarks,
  renderPoseLandmarks,
  renderObjectDetections,
  renderGestures,
} from "@/lib/utils/canvas";

describe("drawRect", () => {
  it("sets stroke style and strokes rect", () => {
    const ctx = createMockCtx();
    drawRect(ctx, 10, 20, 100, 200, "#ff0000");
    expect(ctx.strokeStyle).toBe("#ff0000");
    expect(ctx.lineWidth).toBe(2);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 200);
  });

  it("uses custom thickness", () => {
    const ctx = createMockCtx();
    drawRect(ctx, 0, 0, 10, 10, "#000", 4);
    expect(ctx.lineWidth).toBe(4);
  });
});

describe("drawLabel", () => {
  it("draws filled rect and text", () => {
    const ctx = createMockCtx();
    drawLabel(ctx, "test", 10, 20, "#00ff00");
    expect(ctx.fillStyle).toBe("#ffffff");
    expect(ctx.fillText).toHaveBeenCalled();
  });
});

describe("drawLandmarks", () => {
  it("draws arcs for each point", () => {
    const ctx = createMockCtx();
    drawLandmarks(
      ctx,
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      "#0000ff",
    );
    expect(ctx.beginPath).toHaveBeenCalledTimes(2);
    expect(ctx.arc).toHaveBeenCalledWith(10, 20, 3, 0, Math.PI * 2);
    expect(ctx.arc).toHaveBeenCalledWith(30, 40, 3, 0, Math.PI * 2);
  });
});

describe("drawLandmarkConnections", () => {
  it("draws lines between connected points", () => {
    const ctx = createMockCtx();
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ];
    drawLandmarkConnections(
      ctx,
      points,
      [
        [0, 1],
        [1, 2],
      ],
      "#fff",
    );
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100);
    expect(ctx.moveTo).toHaveBeenCalledWith(100, 100);
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 200);
  });
});

describe("drawFps", () => {
  it("draws FPS text", () => {
    const ctx = createMockCtx();
    drawFps(ctx, 30);
    expect(ctx.fillText).toHaveBeenCalledWith("FPS: 30.0", 10, 30);
  });
});

describe("clearCanvas", () => {
  it("clears the specified area", () => {
    const ctx = createMockCtx();
    clearCanvas(ctx, 640, 480);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 640, 480);
  });
});

describe("renderFaceDetections", () => {
  it("renders each detection with rect and keypoints", () => {
    const ctx = createMockCtx();
    const detections = [
      {
        boundingBox: { originX: 10, originY: 20, width: 100, height: 200 },
        keypoints: [{ x: 50, y: 60 }],
        score: 0.95,
      },
    ];
    renderFaceDetections(ctx, detections);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 200);
    expect(ctx.arc).toHaveBeenCalledWith(50, 60, 3, 0, Math.PI * 2);
  });
});

describe("renderFaceLandmarks", () => {
  it("renders each landmark point", () => {
    const ctx = createMockCtx();
    renderFaceLandmarks(ctx, { faceLandmarks: [[[0.1, 0.2, 0.3]]] });
    expect(ctx.arc).toHaveBeenCalledWith(0.1, 0.2, 1, 0, Math.PI * 2);
  });
});

describe("renderHandLandmarks", () => {
  it("renders each hand landmark point", () => {
    const ctx = createMockCtx();
    renderHandLandmarks(ctx, {
      handLandmarks: [[[0.5, 0.5, 0.5]]],
      handedness: ["Right"],
      handednessScores: [0.9],
    });
    expect(ctx.arc).toHaveBeenCalledWith(0.5, 0.5, 2, 0, Math.PI * 2);
  });
});

describe("renderPoseLandmarks", () => {
  it("renders each pose landmark point", () => {
    const ctx = createMockCtx();
    renderPoseLandmarks(ctx, { poseLandmarks: [[[0.3, 0.4, 0.5]]] });
    expect(ctx.arc).toHaveBeenCalledWith(0.3, 0.4, 2, 0, Math.PI * 2);
  });
});

describe("renderObjectDetections", () => {
  it("renders each detection with label", () => {
    const ctx = createMockCtx();
    renderObjectDetections(ctx, [
      {
        boundingBox: { originX: 5, originY: 10, width: 50, height: 100 },
        categoryName: "person",
        score: 0.9,
      },
    ]);
    expect(ctx.strokeRect).toHaveBeenCalledWith(5, 10, 50, 100);
    expect(ctx.fillText).toHaveBeenCalled();
  });
});

describe("renderGestures", () => {
  it("renders gesture text", () => {
    const ctx = createMockCtx();
    renderGestures(ctx, [
      {
        gestureName: "Thumb_Up",
        score: 0.95,
        handLandmarks: [],
        handedness: "Right",
      },
    ]);
    expect(ctx.fillText).toHaveBeenCalled();
  });
});
