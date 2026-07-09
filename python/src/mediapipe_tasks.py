from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional

import mediapipe as mp
from mediapipe.tasks.python.vision import (
    FaceDetector as MpFaceDetector,
    FaceDetectorOptions,
    FaceLandmarker as MpFaceLandmarker,
    FaceLandmarkerOptions,
    HandLandmarker as MpHandLandmarker,
    HandLandmarkerOptions,
    PoseLandmarker as MpPoseLandmarker,
    PoseLandmarkerOptions,
    ObjectDetector as MpObjectDetector,
    ObjectDetectorOptions,
    ImageSegmenter as MpImageSegmenter,
    ImageSegmenterOptions,
    GestureRecognizer as MpGestureRecognizer,
    GestureRecognizerOptions,
    RunningMode,
)

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)

_TASK_CLASSES = {
    "face_detector": (MpFaceDetector, FaceDetectorOptions),
    "face_landmarker": (MpFaceLandmarker, FaceLandmarkerOptions),
    "hand_landmarker": (MpHandLandmarker, HandLandmarkerOptions),
    "pose_landmarker": (MpPoseLandmarker, PoseLandmarkerOptions),
    "object_detector": (MpObjectDetector, ObjectDetectorOptions),
    "image_segmenter": (MpImageSegmenter, ImageSegmenterOptions),
    "gesture_recognizer": (MpGestureRecognizer, GestureRecognizerOptions),
}


class MediaPipeTaskManager:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._instances: dict[str, Any] = {}

    def load(self, task_type: str) -> Any:
        if task_type in self._instances:
            return self._instances[task_type]

        model_path = self._config.model_path(task_type)
        if model_path is None:
            raise ValueError(f"No model path configured for: {task_type}")
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Invalid model path for {task_type}: {model_path}")

        if task_type not in _TASK_CLASSES:
            raise ValueError(f"Unknown task type: {task_type}")

        task_cls, opts_cls = _TASK_CLASSES[task_type]
        confidence = getattr(self._config, f"{task_type}_confidence", 0.5)
        max_results = self._config.max_results

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))

        if task_type in ("face_detector", "object_detector"):
            options = opts_cls(
                base_options=base_options,
                running_mode=RunningMode.IMAGE,
                score_threshold=confidence,
                max_results=max_results,
            )
        elif task_type == "image_segmenter":
            options = opts_cls(
                base_options=base_options,
                running_mode=RunningMode.IMAGE,
            )
        else:
            options = opts_cls(
                base_options=base_options,
                running_mode=RunningMode.IMAGE,
                min_face_detection_confidence=confidence,
                min_face_suppression_threshold=0.3,
                min_face_landmarker_confidence=confidence,
            )

        instance = task_cls.create_from_options(options)
        self._instances[task_type] = instance
        logger.info("Loaded MediaPipe task: %s (model: %s)", task_type, model_path)
        return instance

    def get(self, task_type: str) -> Any:
        instance = self._instances.get(task_type)
        if instance is None:
            return self.load(task_type)
        return instance

    def close_all(self) -> None:
        for task_type, instance in self._instances.items():
            try:
                instance.close()
                logger.debug("Closed task: %s", task_type)
            except Exception as e:
                logger.warning("Error closing task %s: %s", task_type, e)
        self._instances.clear()
