# Computer Vision Application

Production-ready computer vision application using Google MediaPipe Tasks API and Python 3.12+.

## Features

- **Face Detection** — BlazeFace short-range model
- **Face Landmarking** — 478-point face mesh
- **Hand Landmarking** — 21-point hand skeleton with left/right classification
- **Pose Landmarking** — 33-point body pose estimation
- **Object Detection** — EfficientDet-Lite0 (91 COCO categories)
- **Image Segmentation** — Selfie segmentation
- **Gesture Recognition** — Canned gesture classification
- **Multiple Input Modes** — Webcam, image files, video files, batch directory processing
- **Modular Pipeline Architecture** — Composable pipelines for different use cases

## Installation

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Model files are downloaded automatically on first use via the detector initialization.

## Usage

```bash
# Webcam mode (default)
python main.py

# Single image
python main.py --image path/to/image.jpg

# Video file
python main.py --video path/to/video.mp4

# Batch process directory
python main.py --batch

# With GPU delegate
python main.py --gpu

# Frame skipping (process every Nth frame)
python main.py --video path/to/video.mp4 --frame-skip 2
```

## Project Structure

```
src/
├── config.py               # Dataclass-based configuration
├── camera.py               # Camera/source abstraction (webcam, image, video)
├── mediapipe_tasks.py      # MediaPipe Tasks API wrapper
├── utils.py                # Helper utilities
├── visualization.py        # Drawing, annotation, display functions
├── detectors/
│   ├── face_detector.py
│   ├── face_landmarker.py
│   ├── hand_landmarker.py
│   ├── pose_landmarker.py
│   ├── object_detector.py
│   ├── image_segmenter.py
│   └── gesture_recognizer.py
├── pipelines/
│   ├── base_pipeline.py    # Abstract base pipeline
│   ├── image_pipeline.py   # Single-image processing
│   ├── video_pipeline.py   # Video file processing
│   ├── webcam_pipeline.py  # Real-time webcam processing
│   └── batch_pipeline.py   # Directory batch processing
└── main.py                 # CLI entry point
```

## Testing

```bash
pytest tests/ -v
```

## Performance

- Detector models reuse the same instance across frames (init once, infer many)
- Frame skipping configurable for video/webcam pipelines
- GPU delegate support (set `--gpu` flag)
- All detectors run in CPU mode by default with XNNPACK optimization

## Model Files

Models are downloaded from Google's MediaPipe model zoo:

| Model | File | Size |
|-------|------|------|
| Face Detector | `blaze_face_short_range.tflite` | 224 KB |
| Face Landmarker | `face_landmarker.task` | 3.6 MB |
| Hand Landmarker | `hand_landmarker.task` | 7.5 MB |
| Pose Landmarker | `pose_landmarker_lite.task` | 5.5 MB |
| Object Detector | `efficientdet_lite0.tflite` | 6.9 MB |
| Image Segmenter | `selfie_segmenter.tflite` | 244 KB |
| Gesture Recognizer | `gesture_recognizer.task` | 7.8 MB |
