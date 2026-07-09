from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import ObjectDetector as MpObjectDetector
from mediapipe.tasks.python.vision import ObjectDetectorOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ObjectDetection:
    bounding_box: tuple[int, int, int, int]
    category_name: str
    score: float


class ObjectDetector:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._detector: Any = None

    def initialize(self) -> None:
        model_path = self._config.object_detector_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Object detector model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = ObjectDetectorOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            score_threshold=self._config.object_detection_confidence,
            max_results=self._config.max_results,
        )
        self._detector = MpObjectDetector.create_from_options(options)
        logger.info("ObjectDetector initialized")

    def detect(self, image: np.ndarray) -> list[ObjectDetection]:
        if self._detector is None:
            raise RuntimeError("ObjectDetector not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._detector.detect(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> list[ObjectDetection]:
        detections: list[ObjectDetection] = []
        if result.detections is None:
            return detections

        for detection in result.detections:
            bbox = detection.bounding_box
            box = (bbox.origin_x, bbox.origin_y, bbox.width, bbox.height)
            category = detection.categories[0]
            detections.append(ObjectDetection(
                bounding_box=box,
                category_name=category.category_name,
                score=category.score,
            ))

        return detections

    def close(self) -> None:
        if self._detector is not None:
            self._detector.close()
            self._detector = None
            logger.debug("ObjectDetector closed")
