from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import ImageSegmenter as MpImageSegmenter
from mediapipe.tasks.python.vision import ImageSegmenterOptions, RunningMode

from src.config import Config
from src.utils import validate_model_path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SegmentationResult:
    confidence_masks: list[np.ndarray]
    category_mask: Optional[np.ndarray]


class ImageSegmenter:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._segmenter: Any = None

    def initialize(self) -> None:
        model_path = self._config.image_segmenter_model
        if not validate_model_path(model_path):
            raise FileNotFoundError(f"Image segmenter model not found: {model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = ImageSegmenterOptions(
            base_options=base_options,
            running_mode=RunningMode.IMAGE,
            output_confidence_masks=True,
            output_category_mask=False,
        )
        self._segmenter = MpImageSegmenter.create_from_options(options)
        logger.info("ImageSegmenter initialized")

    def segment(self, image: np.ndarray) -> Optional[SegmentationResult]:
        if self._segmenter is None:
            raise RuntimeError("ImageSegmenter not initialized. Call initialize() first.")

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        result = self._segmenter.segment(mp_image)
        return self._parse_result(result)

    def _parse_result(self, result: Any) -> Optional[SegmentationResult]:
        if not result.confidence_masks:
            return None

        masks = [mask.numpy_view() for mask in result.confidence_masks]

        category_mask: Optional[np.ndarray] = None
        if result.category_mask is not None:
            category_mask = result.category_mask.numpy_view()

        return SegmentationResult(
            confidence_masks=masks,
            category_mask=category_mask,
        )

    def close(self) -> None:
        if self._segmenter is not None:
            self._segmenter.close()
            self._segmenter = None
            logger.debug("ImageSegmenter closed")
