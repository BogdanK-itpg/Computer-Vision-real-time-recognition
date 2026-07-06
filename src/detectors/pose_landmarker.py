from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import PoseLandmarker as MpPoseLandmarker
from mediapipe.tasks.python.vision import PoseLandmarkerOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PoseLandmarksResult:
    pose_landmarks: list[list[tuple[float, float, float]]]
    segmentation_mask: Optional[np.ndarray]


class PoseLandmarker:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._landmarker: Any = None

    def initialize(self) -> None:
        model_path = self._config.pose_landmarker_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Pose landmarker model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            num_poses=self._config.max_results,
            min_pose_detection_confidence=self._config.pose_landmarker_confidence,
            min_pose_presence_confidence=self._config.pose_landmarker_confidence,
            output_segmentation_masks=False,
        )
        self._landmarker = MpPoseLandmarker.create_from_options(options)
        logger.info("PoseLandmarker initialized")

    def detect(self, image: np.ndarray) -> Optional[PoseLandmarksResult]:
        if self._landmarker is None:
            raise RuntimeError("PoseLandmarker not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._landmarker.detect(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> Optional[PoseLandmarksResult]:
        if not result.pose_landmarks:
            return None

        landmarks_list = []
        for pose_landmarks in result.pose_landmarks:
            points = [(lm.x, lm.y, lm.z) for lm in pose_landmarks]
            landmarks_list.append(points)

        seg_mask: Optional[np.ndarray] = None
        if result.segmentation_masks:
            seg_mask = result.segmentation_masks[0].numpy_view()

        return PoseLandmarksResult(
            pose_landmarks=landmarks_list,
            segmentation_mask=seg_mask,
        )

    def close(self) -> None:
        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None
            logger.debug("PoseLandmarker closed")
