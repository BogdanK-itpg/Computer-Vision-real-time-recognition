from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import HandLandmarker as MpHandLandmarker
from mediapipe.tasks.python.vision import HandLandmarkerOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class HandLandmarksResult:
    hand_landmarks: list[list[tuple[float, float, float]]]
    handedness: list[str]
    handedness_scores: list[float]


class HandLandmarker:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._landmarker: Any = None

    def initialize(self) -> None:
        model_path = self._config.hand_landmarker_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Hand landmarker model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = HandLandmarkerOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            num_hands=self._config.max_results,
            min_hand_detection_confidence=self._config.hand_landmarker_confidence,
            min_hand_presence_confidence=self._config.hand_landmarker_confidence,
        )
        self._landmarker = MpHandLandmarker.create_from_options(options)
        logger.info("HandLandmarker initialized")

    def detect(self, image: np.ndarray) -> Optional[HandLandmarksResult]:
        if self._landmarker is None:
            raise RuntimeError("HandLandmarker not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._landmarker.detect(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> Optional[HandLandmarksResult]:
        if not result.hand_landmarks:
            return None

        landmarks_list = []
        for hand_landmarks in result.hand_landmarks:
            points = [(lm.x, lm.y, lm.z) for lm in hand_landmarks]
            landmarks_list.append(points)

        handedness = []
        handedness_scores = []
        if result.handedness:
            for classification_list in result.handedness:
                top = classification_list[0]
                handedness.append(top.category_name)
                handedness_scores.append(top.score)

        return HandLandmarksResult(
            hand_landmarks=landmarks_list,
            handedness=handedness,
            handedness_scores=handedness_scores,
        )

    def close(self) -> None:
        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None
            logger.debug("HandLandmarker closed")
