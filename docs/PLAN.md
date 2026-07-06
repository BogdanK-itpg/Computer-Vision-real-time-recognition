# Computer Vision Application — Development Plan

## Overview
Build a production-ready, modular computer vision application using Python 3.12+, Google MediaPipe Tasks API, OpenCV, and related tools. The application supports real-time webcam processing, image/video file analysis, and is extensible to future MediaPipe features.

---

## Phase 1: Project Setup & Environment

| Step | Task | Details |
|------|------|---------|
| 1.1 | Create project directory | `D:\Projects\computer_vision` |
| 1.2 | Create Python virtual environment | `python -m venv .venv` inside project root |
| 1.3 | Activate environment | `.venv\Scripts\activate` (Windows) |
| 1.4 | Install core dependencies | `mediapipe`, `opencv-python`, `numpy`, `matplotlib` |
| 1.5 | Generate `requirements.txt` | `pip freeze > requirements.txt` |
| 1.6 | Create `.gitignore` | Exclude `.venv/`, `__pycache__/`, `*.pyc`, `output/`, `.vscode/` |
| 1.7 | Configure VS Code settings | `.vscode/settings.json` — interpreter, linting, format-on-save |
| 1.8 | Recommend VS Code extensions | Python, Pylance, GitLens, Black Formatter, Even Better TOML |
| 1.9 | Initialize Git repo | `git init`, initial commit |
| 1.10 | Verify setup | Run a smoke test importing all major packages |

**Deliverables:** Working venv, installed deps, `.gitignore`, `.vscode/settings.json`, `requirements.txt`, initial Git commit.

---

## Phase 2: Project Scaffold & Configuration

| Step | Task | Details |
|------|------|---------|
| 2.1 | Create directory structure | `assets/` (images, videos, models), `data/`, `output/`, `src/`, `tests/`, `docs/` |
| 2.2 | Create `src/__init__.py` | Package init |
| 2.3 | Create `src/config.py` | `dataclass`-based config: camera index, paths, thresholds, logging level, output dirs. Use `pathlib.Path`. No hardcoded values. |
| 2.4 | Create `src/utils.py` | Logging setup, file/path validation, decorators (timing, exception handling) |
| 2.5 | Create `src/camera.py` | Unified camera/image/video source abstraction. Supports webcam (`cv2.VideoCapture`), image file, video file. |
| 2.6 | Create `src/mediapipe_tasks.py` | MediaPipe Tasks wrapper. Lazy loading, model validation, init/inference separation. |
| 2.7 | Create `src/visualization.py` | Drawing helpers: landmarks, bounding boxes, labels, side-by-side, save annotated output |
| 2.8 | Create `main.py` | Entry point — CLI or config-driven orchestration |
| 2.9 | Create `pyproject.toml` | Project metadata, dependencies, build system |
| 2.10 | Create `README.md` | Installation, usage, features overview |

**Deliverables:** Full `src/` package, config system, camera abstraction, MediaPipe wrapper, visualization helpers, `main.py`, `pyproject.toml`, `README.md`.

---

## Phase 3: MediaPipe Task Implementations

Each task follows the workflow: Plan → Implement → Test → Debug → Refactor → Document.

### 3.1 Face Detector
- **File:** `src/detectors/face_detector.py`
- Load Face Detector model from `assets/models/`
- Detect faces in images/video frames
- Return bounding boxes, keypoints, confidence scores
- Configurable confidence threshold

### 3.2 Face Landmarker
- **File:** `src/detectors/face_landmarker.py`
- Load Face Landmarker model
- Detect 478 face landmarks per face
- Blend shapes and face geometry
- Integration with visualization module

### 3.3 Hand Landmarker
- **File:** `src/detectors/hand_landmarker.py`
- Load Hand Landmarker model
- Detect 21 hand landmarks per hand
- Multi-hand support (left/right classification)
- Gesture recognition foundation

### 3.4 Pose Landmarker
- **File:** `src/detectors/pose_landmarker.py`
- Load Pose Landmarker model
- Detect 33 pose landmarks
- Full-body tracking

### 3.5 Object Detector
- **File:** `src/detectors/object_detector.py`
- Load Object Detector model (EfficientDet / SSD)
- Bounding box + category label output
- Configurable top-K results

### 3.6 Image Segmenter
- **File:** `src/detectors/image_segmenter.py`
- Load Image Segmenter model
- Output segmentation masks
- Support for multiple categories

### 3.7 Gesture Recognizer
- **File:** `src/detectors/gesture_recognizer.py`
- Combines Hand Landmarker + classifier
- Recognizes predefined gestures
- Custom gesture training support

**Deliverables per module:** Complete, tested detector class with type hints, docstrings, logging, error handling, configurable thresholds, model path validation.

---

## Phase 4: Processing Pipelines

| Step | Task | Details |
|------|------|---------|
| 4.1 | Single-image pipeline | Load → detect → annotate → save/display |
| 4.2 | Video-file pipeline | Frame-by-frame processing with output video saving |
| 4.3 | Live webcam pipeline | Real-time loop with FPS display, quit on keypress |
| 4.4 | Multi-model pipeline | Run multiple detectors on same input (e.g., face + hand + pose) |
| 4.5 | Batch processing | Process directory of images/videos with progress feedback |

**Deliverables:** `src/pipelines/` module with composable, reusable pipeline classes.

---

## Phase 5: Testing

| Step | Task | Details |
|------|------|---------|
| 5.1 | Test config loading | Unit tests for `config.py` |
| 5.2 | Test camera sources | Mock `cv2.VideoCapture` for webcam, file-based test for image/video |
| 5.3 | Test each detector | Test with known input, verify output structure |
| 5.4 | Test visualization | Verify drawing functions produce correct output shapes |
| 5.5 | Test pipelines | Integration tests end-to-end |
| 5.6 | Edge case tests | No face, blurry image, empty frame, model file missing, low confidence |

**Deliverables:** `tests/` directory with `pytest` suite, test fixtures, conftest.py, CI-ready.

---

## Phase 6: Performance Optimization

| Step | Task | Details |
|------|------|---------|
| 6.1 | Profile bottlenecks | `cProfile` / `py-spy` on main pipeline |
| 6.2 | Reduce memory allocations | Reuse buffers, pre-allocate numpy arrays |
| 6.3 | MediaPipe instance reuse | Cache task instances, avoid repeated init |
| 6.4 | Frame skipping | Process every Nth frame for video/pipelines |
| 6.5 | Multithreading | Separate camera I/O from processing (if beneficial) |
| 6.6 | GPU consideration | Verify MediaPipe GPU delegate availability |

**Deliverables:** Profiling report, optimized pipeline code, documented performance trade-offs.

---

## Phase 7: Documentation & Polish

| Step | Task | Details |
|------|------|---------|
| 7.1 | Complete README | Installation, quickstart, API overview, examples, troubleshooting |
| 7.2 | Add example scripts | `examples/` directory with runnable demos |
| 7.3 | Generate API docs | Docstrings → Sphinx or mkdocs (if appropriate) |
| 7.4 | Add sample assets | Placeholder/test images in `assets/images/` |
| 7.5 | Final `.gitignore` review | Ensure no generated/output files tracked |
| 7.6 | Final commit | Tagged release (v1.0.0) |

**Deliverables:** Comprehensive README, example scripts, API documentation, clean Git history.

---

## File Tree (Final)

```
D:\Projects\computer_vision\
├── .venv\
├── .vscode\
│   └── settings.json
├── assets\
│   ├── images\
│   ├── videos\
│   └── models\
├── data\
├── docs\
├── examples\
├── output\
├── src\
│   ├── __init__.py
│   ├── config.py
│   ├── camera.py
│   ├── mediapipe_tasks.py
│   ├── visualization.py
│   ├── utils.py
│   ├── detectors\
│   │   ├── __init__.py
│   │   ├── face_detector.py
│   │   ├── face_landmarker.py
│   │   ├── hand_landmarker.py
│   │   ├── pose_landmarker.py
│   │   ├── object_detector.py
│   │   ├── image_segmenter.py
│   │   └── gesture_recognizer.py
│   ├── processors\
│   │   ├── __init__.py
│   │   └── ...
│   └── pipelines\
│       ├── __init__.py
│       ├── image_pipeline.py
│       ├── video_pipeline.py
│       ├── webcam_pipeline.py
│       └── batch_pipeline.py
├── tests\
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_config.py
│   ├── test_camera.py
│   ├── test_detectors.py
│   ├── test_visualization.py
│   └── test_pipelines.py
├── main.py
├── PLAN.md
├── pyproject.toml
├── README.md
├── requirements.txt
└── .gitignore
```

---

## Guiding Principles

- **One step at a time** — each phase requires confirmation before proceeding.
- **Production quality** — type hints, docstrings, logging, error handling everywhere.
- **Configurable** — no hardcoded paths or magic numbers.
- **Testable** — every module designed for unit testing.
- **Extensible** — new detectors/processors/pipelines plug in with minimal friction.
- **Latest APIs** — MediaPipe Tasks API only, no deprecated Solutions API.
