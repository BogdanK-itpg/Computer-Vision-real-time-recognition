# Migration Guide: Desktop Python to Web Application

## Overview

The original computer vision application was a Python CLI tool using MediaPipe + OpenCV. It has been ported to a browser-based Next.js web application using `@mediapipe/tasks-vision`, deployed on Vercel.

### Architecture Change

| Layer | Desktop (Python) | Web (TypeScript) |
|-------|------------------|------------------|
| CV Runtime | `mediapipe` Python + `opencv-python` | `@mediapipe/tasks-vision` (WASM/WebGL) |
| Inference Location | Local machine | Browser (client-side) |
| UI | CLI + `cv2.imshow()` | React components + Canvas |
| Webcam | `cv2.VideoCapture` | `navigator.mediaDevices.getUserMedia()` |
| File I/O | Local filesystem | Browser File API + Vercel Blob |
| Deployment | Manual Python env setup | `vercel deploy` |
| State | CLI args + Config dataclass | React hooks + Zod config schema |

### Why This Approach

All CV inference runs in the **browser** - not on a server. This avoids:
- Vercel serverless function timeouts (10s for free plan)
- Missing native binaries (OpenCV, MediaPipe C++ extensions)
- Cold-start latency for model loading
- Bandwidth cost of streaming video to a server

The Next.js backend (API routes) only handles:
- File upload storage (Vercel Blob)
- Processing history metadata
- Model manifest serving

## File Mapping

| Python File | TypeScript Equivalent | Notes |
|-------------|----------------------|-------|
| `src/config.py` | `src/lib/config.ts` | Dataclass to Zod schema |
| `src/utils.py` | `src/lib/utils/*` | Split into `canvas.ts`, `file.ts`, `logger.ts` |
| `src/visualization.py` | `src/lib/utils/canvas.ts` | OpenCV drawing to Canvas 2D API |
| `src/mediapipe_tasks.py` | `src/lib/detectors/model-manager.ts` | Lazy loading to CDN + Cache API |
| `src/detectors/*.py` | `src/lib/detectors/*.ts` | Same MediaPipe Tasks API (JS SDK) |
| `src/camera.py` | Browser APIs (no TS file) | `getUserMedia()`, `FileReader`, `<video>` |
| `src/pipelines/*.py` | `src/lib/hooks/*.ts` | Pipeline logic to React hooks |
| `main.py` | `src/app/*/page.tsx` | CLI routing to App Router |
| `tests/*` | `tests/*` | pytest to Vitest + Testing Library |

## Codebase Layout

```
computer-vision-web/
  src/               # Next.js web application (TypeScript)
  python/            # Original Python reference implementation
  tests/             # TypeScript tests (Vitest)
  docs/              # Documentation
```

The `python/` directory contains the original desktop application. It remains in the repository as a reference for:
- Verifying detection behavior against known results
- Running batch/automated processing locally
- Future porting of new features

## Running the Python Version

```bash
cd python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py --image path/to/image.jpg
```

## Running the Web Version

```bash
npm install
npm run dev
```

Open http://localhost:3000
