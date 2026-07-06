from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import FaceDetector as MpFaceDetector
from mediapipe.tasks.python.vision import FaceDetectorOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Detection:
    bounding_box: tuple[int, int, int, int]
    keypoints: list[tuple[float, float]]
    score: float


class FaceDetector:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._detector: Any = None

    def initialize(self) -> None:
        model_path = self._config.face_detector_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Face detector model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = FaceDetectorOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            min_detection_confidence=self._config.face_detection_confidence,
        )
        self._detector = MpFaceDetector.create_from_options(options)
        logger.info("FaceDetector initialized (threshold=%.2f)", self._config.face_detection_confidence)

    def detect(self, image: np.ndarray) -> list[Detection]:
        if self._detector is None:
            raise RuntimeError("FaceDetector not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._detector.detect(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> list[Detection]:
        detections: list[Detection] = []
        if result.detections is None:
            return detections

        for detection in result.detections:
            bbox = detection.bounding_box
            box = (bbox.origin_x, bbox.origin_y, bbox.width, bbox.height)
            kps = [(kp.x, kp.y) for kp in detection.keypoints]
            detections.append(Detection(
                bounding_box=box,
                keypoints=kps,
                score=detection.categories[0].score,
            ))

        return detections

    def close(self) -> None:
        if self._detector is not None:
            self._detector.close()
            self._detector = None
            logger.debug("FaceDetector closed")
