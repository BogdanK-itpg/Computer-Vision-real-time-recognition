# Model Update Process

This document describes how to update MediaPipe model files used by both the Python reference implementation and the web application.

## Overview

MediaPipe models are distributed as `.task` or `.tflite` files from Google's MediaPipe Model Zoo. The web app loads them from CDN; the Python app loads them from local disk.

## Models Used

| Detector | Model File | Source |
|----------|-----------|--------|
| Face Detector | `blaze_face_short_range.tflite` | MediaPipe Model Zoo |
| Face Landmarker | `face_landmarker.task` | MediaPipe Model Zoo |
| Hand Landmarker | `hand_landmarker.task` | MediaPipe Model Zoo |
| Pose Landmarker | `pose_landmarker.task` | MediaPipe Model Zoo |
| Object Detector | `object_detector.task` | EfficientDet-Lite0 |
| Image Segmenter | `image_segmenter.task` | Selfie Segmenter |
| Gesture Recognizer | `gesture_recognizer.task` | MediaPipe Model Zoo |

## Web App: Updating CDN Model URLs

Model URLs are defined in the model registry (see `src/lib/config.ts`):

```typescript
// src/lib/config.ts
export const MODEL_REGISTRY = {
  face_detector: {
    url: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/face_detector.tflite",
    version: "latest",
  },
  // ... other models
};
```

To update a model version:
1. Find the new model URL from the MediaPipe Model Zoo
2. Update the `url` in `MODEL_REGISTRY`
3. Update the `version` string
4. Test detection accuracy with known inputs

## Python App: Updating Local Model Files

Model file paths are defined in `python/src/config.py`:

```python
@dataclass(frozen=True)
class Config:
    face_detector_model: Path = Path("assets/models/blaze_face_short_range.tflite")
    # ...
```

To update:
1. Download the new model file from the MediaPipe Model Zoo
2. Replace the file in `python/assets/models/`
3. Update the filename in `python/src/config.py` if the name changed
4. Re-run the test suite

## Keeping Models in Sync

The Python and web versions should use the same model versions to produce comparable results. When updating models:

1. **Update Python first**: Download new model to `python/assets/models/`, verify tests pass
2. **Update web**: Change the CDN URL in `src/lib/config.ts` to match the new version
3. **Verify parity**: Run the same test image through both versions and compare detection counts

## CDN Caching

The web app uses `Cache-Control: immutable` headers from CDN. After updating a model URL, the old cached version will be used until:
- The URL changes (version bump in URL path)
- The user clears their browser cache
- The Cache API entry is evicted (controlled by `version` field in `MODEL_REGISTRY`)

## Version History

| Date | Model Version | Changes |
|------|--------------|---------|
| - | Initial | Original model files from MediaPipe |
