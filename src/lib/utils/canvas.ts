import type {
  Detection,
  ObjectDetection,
  FaceLandmarksResult,
  HandLandmarksResult,
  PoseLandmarksResult,
  GestureResult,
} from "@/lib/detectors/types";

export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  thickness = 2,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.strokeRect(x, y, w, h);
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  ctx.font = "14px system-ui, sans-serif";
  const metrics = ctx.measureText(text);
  const padding = 4;
  const labelHeight = 20;

  ctx.fillStyle = color;
  ctx.fillRect(x, y - labelHeight, metrics.width + padding * 2, labelHeight);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x + padding, y - 6);
}

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  radius = 3,
): void {
  ctx.fillStyle = color;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawLandmarkConnections(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  connections: Array<[number, number]>,
  color: string,
  lineWidth = 1,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (const [i, j] of connections) {
    const a = points[i];
    const b = points[j];
    if (a && b) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

export function drawFps(
  ctx: CanvasRenderingContext2D,
  fps: number,
  color = "#22c55e",
): void {
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 30);
}

export function renderFaceDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  color = "#22c55e",
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  for (const d of detections) {
    const { originX, originY, width, height } = d.boundingBox;
    drawRect(ctx, originX, originY, width, height, color);
    drawLabel(
      ctx,
      `Face: ${(d.score * 100).toFixed(0)}%`,
      originX,
      originY,
      color,
    );
    for (const kp of d.keypoints) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(kp.x * w, kp.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderFaceLandmarks(
  ctx: CanvasRenderingContext2D,
  result: FaceLandmarksResult,
  color = "#3b82f6",
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  for (const face of result.faceLandmarks) {
    for (const [x, y] of face) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * w, y * h, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderHandLandmarks(
  ctx: CanvasRenderingContext2D,
  result: HandLandmarksResult,
  color = "#eab308",
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  for (const hand of result.handLandmarks) {
    for (const [x, y] of hand) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * w, y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderPoseLandmarks(
  ctx: CanvasRenderingContext2D,
  result: PoseLandmarksResult,
  color = "#a855f7",
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  for (const pose of result.poseLandmarks) {
    for (const [x, y] of pose) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * w, y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderObjectDetections(
  ctx: CanvasRenderingContext2D,
  detections: ObjectDetection[],
  color = "#ef4444",
): void {
  for (const d of detections) {
    const { originX, originY, width, height } = d.boundingBox;
    drawRect(ctx, originX, originY, width, height, color);
    const label = `${d.categoryName}: ${(d.score * 100).toFixed(0)}%`;
    drawLabel(ctx, label, originX, originY, color);
  }
}

export function renderGestures(
  ctx: CanvasRenderingContext2D,
  gestures: GestureResult[],
  color = "#ec4899",
): void {
  let y = 60;
  ctx.font = "14px system-ui, sans-serif";
  for (const g of gestures) {
    ctx.fillStyle = color;
    const text = `${g.gestureName} (${g.handedness}): ${(g.score * 100).toFixed(0)}%`;
    ctx.fillText(text, 10, y);
    y += 24;
  }
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename = "annotated-image.png",
): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
