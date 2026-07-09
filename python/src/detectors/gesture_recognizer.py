from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.components.processors.classifier_options import (
    ClassifierOptions,
)
from mediapipe.tasks.python.vision import GestureRecognizer as MpGestureRecognizer
from mediapipe.tasks.python.vision import GestureRecognizerOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GestureResult:
    gesture_name: str
    score: float
    hand_landmarks: list[tuple[float, float, float]]
    handedness: str


class GestureRecognizer:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._recognizer: Any = None

    def initialize(self) -> None:
        model_path = self._config.gesture_recognizer_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Gesture recognizer model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        gesture_options = ClassifierOptions(
            score_threshold=self._config.gesture_confidence,
            max_results=1,
        )
        options = GestureRecognizerOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            num_hands=self._config.max_results,
            min_hand_detection_confidence=self._config.gesture_confidence,
            min_hand_presence_confidence=self._config.gesture_confidence,
            canned_gesture_classifier_options=gesture_options,
        )
        self._recognizer = MpGestureRecognizer.create_from_options(options)
        logger.info("GestureRecognizer initialized")

    def recognize(self, image: np.ndarray) -> list[GestureResult]:
        if self._recognizer is None:
            raise RuntimeError("GestureRecognizer not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._recognizer.recognize(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> list[GestureResult]:
        gestures: list[GestureResult] = []
        if not result.gestures:
            return gestures

        for i, gesture_list in enumerate(result.gestures):
            top_gesture = gesture_list[0]
            hand_landmarks = result.hand_landmarks[i] if result.hand_landmarks else []
            landmarks = [(lm.x, lm.y, lm.z) for lm in hand_landmarks]

            handedness = "Unknown"
            if result.handedness and i < len(result.handedness):
                handedness = result.handedness[i][0].category_name

            gestures.append(GestureResult(
                gesture_name=top_gesture.category_name,
                score=top_gesture.score,
                hand_landmarks=landmarks,
                handedness=handedness,
            ))

        return gestures

    def close(self) -> None:
        if self._recognizer is not None:
            self._recognizer.close()
            self._recognizer = None
            logger.debug("GestureRecognizer closed")
