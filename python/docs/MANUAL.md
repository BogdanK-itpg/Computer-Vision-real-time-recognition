# Computer Vision Application — Manual

## Overview

Production-ready computer vision application using Google MediaPipe Tasks API, OpenCV, and Python 3.12+. Supports real-time webcam processing, image/video file analysis, and batch processing.

---

## Quick Start

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run with webcam (default)
python main.py

# Run with specific modes
python main.py --image path/to/image.jpg
python main.py --video path/to/video.mp4
python main.py --batch
```

---

## CLI Reference

| Argument | Short | Type | Default | Description |
|----------|-------|------|---------|-------------|
| `--image` | `-i` | Path | — | Path to input image file |
| `--video` | `-v` | Path | — | Path to input video file |
| `--camera` | | int | `0` | Camera index |
| `--batch` | | flag | `false` | Process all assets in `assets/images/` and `assets/videos/` |
| `--frame-skip` | | int | `0` | Process every Nth frame (0 = all) |
| `--gpu` | | flag | `false` | Use GPU delegate if available |
| `--confidence` | | float | `0.5` | Detection confidence threshold |
| `--max-results` | | int | `5` | Max results per detector |

---

## Pipelines

### 1. Webcam Pipeline (default)
- Runs **6 detectors simultaneously** in real-time
- Displays annotated frames with FPS counter
- Press **ESC** to quit
- Supports frame skipping for performance

### 2. Image Pipeline
- Processes a single image file
- Runs all 6 detectors + image segmentation
- Saves annotated output to `output/annotated_<name>.jpg`

### 3. Video Pipeline
- Processes a video file frame-by-frame
- Runs face detection + object detection
- Saves annotated video to `output/processed_<name>.mp4`
- Supports frame skipping

### 4. Batch Pipeline
- Processes all images in `assets/images/`
- Processes all videos in `assets/videos/`
- Uses face detection + object detection for images
- Delegates video processing to VideoPipeline

---

## Detection Modules

### Face Detector (`src/detectors/face_detector.py`)
- **Model:** `assets/models/blaze_face_short_range.tflite`
- Returns bounding boxes, 6 keypoints (eyes, ears, nose, mouth), confidence score
- Configurable confidence threshold

### Face Landmarker (`src/detectors/face_landmarker.py`)
- **Model:** `assets/models/face_landmarker.task`
- Returns 478 landmarks per face with optional blend shapes (facial expressions)

### Hand Landmarker (`src/detectors/hand_landmarker.py`)
- **Model:** `assets/models/hand_landmarker.task`
- Returns 21 landmarks per hand with left/right handedness classification
- Supports multiple hands

### Pose Landmarker (`src/detectors/pose_landmarker.py`)
- **Model:** `assets/models/pose_landmarker.task`
- Returns 33 body pose landmarks with optional segmentation mask

### Object Detector (`src/detectors/object_detector.py`)
- **Model:** `assets/models/object_detector.task`
- Returns bounding boxes with category labels and confidence scores
- Configurable top-K results

### Image Segmenter (`src/detectors/image_segmenter.py`)
- **Model:** `assets/models/image_segmenter.task`
- Returns per-pixel confidence masks and optional category mask
- Currently only used in ImagePipeline

### Gesture Recognizer (`src/detectors/gesture_recognizer.py`)
- **Model:** `assets/models/gesture_recognizer.task`
- Returns gesture name, score, hand landmarks, and handedness
- Combines hand landmarking with gesture classification

---

## Project Structure

```
Computer-Vision-real-time-recognition/
├── assets/
│   ├── images/          # Input images for batch pipeline
│   ├── videos/          # Input videos for batch pipeline
│   └── models/          # MediaPipe .task / .tflite model files
├── data/                # Runtime data directory
├── docs/
│   ├── PLAN.md          # Development plan
│   └── MANUAL.md        # This manual
├── output/              # Annotated outputs
├── src/
│   ├── config.py        # Dataclass-based configuration
│   ├── camera.py        # Webcam / Image / Video source abstraction
│   ├── mediapipe_tasks.py  # MediaPipe task manager (lazy loading)
│   ├── visualization.py # Drawing utilities (boxes, landmarks, text, FPS)
│   ├── utils.py         # Logging, path validation, file I/O
│   ├── detectors/       # Individual detector implementations
│   │   ├── face_detector.py
│   │   ├── face_landmarker.py
│   │   ├── hand_landmarker.py
│   │   ├── pose_landmarker.py
│   │   ├── object_detector.py
│   │   ├── image_segmenter.py
│   │   └── gesture_recognizer.py
│   ├── processors/      # Placeholder for future processors
│   └── pipelines/       # Processing pipelines
│       ├── base_pipeline.py
│       ├── image_pipeline.py
│       ├── video_pipeline.py
│       ├── webcam_pipeline.py
│       └── batch_pipeline.py
├── tests/
│   ├── conftest.py      # Shared fixtures (test config, blank/color images, tmp paths)
│   ├── test_config.py
│   ├── test_camera.py
│   ├── test_detectors.py
│   ├── test_visualization.py
│   └── test_pipelines.py
├── main.py              # Entry point
├── pyproject.toml
├── requirements.txt
└── README.md
```

---

## Configuration (`src/config.py`)

All configuration is in the `Config` dataclass with sensible defaults:

### Camera Settings
| Field | Default | Description |
|-------|---------|-------------|
| `camera_index` | `0` | Webcam device index |
| `camera_width` | `640` | Frame width |
| `camera_height` | `480` | Frame height |
| `camera_fps` | `30` | Target FPS |

### Model Paths
| Field | Default |
|-------|---------|
| `face_detector_model` | `assets/models/blaze_face_short_range.tflite` |
| `face_landmarker_model` | `assets/models/face_landmarker.task` |
| `hand_landmarker_model` | `assets/models/hand_landmarker.task` |
| `pose_landmarker_model` | `assets/models/pose_landmarker.task` |
| `object_detector_model` | `assets/models/object_detector.task` |
| `image_segmenter_model` | `assets/models/image_segmenter.task` |
| `gesture_recognizer_model` | `assets/models/gesture_recognizer.task` |

### Confidence Thresholds
Each detector has an independent confidence threshold (default: `0.5`):
- `face_detection_confidence`
- `face_landmarker_confidence`
- `hand_landmarker_confidence`
- `pose_landmarker_confidence`
- `object_detection_confidence`
- `segmentation_confidence`
- `gesture_confidence`

### Directory Paths
Auto-created on Config init:
- `assets_dir` → `assets/`
- `models_dir` → `assets/models/`
- `images_dir` → `assets/images/`
- `videos_dir` → `assets/videos/`
- `output_dir` → `output/`
- `data_dir` → `data/`

---

## Camera Sources (`src/camera.py`)

Three source types share the `CameraSource` ABC:

| Source | Class | Input |
|--------|-------|-------|
| Webcam | `WebcamSource` | Camera index |
| Image | `ImageFileSource` | Image file path |
| Video | `VideoFileSource` | Video file path |

`create_source(config)` auto-selects based on config (video > image > webcam).

All sources:
- Convert to RGB (OpenCV default is BGR)
- Implement context manager (`with` statement)
- Yield frames via `.frames()` generator

---

## Running Tests

```bash
pytest tests/
```

### Test Fixtures (`tests/conftest.py`)
- `test_config` — Default `Config()` instance
- `blank_image` — 640×480 black image
- `color_image` — 640×480 gray image
- `test_image_path` — Temporary 100×100 test image
- `test_video_path` — Temporary 5-frame test video

---

## Model Files

MediaPipe task models go in `assets/models/`. These are not included in the repo — download from [MediaPipe Models](https://ai.google.dev/edge/mediapipe/solutions/vision):

| Model | Source |
|-------|--------|
| `blaze_face_short_range.tflite` | Face Detector |
| `face_landmarker.task` | Face Landmarker |
| `hand_landmarker.task` | Hand Landmarker |
| `pose_landmarker.task` | Pose Landmarker |
| `object_detector.task` | Object Detector (EfficientDet/Lite) |
| `image_segmenter.task` | Image Segmenter (Selfie/DeepLab) |
| `gesture_recognizer.task` | Gesture Recognizer |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `mediapipe` | Core computer vision models (Tasks API) |
| `opencv-python` | Camera I/O, image manipulation, display |
| `numpy` | Array operations, image data |
| `matplotlib` | Visualization utilities |
| `pytest` | Test framework |
| `sounddevice` | Audio support (future use) |

Python 3.12+ required.

---

## Key Design Principles

1. **Configurable** — Paths, thresholds, and modes are driven by `Config`, never hardcoded
2. **Lazy loading** — MediaPipe models are loaded on first use via `MediaPipeTaskManager`
3. **Context managers** — Camera sources and task managers support `with` statements for safe cleanup
4. **Error isolation** — Each detector runs in a try/except block, one failure doesn't crash the pipeline
5. **RGB consistency** — All frames converted to RGB at the source, visualization converts back to BGR for OpenCV display/save
6. **GPU support** — `--gpu` flag enables GPU delegate (requires compatible MediaPipe build)

---

## Performance Tips

- Use `--frame-skip N` to process every Nth frame (webcam and video)
- Lower `--confidence` to catch more detections (at cost of more false positives)
- Lower `--max-results` to reduce per-frame processing time
- Each pipeline only loads the detectors it uses — webcam loads all 6, video loads 2
