# Transformation Plan: Desktop CV → Production Vercel Web Application

---

## 1. Executive Summary

The current project is a well-structured Python CLI application using OpenCV + MediaPipe Tasks API with 7 detectors, 4 pipelines, and ~2,200 lines of Python. It cannot run on Vercel because Vercel serverless functions do not support native Python binary extensions (OpenCV, MediaPipe), persistent filesystem, webcam access, or long-running processes.

**Recommended approach**: Migrate computer vision to the **browser** using `@mediapipe/tasks-vision` (MediaPipe's official JS/TS SDK), with a Next.js frontend hosted on Vercel. The Python backend becomes a thin API layer for file storage, history, and configuration — not for CV inference. The browser handles all detection via WebGL/WebGPU. This preserves every detection capability, improves latency (no server round-trip), and scales to zero cost.

| Aspect | Current | Future |
|--------|---------|--------|
| CV Runtime | Python + MediaPipe + OpenCV | Browser JS + @mediapipe/tasks-vision |
| Models | Local `.task`/`.tflite` files (32 MB) | CDN-hosted `.task` files, lazy-loaded |
| Webcam | OpenCV cv2.VideoCapture | Browser `getUserMedia()` |
| Video processing | Python + OpenCV VideoWriter | Browser Canvas + MediaRecorder/FFmpeg.wasm |
| Image upload | Local file path | Browser File/Blob + serverless multipart |
| Deployment | Manual Python env | `vercel deploy` |
| Hosting | Local machine | Vercel Edge Network |

---

## 2. Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                            │
│                                                                     │
│  ┌─────────┐  ┌────────────────┐  ┌───────────────────────────┐   │
│  │ Next.js │  │ MediaPipe Web  │  │  React Components         │   │
│  │  App    │──│ (tasks-vision) │──│  - Upload Zone            │   │
│  │  Router │  │ - FaceDetector │  │  - Canvas Overlay         │   │
│  │         │  │ - HandLandmark │  │  - Result Panel           │   │
│  │         │  │ - PoseLandmark │  │  - Model Status           │   │
│  │         │  │ - ObjectDetect │  │  - Settings               │   │
│  │         │  │ - Segmenter    │  │  - History                │   │
│  │         │  │ - GestureRecog │  │                           │   │
│  └────┬────┘  └────────────────┘  └───────────────────────────┘   │
│       │                                                           │
│       │ fetch() / upload()                                        │
└───────┼───────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     VERCEL PLATFORM                                  │
│                                                                      │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  Next.js SSR/ISR │  │  API Routes     │  │  Edge Functions  │   │
│  │  - Static pages  │  │  - /api/upload  │  │  - Rate limiting │   │
│  │  - Dynamic meta  │  │  - /api/process │  │  - Auth check    │   │
│  │  - / pages       │  │  - /api/models  │  │  - Redirects     │   │
│  └──────────────────┘  └────────┬────────┘  └──────────────────┘   │
│                                  │                                   │
│  ┌───────────────────────────────┴──────────────────────────────┐   │
│  │                    Vercel Blob Storage                        │   │
│  │  - Uploaded images/videos (temporary, auto-expire)           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Vercel KV / Postgres (optional)            │   │
│  │  - Processing history (metadata only, no images)             │   │
│  │  - User preferences/settings                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Data flow for image detection**:
1. User selects file → browser reads as `ImageData` via Canvas
2. `@mediapipe/tasks-vision` loads model (CDN, cached) → runs inference → returns landmarks/boxes
3. Browser draws annotations on Canvas overlay
4. User can download annotated result (client-side Canvas `toBlob()`)
5. Optionally, image + result JSON is uploaded to Vercel Blob for history

**Data flow for webcam**:
1. Browser requests `getUserMedia()` → displays in `<video>` element
2. `requestAnimationFrame` loop captures to offscreen Canvas → feeds to MediaPipe detectors
3. Annotations drawn in real-time on overlay Canvas
4. User can record segments via MediaRecorder API

**Data flow for video**:
1. User selects video file → browser reads via `FileReader`
2. Video rendered to offscreen `<video>` element frame-by-frame via `requestVideoFrameCallback`
3. Each frame processed through MediaPipe detectors
4. Annotated frames either rendered in real-time or re-encoded via FFmpeg.wasm

---

## 3. Vercel Compatibility Analysis

### What Cannot Run on Vercel

| Component | Why It Fails | Replacement |
|-----------|-------------|-------------|
| `opencv-python` (cv2) | Native C++ extension, not available in serverless runtime; requires system-level libs | Browser Canvas API (client) + sharp (serverless thumbnails) |
| `mediapipe` Python pkg | Native C++ extensions, no serverless runtime support | `@mediapipe/tasks-vision` NPM package (browser WebGL) |
| Webcam (`cv2.VideoCapture`) | No hardware access in serverless | `navigator.mediaDevices.getUserMedia()` (browser) |
| Local model files (`assets/models/*`) | No persistent filesystem in serverless; gitignored anyway | CDN-hosted models via `FilesetResolver` |
| `cv2.VideoWriter` | Native lib, no GPU encoding in serverless | Canvas.captureStream() + MediaRecorder, or FFmpeg.wasm in browser |
| `cv2.imshow()` / `cv2.waitKey()` | No display server in cloud | React Canvas rendering |
| Long-running pipeline (webcam loop) | Vercel functions timeout at 10s (Pro) / 60s (Enterprise) | Browser event loop (no timeout) |
| Large video processing | 50MB function limit, 10s timeout | Browser-side processing + chunked upload to Blob |
| `matplotlib` | Heavy native dependency, no display | Chart.js / D3.js (browser charts) |
| `sounddevice` | System audio hardware, no microphone in serverless | Web Audio API / MediaRecorder (browser) |

### What Can Remain (Refactored)

| File | Status | Reason |
|------|--------|--------|
| `src/config.py` | **Refactor** | Configuration model is good but needs web-appropriate fields; convert to TypeScript config types |
| `src/detectors/face_detector.py` | **Rewrite in TS** | Detection logic has clean Python → TypeScript mapping via `@mediapipe/tasks-vision` |
| `src/detectors/face_landmarker.py` | **Rewrite in TS** | Same pattern |
| `src/detectors/hand_landmarker.py` | **Rewrite in TS** | Same pattern |
| `src/detectors/pose_landmarker.py` | **Rewrite in TS** | Same pattern |
| `src/detectors/object_detector.py` | **Rewrite in TS** | Same pattern |
| `src/detectors/image_segmenter.py` | **Rewrite in TS** | Same pattern |
| `src/detectors/gesture_recognizer.py` | **Rewrite in TS** | Same pattern |
| `src/camera.py` | **Remove** | Replace with browser MediaDevices + File API |
| `src/mediapipe_tasks.py` | **Rewrite in TS** | Lazy-loading pattern is good; port to `FilesetResolver` + `WasmFileset` |
| `src/utils.py` | **Refactor partially** | Logging → browser console; path validation → URL validation; image I/O → Canvas |
| `src/visualization.py` | **Rewrite in TS** | Drawing primitives map to Canvas 2D API |
| `src/pipelines/base_pipeline.py` | **Remove** | Pipelines become React hooks + service classes |
| `src/pipelines/image_pipeline.py` | **Rewrite as React hook** | `useImageDetection` hook |
| `src/pipelines/video_pipeline.py` | **Rewrite as React hook** | `useVideoDetection` hook |
| `src/pipelines/webcam_pipeline.py` | **Rewrite as React hook** | `useWebcamDetection` hook |
| `src/pipelines/batch_pipeline.py` | **Remove** | Not needed in web context |
| `tests/` | **Keep as reference** | Port test patterns to Vitest/Jest for TypeScript |
| `main.py` | **Remove** | Entry point replaced by Next.js pages |
| `pyproject.toml` / `requirements.txt` | **Remove** | Replaced by `package.json` |

---

## 4. Project Folder Structure (Final)

```
computer-vision-web/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Vercel CI/CD
├── public/
│   ├── manifest.json
│   ├── robots.txt
│   └── favicon.ico
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout + metadata
│   │   ├── page.tsx                # Home page
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── detection/
│   │   │   ├── image/
│   │   │   │   └── page.tsx
│   │   │   ├── video/
│   │   │   │   └── page.tsx
│   │   │   └── webcam/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── results/
│   │   │   └── page.tsx
│   │   └── history/
│   │       └── page.tsx
│   ├── api/                        # Vercel serverless API routes
│   │   ├── upload/
│   │   │   └── route.ts            # Multipart upload → Vercel Blob
│   │   ├── models/
│   │   │   └── route.ts            # Model manifest + CDN URLs
│   │   ├── history/
│   │   │   ├── route.ts            # GET (list) / POST (save)
│   │   │   └── [id]/
│   │   │       └── route.ts        # GET / DELETE single history entry
│   │   └── health/
│   │       └── route.ts            # Health check
│   ├── components/                 # React components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── detection/
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── VideoUploader.tsx
│   │   │   ├── WebcamView.tsx
│   │   │   ├── DetectionCanvas.tsx
│   │   │   ├── ResultPanel.tsx
│   │   │   ├── ConfidenceSlider.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── AnnotatedImage.tsx
│   │   ├── ui/                     # Primitive UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Alert.tsx
│   │   └── history/
│   │       ├── HistoryList.tsx
│   │       └── HistoryItem.tsx
│   ├── lib/                        # Core business logic
│   │   ├── detectors/              # TypeScript CV services
│   │   │   ├── types.ts            # Shared result types (ported from Python dataclasses)
│   │   │   ├── model-manager.ts    # Lazy model loading + caching
│   │   │   ├── face-detector.ts
│   │   │   ├── face-landmarker.ts
│   │   │   ├── hand-landmarker.ts
│   │   │   ├── pose-landmarker.ts
│   │   │   ├── object-detector.ts
│   │   │   ├── image-segmenter.ts
│   │   │   └── gesture-recognizer.ts
│   │   ├── hooks/                  # React hooks
│   │   │   ├── useDetection.ts     # Generic detection orchestrator
│   │   │   ├── useImageDetection.ts
│   │   │   ├── useVideoDetection.ts
│   │   │   ├── useWebcamDetection.ts
│   │   │   ├── useModelManager.ts
│   │   │   └── useHistory.ts
│   │   ├── utils/
│   │   │   ├── canvas.ts           # Canvas drawing helpers (ported from visualization.py)
│   │   │   ├── file.ts             # File validation, size limits
│   │   │   ├── format.ts           # Formatting helpers
│   │   │   └── logger.ts           # Structured logging
│   │   └── config.ts              # App configuration (ported from config.py)
│   │   └── api-client.ts          # Typed fetch wrapper for API routes
│   ├── styles/
│   │   └── globals.css             # Tailwind CSS imports + custom styles
│   └── middleware.ts               # Edge middleware (rate limiting, auth)
├── public/
│   └── models/                     # (empty) — model CDN URLs used instead
├── tests/
│   ├── detectors/
│   │   ├── face-detector.test.ts
│   │   ├── hand-landmarker.test.ts
│   │   └── ...
│   ├── hooks/
│   │   └── useDetection.test.ts
│   └── components/
│       └── DetectionCanvas.test.tsx
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── .env.local                      # Local env vars (not committed)
├── .env.example                    # Documented env var template
├── .gitignore
├── eslint.config.js
├── vercel.json                     # Vercel config
└── README.md
```

---

## 5. Model Management Strategy

### Comparison of Approaches

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **CDN Hosting** (Recommended) | Zero egress from origin; global edge caching; versioned URLs; no storage cost; lazy loading via `<link rel="preload">` | Requires CDN setup; first load depends on CDN speed | **Best** — Models are static, read-only, publicly fetchable |
| Vercel Blob Storage | Simple API; integrated with Vercel; auto-expiry | Egress costs billed; not designed for high-frequency static assets | Avoid — CDN is cheaper and faster |
| GitHub Releases | Free; versioned; no separate service | No CDN; slow downloads; requires API call to resolve latest release; rate limits | Viable fallback but slower UX |
| Browser bundle (ONNX/TFJS) | No model download needed for some models | MediaPipe models are `.task` format, not directly bundleable; would require conversion | Impractical — conversion loses fidelity |
| Self-hosted S3 (Cloudflare R2, etc.) | No egress fees; global edge | More infrastructure; higher complexity | Overkill for public models |

### Recommended: CDN Hosting via jsDelivr + GitHub Releases

**Why**: MediaPipe's own pre-trained models are freely redistributable under Apache 2.0. Hosting them on a CDN like jsDelivr (which pulls from npm/GitHub) gives us:

- **Zero cost** for bandwidth (jsDelivr is free for open-source)
- **Global Edge**: 850+ POPs
- **Versioning**: URLs include version hash
- **Cache invalidation**: Cache-busting via URL versioning
- **No manual steps**: Models are fetched by URL, never stored in repo

**Implementation**:

```typescript
// src/lib/detectors/model-manager.ts (conceptual)
const MODEL_REGISTRY = {
  face_detector: {
    url: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm/face_detector.tflite",
    // OR from GitHub Releases:
    // url: "https://github.com/user/repo/releases/download/v1.0/blaze_face_short_range.tflite",
    version: "1.0.0",
    sha256: "a1b2c3d4...",
    size_bytes: 229746,
  },
  face_landmarker: { ... },
  hand_landmarker: { ... },
  // ... all 7 models
};
```

**Model loading flow**:
1. Page loads → `FilesetResolver.forVisionTasks()` initializes WASM runtime
2. When user triggers detection → specific model `.task` file fetched from CDN
3. Model cached in browser's Cache API (`caches.open('mediapipe-models')`)
4. Subsequent loads: instant retrieval from cache
5. On version bump → old cache evicted, new model fetched

**Integrity verification**: SHA-256 hash checked against manifest after download.

**GitHub Release workflow**: A Python script (or GitHub Action) automatically downloads official MediaPipe models, computes hashes, uploads to a GitHub Release, and updates the model registry JSON. This runs once per version update and requires no user intervention.

---

## 6. Backend Refactoring: Service Architecture

The Python codebase is cleanly separated by concern. The TypeScript port maintains the same boundaries:

| Python Layer | TypeScript Layer | Notes |
|-------------|------------------|-------|
| `src/config.py` | `src/lib/config.ts` | Frozen dataclass → `as const` object + Zod schema |
| `src/utils.py` | `src/lib/utils/*` | Split: `canvas.ts`, `file.ts`, `logger.ts` |
| `src/visualization.py` | `src/lib/utils/canvas.ts` | cv2 → Canvas2D API mapping |
| `src/mediapipe_tasks.py` | `src/lib/detectors/model-manager.ts` | Same lazy-loading pattern |
| `src/detectors/*.py` | `src/lib/detectors/*.ts` | Same class structure, same result types |
| `src/camera.py` | Browser APIs (no TS file) | `getUserMedia()`, `FileReader`, `<video>` |
| `src/pipelines/*.py` | `src/lib/hooks/*.ts` | Pipeline logic → React hooks |
| `main.py` | `src/app/*/page.tsx` | CLI routing → Next.js App Router |

### Principle: Keep the Python codebase as the "reference implementation"

The Python source remains in a `python/` directory at the repo root (or a separate branch) for:
- Running local tests
- Batch/automated processing (CI pipelines)
- Future backend worker tasks
- Reference when porting features

The TypeScript code does NOT attempt to replicate every Python function — only the detection logic, visualization, and configuration models are ported. Infrastructure (camera, filesystem, CLI) is replaced entirely.

---

## 7. User Interface Design (Text Wireframe)

### Layout Structure (Every Page)

```
┌─────────────────────────────────────────────────────┐
│ [Logo] Computer Vision                  [Settings]  │
│                                                    │
│  Home │ Image │ Video │ Webcam │ About │ History   │
├─────────────────────────────────────────────────────┤
│                                                     │
│               PAGE CONTENT AREA                     │
│                                                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  © 2026 Computer Vision App                         │
└─────────────────────────────────────────────────────┘
```

### Page: Home (`/`)

```
┌─────────────────────────────────────────────────────┐
│  Real-Time Computer Vision                          │
│  Powered by MediaPipe in your browser               │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Image   │  │  Video   │  │  Webcam  │          │
│  │  Detect  │  │  Detect  │  │  Detect  │          │
│  │  ─────── │  │  ─────── │  │  ─────── │          │
│  │ Upload a │  │ Upload a │  │ Use your │          │
│  │ photo to │  │ video to │  │ camera   │          │
│  │ analyze  │  │ analyze  │  │ in real  │          │
│  │          │  │          │  │ time     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  Detectors available (7):                           │
│  [Face] [FaceMesh] [Hand] [Pose] [Object] [Segment] │
│  [Gesture]                                          │
└─────────────────────────────────────────────────────┘
```

### Page: Image Detection (`/detection/image`)

```
┌─────────────────────────────────────────────────────┐
│  Image Detection                                    │
│                                                     │
│  ┌───────────────────┐  ┌─────────────────────────┐ │
│  │                   │  │ Detection Results        │ │
│  │  [Drop zone or    │  │                         │ │
│  │   click to upload]│  │ ✓ Face: 2 detected      │ │
│  │                   │  │ ✓ Hands: 1 detected     │ │
│  │                   │  │ ✗ Pose: none            │ │
│  │                   │  │ ✓ Objects: 3            │ │
│  │                   │  │                         │ │
│  │                   │  │ Processing: 45ms        │ │
│  └───────────────────┘  └─────────────────────────┘ │
│                                                     │
│  Models: [Face▾] [Hand▾] [Pose▾] [Object▾]         │
│  Confidence: ──────●────── 0.5                      │
│                                                     │
│  [Process]  [Download Annotated]                    │
└─────────────────────────────────────────────────────┘
```

### Page: Webcam Detection (`/detection/webcam`)

```
┌─────────────────────────────────────────────────────┐
│  Webcam Detection                                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │      [Live webcam feed with overlays]       │    │
│  │                                             │    │
│  │      FPS: 30  |  Detections: 4             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [⏺ Record]  [📸 Snapshot]  [⏹ Stop]              │
│                                                     │
│  Active Detectors:                                   │
│  [✓ Face] [✓ Hand] [✓ Pose] [✓ Object] [ ] Gesture │
│                                                     │
│  Live Results:                                       │
│  Face: 92% | Hand: Right (87%) | Pose: detected    │
└─────────────────────────────────────────────────────┘
```

### Page: Settings (`/settings`)

```
┌─────────────────────────────────────────────────────┐
│  Settings                                           │
│                                                     │
│  Detection                                          │
│  ┌─────────────────────────────────────────────┐    │
│  │ Confidence Threshold: ────●──────── 0.5     │    │
│  │ Max Results:          [5]                   │    │
│  │ Frame Skip:           [0] (webcam/video)    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Models                                             │
│  ┌─────────────────────────────────────────────┐    │
│  │ Face Detector:    ● Cached (v1.0)          │    │
│  │ Face Landmarker:  ● Cached (v1.0)          │    │
│  │ Hand Landmarker:  ○ Not loaded [Load]      │    │
│  │ ...                                         │    │
│  │ [Clear Model Cache]                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Appearance                                         │
│  ┌─────────────────────────────────────────────┐    │
│  │ Theme: [System ▾]  | [Light] [Dark]         │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 8. Technology Recommendations

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15+ (App Router) | Native Vercel support, React Server Components, API routes |
| **Language** | TypeScript 5.x | Type safety matching Python dataclass patterns |
| **CV Runtime** | `@mediapipe/tasks-vision` | Official Web SDK, same models, WebGL/WebGPU, WASM |
| **Styling** | Tailwind CSS v4 | Utility-first, small bundles, consistent design |
| **UI Primitives** | Radix UI (headless) | Accessible, unstyled, composable |
| **Form/Validation** | Zod | Schema validation matching config.py patterns |
| **File Upload** | Vercel Blob + `uploadthing` or `@vercel/blob` | Cheap, serverless-compatible, auto-expiry |
| **State Management** | React Context + `useReducer` | Simple, sufficient for this app |
| **Testing** | Vitest + Testing Library | Fast, compatible with Vite/Next.js |
| **Linting** | ESLint + Prettier | Standard |
| **CDN** | jsDelivr (models) + Vercel Edge (app) | Free for open-source, global |
| **Auth (optional)** | NextAuth.js / Auth0 | Only if needed for history feature |
| **Animation** | `framer-motion` | Subtle page transitions |
| **Analytics** | Vercel Analytics | Free tier, privacy-friendly |

---

## 9. Phase-by-Phase Implementation Roadmap

### Phase 0: Project Scaffolding (Est: 2 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Initialize Next.js project with TypeScript + Tailwind | High | Low | — |
| Set up ESLint, Prettier, Vitest | High | Low | — |
| Configure `vercel.json`, `.env.example`, `.gitignore` | High | Low | — |
| Create folder structure per plan | High | Low | — |
| Set up GitHub Actions CI (`deploy.yml`) | High | Low | — |
| Port `config.py` → `src/lib/config.ts` as Zod schema | High | Medium | — |
| Port `src/utils.py` file I/O → `src/lib/utils/file.ts` | Medium | Low | — |
| Port result types (dataclasses) → `src/lib/detectors/types.ts` | High | Medium | — |
| Set up `tests/` directory with Vitest config | Medium | Low | — |
| Deploy empty shell to Vercel to validate setup | High | Low | CI setup |

**Deliverable**: Empty Next.js app deployed on Vercel at preview URL.

---

### Phase 1: Core Detection Engine (Est: 5 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Implement `model-manager.ts` with CDN loading + Cache API | High | Medium | types.ts |
| Implement `face-detector.ts` | High | Medium | model-manager.ts |
| Implement `face-landmarker.ts` | High | Medium | model-manager.ts |
| Implement `hand-landmarker.ts` | High | Medium | model-manager.ts |
| Implement `pose-landmarker.ts` | High | Medium | model-manager.ts |
| Implement `object-detector.ts` | High | Medium | model-manager.ts |
| Implement `image-segmenter.ts` | Medium | Medium | model-manager.ts |
| Implement `gesture-recognizer.ts` | Medium | Medium | model-manager.ts |
| Port `visualization.py` → `src/lib/utils/canvas.ts` | High | Medium | types.ts |
| Write unit tests for all detectors | High | Medium | — |
| Write unit tests for canvas utils | Medium | Low | — |

**Deliverable**: All 7 detectors working in Node/Vitest (headless) and browser console.

---

### Phase 2: UI Components (Est: 4 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Build primitive UI components (Button, Card, Slider, Select, Spinner, Tabs, Badge, Alert) | High | Low | — |
| Build `DetectionCanvas.tsx` — rendering detection overlays | High | High | canvas.ts, types.ts |
| Build `ImageUploader.tsx` — drag-and-drop + file picker | High | Medium | file.ts |
| Build `VideoUploader.tsx` | Medium | Medium | file.ts |
| Build `WebcamView.tsx` | High | Medium | — |
| Build `ResultPanel.tsx` | High | Low | types.ts |
| Build `ModelSelector.tsx` + `ConfidenceSlider.tsx` | Medium | Low | config.ts |
| Build `AnnotatedImage.tsx` — side-by-side original/annotated | Medium | Low | DetectionCanvas |
| Build layout components (Header, Footer, Navigation, MobileNav) | High | Low | — |
| Style `globals.css` with Tailwind theme | Medium | Low | — |

**Deliverable**: All UI components isolated and testable.

---

### Phase 3: React Hooks & Page Integration (Est: 5 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Implement `useImageDetection` hook | High | High | Phase 1 + Phase 2 |
| Implement `useVideoDetection` hook | Medium | High | Phase 1 + Phase 2 |
| Implement `useWebcamDetection` hook | High | High | Phase 1 + Phase 2 |
| Implement `useModelManager` hook (lazy loading, progress, caching) | High | Medium | model-manager.ts |
| Build Home page with 3 detection cards + detector badges | High | Low | Components |
| Build Image Detection page | High | Medium | useImageDetection |
| Build Webcam Detection page | High | Medium | useWebcamDetection |
| Build Video Detection page | Medium | Medium | useVideoDetection |
| Build About page | Low | Low | — |
| Build Settings page | Medium | Low | useModelManager |

**Deliverable**: All 5 functional pages — image, video, and webcam detection working end-to-end in the browser.

---

### Phase 4: API Layer & History (Est: 3 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Set up Vercel Blob storage project | High | Low | — |
| Implement `POST /api/upload` — multipart file → Blob | High | Medium | Blob setup |
| Implement `GET /api/models` — model manifest with CDN URLs | High | Low | config.ts |
| Implement `GET /api/history` — list history entries | Low | Medium | Blob |
| Implement `POST /api/history` — save result metadata | Low | Medium | Blob |
| Implement `DELETE /api/history/[id]` | Low | Low | — |
| Implement `GET /api/health` | Medium | Low | — |
| Build History page (`/history`) | Low | Medium | API + Blob |
| Build Results page (`/results/[id]`) | Low | Medium | API |

**Deliverable**: File upload working, history/result storage functional.

---

### Phase 5: Production Polish (Est: 4 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Add rate limiting via Vercel Edge middleware | High | Medium | — |
| Add file upload validation (type, size) | High | Low | — |
| Add error boundaries + error pages (404, 500) | High | Low | — |
| Add loading states + skeleton screens | High | Low | — |
| Implement responsive design (mobile/tablet/desktop) | High | Medium | All pages |
| Add dark mode support | Medium | Low | Phase 2 |
| Add analytics (Vercel Web Analytics) | Medium | Low | — |
| Write README.md with deploy instructions | High | Low | — |
| Add SEO metadata + OpenGraph images | Medium | Low | — |
| Performance audit (Lighthouse) | High | Low | — |
| Add `middleware.ts` for rate limiting + security headers | High | Medium | — |

**Deliverable**: Production-ready web app passing Lighthouse audit.

---

### Phase 6: Python ↔ Web Migration + Documentation (Est: 3 days)

| Task | Priority | Complexity | Depends On |
|------|----------|------------|------------|
| Organize Python code into `python/` directory at repo root | High | Low | — |
| Update Python README to note web version exists | Low | Low | — |
| Write migration guide in `docs/MIGRATION.md` | Medium | Low | — |
| Archive old `main.py` → `python/main.py` with updated paths | Medium | Low | — |
| Ensure Python tests still pass in isolated env | Medium | Low | — |
| Document model CDN update process in `docs/MODEL_UPDATE.md` | Medium | Low | — |

**Deliverable**: Repo cleanly organized with both Python (legacy) and web (active) in source control.

---

## 10. Detailed Task Checklist (by Milestone)

### Phase 0 — Scaffolding
- [ ] `npx create-next-app@latest computer-vision-web --typescript --tailwind --eslint`
- [ ] Install: `zod`, `@mediapipe/tasks-vision`, `@vercel/blob`, `framer-motion`, `@radix-ui/*` (as needed)
- [ ] Install dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `prettier`
- [ ] Configure `next.config.ts` (image domains, WASM headers)
- [ ] Write `vercel.json` with function config, headers, redirects
- [ ] Create `.env.example` with all env vars documented
- [ ] Create `.gitignore` (node_modules, .next, .env.local, out/)
- [ ] Set up folder structure (mkdir -p for all directories)
- [ ] Create GitHub Actions `.github/workflows/deploy.yml`
- [ ] Port `config.py` dataclass → Zod schema in `src/lib/config.ts`
- [ ] Port all result dataclasses → TypeScript interfaces in `types.ts`
- [ ] Create `vitest.config.ts` with jsdom environment
- [ ] Run `npm run build` and deploy to Vercel

### Phase 1 — Detection Engine
- [ ] `model-manager.ts`: `loadModel(name, url, hash)`, `getModel(name)`, `prefetchModels(names)`, `clearCache()`, `isLoaded(name)`
- [ ] `face-detector.ts`: `FaceDetector` class — `initialize()`, `detect(ImageData): Detection[]`, `close()`
- [ ] `face-landmarker.ts`: same pattern, returns `FaceLandmarksResult`
- [ ] `hand-landmarker.ts`: same pattern, returns `HandLandmarksResult`
- [ ] `pose-landmarker.ts`: same pattern, returns `PoseLandmarksResult`
- [ ] `object-detector.ts`: same pattern, returns `ObjectDetection[]`
- [ ] `image-segmenter.ts`: same pattern, returns `SegmentationResult`
- [ ] `gesture-recognizer.ts`: same pattern, returns `GestureResult[]`
- [ ] `canvas.ts`: `drawRect()`, `drawLabel()`, `drawLandmarks()`, `drawFps()`, `sideBySide()`, `renderSegmentation()`, `downloadCanvas()`
- [ ] Unit tests for each detector with mock MediaPipe (or integration tests with real models in CI)

### Phase 2 — UI Components
- [ ] Card, Button, Slider, Select, Tabs, Badge, Spinner, Alert components
- [ ] `DetectionCanvas.tsx` — accepts `ImageData + Detection[]` → renders overlays on `<canvas>`
- [ ] `ImageUploader.tsx` — drag-and-drop zone, file type validation, preview thumbnail
- [ ] `VideoUploader.tsx` — same for video with duration validation
- [ ] `WebcamView.tsx` — `getUserMedia()` request, `<video>` display, device selector
- [ ] `ResultPanel.tsx` — scrollable detection summary list
- [ ] `ModelSelector.tsx` — toggles for which detectors are active
- [ ] `ConfidenceSlider.tsx` — per-detector or global confidence threshold
- [ ] `AnnotatedImage.tsx` — side-by-side or overlay toggle
- [ ] Header, Footer, Navigation, MobileNav (responsive hamburger)

### Phase 3 — Hooks + Pages
- [ ] `useImageDetection`: state machine (idle → loading_model → processing → done/error), calls detectors, manages canvas
- [ ] `useVideoDetection`: reads video frames via `<video>` + `requestVideoFrameCallback`, processes through detectors, accumulates results
- [ ] `useWebcamDetection`: `requestAnimationFrame` loop, frame capture, detector pipeline, FPS tracking
- [ ] `useModelManager`: tracks which models are loaded/loading, progress percentage, errors
- [ ] Home page: 3 feature cards linking to detection pages, detector badges
- [ ] Image Detection page: upload + select detectors + process + show results
- [ ] Webcam Detection page: start/stop camera, toggle detectors, live overlay, snapshot button
- [ ] Video Detection page: upload video, process frame-by-frame, show results (can be slower, show progress bar)
- [ ] About page: description, tech stack, GitHub link
- [ ] Settings page: default confidence, theme toggle, model cache management

### Phase 4 — API + History
- [ ] `api/upload/route.ts`: accept `multipart/form-data`, validate type/size, upload to Vercel Blob, return URL
- [ ] `api/models/route.ts`: return model registry (CDN URLs + versions + sizes)
- [ ] `api/history/route.ts`: GET list (paginated), POST new entry
- [ ] `api/history/[id]/route.ts`: GET single, DELETE
- [ ] `api/health/route.ts`: `{ status: "ok", timestamp, version }`
- [ ] History page: list of past detections with thumbnail, date, detectors used
- [ ] Results page: view past detection overlays

### Phase 5 — Production Polish
- [ ] Edge middleware: rate limit (30 req/min per IP for uploads)
- [ ] File upload limits: image < 20MB, video < 100MB (enforced client + server)
- [ ] Security headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`
- [ ] Input sanitization: strip EXIF from uploads, validate MIME types server-side
- [ ] Temporary file cleanup: Vercel Blob auto-expiry (24h for unprocessed, 7d for history)
- [ ] Error boundaries at page level + global fallback
- [ ] Loading skeletons for all pages
- [ ] Responsive: 320px → 1920px
- [ ] Dark mode: `prefers-color-scheme` + manual toggle
- [ ] Vercel Analytics integration
- [ ] SEO: `<head>` metadata per page, sitemap.xml
- [ ] Lighthouse: target 90+ score
- [ ] `middleware.ts`: rewrite `/_next/static/models` → CDN

### Phase 6 — Python Cleanup
- [ ] Move all Python files into `python/` directory
- [ ] Update Python imports to account for new structure
- [ ] Create `python/requirements.txt` (same as current)
- [ ] Verify `python -m pytest python/tests/` passes
- [ ] Update `python/README.md` to reference web version
- [ ] Write `docs/MIGRATION.md` explaining architecture change
- [ ] Write `docs/MODEL_UPDATE.md` explaining how to update model versions

---

## 11. Risk Analysis

| Risk | Severity | Probability | Mitigation |
|------|----------|------------|------------|
| `@mediapipe/tasks-vision` WASM not supported in older browsers | Medium | Low | Graceful fallback: show "browser not supported" with supported browser list; Safari 16.4+ supports WASM |
| Webcam `getUserMedia()` blocked by browser permissions or HTTPS requirement | Medium | Medium | Clear permission request UI; explain HTTPS requirement; test in HTTP-only dev with localhost exception |
| Large video processing too slow in browser (single-threaded) | High | Medium | Add Web Worker for frame processing; show progress bar; recommend shorter clips; frame-skipping slider |
| CDN model download failure | Medium | Low | Retry logic with exponential backoff; fallback to GitHub Releases URL; clear error message |
| Vercel free tier limits (100GB bandwidth, 10s function timeout) | Medium | Medium | Most processing is client-side (no serverless timeout issue); bandwidth mainly for initial model download (cached after first visit) |
| Model format changes (MediaPipe .task → .pbtask or new format) | Medium | Low | Pin model versions in registry; monitor MediaPipe changelog; update script in repo |
| Memory exhaustion from large images/videos in browser | Medium | Medium | Downscale images before processing (>2048px → resize); process video in chunks |
| Vercel Blob storage costs at scale | Low | Medium | Auto-expire uploads; warn user if approaching limit; optional self-hosted S3 |
| TypeScript port introduces bugs not in original Python | Medium | Medium | Comprehensive test suite; compare output with Python reference for key test cases |
| Browser tab throttling in background reduces webcam FPS | Low | Medium | Detect `document.hidden`; show warning; pause processing when hidden |

---

## 12. Performance Optimizations

| Optimization | Where | How |
|-------------|-------|-----|
| **Model caching** | Browser | `Cache-Control: immutable` via CDN + `caches.open()` for offline-capable PWA |
| **Model lazy loading** | Browser | Only load models when user activates corresponding detector |
| **WebGL delegate** | Browser | MediaPipe uses WebGL by default; detect WebGPU for faster inference |
| **Frame skipping** | Hooks | `useWebcamDetection`: default every 1st frame; user configurable via slider |
| **Downscaling** | Hooks | Resize input to 640px max dimension before inference (matching original config) |
| **OffscreenCanvas** | Browser | Avoid main thread blocking; workers for video decoding |
| **Image bitmap** | Browser | Use `createImageBitmap()` for faster decode than `<img>` or `FileReader` |
| **requestAnimationFrame throttling** | Browser | Webcam loop uses rAF which auto-pauses when tab is hidden |
| **Memoized results** | Components | React `useMemo` for detection overlay rendering |
| **Canvas dirty rectangles** | DetectionCanvas | Only repaint regions that changed (future optimization) |
| **CDN edge caching** | CDN | Models served from 850+ POPs; versioned URLs ensure cache hit |
| **Compression** | Build | Next.js automatic JS/CSS minification; image optimization via `next/image` |
| **Streaming** | Video | Use MediaSource Extensions for progressive video loading |
| **WASM instantiation** | Browser | Preload WASM binary via `<link rel="preload" as="fetch">` |

---

## 13. Security Measures

| Measure | Implementation |
|---------|---------------|
| **File upload validation** | Client: accept only `image/jpeg, image/png, image/webp, video/mp4` with max size. Server: re-validate MIME type + magic bytes. |
| **Upload limits** | 20MB per image, 100MB per video, 500MB total per session (Vercel Blob limit). Enforce client + server-side. |
| **Rate limiting** | Vercel Edge middleware: 30 requests/min per IP for `/api/upload`, 100 req/min for `/api/*`. |
| **Input sanitization** | Strip EXIF metadata from uploaded images (can contain GPS location). |
| **Temporary file cleanup** | Vercel Blob auto-expiry: 24h for temp uploads, 7d for history entries. |
| **Content Security Policy** | `script-src 'self' 'unsafe-eval'` (WASM needs eval); `worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net` |
| **HTTPS enforced** | Vercel auto-enforces HTTPS; redirect HTTP → HTTPS via `vercel.json` |
| **API authentication** | Optional: NextAuth.js for history features. Public detection features don't require auth. |
| **Dependency scanning** | Dependabot enabled on GitHub for npm security alerts. |
| **No secrets in client** | API keys for Blob storage are server-side only; client never sees them. |
| **CORS** | Restrict API routes to same-origin; no cross-origin requests. |
| **Sanitize detection output** | No user input reflected in HTML; all detection text is hardcoded labels. |

---

## 14. Vercel Deployment Configuration

### `vercel.json`

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/api/**/*.ts": {
      "maxDuration": 10,
      "memory": 512
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

**Note**: The `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers are required for `SharedArrayBuffer` which MediaPipe WASM may use for WebGL optimizations.

### Environment Variables

```
BLOB_READ_WRITE_TOKEN=                  # Vercel Blob storage token
KV_URL=                                # Vercel KV (optional, for history)
KV_REST_API_URL=
KV_REST_API_TOKEN=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MODEL_CDN_BASE=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm/
```

### Build Process

1. `npm install` — installs dependencies
2. `npm run build` — Next.js builds static + serverless bundles
3. `npm run lint` — ESLint check (fails on errors)
4. `npm run test` — Vitest runs (fails on failures)
5. `vercel deploy --prod` — deploys to production

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 15. Migration Strategy from Current Codebase

### Step 1: Fork + Structure

1. Create new repo: `computer-vision-web` (or new branch: `nextjs-web`)
2. Copy existing code into `python/` subdirectory
3. Initialize Next.js project at root

### Step 2: Parallel Development

Both codebases coexist during development:
- **`python/`**: Legacy desktop app, fully functional, tests pass
- **`src/` (root)**: New Next.js web app

### Step 3: Port by Layer

1. Types first (`types.ts` from dataclasses)
2. Configuration (`config.ts` from `config.py`)
3. Detectors (1:1 port, class-by-class, test each)
4. Canvas utils (`canvas.ts` from `visualization.py`)
5. Hooks from pipelines
6. Components
7. Pages

### Step 4: Feature Parity Verification

For each detector, run same test image through both:
- Python: `python/python/main.py --image test.jpg`
- Web: Upload same image via browser
- Compare: number of detections, bounding box coordinates (allow tolerance for different model loading paths)

### Step 5: Sunset/Archive

After web version is stable:
- Keep `python/` in repo as reference for at least 3 months
- Update repo README to point to web version as primary
- Archive `python/` to separate branch: `git mv python/ python/ && git commit -m "archive python to branch" && git checkout -b archive/python`

---

## 16. Estimated Development Effort

| Phase | Description | Days | Team Size | Calendar Days |
|-------|-------------|------|-----------|---------------|
| 0 | Project Scaffolding | 2 | 1 | 2 |
| 1 | Core Detection Engine | 5 | 1-2 | 3-5 |
| 2 | UI Components | 4 | 1 | 4 |
| 3 | Hooks & Pages | 5 | 1 | 5 |
| 4 | API Layer & History | 3 | 1 | 3 |
| 5 | Production Polish | 4 | 1 | 4 |
| 6 | Python Cleanup & Docs | 3 | 1 | 2 |
| **Total** | | **26** | 1 | **20-25** |

**Notes**:
- A single experienced full-stack developer with TypeScript/React/Next.js + computer vision background should complete in ~4-5 weeks.
- Parallelizing Phase 2 (UI Components) with Phase 1 (Detection Engine) reduces calendar time.
- Learning `@mediapipe/tasks-vision` API is the highest unknown — budget 1-2 days for experimentation.
- Python tests serve as the specification for TypeScript tests, reducing design time.

---

## 17. Final Deployment Checklist

- [ ] All 7 detectors working in browser
- [ ] Image upload + detection flow complete
- [ ] Video upload + detection flow complete
- [ ] Webcam detection flow complete
- [ ] Model CDN URLs configured and versioned
- [ ] Model caching via Cache API working
- [ ] Vercel Blob storage configured for uploads
- [ ] API routes implemented and tested locally
- [ ] Rate limiting via Edge middleware active
- [ ] File upload validation (type + size) on both client and server
- [ ] Security headers configured in `vercel.json`
- [ ] Error boundaries on all pages
- [ ] Loading states and skeletons implemented
- [ ] Responsive design tested at 320px, 768px, 1024px, 1440px
- [ ] Dark mode toggle functional
- [ ] Lighthouse audit passes (90+ performance, 90+ accessibility, 90+ best practices, 90+ SEO)
- [ ] Vercel Analytics active
- [ ] `npm run build` succeeds with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run test` passes with >80% coverage
- [ ] `vercel deploy --prod` succeeds
- [ ] Production URL resolves and all pages load
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Custom domain configured (if applicable)
- [ ] README.md written with deploy instructions
- [ ] `.env.example` documents all variables
- [ ] Python archive branch created (`archive/python`)
- [ ] Dependabot configured for security updates
- [ ] Monitoring: Vercel Dashboard checked for errors

---

## 18. Code Preservation: What Stays vs. What Goes

### Keep As-Is (in python/ archive)

- All 7 detector Python files (reference implementations)
- All pipeline Python files (reference for behavior)
- `config.py`, `camera.py`, `utils.py`, `visualization.py`
- All 7 test files + conftest.py
- `main.py` (update imports for python/ prefix)
- `docs/` (PLAN.md, MANUAL.md)

### Refactor from Python to TypeScript

- Configuration model (`config.py` → `config.ts` with Zod)
- Result types (7 frozen dataclasses → 7 TypeScript interfaces in `types.ts`)
- Canvas drawing functions (`visualization.py` → `canvas.ts`)
- Utility functions (`utils.py` → `file.ts`, `logger.ts`)
- Lazy-loading model manager (`mediapipe_tasks.py` → `model-manager.ts`)

### Rewrite in TypeScript

- All 7 detectors (same class structure, different API calls to `@mediapipe/tasks-vision`)
- Pipeline logic (Python classes → React hooks)
- `main.py` CLI → Next.js App Router pages

### Remove (No Replacement Needed)

- `cv2.imshow()` / `cv2.waitKey()` / `cv2.VideoCapture` / `cv2.VideoWriter`
- `argparse` / CLI entry point
- `batch_pipeline.py` (not needed in web context; could be added later as a serverless batch job)
- `sounddevice` dependency
- `matplotlib` dependency
- `scripts/profile_pipeline.py`
- `src/processors/` empty placeholder
