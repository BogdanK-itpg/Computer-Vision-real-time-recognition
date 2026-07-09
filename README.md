# CV Detect

Browser-based computer vision application powered by [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision). All detection runs locally via WebGL/WebGPU — no server processing required.

## Features

- **Face Detection** — bounding boxes + 6 keypoints per face
- **Face Landmarker** — 478 face landmarks with blend shapes
- **Hand Landmarker** — 21 landmarks per hand, left/right classification
- **Pose Landmarker** — 33 full-body landmarks
- **Object Detector** — common object detection with labels
- **Image Segmenter** — pixel-level segmentation masks
- **Gesture Recognizer** — hand gesture recognition

## Modes

| Mode | Description |
|------|-------------|
| Image Detection | Upload an image, select detectors, view annotated results |
| Webcam Detection | Real-time detection from your camera |
| Video Detection | Frame-by-frame video processing |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | For upload/history features | Vercel Blob storage token |

### Build

```bash
npm run build
npm start
```

## Tech Stack

- **Framework:** Next.js (App Router)
- **CV Runtime:** @mediapipe/tasks-vision (client-side WebGL)
- **Styling:** Tailwind CSS v4
- **Storage:** Vercel Blob
