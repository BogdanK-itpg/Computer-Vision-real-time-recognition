from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import FaceLandmarker as MpFaceLandmarker
from mediapipe.tasks.python.vision import FaceLandmarkerOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FaceLandmarksResult:
    face_landmarks: list[list[tuple[float, float, float]]]
    blend_shapes: Optional[list[dict[str, float]]]


class FaceLandmarker:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._landmarker: Any = None

    def initialize(self) -> None:
        model_path = self._config.face_landmarker_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Face landmarker model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            num_faces=self._config.max_results,
            min_face_detection_confidence=self._config.face_landmarker_confidence,
            min_face_presence_confidence=self._config.face_landmarker_confidence,
            output_face_blendshapes=False,
        )
        self._landmarker = MpFaceLandmarker.create_from_options(options)
        logger.info("FaceLandmarker initialized")

    def detect(self, image: np.ndarray) -> Optional[FaceLandmarksResult]:
        if self._landmarker is None:
            raise RuntimeError("FaceLandmarker not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._landmarker.detect(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> Optional[FaceLandmarksResult]:
        if not result.face_landmarks:
            return None

        landmarks_list = []
        for face_landmarks in result.face_landmarks:
            points = [(lm.x, lm.y, lm.z) for lm in face_landmarks]
            landmarks_list.append(points)

        blend_shapes_list: Optional[list[dict[str, float]]] = None
        if result.face_blendshapes:
            blend_shapes_list = []
            for blendshapes in result.face_blendshapes:
                bs_dict = {bs.category_name: bs.score for bs in blendshapes}
                blend_shapes_list.append(bs_dict)

        return FaceLandmarksResult(
            face_landmarks=landmarks_list,
            blend_shapes=blend_shapes_list,
        )

    def close(self) -> None:
        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None
            logger.debug("FaceLandmarker closed")
